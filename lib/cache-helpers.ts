/**
 * 缓存配置常量
 * 提供标准化的缓存标签和重新验证时间
 */

/**
 * 缓存标签常量
 * 用于失效特定类型的缓存
 */
export const CACHE_TAGS = {
  LANGUAGES: "languages",
  CATEGORIES: "categories",
  TAGS: "tags",
  PAGE_TYPES: "page-types",
  GAMES: "games",
  FEATURED_GAMES: "featured-games",
  AI_CONFIGS: "ai-configs", // AI 配置缓存
  IMPORT_PLATFORMS: "import-platforms", // 导入平台缓存
  DASHBOARD_STATS: "dashboard-stats", // 仪表盘统计缓存
} as const

/**
 * 重新验证时间常量（秒）
 *
 * 缓存策略说明：
 * - STATIC: 永不过期，用于极少变化的数据（需要手动失效）
 * - SHORT: 1分钟，用于需要快速更新的数据
 * - MEDIUM: 5分钟，用于包含统计数据的内容（推荐用于分类、游戏列表）
 * - STATS_SHORT: 30分钟，用于统计数据（游戏数量等）
 * - LONG: 1小时，用于相对稳定的配置数据
 * - BASE_DATA: 6小时，用于基础数据（名称、描述等）
 * - VERY_LONG: 24小时，用于几乎不变的基础数据（慎用）
 */
export const REVALIDATE_TIME = {
  STATIC: false, // 永不过期（需要手动失效）
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟 ✅ 推荐用于包含统计数据的查询
  STATS_SHORT: 1800, // 30分钟 - 用于统计数据（游戏数量等）
  LONG: 3600, // 1小时
  BASE_DATA: 21600, // 6小时 - 用于基础数据（名称、描述、slug、icon等）
  VERY_LONG: 86400, // 24小时 ⚠️ 不建议用于包含统计数据的查询
} as const
