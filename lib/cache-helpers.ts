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
 */
export const REVALIDATE_TIME = {
  STATIC: false, // 永不过期（需要手动失效）
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟
  LONG: 3600, // 1小时
  VERY_LONG: 86400, // 24小时
} as const
