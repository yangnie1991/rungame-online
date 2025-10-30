/**
 * Tiptap 内容渲染辅助函数
 *
 * 使用 @tiptap/html 的 generateHTML() 将 Tiptap JSON 格式转换为 HTML
 * 支持服务端渲染（SSR）和客户端渲染
 */

import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

/**
 * Tiptap 扩展配置
 * 必须与编辑器使用的扩展保持一致
 */
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary hover:underline transition-colors cursor-pointer',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg shadow-md my-4',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Underline,
  Highlight.configure({
    multicolor: true,
  }),
  TextStyle,
  Color,
]

/**
 * 将 Tiptap JSON 格式渲染为 HTML 字符串
 *
 * @param json - Tiptap JSON 文档对象
 * @returns HTML 字符串
 *
 * @example
 * ```typescript
 * const json = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'paragraph',
 *       content: [{ type: 'text', text: 'Hello World!' }]
 *     }
 *   ]
 * }
 *
 * const html = renderTiptapToHTML(json)
 * // 输出: '<p>Hello World!</p>'
 * ```
 */
export function renderTiptapToHTML(json: any): string {
  try {
    // 验证 JSON 格式
    if (!json || typeof json !== 'object') {
      console.warn('Invalid Tiptap JSON: expected object, got', typeof json)
      return '<p>内容格式错误</p>'
    }

    // 验证是否为有效的 Tiptap 文档
    if (json.type !== 'doc') {
      console.warn('Invalid Tiptap JSON: expected type "doc", got', json.type)
      return '<p>内容格式错误</p>'
    }

    // 使用 generateHTML 转换
    let html = generateHTML(json, extensions)

    // 清理不必要的 xmlns 属性
    // generateHTML 会在某些元素上添加 xmlns="http://www.w3.org/1999/xhtml"
    // 这在标准 HTML 中是不必要的,可能会影响样式
    html = html.replace(/\s*xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '')

    return html
  } catch (error) {
    console.error('Failed to render Tiptap content:', error)
    console.error('JSON content:', JSON.stringify(json, null, 2))

    // 降级处理：尝试提取纯文本
    try {
      const text = extractPlainText(json)
      if (text) {
        return `<p>${escapeHtml(text)}</p>`
      }
    } catch (e) {
      // 忽略提取失败
    }

    return '<p>内容渲染失败</p>'
  }
}

/**
 * 从 Tiptap JSON 中提取纯文本
 * 用于渲染失败时的降级处理
 */
function extractPlainText(node: any): string {
  if (!node || typeof node !== 'object') {
    return ''
  }

  // 如果是文本节点
  if (node.type === 'text' && node.text) {
    return node.text
  }

  // 递归处理内容数组
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(' ')
  }

  return ''
}

/**
 * HTML 转义函数
 * 防止 XSS 攻击
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/**
 * 验证是否为有效的 Tiptap JSON
 */
export function isValidTiptapJSON(content: any): boolean {
  if (!content || typeof content !== 'object') {
    return false
  }

  if (content.type !== 'doc') {
    return false
  }

  if (!Array.isArray(content.content)) {
    return false
  }

  return true
}

/**
 * 解析 Tiptap 内容（支持字符串或对象）
 *
 * @param content - Tiptap 内容（JSON 字符串或对象）
 * @returns Tiptap JSON 对象或 null
 */
export function parseTiptapContent(content: string | any): any | null {
  try {
    // 如果已经是对象，直接验证
    if (typeof content === 'object') {
      return isValidTiptapJSON(content) ? content : null
    }

    // 如果是字符串，尝试解析
    if (typeof content === 'string') {
      const parsed = JSON.parse(content)
      return isValidTiptapJSON(parsed) ? parsed : null
    }

    return null
  } catch (error) {
    console.warn('Failed to parse Tiptap content:', error)
    return null
  }
}
