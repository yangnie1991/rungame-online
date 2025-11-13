/**
 * AI JSON 响应解析工具
 *
 * 用于安全解析 AI 返回的 JSON 内容，处理可能包含 markdown 代码块标记的情况
 */

/**
 * 安全解析 AI 返回的 JSON 内容
 *
 * AI 有时会返回带 markdown 代码块标记的 JSON，例如：
 * ```json
 * { "title": "..." }
 * ```
 *
 * 这个函数会清理这些标记并安全解析
 *
 * @param content - AI 返回的原始内容
 * @param errorContext - 错误上下文信息，用于调试
 * @returns 解析后的 JSON 对象
 * @throws Error 如果解析失败
 */
export function parseAIJsonResponse(content: string, errorContext?: string): any {
  try {
    // 去除首尾空白
    let cleaned = content.trim()

    // 检测并移除 markdown 代码块标记
    // 匹配 ```json\n{...}\n``` 或 ```\n{...}\n```
    const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/
    const match = cleaned.match(codeBlockPattern)

    if (match) {
      cleaned = match[1].trim()
    }

    // 解析 JSON
    return JSON.parse(cleaned)
  } catch (error) {
    // 提供详细的错误信息
    const preview = content.substring(0, 200)
    const context = errorContext ? ` [${errorContext}]` : ''
    console.error(`[JSON 解析错误]${context} 原始内容前 200 字符:`, preview + (content.length > 200 ? '...' : ''))

    throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 尝试解析 AI JSON 响应，失败时返回默认值
 *
 * @param content - AI 返回的原始内容
 * @param defaultValue - 解析失败时返回的默认值
 * @param errorContext - 错误上下文信息
 * @returns 解析后的 JSON 对象或默认值
 */
export function tryParseAIJsonResponse<T = any>(
  content: string,
  defaultValue: T,
  errorContext?: string
): T {
  try {
    return parseAIJsonResponse(content, errorContext)
  } catch (error) {
    console.warn(`[JSON 解析] 使用默认值${errorContext ? ` [${errorContext}]` : ''}`)
    return defaultValue
  }
}
