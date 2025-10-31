"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoryInfoMap } from "../categories"
import { getAllTagsDataMap } from "../tags"
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
  const [categoryInfoMap, tagsDataMap] = await Promise.all([
    getAllCategoryInfoMap(locale),
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

        // 获取子分类和主分类ID
        const categoryId = game.gameCategories[0]?.categoryId || ""
        const mainCategoryId = game.gameCategories[0]?.mainCategoryId || ""

        // 获取子分类和主分类信息
        const subCategoryInfo = categoryInfoMap[categoryId]
        const mainCategoryInfo = categoryInfoMap[mainCategoryId]

        return {
          id: game.id,
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: title,
          description: description || "",
          // 子分类信息（用于卡片显示）
          categoryName: subCategoryInfo?.name || "",
          categorySlug: subCategoryInfo?.slug || "",
          // 主分类信息（保留以备将来使用）
          mainCategoryName: mainCategoryInfo?.name || "",
          mainCategorySlug: mainCategoryInfo?.slug || "",
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
  const featuredGames = await getCachedData()

  // 4. 如果精选游戏数量不足，用最受欢迎的游戏补充
  if (featuredGames.length < limit) {
    const neededCount = limit - featuredGames.length
    const mostPlayedGames = await getMostPlayedGames(locale, neededCount + featuredGames.length)

    // 过滤掉已经在精选游戏中的游戏
    const featuredSlugs = new Set(featuredGames.map(g => g.slug))
    const additionalGames = mostPlayedGames
      .filter(g => !featuredSlugs.has(g.slug))
      .slice(0, neededCount)

    return [...featuredGames, ...additionalGames]
  }

  return featuredGames
}

/**
 * 获取最受欢迎的游戏（按播放次数）
 */
export async function getMostPlayedGames(locale: string, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getMostPlayedGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryInfoMap, tagsDataMap] = await Promise.all([
    getAllCategoryInfoMap(locale),
    getAllTagsDataMap(locale),
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

        // 获取子分类和主分类ID
        const categoryId = game.gameCategories[0]?.categoryId || ""
        const mainCategoryId = game.gameCategories[0]?.mainCategoryId || ""

        // 获取子分类和主分类信息
        const subCategoryInfo = categoryInfoMap[categoryId]
        const mainCategoryInfo = categoryInfoMap[mainCategoryId]

        return {
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: title,
          description: description || "",
          // 子分类信息（用于卡片显示）
          categoryName: subCategoryInfo?.name || "",
          categorySlug: subCategoryInfo?.slug || "",
          // 主分类信息（保留以备将来使用）
          mainCategoryName: mainCategoryInfo?.name || "",
          mainCategorySlug: mainCategoryInfo?.slug || "",
          tags: game.tags
            .map((t) => tagsDataMap[t.tagId])
            .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
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
 *
 * 趋势算法综合考虑：
 * - 新鲜度：最近 30 天内创建或更新的游戏
 * - 热度：播放量（至少 5 次）
 * - 评分：高评分游戏优先
 * - 趋势分数 = (新鲜度权重 × 0.4) + (播放量权重 × 0.4) + (评分权重 × 0.2)
 */
export async function getTrendingGames(locale: string, limit = 24) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 🎮 getTrendingGames - 开始查询 locale: ${locale}, limit: ${limit}`)
  }

  // 1. 先获取底层缓存数据
  const [categoryInfoMap, tagsDataMap] = await Promise.all([
    getAllCategoryInfoMap(locale),
    getAllTagsDataMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 计算30天前的时间戳
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // 查询候选游戏（最近活跃的游戏，取更多数量用于排序）
      const candidateGames = await prisma.game.findMany({
        where: {
          status: 'PUBLISHED',
          playCount: { gte: 5 }, // 至少有基础播放量
          OR: [
            { createdAt: { gte: thirtyDaysAgo } }, // 最近30天创建
            { updatedAt: { gte: thirtyDaysAgo } }, // 最近30天更新
          ],
        },
        take: limit * 3, // 取3倍数量用于计算趋势分数
        select: {
          slug: true,
          thumbnail: true,
          title: true,
          description: true,
          playCount: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
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
      })

      // 如果候选游戏不足，用播放量补充
      let games = candidateGames
      if (games.length < limit) {
        const existingSlugs = new Set(games.map(g => g.slug))
        const additionalGames = await prisma.game.findMany({
          where: {
            status: 'PUBLISHED',
            slug: { notIn: Array.from(existingSlugs) },
          },
          take: limit - games.length,
          select: {
            slug: true,
            thumbnail: true,
            title: true,
            description: true,
            playCount: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
            gameCategories: {
              select: {
                categoryId: true,
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
        games = [...games, ...additionalGames]
      }

      // 计算每个游戏的趋势分数
      const now = Date.now()
      const gamesWithScore = games.map(game => {
        // 1. 新鲜度分数 (0-1)：基于最新的时间（创建或更新）
        const latestTime = Math.max(game.createdAt.getTime(), game.updatedAt.getTime())
        const daysSinceLatest = (now - latestTime) / (1000 * 60 * 60 * 24)
        const freshnessScore = Math.max(0, 1 - daysSinceLatest / 30) // 30天内线性衰减

        // 2. 播放量分数 (0-1)：对数归一化
        const playScore = Math.min(1, Math.log10(game.playCount + 1) / 4) // log10(10000) ≈ 4

        // 3. 评分分数 (0-1)
        const ratingScore = game.rating / 5

        // 4. 综合趋势分数
        const trendingScore = (freshnessScore * 0.4) + (playScore * 0.4) + (ratingScore * 0.2)

        return { game, trendingScore }
      })

      // 按趋势分数排序并取前 limit 个
      const topGames = gamesWithScore
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit)
        .map(({ game }) => game)

      // 组装并返回结果
      return topGames.map((game) => {
        // 获取翻译
        const translations = game.translations || []
        const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
        const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

        // 获取子分类和主分类ID
        const categoryId = game.gameCategories[0]?.categoryId || ""
        const mainCategoryId = game.gameCategories[0]?.mainCategoryId || ""

        // 获取子分类和主分类信息
        const subCategoryInfo = categoryInfoMap[categoryId]
        const mainCategoryInfo = categoryInfoMap[mainCategoryId]

        return {
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: title,
          description: description || "",
          // 子分类信息（用于卡片显示）
          categoryName: subCategoryInfo?.name || "",
          categorySlug: subCategoryInfo?.slug || "",
          // 主分类信息（保留以备将来使用）
          mainCategoryName: mainCategoryInfo?.name || "",
          mainCategorySlug: mainCategoryInfo?.slug || "",
          tags: game.tags
            .map((t) => tagsDataMap[t.tagId])
            .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
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
  const [categoryInfoMap, tagsDataMap] = await Promise.all([
    getAllCategoryInfoMap(locale),
    getAllTagsDataMap(locale),
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
        },
        orderBy: { createdAt: "desc" },
      })

      // 组装并返回结果
      return games.map((game) => {
        // 获取翻译
        const translations = game.translations || []
        const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
        const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

        // 获取子分类和主分类ID
        const categoryId = game.gameCategories[0]?.categoryId || ""
        const mainCategoryId = game.gameCategories[0]?.mainCategoryId || ""

        // 获取子分类和主分类信息
        const subCategoryInfo = categoryInfoMap[categoryId]
        const mainCategoryInfo = categoryInfoMap[mainCategoryId]

        return {
          slug: game.slug,
          thumbnail: game.thumbnail,
          title: title,
          description: description || "",
          // 子分类信息（用于卡片显示）
          categoryName: subCategoryInfo?.name || "",
          categorySlug: subCategoryInfo?.slug || "",
          // 主分类信息（保留以备将来使用）
          mainCategoryName: mainCategoryInfo?.name || "",
          mainCategorySlug: mainCategoryInfo?.slug || "",
          tags: game.tags
            .map((t) => tagsDataMap[t.tagId])
            .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
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
