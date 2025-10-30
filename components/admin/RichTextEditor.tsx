"use client"

import { memo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { CharacterCount } from '@tiptap/extensions'
import { customTextCounter } from '@/lib/character-count-helpers'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Minus,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AiChatPanel } from './AiChatPanel'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  // AI 助手相关
  gameId?: string         // 游戏 ID（用于保存对话历史）
  keywords?: string       // 关键词（从表单获取）
  locale?: string         // 当前语言
  // 字符统计相关
  characterLimit?: number // 字符数限制（使用"中文=2"统计）
  showCharacterCount?: boolean // 是否显示字符统计（默认 true）
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  icon: LucideIcon
  title: string
}

function ToolbarButton({ onClick, isActive, disabled, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-9 w-9 p-0 transition-all duration-200 ${
        isActive
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

const COLORS = [
  { name: '黑色', value: '#000000' },
  { name: '深灰', value: '#374151' },
  { name: '灰色', value: '#6B7280' },
  { name: '红色', value: '#EF4444' },
  { name: '橙色', value: '#F97316' },
  { name: '黄色', value: '#EAB308' },
  { name: '绿色', value: '#10B981' },
  { name: '青色', value: '#06B6D4' },
  { name: '蓝色', value: '#3B82F6' },
  { name: '紫色', value: '#8B5CF6' },
  { name: '粉色', value: '#EC4899' },
]

const HIGHLIGHT_COLORS = [
  { name: '黄色', value: '#FEF3C7' },
  { name: '绿色', value: '#D1FAE5' },
  { name: '蓝色', value: '#DBEAFE' },
  { name: '红色', value: '#FEE2E2' },
  { name: '紫色', value: '#EDE9FE' },
  { name: '粉色', value: '#FCE7F3' },
]

// ✅ 优化：使用 React.memo 避免不必要的重新渲染
const RichTextEditorComponent = ({
  content,
  onChange,
  placeholder,
  className,
  gameId,
  keywords,
  locale = 'en',
  characterLimit,
  showCharacterCount = true,
}: RichTextEditorProps) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || '开始输入内容...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer transition-colors',
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
      CharacterCount.configure({
        textCounter: customTextCounter, // 使用自定义统计：中文字符=2字节
        limit: characterLimit || null,  // 字符限制（可选）
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // ✅ 保存为 JSON 格式，而非 HTML
      // 这样可以保留完整的文档结构，支持更好的渲染和处理
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-5 bg-white',
      },
    },
  })

  // 同步外部 content 变化到编辑器
  useEffect(() => {
    if (editor && content !== JSON.stringify(editor.getJSON())) {
      // 保存当前光标位置
      const { from } = editor.state.selection

      // 更新内容（支持 HTML 和 JSON 两种格式）
      try {
        // 尝试解析为 JSON
        const parsedContent = JSON.parse(content)
        editor.commands.setContent(parsedContent)
      } catch {
        // 如果解析失败，当作 HTML 处理（向后兼容）
        editor.commands.setContent(content)
      }

      // 尝试恢复光标位置（如果位置仍然有效）
      try {
        if (from <= editor.state.doc.content.size) {
          editor.commands.setTextSelection(from)
        }
      } catch (e) {
        // 如果恢复失败，忽略错误
      }
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div className={`border rounded-lg shadow-sm ${className}`}>
        <div className="border-b p-3 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="h-9 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-5 min-h-[300px] bg-gray-50 animate-pulse" />
      </div>
    )
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('输入链接 URL:', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('输入图片 URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run()
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={Bold}
              title="粗体 (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={Italic}
              title="斜体 (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={UnderlineIcon}
              title="下划线 (Ctrl+U)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              icon={Strikethrough}
              title="删除线"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              icon={Code}
              title="行内代码"
            />
          </div>

          {/* Color */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="文字颜色"
                  className="h-9 w-9 p-0 hover:bg-gray-100"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">选择文字颜色</p>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().setColor(color.value).run()
                          setColorPickerOpen(false)
                        }}
                        className="h-8 w-8 rounded-md border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run()
                      setColorPickerOpen(false)
                    }}
                    className="w-full"
                  >
                    清除颜色
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={highlightPickerOpen} onOpenChange={setHighlightPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="背景高亮"
                  className="h-9 w-9 p-0 hover:bg-gray-100"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">选择高亮颜色</p>
                  <div className="grid grid-cols-3 gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().setHighlight({ color: color.value }).run()
                          setHighlightPickerOpen(false)
                        }}
                        className="h-10 rounded-md border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run()
                      setHighlightPickerOpen(false)
                    }}
                    className="w-full"
                  >
                    清除高亮
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Headings */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              icon={Heading1}
              title="一级标题"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              icon={Heading2}
              title="二级标题"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              icon={Heading3}
              title="三级标题"
            />
          </div>

          {/* Text alignment */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              icon={AlignLeft}
              title="左对齐"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              icon={AlignCenter}
              title="居中"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              icon={AlignRight}
              title="右对齐"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              icon={AlignJustify}
              title="两端对齐"
            />
          </div>

          {/* Lists */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              icon={List}
              title="无序列表"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              icon={ListOrdered}
              title="有序列表"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              icon={Quote}
              title="引用块"
            />
          </div>

          {/* Media */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive('link')}
              icon={LinkIcon}
              title="插入链接"
            />
            <ToolbarButton
              onClick={addImage}
              icon={ImageIcon}
              title="插入图片"
            />
            <ToolbarButton
              onClick={addHorizontalRule}
              icon={Minus}
              title="插入分隔线"
            />
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-0.5 bg-white rounded-md p-0.5 shadow-sm">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              icon={Undo}
              title="撤销 (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              icon={Redo}
              title="重做 (Ctrl+Y)"
            />
          </div>

          {/* AI 助手 */}
          <div className="ml-auto">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowAiPanel(true)}
              className="h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 助手
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative bg-white">
        <EditorContent
          editor={editor}
          className="tiptap-editor"
        />
      </div>

      {/* Character count footer */}
      {showCharacterCount && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* 字符统计 */}
            <span className={`font-medium ${
              characterLimit && editor?.storage.characterCount?.characters() > characterLimit
                ? 'text-red-600'
                : 'text-gray-700'
            }`}>
              {editor?.storage.characterCount?.characters() || 0}
              {characterLimit && ` / ${characterLimit}`} 字符
            </span>

            {/* 单词统计 */}
            <span className="text-gray-500">
              {editor?.storage.characterCount?.words() || 0} 单词
            </span>

            {/* 进度条（如果设置了字符限制） */}
            {characterLimit && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (editor?.storage.characterCount?.characters() || 0) > characterLimit
                        ? 'bg-red-500'
                        : (editor?.storage.characterCount?.characters() || 0) > characterLimit * 0.9
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(((editor?.storage.characterCount?.characters() || 0) / characterLimit) * 100, 100)}%`
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {Math.round(((editor?.storage.characterCount?.characters() || 0) / characterLimit) * 100)}%
                </span>
              </div>
            )}

            {/* 统计方式说明 */}
            <span className="text-gray-400 text-[10px]">
              (中文=2，英文=1)
            </span>
          </div>

          <span className="text-gray-400">
            Tip: 使用 Ctrl+B 加粗，Ctrl+I 斜体
          </span>
        </div>
      )}

      {/* Enhanced styles */}
      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          outline: none;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap-editor .ProseMirror h1 {
          font-size: 2.25em;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #111827;
          letter-spacing: -0.025em;
        }

        .tiptap-editor .ProseMirror h2 {
          font-size: 1.75em;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
          letter-spacing: -0.025em;
        }

        .tiptap-editor .ProseMirror h3 {
          font-size: 1.375em;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .tiptap-editor .ProseMirror p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #374151;
        }

        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          padding-left: 1.75rem;
          margin-bottom: 1rem;
        }

        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor .ProseMirror ul ul {
          list-style-type: circle;
        }

        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor .ProseMirror li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #374151;
        }

        .tiptap-editor .ProseMirror li p {
          margin-bottom: 0.5rem;
        }

        .tiptap-editor .ProseMirror blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.25rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 1rem;
          background-color: #f9fafb;
          color: #4b5563;
          font-style: italic;
          border-radius: 0 0.375rem 0.375rem 0;
        }

        .tiptap-editor .ProseMirror code {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-family: 'Courier New', Consolas, Monaco, monospace;
          font-size: 0.875em;
          color: #dc2626;
          font-weight: 500;
        }

        .tiptap-editor .ProseMirror pre {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1.25rem;
          margin-bottom: 1rem;
          overflow-x: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tiptap-editor .ProseMirror pre code {
          background-color: transparent;
          border: none;
          color: inherit;
          padding: 0;
          font-size: 0.875em;
        }

        .tiptap-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-color: #93c5fd;
          text-underline-offset: 2px;
          transition: all 0.2s;
        }

        .tiptap-editor .ProseMirror a:hover {
          color: #1d4ed8;
          text-decoration-color: #2563eb;
        }

        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .tiptap-editor .ProseMirror img:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2.5rem 0;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          height: 2px;
        }

        .tiptap-editor .ProseMirror mark {
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
        }

        .tiptap-editor .ProseMirror strong {
          font-weight: 700;
          color: #111827;
        }

        .tiptap-editor .ProseMirror em {
          font-style: italic;
        }

        .tiptap-editor .ProseMirror u {
          text-decoration: underline;
        }

        .tiptap-editor .ProseMirror s {
          text-decoration: line-through;
        }

        /* Text alignment */
        .tiptap-editor .ProseMirror [style*="text-align: left"] {
          text-align: left;
        }

        .tiptap-editor .ProseMirror [style*="text-align: center"] {
          text-align: center;
        }

        .tiptap-editor .ProseMirror [style*="text-align: right"] {
          text-align: right;
        }

        .tiptap-editor .ProseMirror [style*="text-align: justify"] {
          text-align: justify;
        }

        /* Selection */
        .tiptap-editor .ProseMirror ::selection {
          background-color: #dbeafe;
        }

        /* Focus styles */
        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }

        /* Scrollbar */
        .tiptap-editor .ProseMirror::-webkit-scrollbar {
          width: 8px;
        }

        .tiptap-editor .ProseMirror::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .tiptap-editor .ProseMirror::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .tiptap-editor .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* AI 对话面板 */}
      {showAiPanel && (
        <AiChatPanel
          onClose={() => setShowAiPanel(false)}
          onInsert={(content) => {
            editor.commands.insertContent(content)
            setShowAiPanel(false)
          }}
          editorContent={editor.getHTML()}
          selectedText={editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          )}
          gameId={gameId}
          keywords={keywords}
          locale={locale}
        />
      )}
    </div>
  )
}

// ✅ 导出 memo 包装的组件，并自定义比较函数
export const RichTextEditor = memo(RichTextEditorComponent, (prevProps, nextProps) => {
  // 只有这些 props 变化时才重新渲染
  return (
    prevProps.content === nextProps.content &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.gameId === nextProps.gameId &&
    prevProps.keywords === nextProps.keywords &&
    prevProps.locale === nextProps.locale &&
    prevProps.characterLimit === nextProps.characterLimit &&
    prevProps.showCharacterCount === nextProps.showCharacterCount
  )
})
