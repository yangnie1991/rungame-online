"use client"

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount } from '@tiptap/extensions'

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>测试内容 Hello World</p>')

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount, // 使用官方默认配置，不做任何自定义
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  // 调试信息
  console.log('Editor:', editor)
  console.log('CharacterCount storage:', editor?.storage.characterCount)
  console.log('Characters:', editor?.storage.characterCount?.characters())
  console.log('Words:', editor?.storage.characterCount?.words())

  if (!editor) {
    return <div className="p-8">Loading editor...</div>
  }

  const chars = editor.storage.characterCount?.characters() || 0
  const words = editor.storage.characterCount?.words() || 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tiptap 官方 CharacterCount 测试</h1>

      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="font-semibold mb-2 text-purple-900">📝 说明</h2>
        <div className="text-sm text-purple-800 space-y-1">
          <div>✅ 使用 Tiptap 官方原版 CharacterCount 扩展</div>
          <div>✅ 无任何自定义配置</div>
          <div>✅ 默认统计方式: <code className="bg-purple-100 px-1 rounded">text.length</code></div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">调试信息</h2>
        <div className="text-sm space-y-1">
          <div>Editor 对象: {editor ? '✅ 已加载' : '❌ 未加载'}</div>
          <div>CharacterCount 扩展: {editor?.storage.characterCount ? '✅ 已加载' : '❌ 未加载'}</div>
          <div>characters 函数: {typeof editor?.storage.characterCount?.characters === 'function' ? '✅ 可用' : '❌ 不可用'}</div>
          <div>words 函数: {typeof editor?.storage.characterCount?.words === 'function' ? '✅ 可用' : '❌ 不可用'}</div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <EditorContent
          editor={editor}
          className="prose max-w-none p-4 min-h-[200px] bg-white"
        />

        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-blue-600">
              {chars} 字符
            </span>
            <span className="font-bold text-lg text-green-600">
              {words} 单词
            </span>
            <span className="text-xs text-gray-500">
              (Tiptap 官方默认: text.length)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">测试用例（官方 text.length 统计）：</h3>
        <div className="space-y-2 text-sm">
          <button
            onClick={() => editor.commands.setContent('<p>Hello World</p>')}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 block"
          >
            纯英文: "Hello World" → 官方统计应显示 <strong>11</strong> 字符
          </button>
          <button
            onClick={() => editor.commands.setContent('<p>你好世界</p>')}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 block"
          >
            纯中文: "你好世界" → 官方统计应显示 <strong>4</strong> 字符 (每个汉字=1)
          </button>
          <button
            onClick={() => editor.commands.setContent('<p>Hello 世界</p>')}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 block"
          >
            中英混合: "Hello 世界" → 官方统计应显示 <strong>8</strong> 字符
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">当前 HTML:</h3>
        <pre className="text-xs overflow-auto">{content}</pre>
      </div>
    </div>
  )
}
