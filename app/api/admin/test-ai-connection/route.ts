import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * POST /api/admin/test-ai-connection
 *
 * 测试 AI API 连接
 *
 * 注意：此 API 接收明文 API Key，不从数据库读取
 * 用于在配置表单中测试用户输入的 API Key 是否有效
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { apiKey, baseUrl, modelId, headers } = body

    // 验证必需参数
    if (!apiKey || !baseUrl || !modelId) {
      return NextResponse.json(
        { error: '缺少必需参数：apiKey, baseUrl, modelId' },
        { status: 400 }
      )
    }

    // 发送测试请求到 AI API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(headers || {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: 'Hi, this is a test message. Please respond with "OK".',
          },
        ],
        max_tokens: 10,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API 错误 (${response.status})`

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {
        errorMessage = errorText.substring(0, 200) || errorMessage
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 200 } // 返回 200，让前端处理错误显示
      )
    }

    const data = await response.json()
    const responseContent = data.choices?.[0]?.message?.content || '收到响应'

    return NextResponse.json({
      success: true,
      message: '连接测试成功',
      response: responseContent,
      modelUsed: modelId,
    })

  } catch (error: any) {
    console.error('测试 AI 连接失败:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || '连接测试失败',
      },
      { status: 200 } // 返回 200，让前端处理错误显示
    )
  }
}
