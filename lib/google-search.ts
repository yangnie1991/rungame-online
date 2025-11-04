/**
 * Google Custom Search API 集成
 *
 * 用于获取指定关键词在 Google 搜索中排名前 N 的网页
 *
 * 文档: https://developers.google.com/custom-search/v1/introduction
 *
 * 本地开发代理设置:
 * - 使用 TUN 模式（推荐）或系统代理
 * - 详见: PROXY-QUICKSTART.md
 */

export interface GoogleSearchResult {
  rank: number       // 排名（1-N）
  title: string      // 网页标题
  url: string        // 网页 URL
  snippet: string    // 搜索结果摘要
}

/**
 * 使用 Google Custom Search API 获取排名前 N 的网页
 *
 * @param keyword - 搜索关键词
 * @param topN - 返回前 N 个结果（默认 5）
 * @param locale - 语言设置（默认 'en'）
 * @returns 搜索结果数组
 *
 * @example
 * const results = await searchGoogleTopPages('puzzle game', 5, 'en')
 * console.log(results[0].title) // 第一名的标题
 */
export async function searchGoogleTopPages(
  keyword: string,
  topN: number = 5,
  locale: string = 'en'
): Promise<GoogleSearchResult[]> {
  // 验证环境变量
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !engineId) {
    console.warn(
      '[Google Search] API 未配置，跳过搜索功能\n' +
      '提示：配置 Google Search API 可以提升 GamePix 导入内容质量\n' +
      '参考文档: docs/GOOGLE-SEARCH-API-SETUP.md'
    )
    // 返回空数组而不是抛出错误，允许优雅降级
    return []
  }

  // 语言映射
  const langMap: Record<string, string> = {
    'en': 'lang_en',
    'zh': 'lang_zh-CN'
  }

  // 构建查询参数
  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: keyword,
    num: String(Math.min(topN, 10)),  // Google API 最多返回 10 个
    lr: langMap[locale] || 'lang_en'
  })

  try {
    // 调用 Google Custom Search API
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      {
        signal: AbortSignal.timeout(10000)  // 10秒超时
      }
    )

    // 处理 API 错误
    if (!response.ok) {
      const error = await response.text()

      // 特殊处理配额错误
      if (response.status === 429 || error.includes('quota')) {
        throw new Error(
          'Google Search API 配额已用完。' +
          '免费版: 100次/天，付费版: $5/1000次。' +
          '请检查: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas'
        )
      }

      throw new Error(`Google Search API 错误 (${response.status}): ${error}`)
    }

    const data = await response.json()

    // 检查是否有结果
    if (!data.items || data.items.length === 0) {
      console.warn(`[Google Search] 关键词 "${keyword}" 未找到结果`)
      return []
    }

    // 转换为标准格式
    const results: GoogleSearchResult[] = data.items
      .slice(0, topN)
      .map((item: any, index: number) => ({
        rank: index + 1,
        title: item.title || '',
        url: item.link || '',
        snippet: item.snippet || ''
      }))

    console.log(`[Google Search] ✓ 找到 ${results.length} 个结果`)

    return results

  } catch (error: any) {
    // 超时错误
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Google Search API 请求超时，请检查网络连接')
    }

    // 网络错误
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      throw new Error('无法连接到 Google API，请检查网络设置')
    }

    // 其他错误直接抛出
    throw error
  }
}

/**
 * 批量搜索多个关键词
 *
 * @param keywords - 关键词数组
 * @param topN - 每个关键词返回前 N 个结果
 * @param locale - 语言设置
 * @returns Map<keyword, results>
 *
 * @example
 * const results = await searchMultipleKeywords(['puzzle', 'action'], 3, 'en')
 * console.log(results.get('puzzle')) // puzzle 的搜索结果
 */
export async function searchMultipleKeywords(
  keywords: string[],
  topN: number = 5,
  locale: string = 'en'
): Promise<Map<string, GoogleSearchResult[]>> {
  const results = new Map<string, GoogleSearchResult[]>()

  // 串行执行，避免配额快速耗尽
  for (const keyword of keywords) {
    try {
      const searchResults = await searchGoogleTopPages(keyword, topN, locale)
      results.set(keyword, searchResults)

      // 添加延迟，避免触发速率限制
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`[Google Search] 搜索 "${keyword}" 失败:`, error.message)
      results.set(keyword, [])
    }
  }

  return results
}
