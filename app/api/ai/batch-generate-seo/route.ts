import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDecryptedAiConfig } from '@/lib/ai-config'
import { saveChatHistory, type ChatMessage } from '@/lib/ai-chat-history'
import { searchGoogleTopPages } from '@/lib/google-search'
import { readMultiplePages } from '@/lib/jina-reader'
import {
  getDefaultWordCount,
  analyzeSeoMetadata,
  getRelevantSubKeywords,
  generateSeoRecommendations
} from '@/lib/seo-content-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60  // SEO 生成可能需要更长时间

/**
 * SEO 优化的批量生成 API
 *
 * POST /api/ai/batch-generate-seo
 *
 * 功能：
 * - 使用 Google Search API 获取排名前5的页面
 * - 使用 Jina Reader 解析网页内容
 * - 基于竞品分析生成 SEO 优化的内容
 * - 支持快速模式（单步）和质量模式（两步）
 *
 * Body: {
 *   gameId: string,
 *   gameTitle: string,
 *   locale: string,
 *   keywords: string,         // 主关键词
 *   category?: string,
 *   fields: string[],          // ['controls', 'howToPlay', 'gameDetails', 'extras']
 *   mode: 'fast' | 'quality', // 生成模式
 *   model?: string,            // 自定义模型 ID
 *   subKeywords?: string[]     // 子关键词（5-20个）
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const session = await auth()
    if (!session?.user) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const {
      gameId,
      gameTitle,
      locale,
      keywords: mainKeyword,
      category,
      fields,
      mode = 'fast',
      model: customModelId,
      subKeywords = []
    } = body

    // 参数验证
    if (!gameTitle || !locale || !fields || !Array.isArray(fields) || !mainKeyword) {
      return new Response(
        JSON.stringify({ error: '缺少必需参数: gameTitle, locale, fields, keywords' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!['fast', 'quality'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'mode 必须是 "fast" 或 "quality"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 获取并解密 AI 配置
    const aiConfig = await getDecryptedAiConfig()
    if (!aiConfig) {
      return new Response(
        JSON.stringify({ error: 'AI 配置未设置，请先在系统设置中配置 AI 服务' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 选择模型
    const modelConfig = aiConfig.modelConfig as any
    let selectedModel
    if (customModelId) {
      selectedModel = modelConfig.models?.find((m: any) => m.id === customModelId && m.isEnabled)
      if (!selectedModel) {
        return new Response(
          JSON.stringify({ error: `指定的模型 ${customModelId} 未找到或未启用` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      selectedModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)
      if (!selectedModel) {
        return new Response(
          JSON.stringify({ error: '未找到可用的默认模型' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    console.log(`[SEO 生成] 游戏: ${gameTitle}, 模式: ${mode}, 主关键词: ${mainKeyword}`)

    // ========== 第一步：获取 SEO 排名数据 ==========
    let searchResults: any[] = []
    let webContents: string[] = []
    let seoMetadata: any = null

    try {
      console.log('[SEO 生成] 步骤 1/3: 获取 Google 搜索排名...')
      searchResults = await searchGoogleTopPages(mainKeyword, 5, locale)
      console.log(`[SEO 生成] ✓ 获取到 ${searchResults.length} 个排名结果`)

      if (searchResults.length > 0) {
        // 解析网页内容
        console.log('[SEO 生成] 步骤 2/3: 解析竞品网页内容...')
        const urls = searchResults.map(r => r.url)
        const results = await readMultiplePages(urls)

        webContents = results
          .filter(r => r.success && r.content)
          .map(r => r.content!)

        console.log(`[SEO 生成] ✓ 成功解析 ${webContents.length}/${urls.length} 个页面`)

        // 分析 SEO 元数据
        seoMetadata = analyzeSeoMetadata(
          searchResults.map((r, i) => ({ ...r, content: webContents[i] || '' })),
          mainKeyword,
          subKeywords
        )
      } else {
        console.log('[SEO 生成] ⚠️  未获取到搜索结果，将使用基础模式生成')
      }
    } catch (error: any) {
      console.error('[SEO 生成] 获取 SEO 数据失败:', error.message)
      console.log('[SEO 生成] 继续使用基础模式生成...')
    }

    // ========== 第二步：生成内容 ==========
    console.log(`[SEO 生成] 步骤 3/3: 使用 ${mode === 'fast' ? '快速' : '质量'} 模式生成内容...`)

    let results: Record<string, string>
    let citations: any[] = []
    let analysisData: any = null

    if (mode === 'fast') {
      // 快速模式：单步生成
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
      // 质量模式：两步生成（分析 + 生成）
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
      analysisData = generated.analysis
    }

    // ========== 第三步：保存对话历史 ==========
    if (gameId && locale) {
      try {
        const messages: ChatMessage[] = [
          {
            role: 'user',
            content: `SEO 内容生成请求\n游戏: ${gameTitle}\n主关键词: ${mainKeyword}\n子关键词: ${subKeywords.join(', ')}`
          },
          {
            role: 'assistant',
            content: JSON.stringify(results)
          }
        ]

        await saveChatHistory(gameId, locale, messages, {
          adminId: session.user.id,
          context: {
            mode,
            mainKeyword,
            subKeywords,
            category,
            searchResults: searchResults.map(r => ({ title: r.title, url: r.url })),
            citations: citations.length > 0 ? citations : undefined,
            seoMetadata,
            analysisData
          }
        })
      } catch (error) {
        console.error('[SEO 生成] 保存对话历史失败:', error)
      }
    }

    console.log(`[SEO 生成] ✅ 完成！生成了 ${Object.keys(results).length} 个字段`)

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        results,
        metadata: {
          searchResults: searchResults.map(r => ({ rank: r.rank, title: r.title, url: r.url })),
          webContentsCount: webContents.length,
          seoMetadata,
          citations,
          analysisData
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('[SEO 生成] 失败:', error)
    return new Response(
      JSON.stringify({
        error: '内部服务器错误',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 快速模式：单步生成所有字段
 */
export async function generateFastMode(params: {
  gameTitle: string
  locale: string
  mainKeyword: string
  subKeywords: string[]
  category?: string
  fields: string[]
  searchResults: any[]
  webContents: string[]
  seoMetadata: any
  selectedModel: any
  aiConfig: any
}) {
  const {
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
  } = params

  // 字段标签
  const fieldLabels: Record<string, string> = {
    // SEO 和元数据字段
    description: '简短描述',
    longDescription: '详细描述',
    metaTitle: 'SEO 标题',
    metaDescription: 'SEO 描述',
    keywords: '关键词',
    // 富文本内容字段
    controls: '控制方式',
    howToPlay: '如何游玩',
    gameDetails: '详细游戏信息',
    extras: '其他内容'
  }

  // 目标字数
  const targetWordCount = getDefaultWordCount(locale)

  // 构建系统提示词
  const systemPrompt = `你是一个专业的 SEO 内容创作者，擅长创作高排名的游戏内容。你必须**严格遵守字数/字符限制**。

**⚠️ 严格要求 - 字数/字符限制**：
- 你**必须严格遵守**每个字段的字数/字符限制
- **超出限制的内容将被视为错误**，需要重新生成
- 生成前先规划内容，确保不超出限制
- 生成后自我检查字数/字符数

**任务**: 为游戏"${gameTitle}"生成 SEO 优化的内容

**SEO 要求**:
1. **关键词密度**:
   - 主关键词"${mainKeyword}": 2-3%
   - 子关键词: 3-5%（自然分布）
2. **⚠️ 字数/字符限制（严格遵守）**:
   ${fields.map(f => {
     const target = targetWordCount[f as keyof typeof targetWordCount];
     const label = fieldLabels[f];
     if (f === 'metaTitle') return `- ${label}: **严格 50-60 字符**（包括空格和标点），不要超过！`;
     if (f === 'metaDescription') return `- ${label}: **严格 150-160 字符**（包括空格和标点），不要超过！`;
     if (f === 'keywords') return `- ${label}: **5-10 个关键词**，逗号分隔`;
     return `- ${label}: **最多 ${target} 词**${locale === 'zh' ? `（中文约 ${Math.round(target * 0.6)} 词）` : ''}`;
   }).join('\n   ')}
3. **内容质量**:
   - 使用标题、列表、粗体等 HTML 标签
   - 语言自然，避免关键词堆砌
   - 提供有价值的信息

${searchResults.length > 0 ? `**竞品分析**（Top ${searchResults.length} 排名页面）:
${searchResults.map((r, i) => `${i + 1}. ${r.title} (${r.url})`).join('\n')}

${webContents.length > 0 ? `已解析 ${webContents.length} 个页面的内容，请参考其写作风格和信息点，但不要直接复制。` : ''}` : ''}

${seoMetadata ? `**SEO 洞察**:
- 平均标题长度: ${seoMetadata.avgTitleLength} 字符
- 平均描述长度: ${seoMetadata.avgSnippetLength} 字符
- 关键词密度: ${seoMetadata.keywordDensity.toFixed(2)}%
- 相关关键词: ${seoMetadata.relatedKeywords.join(', ')}` : ''}

**返回格式**: 必须是标准 JSON 格式
\`\`\`json
{
  "description": "简短描述（1-2句话）",
  "longDescription": "<p>详细描述段落1...</p><p>段落2...</p>",
  "metaTitle": "SEO 标题（50-60字符）",
  "metaDescription": "SEO 描述（150-160字符）",
  "keywords": "关键词1, 关键词2, 关键词3",
  "controls": "<p>使用方向键或 WASD...</p>",
  "howToPlay": "<p>游戏目标...</p><ul><li>规则1</li></ul>",
  "gameDetails": "<p>游戏特色...</p>",
  "extras": "<p>游戏技巧...</p>"
}
\`\`\`

**语言**: ${locale === 'zh' ? '中文' : '英语'}`

  // 构建用户消息
  let userMessage = `游戏标题：${gameTitle}\n`
  userMessage += `主关键词：${mainKeyword}\n`
  if (subKeywords.length > 0) {
    userMessage += `子关键词：${subKeywords.join(', ')}\n`
  }
  if (category) {
    userMessage += `分类：${category}\n`
  }
  userMessage += `\n请生成以下字段的 SEO 优化内容：${fields.map(f => fieldLabels[f]).join('、')}\n\n`

  // 如果有网页内容，添加参考
  if (webContents.length > 0) {
    userMessage += `**参考内容**（Top ${webContents.length} 页面）:\n\n`
    webContents.slice(0, 3).forEach((content, i) => {
      userMessage += `--- 页面 ${i + 1} ---\n${content.substring(0, 1000)}...\n\n`
    })
  }

  userMessage += `请以 JSON 格式返回，字段名为：${fields.join(', ')}`

  // 调用 AI
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]

  const response = await fetch(aiConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
      'X-Title': 'RunGame SEO Content Generator'
    },
    body: JSON.stringify({
      model: selectedModel.id,
      messages,
      temperature: selectedModel.parameters?.temperature || 0.7,
      max_tokens: selectedModel.parameters?.max_tokens || 3000,
      top_p: selectedModel.parameters?.top_p || 1.0,
      stream: false,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[SEO 生成] AI API 错误:', error)
    throw new Error('AI 服务请求失败')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'

  // 解析 JSON
  const parsedContent = JSON.parse(content)

  // 验证字段
  const results: Record<string, string> = {}
  for (const field of fields) {
    results[field] = parsedContent[field] || `<p>生成失败，请重试</p>`
  }

  // 提取引用（如果有）
  const citations = searchResults.slice(0, 3).map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet
  }))

  return { results, citations }
}

/**
 * 质量模式：两步生成（分析 + 生成）
 */
export async function generateQualityMode(params: {
  gameTitle: string
  locale: string
  mainKeyword: string
  subKeywords: string[]
  category?: string
  fields: string[]
  searchResults: any[]
  webContents: string[]
  seoMetadata: any
  selectedModel: any
  aiConfig: any
}) {
  const {
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
  } = params

  // ========== 步骤 1: 分析竞品 ==========
  console.log('[质量模式] 步骤 1/2: 分析竞品内容...')

  const analysisPrompt = `你是一个 SEO 分析专家。请分析以下竞品内容，提取关键信息。

**游戏**: ${gameTitle}
**主关键词**: ${mainKeyword}
**子关键词**: ${subKeywords.join(', ')}

**Top ${searchResults.length} 排名页面**:
${searchResults.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   摘要: ${r.snippet}`).join('\n\n')}

${webContents.length > 0 ? `**页面内容**:\n${webContents.slice(0, 3).map((c, i) => `\n--- 页面 ${i + 1} ---\n${c.substring(0, 1500)}...`).join('\n\n')}` : ''}

请分析：
1. 这些页面的共同主题和关键信息点
2. 使用的关键词和短语
3. 内容结构和格式
4. 目标受众和语言风格

以 JSON 格式返回：
\`\`\`json
{
  "keyThemes": ["主题1", "主题2", ...],
  "keyInfo": ["信息点1", "信息点2", ...],
  "keywords": ["关键词1", "关键词2", ...],
  "structure": "描述内容结构",
  "tone": "描述语言风格"
}
\`\`\``

  const analysisResponse = await fetch(aiConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel.id,
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
      max_tokens: 1000,
      stream: false,
      response_format: { type: "json_object" }
    })
  })

  if (!analysisResponse.ok) {
    throw new Error('分析步骤失败')
  }

  const analysisData = await analysisResponse.json()
  const analysis = JSON.parse(analysisData.choices[0]?.message?.content || '{}')

  console.log('[质量模式] ✓ 分析完成')

  // ========== 步骤 2: 基于分析生成内容 ==========
  console.log('[质量模式] 步骤 2/2: 基于分析生成内容...')

  const fieldLabels: Record<string, string> = {
    // SEO 和元数据字段
    description: '简短描述',
    longDescription: '详细描述',
    metaTitle: 'SEO 标题',
    metaDescription: 'SEO 描述',
    keywords: '关键词',
    // 富文本内容字段
    controls: '控制方式',
    howToPlay: '如何游玩',
    gameDetails: '详细游戏信息',
    extras: '其他内容'
  }

  const targetWordCount = getDefaultWordCount(locale)

  const generationPrompt = `基于以下分析结果，为游戏"${gameTitle}"生成 SEO 优化的内容。你必须**严格遵守字数/字符限制**。

**⚠️ 严格要求 - 字数/字符限制**：
- 你**必须严格遵守**每个字段的字数/字符限制
- **超出限制的内容将被视为错误**，需要重新生成
- 生成前先规划内容，确保不超出限制
- 生成后自我检查字数/字符数

**竞品分析结果**:
${JSON.stringify(analysis, null, 2)}

**SEO 要求**:
- 主关键词"${mainKeyword}": 2-3% 密度
- 子关键词自然分布: 3-5% 密度
- **⚠️ 字数/字符限制（严格遵守）**:
  ${fields.map(f => {
    const target = targetWordCount[f as keyof typeof targetWordCount];
    const label = fieldLabels[f];
    if (f === 'metaTitle') return `${label}: **严格 50-60 字符**（不要超过！）`;
    if (f === 'metaDescription') return `${label}: **严格 150-160 字符**（不要超过！）`;
    if (f === 'keywords') return `${label}: **5-10 个关键词**`;
    return `${label}: **最多 ${target} 词**${locale === 'zh' ? `（中文约 ${Math.round(target * 0.6)} 词）` : ''}`;
  }).join(', ')}

**生成要求**:
1. 参考分析结果中的关键主题和信息点
2. 使用发现的相关关键词
3. 模仿竞品的内容结构和语言风格
4. 但不要直接复制，要有独特价值
5. 使用 HTML 标签格式化（<p>, <ul>, <li>, <strong> 等）
6. **严格遵守字数/字符限制**

请生成以下字段：${fields.map(f => fieldLabels[f]).join('、')}

返回 JSON 格式，字段名为：${fields.join(', ')}

语言：${locale === 'zh' ? '中文' : '英语'}`

  const generationResponse = await fetch(aiConfig.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel.id,
      messages: [{ role: 'user', content: generationPrompt }],
      temperature: 0.7,
      max_tokens: 3000,
      stream: false,
      response_format: { type: "json_object" }
    })
  })

  if (!generationResponse.ok) {
    throw new Error('生成步骤失败')
  }

  const generationData = await generationResponse.json()
  const content = generationData.choices[0]?.message?.content || '{}'
  const parsedContent = JSON.parse(content)

  // 验证字段
  const results: Record<string, string> = {}
  for (const field of fields) {
    results[field] = parsedContent[field] || `<p>生成失败，请重试</p>`
  }

  // 引用
  const citations = searchResults.slice(0, 3).map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet
  }))

  console.log('[质量模式] ✓ 生成完成')

  return { results, citations, analysis }
}
