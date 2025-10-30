import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDecryptedAiConfig } from '@/lib/ai-config'
import { AVAILABLE_TOOLS, executeTool as executeAiTool } from '@/lib/ai-tools'

export const runtime = 'edge'

/**
 * AI 对话 API（支持工具调用和流式响应）
 *
 * POST /api/ai/chat-with-tools
 *
 * 支持 Function Calling：
 * 1. AI 可以主动调用工具获取数据
 * 2. 对话历史包含工具调用记录
 * 3. 保证对话连贯性
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const {
      messages,
      systemPrompt,
      stream = false,  // 工具调用阶段不使用流式
      enableTools = true  // 是否启用工具调用
    } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '缺少 messages 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取并解密 AI 配置
    const aiConfig = await getDecryptedAiConfig()
    if (!aiConfig) {
      return new Response(JSON.stringify({ error: 'AI 配置未设置' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

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

    // 构建完整消息列表
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    // 调用 AI API
    const requestBody: any = {
      model: defaultModel.id,
      messages: fullMessages,
      temperature: defaultModel.temperature || 0.7,
      max_tokens: defaultModel.maxTokens || 2000,
      stream,
    }

    // 如果启用工具调用，添加工具列表
    if (enableTools) {
      requestBody.tools = AVAILABLE_TOOLS
      requestBody.tool_choice = 'auto'  // AI 自动决定是否调用工具
    }

    const response = await fetch(aiConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
        'X-Title': 'RunGame AI Assistant'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI API 错误:', error)
      return new Response(JSON.stringify({ error: 'AI 服务请求失败' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 如果是流式响应，直接返回
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 非流式：解析响应
    const data = await response.json()

    // 检查是否有工具调用
    const message = data.choices[0]?.message
    if (message?.tool_calls) {
      // 返回工具调用请求（客户端需要执行工具并继续对话）
      return new Response(JSON.stringify({
        type: 'tool_calls',
        tool_calls: message.tool_calls,
        message: message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 正常的文本响应
    return new Response(JSON.stringify({
      type: 'text',
      content: message?.content || '',
      message: message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('AI 对话失败:', error)
    return new Response(JSON.stringify({ error: error.message || 'AI 对话失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 执行工具调用的辅助 API
 *
 * POST /api/ai/execute-tool
 */
export async function executeTool(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { toolName, arguments: toolArgs } = await request.json()

    if (!toolName) {
      return new Response(JSON.stringify({ error: '缺少 toolName 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 执行工具
    const result = await executeAiTool(toolName, toolArgs || {})

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('工具执行失败:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
