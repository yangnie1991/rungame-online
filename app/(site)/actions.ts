"use server"

import { prisma } from "@/lib/db"
import { cache } from "react"
import { getTranslatedField, buildLocaleCondition, DEFAULT_LOCALE } from "@/lib/i18n-helpers"

/**
 * 获取默认语言
 */
export const getDefaultLanguage = cache(async () => {
  return await prisma.language.findFirst({
    where: { isDefault: true, isEnabled: true },
    select: { code: true, name: true, flag: true },
  })
})

/**
 * 获取所有启用的语言
 */
export const getEnabledLanguages = cache(async () => {
  return await prisma.language.findMany({
    where: { isEnabled: true },
    select: { code: true, name: true, nativeName: true, flag: true },
    orderBy: { sortOrder: "asc" },
  })
})

/**
 * 获取精选游戏（用于首页）
 */
export async function getFeaturedGames(locale: string, limit = 12) {
  const games = await prisma.game.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    take: limit,
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          description: true,
          locale: true,
        },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
    orderBy: { playCount: "desc" },
  })

  return games.map((game) => ({
    id: game.id,
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    categoryName: getTranslatedField(game.category.translations, locale, "name", ""),
    categorySlug: game.category.slug,
    tags: game.tags.map((t) => ({
      slug: t.tag.slug,
      name: getTranslatedField(t.tag.translations, locale, "name", t.tag.slug),
    })),
    playCount: game.playCount,
    rating: game.rating,
  }))
}

/**
 * 获取所有已发布的游戏
 */
export async function getPublishedGames(locale: string) {
  const games = await prisma.game.findMany({
    where: { isPublished: true },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          description: true,
          locale: true,
        },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return games.map((game) => ({
    id: game.id,
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    categoryName: getTranslatedField(game.category.translations, locale, "name", ""),
    categorySlug: game.category.slug,
    playCount: game.playCount,
    rating: game.rating,
  }))
}

/**
 * 获取游戏详情
 */
export async function getGameBySlug(slug: string, locale: string) {
  const game = await prisma.game.findUnique({
    where: { slug, isPublished: true },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          description: true,
          longDescription: true,
          instructions: true,
          keywords: true,
          metaTitle: true,
          metaDescription: true,
          locale: true,
        },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
  })

  if (!game) {
    return null
  }

  return {
    id: game.id,
    slug: game.slug,
    thumbnail: game.thumbnail,
    banner: game.banner,
    embedUrl: game.embedUrl,
    gameUrl: game.gameUrl,
    width: game.width,
    height: game.height,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    longDescription: getTranslatedField(game.translations, locale, "longDescription", ""),
    instructions: getTranslatedField(game.translations, locale, "instructions", ""),
    keywords: getTranslatedField(game.translations, locale, "keywords", ""),
    metaTitle: getTranslatedField(game.translations, locale, "metaTitle", ""),
    metaDescription: getTranslatedField(game.translations, locale, "metaDescription", ""),
    category: {
      slug: game.category.slug,
      name: getTranslatedField(game.category.translations, locale, "name", ""),
    },
    tags: game.tags.map((t) => ({
      slug: t.tag.slug,
      name: getTranslatedField(t.tag.translations, locale, "name", t.tag.slug),
    })),
    playCount: game.playCount,
    rating: game.rating,
    isFeatured: game.isFeatured,
    createdAt: game.createdAt,
  }
}

/**
 * 增加游戏播放次数
 */
export async function incrementPlayCount(gameId: string) {
  try {
    await prisma.game.update({
      where: { id: gameId },
      data: { playCount: { increment: 1 } },
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to increment play count:", error)
    return { success: false }
  }
}

/**
 * 获取分类下的游戏
 */
export async function getGamesByCategory(categorySlug: string, locale: string, page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          name: true,
          description: true,
          locale: true,
        },
      },
      games: {
        where: { isPublished: true },
        skip,
        take: limit,
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: {
              title: true,
              description: true,
              locale: true,
            },
          },
          category: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
          tags: {
            include: {
              tag: {
                include: {
                  translations: {
                    where: buildLocaleCondition(locale),
                    select: { name: true, locale: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { playCount: "desc" },
      },
      _count: {
        select: { games: { where: { isPublished: true } } },
      },
    },
  })

  if (!category) {
    return null
  }

  return {
    category: {
      slug: category.slug,
      name: getTranslatedField(category.translations, locale, "name", category.slug),
      description: getTranslatedField(category.translations, locale, "description", ""),
      icon: category.icon,
    },
    games: category.games.map((game) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: getTranslatedField(game.translations, locale, "title", "Untitled"),
      description: getTranslatedField(game.translations, locale, "description", ""),
      category: getTranslatedField(game.category.translations, locale, "name", ""),
      tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
    })),
    pagination: {
      currentPage: page,
      totalGames: category._count.games,
      totalPages: Math.ceil(category._count.games / limit),
      hasMore: page * limit < category._count.games,
    },
  }
}

/**
 * 获取标签下的游戏
 */
export async function getGamesByTag(tagSlug: string, locale: string) {
  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          name: true,
          locale: true,
        },
      },
      games: {
        include: {
          game: {
            where: { isPublished: true },
            include: {
              translations: {
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

  if (!tag || tag.translations.length === 0) {
    return null
  }

  return {
    slug: tag.slug,
    name: getTranslatedField(tag.translations, locale, "name", tag.slug),
    icon: tag.icon,
    games: tag.games
      .map((gt) => gt.game)
      .map((game) => ({
        id: game.id,
        slug: game.slug,
        thumbnail: game.thumbnail,
        title: getTranslatedField(game.translations, locale, "title", "Untitled"),
        description: getTranslatedField(game.translations, locale, "description", ""),
        playCount: game.playCount,
        rating: game.rating,
      })),
  }
}

/**
 * 获取所有分类（用于导航）
 */
export const getAllCategories = cache(async (locale: string) => {
  const categories = await prisma.category.findMany({
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { name: true, locale: true },
      },
      _count: {
        select: { games: { where: { isPublished: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return categories.map((cat) => ({
    slug: cat.slug,
    name: getTranslatedField(cat.translations, locale, "name", cat.slug),
    icon: cat.icon,
    gameCount: cat._count.games,
  }))
})

/**
 * 获取所有标签（用于导航）
 */
export const getAllTags = cache(async (locale: string) => {
  const tags = await prisma.tag.findMany({
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { name: true, locale: true },
      },
      _count: {
        select: { games: true },
      },
    },
  })

  return tags
    .filter((tag) => tag._count.games > 0)
    .map((tag) => ({
      slug: tag.slug,
      name: getTranslatedField(tag.translations, locale, "name", tag.slug),
      icon: tag.icon,
      gameCount: tag._count.games,
    }))
})

/**
 * 获取最受欢迎的游戏（按播放次数）
 */
export async function getMostPlayedGames(locale: string, limit = 24) {
  const games = await prisma.game.findMany({
    where: { isPublished: true },
    take: limit,
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          description: true,
          locale: true,
        },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
    orderBy: { playCount: "desc" },
  })

  return games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    category: getTranslatedField(game.category.translations, locale, "name", ""),
    tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
  }))
}

/**
 * 获取热门趋势游戏（按最近播放次数和评分）
 */
export async function getTrendingGames(locale: string, limit = 24) {
  // 获取最近创建或更新的高播放量游戏
  const games = await prisma.game.findMany({
    where: {
      isPublished: true,
      playCount: { gte: 10 }, // 至少有10次播放
    },
    take: limit,
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          description: true,
          locale: true,
        },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { playCount: "desc" }],
  })

  return games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    category: getTranslatedField(game.category.translations, locale, "name", ""),
    tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
  }))
}

/**
 * 根据标签获取游戏（用于首页section）
 */
export async function getGamesByTagSlug(tagSlug: string, locale: string, limit = 24) {
  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    include: {
      games: {
        where: {
          game: { isPublished: true },
        },
        take: limit,
        include: {
          game: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: {
                  title: true,
                  description: true,
                  locale: true,
                },
              },
              category: {
                include: {
                  translations: {
                    where: buildLocaleCondition(locale),
                    select: { name: true, locale: true },
                  },
                },
              },
              tags: {
                include: {
                  tag: {
                    include: {
                      translations: {
                        where: buildLocaleCondition(locale),
                        select: { name: true, locale: true },
                      },
                    },
                  },
                },
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

  return tag.games.map((gt) => ({
    slug: gt.game.slug,
    thumbnail: gt.game.thumbnail,
    title: getTranslatedField(gt.game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(gt.game.translations, locale, "description", ""),
    category: getTranslatedField(gt.game.category.translations, locale, "name", ""),
    tags: gt.game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
  }))
}

/**
 * 获取推荐游戏（同分类的其他游戏）
 */
export async function getRecommendedGames(
  categorySlug: string,
  currentGameSlug: string,
  locale: string,
  limit = 6
) {
  const games = await prisma.game.findMany({
    where: {
      isPublished: true,
      slug: { not: currentGameSlug },
      category: { slug: categorySlug },
    },
    take: limit,
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { title: true, description: true, locale: true },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
    orderBy: { playCount: "desc" },
  })

  // 如果同分类游戏不足，补充热门游戏
  if (games.length < limit) {
    const additionalGames = await prisma.game.findMany({
      where: {
        isPublished: true,
        slug: { not: currentGameSlug },
        category: { slug: { not: categorySlug } },
      },
      take: limit - games.length,
      include: {
        translations: {
          where: buildLocaleCondition(locale),
          select: { title: true, description: true, locale: true },
        },
        category: {
          include: {
            translations: {
              where: buildLocaleCondition(locale),
              select: { name: true, locale: true },
            },
          },
        },
        tags: {
          include: {
            tag: {
              include: {
                translations: {
                  where: buildLocaleCondition(locale),
                  select: { name: true, locale: true },
                },
              },
            },
          },
        },
      },
      orderBy: { playCount: "desc" },
    })

    games.push(...additionalGames)
  }

  return games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: getTranslatedField(game.translations, locale, "title", "Untitled"),
    description: getTranslatedField(game.translations, locale, "description", ""),
    category: getTranslatedField(game.category.translations, locale, "name", ""),
    tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
  }))
}

/**
 * 获取所有启用的页面类型（用于导航）
 */
export async function getAllPageTypes(locale: string) {
  const pageTypes = await prisma.pageType.findMany({
    where: { isEnabled: true },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { title: true, description: true, locale: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return pageTypes.map((pt) => ({
    slug: pt.slug,
    type: pt.type,
    icon: pt.icon,
    title: getTranslatedField(pt.translations, locale, "title", pt.slug),
    description: getTranslatedField(pt.translations, locale, "description", ""),
  }))
}

/**
 * 根据页面类型slug获取页面配置和游戏
 */
export async function getPageTypeGames(pageTypeSlug: string, locale: string, page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const pageType = await prisma.pageType.findUnique({
    where: { slug: pageTypeSlug, isEnabled: true },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: {
          title: true,
          subtitle: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          locale: true,
        },
      },
    },
  })

  if (!pageType) return null

  // 根据页面类型配置查询条件和排序
  let gamesQuery: any = {
    where: { isPublished: true },
    skip,
    take: limit,
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { title: true, description: true, locale: true },
      },
      category: {
        include: {
          translations: {
            where: buildLocaleCondition(locale),
            select: { name: true, locale: true },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { name: true, locale: true },
              },
            },
          },
        },
      },
    },
  }

  // 根据页面类型的type字段应用不同的排序和筛选
  switch (pageType.type) {
    case "most-played":
      gamesQuery.orderBy = { playCount: "desc" }
      break
    case "trending":
      gamesQuery.where.playCount = { gte: 10 }
      gamesQuery.orderBy = [{ updatedAt: "desc" }, { playCount: "desc" }]
      break
    case "new":
      gamesQuery.orderBy = { createdAt: "desc" }
      break
    case "featured":
      gamesQuery.where.isFeatured = true
      gamesQuery.orderBy = { playCount: "desc" }
      break
    default:
      // 默认按播放次数排序
      gamesQuery.orderBy = { playCount: "desc" }
  }

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany(gamesQuery),
    prisma.game.count({ where: gamesQuery.where }),
  ])

  return {
    pageType: {
      slug: pageType.slug,
      type: pageType.type,
      icon: pageType.icon,
      title: getTranslatedField(pageType.translations, locale, "title", pageType.slug),
      subtitle: getTranslatedField(pageType.translations, locale, "subtitle", ""),
      description: getTranslatedField(pageType.translations, locale, "description", ""),
      metaTitle: getTranslatedField(pageType.translations, locale, "metaTitle", ""),
      metaDescription: getTranslatedField(pageType.translations, locale, "metaDescription", ""),
    },
    games: games.map((game: any) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: getTranslatedField(game.translations, locale, "title", "Untitled"),
      description: getTranslatedField(game.translations, locale, "description", ""),
      category: getTranslatedField(game.category.translations, locale, "name", ""),
      tags: game.tags.map((t: any) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
    })),
    pagination: {
      currentPage: page,
      totalGames: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  }
}

/**
 * 获取所有游戏列表（支持分页）
 */
export async function getAllGames(locale: string, page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where: { isPublished: true },
      skip,
      take: limit,
      include: {
        translations: {
          where: buildLocaleCondition(locale),
          select: { title: true, description: true, locale: true },
        },
        category: {
          include: {
            translations: {
              where: buildLocaleCondition(locale),
              select: { name: true, locale: true },
            },
          },
        },
        tags: {
          include: {
            tag: {
              include: {
                translations: {
                  where: buildLocaleCondition(locale),
                  select: { name: true, locale: true },
                },
              },
            },
          },
        },
      },
      orderBy: { playCount: "desc" },
    }),
    prisma.game.count({ where: { isPublished: true } }),
  ])

  return {
    games: games.map((game) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: getTranslatedField(game.translations, locale, "title", "Untitled"),
      description: getTranslatedField(game.translations, locale, "description", ""),
      category: getTranslatedField(game.category.translations, locale, "name", ""),
      tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
    })),
    pagination: {
      currentPage: page,
      totalGames: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  }
}

/**
 * 根据标签slug获取游戏列表（支持分页，用于标签页面）
 */
export async function getGamesByTagWithPagination(tagSlug: string, locale: string, page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    include: {
      translations: {
        where: buildLocaleCondition(locale),
        select: { name: true, locale: true },
      },
      games: {
        where: {
          game: { isPublished: true },
        },
        skip,
        take: limit,
        include: {
          game: {
            include: {
              translations: {
                where: buildLocaleCondition(locale),
                select: { title: true, description: true, locale: true },
              },
              category: {
                include: {
                  translations: {
                    where: buildLocaleCondition(locale),
                    select: { name: true, locale: true },
                  },
                },
              },
              tags: {
                include: {
                  tag: {
                    include: {
                      translations: {
                        where: buildLocaleCondition(locale),
                        select: { name: true, locale: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          game: { playCount: "desc" },
        },
      },
      _count: {
        select: { games: { where: { game: { isPublished: true } } } },
      },
    },
  })

  if (!tag) return null

  return {
    tag: {
      slug: tag.slug,
      name: getTranslatedField(tag.translations, locale, "name", tag.slug),
    },
    games: tag.games.map((gt) => ({
      slug: gt.game.slug,
      thumbnail: gt.game.thumbnail,
      title: getTranslatedField(gt.game.translations, locale, "title", "Untitled"),
      description: getTranslatedField(gt.game.translations, locale, "description", ""),
      category: getTranslatedField(gt.game.category.translations, locale, "name", ""),
      tags: gt.game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
    })),
    pagination: {
      currentPage: page,
      totalGames: tag._count.games,
      totalPages: Math.ceil(tag._count.games / limit),
      hasMore: page * limit < tag._count.games,
    },
  }
}
