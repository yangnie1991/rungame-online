"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 游戏统计数据缓存层
 * ============================================
 *
 * 提供游戏统计信息的缓存版本，避免重复查询数据库
 *
 * 包含：
 * - 游戏总数
 * - 分类游戏数
 * - 标签游戏数
 * 等统计信息
 */

/**
 * 内部数据库查询函数：获取游戏总数
 */
async function fetchTotalGamesCount() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchTotalGamesCount - 执行数据库查询`)
  }

  const count = await prisma.game.count({
    where: {
      status: 'PUBLISHED',
    },
  })

  return count
}

/**
 * 获取游戏总数（已发布的游戏）
 *
 * 缓存策略：
 * - 时间：30分钟重新验证
 * - 原因：统计数据，用户要求30分钟缓存
 * - 标签：当游戏数据变化时自动失效
 *
 * @returns 已发布游戏的总数
 *
 * @example
 * const totalGames = await getTotalGamesCount()
 * console.log(`网站共有 ${totalGames} 个游戏`)
 */
export const getTotalGamesCount = unstable_cache(
  async () => fetchTotalGamesCount(),
  ["total-games-count"],
  {
    revalidate: REVALIDATE_TIME.STATS_SHORT, // 30分钟 - 统计数据
    tags: [CACHE_TAGS.GAMES],
  }
)

/**
 * 内部数据库查询函数：按分类统计游戏数
 */
async function fetchGamesCategoryStats() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchGamesCategoryStats - 执行数据库查询`)
  }

  const stats = await prisma.gameCategory.groupBy({
    by: ['categoryId'],
    where: {
      game: {
        status: 'PUBLISHED',
      },
    },
    _count: {
      gameId: true,
    },
  })

  // 转换为 Map 格式
  const statsMap: Record<string, number> = {}
  stats.forEach((stat) => {
    statsMap[stat.categoryId] = stat._count.gameId
  })

  return statsMap
}

/**
 * 获取各分类的游戏数量统计
 *
 * 缓存策略：
 * - 时间：10分钟重新验证
 * - 原因：游戏分类关联变化不频繁
 * - 标签：当游戏数据变化时自动失效
 *
 * @returns 分类ID到游戏数量的映射
 *
 * @example
 * const stats = await getGamesCategoryStats()
 * const actionGamesCount = stats['category-id-123'] || 0
 */
export const getGamesCategoryStats = unstable_cache(
  async () => fetchGamesCategoryStats(),
  ["games-category-stats"],
  {
    revalidate: REVALIDATE_TIME.MEDIUM, // 10分钟
    tags: [CACHE_TAGS.GAMES, CACHE_TAGS.CATEGORIES],
  }
)

/**
 * 内部数据库查询函数：按标签统计游戏数
 */
async function fetchGamesTagStats() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchGamesTagStats - 执行数据库查询`)
  }

  const stats = await prisma.gameTag.groupBy({
    by: ['tagId'],
    where: {
      game: {
        status: 'PUBLISHED',
      },
    },
    _count: {
      gameId: true,
    },
  })

  // 转换为 Map 格式
  const statsMap: Record<string, number> = {}
  stats.forEach((stat) => {
    statsMap[stat.tagId] = stat._count.gameId
  })

  return statsMap
}

/**
 * 获取各标签的游戏数量统计
 *
 * 缓存策略：
 * - 时间：10分钟重新验证
 * - 原因：游戏标签关联变化不频繁
 * - 标签：当游戏数据变化时自动失效
 *
 * @returns 标签ID到游戏数量的映射
 *
 * @example
 * const stats = await getGamesTagStats()
 * const multiplayerGamesCount = stats['tag-id-456'] || 0
 */
export const getGamesTagStats = unstable_cache(
  async () => fetchGamesTagStats(),
  ["games-tag-stats"],
  {
    revalidate: REVALIDATE_TIME.MEDIUM, // 10分钟
    tags: [CACHE_TAGS.GAMES, CACHE_TAGS.TAGS],
  }
)

/**
 * ============================================
 * 单个游戏的实时统计数据
 * ============================================
 * 专门用于查询频繁变化的统计数据
 * 不使用缓存，保证数据实时性
 */

/**
 * 获取单个游戏的统计数据（不缓存，始终实时）
 * @param gameId - 游戏 ID
 * @returns 统计数据（likes, dislikes, playCount, viewCount）
 */
export async function getGameRealtimeStats(gameId: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        likes: true,
        dislikes: true,
        playCount: true,
        viewCount: true,
      },
    })

    if (!game) {
      return {
        likes: 0,
        dislikes: 0,
        playCount: 0,
        viewCount: 0,
      }
    }

    return game
  } catch (error) {
    console.error("获取游戏统计数据失败:", error)
    return {
      likes: 0,
      dislikes: 0,
      playCount: 0,
      viewCount: 0,
    }
  }
}
