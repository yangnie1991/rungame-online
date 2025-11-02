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
              categoryId: true,
              mainCategory: {
                select: { id: true, slug: true, icon: true },
              },
              category: {
                select: { id: true, slug: true, icon: true },
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

      // 获取分类信息（主分类和子分类）
      const gameCategory = game.gameCategories[0]
      const mainCategory = gameCategory?.mainCategory
      const subCategory = gameCategory?.category

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
        // 主分类信息
        category: {
          id: mainCategory?.id || "",
          slug: mainCategory?.slug || "",
          name: categoryTranslations[mainCategory?.id || ""] || "",
          icon: mainCategory?.icon || "",
        },
        // 子分类信息（可能为空）
        subCategory: subCategory ? {
          id: subCategory.id,
          slug: subCategory.slug,
          name: categoryTranslations[subCategory.id] || "",
          icon: subCategory.icon || "",
        } : null,
        tags: game.tags
          .map((t) => tagsDataMap[t.tagId])
          .filter((tag): tag is { slug: string; name: string } => tag !== undefined),
        // 推荐引擎需要的原始 ID 数据
        categoryId: mainCategory?.id || "",
        tagIds: game.tags.map(t => t.tagId),
        releaseDate: game.releaseDate,
        playCount: game.playCount,
        viewCount: game.viewCount,
        likes: game.likes,
        dislikes: game.dislikes,
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
 * 获取推荐游戏（使用智能推荐引擎）
 * 接收当前游戏数据作为参数，避免重复查询
 */
export async function getRecommendedGames(
  currentGameData: {
    id: string
    slug: string
    categoryId: string
    tagIds: string[]
    playCount: number
    viewCount: number
    rating: number
    ratingCount: number
    qualityScore: number
    releaseDate: Date | null
    createdAt: Date
  },
  locale: string,
  limit = 6
) {
  // 并行获取翻译数据
  const [categoryTranslations, tagTranslations] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagTranslationsMap(locale),
  ])

  // 查询候选游戏 - 只查询推荐引擎需要的字段
  const candidateGames = await prisma.game.findMany({
    where: {
      status: 'PUBLISHED' as const,
      slug: { not: currentGameData.slug },
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
    // 优化：减少候选游戏数量以提升性能
    // 只需要 6 个推荐，查询 12-15 个候选游戏即可
    // 推荐引擎会从中选择相似度最高的 6 个
    take: Math.min(limit * 2 + 3, 15),
  })

  if (candidateGames.length === 0) {
    return []
  }

  // 使用推荐引擎计算推荐分数
  const { rankGamesForRecommendation } = await import('@/lib/recommendation-engine')

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

  // 根据推荐分数选择前 N 个游戏
  const recommendedGameIds = rankedResults.slice(0, limit).map(r => r.gameId)

  // 获取推荐游戏的详细信息
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

/**
 * 获取混合推荐游戏的核心逻辑（不带缓存）
 */
async function fetchMixedRecommendedGames(
  mainCategorySlug: string,
  subCategorySlug: string | null,
  excludeSlugs: string[],
  locale: string,
  limit: number
) {
  const [categoryTranslations, tagsDataMap] = await Promise.all([
    getAllCategoryTranslationsMap(locale),
    getAllTagsDataMap(locale),
  ])

  // 获取分类ID
  const [mainCategory, subCategory] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: mainCategorySlug },
      select: { id: true },
    }),
    subCategorySlug
      ? prisma.category.findUnique({
          where: { slug: subCategorySlug },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (!mainCategory) {
    return []
  }

  const gameSelect = {
    slug: true,
    thumbnail: true,
    title: true,
    description: true,
    playCount: true,
    rating: true,
    ratingCount: true,
    createdAt: true,
    gameCategories: {
      select: {
        mainCategoryId: true,
        categoryId: true,
      },
      take: 1,
    },
    tags: {
      select: { tagId: true },
      take: 2,
    },
    translations:
      locale === "en"
        ? false
        : {
            where: buildLocaleCondition(locale),
            select: { title: true, description: true, locale: true },
          },
  }

  // 优化策略：一次性查询足够多的游戏，然后在内存中分类和混合
  // 这样可以减少数据库查询次数
  const baseWhere = {
    status: "PUBLISHED" as const,
    slug: { notIn: excludeSlugs },
  }

  // 确定查询范围
  const categoryWhere = subCategory
    ? { gameCategories: { some: { categoryId: subCategory.id } } }
    : { gameCategories: { some: { mainCategoryId: mainCategory.id } } }

  // 一次性查询足够多的游戏（取 limit * 3 以确保有足够的选择）
  const candidates = await prisma.game.findMany({
    where: {
      ...baseWhere,
      ...categoryWhere,
    },
    select: gameSelect,
    take: limit * 3,
  })

  // 在内存中按不同维度排序并混合
  const byPlayCount = [...candidates].sort((a, b) => b.playCount - a.playCount)
  const byCreatedAt = [...candidates].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )
  const byRating = [...candidates].sort((a, b) => {
    const ratingDiff = b.rating - a.rating
    if (ratingDiff !== 0) return ratingDiff
    return b.ratingCount - a.ratingCount
  })

  // 混合策略：交替从三个列表中选取
  const selected = new Set<string>()
  const selectedGames: typeof candidates = []
  const perType = Math.ceil(limit / 3)

  // 从每个列表中取游戏
  for (let i = 0; i < perType && selectedGames.length < limit; i++) {
    // 取最多游玩的
    if (byPlayCount[i] && !selected.has(byPlayCount[i].slug)) {
      selected.add(byPlayCount[i].slug)
      selectedGames.push(byPlayCount[i])
    }
    // 取最新的
    if (
      byCreatedAt[i] &&
      !selected.has(byCreatedAt[i].slug) &&
      selectedGames.length < limit
    ) {
      selected.add(byCreatedAt[i].slug)
      selectedGames.push(byCreatedAt[i])
    }
    // 取高评分的
    if (
      byRating[i] &&
      !selected.has(byRating[i].slug) &&
      selectedGames.length < limit
    ) {
      selected.add(byRating[i].slug)
      selectedGames.push(byRating[i])
    }
  }

  // 如果还不够，从子分类降级到主分类
  if (selectedGames.length < limit && subCategory) {
    const mainCategoryGames = await prisma.game.findMany({
      where: {
        ...baseWhere,
        slug: { notIn: [...excludeSlugs, ...Array.from(selected)] },
        gameCategories: { some: { mainCategoryId: mainCategory.id } },
      },
      select: gameSelect,
      take: (limit - selectedGames.length) * 2,
    })

    // 对主分类游戏也做混合处理
    const mainByPlayCount = [...mainCategoryGames].sort(
      (a, b) => b.playCount - a.playCount
    )
    const mainByCreatedAt = [...mainCategoryGames].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    const mainByRating = [...mainCategoryGames].sort((a, b) => {
      const ratingDiff = b.rating - a.rating
      if (ratingDiff !== 0) return ratingDiff
      return b.ratingCount - a.ratingCount
    })

    let idx = 0
    while (selectedGames.length < limit && idx < mainCategoryGames.length) {
      if (mainByPlayCount[idx] && !selected.has(mainByPlayCount[idx].slug)) {
        selected.add(mainByPlayCount[idx].slug)
        selectedGames.push(mainByPlayCount[idx])
      }
      if (
        mainByCreatedAt[idx] &&
        !selected.has(mainByCreatedAt[idx].slug) &&
        selectedGames.length < limit
      ) {
        selected.add(mainByCreatedAt[idx].slug)
        selectedGames.push(mainByCreatedAt[idx])
      }
      if (
        mainByRating[idx] &&
        !selected.has(mainByRating[idx].slug) &&
        selectedGames.length < limit
      ) {
        selected.add(mainByRating[idx].slug)
        selectedGames.push(mainByRating[idx])
      }
      idx++
    }
  }

  // 格式化返回数据
  return selectedGames.slice(0, limit).map((game) => {
    const translations = game.translations || []
    const title =
      locale === "en"
        ? game.title
        : translations.find((t: any) => t.locale === locale)?.title ||
          game.title
    const description =
      locale === "en"
        ? game.description
        : translations.find((t: any) => t.locale === locale)?.description ||
          game.description

    return {
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: title,
      description: description || "",
      categoryName:
        categoryTranslations[game.gameCategories[0]?.mainCategoryId || ""] ||
        "",
      categorySlug: mainCategorySlug,
      tags: game.tags
        .map((t: any) => tagsDataMap[t.tagId])
        .filter(
          (tag): tag is { slug: string; name: string } => tag !== undefined
        ),
    }
  })
}

/**
 * 获取混合推荐游戏（用于底部推荐）- 带缓存
 * 策略：优先子分类，混合最多游玩、最新、高评分，去重后补充主分类
 */
export async function getMixedRecommendedGames(
  mainCategorySlug: string,
  subCategorySlug: string | null,
  excludeSlugs: string | string[],
  locale: string,
  limit = 6
) {
  // 标准化 excludeSlugs 为数组
  const excludeList = Array.isArray(excludeSlugs)
    ? excludeSlugs
    : [excludeSlugs]

  // 使用缓存键：包含分类、语言和限制数量
  const cacheKey = `mixed-recommendations-${mainCategorySlug}-${subCategorySlug || "none"}-${locale}-${limit}`

  // 不缓存排除列表，因为每个游戏详情页的排除列表都不同
  // 直接调用核心函数
  return fetchMixedRecommendedGames(
    mainCategorySlug,
    subCategorySlug,
    excludeList,
    locale,
    limit
  )
}
