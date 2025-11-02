"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 标签数据缓存层（分离策略）
 * ============================================
 *
 * ⚠️ 这是唯一查询标签数据库的地方！
 * 采用数据分离策略：
 * 1. 基础数据（名称、描述等）：长缓存 6小时
 * 2. 统计数据（游戏数量）：短缓存 30分钟
 * 3. 完整数据：内存合并基础+统计数据
 *
 * 缓存策略优势：
 * - 基础数据很少变化，长缓存减少数据库压力
 * - 统计数据经常更新，短缓存保证及时性
 * - 用户点赞/标签变更不会导致大量缓存失效
 */

/**
 * 内部数据库查询函数（不直接导出）
 *
 * @param locale - 语言代码
 * @param includeDisabled - 是否包含禁用的标签（管理端需要）
 */
async function fetchTagsFromDB(locale: string, includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchTagsFromDB - 执行数据库查询 locale: ${locale}, includeDisabled: ${includeDisabled}`)
  }

  const tags = await prisma.tag.findMany({
    where: includeDisabled ? {} : {
      isEnabled: true,
    },
    select: {
      id: true,
      slug: true,
      icon: true,
      isEnabled: true, // 管理端需要显示启用状态
      // 主表的英文字段作为回退
      name: true,
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          name: true,
          locale: true,
          metaTitle: true,
          metaDescription: true,
          keywords: true,
        },
      },
      _count: {
        select: { games: true },
      },
    },
  })

  // 返回纯数据对象,确保可以被正确序列化
  return tags.map((tag) => {
    // 使用翻译，如果没有翻译则使用主表的英文字段作为回退
    const name = getTranslatedField(tag.translations, locale, "name", tag.name)
    const gameCount = tag._count.games

    // SEO 字段（优先使用翻译）
    const metaTitle = getTranslatedField(tag.translations, locale, "metaTitle", null)
    const metaDescription = getTranslatedField(tag.translations, locale, "metaDescription", null)
    const keywords = getTranslatedField(tag.translations, locale, "keywords", null)

    return {
      id: String(tag.id),
      slug: String(tag.slug),
      icon: tag.icon ? String(tag.icon) : null,
      isEnabled: Boolean(tag.isEnabled), // 管理端需要显示启用状态
      name: String(name),
      gameCount: Number(gameCount),
      // SEO 字段
      metaTitle: metaTitle ? String(metaTitle) : null,
      metaDescription: metaDescription ? String(metaDescription) : null,
      keywords: keywords ? String(keywords) : null,
    }
  })
}

/**
 * 获取标签基础数据（不含游戏计数）
 * 用于长缓存策略
 */
async function fetchTagsBaseDataFromDB(locale: string, includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchTagsBaseDataFromDB - 查询基础数据 locale: ${locale}, includeDisabled: ${includeDisabled}`)
  }

  const tags = await prisma.tag.findMany({
    where: includeDisabled ? {} : { isEnabled: true },
    select: {
      id: true,
      slug: true,
      icon: true,
      isEnabled: true,
      name: true,
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          name: true,
          locale: true,
          metaTitle: true,
          metaDescription: true,
          keywords: true,
        },
      },
    },
  })

  return tags.map((tag) => {
    const name = getTranslatedField(tag.translations, locale, "name", tag.name)
    const metaTitle = getTranslatedField(tag.translations, locale, "metaTitle", null)
    const metaDescription = getTranslatedField(tag.translations, locale, "metaDescription", null)
    const keywords = getTranslatedField(tag.translations, locale, "keywords", null)

    return {
      id: String(tag.id),
      slug: String(tag.slug),
      icon: tag.icon ? String(tag.icon) : null,
      isEnabled: Boolean(tag.isEnabled),
      name: String(name),
      metaTitle: metaTitle ? String(metaTitle) : null,
      metaDescription: metaDescription ? String(metaDescription) : null,
      keywords: keywords ? String(keywords) : null,
    }
  })
}

/**
 * 获取标签统计数据（只含游戏计数）
 * 用于短缓存策略
 */
async function fetchTagsStatsFromDB(includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchTagsStatsFromDB - 查询统计数据 includeDisabled: ${includeDisabled}`)
  }

  const tags = await prisma.tag.findMany({
    where: includeDisabled ? {} : { isEnabled: true },
    select: {
      id: true,
      _count: {
        select: { games: true },
      },
    },
  })

  // 返回 ID → 游戏数量的映射
  const statsMap: Record<string, number> = {}
  tags.forEach((tag) => {
    statsMap[tag.id] = tag._count.games
  })

  return statsMap
}

/**
 * 内部缓存函数 - 基础数据（长缓存）
 */
const getCachedTagsBaseData = unstable_cache(
  async (locale: string) => fetchTagsBaseDataFromDB(locale, false),
  ["tags-base-data"],
  {
    revalidate: REVALIDATE_TIME.BASE_DATA, // 6小时
    tags: [CACHE_TAGS.TAGS],
  }
)

/**
 * 内部缓存函数 - 统计数据（短缓存）
 */
const getCachedTagsStats = unstable_cache(
  async () => fetchTagsStatsFromDB(false),
  ["tags-stats"],
  {
    revalidate: REVALIDATE_TIME.STATS_SHORT, // 30分钟
    tags: [CACHE_TAGS.TAGS],
  }
)

/**
 * 内部缓存函数（前端展示用 - 只包含启用的标签）
 *
 * ⚠️ 已废弃：保留用于向后兼容
 * 新代码应使用 getTagsBaseData + getTagsStats 组合
 */
const getCachedTagsData = unstable_cache(
  async (locale: string) => fetchTagsFromDB(locale, false),
  ["tags-full-data"], // keyParts: locale 参数会自动添加到缓存键中
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
    tags: [CACHE_TAGS.TAGS],
  }
)

/**
 * 内部缓存函数（管理端用 - 包含所有标签）
 */
const getCachedAllTagsData = unstable_cache(
  async (locale: string) => fetchTagsFromDB(locale, true),
  ["tags-all-data"], // 不同的缓存键
  {
    revalidate: REVALIDATE_TIME.LONG, // 1小时（管理端更频繁更新）
    tags: [CACHE_TAGS.TAGS],
  }
)

/**
 * 获取标签基础数据（不含统计）
 *
 * 用于需要基础信息的场景（名称、SEO等）
 * 长缓存策略：6小时
 *
 * @param locale - 语言代码
 * @returns 基础数据数组
 */
export async function getTagsBaseData(locale: string) {
  return getCachedTagsBaseData(locale)
}

/**
 * 获取标签统计数据（只含游戏计数）
 *
 * 用于需要实时统计的场景
 * 短缓存策略：30分钟
 *
 * @returns ID → 游戏数量的映射
 */
export async function getTagsStats() {
  return getCachedTagsStats()
}

/**
 * 获取所有标签的完整数据（缓存版本 - 前端展示用）
 *
 * ✅ 新实现：内存合并基础数据和统计数据
 * 这样可以利用分离的缓存策略，避免统计更新导致基础数据缓存失效
 *
 * @param locale - 语言代码
 * @returns 完整的标签数据数组（只包含启用的）
 */
export async function getAllTagsFullData(locale: string) {
  // 并行获取基础数据和统计数据
  const [baseData, statsMap] = await Promise.all([
    getTagsBaseData(locale),
    getTagsStats(),
  ])

  // 在内存中合并数据
  return baseData.map((tag) => ({
    ...tag,
    gameCount: statsMap[tag.id] || 0,
  }))
}

/**
 * 获取所有标签的完整数据（缓存版本 - 管理端用）
 *
 * 包含所有标签（启用和禁用的）
 *
 * @param locale - 语言代码
 * @returns 完整的标签数据数组（包含所有状态）
 */
export async function getAllTagsForAdmin(locale: string) {
  return getCachedAllTagsData(locale)
}
