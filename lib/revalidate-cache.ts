/**
 * 缓存失效工具
 * 用于在数据更新后手动清除缓存
 */

"use server"

import { revalidateTag, revalidatePath, updateTag } from "next/cache"
import { CACHE_TAGS } from "./cache-helpers"

/**
 * 重新验证所有导航相关的缓存
 * 在更新分类、标签、页面类型或语言时调用
 * 使用 'max' profile 实现 stale-while-revalidate 策略
 */
export async function revalidateNavigation() {
  revalidateTag(CACHE_TAGS.CATEGORIES, "max")
  revalidateTag(CACHE_TAGS.TAGS, "max")
  revalidateTag(CACHE_TAGS.PAGE_TYPES, "max")
  revalidateTag(CACHE_TAGS.LANGUAGES, "max")

  // 重新验证所有页面
  revalidatePath("/[locale]", "layout")
}

/**
 * 重新验证特定类型的缓存
 * @param tag - 缓存标签
 */
export async function revalidateByTag(tag: keyof typeof CACHE_TAGS) {
  revalidateTag(CACHE_TAGS[tag], "max")
}

/**
 * 重新验证特定语言的分类缓存
 * @param locale - 语言代码（可选）
 */
export async function revalidateCategories(locale?: string) {
  revalidateTag(CACHE_TAGS.CATEGORIES, "max")
  if (locale) {
    revalidateTag(`categories-${locale}`, "max")
  }
}

/**
 * 重新验证特定语言的标签缓存
 * @param locale - 语言代码（可选）
 */
export async function revalidateTags(locale?: string) {
  revalidateTag(CACHE_TAGS.TAGS, "max")
  if (locale) {
    revalidateTag(`tags-${locale}`, "max")
  }
}

/**
 * 重新验证特定语言的页面类型缓存
 * @param locale - 语言代码（可选）
 */
export async function revalidatePageTypes(locale?: string) {
  revalidateTag(CACHE_TAGS.PAGE_TYPES, "max")
  if (locale) {
    revalidateTag(`page-types-${locale}`, "max")
  }
}

/**
 * 重新验证游戏相关缓存
 */
export async function revalidateGames() {
  revalidateTag(CACHE_TAGS.GAMES, "max")
  revalidateTag(CACHE_TAGS.FEATURED_GAMES, "max")

  // 重新验证首页和游戏相关页面
  revalidatePath("/[locale]", "page")
  revalidatePath("/[locale]/games", "page")
}

// ============================================================================
// updateTag API - 立即过期缓存（用于"读取自己的写入"场景）
// ============================================================================

/**
 * 立即过期所有导航相关的缓存
 * 用于管理后台创建/更新数据后立即显示给创建者
 *
 * 与 revalidateNavigation 的区别：
 * - updateTag: 立即过期，下次请求立即获取新数据
 * - revalidateTag: 使用 stale-while-revalidate，返回旧数据同时后台更新
 */
export async function updateNavigationCache() {
  updateTag(CACHE_TAGS.CATEGORIES)
  updateTag(CACHE_TAGS.TAGS)
  updateTag(CACHE_TAGS.PAGE_TYPES)
  updateTag(CACHE_TAGS.LANGUAGES)

  // 重新验证所有页面
  revalidatePath("/[locale]", "layout")
}

/**
 * 立即过期特定类型的缓存
 * @param tag - 缓存标签
 */
export async function updateCacheByTag(tag: keyof typeof CACHE_TAGS) {
  updateTag(CACHE_TAGS[tag])
}

/**
 * 立即过期特定语言的分类缓存
 * @param locale - 语言代码（可选）
 */
export async function updateCategoriesCache(locale?: string) {
  updateTag(CACHE_TAGS.CATEGORIES)
  if (locale) {
    updateTag(`categories-${locale}`)
  }
}

/**
 * 立即过期特定语言的标签缓存
 * @param locale - 语言代码（可选）
 */
export async function updateTagsCache(locale?: string) {
  updateTag(CACHE_TAGS.TAGS)
  if (locale) {
    updateTag(`tags-${locale}`)
  }
}

/**
 * 立即过期游戏相关缓存
 * 用于管理员创建新游戏后立即在前端显示
 */
export async function updateGamesCache() {
  updateTag(CACHE_TAGS.GAMES)
  updateTag(CACHE_TAGS.FEATURED_GAMES)

  // 重新验证首页和游戏相关页面
  revalidatePath("/[locale]", "page")
  revalidatePath("/[locale]/games", "page")
}
