/**
 * 内容渲染器组件
 * 根据 GameInfo 的 ContentSection 类型动态渲染 Tiptap JSON 内容
 */

import { GameInfo } from "@/lib/types/game-info"
import { renderTiptapToHTML, parseTiptapContent } from "@/lib/tiptap-renderer"

interface ContentRendererProps {
  gameInfo: GameInfo | null
  locale: string
}

/**
 * 区块标题的翻译映射
 */
const SECTION_LABELS_I18N: Record<string, Record<string, string>> = {
  controls: {
    en: "Game Controls",
    zh: "游戏控制",
  },
  howToPlay: {
    en: "How to Play",
    zh: "如何进行游戏",
  },
  gameDetails: {
    en: "Game Details",
    zh: "游戏详细信息",
  },
  faq: {
    en: "FAQ",
    zh: "常见问题",
  },
  extras: {
    en: "More Information",
    zh: "更多信息",
  },
}

/**
 * 获取区块标题的翻译
 */
function getSectionLabel(key: string, locale: string): string {
  return SECTION_LABELS_I18N[key]?.[locale] || SECTION_LABELS_I18N[key]?.["en"] || formatKeyToTitle(key)
}

/**
 * 格式化 key 为可读标题
 */
function formatKeyToTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function ContentRenderer({ gameInfo, locale }: ContentRendererProps) {
  if (!gameInfo || typeof gameInfo !== 'object' || Object.keys(gameInfo).length === 0) {
    return null
  }

  // 将对象转为数组并按 order 排序
  const sections = Object.entries(gameInfo)
    .map(([key, section]) => ({ key, ...section }))
    .sort((a, b) => a.order - b.order)
    .filter((section) => {
      // 过滤掉空内容
      if (!section.content) return false

      // 解析内容
      const parsed = parseTiptapContent(section.content)
      if (!parsed) return false

      // 检查是否有实际内容
      if (!parsed.content || parsed.content.length === 0) return false

      return true
    })

  // 如果没有有效的区块，不显示
  if (sections.length === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => {
        // 解析 Tiptap 内容
        const parsed = parseTiptapContent(section.content)
        if (!parsed) return null

        // 渲染为 HTML
        const html = renderTiptapToHTML(parsed)

        // 获取区块标题
        const sectionLabel = getSectionLabel(section.key, locale)

        // extras 区块不显示标题，其他区块显示标题
        const showTitle = section.key !== 'extras'

        return (
          <div
            key={section.key}
            // className={`px-6 py-2 prose prose-slate max-w-none ${!showTitle ? '[&>div>*:first-child]:mt-0' : ''}`}
          >
            {showTitle && (
              <h2>{sectionLabel}</h2>
            )}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )
      })}
    </>
  )
}
