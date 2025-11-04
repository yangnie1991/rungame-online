import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDecryptedAiConfig } from '@/lib/ai-config'
import { searchGoogleTopPages } from '@/lib/google-search'
import { readWebPageWithRetry } from '@/lib/jina-reader'

export const runtime = 'nodejs'
export const maxDuration = 60 // Hobby 计划无效，但保留配置

/**
 * SEO 内容生成 SSE 端点（流式进度反馈）
 *
 * GET /api/ai/generate-seo-stream?params
 *
 * 使用 Server-Sent Events 实时推送生成进度
 * 绕过 Vercel 10 秒超时限制
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证身份
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. 获取参数
    const searchParams = request.nextUrl.searchParams
    const gameId = searchParams.get('gameId')
    const gameTitle = searchParams.get('gameTitle')
    const locale = searchParams.get('locale')
    const keywords = searchParams.get('keywords') // 主关键词
    const subKeywordsStr = searchParams.get('subKeywords')
    const category = searchParams.get('category')
    const categoryId = searchParams.get('categoryId')
    const configId = searchParams.get('configId')
    const modelId = searchParams.get('modelId')
    const fieldsStr = searchParams.get('fields')
    const mode = (searchParams.get('mode') as 'fast' | 'quality') || 'fast'
    const extractedContent = searchParams.get('extractedContent')

    // 3. 参数验证
    if (!gameTitle || !locale || !keywords || !configId || !modelId || !fieldsStr) {
      return new Response('Missing required parameters', { status: 400 })
    }

    const fields = JSON.parse(fieldsStr)
    const subKeywords = subKeywordsStr ? JSON.parse(subKeywordsStr) : []
    const mainKeyword = keywords

    // 4. 创建 SSE 流
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now()

        // 辅助函数：发送进度
        const sendProgress = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', data })}\n\n`)
          )
        }

        // 辅助函数：发送完成
        const sendComplete = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`)
          )
        }

        // 辅助函数：发送错误
        const sendError = (error: string, details?: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error, details })}\n\n`)
          )
        }

        try {
          // ========== 阶段 1: Google 搜索 ==========
          sendProgress({
            phase: 'searching',
            step: '正在搜索竞品网页...',
            progress: 0,
            current: 0,
            total: 5
          })

          const searchStart = Date.now()
          let searchResults: any[] = []
          let searchTime = 0

          try {
            searchResults = await searchGoogleTopPages(mainKeyword, 5, locale)
            searchTime = Date.now() - searchStart

            if (!searchResults || searchResults.length === 0) {
              console.log('[SEO生成] ⚠️  未找到搜索结果，将使用基础模式')
            } else {
              sendProgress({
                phase: 'searching',
                step: `搜索完成，找到 ${searchResults.length} 个竞品网页`,
                progress: 100,
                current: searchResults.length,
                total: 5
              })
            }
          } catch (error: any) {
            console.error('[SEO生成] 搜索失败:', error.message)
            sendProgress({
              phase: 'searching',
              step: '搜索失败，将使用基础模式生成',
              progress: 100,
              details: error.message
            })
          }

          // ========== 阶段 2: 顺序解析 URL（带重试） ==========
          const urls = searchResults.map(r => r.url)
          const snippets = searchResults.map(r => r.snippet || '')
          const webContents: string[] = []
          let successCount = 0
          let failCount = 0
          let retryCount = 0

          const parseStart = Date.now()

          if (urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
              const url = urls[i]

              // 发送开始解析进度
              sendProgress({
                phase: 'parsing',
                step: `正在解析第 ${i + 1}/${urls.length} 个网页...`,
                progress: Math.round((i / urls.length) * 100),
                current: i,
                total: urls.length,
                details: url
              })

              // 带重试的解析
              const result = await readWebPageWithRetry(
                url,
                3,
                (attempt, error) => {
                  retryCount++
                  sendProgress({
                    phase: 'parsing',
                    step: `第 ${i + 1}/${urls.length} 个网页重试中 (第 ${attempt}/3 次)...`,
                    progress: Math.round((i / urls.length) * 100),
                    current: i,
                    total: urls.length,
                    details: `${url}\n重试原因: ${error}`
                  })
                }
              )

              // 判断是否成功
              if (result.error || !result.content) {
                // 失败，使用 Snippet 降级
                webContents[i] = snippets[i]
                failCount++

                sendProgress({
                  phase: 'parsing',
                  step: `第 ${i + 1}/${urls.length} 个网页解析失败，已使用搜索摘要`,
                  progress: Math.round(((i + 1) / urls.length) * 100),
                  current: i + 1,
                  total: urls.length,
                  details: `${url}\n错误: ${result.error}\n已降级到 Google Snippet`
                })
              } else {
                // 成功
                webContents[i] = result.content
                successCount++

                sendProgress({
                  phase: 'parsing',
                  step: `第 ${i + 1}/${urls.length} 个网页解析成功 (${result.wordCount} 词)`,
                  progress: Math.round(((i + 1) / urls.length) * 100),
                  current: i + 1,
                  total: urls.length,
                  details: url
                })
              }
            }

            const parseTime = Date.now() - parseStart

            // 解析完成总结
            sendProgress({
              phase: 'parsing',
              step: `网页解析完成 (${successCount}/${urls.length} 成功, ${failCount}/${urls.length} 降级)`,
              progress: 100,
              current: urls.length,
              total: urls.length
            })
          } else {
            sendProgress({
              phase: 'parsing',
              step: '跳过网页解析，使用基础模式',
              progress: 100
            })
          }

          // ========== 阶段 3: AI 生成内容 ==========
          sendProgress({
            phase: 'generating',
            step: '正在使用 AI 生成优化内容...',
            progress: 0
          })

          const generateStart = Date.now()

          // 动态导入生成函数（避免循环依赖）
          const { generateFastMode, generateQualityMode } = await import('../batch-generate-seo/route')

          // 获取 AI 配置
          const aiConfig = await getDecryptedAiConfig()
          const modelConfig = aiConfig.modelConfig as any
          const selectedModel = modelConfig.models?.find((m: any) => m.id === modelId)

          if (!selectedModel) {
            throw new Error(`模型 ${modelId} 未找到`)
          }

          // 分析 SEO 元数据
          let seoMetadata: any = null
          if (searchResults.length > 0) {
            const { analyzeSeoMetadata } = await import('@/lib/seo-content-helpers')
            seoMetadata = analyzeSeoMetadata(
              searchResults.map((r, i) => ({ ...r, content: webContents[i] || '' })),
              mainKeyword,
              subKeywords
            )
          }

          // 生成内容
          let results: Record<string, string>
          let citations: any[] = []

          if (mode === 'fast') {
            const generated = await generateFastMode({
              gameTitle,
              locale,
              mainKeyword,
              subKeywords,
              category,
              fields,
              searchResults,
              webContents,
              seoMetadata,
              selectedModel,
              aiConfig
            })
            results = generated.results
            citations = generated.citations
          } else {
            const generated = await generateQualityMode({
              gameTitle,
              locale,
              mainKeyword,
              subKeywords,
              category,
              fields,
              searchResults,
              webContents,
              seoMetadata,
              selectedModel,
              aiConfig
            })
            results = generated.results
            citations = generated.citations
          }

          const generateTime = Date.now() - generateStart

          sendProgress({
            phase: 'generating',
            step: 'AI 生成完成',
            progress: 100
          })

          // ========== 发送完成事件 ==========
          const totalTime = Date.now() - startTime

          sendComplete({
            results,
            citations,
            statistics: {
              totalTime,
              searchTime,
              parseTime: Date.now() - parseStart,
              generateTime,
              totalUrls: urls.length,
              successfulUrls: successCount,
              failedUrls: failCount,
              retriedUrls: retryCount
            }
          })

          controller.close()

        } catch (error: any) {
          console.error('[SEO生成] 失败:', error)
          sendError(error.message || '生成失败', error.stack)
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error: any) {
    console.error('[SEO生成] 初始化失败:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
