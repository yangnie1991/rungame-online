/**
 * 收录状态检查和更新 Server Actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { checkGoogleIndexSimple, checkGoogleIndexWithAPI } from '@/lib/seo-submissions/google-index-check'
import { checkBingIndexSimple, checkBingIndexWithAPI } from '@/lib/seo-submissions/bing-index-check'

export interface CheckIndexResult {
  success: boolean
  message: string
  stats?: {
    total: number
    googleIndexed: number
    bingIndexed: number
    googleNotIndexed: number
    bingNotIndexed: number
    errors: number
  }
}

/**
 * 检查并更新单个 URL 的 Google 收录状态
 */
export async function checkGoogleIndexStatus(
  submissionId: string
): Promise<CheckIndexResult> {
  try {
    // 获取提交记录
    const submission = await prisma.urlSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return {
        success: false,
        message: '提交记录不存在',
      }
    }

    // 从数据库获取 Google 配置
    const googleConfig = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google', isEnabled: true },
    })

    console.log('[检查 Google 收录] Google 配置:', {
      配置存在: !!googleConfig,
      extraConfig存在: !!googleConfig?.extraConfig,
      extraConfigType: typeof googleConfig?.extraConfig,
      siteUrl: googleConfig?.siteUrl,
    })

    // 检查配置是否存在并已启用
    if (!googleConfig) {
      return {
        success: false,
        message: 'Google Search Console 配置不存在或未启用，请先在"搜索引擎配置"中配置并启用',
      }
    }

    // 提取 OAuth Access Token 和 siteUrl
    const accessToken = googleConfig?.extraConfig && typeof googleConfig.extraConfig === 'object'
      ? (googleConfig.extraConfig as any).accessToken
      : undefined
    const siteUrl = googleConfig?.siteUrl || undefined

    console.log('[检查 Google 收录] 认证信息:', {
      accessToken存在: !!accessToken,
      accessTokenLength: accessToken?.length,
      siteUrl,
      使用API: !!(accessToken && siteUrl),
    })

    // 检查必需的认证信息
    if (!accessToken || !siteUrl) {
      return {
        success: false,
        message: 'Google Search Console OAuth 认证信息不完整，请在"搜索引擎配置"中配置 OAuth 信息',
      }
    }

    // 使用官方 Search Console API 检查收录状态
    const result = await checkGoogleIndexWithAPI(submission.url, accessToken, siteUrl)

    // 更新数据库
    const previousIndexed = submission.indexedByGoogle
    await prisma.urlSubmission.update({
      where: { id: submissionId },
      data: {
        indexedByGoogle: result.isIndexed,
        googleIndexedAt: result.isIndexed ? (submission.googleIndexedAt || new Date()) : null,
        googleLastCheckAt: new Date(),
        googleIndexStatusRaw: result.statusRaw || null, // 保存完整的 API 响应数据
        googleCheckMessage: result.error || null,
      },
    })

    // 记录状态变化
    if (previousIndexed === true && !result.isIndexed) {
      console.log('[收录状态] ⚠️ Google 收录掉落:', submission.url)
    } else if (previousIndexed === false && result.isIndexed) {
      console.log('[收录状态] ✅ Google 新收录:', submission.url)
    }

    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: result.isIndexed ? 'Google 已收录' : 'Google 未收录',
      stats: {
        total: 1,
        googleIndexed: result.isIndexed ? 1 : 0,
        bingIndexed: 0,
        googleNotIndexed: result.isIndexed ? 0 : 1,
        bingNotIndexed: 0,
        errors: result.error ? 1 : 0,
      },
    }
  } catch (error) {
    console.error('[检查 Google 收录] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '检查失败',
    }
  }
}

/**
 * 检查并更新单个 URL 的 Bing 收录状态
 */
export async function checkBingIndexStatus(
  submissionId: string
): Promise<CheckIndexResult> {
  try {
    const submission = await prisma.urlSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return {
        success: false,
        message: '提交记录不存在',
      }
    }

    // 从数据库获取 Bing 配置
    const bingConfig = await prisma.searchEngineConfig.findFirst({
      where: { type: 'indexnow', isEnabled: true },
    })

    // 提取 API Key 和 siteUrl
    const apiKey = bingConfig?.apiKey || undefined
    const siteUrl = bingConfig?.siteUrl || undefined

    // 检查 Bing 收录状态（使用官方 Webmaster API）
    const result = apiKey && siteUrl
      ? await checkBingIndexWithAPI(submission.url, apiKey, siteUrl)
      : await checkBingIndexSimple(submission.url)

    // 更新数据库
    const previousIndexed = submission.indexedByBing
    await prisma.urlSubmission.update({
      where: { id: submissionId },
      data: {
        indexedByBing: result.isIndexed,
        bingIndexedAt: result.isIndexed ? (submission.bingIndexedAt || new Date()) : null,
        bingLastCheckAt: new Date(),
        bingIndexStatusRaw: result.statusRaw || null, // 保存完整的 API 响应数据
        bingCheckMessage: result.error || null,
      },
    })

    // 记录状态变化
    if (previousIndexed === true && !result.isIndexed) {
      console.log('[收录状态] ⚠️ Bing 收录掉落:', submission.url)
    } else if (previousIndexed === false && result.isIndexed) {
      console.log('[收录状态] ✅ Bing 新收录:', submission.url)
    }

    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: result.isIndexed ? 'Bing 已收录' : 'Bing 未收录',
      stats: {
        total: 1,
        googleIndexed: 0,
        bingIndexed: result.isIndexed ? 1 : 0,
        googleNotIndexed: 0,
        bingNotIndexed: result.isIndexed ? 0 : 1,
        errors: result.error ? 1 : 0,
      },
    }
  } catch (error) {
    console.error('[检查 Bing 收录] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '检查失败',
    }
  }
}

/**
 * 批量检查 Google 收录状态
 */
export async function checkGoogleIndexBatch(
  submissionIds: string[]
): Promise<CheckIndexResult> {
  try {
    if (submissionIds.length === 0) {
      return {
        success: false,
        message: '请选择要检查的提交记录',
      }
    }

    // 限制批量数量
    if (submissionIds.length > 20) {
      return {
        success: false,
        message: '一次最多检查 20 个 URL（避免被搜索引擎限制）',
      }
    }

    // 从数据库获取 Google 配置（批量检查时只获取一次）
    const googleConfig = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google', isEnabled: true },
    })

    console.log('[批量检查 Google] Google 配置:', {
      配置存在: !!googleConfig,
      extraConfig存在: !!googleConfig?.extraConfig,
      siteUrl: googleConfig?.siteUrl,
    })

    // 检查配置是否存在并已启用
    if (!googleConfig) {
      return {
        success: false,
        message: 'Google Search Console 配置不存在或未启用，请先在"搜索引擎配置"中配置并启用',
      }
    }

    const accessToken = googleConfig?.extraConfig && typeof googleConfig.extraConfig === 'object'
      ? (googleConfig.extraConfig as any).accessToken
      : undefined
    const siteUrl = googleConfig?.siteUrl || undefined

    console.log('[批量检查 Google] 认证信息:', {
      accessToken存在: !!accessToken,
      siteUrl,
      使用API: !!(accessToken && siteUrl),
      待检查数量: submissionIds.length,
    })

    // 检查必需的认证信息
    if (!accessToken || !siteUrl) {
      return {
        success: false,
        message: 'Google Search Console OAuth 认证信息不完整，请在"搜索引擎配置"中配置 OAuth 信息',
      }
    }

    const submissions = await prisma.urlSubmission.findMany({
      where: { id: { in: submissionIds } },
    })

    let googleIndexed = 0
    let googleNotIndexed = 0
    let errors = 0

    for (const submission of submissions) {
      try {
        const result = await checkGoogleIndexWithAPI(submission.url, accessToken, siteUrl)

        const previousIndexed = submission.indexedByGoogle

        await prisma.urlSubmission.update({
          where: { id: submission.id },
          data: {
            indexedByGoogle: result.isIndexed,
            googleIndexedAt: result.isIndexed ? (submission.googleIndexedAt || new Date()) : null,
            googleLastCheckAt: new Date(),
            googleIndexStatusRaw: result.statusRaw || null, // 保存完整的 API 响应数据
            googleCheckMessage: result.error || null,
          },
        })

        if (result.isIndexed) {
          googleIndexed++
        } else {
          googleNotIndexed++
        }

        // 记录状态变化
        if (previousIndexed === true && !result.isIndexed) {
          console.log('[批量检查] ⚠️ Google 收录掉落:', submission.url)
        } else if (previousIndexed === false && result.isIndexed) {
          console.log('[批量检查] ✅ Google 新收录:', submission.url)
        }

        if (result.error) {
          errors++
        }

        // 添加延迟避免被限制（2秒）
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('[批量检查] 错误:', submission.url, error)
        errors++
      }
    }

    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: `检查完成：${googleIndexed} 个已收录，${googleNotIndexed} 个未收录`,
      stats: {
        total: submissions.length,
        googleIndexed,
        bingIndexed: 0,
        googleNotIndexed,
        bingNotIndexed: 0,
        errors,
      },
    }
  } catch (error) {
    console.error('[批量检查 Google] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '批量检查失败',
    }
  }
}

/**
 * 批量检查 Bing 收录状态
 */
export async function checkBingIndexBatch(
  submissionIds: string[]
): Promise<CheckIndexResult> {
  try {
    if (submissionIds.length === 0) {
      return {
        success: false,
        message: '请选择要检查的提交记录',
      }
    }

    if (submissionIds.length > 20) {
      return {
        success: false,
        message: '一次最多检查 20 个 URL（避免被搜索引擎限制）',
      }
    }

    // 从数据库获取 Bing 配置（批量检查时只获取一次）
    const bingConfig = await prisma.searchEngineConfig.findFirst({
      where: { type: 'indexnow', isEnabled: true },
    })

    const apiKey = bingConfig?.apiKey || undefined
    const siteUrl = bingConfig?.siteUrl || undefined

    const submissions = await prisma.urlSubmission.findMany({
      where: { id: { in: submissionIds } },
    })

    let bingIndexed = 0
    let bingNotIndexed = 0
    let errors = 0

    for (const submission of submissions) {
      try {
        const result = apiKey && siteUrl
          ? await checkBingIndexWithAPI(submission.url, apiKey, siteUrl)
          : await checkBingIndexSimple(submission.url)

        const previousIndexed = submission.indexedByBing

        await prisma.urlSubmission.update({
          where: { id: submission.id },
          data: {
            indexedByBing: result.isIndexed,
            bingIndexedAt: result.isIndexed ? (submission.bingIndexedAt || new Date()) : null,
            bingLastCheckAt: new Date(),
            // bingIndexStatusRaw: result.statusRaw || null, // TODO: 确认 Bing API 返回数据后添加
            bingCheckMessage: result.error || null,
          },
        })

        if (result.isIndexed) {
          bingIndexed++
        } else {
          bingNotIndexed++
        }

        // 记录状态变化
        if (previousIndexed === true && !result.isIndexed) {
          console.log('[批量检查] ⚠️ Bing 收录掉落:', submission.url)
        } else if (previousIndexed === false && result.isIndexed) {
          console.log('[批量检查] ✅ Bing 新收录:', submission.url)
        }

        if (result.error) {
          errors++
        }

        // 添加延迟避免被限制（2秒）
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('[批量检查] 错误:', submission.url, error)
        errors++
      }
    }

    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: `检查完成：${bingIndexed} 个已收录，${bingNotIndexed} 个未收录`,
      stats: {
        total: submissions.length,
        googleIndexed: 0,
        bingIndexed,
        googleNotIndexed: 0,
        bingNotIndexed,
        errors,
      },
    }
  } catch (error) {
    console.error('[批量检查 Bing] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '批量检查失败',
    }
  }
}

/**
 * 检查所有搜索引擎的收录状态
 */
export async function checkAllIndexStatus(
  submissionIds: string[]
): Promise<CheckIndexResult> {
  try {
    if (submissionIds.length === 0) {
      return {
        success: false,
        message: '请选择要检查的提交记录',
      }
    }

    if (submissionIds.length > 10) {
      return {
        success: false,
        message: '一次最多检查 10 个 URL（检查 Google 和 Bing 需要较长时间）',
      }
    }

    const googleResult = await checkGoogleIndexBatch(submissionIds)
    const bingResult = await checkBingIndexBatch(submissionIds)

    return {
      success: googleResult.success && bingResult.success,
      message: `Google: ${googleResult.message}; Bing: ${bingResult.message}`,
      stats: {
        total: submissionIds.length,
        googleIndexed: googleResult.stats?.googleIndexed || 0,
        bingIndexed: bingResult.stats?.bingIndexed || 0,
        googleNotIndexed: googleResult.stats?.googleNotIndexed || 0,
        bingNotIndexed: bingResult.stats?.bingNotIndexed || 0,
        errors: (googleResult.stats?.errors || 0) + (bingResult.stats?.errors || 0),
      },
    }
  } catch (error) {
    console.error('[检查全部收录] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '检查失败',
    }
  }
}
