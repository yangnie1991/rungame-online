/**
 * ============================================
 * 游戏数据查询统一导出
 * ============================================
 *
 * 本文件统一导出所有游戏相关的查询函数
 * 模块组织：
 * - featured.ts - 特色游戏（精选、最受欢迎、热门、最新）
 * - browse.ts - 浏览游戏（按分类、标签、全部游戏）
 * - detail.ts - 游戏详情（单个游戏、推荐游戏）
 * - stats.ts - 游戏统计（总数、分类统计、标签统计）
 * - utils.ts - 工具函数（播放计数等）
 */

// 特色游戏
export { getFeaturedGames, getMostPlayedGames, getTrendingGames, getNewestGames } from "./featured"

// 浏览游戏
export {
  getGamesByCategory,
  getGamesByTag,
  getGamesByTagSlug,
  getGamesByTagWithPagination,
  getAllGames,
} from "./browse"

// 游戏详情
export { getGameBySlug, getRecommendedGames, getPublishedGames } from "./detail"

// 游戏统计（缓存版本）
export { getTotalGamesCount, getGamesCategoryStats, getGamesTagStats } from "./stats"

// 工具函数
export { incrementPlayCount } from "./utils"
