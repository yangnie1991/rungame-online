/**
 * PageType 相关的 TypeScript 类型定义
 */

/**
 * 页面内容配置（存储在 pageInfo.content 中）
 */
export interface PageTypeContent {
  /** 详细描述（约 200-300 字符） */
  detailedDescription: string
  /** 特色标签列表 */
  features: Array<{
    icon: string
    text: string
  }>
  /** 底部总结文本（约 150-200 字符） */
  summary: string
}

/**
 * 游戏列表配置（存储在 pageInfo.gameList 中）
 */
export interface GameListConfig {
  /** 筛选条件 */
  filters: Record<string, any>
  /** 排序字段 */
  orderBy: string
  /** 排序方向 */
  orderDirection: 'asc' | 'desc'
  /** 每页数量 */
  pageSize: number
}

/**
 * PageType 的 pageInfo 完整结构
 */
export interface PageInfo {
  /** 游戏列表配置 */
  gameList?: GameListConfig
  /** 页面内容配置 */
  content?: PageTypeContent
}
