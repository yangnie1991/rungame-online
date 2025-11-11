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

    // 构建 extraConfig，存储 OAuth tokens 和客户端凭据
    const extraConfig = {
      ...(config.extraConfig && typeof config.extraConfig === 'object' ? config.extraConfig : {}),
      accessToken: data.accessToken || '',
      refreshToken: data.refreshToken || '',
      clientId: data.clientId || '',
      clientSecret: data.clientSecret || '',
      tokenUpdatedAt: new Date().toISOString(),
    }

    // 更新配置
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: data.isEnabled,
        siteUrl: data.siteUrl || null,
        extraConfig,
      },
    })

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

    // 更新配置
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: data.isEnabled,
        apiKey: data.apiKey || null,
        siteUrl: data.siteUrl || null,
      },
    })

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
