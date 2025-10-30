"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoryTranslationsMap } from "../categories"
import { getAllTagTranslationsMap } from "../tags"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 页面类型游戏列表查询函数
 * ============================================
 *
 * 提供基于页面类型配置的游戏列表查询
 * 每个函数内部直接实现缓存，避免多层缓存嵌套
 */

/**
 * 根据页面类型slug获取页面配置和游戏
 *
 * @example
 * const result = await getPageTypeGames("most-played", "en", 1, 24)
 * // { pageType: {...}, games: [...], pagination: {...} }
 */
export async function getPageTypeGames(
  pageTypeSlug: string,
  locale: string,
  page = 1,
  limit = 24
) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Query] 📄 getPageTypeGames - 开始查询 pageTypeSlug: ${pageTypeSlug}, locale: ${locale}, page: ${page}, limit: ${limit}`
    )
  }

  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：一次性查询并组装完整数据
  const getCachedData = unstable_cache(
    async () => {
      const skip = (page - 1) * limit

      // 直接查询 PageType 数据
      const pageType = await prisma.pageType.findUnique({
        where: { slug: pageTypeSlug, isEnabled: true },
        select: {
          slug: true,
          type: true,
          icon: true,
          // 主表的英文字段作为回退
          title: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          pageInfo: true,
          translations: {
            where: buildLocaleCondition(locale),
            select: {
              title: true,
              description: true,
              metaTitle: true,
              metaDescription: true,
              locale: true,
            },
          },
        },
      })

      // 只处理 GAME_LIST 类型的页面
      if (!pageType || pageType.type !== "GAME_LIST") return null

      // 从 pageInfo.gameList 中读取筛选和排序配置
      const pageInfo = (pageType.pageInfo as any) || {}
      const gameListConfig = pageInfo.gameList || {}
      const configFilters = gameListConfig.filters || {}
      const configOrderBy = gameListConfig.orderBy || "playCount"
      const configOrderDirection = gameListConfig.orderDirection || "desc"

      // 获取游戏数据和总数
      const [games, totalCount] = await Promise.all([
        prisma.game.findMany({
          where: {
            status: "PUBLISHED",
            ...configFilters,
          },
          skip,
          take: limit,
          include: {
            translations: {
              where: buildLocaleCondition(locale),
              select: { title: true, description: true, locale: true },
            },
            tags: {
              select: { tagId: true },
            },
          },
          orderBy: { [configOrderBy]: configOrderDirection },
        }),
        prisma.game.count({
          where: {
            status: "PUBLISHED",
            ...configFilters,
          },
        }),
      ])

      // 组装并返回结果
      return {
        pageType: {
          slug: pageType.slug,
          type: pageType.type,
          icon: pageType.icon,
          title: getTranslatedField(pageType.translations, locale, "title", pageType.title),
          description: getTranslatedField(pageType.translations, locale, "description", pageType.description || ""),
          metaTitle: getTranslatedField(pageType.translations, locale, "metaTitle", pageType.metaTitle || ""),
          metaDescription: getTranslatedField(
            pageType.translations,
            locale,
            "metaDescription",
            pageType.metaDescription || ""
          ),
        },
        games: games.map((game) => ({
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: getTranslatedField(game.translations, locale, "title", "Untitled"),
          description: getTranslatedField(game.translations, locale, "description", ""),
          category: categoryTranslations[game.categoryId] || "",
          tags: game.tags.map((t: any) => tagTranslations[t.tagId] || "").filter(Boolean),
        })),
        pagination: {
          currentPage: page,
          totalGames: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      }
    },
    ["page-type-games", pageTypeSlug, locale, String(page), String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.PAGE_TYPES, CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}
