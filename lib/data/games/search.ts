"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoriesDataMap, getAllCategoryTranslationsMap } from "../categories"
import { getAllTagTranslationsMap } from "../tags"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 游戏搜索查询函数
 * ============================================
 */

/**
 * 搜索游戏（支持分页和排序）
 */
export async function searchGames(
  query: string,
  locale: string,
  page = 1,
  limit = 30,
  sort: 'popular' | 'newest' | 'name' = 'popular'
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🔍 searchGames - 开始搜索 query: ${query}, locale: ${locale}, page: ${page}, limit: ${limit}, sort: ${sort}`)
  }

  // 如果搜索词为空，返回空结果
  if (!query || query.trim().length === 0) {
    return {
      games: [],
      pagination: {
        currentPage: page,
        totalGames: 0,
        totalPages: 0,
        hasMore: false,
      },
      query: query.trim(),
    }
  }

  const searchTerm = query.trim()

  // 1. 先获取底层缓存数据
  const [categoriesDataMap, categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoriesDataMap(locale),
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存游戏查询部分
  const getCachedData = unstable_cache(
    async () => {
      const skip = (page - 1) * limit

      // 根据排序类型确定 orderBy 参数
      let orderBy: any = { playCount: "desc" } // 默认：最受欢迎
      if (sort === "newest") {
        orderBy = { createdAt: "desc" }
      } else if (sort === "name") {
        orderBy = { title: "asc" }
      }

      // 构建搜索条件
      const searchConditions = {
        status: 'PUBLISHED' as const,
        OR: [
          // 搜索英文标题
          { title: { contains: searchTerm, mode: 'insensitive' as const } },
          // 搜索英文描述
          { description: { contains: searchTerm, mode: 'insensitive' as const } },
          // 搜索翻译标题
          {
            translations: {
              some: {
                OR: [
                  { title: { contains: searchTerm, mode: 'insensitive' as const } },
                  { description: { contains: searchTerm, mode: 'insensitive' as const } },
                ],
              },
            },
          },
        ],
      }

      const [games, totalCount] = await Promise.all([
        prisma.game.findMany({
          where: searchConditions,
          skip,
          take: limit,
          select: {
            slug: true,
            thumbnail: true,
            title: true,
            description: true,
            gameCategories: {
              select: {
                categoryId: true,
                mainCategoryId: true,
              },
              where: {
                isPrimary: true,
              },
              orderBy: {
                sortOrder: 'asc',
              },
              take: 1,
            },
            translations: locale === 'en' ? false : {
              where: buildLocaleCondition(locale),
              select: { title: true, description: true, locale: true },
            },
            tags: {
              select: { tagId: true },
            },
          },
          orderBy,
        }),
        prisma.game.count({ where: searchConditions }),
      ])

      return {
        games: games.map((game) => {
          // 获取翻译
          const translations = game.translations || []
          const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
          const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

          // 获取子分类和主分类信息
          const subCategoryId = game.gameCategories[0]?.categoryId
          const mainCategoryId = game.gameCategories[0]?.mainCategoryId

          // 通过 ID 查找 slug
          const subCategoryInfo = subCategoryId ? Object.values(categoriesDataMap).find(cat => cat.id === subCategoryId) : undefined
          const mainCategoryInfo = mainCategoryId ? Object.values(categoriesDataMap).find(cat => cat.id === mainCategoryId) : undefined

          return {
            slug: game.slug,
            thumbnail: game.thumbnail,
            title: title,
            description: description || "",
            category: categoryTranslations[subCategoryId || ""] || "",
            categorySlug: subCategoryInfo?.slug,
            mainCategorySlug: mainCategoryInfo?.slug,
            tags: game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean),
          }
        }),
        pagination: {
          currentPage: page,
          totalGames: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
        query: searchTerm,
      }
    },
    ["search-games", searchTerm, locale, String(page), String(limit), sort],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}
