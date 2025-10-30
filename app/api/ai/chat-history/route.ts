import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  saveChatHistory,
  loadChatHistory,
  deleteChatHistory,
} from '@/lib/ai-chat-history'

/**
 * GET - 加载对话历史
 * Query params: gameId, locale
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const gameId = searchParams.get('gameId')
    const locale = searchParams.get('locale')

    if (!gameId || !locale) {
      return NextResponse.json(
        { error: '缺少必需参数: gameId, locale' },
        { status: 400 }
      )
    }

    const history = await loadChatHistory(gameId, locale)

    if (!history) {
      return NextResponse.json({ messages: [] }, { status: 200 })
    }

    return NextResponse.json({
      messages: history.messages,
      messageCount: history.messageCount,
      totalTokens: history.totalTokens,
      lastUsedAt: history.lastUsedAt,
    })
  } catch (error: any) {
    console.error('加载对话历史失败:', error)
    return NextResponse.json(
      { error: error.message || '加载对话历史失败' },
      { status: 500 }
    )
  }
}

/**
 * POST - 保存对话历史
 * Body: { gameId, locale, messages, context? }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { gameId, locale, messages, context } = body

    if (!gameId || !locale || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '缺少必需参数: gameId, locale, messages' },
        { status: 400 }
      )
    }

    const history = await saveChatHistory(gameId, locale, messages, {
      adminId: session.user.id,
      context,
    })

    return NextResponse.json({
      success: true,
      messageCount: history.messageCount,
      totalTokens: history.totalTokens,
    })
  } catch (error: any) {
    console.error('保存对话历史失败:', error)
    return NextResponse.json(
      { error: error.message || '保存对话历史失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 删除对话历史
 * Query params: gameId, locale
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员身份
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const gameId = searchParams.get('gameId')
    const locale = searchParams.get('locale')

    if (!gameId || !locale) {
      return NextResponse.json(
        { error: '缺少必需参数: gameId, locale' },
        { status: 400 }
      )
    }

    const deleted = await deleteChatHistory(gameId, locale)

    return NextResponse.json({
      success: deleted,
      message: deleted ? '对话历史已删除' : '未找到对话历史',
    })
  } catch (error: any) {
    console.error('删除对话历史失败:', error)
    return NextResponse.json(
      { error: error.message || '删除对话历史失败' },
      { status: 500 }
    )
  }
}
