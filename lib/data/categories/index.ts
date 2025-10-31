"use server"

import { getAllCategoriesFullData } from "./cache"

// 重新导出缓存函数
export { getAllCategoriesFullData }

/**
 * ============================================
 * 分类业务函数层（从缓存派生）
 * ============================================
 *
 * 只使用 unstable_cache 实现持久化缓存，无需 React.cache()
 */

/**
 * 获取分类 ID → 名称的映射
 *
 * 用途：游戏列表中需要显示分类名称时使用（内存拼接）
 * 数据来源：从 getAllCategoriesFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllCategoryTranslationsMap("en")
 * const categoryName = map[game.categoryId] // "Action"
 */
export async function getAllCategoryTranslationsMap(locale: string) {
  // 从缓存派生数据，不执行数据库查询
  // 真正的数据库查询日志在 cache.ts 的 fetchCategoriesFromDB 中
  const fullData = await getAllCategoriesFullData(locale)
  const map: Record<string, string> = {}
  fullData.forEach((cat) => {
    map[cat.id] = cat.name
  })
  return map
}

/**
 * 获取分类 ID → {name, slug} 的映射
 *
 * 用途：游戏列表中需要显示分类名称和链接时使用
 * 数据来源：从 getAllCategoriesFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllCategoryInfoMap("en")
 * const categoryInfo = map[game.categoryId] // { name: "Action", slug: "action" }
 */
export async function getAllCategoryInfoMap(locale: string) {
  const fullData = await getAllCategoriesFullData(locale)
  const map: Record<string, { name: string; slug: string }> = {}
  fullData.forEach((cat) => {
    map[cat.id] = { name: cat.name, slug: cat.slug }
  })
  return map
}

/**
 * 获取分类 slug → 完整信息的映射
 *
 * 用途：分类页面需要显示分类详细信息时使用
 * 数据来源：从 getAllCategoriesFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllCategoriesDataMap("en")
 * const categoryInfo = map["action"] // { slug, name, description, icon, gameCount }
 */
export async function getAllCategoriesDataMap(locale: string) {
  // 从缓存派生数据，不执行数据库查询
  const fullData = await getAllCategoriesFullData(locale)
  const map: Record<string, {
    id: string
    slug: string
    name: string
    description: string
    icon: string | null
    gameCount: number
    parentId: string | null
  }> = {}

  fullData.forEach((cat) => {
    map[cat.slug] = {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      gameCount: cat.gameCount,
      parentId: cat.parentId,
    }
  })

  return map
}

/**
 * 获取所有分类列表（简化版）
 *
 * 用途：导航菜单、分类选择器等
 * 数据来源：从 getAllCategoriesFullData 派生，不查询数据库
 *
 * @example
 * const categories = await getAllCategories("en")
 * // [{ slug: "action", name: "Action", icon: "🎮", gameCount: 42 }, ...]
 */
export async function getAllCategories(locale: string) {
  const fullData = await getAllCategoriesFullData(locale)
  return fullData.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    icon: cat.icon,
    gameCount: cat.gameCount,
  }))
}

/**
 * 获取所有主分类（parentId === null）
 *
 * 用途：侧边栏显示主分类、主分类导航等
 * 数据来源：从 getAllCategoriesFullData 派生并过滤，不查询数据库
 *
 * @example
 * const mainCategories = await getMainCategories("en")
 * // [{ slug: "action-games", name: "Action Games", icon: "🎮", gameCount: 42 }, ...]
 */
export async function getMainCategories(locale: string) {
  // 从缓存派生数据，不执行数据库查询
  const fullData = await getAllCategoriesFullData(locale)

  // 只返回主分类（parentId === null）
  return fullData
    .filter((cat) => cat.parentId === null)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      gameCount: cat.gameCount,
    }))
}

/**
 * 获取所有子分类（parentId !== null）
 *
 * 用途：子分类管理、子分类列表等
 * 数据来源：从 getAllCategoriesFullData 派生并过滤，不查询数据库
 *
 * @example
 * const subCategories = await getSubCategories("en")
 * // [{ slug: "ninja", name: "Ninja", icon: "🥷", gameCount: 10, parentId: "xyz" }, ...]
 */
export async function getSubCategories(locale: string) {
  // 从缓存派生数据，不执行数据库查询
  const fullData = await getAllCategoriesFullData(locale)

  // 只返回子分类（parentId !== null）
  return fullData
    .filter((cat) => cat.parentId !== null)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      gameCount: cat.gameCount,
      parentId: cat.parentId,
    }))
}

/**
 * 根据父分类 ID 获取其下的所有子分类
 *
 * 用途：在主分类页面显示其子分类列表
 * 数据来源：从 getAllCategoriesFullData 派生并过滤，不查询数据库
 *
 * @example
 * const actionSubCategories = await getSubCategoriesByParentId("action-games-id", "en")
 * // [{ slug: "ninja", name: "Ninja", icon: "🥷", gameCount: 10 }, ...]
 */
export async function getSubCategoriesByParentId(parentId: string, locale: string) {
  // 从缓存派生数据，不执行数据库查询
  const fullData = await getAllCategoriesFullData(locale)

  // 只返回指定父分类下的子分类
  return fullData
    .filter((cat) => cat.parentId === parentId)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      gameCount: cat.gameCount,
    }))
}

/**
 * 根据父分类 slug 获取其下的所有子分类
 *
 * 用途：在主分类页面显示其子分类列表（使用 slug 而非 ID）
 * 数据来源：从 getAllCategoriesFullData 派生并过滤，不查询数据库
 *
 * @example
 * const actionSubCategories = await getSubCategoriesByParentSlug("action-games", "en")
 * // [{ slug: "ninja", name: "Ninja", icon: "🥷", gameCount: 10 }, ...]
 */
export async function getSubCategoriesByParentSlug(parentSlug: string, locale: string) {
  // 从缓存派生数据，不执行数据库查询
  const fullData = await getAllCategoriesFullData(locale)

  // 先找到父分类
  const parentCategory = fullData.find((cat) => cat.slug === parentSlug && cat.parentId === null)

  if (!parentCategory) {
    return []
  }

  // 返回该父分类下的所有子分类
  return fullData
    .filter((cat) => cat.parentId === parentCategory.id)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      gameCount: cat.gameCount,
    }))
}
