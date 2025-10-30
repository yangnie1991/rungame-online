/**
 * Jina AI Reader API 集成
 *
 * 将任何 URL 转换为 LLM 友好的 Markdown 格式
 * 自动移除广告、导航栏等无关内容，保留文章主体
 *
 * 文档: https://jina.ai/reader
 * 免费使用，可选 API Key 提高速率限制
 *
 * 本地开发代理设置:
 * - 使用 TUN 模式（推荐）或系统代理
 * - 详见: PROXY-QUICKSTART.md
 */

export interface JinaReaderResult {
  url: string           // 原始 URL
  title: string         // 页面标题
  content: string       // Markdown 格式的内容
  wordCount: number     // 字数统计
  error?: string        // 错误信息（如果解析失败）
}

/**
 * 使用 Jina Reader 解析单个网页
 *
 * @param url - 要解析的网页 URL
 * @param truncate - 是否截断内容（默认 true，截断到 5000 字符）
 * @returns 解析结果
 *
 * @example
 * const result = await readWebPage('https://example.com/article')
 * console.log(result.content) // Markdown 格式的内容（截断到 5000 字符）
 *
 * @example
 * const result = await readWebPage('https://example.com/article', false)
 * console.log(result.content) // 完整的 Markdown 内容（不截断）
 */
export async function readWebPage(url: string, truncate: boolean = true): Promise<JinaReaderResult> {
  try {
    // 构建 Jina Reader URL
    // 只需在 URL 前加上 r.jina.ai/ 即可
    const jinaUrl = `https://r.jina.ai/${url}`

    // 构建请求头
    const headers: Record<string, string> = {
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Timeout': '10',  // 10秒超时
      'X-With-Generated-Alt': 'true',  // 为图片生成 alt 文本
      'X-With-Images-Summary': 'true',  // 将图片移到文档最后的 "Images:" 部分
      'X-With-Links-Summary': 'false'  // 不需要链接摘要
    }

    // 如果有 API Key，添加认证（可选，提高速率限制）
    if (process.env.JINA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`
    }

    // 调用 Jina Reader API
    const response = await fetch(jinaUrl, {
      headers,
      signal: AbortSignal.timeout(15000)  // 15秒超时
    })

    // 处理错误响应
    if (!response.ok) {
      // 429 速率限制
      if (response.status === 429) {
        throw new Error('Jina Reader 速率限制。建议添加 JINA_API_KEY 到环境变量')
      }

      // 403 访问被拒绝
      if (response.status === 403) {
        throw new Error('网页禁止访问，可能有反爬虫保护')
      }

      // 404 页面不存在
      if (response.status === 404) {
        throw new Error('网页不存在或已被删除')
      }

      throw new Error(`HTTP ${response.status}`)
    }

    // 获取 Markdown 内容
    let markdown = await response.text()

    // 验证内容
    if (!markdown || markdown.trim().length === 0) {
      throw new Error('返回内容为空')
    }

    // 检查是否是错误响应（Jina 有时返回 200 但内容是错误信息）
    if (markdown.startsWith('Error:') || markdown.includes('Failed to fetch')) {
      throw new Error(markdown.substring(0, 200))
    }

    // 提取标题（第一行通常是 # 标题）
    const titleMatch = markdown.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : extractDomainFromUrl(url)

    // 统计字数（移除 Markdown 标记）
    const plainText = markdown
      .replace(/[#*_`[\]()!]/g, '')  // 移除 Markdown 符号
      .replace(/\s+/g, ' ')          // 多个空格合并为一个
      .trim()

    const words = plainText.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length

    // 限制内容长度（避免 Token 过多）
    const maxChars = 5000
    let truncatedContent = markdown

    if (truncate && markdown.length > maxChars) {
      // 优先从 Images: 部分开始截断（Jina Reader 自动将图片放在最后）
      const imagesSectionIndex = markdown.indexOf('\nImages:\n')

      if (imagesSectionIndex > 0 && imagesSectionIndex <= maxChars) {
        // 如果图片部分在 maxChars 范围内，直接截断到图片之前
        truncatedContent = markdown.substring(0, imagesSectionIndex)
        truncatedContent += '\n\n...(Images 部分已移除，原文共 ' + markdown.length + ' 字符)'
      } else {
        // 否则按照原来的逻辑截断
        truncatedContent = markdown.substring(0, maxChars)
        // 找到最后一个完整段落
        const lastNewline = truncatedContent.lastIndexOf('\n\n')
        if (lastNewline > maxChars * 0.8) {
          truncatedContent = truncatedContent.substring(0, lastNewline)
        }
        truncatedContent += '\n\n...(内容已截断，共 ' + markdown.length + ' 字符)'
      }
    }

    console.log(`[Jina Reader] ✓ ${url} - ${wordCount} 词`)

    return {
      url,
      title,
      content: truncatedContent,
      wordCount
    }

  } catch (error: any) {
    console.error(`[Jina Reader] ✗ ${url}:`, error.message)

    // 返回失败结果（不抛出错误，允许部分失败）
    return {
      url,
      title: extractDomainFromUrl(url),
      content: '',
      wordCount: 0,
      error: error.message || '解析失败'
    }
  }
}

/**
 * 批量解析多个网页
 *
 * 使用并发控制，每批 3 个请求并行执行
 * 即使部分失败也会继续，返回所有结果
 *
 * @param urls - URL 数组
 * @returns 解析结果数组
 *
 * @example
 * const results = await readMultiplePages([
 *   'https://site1.com',
 *   'https://site2.com',
 *   'https://site3.com'
 * ])
 * const successful = results.filter(r => !r.error)
 */
export async function readMultiplePages(
  urls: string[]
): Promise<JinaReaderResult[]> {
  const results: JinaReaderResult[] = []

  // 并发控制：每批 3 个
  const batchSize = 3

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)

    console.log(`[Jina Reader] 解析批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} (${batch.length} 个 URL)`)

    // 并行执行当前批次
    const batchResults = await Promise.all(
      batch.map(url => readWebPage(url))
    )

    results.push(...batchResults)

    // 批次间添加小延迟，避免触发速率限制
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // 统计结果
  const successCount = results.filter(r => !r.error && r.wordCount > 0).length
  const failCount = results.length - successCount

  console.log(`[Jina Reader] 完成: ${successCount} 成功, ${failCount} 失败`)

  return results
}

/**
 * 从 URL 中提取域名作为后备标题
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * 获取网页摘要（前 N 个字符）
 *
 * @param url - 网页 URL
 * @param length - 摘要长度（默认 500）
 * @returns 摘要文本
 */
export async function getPageSummary(
  url: string,
  length: number = 500
): Promise<string> {
  const result = await readWebPage(url)

  if (result.error || !result.content) {
    return `无法获取内容: ${result.error || '未知错误'}`
  }

  // 移除 Markdown 标记，返回纯文本摘要
  const plainText = result.content
    .replace(/[#*_`[\]()!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return plainText.length > length
    ? plainText.substring(0, length) + '...'
    : plainText
}
