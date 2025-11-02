"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 标签数据缓存层（统一数据源）
 * ============================================
 *
 * ⚠️ 这是唯一查询标签数据库的地方！
 * 一次性缓存所有标签的完整数据：基础字段 + 翻译 + 游戏计数
 *
 * 其他所有标签相关函数都从这个缓存派生数据，不再直接查询数据库
 *
 * 缓存策略：
 * - 时间：24小时重新验证
 * - 原因：数据相对静态，只在管理员操作时变化
 * - 机制：使用 unstable_cache 持久化缓存
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
 * 内部缓存函数（前端展示用 - 只包含启用的标签）
 *
 * 注意：unstable_cache 会自动使用函数参数作为缓存键的一部分
 * keyParts 用于额外标识，帮助区分不同的缓存用途
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
 * 获取所有标签的完整数据（缓存版本 - 前端展示用）
 *
 * 这是标签数据的唯一入口点！
 * 所有其他标签函数都应该调用这个函数来获取数据
 *
 * @param locale - 语言代码
 * @returns 完整的标签数据数组（只包含启用的）
 */
export async function getAllTagsFullData(locale: string) {
  return getCachedTagsData(locale)
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
