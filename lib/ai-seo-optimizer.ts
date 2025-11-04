/**
 * AI SEO 优化工具
 *
 * 基于关键词列表和现有内容，生成 SEO 优化的标题、元描述和内容
 * 支持多语言，每种语言使用自己的关键词列表
 *
 * 支持的 AI 提供商：
 * 1. OpenRouter (推荐) - 支持多种免费和付费模型
 * 2. OpenAI - 官方 API
 *
 * 推荐模型列表：
 * - OpenRouter:
 *   - google/gemini-2.0-flash-exp:free (免费，速度快)
 *   - meta-llama/llama-3.1-70b-instruct:free (免费，质量好)
 *   - anthropic/claude-3.5-sonnet (付费，效果最好)
 *   - openai/gpt-4o-mini (付费，稳定)
 * - OpenAI:
 *   - gpt-4o-mini (便宜，快速)
 *   - gpt-4o (贵，质量最高)
 */

import { getContentStrategy, formatStrategyForPrompt } from './ai-prompt-templates'

// AI 提供商类型
export type AiProvider = 'openrouter' | 'openai'

// AI 模型配置
export interface AiModelConfig {
  provider: AiProvider
  model: string
  apiKey: string
  baseUrl: string
  headers?: Record<string, string>
}

export interface SeoOptimizationInput {
  keywords: string // 关键词列表，逗号分隔（如："puzzle game, brain teaser, logic game"）
  content: string // 现有内容（游戏描述、详细说明等）
  locale: string // 语言代码（如："en", "zh"）
  contentType: 'title' | 'description' | 'long-description' | 'meta-title' | 'meta-description' | 'full' // 要优化的内容类型
}

export interface SeoOptimizationResult {
  optimizedTitle?: string // SEO 优化的标题
  optimizedMetaTitle?: string // SEO 优化的元标题
  optimizedMetaDescription?: string // SEO 优化的元描述
  optimizedContent?: string // SEO 优化的内容（富文本 HTML）
  keywordsUsed: string[] // 使用的关键词
}

/**
 * 获取 AI 模型配置（支持多种提供商）
 *
 * @param aiConfigId - AI 配置 ID（可选，不提供则使用激活配置）
 * @param modelId - 模型 ID（可选，不提供则使用默认模型）
 * @returns AI 模型配置
 */
async function getAiModelConfig(aiConfigId?: string, modelId?: string): Promise<AiModelConfig> {
  const { decrypt } = await import('./crypto')
  const { getAllAiConfigs } = await import('./ai-config')

  // 🔥 从缓存获取所有 AI 配置（避免重复查询数据库）
  const allConfigs = await getAllAiConfigs()

  // 查找目标配置
  let dbConfig

  if (aiConfigId) {
    // 如果提供了配置 ID，查找指定配置
    dbConfig = allConfigs.find(c => c.id === aiConfigId && c.isEnabled)

    if (!dbConfig) {
      throw new Error(`AI 配置 ${aiConfigId} 不存在或已禁用`)
    }
  } else {
    // 否则查找激活配置
    dbConfig = allConfigs.find(c => c.isActive && c.isEnabled)

    if (!dbConfig) {
      throw new Error('未找到激活的 AI 配置。请在管理后台 -> AI 配置中添加配置')
    }
  }

  // 解密 API Key
  const apiKey = decrypt(dbConfig.apiKey)
  const modelConfig = dbConfig.modelConfig as any

  // 选择模型
  let selectedModel
  if (modelId) {
    // 如果提供了模型 ID，使用指定模型
    selectedModel = modelConfig.models?.find((m: any) => m.id === modelId && m.isEnabled)
    if (!selectedModel) {
      throw new Error(`模型 ${modelId} 不存在或已禁用`)
    }
  } else {
    // 否则使用默认模型
    selectedModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)
    if (!selectedModel) {
      throw new Error('未找到可用的默认模型')
    }
  }

  console.log(`[AI Config] 使用配置: ${dbConfig.name} (${dbConfig.provider})`)
  console.log(`[AI Config] 使用模型: ${selectedModel.name} (${selectedModel.id})`)

  return {
    provider: dbConfig.provider as AiProvider,
    model: selectedModel.id,
    apiKey,
    baseUrl: dbConfig.baseUrl,
    headers: selectedModel.headers || {},
  }
}

/**
 * 使用 AI API 进行 SEO 优化
 */
export async function optimizeContentForSeo(
  input: SeoOptimizationInput
): Promise<SeoOptimizationResult> {
  const { keywords, content, locale, contentType } = input

  // 获取 AI 配置
  const config = await getAiModelConfig()

  // 解析关键词列表
  const keywordList = keywords
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)

  if (keywordList.length === 0) {
    throw new Error('请提供至少一个关键词')
  }

  // 获取语言名称
  const languageNames: Record<string, string> = {
    en: 'English',
    zh: 'Chinese (Simplified)',
    es: 'Spanish',
    fr: 'French',
  }
  const languageName = languageNames[locale] || locale

  // 根据内容类型生成不同的提示词
  const prompts = {
    title: generateTitlePrompt(keywordList, content, languageName),
    'meta-title': generateMetaTitlePrompt(keywordList, content, languageName),
    'meta-description': generateMetaDescriptionPrompt(keywordList, content, languageName),
    description: generateDescriptionPrompt(keywordList, content, languageName),
    'long-description': generateLongDescriptionPrompt(keywordList, content, languageName),
    full: generateFullOptimizationPrompt(keywordList, content, languageName),
  }

  const prompt = prompts[contentType]

  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    }

    // 调用 AI API
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO content optimizer specializing in gaming content. You create engaging, keyword-rich content that ranks well in search engines while maintaining natural readability.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: contentType === 'full' || contentType === 'long-description' ? 1000 : 200,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`${config.provider} API 错误: ${error.error?.message || '未知错误'}`)
    }

    const data = await response.json()
    const result = data.choices[0]?.message?.content || ''

    // 解析结果
    return parseOptimizationResult(result, contentType, keywordList)
  } catch (error) {
    console.error('AI SEO 优化失败:', error)
    throw error
  }
}

/**
 * 生成标题优化提示词
 */
function generateTitlePrompt(keywords: string[], content: string, language: string): string {
  return `Generate an SEO-optimized game title in ${language}.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

REQUIREMENTS:
1. Must be in ${language} language
2. Include at least 1-2 target keywords naturally
3. Maximum 60 characters
4. Engaging and click-worthy
5. Clear about what the game is

Return ONLY the optimized title, nothing else.`
}

/**
 * 生成元标题优化提示词
 */
function generateMetaTitlePrompt(keywords: string[], content: string, language: string): string {
  return `Generate an SEO-optimized meta title in ${language} for a game.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

REQUIREMENTS:
1. Must be in ${language} language
2. Include the most important keyword at the beginning
3. 50-60 characters (optimal for search engines)
4. Include a call to action like "Play Now", "Free Online", etc.
5. Format: "Keyword - Additional Info | Brand/Site Name"

Return ONLY the meta title, nothing else.`
}

/**
 * 生成元描述优化提示词
 */
function generateMetaDescriptionPrompt(keywords: string[], content: string, language: string): string {
  return `Generate an SEO-optimized meta description in ${language} for a game.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

REQUIREMENTS:
1. Must be in ${language} language
2. Include 2-3 target keywords naturally
3. 150-160 characters (optimal length)
4. Include a clear call to action
5. Describe the main features/benefits
6. Make it compelling to increase click-through rate

Return ONLY the meta description, nothing else.`
}

/**
 * 生成简短描述优化提示词
 */
function generateDescriptionPrompt(keywords: string[], content: string, language: string): string {
  return `Optimize and rewrite this game description in ${language} for better SEO.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

REQUIREMENTS:
1. Must be in ${language} language
2. Include target keywords naturally (1-2 times)
3. 2-3 sentences, around 100-150 characters
4. Engaging and descriptive
5. Highlight key features or gameplay

Return ONLY the optimized description in plain text, nothing else.`
}

/**
 * 生成详细描述优化提示词
 */
function generateLongDescriptionPrompt(keywords: string[], content: string, language: string): string {
  return `Optimize and expand this game description in ${language} for better SEO.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

REQUIREMENTS:
1. Must be in ${language} language
2. Include target keywords naturally throughout (keyword density 1-2%)
3. 3-5 paragraphs with proper HTML formatting (<p>, <strong>, <em>)
4. Describe gameplay, features, benefits
5. Use semantic HTML for better SEO
6. Natural and engaging writing style

Return the optimized HTML content with proper paragraph tags.`
}

/**
 * 生成完整 SEO 优化提示词
 */
function generateFullOptimizationPrompt(keywords: string[], content: string, language: string): string {
  return `Generate complete SEO-optimized content in ${language} for a game.

TARGET KEYWORDS: ${keywords.join(', ')}
CURRENT CONTENT: ${content}

Generate the following in JSON format:
{
  "title": "SEO-optimized game title (max 60 chars)",
  "metaTitle": "SEO meta title with keyword (50-60 chars)",
  "metaDescription": "SEO meta description (150-160 chars)",
  "description": "Short description (100-150 chars)",
  "longDescription": "Detailed HTML description with <p> tags (3-5 paragraphs)"
}

REQUIREMENTS:
1. All content must be in ${language} language
2. Include target keywords naturally in all fields
3. Each field should be unique and optimized for its purpose
4. Maintain engaging, natural language
5. Follow character limits strictly

Return ONLY the JSON object, nothing else.`
}

/**
 * 解析优化结果
 */
function parseOptimizationResult(
  result: string,
  contentType: SeoOptimizationInput['contentType'],
  keywords: string[]
): SeoOptimizationResult {
  if (contentType === 'full') {
    // 尝试解析 JSON
    const parsed = safeParseJSON(result, null)
    if (parsed && typeof parsed === 'object') {
      return {
        optimizedTitle: parsed.title,
        optimizedMetaTitle: parsed.metaTitle,
        optimizedMetaDescription: parsed.metaDescription,
        optimizedContent: parsed.longDescription || parsed.description,
        keywordsUsed: keywords,
      }
    } else {
      // JSON 解析失败，返回原始结果
      return {
        optimizedContent: result,
        keywordsUsed: keywords,
      }
    }
  }

  // 单个字段优化
  const optimizationMap = {
    title: { optimizedTitle: result.trim() },
    'meta-title': { optimizedMetaTitle: result.trim() },
    'meta-description': { optimizedMetaDescription: result.trim() },
    description: { optimizedContent: result.trim() },
    'long-description': { optimizedContent: result.trim() },
  }

  return {
    ...optimizationMap[contentType],
    keywordsUsed: keywords,
  }
}

/**
 * 批量优化多个字段
 */
export async function batchOptimizeContent(
  keywords: string,
  locale: string,
  fields: {
    title?: string
    description?: string
    longDescription?: string
    metaTitle?: string
    metaDescription?: string
  }
): Promise<SeoOptimizationResult> {
  // 组合所有内容作为上下文
  const content = [
    fields.title || '',
    fields.description || '',
    fields.longDescription || '',
  ]
    .filter(Boolean)
    .join(' ')

  // 使用完整优化模式
  return optimizeContentForSeo({
    keywords,
    content,
    locale,
    contentType: 'full',
  })
}

// ========== GamePix 导入专用函数 ==========

/**
 * 过滤游戏网站 - 使用 AI 判断搜索结果中哪些是游戏相关网站
 *
 * @param searchResults - Google 搜索结果（包含 title, url, content）
 * @param gameTitle - 游戏名称
 * @param locale - 语言
 * @returns 过滤后的游戏网站列表，包含置信度和判断理由
 */
export async function filterGameWebsites(
  searchResults: Array<{ title: string; url: string; content: string }>,
  gameTitle: string,
  locale: string
): Promise<Array<{ title: string; url: string; content: string; confidence: number; reasoning: string }>> {
  if (searchResults.length === 0) {
    return []
  }

  // 获取 AI 配置
  const config = await getAiModelConfig()

  console.log(`[filterGameWebsites] 开始过滤 ${searchResults.length} 个搜索结果...`)

  // 系统提示词
  const systemPrompt = `你是一个游戏网站内容分析专家。你的任务是判断提供的网页内容是否是游戏相关网站。

**游戏网站的特征：**
✅ 提供游戏下载、在线游戏、游戏试玩
✅ 包含游戏玩法介绍、攻略、评测、评分
✅ 游戏社区、论坛、新闻、资讯
✅ 游戏发行平台（如 Steam、Epic、GamePix、CrazyGames 等）
✅ 游戏开发者官方网站
✅ 游戏媒体和评测网站

**非游戏网站的特征：**
❌ 新闻门户、博客、论坛（游戏不是主要内容）
❌ 电商平台（仅销售游戏产品，不提供游戏内容）
❌ 视频平台（游戏视频不是主要内容）
❌ 社交媒体、维基百科、通用百科全书
❌ 技术文档、API 文档
❌ 不相关的网站（如新闻、购物、生活服务等）

**评分标准：**
- confidence: 0-100 的整数
  - 90-100: 明确的游戏网站（游戏平台、游戏媒体、开发者官网）
  - 70-89: 很可能是游戏网站（包含大量游戏内容）
  - 50-69: 可能是游戏网站（部分游戏内容）
  - 30-49: 不太可能是游戏网站（游戏内容很少）
  - 0-29: 明确不是游戏网站

你需要返回 JSON 数组格式：
[
  {
    "url": "网站URL",
    "isGameWebsite": true/false,
    "confidence": 0-100,
    "reasoning": "判断理由（简短说明）"
  }
]`

  // 构建用户消息 - 包含所有搜索结果（不截断内容）
  let userMessage = `游戏名称: ${gameTitle}\n语言: ${locale}\n\n请分析以下 ${searchResults.length} 个搜索结果，判断它们是否是游戏相关网站：\n\n`

  searchResults.forEach((result, index) => {
    userMessage += `--- 网站 ${index + 1} ---\n`
    userMessage += `标题: ${result.title}\n`
    userMessage += `URL: ${result.url}\n`
    userMessage += `内容:\n${result.content}\n\n` // 完整内容，不截断
  })

  userMessage += `\n请以 JSON 数组格式返回所有 ${searchResults.length} 个网站的分析结果。`

  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    }

    // 调用 AI API
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3, // 低温度，保证判断的一致性
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`AI API 错误: ${error.error?.message || '未知错误'}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '[]'

    // 解析 JSON 结果
    let analysisResults: Array<{ url: string; isGameWebsite: boolean; confidence: number; reasoning: string }>
    const parsed = safeParseJSON(content, { results: [] })
    // 处理可能是对象包裹数组的情况
    analysisResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.websites || [])

    // 过滤并组合结果
    const filtered = searchResults
      .map((result, index) => {
        // 查找对应的分析结果（通过 URL 匹配）
        const analysis = analysisResults.find(a => a.url === result.url) || analysisResults[index]

        if (!analysis) {
          console.warn(`[filterGameWebsites] 未找到 ${result.url} 的分析结果，跳过`)
          return null
        }

        return {
          title: result.title,
          url: result.url,
          content: result.content, // 保持完整内容
          confidence: analysis.confidence || 0,
          reasoning: analysis.reasoning || '无分析理由'
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.confidence >= 60) // 只保留置信度 >= 60 的网站

    console.log(`[filterGameWebsites] ✓ 过滤完成: ${filtered.length}/${searchResults.length} 个游戏网站`)
    filtered.forEach(r => {
      console.log(`  - ${r.title} (置信度: ${r.confidence}%) - ${r.reasoning}`)
    })

    return filtered

  } catch (error) {
    console.error('[filterGameWebsites] 过滤失败:', error)
    // 发生错误时，返回所有结果（不过滤）
    console.warn('[filterGameWebsites] 由于错误，返回所有搜索结果（不过滤）')
    return searchResults.map(r => ({
      ...r,
      confidence: 50, // 默认置信度
      reasoning: '过滤失败，默认保留'
    }))
  }
}

/**
 * GamePix 导入内容生成输入
 */
export interface GamePixImportInput {
  gameTitle: string           // 游戏名称
  mainKeyword: string          // 主关键词
  subKeywords: string[]        // 副关键词数组
  originalDescription: string  // 原始描述
  markdownContent: string      // Markdown 内容（完整，不截断）
  locale: string               // 语言
  mode: 'fast' | 'quality'     // 生成模式
  aiConfigId?: string          // AI 配置 ID（可选，不提供则使用激活配置）
  modelId?: string             // 模型 ID（可选，不提供则使用默认模型）
}

/**
 * GamePix 导入内容生成输出
 */
export interface GamePixImportOutput {
  description: string          // 游戏描述（1段纯文本，150-200字）
  metaTitle: string            // SEO 标题（60字符以内）
  metaDescription: string      // SEO 描述（155字符以内）
  keywords: string             // 关键词（逗号分隔，必须包含主副关键词）
  contentSections: {
    controls: string           // 控制方式（HTML）
    howToPlay: string          // 如何游玩（HTML）
    gameDetails: string        // 游戏详情（HTML）
    faq: string                // 常见问题（HTML）
    extras: string             // 其他内容（HTML，允许 h2，禁止 h1）
  }
}

/**
 * 为 GamePix 导入生成游戏内容
 *
 * @param input - 导入输入数据
 * @param onProgress - 进度回调 (step, total, message)
 * @returns 生成的9个字段内容
 */
export async function generateGamePixImportContent(
  input: GamePixImportInput,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<GamePixImportOutput> {
  const { gameTitle, mainKeyword, subKeywords, originalDescription, markdownContent, locale, mode, modelProvider, modelName } = input

  console.log(`[generateGamePixImportContent] 开始生成内容...`)
  console.log(`  - 游戏: ${gameTitle}`)
  console.log(`  - 主关键词: ${mainKeyword}`)
  console.log(`  - 副关键词: ${subKeywords.join(', ')}`)
  console.log(`  - 模式: ${mode}`)
  console.log(`  - Markdown 长度: ${markdownContent.length} 字符`)

  // 获取 AI 配置
  let config = await getAiModelConfig()

  // 如果用户指定了模型，则覆盖默认配置
  if (modelProvider && modelName) {
    console.log(`[generateGamePixImportContent] 使用用户指定的模型: ${modelProvider}/${modelName}`)
    config = {
      ...config,
      provider: modelProvider,
      model: modelName
    }
  }

  // 步骤 0: 获取竞品网站并过滤
  const totalSteps = mode === 'fast' ? 2 : 5
  onProgress?.(0, totalSteps, '正在搜索竞品网站...')

  let filteredWebsites: Array<{ title: string; url: string; content: string; confidence: number; reasoning: string }> = []

  try {
    // 导入 Google Search 和 Jina Reader
    const { searchGoogleTopPages } = await import('./google-search')
    const { readMultiplePages } = await import('./jina-reader')

    // 搜索 Top 5 页面
    const searchResults = await searchGoogleTopPages(mainKeyword, 5, locale)
    console.log(`[generateGamePixImportContent] 搜索到 ${searchResults.length} 个结果`)

    if (searchResults.length > 0) {
      // 读取页面内容
      const urls = searchResults.map(r => r.url)
      const readResults = await readMultiplePages(urls)

      const webContents = searchResults.map((r, i) => ({
        title: r.title,
        url: r.url,
        content: readResults[i]?.content || r.snippet || ''
      }))

      // 使用 AI 过滤游戏网站
      onProgress?.(0, totalSteps, '正在过滤游戏网站...')
      filteredWebsites = await filterGameWebsites(webContents, gameTitle, locale)
      console.log(`[generateGamePixImportContent] 过滤后剩余 ${filteredWebsites.length} 个游戏网站`)
    }
  } catch (error) {
    console.error('[generateGamePixImportContent] 获取竞品数据失败:', error)
    console.log('[generateGamePixImportContent] 继续使用基础模式生成...')
  }

  // 根据模式选择生成方法
  if (mode === 'fast') {
    return await generateFastModeForGamePix(input, filteredWebsites, config, onProgress)
  } else {
    return await generateQualityModeForGamePix(input, filteredWebsites, config, onProgress)
  }
}

/**
 * 快速模式生成（2步：过滤 + 生成）
 */
async function generateFastModeForGamePix(
  input: GamePixImportInput,
  filteredWebsites: Array<{ title: string; url: string; content: string; confidence: number; reasoning: string }>,
  config: AiModelConfig,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<GamePixImportOutput> {
  const { gameTitle, mainKeyword, subKeywords, originalDescription, markdownContent, locale } = input

  onProgress?.(1, 2, '正在生成所有字段内容...')

  // 语言映射
  const languageNames: Record<string, string> = {
    en: 'English',
    zh: 'Chinese (Simplified)',
    es: 'Spanish',
    fr: 'French',
  }
  const languageName = languageNames[locale] || locale

  // 构建系统提示词
  const systemPrompt = `You are a professional game content creator. Generate high-quality game content based on the provided game information and competitor analysis.

**IMPORTANT: All generated content MUST be in ${languageName} (locale: ${locale}).**

**Strict Requirements:**
1. description: MUST be **plain text** (no HTML tags), 1 paragraph, 150-200 words, describing core gameplay
2. metaTitle: Within 60 characters, include main keyword "${mainKeyword}"
3. metaDescription: Within 155 characters, include main and sub keywords
4. keywords: **CRITICAL - Generate 5-10 keywords total:**
   - MUST include main keyword "${mainKeyword}" (required)
   - MUST include all sub keywords ${JSON.stringify(subKeywords)} (required)
   - MUST add 3-5 additional relevant keywords based on game content (e.g., game genre, gameplay mechanics, target audience)
   - Format: comma-separated list
   - Example: "${mainKeyword}, ${subKeywords[0] || 'action'}, ${subKeywords[1] || 'puzzle'}, online game, free to play, browser game, casual gaming"
5. controls: HTML rich text, game controls instructions
6. howToPlay: HTML rich text, gameplay rules and tips
7. gameDetails: HTML rich text, game features, levels, rewards
8. faq: HTML rich text, frequently asked questions
9. extras: HTML rich text, changelog, acknowledgments, etc. (**CAN use h2 headings, ABSOLUTELY FORBIDDEN to use h1 headings**)

**Content Restrictions (CRITICAL):**
❌ DO NOT include developer/publisher information UNLESS it is explicitly provided in the original game information
❌ DO NOT recommend other games or external websites
❌ DO NOT add video links, YouTube embeds, or any external media
❌ DO NOT mention "Gameplay Footage", "Watch Video", "Video Tutorial" or similar video-related content (we have a separate video module)
❌ DO NOT include information from competitor websites that is not relevant to this specific game
✅ ONLY use information from: original game description, markdown content, and relevant gameplay details

**HTML Tag Specifications:**
- Rich text fields (controls, howToPlay, gameDetails, faq, extras) MUST use HTML format
- Allowed tags: <p>, <ul>, <li>, <strong>, <em>, <br>, <h2>, <h3>
- extras field: **CAN use <h2>, <h3>, but ABSOLUTELY FORBIDDEN to use <h1>**
- Other fields should not use heading tags

Return JSON format:
{
  "description": "Plain text description (150-200 words) in ${languageName}. Use '${gameTitle}' as-is, do not translate game name!",
  "metaTitle": "SEO title (within 60 chars) in ${languageName}. Include '${gameTitle}' without translation.",
  "metaDescription": "SEO description (within 155 chars) in ${languageName}. Use '${gameTitle}' as original English name.",
  "keywords": "${mainKeyword}, ${subKeywords.join(', ')}, additional keyword 1, additional keyword 2, additional keyword 3 (5-10 total keywords in ${languageName})",
  "controls": "<p>HTML formatted controls in ${languageName}. Mention '${gameTitle}' in original English if needed.</p>",
  "howToPlay": "<p>HTML formatted how to play in ${languageName}. Always use '${gameTitle}' not translated.</p>",
  "gameDetails": "<p>HTML formatted game details in ${languageName}. Game name '${gameTitle}' stays in English.</p>",
  "faq": "<p>HTML formatted FAQ in ${languageName}. When mentioning game, use '${gameTitle}' unchanged.</p>",
  "extras": "<h2>Changelog</h2><p>HTML formatted extras in ${languageName} (can use h2/h3, forbidden h1). '${gameTitle}' = English name only!</p>"
}`

  // 构建用户消息
  let userMessage = `**Game Information:**
- Game Title: ${gameTitle}
- Main Keyword: ${mainKeyword}
- Sub Keywords: ${subKeywords.join(', ')}
- Original Description: ${originalDescription}
- **Target Language: ${languageName} (${locale})**

**Markdown Content (Complete):**
${markdownContent}

${filteredWebsites.length > 0 ? `**Competitor Game Website Content (Filtered, Complete):**
${filteredWebsites.map((w, i) => `
--- Website ${i + 1}: ${w.title} (Confidence: ${w.confidence}%) ---
URL: ${w.url}
Reasoning: ${w.reasoning}
Content:
${w.content}
`).join('\n')}` : ''}

**Generation Requirements:**
1. **ALL content MUST be written in ${languageName}**
2. **CRITICAL: Game title "${gameTitle}" must NEVER be translated - always use the original English name**
3. description must be plain text, no HTML tags, 150-200 words
4. keywords: **MUST generate 5-10 keywords total** - include "${mainKeyword}", ${JSON.stringify(subKeywords)}, AND 3-5 additional relevant keywords
5. extras can use h2/h3 headings, but **ABSOLUTELY FORBIDDEN to use h1**
6. All rich text fields use HTML format

**CRITICAL - Content Length Requirements:**

**⚠️ SEO Fields - STRICTLY ENFORCE (MUST NOT EXCEED):**

**CRITICAL: Google uses pixel width, not character count!**
- Chinese characters ≈ 2× wider than English (18px vs 10px)
- Limits based on: metaTitle 600px, metaDescription 920px (desktop)

**For English (en):**
- description: **20-30 words** (plain text, no HTML, concise summary)
- metaTitle: **50-60 characters** ⭐ (600px ÷ 10px/char = 60 chars max)
- metaDescription: **140-160 characters** ⭐ (920px ÷ 10px/char = 160 chars max, desktop)
- keywords: **5-10 keywords** (comma-separated, include main + sub keywords)

**For Chinese (zh):**
- description: **10-15 词** (纯文本，简短摘要)
- metaTitle: **25-30 汉字** ⭐ (600px ÷ 18px/char = 30 汉字 max，因为中文字符更宽)
- metaDescription: **70-80 汉字** ⭐ (920px ÷ 18px/char = 80 汉字 max，桌面端)
- keywords: **5-10 个关键词**

**Why these limits?**
- Exceeding = Google truncates with "..." → Poor UX
- Mobile limits even stricter (680px for description)

**📝 Rich Text Fields - Flexible Guidelines (Recommended limits):**

**For English (en):**
- controls: **~120 words** (HTML format, can be flexible)
- howToPlay: **~280 words** (HTML format, can be flexible)
- gameDetails: **~350 words** (HTML format, can be flexible)
- faq: **~200 words** (HTML format, 3-5 Q&A pairs)
- extras: **~180 words** (HTML format, tips/strategies with h2/h3 headings)

**For Chinese (zh):**
- controls: **~60 词** (HTML 格式，可灵活调整)
- howToPlay: **~140 词** (HTML 格式，可灵活调整)
- gameDetails: **~175 词** (HTML 格式，可灵活调整)
- faq: **~100 词** (HTML 格式)
- extras: **~90 词** (HTML 格式)

⚠️ **Important Notes:**
- **SEO fields (metaTitle, metaDescription)**: MUST strictly follow character limits (Google truncates beyond these limits)
- **Rich text fields**: Use as guidelines, can be slightly flexible based on content quality
- Generate BEFORE: Plan content structure
- Generate AFTER: Self-check SEO field character counts
- Quality over quantity - be concise and informative

Please generate all 9 fields with complete, detailed content in ${languageName}.`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    }

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 20000,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      throw new Error('AI API 请求失败')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    // 📊 Token 使用统计
    console.log('[快速模式] 📊 Token 使用情况:')
    console.log(`  - 请求的 max_tokens: 20000`)
    console.log(`  - 实际返回内容长度: ${content.length} 字符`)
    console.log(`  - usage 信息:`, data.usage || '无')
    if (data.usage) {
      console.log(`  - prompt_tokens: ${data.usage.prompt_tokens || '未知'}`)
      console.log(`  - completion_tokens: ${data.usage.completion_tokens || '未知'}`)
      console.log(`  - total_tokens: ${data.usage.total_tokens || '未知'}`)
    }
    console.log(`  - finish_reason: ${data.choices[0]?.finish_reason || '未知'}`)
    if (data.choices[0]?.finish_reason === 'length') {
      console.warn('⚠️ [快速模式] 警告: 输出因 token 限制被截断! (finish_reason = length)')
    }

    const result = safeParseJSON(content)

    // 验证并返回结果
    const output: GamePixImportOutput = {
      description: result.description || '',
      metaTitle: result.metaTitle || '',
      metaDescription: result.metaDescription || '',
      keywords: ensureRequiredKeywords(result.keywords || '', mainKeyword, subKeywords),
      contentSections: {
        controls: result.controls || '',
        howToPlay: result.howToPlay || '',
        gameDetails: result.gameDetails || '',
        faq: result.faq || '',
        extras: sanitizeExtrasHtml(result.extras || '')
      }
    }

    // 调试日志：检查生成内容的完整性和字数
    console.log('[快速模式] 生成结果检查:')
    const isZh = locale === 'zh'
    logContentStats('description', output.description, isZh ? '10-15 词' : '20-30 words')
    logContentStats('metaTitle', output.metaTitle, isZh ? '25-30 汉字 (中文占2倍宽度)' : '50-60 chars')
    logContentStats('metaDescription', output.metaDescription, isZh ? '70-80 汉字 (中文占2倍宽度)' : '140-160 chars')
    logContentStats('keywords', output.keywords, '5-10 keywords')
    logContentStats('controls', output.contentSections.controls, isZh ? '~60 词' : '~120 words')
    logContentStats('howToPlay', output.contentSections.howToPlay, isZh ? '~140 词' : '~280 words')
    logContentStats('gameDetails', output.contentSections.gameDetails, isZh ? '~175 词' : '~350 words')
    logContentStats('faq', output.contentSections.faq, isZh ? '~100 词' : '~200 words')
    logContentStats('extras', output.contentSections.extras, isZh ? '~90 词' : '~180 words')

    onProgress?.(2, 2, '生成完成！')
    console.log('[generateGamePixImportContent] ✓ 快速模式生成完成')

    return output

  } catch (error) {
    console.error('[generateGamePixImportContent] 生成失败:', error)
    throw error
  }
}

/**
 * 质量模式生成（5步：过滤 + 分析 + 策略 + 生成 + 质量检查）
 */
async function generateQualityModeForGamePix(
  input: GamePixImportInput,
  filteredWebsites: Array<{ title: string; url: string; content: string; confidence: number; reasoning: string }>,
  config: AiModelConfig,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<GamePixImportOutput> {
  const { gameTitle, mainKeyword, subKeywords, originalDescription, markdownContent, locale } = input

  // 语言映射
  const languageNames: Record<string, string> = {
    en: 'English',
    zh: 'Chinese (Simplified)',
    es: 'Spanish',
    fr: 'French',
  }
  const languageName = languageNames[locale] || locale

  // 质量模式简化为 2 步：分析 + 生成（固定策略直接内嵌在提示词中）

  // 步骤 1: 深度分析
  onProgress?.(1, 2, '正在深度分析竞品内容...')
  console.log('[质量模式] 步骤 1/2: 深度分析...')

  const analysisPrompt = `You are an SEO analysis expert. Please deeply analyze the following game content and competitor data.

**IMPORTANT: Target Language is ${languageName} (${locale})**

**Game Information:**
- Game Title: ${gameTitle}
- Main Keyword: ${mainKeyword}
- Sub Keywords: ${subKeywords.join(', ')}
- Original Description: ${originalDescription}

**Markdown Content:**
${markdownContent}

${filteredWebsites.length > 0 ? `**Competitor Game Websites (${filteredWebsites.length} total):**
${filteredWebsites.map((w, i) => `
${i + 1}. ${w.title} (Confidence: ${w.confidence}%)
URL: ${w.url}
Content: ${w.content}
`).join('\n')}` : ''}

Please analyze:
1. Strengths and weaknesses of competitor content
2. Key information points and selling points
3. SEO best practices
4. Target audience and language style for ${languageName}

Return JSON format:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "keyPoints": ["point1", "point2", ...],
  "seoInsights": "SEO insights for ${languageName} content",
  "tone": "language style for ${languageName} audience"
}`

  const analysisResponse = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify({
      model: config.model,
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
  const analysis = safeParseJSON(analysisData.choices[0]?.message?.content || '{}')

  // 步骤 2: 基于分析和固定策略生成内容
  onProgress?.(2, 2, '正在生成高质量内容...')
  console.log('[质量模式] 步骤 2/2: 生成内容（应用固定策略模板）...')

  // 获取固定策略（本地，无需显示进度）
  const strategy = getContentStrategy(locale)
  const formattedStrategy = formatStrategyForPrompt(strategy)

  const generationPrompt = `Based on analysis results and content strategy guidelines, generate high-quality, complete content for game "${gameTitle}".

**CRITICAL: ALL content MUST be written in ${languageName} (${locale})**

**⚠️ IMPORTANT: Game title "${gameTitle}" must NEVER be translated - always use the original English name in ALL fields!**

**Analysis Results:**
${JSON.stringify(analysis, null, 2)}

**Game Information:**
- Game Title: ${gameTitle} (DO NOT translate this name!)
- Main Keyword: ${mainKeyword}
- Sub Keywords: ${subKeywords.join(', ')}
- Original Description: ${originalDescription}
- Markdown Content: ${markdownContent.substring(0, 1000)}... (truncated for brevity)

${formattedStrategy}

**Strict Requirements:**
1. description: **plain text** (no HTML tags), 1 paragraph, 150-200 words in ${languageName}
2. metaTitle: within 60 chars, include "${mainKeyword}" in ${languageName}
3. metaDescription: within 155 chars, include main and sub keywords in ${languageName}
4. keywords: **CRITICAL - Generate 5-10 keywords total:**
   - MUST include main keyword "${mainKeyword}" (required)
   - MUST include all sub keywords ${JSON.stringify(subKeywords)} (required)
   - MUST add 3-5 additional relevant keywords based on game content
   - Format: comma-separated list
5. extras: can use <h2>, <h3>, **ABSOLUTELY FORBIDDEN <h1>**

**Content Restrictions (CRITICAL):**
❌ DO NOT include developer/publisher info UNLESS provided in original game data
❌ DO NOT recommend other games or link to external websites
❌ DO NOT add video links or external media
❌ DO NOT mention "Gameplay Footage", "Watch Video", or video-related content (separate video module exists)
❌ ONLY use information from original game description and markdown content

**CRITICAL - Content Length Requirements:**

**⚠️ SEO Fields - STRICTLY ENFORCE (MUST NOT EXCEED):**

**CRITICAL: Google uses pixel width, not character count!**
- Chinese characters ≈ 2× wider than English (18px vs 10px)
- Limits based on: metaTitle 600px, metaDescription 920px (desktop)

**For English (en):**
- description: **20-30 words** (plain text, no HTML, concise summary)
- metaTitle: **50-60 characters** ⭐ (600px ÷ 10px/char = 60 chars max)
- metaDescription: **140-160 characters** ⭐ (920px ÷ 10px/char = 160 chars max, desktop)
- keywords: **5-10 keywords** (comma-separated, include main + sub keywords)

**For Chinese (zh):**
- description: **10-15 词** (纯文本，简短摘要)
- metaTitle: **25-30 汉字** ⭐ (600px ÷ 18px/char = 30 汉字 max，因为中文字符更宽)
- metaDescription: **70-80 汉字** ⭐ (920px ÷ 18px/char = 80 汉字 max，桌面端)
- keywords: **5-10 个关键词**

**Why these limits?**
- Exceeding = Google truncates with "..." → Poor UX
- Mobile limits even stricter (680px for description)

**📝 Rich Text Fields - Flexible Guidelines (Recommended limits, Quality Mode can be slightly longer):**

**For English (en):**
- controls: **~120 words** (HTML format, detailed control instructions with examples)
- howToPlay: **~280 words** (HTML format, comprehensive gameplay guide with HTML lists)
- gameDetails: **~350 words** (HTML format, extensive game features covering all aspects)
- faq: **~200 words** (HTML format, 3-5 Q&A pairs with thorough answers)
- extras: **~180 words** (HTML format, multiple sections with h2/h3 headings - tips, strategies, advanced techniques)

**For Chinese (zh):**
- controls: **~60 词** (HTML 格式，详细控制说明)
- howToPlay: **~140 词** (HTML 格式，全面游戏指南)
- gameDetails: **~175 词** (HTML 格式，广泛游戏特性)
- faq: **~100 词** (HTML 格式，3-5 个问答)
- extras: **~90 词** (HTML 格式，技巧和策略)

⚠️ **Important Notes:**
- **SEO fields (metaTitle, metaDescription)**: MUST strictly follow character limits (Google truncates beyond these limits)
- **Rich text fields**: Use as guidelines, Quality Mode can be slightly more detailed if content quality requires it
- Generate BEFORE: Plan content structure
- Generate AFTER: Self-check SEO field character counts
- Focus on quality and precision. Be informative but concise.

Return JSON format (REMEMBER: "${gameTitle}" stays in English, never translate it!):
{
  "description": "plain text description in ${languageName}, using '${gameTitle}' as-is",
  "metaTitle": "SEO title in ${languageName}, include '${gameTitle}' in English",
  "metaDescription": "SEO description in ${languageName}, '${gameTitle}' in English",
  "keywords": "${mainKeyword}, ${subKeywords.join(', ')}, additional keyword 1, additional keyword 2, additional keyword 3 (5-10 total keywords in ${languageName})",
  "controls": "<p>HTML content in ${languageName}, mention '${gameTitle}' without translation</p>",
  "howToPlay": "<p>HTML content in ${languageName}, '${gameTitle}' = English name only</p>",
  "gameDetails": "<p>HTML content in ${languageName}, always '${gameTitle}' not translated</p>",
  "faq": "<p>HTML content in ${languageName}, game name '${gameTitle}' unchanged</p>",
  "extras": "<h2>Title in ${languageName}</h2><p>HTML content in ${languageName} (can use h2/h3, forbidden h1), '${gameTitle}' in English</p>"
}`

  const generationResponse = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: generationPrompt }],
      temperature: 0.7,
      max_tokens: 20000,
      response_format: { type: "json_object" }
    }),
  })

  if (!generationResponse.ok) {
    throw new Error('生成步骤失败')
  }

  const generationData = await generationResponse.json()
  const generatedContent = generationData.choices[0]?.message?.content || '{}'

  // 📊 Token 使用统计
  console.log('[质量模式] 📊 Token 使用情况:')
  console.log(`  - 请求的 max_tokens: 20000`)
  console.log(`  - 实际返回内容长度: ${generatedContent.length} 字符`)
  console.log(`  - usage 信息:`, generationData.usage || '无')
  if (generationData.usage) {
    console.log(`  - prompt_tokens: ${generationData.usage.prompt_tokens || '未知'}`)
    console.log(`  - completion_tokens: ${generationData.usage.completion_tokens || '未知'}`)
    console.log(`  - total_tokens: ${generationData.usage.total_tokens || '未知'}`)
  }
  console.log(`  - finish_reason: ${generationData.choices[0]?.finish_reason || '未知'}`)
  if (generationData.choices[0]?.finish_reason === 'length') {
    console.warn('⚠️ [质量模式] 警告: 输出因 token 限制被截断! (finish_reason = length)')
  }

  const generated = safeParseJSON(generatedContent)

  // 质量检查（本地，无需显示进度）
  console.log('[质量模式] 质量检查...')

  const output: GamePixImportOutput = {
    description: generated.description || '',
    metaTitle: generated.metaTitle || '',
    metaDescription: generated.metaDescription || '',
    keywords: ensureRequiredKeywords(generated.keywords || '', mainKeyword, subKeywords),
    contentSections: {
      controls: generated.controls || '',
      howToPlay: generated.howToPlay || '',
      gameDetails: generated.gameDetails || '',
      faq: generated.faq || '',
      extras: sanitizeExtrasHtml(generated.extras || '')
    }
  }

  // 调试日志：检查生成内容的完整性和字数
  console.log('[质量模式] 生成结果检查:')
  const isZh = locale === 'zh'
  logContentStats('description', output.description, isZh ? '10-15 词' : '20-30 words')
  logContentStats('metaTitle', output.metaTitle, isZh ? '25-30 汉字 (中文占2倍宽度)' : '50-60 chars')
  logContentStats('metaDescription', output.metaDescription, isZh ? '70-80 汉字 (中文占2倍宽度)' : '140-160 chars')
  logContentStats('keywords', output.keywords, '5-10 keywords')
  logContentStats('controls', output.contentSections.controls, isZh ? '~60 词' : '~120 words')
  logContentStats('howToPlay', output.contentSections.howToPlay, isZh ? '~140 词' : '~280 words')
  logContentStats('gameDetails', output.contentSections.gameDetails, isZh ? '~175 词' : '~350 words')
  logContentStats('faq', output.contentSections.faq, isZh ? '~100 词' : '~200 words')
  logContentStats('extras', output.contentSections.extras, isZh ? '~90 词' : '~180 words')

  console.log('[generateGamePixImportContent] ✓ 质量模式生成完成')

  return output
}

/**
 * 确保 keywords 包含所有必需的关键词
 */
function ensureRequiredKeywords(keywords: string, mainKeyword: string, subKeywords: string[]): string {
  const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
  const requiredKeywords = [mainKeyword, ...subKeywords]

  // 检查缺失的关键词
  const missingKeywords = requiredKeywords.filter(
    required => !keywordList.some(k => k.toLowerCase().includes(required.toLowerCase()))
  )

  // 如果有缺失，添加到开头
  if (missingKeywords.length > 0) {
    console.log(`[ensureRequiredKeywords] 添加缺失的关键词: ${missingKeywords.join(', ')}`)
    return [...missingKeywords, ...keywordList].join(', ')
  }

  return keywords
}

/**
 * 统计文本字数（支持 HTML 内容）
 * - 对于 HTML：移除标签后统计单词数
 * - 对于纯文本：直接统计单词数
 * - 中文按字符数统计，英文按单词数统计
 */
function countWords(text: string): { words: number; chars: number } {
  if (!text) return { words: 0, chars: 0 }

  // 移除 HTML 标签
  const plainText = text.replace(/<[^>]*>/g, ' ').trim()

  // 统计字符数（不含空白）
  const chars = plainText.replace(/\s+/g, '').length

  // 统计单词数（按空格分割，过滤空字符串）
  const words = plainText.split(/\s+/).filter(w => w.length > 0).length

  return { words, chars }
}

/**
 * 记录内容长度统计信息
 */
function logContentStats(label: string, content: string, expectedWords?: string) {
  const stats = countWords(content)
  const expected = expectedWords ? ` (期望: ${expectedWords})` : ''

  // 判断是中文内容还是英文内容（中文字符占比超过 30% 视为中文）
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const isChinese = chineseChars / stats.chars > 0.3

  if (isChinese) {
    console.log(`  - ${label}: ${stats.chars} 字符${expected}`)
  } else {
    console.log(`  - ${label}: ${stats.words} 单词 (${stats.chars} 字符)${expected}`)
  }
}

/**
 * 安全地解析 AI 返回的 JSON，处理常见的格式问题
 */
function safeParseJSON(content: string, fallback: any = {}): any {
  try {
    // 1. 移除可能的 markdown 代码块标记
    let cleaned = content.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      console.log('[safeParseJSON] 移除了 markdown 代码块标记')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '')
      console.log('[safeParseJSON] 移除了通用代码块标记')
    }

    // 2. 尝试直接解析
    const parsed = JSON.parse(cleaned)
    console.log('[safeParseJSON] ✓ JSON 解析成功')
    return parsed
  } catch (error) {
    console.error('[safeParseJSON] JSON 解析失败，尝试修复...')
    console.error('[safeParseJSON] 错误:', error)
    console.error('[safeParseJSON] 原始内容长度:', content.length)
    console.error('[safeParseJSON] ===== 完整原始内容开始 =====')
    console.error(content)
    console.error('[safeParseJSON] ===== 完整原始内容结束 =====')
    console.error('[safeParseJSON] 原始内容前 500 字符:', content.substring(0, 500))
    console.error('[safeParseJSON] 原始内容后 200 字符:', content.substring(Math.max(0, content.length - 200)))

    try {
      // 3. 尝试修复各种 JSON 格式问题
      let fixed = content.trim()

      // 3.1 移除可能的 markdown 标记
      if (fixed.startsWith('```json')) {
        fixed = fixed.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      } else if (fixed.startsWith('```')) {
        fixed = fixed.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }

      const errorMessage = error instanceof Error ? error.message : String(error)

      // 3.2 修复未闭合的字符串
      if (errorMessage.includes('Unterminated string')) {
        console.log('[safeParseJSON] 检测到未闭合字符串，尝试修复...')
        fixed = fixUnterminatedString(fixed)
      }

      // 3.3 修复缺少逗号或括号的问题
      if (errorMessage.includes("Expected ',' or '}'") || errorMessage.includes('Expected property name')) {
        console.log('[safeParseJSON] 检测到格式错误，尝试修复...')
        fixed = fixMalformedJSON(fixed)
      }

      // 3.4 移除 JSON 中的注释（AI 有时会添加注释）
      fixed = fixed.replace(/\/\/.*$/gm, '') // 移除单行注释
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释

      // 3.5 修复连续逗号
      fixed = fixed.replace(/,\s*,/g, ',')

      // 3.6 修复末尾多余的逗号
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

      // 3.7 尝试解析修复后的内容
      try {
        const parsed = JSON.parse(fixed)
        console.log('[safeParseJSON] ✓ 修复成功')
        return parsed
      } catch (e) {
        console.error('[safeParseJSON] 修复后仍无法解析:', e)
      }

      // 4. 尝试提取 JSON 对象（处理前后有额外文本的情况）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let extracted = jsonMatch[0]
        // 对提取的内容也应用修复规则
        extracted = extracted.replace(/\/\/.*$/gm, '')
        extracted = extracted.replace(/\/\*[\s\S]*?\*\//g, '')
        extracted = extracted.replace(/,\s*,/g, ',')
        extracted = extracted.replace(/,(\s*[}\]])/g, '$1')

        try {
          const parsed = JSON.parse(extracted)
          console.log('[safeParseJSON] ✓ 通过提取修复成功')
          return parsed
        } catch (e) {
          console.error('[safeParseJSON] 提取后仍无法解析:', e)
        }
      }
    } catch (e) {
      console.error('[safeParseJSON] 所有修复尝试失败:', e)
    }

    // 5. 返回默认值
    console.warn('[safeParseJSON] ⚠️ 返回默认值')
    console.warn('[safeParseJSON] 默认值内容:', JSON.stringify(fallback, null, 2))
    return fallback
  }
}

/**
 * 修复未闭合的字符串
 */
function fixUnterminatedString(json: string): string {
  // 找到最后一个完整的字段
  const lastCompleteField = json.lastIndexOf('",')
  if (lastCompleteField > 0) {
    const truncated = json.substring(0, lastCompleteField + 1) + '\n}'
    console.log('[fixUnterminatedString] 截断到最后一个完整字段，长度:', truncated.length)
    return truncated
  }
  return json
}

/**
 * 修复格式错误的 JSON
 */
function fixMalformedJSON(json: string): string {
  // 策略：逐步向后查找，找到最后一个有效的完整字段
  const lines = json.split('\n')

  // 从后往前找，去掉最后几行可能不完整的内容
  for (let i = lines.length - 1; i > 0; i--) {
    const testJson = lines.slice(0, i).join('\n').trim()

    // 如果不以 } 结尾，补上
    let fixed = testJson
    if (!fixed.endsWith('}')) {
      // 移除最后可能不完整的行
      const lastCommaIndex = fixed.lastIndexOf(',')
      if (lastCommaIndex > 0) {
        fixed = fixed.substring(0, lastCommaIndex)
      }
      fixed = fixed.trim() + '\n}'
    }

    // 尝试解析
    try {
      JSON.parse(fixed)
      console.log(`[fixMalformedJSON] 成功修复，使用前 ${i} 行，总长度: ${fixed.length}`)
      return fixed
    } catch (e) {
      // 继续尝试更短的版本
      continue
    }
  }

  console.log('[fixMalformedJSON] 无法通过逐行修复')
  return json
}

/**
 * 清理 extras 字段的 HTML，确保没有 h1 标签
 */
function sanitizeExtrasHtml(html: string): string {
  // 检查是否包含 h1 标签
  if (/<h1[^>]*>/i.test(html)) {
    console.warn('[sanitizeExtrasHtml] 发现 h1 标签，正在替换为 h2...')
    // 将所有 h1 替换为 h2
    return html
      .replace(/<h1([^>]*)>/gi, '<h2$1>')
      .replace(/<\/h1>/gi, '</h2>')
  }
  return html
}
