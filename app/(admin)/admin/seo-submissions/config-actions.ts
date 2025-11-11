/**
 * 搜索引擎配置 Server Actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { checkGoogleIndexWithAPI } from '@/lib/seo-submissions/google-index-check'
import { checkBingIndexWithAPI } from '@/lib/seo-submissions/bing-index-check'

export interface UpdateConfigResult {
  success: boolean
  message: string
}

/**
 * 更新 Google Search Console API 配置
 */
export async function updateGoogleConfig(data: {
  isEnabled: boolean
  accessToken?: string
  refreshToken?: string
  siteUrl?: string
  clientId?: string
  clientSecret?: string
}): Promise<UpdateConfigResult> {
  try {
    // 查找或创建 Google 配置
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    })

    if (!config) {
      return {
        success: false,
        message: 'Google 配置不存在，请先运行初始化脚本',
      }
    }

    // 获取现有的 extraConfig
    const existingExtraConfig = (config.extraConfig && typeof config.extraConfig === 'object'
      ? config.extraConfig
      : {}) as any

    console.log('[更新 Google 配置] 当前配置:', {
      配置ID: config.id,
      当前isEnabled: config.isEnabled,
      当前siteUrl: config.siteUrl,
      当前accessToken: existingExtraConfig.accessToken ? '已配置' : '未配置',
      当前refreshToken: existingExtraConfig.refreshToken ? '已配置' : '未配置',
    })

    console.log('[更新 Google 配置] 提交的数据:', {
      isEnabled: data.isEnabled,
      siteUrl: data.siteUrl || '未提供',
      accessToken: data.accessToken ? `已提供 (${data.accessToken.length} 字符)` : '未提供',
      refreshToken: data.refreshToken ? '已提供' : '未提供',
      clientId: data.clientId ? '已提供' : '未提供',
      clientSecret: data.clientSecret ? '已提供' : '未提供',
    })

    // 数据验证：如果启用配置，必须提供必需的字段
    if (data.isEnabled) {
      // 检查 siteUrl
      const finalSiteUrl = data.siteUrl || config.siteUrl
      if (!finalSiteUrl) {
        return {
          success: false,
          message: '启用配置时必须提供 Site URL',
        }
      }

      // 检查 OAuth 凭据：如果没有提供新的，检查是否有已保存的
      const finalAccessToken = data.accessToken || existingExtraConfig.accessToken
      const finalRefreshToken = data.refreshToken || existingExtraConfig.refreshToken
      const finalClientId = data.clientId || existingExtraConfig.clientId
      const finalClientSecret = data.clientSecret || existingExtraConfig.clientSecret

      if (!finalAccessToken || !finalRefreshToken) {
        return {
          success: false,
          message: '启用配置时必须提供完整的 OAuth 认证信息（Access Token 和 Refresh Token）',
        }
      }

      if (!finalClientId || !finalClientSecret) {
        return {
          success: false,
          message: '启用配置时必须提供完整的 OAuth 客户端信息（Client ID 和 Client Secret）',
        }
      }
    }

    // 构建 extraConfig，只更新提供的字段，保留未提供的字段
    const extraConfig: any = {
      ...existingExtraConfig,
    }

    // 只有当提供了新值时才更新（不为 undefined 且不为空字符串）
    if (data.accessToken) {
      extraConfig.accessToken = data.accessToken
    }
    if (data.refreshToken) {
      extraConfig.refreshToken = data.refreshToken
    }
    if (data.clientId) {
      extraConfig.clientId = data.clientId
    }
    if (data.clientSecret) {
      extraConfig.clientSecret = data.clientSecret
    }

    // 记录更新时间
    extraConfig.tokenUpdatedAt = new Date().toISOString()

    console.log('[更新 Google 配置] 最终extraConfig:', {
      accessToken: extraConfig.accessToken ? '已配置' : '未配置',
      refreshToken: extraConfig.refreshToken ? '已配置' : '未配置',
      clientId: extraConfig.clientId ? '已配置' : '未配置',
      clientSecret: extraConfig.clientSecret ? '已配置' : '未配置',
      tokenUpdatedAt: extraConfig.tokenUpdatedAt,
    })

    // 更新配置
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: data.isEnabled,
        siteUrl: data.siteUrl || config.siteUrl, // 保留原有值
        extraConfig,
      },
    })

    console.log('[更新 Google 配置] ✅ 配置已成功更新')

    revalidatePath('/admin/seo-submissions')
    revalidatePath('/admin/seo-submissions/config')
    revalidatePath('/admin/seo-submissions/google')

    return {
      success: true,
      message: 'Google 配置已更新',
    }
  } catch (error) {
    console.error('[更新 Google 配置] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新配置时发生错误',
    }
  }
}

/**
 * 更新 Bing 配置
 */
export async function updateBingConfig(data: {
  isEnabled: boolean
  apiKey?: string
  siteUrl?: string
}): Promise<UpdateConfigResult> {
  try {
    // 查找 Bing 配置
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'indexnow' },
    })

    if (!config) {
      return {
        success: false,
        message: 'Bing 配置不存在，请先运行初始化脚本',
      }
    }

    console.log('[更新 Bing 配置] 当前配置:', {
      配置ID: config.id,
      当前isEnabled: config.isEnabled,
      当前apiKey: config.apiKey ? '已配置' : '未配置',
      当前siteUrl: config.siteUrl || '未配置',
    })

    console.log('[更新 Bing 配置] 提交的数据:', {
      isEnabled: data.isEnabled,
      apiKey: data.apiKey ? '已提供' : '未提供',
      siteUrl: data.siteUrl || '未提供',
    })

    // 数据验证：如果启用配置，必须提供必需的字段
    if (data.isEnabled) {
      const finalApiKey = data.apiKey || config.apiKey
      const finalSiteUrl = data.siteUrl || config.siteUrl

      if (!finalApiKey) {
        return {
          success: false,
          message: '启用配置时必须提供 Bing Webmaster API Key',
        }
      }

      if (!finalSiteUrl) {
        return {
          success: false,
          message: '启用配置时必须提供 Site URL',
        }
      }
    }

    // 更新配置：只更新提供的字段，保留未提供的字段
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: data.isEnabled,
        apiKey: data.apiKey || config.apiKey, // 保留原有值
        siteUrl: data.siteUrl || config.siteUrl, // 保留原有值
      },
    })

    console.log('[更新 Bing 配置] ✅ 配置已成功更新')

    revalidatePath('/admin/seo-submissions')
    revalidatePath('/admin/seo-submissions/config')
    revalidatePath('/admin/seo-submissions/bing')

    return {
      success: true,
      message: 'Bing 配置已更新',
    }
  } catch (error) {
    console.error('[更新 Bing 配置] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新配置时发生错误',
    }
  }
}

/**
 * 测试 Google Search Console API 配置
 */
export async function testGoogleApi(data: {
  accessToken: string
  siteUrl: string
  testUrl?: string
}): Promise<UpdateConfigResult> {
  try {
    // 默认测试 URL 使用网站首页
    const testUrl = data.testUrl || data.siteUrl

    const result = await checkGoogleIndexWithAPI(testUrl, data.accessToken, data.siteUrl)

    if (result.error) {
      return {
        success: false,
        message: `API 测试失败: ${result.error}`,
      }
    }

    return {
      success: true,
      message: `API 测试成功！检查结果: ${result.isIndexed ? '已收录' : '未收录'}`,
    }
  } catch (error) {
    console.error('[测试 Google Search Console API] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 测试失败',
    }
  }
}

/**
 * 测试 Bing Webmaster API 配置
 */
export async function testBingApi(data: {
  apiKey: string
  siteUrl: string
  testUrl?: string
}): Promise<UpdateConfigResult> {
  try {
    // 默认测试 URL 使用网站首页
    const testUrl = data.testUrl || data.siteUrl

    const result = await checkBingIndexWithAPI(testUrl, data.apiKey, data.siteUrl)

    if (result.error) {
      return {
        success: false,
        message: `API 测试失败: ${result.error}`,
      }
    }

    return {
      success: true,
      message: `API 测试成功！检查结果: ${result.isIndexed ? '已收录' : '未收录'}`,
    }
  } catch (error) {
    console.error('[测试 Bing Webmaster API] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 测试失败',
    }
  }
}
