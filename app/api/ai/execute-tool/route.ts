import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { executeTool } from '@/lib/ai-tools'

/**
 * 执行 AI 工具调用
 *
 * POST /api/ai/execute-tool
 *
 * Body: {
 *   toolName: string,
 *   arguments: Record<string, any>
 * }
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
    const { toolName, arguments: toolArgs } = body

    if (!toolName) {
      return new Response(JSON.stringify({ error: '缺少 toolName 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 执行工具
    const result = await executeTool(toolName, toolArgs || {})

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
      error: error.message || '工具执行失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
