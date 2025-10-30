"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 分类数据缓存层（统一数据源）
 * ============================================
 *
 * ⚠️ 这是唯一查询分类数据库的地方！
 * 一次性缓存所有分类的完整数据：基础字段 + 翻译 + 游戏计数
 *
 * 其他所有分类相关函数都从这个缓存派生数据，不再直接查询数据库
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
 * 内部缓存函数（前端展示用 - 只包含启用的分类）
 *
 * 注意：unstable_cache 会自动使用函数参数作为缓存键的一部分
 * keyParts 用于额外标识，帮助区分不同的缓存用途
 */
const getCachedCategoriesData = unstable_cache(
  async (locale: string) => fetchCategoriesFromDB(locale, false),
  ["categories-full-data"], // keyParts: locale 参数会自动添加到缓存键中
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
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
    revalidate: REVALIDATE_TIME.LONG, // 1小时（管理端更频繁更新）
    tags: [CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 获取所有分类的完整数据（缓存版本 - 前端展示用）
 *
 * 这是分类数据的唯一入口点！
 * 所有其他分类函数都应该调用这个函数来获取数据
 *
 * @param locale - 语言代码
 * @returns 完整的分类数据数组（只包含启用的）
 */
export async function getAllCategoriesFullData(locale: string) {
  // 直接返回缓存数据，不输出日志（避免误导）
  // 真正的数据库查询日志在 fetchCategoriesFromDB 中输出
  return getCachedCategoriesData(locale)
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
