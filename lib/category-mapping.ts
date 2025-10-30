/**
 * GamePix 分类到本地分类的映射工具
 * 用于自动匹配导入游戏的分类
 *
 * 策略：从缓存获取所有分类，通过名称模糊匹配（支持英文和中文）
 * 🔥 优化：使用缓存层，避免重复查询数据库
 */

import { getAllCategoriesForAdmin } from '@/lib/data/categories/cache'

/**
 * 根据 GamePix 分类名称查找本地分类（只匹配子分类）
 *
 * @param gamePixCategory - GamePix 分类名称（如 "action", "puzzle", "kids"）
 * @returns 本地分类信息（包含 categoryId 和 mainCategoryId），如果未找到返回 null
 */
export async function findLocalCategoryByGamePixCategory(
  gamePixCategory: string
): Promise<{
  categoryId: string
  mainCategoryId: string
  categoryName: string
  isMainCategory: boolean
} | null> {
  try {
    // 1. 规范化分类名称（小写、去除空格和连字符）
    const normalized = gamePixCategory.toLowerCase().trim()
    const normalizedSlug = normalized.replace(/\s+/g, '-')

    // 2. 从缓存获取所有分类数据
    const allCategories = await getAllCategoriesForAdmin('zh')

    // 3. 在内存中进行模糊匹配（只匹配子分类）
    const subCategories = allCategories.filter(cat => cat.parentId !== null && cat.isEnabled)

    // 4. 查找匹配的分类
    const matchedCategory = subCategories.find(cat => {
      const nameMatch = cat.name.toLowerCase().includes(normalized)
      const slugMatch = cat.slug.toLowerCase().includes(normalizedSlug)
      return nameMatch || slugMatch
    })

    if (!matchedCategory) {
      console.warn(`未找到 GamePix 分类 "${gamePixCategory}" 的本地子分类匹配`)
      return null
    }

    // 5. 确定主分类 ID（子分类一定有 parentId）
    const mainCategoryId = matchedCategory.parentId!
    const isMainCategory = false

    console.log(`✓ 匹配成功: GamePix "${gamePixCategory}" → 本地子分类 "${matchedCategory.name}" (${matchedCategory.slug}) [主分类ID: ${mainCategoryId}]`)

    return {
      categoryId: matchedCategory.id,
      mainCategoryId,
      categoryName: matchedCategory.name,
      isMainCategory,
    }
  } catch (error) {
    console.error('查找本地分类失败:', error)
    return null
  }
}

/**
 * 批量查找多个 GamePix 分类对应的本地分类
 *
 * @param gamePixCategories - GamePix 分类名称数组
 * @returns 本地分类信息数组（过滤掉未找到的分类）
 */
export async function findLocalCategoriesByGamePixCategories(
  gamePixCategories: string[]
): Promise<Array<{
  categoryId: string
  mainCategoryId: string
  categoryName: string
  isMainCategory: boolean
}>> {
  const results = await Promise.all(
    gamePixCategories.map(category => findLocalCategoryByGamePixCategory(category))
  )

  // 过滤掉 null 值
  return results.filter((result): result is NonNullable<typeof result> => result !== null)
}

/**
 * 获取所有本地分类列表（用于显示）
 * 🔥 优化：使用缓存层
 *
 * @returns 本地分类列表
 */
export async function getAllLocalCategories() {
  try {
    const allCategories = await getAllCategoriesForAdmin('zh')

    // 过滤启用的分类并按规则排序
    return allCategories
      .filter(cat => cat.isEnabled)
      .sort((a, b) => {
        // 主分类优先（parentId 为 null）
        if ((a.parentId === null) !== (b.parentId === null)) {
          return a.parentId === null ? -1 : 1
        }
        // 按 sortOrder 排序
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder
        }
        // 按名称排序
        return a.name.localeCompare(b.name)
      })
      .map(cat => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        parentId: cat.parentId,
      }))
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return []
  }
}

/**
 * 获取分类统计信息
 * 🔥 优化：使用缓存层并在内存中统计
 *
 * @returns 分类统计
 */
export async function getCategoryStats() {
  try {
    const allCategories = await getAllCategoriesForAdmin('zh')
    const enabledCategories = allCategories.filter(cat => cat.isEnabled)

    const total = enabledCategories.length
    const mainCategories = enabledCategories.filter(cat => cat.parentId === null).length
    const subCategories = enabledCategories.filter(cat => cat.parentId !== null).length

    return {
      total,
      mainCategories,
      subCategories,
    }
  } catch (error) {
    console.error('获取分类统计失败:', error)
    return null
  }
}
