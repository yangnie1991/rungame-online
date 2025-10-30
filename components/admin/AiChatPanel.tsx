"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  type PromptTemplate,
} from "@/lib/ai-prompt-templates"
import { X, Send, Sparkles, Copy, Check, RotateCcw } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiChatPanelProps {
  onClose: () => void
  onInsert: (content: string) => void
  editorContent?: string
  selectedText?: string
  gameId?: string
  keywords?: string
  locale?: string
}

export function AiChatPanel({
  onClose,
  onInsert,
  editorContent,
  selectedText,
  gameId,
  keywords,
  locale = 'en',
}: AiChatPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载对话历史
  useEffect(() => {
    async function loadHistory() {
      if (!gameId || !locale) return

      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/ai/chat-history?gameId=${gameId}&locale=${locale}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages)
            setHistoryLoaded(true)
          }
        }
      } catch (error) {
        console.error('加载对话历史失败:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  }, [gameId, locale])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 选择模板后自动发送第一条消息
  const handleSelectTemplate = async (templateId: string) => {
    const template = getTemplateById(templateId)
    if (!template) return

    setSelectedTemplate(template)
    setMessages([]) // 清空之前的对话

    // 生成第一条用户消息
    const userMessage = template.userPromptTemplate({
      selectedText,
      fullContent: editorContent,
      keywords,
      locale,
    })

    // 添加用户消息
    setMessages([{ role: 'user', content: userMessage }])

    // 自动发送给 AI
    await sendMessage(userMessage, template.systemPrompt)
  }

  // 发送消息
  const sendMessage = async (userMessage?: string, systemPrompt?: string) => {
    const messageToSend = userMessage || input.trim()
    if (!messageToSend || isLoading) return

    const newMessages: Message[] = userMessage
      ? [{ role: 'user', content: messageToSend }]
      : [...messages, { role: 'user', content: messageToSend }]

    if (!userMessage) {
      setMessages(newMessages)
      setInput('')
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: systemPrompt || selectedTemplate?.systemPrompt,
          stream: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '请求失败')
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let assistantMessage = ''

      // 添加一个空的助手消息，用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ''
              if (content) {
                assistantMessage += content
                // 更新最后一条消息
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 保存对话历史到缓存数据库
      if (gameId && locale && assistantMessage) {
        try {
          const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantMessage }]
          await fetch('/api/ai/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId,
              locale,
              messages: finalMessages,
              context: {
                keywords,
                selectedText,
              },
            }),
          })
        } catch (error) {
          console.error('保存对话历史失败:', error)
        }
      }
    } catch (error: any) {
      console.error('AI 对话失败:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ 错误：${error.message || '请求失败'}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 复制消息
  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // 插入到编辑器
  const handleInsert = (content: string) => {
    onInsert(content)
  }

  // 重置对话
  const resetChat = async () => {
    // 如果有 gameId 和 locale，删除服务器上的对话历史
    if (gameId && locale) {
      try {
        await fetch(`/api/ai/chat-history?gameId=${gameId}&locale=${locale}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('删除对话历史失败:', error)
      }
    }

    setMessages([])
    setSelectedTemplate(null)
    setInput('')
    setHistoryLoaded(false)
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI 写作助手</h2>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetChat}
                title="重置对话"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 对话历史加载提示 */}
        {historyLoaded && (
          <div className="mt-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>已加载之前的对话历史</span>
          </div>
        )}

        {isLoadingHistory && (
          <div className="mt-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 flex items-center gap-1.5">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>加载对话历史中...</span>
          </div>
        )}
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedTemplate && messages.length === 0 ? (
          // 选择模板界面
          <div className="p-4 overflow-y-auto">
            <Label className="text-sm font-medium mb-3 block">选择 AI 助手场景：</Label>

            <Tabs defaultValue={TEMPLATE_CATEGORIES[0].id} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                {TEMPLATE_CATEGORIES.slice(0, 3).map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                    {cat.icon} {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TEMPLATE_CATEGORIES.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-2">
                  {PROMPT_TEMPLATES.filter(t => t.category === category.id).map(template => (
                    <Card
                      key={template.id}
                      className="p-3 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          {template.requiresKeywords && !keywords && (
                            <p className="text-xs text-amber-600 mt-1">⚠️ 需要关键词</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {/* 上下文信息 */}
            <Card className="mt-4 p-3 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-sm mb-2 text-blue-900">当前上下文：</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>📍 语言: {locale}</div>
                {keywords && <div>🔑 关键词: {keywords}</div>}
                {selectedText && (
                  <div>✂️ 选中文本: {selectedText.substring(0, 50)}...</div>
                )}
                {!selectedText && editorContent && (
                  <div>📄 编辑器内容: {editorContent.substring(0, 50)}...</div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          // 对话界面
          <>
            {/* 当前使用的模板 */}
            {selectedTemplate && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedTemplate.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{selectedTemplate.name}</div>
                    <div className="text-xs text-gray-600">{selectedTemplate.description}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={message.role === 'user' ? 'text-white' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {message.role === 'assistant' && !isLoading && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content, index)}
                          className="text-xs h-7"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              复制
                            </>
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInsert(message.content)}
                          className="text-xs h-7 bg-purple-600 hover:bg-purple-700"
                        >
                          插入到编辑器
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span className="text-sm">AI 正在思考...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="继续对话，调整内容..."
                  disabled={isLoading}
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (input.trim() && !isLoading) {
                        sendMessage()
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
