import { NextRequest, NextResponse } from 'next/server'
import { optimizeContentForSeo, batchOptimizeContent } from '@/lib/ai-seo-optimizer'
import { auth } from '@/lib/auth'

/**
 * AI SEO 优化 API
 *
 * POST /api/ai/seo-optimize
 *
 * 根据关键词和现有内容生成 SEO 优化的标题、描述等
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份（仅管理员可用）
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { mode, keywords, locale, content, contentType, fields } = body

    // 验证必填字段
    if (!keywords || !locale) {
      return NextResponse.json(
        { error: '缺少必填参数：keywords 和 locale' },
        { status: 400 }
      )
    }

    // 检查是否配置了 OpenRouter API Key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: '服务器未配置 OPENROUTER_API_KEY',
          hint: '请联系管理员在 .env.local 中配置 OPENROUTER_API_KEY',
        },
        { status: 500 }
      )
    }

    let result

    if (mode === 'batch') {
      // 批量优化模式：优化所有 SEO 相关字段
      if (!fields) {
        return NextResponse.json({ error: '批量模式需要提供 fields 参数' }, { status: 400 })
      }

      result = await batchOptimizeContent(keywords, locale, fields)
    } else {
      // 单个字段优化模式
      if (!content || !contentType) {
        return NextResponse.json(
          { error: '单个优化模式需要提供 content 和 contentType 参数' },
          { status: 400 }
        )
      }

      result = await optimizeContentForSeo({
        keywords,
        content,
        locale,
        contentType,
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('AI SEO 优化失败:', error)

    return NextResponse.json(
      {
        error: 'AI SEO 优化失败',
        message: error.message || '未知错误',
      },
      { status: 500 }
    )
  }
}
