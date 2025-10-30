"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import { customTextCounter } from '@/lib/character-count-helpers'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SeoTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  limit: number
  locale: string
  type: 'metaTitle' | 'metaDescription'
  disabled?: boolean
  className?: string
}

/**
 * SEO 文本输入框 - 使用 Tiptap 单行编辑器
 *
 * 特点：
 * - 单行输入（Enter 键不换行）
 * - 自定义字符计数（中文=2，英文=1）
 * - 实时显示字符数和推荐范围
 * - 导出纯文本（无 HTML 标签）
 * - 用于 metaTitle 和 metaDescription（关键词请使用 KeywordsTagInput）
 */
export function SeoTextInput({
  value,
  onChange,
  placeholder,
  limit,
  locale,
  type,
  disabled = false,
  className
}: SeoTextInputProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用所有块级元素，只保留纯文本
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        // 保留基础的文本格式（加粗、斜体等）
        bold: false,
        italic: false,
        strike: false,
        code: false,
        // 禁用硬换行和段落
        hardBreak: false,
        paragraph: {
          HTMLAttributes: {
            class: 'inline'
          }
        }
      }),
      CharacterCount.configure({
        limit,
        mode: 'textSize',
        // 自定义计数器：中文=2，英文=1
        textCounter: customTextCounter
      })
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false, // 避免 SSR hydration 不匹配
    onUpdate: ({ editor }) => {
      // 导出纯文本（移除所有 HTML 标签）
      const text = editor.getText()
      onChange(text)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none',
          'min-h-[40px] px-3 py-2',
          'border border-input rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // 单行样式
          'whitespace-nowrap overflow-x-auto',
          className
        ),
        placeholder
      },
      // 禁止换行
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      }
    }
  })

  // 当外部 value 改变时，更新编辑器内容
  useEffect(() => {
    if (!editor) return

    const currentText = editor.getText()
    const newValue = value || ''

    // 只有当值真的不同时才更新（避免光标跳动）
    if (currentText !== newValue) {
      // 使用 transaction 来更新内容，保持光标位置
      editor.commands.setContent(newValue, false)
    }
  }, [value, editor])

  // 获取当前字符数
  const count = editor?.storage.characterCount.characters() || 0

  // 根据语言和类型获取推荐范围
  const getRecommendedRange = () => {
    const isChinese = locale === 'zh'

    if (type === 'metaTitle') {
      return isChinese ? '25-30 汉字' : '50-60 chars'
    } else if (type === 'metaDescription') {
      return isChinese ? '70-80 汉字' : '140-160 chars'
    }
    return ''
  }

  // 判断状态
  const isOverLimit = count > limit
  const isNearLimit = count >= limit * 0.9 && count <= limit
  const isUnderRecommended = (() => {
    const isChinese = locale === 'zh'
    if (type === 'metaTitle') {
      return count < (isChinese ? 50 : 100) // 25 汉字 × 2 = 50 单位，50 chars × 1 = 50 单位
    } else if (type === 'metaDescription') {
      return count < (isChinese ? 140 : 280) // 70 汉字 × 2 = 140 单位
    }
    return false
  })()

  // 获取颜色类
  const getColorClass = () => {
    if (isOverLimit) return 'text-red-600 font-semibold'
    if (isNearLimit) return 'text-amber-600 font-medium'
    if (isUnderRecommended) return 'text-gray-400'
    return 'text-green-600'
  }

  const isChinese = locale === 'zh'
  const unit = isChinese ? '单位' : 'chars'
  const recommendedRange = getRecommendedRange()

  return (
    <div className="space-y-1">
      <EditorContent editor={editor} />

      {/* 字符计数显示 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {recommendedRange && `推荐: ${recommendedRange}`}
        </span>
        <div className="flex items-center gap-2">
          <span className={getColorClass()}>
            {count} / {limit} {unit}
          </span>
          {isOverLimit && (
            <span className="text-red-600">⚠️ 超出限制</span>
          )}
        </div>
      </div>
    </div>
  )
}
