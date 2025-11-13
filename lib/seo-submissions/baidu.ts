/**
 * 百度主动推送 API 客户端
 *
 * 用于向百度搜索引擎提交 URL
 * 官方文档: https://ziyuan.baidu.com/college/courseinfo?id=267
 */

export interface BaiduConfig {
  site: string // 站点域名，如: rungame.online
  token: string // 百度站长平台 Token
  apiEndpoint?: string
}

export interface BaiduResponse {
  success: boolean
  remain?: number // 当天剩余配额
  successCount?: number // 成功推送的 URL 数量
  notSameSite?: string[] // 不是本站的 URL
  notValid?: string[] // 格式错误的 URL
  message: string
  responseTime: number
}

/**
 * 提交 URLs 到百度主动推送 API
 */
export async function submitUrls(
  urls: string[],
  config: BaiduConfig
): Promise<BaiduResponse> {
  const startTime = Date.now()

  try {
    // 百度 API 端点
    const endpoint =
      config.apiEndpoint ||
      `http://data.zz.baidu.com/urls?site=${config.site}&token=${config.token}`

    // 百度要求使用 text/plain 格式，每行一个 URL
    const body = urls.join('\n')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'RunGame-SEO-Bot/1.0',
      },
      body,
    })

    const responseTime = Date.now() - startTime

    // 解析响应
    const responseText = await response.text()
    let responseData: any

    try {
      responseData = JSON.parse(responseText)
    } catch {
      console.error('[百度推送] ❌ 无法解析响应:', responseText)
      return {
        success: false,
        message: '无法解析响应: ' + responseText,
        responseTime,
      }
    }

    // 成功响应示例：
    // {
    //   "remain": 497,
    //   "success": 3,
    //   "not_same_site": [],
    //   "not_valid": []
    // }
    if (response.ok && responseData.success !== undefined) {
      console.log('[百度推送] ✅ 提交成功:', {
        submitted: urls.length,
        success: responseData.success,
        remain: responseData.remain,
        time: responseTime + 'ms',
      })

      return {
        success: true,
        remain: responseData.remain,
        successCount: responseData.success,
        notSameSite: responseData.not_same_site || [],
        notValid: responseData.not_valid || [],
        message: `成功推送 ${responseData.success} 个 URL，剩余配额 ${responseData.remain}`,
        responseTime,
      }
    }

    // 错误响应示例：
    // {"error":401,"message":"token is not valid"}
    // {"error":403,"message":"site is not owned by user"}
    if (responseData.error) {
      const errorMessage = getErrorMessage(
        responseData.error,
        responseData.message
      )

      console.error('[百度推送] ❌ 提交失败:', {
        error: responseData.error,
        message: responseData.message,
        time: responseTime + 'ms',
      })

      return {
        success: false,
        message: errorMessage,
        responseTime,
      }
    }

    // 其他错误
    console.error('[百度推送] ❌ 未知错误:', {
      status: response.status,
      data: responseData,
      time: responseTime + 'ms',
    })

    return {
      success: false,
      message: `未知错误: ${JSON.stringify(responseData)}`,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('[百度推送] ❌ 网络错误:', {
      error: errorMessage,
      time: responseTime + 'ms',
    })

    return {
      success: false,
      message: `网络错误: ${errorMessage}`,
      responseTime,
    }
  }
}

/**
 * 批量提交 URLs（分批处理）
 *
 * 百度建议每次提交不超过 20 个 URL
 */
export async function submitUrlsBatch(
  urls: string[],
  config: BaiduConfig,
  batchSize: number = 20
): Promise<BaiduResponse[]> {
  const results: BaiduResponse[] = []

  // 分批提交
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)

    console.log('[百度推送] 📤 提交批次:', {
      batch: Math.floor(i / batchSize) + 1,
      total: Math.ceil(urls.length / batchSize),
      urls: batch.length,
    })

    const result = await submitUrls(batch, config)
    results.push(result)

    // 如果失败，记录日志
    if (!result.success) {
      console.error('[百度推送] ❌ 批次失败:', {
        batch: Math.floor(i / batchSize) + 1,
        message: result.message,
      })

      // 如果是配额用完，停止提交
      if (result.message.includes('403') || result.message.includes('配额')) {
        console.warn('[百度推送] ⚠️  配额已用完，停止提交')
        break
      }
    }

    // 添加延迟避免请求过于频繁（建议间隔 2-3 秒）
    if (i + batchSize < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 2500))
    }
  }

  // 汇总统计
  const totalSuccess = results.reduce(
    (sum, r) => sum + (r.successCount || 0),
    0
  )
  const totalFailed = urls.length - totalSuccess

  console.log('[百度推送] 📊 批量提交完成:', {
    total: urls.length,
    success: totalSuccess,
    failed: totalFailed,
    batches: results.length,
  })

  return results
}

/**
 * 查询剩余配额
 */
export async function getQuota(config: BaiduConfig): Promise<{
  success: boolean
  remain?: number
  message: string
}> {
  try {
    // 提交空数组来查询配额
    const result = await submitUrls([], config)

    if (result.success && result.remain !== undefined) {
      return {
        success: true,
        remain: result.remain,
        message: `剩余配额: ${result.remain}`,
      }
    }

    return {
      success: false,
      message: result.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '查询配额失败',
    }
  }
}

/**
 * 根据错误码获取错误信息
 */
function getErrorMessage(errorCode: number, errorMessage: string): string {
  const messages: Record<number, string> = {
    400: 'Bad Request - 请求格式错误',
    401: 'Unauthorized - Token 无效或已过期',
    403: 'Forbidden - 配额已用完或站点未验证',
    404: 'Not Found - API 端点不存在',
    500: 'Internal Server Error - 服务器内部错误',
  }

  const defaultMessage = messages[errorCode]
  return defaultMessage ? `${defaultMessage} (${errorMessage})` : errorMessage
}

/**
 * 验证百度配置
 */
export function validateConfig(config: BaiduConfig): {
  valid: boolean
  message: string
} {
  if (!config.site) {
    return { valid: false, message: '站点域名不能为空' }
  }

  if (!config.token) {
    return { valid: false, message: 'Token 不能为空' }
  }

  // 验证站点域名格式（不包含协议和路径）
  if (config.site.includes('://') || config.site.includes('/')) {
    return {
      valid: false,
      message: '站点域名格式错误（应为: example.com，不包含 https:// 等）',
    }
  }

  return { valid: true, message: '配置有效' }
}

/**
 * 测试百度推送配置是否有效
 */
export async function testConnection(config: BaiduConfig): Promise<{
  success: boolean
  message: string
  remain?: number
}> {
  try {
    // 验证配置
    const validation = validateConfig(config)
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      }
    }

    // 查询配额来测试连接
    const quotaResult = await getQuota(config)

    if (quotaResult.success) {
      return {
        success: true,
        message: `连接成功，${quotaResult.message}`,
        remain: quotaResult.remain,
      }
    }

    return {
      success: false,
      message: quotaResult.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接测试失败',
    }
  }
}
