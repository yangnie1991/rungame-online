/**
 * 分类辅助函数
 * 用于处理主分类+子分类架构的查询逻辑
 */

import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

/**
 * 获取分类及其所有子分类的ID列表
 * @param categoryId 主分类ID
 * @returns 包含主分类和所有子分类的ID数组
 */
export async function getCategoryWithSubIds(categoryId: string): Promise<string[]> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      subCategories: {
        where: { isEnabled: true },
        select: { id: true }
      }
    }
  })

  if (!category) return []

  return [
    category.id,
    ...category.subCategories.map(sub => sub.id)
  ]
}

/**
 * 根据分类slug获取所有相关的分类ID
 * @param slug 分类slug
 * @returns 主分类ID和所有相关ID（包括子分类）
 */
export async function getCategoryIdsBySlug(slug: string): Promise<{
  mainId: string
  allIds: string[]
  isMainCategory: boolean
}> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      subCategories: {
        where: { isEnabled: true },
        select: { id: true }
      }
    }
  })

  if (!category) {
    throw new Error(`Category not found: ${slug}`)
  }

  // 判断是主分类还是子分类
  if (category.parentId) {
    // 这是子分类，返回自己的ID
    return {
      mainId: category.parentId,
      allIds: [category.id],
      isMainCategory: false
    }
  } else {
    // 这是主分类，返回自己和所有子分类的ID
    const allIds = [category.id, ...category.subCategories.map(s => s.id)]
    return {
      mainId: category.id,
      allIds,
      isMainCategory: true
    }
  }
}

/**
 * 获取游戏的主分类
 * @param gameId 游戏ID
 * @returns 主分类对象（如果游戏分类是子分类，返回其父分类）
 */
export async function getGameMainCategory(gameId: string): Promise<Category | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      category: {
        include: {
          parent: true
        }
      }
    }
  })

  if (!game) return null

  // 如果游戏分类有父分类，返回父分类；否则返回当前分类（说明已经是主分类）
  return game.category.parent || game.category
}

/**
 * 获取游戏的子分类（如果有）
 * @param gameId 游戏ID
 * @returns 子分类对象，如果游戏直接属于主分类则返回null
 */
export async function getGameSubCategory(gameId: string): Promise<Category | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      category: {
        include: {
          parent: true
        }
      }
    }
  })

  if (!game) return null

  // 如果有父分类，说明当前分类是子分类
  return game.category.parentId ? game.category : null
}

/**
 * 获取所有主分类（用于导航）
 * @param locale 语言代码
 * @returns 主分类列表，包含翻译和子分类
 */
export async function getMainCategories(locale: string) {
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
      isEnabled: true
    },
    include: {
      translations: {
        where: { locale }
      },
      subCategories: {
        where: { isEnabled: true },
        include: {
          translations: {
            where: { locale }
          },
          _count: {
            select: { games: true }
          }
        },
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { games: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.translations[0]?.name || cat.name,
    description: cat.translations[0]?.description || cat.description,
    icon: cat.icon,
    gameCount: cat._count.games,
    subCategories: cat.subCategories.map(sub => ({
      id: sub.id,
      slug: sub.slug,
      name: sub.translations[0]?.name || sub.name,
      gameCount: sub._count.games
    }))
  }))
}

/**
 * 验证子分类是否属于指定的主分类
 * @param mainCategorySlug 主分类slug
 * @param subCategorySlug 子分类slug
 * @returns 如果关系正确返回true，否则返回false
 */
export async function validateCategoryRelation(
  mainCategorySlug: string,
  subCategorySlug: string
): Promise<boolean> {
  const subCategory = await prisma.category.findUnique({
    where: { slug: subCategorySlug },
    include: {
      parent: true
    }
  })

  if (!subCategory || !subCategory.parent) {
    return false
  }

  return subCategory.parent.slug === mainCategorySlug
}

/**
 * 统计每个主分类的游戏数量（包括子分类）
 * @returns 主分类ID到游戏数量的映射
 */
export async function getMainCategoriesGameCount(): Promise<Record<string, number>> {
  const mainCategories = await prisma.category.findMany({
    where: { parentId: null, isEnabled: true },
    include: {
      subCategories: {
        where: { isEnabled: true },
        select: { id: true }
      }
    }
  })

  const result: Record<string, number> = {}

  for (const mainCat of mainCategories) {
    const allCategoryIds = [mainCat.id, ...mainCat.subCategories.map(s => s.id)]

    const count = await prisma.game.count({
      where: {
        categoryId: { in: allCategoryIds },
        status: 'PUBLISHED'
      }
    })

    result[mainCat.id] = count
  }

  return result
}

/**
 * 获取分类的完整路径（面包屑）
 * @param categorySlug 分类slug
 * @param locale 语言代码
 * @returns 分类路径数组 [{slug, name}, ...]
 */
export async function getCategoryBreadcrumb(
  categorySlug: string,
  locale: string
): Promise<Array<{ slug: string; name: string }>> {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      translations: {
        where: { locale }
      },
      parent: {
        include: {
          translations: {
            where: { locale }
          }
        }
      }
    }
  })

  if (!category) return []

  const breadcrumb: Array<{ slug: string; name: string }> = []

  // 如果有父分类，先添加父分类
  if (category.parent) {
    breadcrumb.push({
      slug: category.parent.slug,
      name: category.parent.translations[0]?.name || category.parent.name
    })
  }

  // 添加当前分类
  breadcrumb.push({
    slug: category.slug,
    name: category.translations[0]?.name || category.name
  })

  return breadcrumb
}
