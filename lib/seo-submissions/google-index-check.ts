/**
 * Google 收录状态检查
 *
 * 使用 Google Search Console API 检查 URL 是否被 Google 收录
 * 支持自动刷新 OAuth 2.0 Access Token
 */

import { google } from 'googleapis'
import { createGoogleOAuth2Client } from './google-oauth-refresh'

export interface GoogleIndexCheckResult {
  url: string
  isIndexed: boolean
  checkedAt: Date
  method: 'search' | 'api'
  error?: string
}

/**
 * 使用 site: 搜索检查 URL 是否被 Google 收录
 *
 * 注意：这是一个简化的方法，通过搜索引擎检查。
 * 生产环境建议使用 Google Search Console API 或 URL Inspection API
 */
export async function checkGoogleIndexSimple(
  url: string
): Promise<GoogleIndexCheckResult> {
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
    const searchUrl = `https://www.google.com/search?q=site:${siteQuery}`

    console.log('[Google 简单搜索] 搜索查询:', {
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
    // Google 如果没有收录会显示 "did not match any documents"
    const hasResults = !html.includes('did not match any documents') &&
                      !html.includes('没有找到和您查询') &&
                      html.includes('Search Results')

    console.log('[Google 简单搜索] 搜索结果:', {
      url,
      hasResults,
      包含结果标记: html.includes('Search Results'),
      包含无结果标记: html.includes('did not match any documents') || html.includes('没有找到和您查询'),
    })

    return {
      url,
      isIndexed: hasResults,
      checkedAt,
      method: 'search',
    }
  } catch (error) {
    console.error('[Google 收录检查] 错误:', error)
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
 * 批量检查 Google 收录状态
 */
export async function checkGoogleIndexBatch(
  urls: string[],
  delayMs: number = 2000
): Promise<GoogleIndexCheckResult[]> {
  const results: GoogleIndexCheckResult[] = []

  for (const url of urls) {
    const result = await checkGoogleIndexSimple(url)
    results.push(result)

    console.log('[Google 收录检查]', {
      url,
      indexed: result.isIndexed,
      method: result.method,
    })

    // 添加延迟避免被 Google 限制
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * 使用 Google Search Console API URL Inspection 检查收录状态（使用 googleapis SDK）
 *
 * 这是官方的 Search Console API，提供最准确的索引信息
 * 使用 googleapis SDK 自动处理 OAuth token 刷新
 *
 * API 文档: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 */
export async function checkGoogleIndexWithAPI(
  url: string,
  _accessToken?: string, // 保留参数兼容性，但不使用
  siteUrl?: string
): Promise<GoogleIndexCheckResult> {
  const checkedAt = new Date()

  if (!siteUrl) {
    throw new Error('未配置 siteUrl')
  }

  try {
    // 创建 OAuth2 客户端（SDK 会自动处理 token 刷新）
    const oauth2Client = await createGoogleOAuth2Client()

    if (!oauth2Client) {
      throw new Error('无法创建 OAuth2 客户端，请检查配置')
    }

    console.log('[Google Search Console API] 使用 googleapis SDK 发送请求:', {
      inspectionUrl: url,
      siteUrl,
    })

    // 创建 Search Console API 客户端
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client })

    // 调用 URL Inspection API
    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: siteUrl,
      },
    })

    console.log('[Google Search Console API] 响应状态:', response.status, response.statusText)
    console.log('[Google Search Console API] 完整响应数据:', JSON.stringify(response.data, null, 2))

    if (!response.data || !response.data.inspectionResult) {
      console.error('[Google Search Console API] 无法获取 inspectionResult')
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
        error: '无法获取检查结果',
      }
    }

    // 检查索引状态
    const indexStatusResult = response.data.inspectionResult.indexStatusResult

    if (!indexStatusResult) {
      console.error('[Google Search Console API] 无法获取 indexStatusResult')
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
        error: '无法获取索引状态',
      }
    }

    console.log('[Google Search Console API] 索引状态详情:', {
      url,
      verdict: indexStatusResult.verdict,
      indexingState: indexStatusResult.indexingState,
      coverageState: indexStatusResult.coverageState,
      pageFetchState: indexStatusResult.pageFetchState,
      robotsTxtState: indexStatusResult.robotsTxtState,
      lastCrawlTime: indexStatusResult.lastCrawlTime,
      crawledAs: indexStatusResult.crawledAs,
      referringUrls: indexStatusResult.referringUrls?.slice(0, 3),
    })

    // 判断是否已被索引
    // 根据 Google Search Console API 文档：
    // 1. coverageState 包含 "indexed" 表示已索引
    // 2. verdict 为 'PASS' 表示页面可以被索引（但不一定已经被索引）
    // 3. indexingState 为 'INDEXING_ALLOWED' 表示允许索引（但不一定已经被索引）
    //
    // 正确的判断：主要看 coverageState 是否包含 "indexed"
    const coverageState = indexStatusResult.coverageState || ''
    const isIndexed = coverageState.toLowerCase().includes('indexed')

    console.log('[Google Search Console API] ⚡ 收录判断:', {
      url,
      coverageState,
      isIndexed,
      判断逻辑: `coverageState 包含 "indexed": ${isIndexed}`,
    })

    return {
      url,
      isIndexed,
      checkedAt,
      method: 'api',
    }
  } catch (error: any) {
    console.error('[Google Search Console API] 错误:', error)

    // googleapis SDK 的错误处理
    if (error.code === 429) {
      console.warn('[Google Search Console API] API 配额已用尽，降级到简单搜索')
      return checkGoogleIndexSimple(url)
    }

    if (error.code === 401 || error.code === 403) {
      const errorMessage = error.message || error.errors?.[0]?.message || 'Access Token 无效或已过期'
      console.error('[Google Search Console API] 认证错误:', errorMessage)
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
        error: `认证错误 (${error.code}): ${errorMessage}`,
      }
    }

    if (error.code === 404) {
      return {
        url,
        isIndexed: false,
        checkedAt,
        method: 'api',
        error: 'siteUrl 不存在或格式错误，请检查 Search Console 中的属性',
      }
    }

    // 其他错误
    const errorMessage = error.message || error.errors?.[0]?.message || String(error)
    return {
      url,
      isIndexed: false,
      checkedAt,
      method: 'api',
      error: `API 错误: ${errorMessage}`,
    }
  }
}
