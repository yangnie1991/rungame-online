import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDecryptedAiConfig } from '@/lib/ai-config'

/**
 * AI 对话 API（支持流式响应）
 *
 * POST /api/ai/chat
 *
 * 用于 TipTap 编辑器的对话式 AI 助手
 * 支持多轮对话和流式输出
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份（仅管理员可用）
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { messages, systemPrompt, stream = true } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: '缺少 messages 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 获取并解密 AI 配置
    const aiConfig = await getDecryptedAiConfig()

    // 从模型配置获取参数
    const modelConfig = aiConfig.modelConfig as any
    const defaultModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)

    if (!defaultModel) {
      return new Response(
        JSON.stringify({ error: '未找到可用的默认模型' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 构建完整的消息列表
    const fullMessages = [
      {
        role: 'system',
        content: systemPrompt || '你是一位专业的内容创作助手。',
      },
      ...messages,
    ]

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
      'X-Title': 'RunGame AI Assistant',
    }

    // 调用 AI API（使用配置中的参数）
    const response = await fetch(aiConfig.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: defaultModel.id,
        messages: fullMessages,
        temperature: defaultModel.temperature || 0.7,
        max_tokens: defaultModel.maxTokens || 2000,
        stream, // 可被前端覆盖
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({
          error: `${aiConfig.provider} API 错误`,
          message: error.error?.message || '未知错误',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 如果是流式响应，直接转发
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // 非流式响应
    const data = await response.json()
    const result = data.choices[0]?.message?.content || ''

    return new Response(
      JSON.stringify({
        success: true,
        message: result,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('AI 对话失败:', error)

    return new Response(
      JSON.stringify({
        error: 'AI 对话失败',
        message: error.message || '未知错误',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
