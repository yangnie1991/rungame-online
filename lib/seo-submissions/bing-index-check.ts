/**
 * Bing 收录状态检查
 *
 * 使用 Bing Search API 检查 URL 是否被 Bing 收录
 */

export interface BingIndexCheckResult {
  url: string
  isIndexed: boolean
  checkedAt: Date
  method: 'search' | 'api'
  error?: string
}

/**
 * 使用 site: 搜索检查 URL 是否被 Bing 收录
 */
export async function checkBingIndexSimple(
  url: string
): Promise<BingIndexCheckResult> {
  const checkedAt = new Date()

  try {
    // 使用 site: 搜索特定 URL
    // 注意：需要正确处理 URL 格式，不能对整个 URL 进行 encodeURIComponent
    // 正确的格式应该是：site:domain.com/path 而不是 site:https%3A%2F%2Fdomain.com%2Fpath

    // 从完整 URL 中提取域名和路径部分
    let siteQuery: string
    try {
      const urlObj = new URL(url)
      // 构造 site: 查询：domain.com + pathname（不包含 protocol）
      siteQuery = `${urlObj.hostname}${urlObj.pathname}`
    } catch {
      // 如果 URL 解析失败，尝试直接使用（可能已经是正确格式）
      siteQuery = url.replace(/^https?:\/\//, '') // 移除协议部分
    }

    // 构造搜索 URL，site: 后面的部分不需要编码
    const searchUrl = `https://www.bing.com/search?q=site:${siteQuery}`

    console.log('[Bing 简单搜索] 搜索查询:', {
      原始URL: url,
      搜索查询: `site:${siteQuery}`,
      完整搜索URL: searchUrl,
    })

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'search',
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()

    // 检查是否有搜索结果
    // Bing 如果没有收录会显示 "There are no results"
    const hasResults = !html.includes('There are no results') &&
                      !html.includes('没有找到相关结果') &&
                      (html.includes('b_algo') || html.includes('results'))

    console.log('[Bing 简单搜索] 搜索结果:', {
      url,
      hasResults,
      包含结果标记: html.includes('b_algo') || html.includes('results'),
      包含无结果标记: html.includes('There are no results') || html.includes('没有找到相关结果'),
    })

    return {
      url,
      isIndexed: hasResults,
      checkedAt,
      method: 'search',
    }
  } catch (error) {
    console.error('[Bing 收录检查] 错误:', error)
    return {
      url,
      isIndexed: false,
      checkedAt,
      method: 'search',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 批量检查 Bing 收录状态
 */
export async function checkBingIndexBatch(
  urls: string[],
  delayMs: number = 2000
): Promise<BingIndexCheckResult[]> {
  const results: BingIndexCheckResult[] = []

  for (const url of urls) {
    const result = await checkBingIndexSimple(url)
    results.push(result)

    console.log('[Bing 收录检查]', {
      url,
      indexed: result.isIndexed,
      method: result.method,
    })

    // 添加延迟避免被限制
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Bing Webmaster API GetUrlInfo 响应接口
 */
interface BingGetUrlInfoResponse {
  d?: {
    DiscoveryDate?: string // 发现日期
    LastCrawledDate?: string // 最后抓取日期
    HttpStatus?: number // HTTP 状态码
    DocumentSize?: number // 文档大小
    AnchorCount?: number // 锚文本数量
    TotalChildUrlCount?: number // 子 URL 数量
    IsPage?: boolean // 是否为页面
  }
}

/**
 * 使用 Bing Webmaster Tools API GetUrlInfo 检查收录状态（官方 API）
 *
 * 这是官方的 Webmaster Tools API，提供准确的索引信息
 * API Key 从 SearchEngineConfig.apiKey 中读取
 *
 * API 文档: https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.geturlinfo
 */
export async function checkBingIndexWithAPI(
  url: string,
  apiKey?: string,
  siteUrl?: string
): Promise<BingIndexCheckResult> {
  const checkedAt = new Date()

  if (!apiKey) {
    throw new Error('未配置 Bing Webmaster API Key')
  }

  if (!siteUrl) {
    throw new Error('未配置 siteUrl')
  }

  try {
    // Bing Webmaster API GetUrlInfo 端点
    const apiUrl = `https://ssl.bing.com/webmaster/api.svc/json/GetUrlInfo?siteUrl=${encodeURIComponent(siteUrl)}&url=${encodeURIComponent(url)}&apikey=${apiKey}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 检查是否是配额限制错误
    if (response.status === 429 || response.status === 403) {
      console.warn('[Bing Webmaster API] API 配额已用尽，降级到简单搜索')
      return checkBingIndexSimple(url)
    }

    if (!response.ok) {
      console.error('[Bing Webmaster API] HTTP 错误:', response.status, response.statusText)
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
        error: `API Error: ${response.status} ${response.statusText}`,
      }
    }

    const data: BingGetUrlInfoResponse = await response.json()

    // 检查响应数据
    if (!data.d) {
      // 如果没有数据，说明 URL 未被索引
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
      }
    }

    // 如果有 LastCrawledDate 或 DiscoveryDate，说明已被索引
    const isIndexed = !!(data.d.LastCrawledDate || data.d.DiscoveryDate)

    console.log('[Bing Webmaster API] 检查结果:', {
      url,
      isIndexed,
      lastCrawled: data.d.LastCrawledDate,
      discovered: data.d.DiscoveryDate,
      httpStatus: data.d.HttpStatus,
    })

    return {
      url,
      isIndexed,
      checkedAt,
      method: 'api',
    }
  } catch (error) {
    console.error('[Bing Webmaster API] 错误:', error)
    // 其他错误不降级，直接返回错误
    return {
      url,
      isIndexed: false,
      checkedAt,
      method: 'api',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
