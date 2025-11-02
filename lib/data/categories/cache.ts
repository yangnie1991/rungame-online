"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 分类数据缓存层（分离策略）
 * ============================================
 *
 * ⚠️ 这是唯一查询分类数据库的地方！
 * 采用数据分离策略：
 * 1. 基础数据（名称、描述等）：长缓存 6小时
 * 2. 统计数据（游戏数量）：短缓存 30分钟
 * 3. 完整数据：内存合并基础+统计数据
 *
 * 缓存策略优势：
 * - 基础数据很少变化，长缓存减少数据库压力
 * - 统计数据经常更新，短缓存保证及时性
 * - 用户点赞/分类变更不会导致大量缓存失效
 */

/**
 * 内部数据库查询函数（不直接导出）
 *
 * @param locale - 语言代码
 * @param includeDisabled - 是否包含禁用的分类（管理端需要）
 */
async function fetchCategoriesFromDB(locale: string, includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchCategoriesFromDB - 执行数据库查询 locale: ${locale}, includeDisabled: ${includeDisabled}`)
  }

  const categories = await prisma.category.findMany({
    where: includeDisabled ? {} : {
      isEnabled: true,
    },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
      },
      // 子分类的游戏数（直接关联）
      gameSubCategories: {
        where: {
          game: { status: "PUBLISHED" }
        },
        select: {
          gameId: true
        }
      },
      // 主分类的游戏数（通过 mainCategoryId 关联）
      gameMainCategories: {
        where: {
          game: { status: "PUBLISHED" }
        },
        select: {
          gameId: true
        }
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  // 返回纯数据对象,确保可以被正确序列化
  return categories.map((cat) => {
    // 使用翻译，如果没有翻译则使用主表的英文字段作为回退
    const name = getTranslatedField(cat.translations, locale, "name", cat.name)
    const description = getTranslatedField(cat.translations, locale, "description", cat.description || "")

    // SEO 字段（优先使用翻译，回退到主表）
    const metaTitle = getTranslatedField(cat.translations, locale, "metaTitle", cat.metaTitle || null)
    const metaDescription = getTranslatedField(cat.translations, locale, "metaDescription", cat.metaDescription || null)
    const keywords = getTranslatedField(cat.translations, locale, "keywords", cat.keywords || null)

    // 根据是否为主分类，统计不同的游戏数
    // 主分类（parentId === null）：统计 gameMainCategories
    // 子分类（parentId !== null）：统计 gameSubCategories
    const gameCount = cat.parentId === null
      ? cat.gameMainCategories.length
      : cat.gameSubCategories.length

    return {
      id: String(cat.id),
      slug: String(cat.slug),
      icon: cat.icon ? String(cat.icon) : null,
      sortOrder: Number(cat.sortOrder),
      parentId: cat.parentId ? String(cat.parentId) : null,  // 添加 parentId 用于区分主分类和子分类
      isEnabled: Boolean(cat.isEnabled), // 管理端需要显示启用状态
      name: String(name),
      description: String(description),
      gameCount: Number(gameCount),
      // SEO 字段
      metaTitle: metaTitle ? String(metaTitle) : null,
      metaDescription: metaDescription ? String(metaDescription) : null,
      keywords: keywords ? String(keywords) : null,
    }
  })
}

/**
 * 获取分类基础数据（不含游戏计数）
 * 用于长缓存策略
 */
async function fetchCategoriesBaseDataFromDB(locale: string, includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchCategoriesBaseDataFromDB - 查询基础数据 locale: ${locale}, includeDisabled: ${includeDisabled}`)
  }

  const categories = await prisma.category.findMany({
    where: includeDisabled ? {} : { isEnabled: true },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return categories.map((cat) => {
    const name = getTranslatedField(cat.translations, locale, "name", cat.name)
    const description = getTranslatedField(cat.translations, locale, "description", cat.description || "")
    const metaTitle = getTranslatedField(cat.translations, locale, "metaTitle", cat.metaTitle || null)
    const metaDescription = getTranslatedField(cat.translations, locale, "metaDescription", cat.metaDescription || null)
    const keywords = getTranslatedField(cat.translations, locale, "keywords", cat.keywords || null)

    return {
      id: String(cat.id),
      slug: String(cat.slug),
      icon: cat.icon ? String(cat.icon) : null,
      sortOrder: Number(cat.sortOrder),
      parentId: cat.parentId ? String(cat.parentId) : null,
      isEnabled: Boolean(cat.isEnabled),
      name: String(name),
      description: String(description),
      metaTitle: metaTitle ? String(metaTitle) : null,
      metaDescription: metaDescription ? String(metaDescription) : null,
      keywords: keywords ? String(keywords) : null,
    }
  })
}

/**
 * 获取分类统计数据（只含游戏计数）
 * 用于短缓存策略
 */
async function fetchCategoriesStatsFromDB(includeDisabled = false) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchCategoriesStatsFromDB - 查询统计数据 includeDisabled: ${includeDisabled}`)
  }

  const categories = await prisma.category.findMany({
    where: includeDisabled ? {} : { isEnabled: true },
    select: {
      id: true,
      parentId: true,
      gameSubCategories: {
        where: { game: { status: "PUBLISHED" } },
        select: { gameId: true }
      },
      gameMainCategories: {
        where: { game: { status: "PUBLISHED" } },
        select: { gameId: true }
      },
    },
  })

  // 返回 ID → 游戏数量的映射
  const statsMap: Record<string, number> = {}
  categories.forEach((cat) => {
    const gameCount = cat.parentId === null
      ? cat.gameMainCategories.length
      : cat.gameSubCategories.length
    statsMap[cat.id] = gameCount
  })

  return statsMap
}

/**
 * 内部缓存函数 - 基础数据（长缓存）
 */
const getCachedCategoriesBaseData = unstable_cache(
  async (locale: string) => fetchCategoriesBaseDataFromDB(locale, false),
  ["categories-base-data"],
  {
    revalidate: REVALIDATE_TIME.BASE_DATA, // 6小时
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 内部缓存函数 - 统计数据（短缓存）
 */
const getCachedCategoriesStats = unstable_cache(
  async () => fetchCategoriesStatsFromDB(false),
  ["categories-stats"],
  {
    revalidate: REVALIDATE_TIME.STATS_SHORT, // 30分钟
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 内部缓存函数（前端展示用 - 只包含启用的分类）
 *
 * ⚠️ 已废弃：保留用于向后兼容
 * 新代码应使用 getCategoriesBaseData + getCategoriesStats 组合
 */
const getCachedCategoriesData = unstable_cache(
  async (locale: string) => fetchCategoriesFromDB(locale, false),
  ["categories-full-data"], // keyParts: locale 参数会自动添加到缓存键中
  {
    revalidate: REVALIDATE_TIME.MEDIUM, // 5分钟 - 包含游戏计数，需要相对及时更新
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 内部缓存函数（管理端用 - 包含所有分类）
 */
const getCachedAllCategoriesData = unstable_cache(
  async (locale: string) => fetchCategoriesFromDB(locale, true),
  ["categories-all-data"], // 不同的缓存键
  {
    revalidate: REVALIDATE_TIME.MEDIUM, // 5分钟 - 管理端也使用相同的缓存时间
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 获取分类基础数据（不含统计）
 *
 * 用于需要基础信息的场景（名称、描述、SEO等）
 * 长缓存策略：6小时
 *
 * @param locale - 语言代码
 * @returns 基础数据数组
 */
export async function getCategoriesBaseData(locale: string) {
  return getCachedCategoriesBaseData(locale)
}

/**
 * 获取分类统计数据（只含游戏计数）
 *
 * 用于需要实时统计的场景
 * 短缓存策略：30分钟
 *
 * @returns ID → 游戏数量的映射
 */
export async function getCategoriesStats() {
  return getCachedCategoriesStats()
}

/**
 * 获取子分类总数
 *
 * 用于侧边栏显示"所有分类"的统计
 * 从已缓存的基础数据派生，无需单独查询数据库
 *
 * @param locale - 语言代码
 * @returns 子分类总数
 */
export async function getSubCategoriesCount(locale: string) {
  const baseData = await getCategoriesBaseData(locale)
  return baseData.filter(cat => cat.parentId !== null).length
}

/**
 * 获取所有分类的完整数据（缓存版本 - 前端展示用）
 *
 * ✅ 新实现：内存合并基础数据和统计数据
 * 这样可以利用分离的缓存策略，避免统计更新导致基础数据缓存失效
 *
 * @param locale - 语言代码
 * @returns 完整的分类数据数组（只包含启用的）
 */
export async function getAllCategoriesFullData(locale: string) {
  // 并行获取基础数据和统计数据
  const [baseData, statsMap] = await Promise.all([
    getCategoriesBaseData(locale),
    getCategoriesStats(),
  ])

  // 在内存中合并数据
  return baseData.map((cat) => ({
    ...cat,
    gameCount: statsMap[cat.id] || 0,
  }))
}

/**
 * 获取所有分类的完整数据（缓存版本 - 管理端用）
 *
 * 包含所有分类（启用和禁用的）
 *
 * @param locale - 语言代码
 * @returns 完整的分类数据数组（包含所有状态）
 */
export async function getAllCategoriesForAdmin(locale: string) {
  return getCachedAllCategoriesData(locale)
}
