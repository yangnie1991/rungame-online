"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 仪表盘统计数据缓存层
 * ============================================
 *
 * 缓存仪表盘的统计数据（游戏、分类、标签、语言数量）
 *
 * 缓存策略：
 * - 时间：5分钟重新验证
 * - 原因：统计数据不需要实时，但也不应该太陈旧
 * - 机制：使用 unstable_cache 持久化缓存
 */

/**
 * 内部数据库查询函数 - 获取仪表盘统计
 */
async function fetchDashboardStatsFromDB() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchDashboardStatsFromDB - 执行数据库查询`)
  }

  const [gamesCount, categoriesCount, tagsCount, languagesCount] = await Promise.all([
    prisma.game.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.language.count(),
  ])

  return { gamesCount, categoriesCount, tagsCount, languagesCount }
}

/**
 * 获取仪表盘统计数据（缓存版本）
 */
export const getDashboardStats = unstable_cache(
  async () => fetchDashboardStatsFromDB(),
  ["dashboard-stats"],
  {
    revalidate: REVALIDATE_TIME.MEDIUM, // 5分钟
    tags: [CACHE_TAGS.DASHBOARD_STATS],
  }
)
