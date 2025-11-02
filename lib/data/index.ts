/**
 * ============================================
 * 数据层统一导出
 * ============================================
 * 本文件汇总所有数据查询函数，提供统一的导入入口
 *
 * 使用示例：
 * import { getAllCategories, getGamesByCategory } from "@/lib/data"
 */

// 语言相关
export { getDefaultLanguage, getEnabledLanguages } from "./languages"

// 分类相关
export {
  getAllCategories,
  getAllCategoryTranslationsMap,
  getAllCategoryInfoMap,
  getAllCategoriesDataMap,
  getAllCategoriesFullData,
  getCategoriesBaseData,
  getCategoriesStats,
  getSubCategoriesCount,
  getMainCategories,
  getSubCategories,
  getSubCategoriesByParentId,
  getSubCategoriesByParentSlug,
} from "./categories"

// 标签相关
export {
  getAllTags,
  getAllTagTranslationsMap,
  getAllTagsDataMap,
  getAllTagsInfoMap,
  getTagsBaseData,
  getTagsStats,
} from "./tags"

// 游戏相关（从模块化目录导入）
export {
  // 特色游戏
  getFeaturedGames,
  getMostPlayedGames,
  getTrendingGames,
  getNewestGames,
  // 浏览游戏
  getGamesByCategory,
  getGamesByTag,
  getGamesByTagSlug,
  getGamesByTagWithPagination,
  getAllGames,
  // 搜索游戏
  searchGames,
  // 游戏详情
  getGameBySlug,
  getRecommendedGames,
  getPublishedGames,
  // 游戏统计（缓存版本）
  getTotalGamesCount,
  getGamesCategoryStats,
  getGamesTagStats,
  getGameRealtimeStats,
  // 工具函数
  incrementPlayCount,
} from "./games"

// 页面类型相关
export {
  getAllPageTypes,
  getPageTypeInfo,
  getPageTypeGames,
} from "./page-types"
