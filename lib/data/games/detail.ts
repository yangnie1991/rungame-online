"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { buildLocaleCondition } from "@/lib/i18n-helpers"
import { getAllCategoryTranslationsMap } from "../categories"
import { getAllTagTranslationsMap, getAllTagsDataMap } from "../tags"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"
import { getGameTranslatedContent } from "@/lib/helpers/game-content"
import { GameInfo } from "@/lib/types/game-info"

/**
 * ============================================
 * 游戏详情查询函数
 * ============================================
 * 包含游戏详情、推荐游戏等
 */

/**
 * 获取游戏详情
 */
export async function getGameBySlug(slug: string, locale: string) {
  // 1. 先获取底层缓存数据
  const [categoryTranslations, tagsDataMap] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagsDataMap(locale),
  ])

  // 2. 定义缓存函数：只缓存需要查询数据库的部分
  const getCachedData = unstable_cache(
    async () => {
      // 查询游戏数据
      const game = await prisma.game.findUnique({
        where: { slug, status: 'PUBLISHED' },
        include: {
          translations: locale === 'en' ? false : {
            where: buildLocaleCondition(locale),
            select: {
              title: true,
              description: true,
              keywords: true,
              metaTitle: true,
              metaDescription: true,
              translationInfo: true,
              locale: true,
            },
          },
          gameCategories: {
            select: {
              mainCategoryId: true,
              mainCategory: {
                select: { id: true, slug: true },
              },
            },
            take: 1,
          },
          tags: {
            select: { tagId: true },
          },
        },
      })

      if (!game) return null

      // 获取翻译内容
      const translatedContent = getGameTranslatedContent(
        locale,
        {
          title: game.title,
          description: game.description,
          keywords: game.keywords,
          metaTitle: game.metaTitle,
          metaDescription: game.metaDescription,
          gameInfo: game.gameInfo as GameInfo | null,
        },
        game.translations || []
      )

      // 获取主分类信息
      const mainCategory = game.gameCategories[0]?.mainCategory

      // 组装并返回结果
      return {
        id: game.id,
        slug: game.slug,
        thumbnail: game.thumbnail,
        banner: game.banner,
        embedUrl: game.embedUrl,
        gameUrl: game.gameUrl,
        dimensions: game.dimensions as { width: number; height: number; aspectRatio: string; orientation: string },
        screenshots: game.screenshots,
        videos: game.videos,
        title: translatedContent.title,
        description: translatedContent.description,
        keywords: translatedContent.keywords,
        metaTitle: translatedContent.metaTitle,
        metaDescription: translatedContent.metaDescription,
        gameInfo: translatedContent.gameInfo,
        category: {
          slug: mainCategory?.slug || "",
          name: categoryTranslations[mainCategory?.id || ""] || "",
        },
        tags: game.tags
          .map((t) => tagsDataMap[t.tagId])
          .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
        playCount: game.playCount,
        viewCount: game.viewCount,
        rating: game.rating,
        ratingCount: game.ratingCount,
        qualityScore: game.qualityScore,
        developer: game.developer,
        isFeatured: game.isFeatured,
        createdAt: game.createdAt,
      }
    },
    ["game-detail", slug, locale],
    {
      revalidate: REVALIDATE_TIME.LONG,
      tags: [CACHE_TAGS.GAMES],
    }
  )

  // 3. 返回缓存结果
  return getCachedData()
}

/**
 * 获取推荐游戏（使用智能推荐算法）
 */
export async function getRecommendedGames(
  categorySlug: string,
  currentGameSlug: string,
  locale: string,
  limit = 6
) {
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 1. 获取当前游戏的详细信息（用于推荐计算）
  const currentGame = await prisma.game.findUnique({
    where: { slug: currentGameSlug },
    select: {
      id: true,
      gameCategories: {
        select: { mainCategoryId: true },
        take: 1,
      },
      tags: {
        select: { tagId: true },
      },
      playCount: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      qualityScore: true,
      releaseDate: true,
      createdAt: true,
    },
  })

  if (!currentGame) {
    return []
  }

  // 2. 获取候选游戏（所有已发布的游戏，排除当前游戏）
  // 优先获取同分类的游戏，如果不足则获取其他分类
  const candidateGamesQuery = {
    where: {
      status: 'PUBLISHED' as const,
      slug: { not: currentGameSlug },
    },
    select: {
      id: true,
      slug: true,
      thumbnail: true,
      title: true,
      description: true,
      playCount: true,
      viewCount: true,
      rating: true,
      ratingCount: true,
      qualityScore: true,
      releaseDate: true,
      createdAt: true,
      gameCategories: {
        select: { mainCategoryId: true },
        take: 1,
      },
      tags: {
        select: { tagId: true },
      },
      translations: locale === 'en' ? false : {
        where: buildLocaleCondition(locale),
        select: { title: true, description: true, locale: true },
      },
    },
    // 获取更多候选游戏用于智能排序（最多 50 个）
    take: Math.max(limit * 8, 50),
  }

  const candidateGames = await prisma.game.findMany(candidateGamesQuery)

  if (candidateGames.length === 0) {
    return []
  }

  // 3. 使用推荐引擎计算推荐分数
  const { rankGamesForRecommendation } = await import('@/lib/recommendation-engine')

  const currentGameData = {
    id: currentGame.id,
    slug: currentGameSlug,
    categoryId: currentGame.gameCategories[0]?.mainCategoryId || '',
    tagIds: currentGame.tags.map(t => t.tagId),
    playCount: currentGame.playCount,
    viewCount: currentGame.viewCount,
    rating: currentGame.rating,
    ratingCount: currentGame.ratingCount,
    qualityScore: currentGame.qualityScore,
    releaseDate: currentGame.releaseDate,
    createdAt: currentGame.createdAt,
  }

  const candidateGamesData = candidateGames.map(game => ({
    id: game.id,
    slug: game.slug,
    categoryId: game.gameCategories[0]?.mainCategoryId || '',
    tagIds: game.tags.map(t => t.tagId),
    playCount: game.playCount,
    viewCount: game.viewCount,
    rating: game.rating,
    ratingCount: game.ratingCount,
    qualityScore: game.qualityScore,
    releaseDate: game.releaseDate,
    createdAt: game.createdAt,
  }))

  // 计算推荐分数并排序
  const rankedResults = rankGamesForRecommendation(currentGameData, candidateGamesData)

  // 4. 根据推荐分数选择前 N 个游戏
  const recommendedGameIds = rankedResults.slice(0, limit).map(r => r.gameId)

  // 5. 获取推荐游戏的详细信息并返回
  const recommendedGames = candidateGames.filter(game =>
    recommendedGameIds.includes(game.id)
  )

  // 按推荐顺序排序
  recommendedGames.sort((a, b) => {
    const aIndex = recommendedGameIds.indexOf(a.id)
    const bIndex = recommendedGameIds.indexOf(b.id)
    return aIndex - bIndex
  })

  return recommendedGames.map((game) => {
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
}

/**
 * 获取所有已发布的游戏
 */
export async function getPublishedGames(locale: string) {
  const [categoryTranslations, games] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    prisma.game.findMany({
      where: { status: 'PUBLISHED' },
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
            mainCategory: {
              select: { id: true, slug: true },
            },
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
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return games.map((game) => {
    // 获取翻译
    const translations = game.translations || []
    const title = locale === 'en' ? game.title : (translations.find(t => t.locale === locale)?.title || game.title)
    const description = locale === 'en' ? game.description : (translations.find(t => t.locale === locale)?.description || game.description)

    // 获取主分类
    const mainCategory = game.gameCategories[0]?.mainCategory

    return {
      id: game.id,
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: title,
      description: description || "",
      categoryName: categoryTranslations[mainCategory?.id || ""] || "",
      categorySlug: mainCategory?.slug || "",
      playCount: game.playCount,
      rating: game.rating,
    }
  })
}
