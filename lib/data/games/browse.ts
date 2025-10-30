"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoryTranslationsMap, getAllCategoriesDataMap } from "../categories"
import { getAllTagTranslationsMap } from "../tags"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 浏览游戏查询函数
 * ============================================
 * 包含按分类、标签浏览游戏，以及所有游戏列表
 */

/**
 * 获取分类下的游戏
 */
export async function getGamesByCategory(categorySlug: string, locale: string, page = 1, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getGamesByCategory - 开始查询 categorySlug: ${categorySlug}, locale: ${locale}, page: ${page}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoriesDataMap, categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoriesDataMap(locale),
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 检查分类是否存在
  const categoryInfo = categoriesDataMap[categorySlug]
  if (!categoryInfo) {
    return null
  }

  // 2. 定义缓存函数：只缓存游戏查询部分
  const getCachedData = unstable_cache(
    async () => {
      const skip = (page - 1) * limit

      // 通过 gameCategories 关系查询游戏
      const games = await prisma.game.findMany({
        where: {
          status: 'PUBLISHED',
          gameCategories: {
            some: {
              mainCategoryId: categoryInfo.id,
            },
          },
        },
        skip,
        take: limit,
        select: {
          slug: true,
          thumbnail: true,
          title: true,
          description: true,
          gameCategories: {
            select: {
              mainCategoryId: true,
            },
            take: 1,
          },
          translations: locale === 'en' ? false : {
            where: buildLocaleCondition(locale),
            select: {
              title: true,
              description: true,
              locale: true,
            },
          },
          tags: {
            select: { tagId: true },
          },
        },
        orderBy: { playCount: "desc" },
      })

      // 组装并返回结果（使用缓存的分类信息）
      return {
        category: categoryInfo,
        games: games.map((game) => {
          // 获取翻译
          const translations = game.translations || []
          const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
          const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

          return {
            slug: game.slug,
            thumbnail: game.thumbnail,
            title: title,
            description: description || "",
            category: categoryTranslations[game.gameCategories[0]?.mainCategoryId || ""] || "",
            tags: game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean),
          }
        }),
        pagination: {
          currentPage: page,
          totalGames: categoryInfo.gameCount,
          totalPages: Math.ceil(categoryInfo.gameCount / limit),
          hasMore: page * limit < categoryInfo.gameCount,
        },
      }
    },
    ["games-by-category", categorySlug, locale, String(page), String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES, CACHE_TAGS.CATEGORIES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取标签下的游戏
 */
export async function getGamesByTag(tagSlug: string, locale: string) {
  // 1. 先获取底层缓存数据
  const tagTranslations = await getAllTagTranslationsMap(locale)

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询标签及其游戏数据
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug },
        include: {
          games: {
            where: {
              game: { status: 'PUBLISHED' },
            },
            include: {
              game: {
                select: {
                  id: true,
                  slug: true,
                  thumbnail: true,
                  title: true,
                  description: true,
                  playCount: true,
                  rating: true,
                  translations: locale === 'en' ? false : {
                    where: buildLocaleCondition(locale),
                    select: {
                      title: true,
                      description: true,
                      locale: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!tag) {
        return null
      }

      const tagName = tagTranslations[tag.id]
      if (!tagName) {
        return null
      }

      // 组装并返回结果
      return {
        slug: tag.slug,
        name: tagName,
        icon: tag.icon,
        games: tag.games
          .map((gt) => gt.game)
          .map((game) => {
            // 获取翻译
            const translations = game.translations || []
            const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
            const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

            return {
              id: game.id,
              slug: game.slug,
              thumbnail: game.thumbnail,
              title: title,
              description: description || "",
              playCount: game.playCount,
              rating: game.rating,
            }
          }),
      }
    },
    ["games-by-tag", tagSlug, locale],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES, CACHE_TAGS.TAGS],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 根据标签获取游戏（用于首页section）
 */
export async function getGamesByTagSlug(tagSlug: string, locale: string, limit = 24) {
  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询标签及其游戏数据
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug },
        include: {
          games: {
            where: {
              game: { status: 'PUBLISHED' },
            },
            take: limit,
            include: {
              game: {
                select: {
                  slug: true,
                  thumbnail: true,
                  title: true,
                  description: true,
                  gameCategories: {
            select: {
              mainCategoryId: true,
            },
            take: 1,
          },
                  translations: locale === 'en' ? false : {
                    where: buildLocaleCondition(locale),
                    select: {
                      title: true,
                      description: true,
                      locale: true,
                    },
                  },
                  tags: {
                    select: { tagId: true },
                  },
                },
              },
            },
            orderBy: {
              game: { playCount: "desc" },
            },
          },
        },
      })

      if (!tag) return []

      // 组装并返回结果
      return tag.games.map((gt) => {
        // 获取翻译
        const translations = gt.game.translations || []
        const title = locale === 'en' ? gt.game.title : (translations.find(t => t.locale === locale)?.title || gt.game.title)
        const description = locale === 'en' ? gt.game.description : (translations.find(t => t.locale === locale)?.description || gt.game.description)

        return {
          slug: gt.game.slug,
          thumbnail: gt.game.thumbnail,
          title: title,
          description: description || "",
          category: categoryTranslations[gt.game.categoryId] || "",
          tags: gt.game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean),
        }
      })
    },
    ["games-by-tag-slug", tagSlug, locale, String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES, CACHE_TAGS.TAGS],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取标签下的游戏（带分页）
 */
export async function getGamesByTagWithPagination(tagSlug: string, locale: string, page = 1, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getGamesByTagWithPagination - 开始查询 tagSlug: ${tagSlug}, locale: ${locale}, page: ${page}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      const skip = (page - 1) * limit

      // 查询标签及其游戏数据
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug },
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
          games: {
            where: {
              game: { status: 'PUBLISHED' },
            },
            skip,
            take: limit,
            include: {
              game: {
                select: {
                  slug: true,
                  thumbnail: true,
                  title: true,
                  description: true,
                  gameCategories: {
            select: {
              mainCategoryId: true,
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
              },
            },
            orderBy: {
              game: { playCount: "desc" },
            },
          },
          _count: {
            select: { games: { where: { game: { status: 'PUBLISHED' } } } },
          },
        },
      })

      if (!tag) return null

      // 组装并返回结果
      return {
        tag: {
          slug: tag.slug,
          name: tagTranslations[tag.id] || tag.slug,
        },
        games: tag.games.map((gt) => {
          // 获取翻译
          const translations = gt.game.translations || []
          const title = locale === 'en' ? gt.game.title : (translations.find(t => t.locale === locale)?.title || gt.game.title)
          const description = locale === 'en' ? gt.game.description : (translations.find(t => t.locale === locale)?.description || gt.game.description)

          return {
            slug: gt.game.slug,
            thumbnail: gt.game.thumbnail,
            title: title,
            description: description || "",
            category: categoryTranslations[gt.game.gameCategories[0]?.mainCategoryId || ""] || "",
            tags: gt.game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean),
          }
        }),
        pagination: {
          currentPage: page,
          totalGames: tag._count.games,
          totalPages: Math.ceil(tag._count.games / limit),
          hasMore: page * limit < tag._count.games,
        },
      }
    },
    ["games-by-tag-pagination", tagSlug, locale, String(page), String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES, CACHE_TAGS.TAGS],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取所有游戏列表（支持分页）
 */
export async function getAllGames(locale: string, page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const [categoryTranslations, tagTranslations, games, totalCount] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
    prisma.game.findMany({
      where: { status: 'PUBLISHED' },
      skip,
      take: limit,
      select: {
        slug: true,
        thumbnail: true,
        title: true,
        description: true,
        gameCategories: {
          select: {
            mainCategoryId: true,
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
      orderBy: { playCount: "desc" },
    }),
    prisma.game.count({ where: { status: 'PUBLISHED' } }),
  ])

  return {
    games: games.map((game) => {
      // 获取翻译
      const translations = game.translations || []
      const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
      const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

      return {
        slug: game.slug,
        thumbnail: game.thumbnail,
        title: title,
        description: description || "",
        category: categoryTranslations[game.gameCategories[0]?.mainCategoryId || ""] || "",
        tags: game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean),
      }
    }),
    pagination: {
      currentPage: page,
      totalGames: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  }
}
