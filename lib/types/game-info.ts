/**
 * GameInfo 类型定义
 *
 * 专注于存储富文本编辑器内容（Tiptap JSON 格式）
 *
 * 用于 Game.gameInfo 和 GameTranslation.translationInfo 字段
 *
 * @see Game.gameInfo - 英文富文本内容
 * @see GameTranslation.translationInfo - 翻译富文本内容
 *
 * 注意：媒体资源（截图、视频）存储在主表的 screenshots/videos 数组字段中，不需要翻译
 */

/**
 * Tiptap JSON 文档类型
 *
 * Tiptap 编辑器的标准 JSON 输出格式
 */
export interface TiptapDocument {
  type: 'doc'
  content?: TiptapNode[]
}

/**
 * Tiptap 节点类型
 */
export interface TiptapNode {
  type: string
  attrs?: Record<string, any>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
  [key: string]: any
}

/**
 * Tiptap 标记类型
 */
export interface TiptapMark {
  type: string
  attrs?: Record<string, any>
  [key: string]: any
}

/**
 * 内容区块
 *
 * 存储单个富文本内容区块（如"游戏控制"、"如何游玩"等）
 */
export interface ContentSection {
  /**
   * 内容数据（Tiptap JSON 格式）
   * 存储为 JSON 字符串或 Tiptap 文档对象
   */
  content: string | TiptapDocument

  /**
   * 显示顺序（从 1 开始）
   */
  order: number
}

/**
 * GameInfo 类型
 *
 * 对象格式，key 为区块标识符
 *
 * @example
 * {
 *   "controls": {
 *     "content": "{\"type\":\"doc\",\"content\":[...]}",
 *     "order": 1
 *   },
 *   "howToPlay": {
 *     "content": "{...}",
 *     "order": 2
 *   }
 * }
 */
export type GameInfo = Record<string, ContentSection>

/**
 * 预定义的内容区块键名
 */
export const CONTENT_SECTION_KEYS = {
  /** 游戏控制 - 操作方式、按键说明 */
  CONTROLS: 'controls',

  /** 如何进行游戏 - 玩法、规则、技巧 */
  HOW_TO_PLAY: 'howToPlay',

  /** 游戏的详细信息 - 特色、关卡、奖励 */
  GAME_DETAILS: 'gameDetails',

  /** 常见问题 - FAQ */
  FAQ: 'faq',

  /** 其他更多内容 - 更新日志、致谢等 */
  EXTRAS: 'extras',
} as const

/**
 * 内容区块键名类型
 */
export type ContentSectionKey = typeof CONTENT_SECTION_KEYS[keyof typeof CONTENT_SECTION_KEYS]

/**
 * 默认内容区块配置
 */
export const DEFAULT_CONTENT_SECTIONS: Record<ContentSectionKey, Omit<ContentSection, 'content'>> = {
  [CONTENT_SECTION_KEYS.CONTROLS]: { order: 1 },
  [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: { order: 2 },
  [CONTENT_SECTION_KEYS.GAME_DETAILS]: { order: 3 },
  [CONTENT_SECTION_KEYS.FAQ]: { order: 4 },
  [CONTENT_SECTION_KEYS.EXTRAS]: { order: 5 },
}

/**
 * 内容区块标签映射（用于表单显示）
 */
export const CONTENT_SECTION_LABELS: Record<ContentSectionKey, string> = {
  [CONTENT_SECTION_KEYS.CONTROLS]: '游戏控制',
  [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: '如何进行游戏',
  [CONTENT_SECTION_KEYS.GAME_DETAILS]: '游戏的详细信息',
  [CONTENT_SECTION_KEYS.FAQ]: '常见问题',
  [CONTENT_SECTION_KEYS.EXTRAS]: '其他更多内容',
}

/**
 * 内容区块占位符文本
 */
export const CONTENT_SECTION_PLACEHOLDERS: Record<ContentSectionKey, string> = {
  [CONTENT_SECTION_KEYS.CONTROLS]: '描述游戏的操作方式，如鼠标控制、键盘按键、触摸手势等...',
  [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: '说明游戏的玩法规则、目标和技巧...',
  [CONTENT_SECTION_KEYS.GAME_DETAILS]: '介绍游戏的特色功能、关卡设计、奖励系统等...',
  [CONTENT_SECTION_KEYS.FAQ]: '回答玩家常见的问题...',
  [CONTENT_SECTION_KEYS.EXTRAS]: '其他补充信息，如更新日志、致谢、相关链接等...',
}
