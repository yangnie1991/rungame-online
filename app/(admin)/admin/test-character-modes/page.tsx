"use client"

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount } from '@tiptap/extensions'

export default function TestCharacterModesPage() {
  const [content, setContent] = useState('<p>测试内容 Hello World 你好世界</p>')

  // 编辑器 1: 官方默认配置
  const editorDefault = useEditor({
    extensions: [
      StarterKit,
      CharacterCount, // 默认: text.length
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  // 编辑器 2: 中文字符=2字节
  const editorCustom = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        textCounter: (text: string) => {
          let byteLength = 0
          for (const char of text) {
            const code = char.charCodeAt(0)
            if ((code >= 0x4E00 && code <= 0x9FFF) || code > 0x7F) {
              byteLength += 2
            } else {
              byteLength += 1
            }
          }
          return byteLength
        }
      }),
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  // 编辑器 3: Intl.Segmenter（精确字符）
  const editorSegmenter = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        textCounter: (text: string) => {
          return [...new Intl.Segmenter().segment(text)].length
        }
      }),
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  // 编辑器 4: 实际 UTF-8 字节
  const editorUtf8 = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        textCounter: (text: string) => {
          return new TextEncoder().encode(text).length
        }
      }),
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  const testCases = [
    { label: '纯英文', content: '<p>Hello World</p>' },
    { label: '纯中文', content: '<p>你好世界</p>' },
    { label: '中英混合', content: '<p>Hello 世界</p>' },
    { label: 'Emoji', content: '<p>👋你好</p>' },
    { label: '复杂Emoji', content: '<p>👨‍👩‍👧‍👦家庭</p>' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tiptap CharacterCount 配置对比</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold mb-2">📝 说明</h2>
        <p className="text-sm text-gray-700">
          下方展示了 4 种不同的字符统计配置方式。所有编辑器共享同一个内容，您可以在任意编辑器中修改，其他编辑器会同步更新。
        </p>
      </div>

      {/* 测试用例按钮 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-3">快速测试用例：</h3>
        <div className="flex flex-wrap gap-2">
          {testCases.map((test) => (
            <button
              key={test.label}
              onClick={() => {
                editorDefault?.commands.setContent(test.content)
                editorCustom?.commands.setContent(test.content)
                editorSegmenter?.commands.setContent(test.content)
                editorUtf8?.commands.setContent(test.content)
                setContent(test.content)
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              {test.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 个编辑器对比 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 编辑器 1: 默认 */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2">
            <h3 className="font-bold">方式 1: 默认 (text.length)</h3>
            <p className="text-xs text-gray-300">中文和英文都算 1 个字符</p>
          </div>
          <EditorContent
            editor={editorDefault}
            className="prose max-w-none p-4 min-h-[150px] bg-white"
          />
          <div className="border-t bg-gray-50 px-4 py-3 flex items-center gap-4">
            <span className="font-bold text-2xl text-blue-600">
              {editorDefault?.storage.characterCount?.characters() || 0}
            </span>
            <span className="text-sm text-gray-600">字符</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">
              {editorDefault?.storage.characterCount?.words() || 0} 单词
            </span>
          </div>
        </div>

        {/* 编辑器 2: 自定义 */}
        <div className="border-2 border-green-500 rounded-lg overflow-hidden">
          <div className="bg-green-700 text-white px-4 py-2">
            <h3 className="font-bold">方式 2: 中文字符=2字节</h3>
            <p className="text-xs text-green-100">符合用户习惯，适合 SEO</p>
          </div>
          <EditorContent
            editor={editorCustom}
            className="prose max-w-none p-4 min-h-[150px] bg-white"
          />
          <div className="border-t bg-green-50 px-4 py-3 flex items-center gap-4">
            <span className="font-bold text-2xl text-green-600">
              {editorCustom?.storage.characterCount?.characters() || 0}
            </span>
            <span className="text-sm text-gray-600">字符</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">
              {editorCustom?.storage.characterCount?.words() || 0} 单词
            </span>
          </div>
        </div>

        {/* 编辑器 3: Intl.Segmenter */}
        <div className="border-2 border-purple-500 rounded-lg overflow-hidden">
          <div className="bg-purple-700 text-white px-4 py-2">
            <h3 className="font-bold">方式 3: Intl.Segmenter</h3>
            <p className="text-xs text-purple-100">Tiptap 官方推荐，处理复杂 emoji</p>
          </div>
          <EditorContent
            editor={editorSegmenter}
            className="prose max-w-none p-4 min-h-[150px] bg-white"
          />
          <div className="border-t bg-purple-50 px-4 py-3 flex items-center gap-4">
            <span className="font-bold text-2xl text-purple-600">
              {editorSegmenter?.storage.characterCount?.characters() || 0}
            </span>
            <span className="text-sm text-gray-600">字符</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">
              {editorSegmenter?.storage.characterCount?.words() || 0} 单词
            </span>
          </div>
        </div>

        {/* 编辑器 4: UTF-8 */}
        <div className="border-2 border-orange-500 rounded-lg overflow-hidden">
          <div className="bg-orange-700 text-white px-4 py-2">
            <h3 className="font-bold">方式 4: UTF-8 字节长度</h3>
            <p className="text-xs text-orange-100">实际存储大小</p>
          </div>
          <EditorContent
            editor={editorUtf8}
            className="prose max-w-none p-4 min-h-[150px] bg-white"
          />
          <div className="border-t bg-orange-50 px-4 py-3 flex items-center gap-4">
            <span className="font-bold text-2xl text-orange-600">
              {editorUtf8?.storage.characterCount?.characters() || 0}
            </span>
            <span className="text-sm text-gray-600">字节</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">
              {editorUtf8?.storage.characterCount?.words() || 0} 单词
            </span>
          </div>
        </div>
      </div>

      {/* 对比表格 */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3">
          <h3 className="font-bold text-lg">📊 统计结果对比</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">统计方式</th>
                <th className="px-4 py-3 text-center font-semibold">当前统计值</th>
                <th className="px-4 py-3 text-left font-semibold">适用场景</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">默认 (text.length)</div>
                  <div className="text-xs text-gray-500">中文=1，英文=1</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {editorDefault?.storage.characterCount?.characters() || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  通用场景，简单快速
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">中文字符=2字节</div>
                  <div className="text-xs text-gray-500">中文=2，英文=1</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-2xl font-bold text-green-600">
                    {editorCustom?.storage.characterCount?.characters() || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  SEO 元标签，符合用户习惯
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">Intl.Segmenter</div>
                  <div className="text-xs text-gray-500">精确字素簇</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {editorSegmenter?.storage.characterCount?.characters() || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  处理复杂 emoji，国际化
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">UTF-8 字节</div>
                  <div className="text-xs text-gray-500">实际编码大小</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-2xl font-bold text-orange-600">
                    {editorUtf8?.storage.characterCount?.characters() || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  数据库存储，网络传输
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 代码示例 */}
      <div className="mt-8 p-6 bg-gray-900 text-gray-100 rounded-lg">
        <h3 className="font-bold text-lg mb-4 text-white">💻 配置代码示例</h3>

        <div className="space-y-4 text-sm">
          <div>
            <div className="text-blue-400 font-medium mb-2">// 方式 1: 默认配置</div>
            <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{`CharacterCount  // 不需要任何配置`}
            </pre>
          </div>

          <div>
            <div className="text-green-400 font-medium mb-2">// 方式 2: 中文字符=2字节</div>
            <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{`CharacterCount.configure({
  textCounter: (text: string) => {
    let byteLength = 0
    for (const char of text) {
      const code = char.charCodeAt(0)
      if ((code >= 0x4E00 && code <= 0x9FFF) || code > 0x7F) {
        byteLength += 2  // 中文=2字节
      } else {
        byteLength += 1  // 英文=1字节
      }
    }
    return byteLength
  }
})`}
            </pre>
          </div>

          <div>
            <div className="text-purple-400 font-medium mb-2">// 方式 3: Intl.Segmenter（官方推荐）</div>
            <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{`CharacterCount.configure({
  textCounter: (text: string) => {
    return [...new Intl.Segmenter().segment(text)].length
  }
})`}
            </pre>
          </div>

          <div>
            <div className="text-orange-400 font-medium mb-2">// 方式 4: UTF-8 字节长度</div>
            <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
{`CharacterCount.configure({
  textCounter: (text: string) => {
    return new TextEncoder().encode(text).length
  }
})`}
            </pre>
          </div>
        </div>
      </div>

      {/* 详细文档链接 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">📚 详细文档</h3>
        <p className="text-sm text-gray-700 mb-2">
          查看完整的配置说明和更多示例：
        </p>
        <a
          href="/docs/TIPTAP-CHARACTER-COUNT-CONFIG.md"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          docs/TIPTAP-CHARACTER-COUNT-CONFIG.md
        </a>
      </div>
    </div>
  )
}
