import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { searchGoogleTopPages } from '@/lib/google-search'
import { readWebPageWithRetry } from '@/lib/jina-reader'
import {
  getGameContentSystemPrompt,
  getGameContentUserPrompt,
  getGameContentAnalysisPrompt,
  formatCompetitorContent,
  getContentStrategy,
  formatStrategyForPrompt,
  type GameContentPromptVariables
} from '@/lib/ai-prompt-templates'
import { getDecryptedAiConfig } from '@/lib/ai-config'

export const runtime = 'nodejs'
export const maxDuration = 60 // Pro 计划有效，Hobby 计划忽略（但保留配置）

/**
 * ⚠️ Vercel SSE 超时说明：
 * - Hobby 计划：普通请求 10s，SSE 无固定限制（只要持续发送数据）
 * - Pro/Enterprise：最长 300s (5分钟)
 *
 * 关键：SSE 必须持续发送数据保持连接活跃
 * 本端点预计执行时间：50-60s（搜索3s + 解析40s + 生成15s）
 */

/**
 * 统一的游戏内容生成 SSE 端点
 *
 * GET /api/ai/generate-game-content-stream?params
 *
 * 适用于：
 * 1. GamePix 导入页面（有 markdownContent）
 * 2. 新建游戏页面（无 markdownContent）
 * 3. 编辑游戏页面（可能有 markdownContent）
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
    const gameTitle = searchParams.get('gameTitle')
    const locale = searchParams.get('locale')
    const keywords = searchParams.get('keywords')
    const subKeywordsStr = searchParams.get('subKeywords')
    const configId = searchParams.get('configId')
    const modelId = searchParams.get('modelId')
    const mode = (searchParams.get('mode') as 'fast' | 'quality') || 'fast'

    // 可选参数
    const originalDescription = searchParams.get('originalDescription')
    const markdownContent = searchParams.get('markdownContent')  // 🎯 可选
    const extractedContent = searchParams.get('extractedContent')
    const category = searchParams.get('category')
    const categoryId = searchParams.get('categoryId')

    // 3. 参数验证
    if (!gameTitle || !locale || !keywords || !configId || !modelId) {
      return new Response('Missing required parameters', { status: 400 })
    }

    const subKeywords = subKeywordsStr ? JSON.parse(subKeywordsStr) : []

    // 4. 创建 SSE 流
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now()
        let statistics = {
          urlsProcessed: 0,
          urlsSucceeded: 0,
          urlsFailed: 0,
          retries: 0
        }

        const sendProgress = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', data })}\n\n`)
          )
        }

        const sendComplete = (data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`)
          )
        }

        const sendError = (error: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error })}\n\n`)
          )
        }

        try {
          // ========== 阶段 1: Google 搜索 (1-3s) ==========
          sendProgress({
            phase: 'searching',
            step: '正在搜索 Google Top 5 页面...',
            progress: 0
          })

          let searchResults: any[] = []
          let snippets: string[] = []

          try {
            searchResults = await searchGoogleTopPages(keywords, 5, locale)
            snippets = searchResults.map(r => r.snippet || '')

            sendProgress({
              phase: 'searching',
              step: `✓ 找到 ${searchResults.length} 个竞品页面`,
              progress: 10,
              current: searchResults.length,
              total: 5
            })
          } catch (error: any) {
            console.error('[Google 搜索] 失败:', error)
            sendProgress({
              phase: 'searching',
              step: '⚠️ 搜索失败，将使用基础模式生成',
              progress: 10
            })
          }

          // ========== 阶段 2: 顺序解析 URLs + 重试 (20-40s) ==========
          const urls = searchResults.map(r => r.url)
          const webContents: string[] = []

          for (let i = 0; i < urls.length; i++) {
            sendProgress({
              phase: 'parsing',
              step: `正在解析第 ${i + 1}/${urls.length} 个网页...`,
              current: i + 1,
              total: urls.length,
              progress: Math.round((i / urls.length) * 30) + 20, // 20-50%
              details: urls[i]
            })

            statistics.urlsProcessed++

            const result = await readWebPageWithRetry(
              urls[i],
              3,
              (attempt, error) => {
                statistics.retries++
                sendProgress({
                  phase: 'parsing',
                  step: `第 ${i + 1}/${urls.length} 个网页重试中 (第 ${attempt}/3 次)...`,
                  current: i + 1,
                  total: urls.length,
                  progress: Math.round((i / urls.length) * 30) + 20,
                  details: `上次失败: ${error}`
                })
              }
            )

            if (result.error) {
              statistics.urlsFailed++
              webContents[i] = snippets[i] || ''
              sendProgress({
                phase: 'parsing',
                step: `⚠️ 第 ${i + 1}/${urls.length} 个网页解析失败，使用 Snippet 降级`,
                current: i + 1,
                total: urls.length,
                progress: Math.round(((i + 1) / urls.length) * 30) + 20
              })
            } else {
              statistics.urlsSucceeded++
              webContents[i] = result.content
              sendProgress({
                phase: 'parsing',
                step: `✓ 第 ${i + 1}/${urls.length} 个网页解析成功 (${result.wordCount} 词)`,
                current: i + 1,
                total: urls.length,
                progress: Math.round(((i + 1) / urls.length) * 30) + 20
              })
            }
          }

          sendProgress({
            phase: 'parsing',
            step: `✓ 网页解析完成 (成功: ${statistics.urlsSucceeded}, 失败: ${statistics.urlsFailed})`,
            progress: 50
          })

          // ========== 阶段 3: AI 生成 (8-15s) ==========
          sendProgress({
            phase: 'generating',
            step: `正在使用 AI 生成优化内容 (${mode === 'fast' ? '快速' : '质量'}模式)...`,
            progress: 60
          })

          // 获取 AI 配置
          const aiConfig = await getDecryptedAiConfig(configId, modelId)
          if (!aiConfig) {
            throw new Error('AI 配置未找到或无效')
          }

          // 语言名称映射
          const languageNames: Record<string, string> = {
            en: 'English',
            zh: 'Chinese (Simplified)',
            es: 'Spanish',
            fr: 'French',
          }
          const languageName = languageNames[locale] || locale

          // 准备提示词变量
          const promptVars: GameContentPromptVariables = {
            gameTitle,
            locale,
            languageName,
            mainKeyword: keywords,
            subKeywords,
            originalDescription: originalDescription || undefined,
            markdownContent: markdownContent || undefined,  // 🎯 可选
            competitorContent: formatCompetitorContent(searchResults, webContents)
          }

          let generatedContent: any

          if (mode === 'fast') {
            // 快速模式：单步生成
            sendProgress({
              phase: 'generating',
              step: '快速模式 - 正在生成所有字段...',
              progress: 70
            })

            const systemPrompt = getGameContentSystemPrompt(promptVars)
            const userPrompt = getGameContentUserPrompt(promptVars)

            const response = await fetch(aiConfig.baseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`,
                ...aiConfig.headers,
              },
              body: JSON.stringify({
                model: aiConfig.model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: "json_object" }
              }),
            })

            if (!response.ok) {
              throw new Error(`AI 调用失败: ${response.statusText}`)
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content || '{}'

            try {
              generatedContent = JSON.parse(content)
            } catch (error) {
              console.error('[JSON 解析] 失败:', content)
              throw new Error('AI 返回的内容格式无效')
            }

          } else {
            // 质量模式：两步生成（分析 + 生成）
            sendProgress({
              phase: 'generating',
              step: '质量模式 - 步骤 1/2: 深度分析竞品内容...',
              progress: 65
            })

            // 步骤 1: 分析
            const analysisPrompt = getGameContentAnalysisPrompt(promptVars)

            const analysisResponse = await fetch(aiConfig.baseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`,
                ...aiConfig.headers,
              },
              body: JSON.stringify({
                model: aiConfig.model,
                messages: [{ role: 'user', content: analysisPrompt }],
                temperature: 0.3,
                max_tokens: 2000,
                response_format: { type: "json_object" }
              }),
            })

            if (!analysisResponse.ok) {
              throw new Error('分析步骤失败')
            }

            const analysisData = await analysisResponse.json()
            const analysisContent = analysisData.choices?.[0]?.message?.content || '{}'
            const analysis = JSON.parse(analysisContent)

            sendProgress({
              phase: 'generating',
              step: '质量模式 - 步骤 2/2: 基于分析生成高质量内容...',
              progress: 80
            })

            // 步骤 2: 基于分析和策略生成
            const strategy = getContentStrategy(locale)
            const formattedStrategy = formatStrategyForPrompt(strategy)

            const systemPrompt = getGameContentSystemPrompt(promptVars)
            const userPrompt = getGameContentUserPrompt({
              ...promptVars,
              competitorContent: `**Analysis Results:**\n${JSON.stringify(analysis, null, 2)}\n\n${formattedStrategy}\n\n${promptVars.competitorContent}`
            })

            const generationResponse = await fetch(aiConfig.baseUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.apiKey}`,
                ...aiConfig.headers,
              },
              body: JSON.stringify({
                model: aiConfig.model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: "json_object" }
              }),
            })

            if (!generationResponse.ok) {
              throw new Error('生成步骤失败')
            }

            const generationData = await generationResponse.json()
            const content = generationData.choices?.[0]?.message?.content || '{}'

            try {
              generatedContent = JSON.parse(content)
            } catch (error) {
              console.error('[JSON 解析] 失败:', content)
              throw new Error('AI 返回的内容格式无效')
            }
          }

          // ========== 完成 ==========
          const duration = Date.now() - startTime

          sendComplete({
            results: generatedContent,
            citations: searchResults.map(r => ({ title: r.title, url: r.url })),
            statistics: {
              duration,
              ...statistics
            }
          })

          console.log(`[AI 生成] ✅ 完成 (${mode} 模式, ${duration}ms)`)

          controller.close()

        } catch (error: any) {
          console.error('[AI 生成] 失败:', error)
          sendError(error.message || '生成失败，请重试')
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
    console.error('[API] 错误:', error)
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
