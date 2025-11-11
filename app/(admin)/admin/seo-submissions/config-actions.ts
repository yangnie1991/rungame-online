/**
 * 搜索引擎配置 Server Actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkGoogleIndexWithAPI } from '@/lib/seo-submissions/google-index-check'
import { checkBingIndexWithAPI } from '@/lib/seo-submissions/bing-index-check'

export interface UpdateConfigResult {
  success: boolean
  message: string
}

// Google 配置验证 Schema
const googleConfigSchema = z.object({
  isEnabled: z.boolean(),
  accessToken: z.string().trim().optional(),
  refreshToken: z.string().trim().optional(),
  siteUrl: z.string().trim().url('Site URL 必须是有效的 URL').optional(),
  clientId: z.string().trim().optional(),
  clientSecret: z.string().trim().optional(),
}).refine(
  (data) => {
    // 如果启用配置，必须提供所有 OAuth 字段
    if (data.isEnabled) {
      return !!(data.siteUrl && data.accessToken && data.refreshToken && data.clientId && data.clientSecret)
    }
    return true
  },
  {
    message: '启用配置时必须提供完整的配置信息（Site URL、Access Token、Refresh Token、Client ID 和 Client Secret）',
  }
)

export type GoogleConfigData = z.infer<typeof googleConfigSchema>

// Bing 配置验证 Schema
const bingConfigSchema = z.object({
  isEnabled: z.boolean(),
  apiKey: z.string().trim().optional(),
  siteUrl: z.string().trim().url('Site URL 必须是有效的 URL').optional(),
}).refine(
  (data) => {
    // 如果启用配置，必须提供 API Key 和 Site URL
    if (data.isEnabled) {
      return !!(data.apiKey && data.siteUrl)
    }
    return true
  },
  {
    message: '启用配置时必须提供 API Key 和 Site URL',
  }
)

export type BingConfigData = z.infer<typeof bingConfigSchema>

// Google API 测试验证 Schema
const googleApiTestSchema = z.object({
  accessToken: z.string().trim().min(1, 'Access Token 不能为空'),
  siteUrl: z.string().trim().url('Site URL 必须是有效的 URL'),
  testUrl: z.string().trim().url('Test URL 必须是有效的 URL').optional(),
})

// Bing API 测试验证 Schema
const bingApiTestSchema = z.object({
  apiKey: z.string().trim().min(1, 'API Key 不能为空'),
  siteUrl: z.string().trim().url('Site URL 必须是有效的 URL'),
  testUrl: z.string().trim().url('Test URL 必须是有效的 URL').optional(),
})

/**
 * 更新 Google Search Console API 配置
 */
export async function updateGoogleConfig(data: GoogleConfigData): Promise<UpdateConfigResult> {
  try {
    // 1. 验证输入数据
    const validated = googleConfigSchema.parse(data)

    // 2. 查找现有配置
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    })

    if (!config) {
      return {
        success: false,
        message: 'Google 配置不存在，请先运行初始化脚本',
      }
    }

    // 3. 获取现有的 extraConfig
    const existingExtraConfig = (config.extraConfig && typeof config.extraConfig === 'object'
      ? config.extraConfig
      : {}) as any

    console.log('[更新 Google 配置] 当前配置:', {
      配置ID: config.id,
      当前isEnabled: config.isEnabled,
      当前siteUrl: config.siteUrl,
      当前accessToken: existingExtraConfig.accessToken ? '已配置' : '未配置',
      当前refreshToken: existingExtraConfig.refreshToken ? '已配置' : '未配置',
      当前clientId: existingExtraConfig.clientId ? '已配置' : '未配置',
      当前clientSecret: existingExtraConfig.clientSecret ? '已配置' : '未配置',
    })

    console.log('[更新 Google 配置] 提交的数据:', {
      isEnabled: validated.isEnabled,
      siteUrl: validated.siteUrl || '未提供',
      accessToken: validated.accessToken ? `已提供 (${validated.accessToken.length} 字符)` : '未提供',
      refreshToken: validated.refreshToken ? '已提供' : '未提供',
      clientId: validated.clientId ? '已提供' : '未提供',
      clientSecret: validated.clientSecret ? '已提供' : '未提供',
    })

    // 4. 构建 extraConfig，合并提供的字段和已有字段
    const extraConfig: any = {
      ...existingExtraConfig,
    }

    // 只有当提供了新值时才更新
    if (validated.accessToken) {
      extraConfig.accessToken = validated.accessToken
      console.log('[更新 Google 配置] 更新 accessToken')
    }
    if (validated.refreshToken) {
      extraConfig.refreshToken = validated.refreshToken
      console.log('[更新 Google 配置] 更新 refreshToken')
    }
    if (validated.clientId) {
      extraConfig.clientId = validated.clientId
      console.log('[更新 Google 配置] 更新 clientId')
    }
    if (validated.clientSecret) {
      extraConfig.clientSecret = validated.clientSecret
      console.log('[更新 Google 配置] 更新 clientSecret')
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

    // 5. 更新数据库
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: validated.isEnabled,
        siteUrl: validated.siteUrl || config.siteUrl,
        extraConfig,
      },
    })

    console.log('[更新 Google 配置] ✅ 配置已成功更新')

    // 6. 重新验证缓存
    revalidatePath('/admin/seo-submissions')
    revalidatePath('/admin/seo-submissions/config')
    revalidatePath('/admin/seo-submissions/google')

    return {
      success: true,
      message: 'Google 配置已更新',
    }
  } catch (error) {
    console.error('[更新 Google 配置] 错误:', error)

    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join('; ')
      return {
        success: false,
        message: `数据验证失败: ${errorMessages}`,
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : '更新配置时发生错误',
    }
  }
}

/**
 * 更新 Bing 配置
 */
export async function updateBingConfig(data: BingConfigData): Promise<UpdateConfigResult> {
  try {
    // 1. 验证输入数据
    const validated = bingConfigSchema.parse(data)

    // 2. 查找现有配置
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
      isEnabled: validated.isEnabled,
      apiKey: validated.apiKey ? '已提供' : '未提供',
      siteUrl: validated.siteUrl || '未提供',
    })

    // 3. 更新数据库
    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: validated.isEnabled,
        apiKey: validated.apiKey || config.apiKey,
        siteUrl: validated.siteUrl || config.siteUrl,
      },
    })

    console.log('[更新 Bing 配置] ✅ 配置已成功更新')

    // 4. 重新验证缓存
    revalidatePath('/admin/seo-submissions')
    revalidatePath('/admin/seo-submissions/config')
    revalidatePath('/admin/seo-submissions/bing')

    return {
      success: true,
      message: 'Bing 配置已更新',
    }
  } catch (error) {
    console.error('[更新 Bing 配置] 错误:', error)

    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join('; ')
      return {
        success: false,
        message: `数据验证失败: ${errorMessages}`,
      }
    }

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
    // 验证输入数据
    const validated = googleApiTestSchema.parse(data)

    // 默认测试 URL 使用网站首页
    const testUrl = validated.testUrl || validated.siteUrl

    const result = await checkGoogleIndexWithAPI(testUrl, validated.accessToken, validated.siteUrl)

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

    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join('; ')
      return {
        success: false,
        message: `数据验证失败: ${errorMessages}`,
      }
    }

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
    // 验证输入数据
    const validated = bingApiTestSchema.parse(data)

    // 默认测试 URL 使用网站首页
    const testUrl = validated.testUrl || validated.siteUrl

    const result = await checkBingIndexWithAPI(testUrl, validated.apiKey, validated.siteUrl)

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

    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join('; ')
      return {
        success: false,
        message: `数据验证失败: ${errorMessages}`,
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 测试失败',
    }
  }
}
