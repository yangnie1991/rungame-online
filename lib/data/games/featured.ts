"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoryTranslationsMap } from "../categories"
import { getAllTagTranslationsMap, getAllTagsDataMap } from "../tags"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 特色游戏查询函数
 * ============================================
 * 包含精选游戏、最受欢迎、热门趋势、最新游戏等
 */

/**
 * 获取精选游戏（用于首页）
 */
export async function getFeaturedGames(locale: string, limit = 12) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getFeaturedGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据（这些已经有自己的缓存了）
  const [categoryTranslations, tagsDataMap] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagsDataMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询游戏数据
      const games = await prisma.game.findMany({
        where: {
          status: 'PUBLISHED',
          isFeatured: true,
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          thumbnail: true,
          title: true,
          description: true,
          playCount: true,
          rating: true,
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

      // 组装并返回结果
      return games.map((game) => {
        // 获取翻译
        const translations = game.translations || []
        const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
        const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

        // 获取主分类ID
        const mainCategoryId = game.gameCategories[0]?.mainCategoryId || ""

        return {
          id: game.id,
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: title,
          description: description || "",
          categoryName: categoryTranslations[mainCategoryId] || "",
          categorySlug: "", // Featured games 不需要 categorySlug，只显示名称
          tags: game.tags
            .map((t) => tagsDataMap[t.tagId])
            .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
          playCount: game.playCount,
          rating: game.rating,
        }
      })
    },
    ["featured-games", locale, String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取最受欢迎的游戏（按播放次数）
 */
export async function getMostPlayedGames(locale: string, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getMostPlayedGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询游戏数据
      const games = await prisma.game.findMany({
        where: { status: 'PUBLISHED' },
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

      // 组装并返回结果
      return games.map((game) => {
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
      })
    },
    ["most-played-games", locale, String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取热门趋势游戏
 */
export async function getTrendingGames(locale: string, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getTrendingGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询游戏数据
      const games = await prisma.game.findMany({
        where: {
          status: 'PUBLISHED',
          playCount: { gte: 10 },
        },
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
        orderBy: [{ updatedAt: "desc" }, { playCount: "desc" }],
      })

      // 组装并返回结果
      return games.map((game) => {
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
      })
    },
    ["trending-games", locale, String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取最新游戏（按创建时间）
 */
export async function getNewestGames(locale: string, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getNewestGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询游戏数据
      const games = await prisma.game.findMany({
        where: { status: 'PUBLISHED' },
        take: limit,
        select: {
          slug: true,
          thumbnail: true,
          title: true,
          description: true,
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
          gameCategories: {
            select: {
              mainCategoryId: true,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      })

      // 组装并返回结果
      return games.map((game) => {
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
      })
    },
    ["newest-games", locale, String(limit)],
    {
      revalidate: REVALIDATE_TIME.MEDIUM,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}
