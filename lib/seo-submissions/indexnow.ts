/**
 * IndexNow API 客户端
 *
 * 用于向 Bing、Yandex 等支持 IndexNow 协议的搜索引擎提交 URL
 * 官方文档: https://www.indexnow.org/documentation
 */

export interface IndexNowConfig {
  apiKey: string
  keyLocation: string
  host: string
  apiEndpoint?: string
}

export interface IndexNowResponse {
  success: boolean
  statusCode: number
  message: string
  responseTime: number
}

/**
 * 提交单个 URL 到 IndexNow
 */
export async function submitUrl(
  url: string,
  config: IndexNowConfig
): Promise<IndexNowResponse> {
  const startTime = Date.now()

  try {
    const endpoint = config.apiEndpoint || 'https://api.indexnow.org/indexnow'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: config.host,
        key: config.apiKey,
        keyLocation: config.keyLocation,
        urlList: [url],
      }),
    })

    const responseTime = Date.now() - startTime

    // IndexNow 响应状态码说明：
    // 200 OK - 成功接收
    // 202 Accepted - URL 已在队列中
    // 400 Bad Request - 请求格式错误
    // 403 Forbidden - Key 验证失败
    // 422 Unprocessable Entity - URL 格式错误
    // 429 Too Many Requests - 请求过于频繁

    if (response.status === 200 || response.status === 202) {
      console.log('[IndexNow] ✅ 提交成功:', {
        url,
        status: response.status,
        time: responseTime + 'ms',
      })

      return {
        success: true,
        statusCode: response.status,
        message:
          response.status === 200
            ? '成功接收'
            : 'URL 已在队列中',
        responseTime,
      }
    }

    // 处理错误响应
    const errorText = await response.text().catch(() => 'Unknown error')

    console.error('[IndexNow] ❌ 提交失败:', {
      url,
      status: response.status,
      error: errorText,
      time: responseTime + 'ms',
    })

    return {
      success: false,
      statusCode: response.status,
      message: getErrorMessage(response.status, errorText),
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('[IndexNow] ❌ 网络错误:', {
      url,
      error: errorMessage,
      time: responseTime + 'ms',
    })

    return {
      success: false,
      statusCode: 0,
      message: `网络错误: ${errorMessage}`,
      responseTime,
    }
  }
}

/**
 * 批量提交 URLs 到 IndexNow
 *
 * @param urls 要提交的 URL 列表
 * @param config IndexNow 配置
 * @param batchSize 每批提交的 URL 数量（默认 100）
 */
export async function submitUrls(
  urls: string[],
  config: IndexNowConfig,
  batchSize: number = 100
): Promise<IndexNowResponse[]> {
  const results: IndexNowResponse[] = []

  // 分批提交（IndexNow 单次最多 10,000 个 URL，建议不超过 100-500）
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const startTime = Date.now()

    try {
      const endpoint = config.apiEndpoint || 'https://api.indexnow.org/indexnow'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: config.host,
          key: config.apiKey,
          keyLocation: config.keyLocation,
          urlList: batch,
        }),
      })

      const responseTime = Date.now() - startTime

      if (response.status === 200 || response.status === 202) {
        console.log('[IndexNow] ✅ 批量提交成功:', {
          count: batch.length,
          batchIndex: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(urls.length / batchSize),
          status: response.status,
          time: responseTime + 'ms',
        })

        // 为每个 URL 创建成功响应
        batch.forEach((url) => {
          results.push({
            success: true,
            statusCode: response.status,
            message:
              response.status === 200
                ? '成功接收'
                : 'URL 已在队列中',
            responseTime,
          })
        })
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')

        console.error('[IndexNow] ❌ 批量提交失败:', {
          count: batch.length,
          batchIndex: Math.floor(i / batchSize) + 1,
          status: response.status,
          error: errorText,
          time: responseTime + 'ms',
        })

        // 为每个 URL 创建失败响应
        batch.forEach((url) => {
          results.push({
            success: false,
            statusCode: response.status,
            message: getErrorMessage(response.status, errorText),
            responseTime,
          })
        })
      }

      // 添加延迟避免请求过于频繁（建议间隔 1-2 秒）
      if (i + batchSize < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      console.error('[IndexNow] ❌ 批量提交网络错误:', {
        count: batch.length,
        error: errorMessage,
        time: responseTime + 'ms',
      })

      // 为每个 URL 创建错误响应
      batch.forEach((url) => {
        results.push({
          success: false,
          statusCode: 0,
          message: `网络错误: ${errorMessage}`,
          responseTime,
        })
      })
    }
  }

  console.log('[IndexNow] 📊 批量提交完成:', {
    total: urls.length,
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  })

  return results
}

/**
 * 根据状态码获取错误信息
 */
function getErrorMessage(statusCode: number, errorText: string): string {
  const messages: Record<number, string> = {
    400: 'Bad Request - 请求格式错误',
    403: 'Forbidden - API Key 验证失败',
    422: 'Unprocessable Entity - URL 格式错误',
    429: 'Too Many Requests - 请求过于频繁，请稍后重试',
    500: 'Internal Server Error - 服务器内部错误',
    502: 'Bad Gateway - 网关错误',
    503: 'Service Unavailable - 服务暂时不可用',
  }

  const defaultMessage = messages[statusCode]
  return defaultMessage ? `${defaultMessage} (${errorText})` : errorText
}

/**
 * 验证 IndexNow API Key 格式
 */
export function validateApiKey(apiKey: string): boolean {
  // API Key 必须是 64 个字符的十六进制字符串
  return /^[a-f0-9]{64}$/.test(apiKey)
}

/**
 * 测试 IndexNow 配置是否有效
 */
export async function testConnection(
  config: IndexNowConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // 验证 API Key 格式
    if (!validateApiKey(config.apiKey)) {
      return {
        success: false,
        message: 'API Key 格式无效（需要 64 个字符的十六进制字符串）',
      }
    }

    // 测试提交一个 URL
    const testUrl = config.keyLocation
    const result = await submitUrl(testUrl, config)

    if (result.success) {
      return {
        success: true,
        message: `连接成功（响应时间: ${result.responseTime}ms）`,
      }
    }

    return {
      success: false,
      message: result.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败',
    }
  }
}
