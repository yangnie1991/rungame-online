/**
 * 搜索引擎专用提交 Server Actions
 * Google: 手动提交（生成URL列表，复制后手动提交到Search Console）
 * Bing: 自动推送（通过IndexNow API）
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { submitUrls as submitToIndexNow } from '@/lib/seo-submissions/indexnow'
import {
  generateGameUrls,
  generateCategoryUrls,
  generateTagUrls,
  generatePageTypeUrls,
} from '@/lib/seo-submissions/url-generator'

export interface ContentSelection {
  games?: string[] // Game IDs
  categories?: string[] // Category IDs
  tags?: string[] // Tag IDs
  pageTypes?: string[] // PageType IDs
}

export interface GeneratedUrl {
  url: string
  type: 'game' | 'category' | 'tag' | 'pagetype'
  entityId: string
  locale: string
  entityName: string // 用于显示
}

/**
 * Google: 生成URL列表（不实际提交）
 */
export async function generateGoogleUrls(
  selection: ContentSelection
): Promise<{ success: boolean; message: string; urls?: GeneratedUrl[] }> {
  try {
    const allUrls: GeneratedUrl[] = []

    // 游戏 URLs
    if (selection.games && selection.games.length > 0) {
      const games = await prisma.game.findMany({
        where: { id: { in: selection.games } },
        select: { id: true, slug: true, title: true },
      })

      for (const game of games) {
        const urls = generateGameUrls(game.slug, game.id)
        allUrls.push(
          ...urls.map((u) => ({
            ...u,
            entityName: game.title,
          }))
        )
      }
    }

    // 分类 URLs
    if (selection.categories && selection.categories.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: selection.categories } },
        select: {
          id: true,
          slug: true,
          name: true,
          parent: { select: { slug: true } },
        },
      })

      for (const category of categories) {
        const urls = generateCategoryUrls(
          category.slug,
          category.id,
          category.parent?.slug
        )
        allUrls.push(
          ...urls.map((u) => ({
            ...u,
            entityName: category.name,
          }))
        )
      }
    }

    // 标签 URLs
    if (selection.tags && selection.tags.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: selection.tags } },
        select: { id: true, slug: true, name: true },
      })

      for (const tag of tags) {
        const urls = generateTagUrls(tag.slug, tag.id)
        allUrls.push(
          ...urls.map((u) => ({
            ...u,
            entityName: tag.name,
          }))
        )
      }
    }

    // PageType URLs
    if (selection.pageTypes && selection.pageTypes.length > 0) {
      const pageTypes = await prisma.pageType.findMany({
        where: { id: { in: selection.pageTypes } },
        select: { id: true, slug: true, title: true },
      })

      for (const pageType of pageTypes) {
        const urls = generatePageTypeUrls(pageType.slug, pageType.id)
        allUrls.push(
          ...urls.map((u) => ({
            ...u,
            entityName: pageType.title,
          }))
        )
      }
    }

    if (allUrls.length === 0) {
      return {
        success: false,
        message: '未找到有效的 URL',
      }
    }

    return {
      success: true,
      message: `成功生成 ${allUrls.length} 个 URL`,
      urls: allUrls,
    }
  } catch (error) {
    console.error('[Google URL生成] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成URL时发生错误',
    }
  }
}

/**
 * Google: 根据 submission IDs 标记为已手动提交
 */
export async function markGoogleUrlsAsSubmittedByIds(
  submissionIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    if (submissionIds.length === 0) {
      return {
        success: false,
        message: '请选择要标记的 URL',
      }
    }

    // 批量更新提交记录
    const result = await prisma.urlSubmission.updateMany({
      where: {
        id: { in: submissionIds },
      },
      data: {
        googleSubmitStatus: 'SUBMITTED',
        googleSubmittedAt: new Date(),
        googleSubmitStatusMessage: '已手动提交到 Google Search Console',
      },
    })

    revalidatePath('/admin/seo-submissions/google')

    return {
      success: true,
      message: `已标记 ${result.count} 个 URL 为已提交`,
    }
  } catch (error) {
    console.error('[Google 标记提交] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '标记提交状态时发生错误',
    }
  }
}

/**
 * Google: 标记URLs为已手动提交（保留旧的接口用于兼容）
 */
export async function markGoogleUrlsAsSubmitted(
  urls: GeneratedUrl[]
): Promise<{ success: boolean; message: string }> {
  try {
    // 创建或更新提交记录
    const submissions = await Promise.all(
      urls.map((urlInfo) =>
        prisma.urlSubmission.upsert({
          where: { url: urlInfo.url },
          create: {
            url: urlInfo.url,
            urlType: urlInfo.type,
            entityId: urlInfo.entityId,
            locale: urlInfo.locale || undefined,
            googleSubmitStatus: 'SUBMITTED', // 标记为手动已提交
            googleSubmittedAt: new Date(),
            googleSubmitStatusMessage: '已手动提交到 Google Search Console',
          },
          update: {
            googleSubmitStatus: 'SUBMITTED',
            googleSubmittedAt: new Date(),
            googleSubmitStatusMessage: '已手动提交到 Google Search Console',
          },
        })
      )
    )

    revalidatePath('/admin/seo-submissions/google')

    return {
      success: true,
      message: `已标记 ${submissions.length} 个 URL 为已提交`,
    }
  } catch (error) {
    console.error('[Google 标记提交] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '标记提交状态时发生错误',
    }
  }
}

/**
 * Bing: 自动推送URLs（通过IndexNow）
 */
export async function submitBingUrls(
  selection: ContentSelection
): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    // 获取 Bing IndexNow 配置
    const bingConfig = await prisma.searchEngineConfig.findFirst({
      where: { type: 'indexnow' },
    })

    if (!bingConfig || !bingConfig.isEnabled) {
      return {
        success: false,
        message: 'Bing IndexNow 配置未启用',
      }
    }

    if (!bingConfig.apiKey) {
      return {
        success: false,
        message: 'Bing IndexNow API Key 未配置',
      }
    }

    // 1. 生成所有 URLs
    const allUrls: Array<{
      url: string
      type: 'game' | 'category' | 'tag' | 'pagetype'
      entityId: string
      locale: string
    }> = []

    // 游戏 URLs
    if (selection.games && selection.games.length > 0) {
      const games = await prisma.game.findMany({
        where: { id: { in: selection.games } },
        select: { id: true, slug: true },
      })

      for (const game of games) {
        const urls = generateGameUrls(game.slug, game.id)
        allUrls.push(...urls)
      }
    }

    // 分类 URLs
    if (selection.categories && selection.categories.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: selection.categories } },
        select: {
          id: true,
          slug: true,
          parent: { select: { slug: true } },
        },
      })

      for (const category of categories) {
        const urls = generateCategoryUrls(
          category.slug,
          category.id,
          category.parent?.slug
        )
        allUrls.push(...urls)
      }
    }

    // 标签 URLs
    if (selection.tags && selection.tags.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: selection.tags } },
        select: { id: true, slug: true },
      })

      for (const tag of tags) {
        const urls = generateTagUrls(tag.slug, tag.id)
        allUrls.push(...urls)
      }
    }

    // PageType URLs
    if (selection.pageTypes && selection.pageTypes.length > 0) {
      const pageTypes = await prisma.pageType.findMany({
        where: { id: { in: selection.pageTypes } },
        select: { id: true, slug: true },
      })

      for (const pageType of pageTypes) {
        const urls = generatePageTypeUrls(pageType.slug, pageType.id)
        allUrls.push(...urls)
      }
    }

    if (allUrls.length === 0) {
      return {
        success: false,
        message: '未找到有效的 URL',
      }
    }

    // 2. 创建或更新提交记录（PENDING 状态）
    const submissions = await Promise.all(
      allUrls.map((urlInfo) =>
        prisma.urlSubmission.upsert({
          where: { url: urlInfo.url },
          create: {
            url: urlInfo.url,
            urlType: urlInfo.type,
            entityId: urlInfo.entityId,
            locale: urlInfo.locale || undefined,
            bingSubmitStatus: 'PENDING',
          },
          update: {
            bingSubmitStatus: 'PENDING',
          },
        })
      )
    )

    // 3. 调用 IndexNow API
    try {
      const urlList = allUrls.map((u) => u.url)

      const results = await submitToIndexNow(
        urlList,
        {
          apiKey: bingConfig.apiKey,
          keyLocation: bingConfig.extraConfig?.keyLocation || '',
          host: new URL(bingConfig.siteUrl!).hostname,
          apiEndpoint: bingConfig.apiEndpoint,
        },
        100 // 每批 100 个 URL
      )

      // 4. 更新提交记录状态
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const submission = submissions[i]

        if (submission) {
          await prisma.urlSubmission.update({
            where: { id: submission.id },
            data: {
              bingSubmitStatus: result.success ? 'SUCCESS' : 'FAILED',
              bingSubmitStatusMessage: result.message,
              bingSubmitHttpStatus: result.statusCode,
              bingSubmitResponseTime: result.responseTime,
              bingSubmitResponseBody: result.responseBody,
              bingSubmittedAt: new Date(),
            },
          })

          if (result.success) {
            successCount++
          } else {
            failedCount++
          }
        }
      }

      revalidatePath('/admin/seo-submissions/bing')

      return {
        success: true,
        message: `成功推送 ${successCount} 个 URL，失败 ${failedCount} 个`,
        stats: {
          total: allUrls.length,
          success: successCount,
          failed: failedCount,
        },
      }
    } catch (error) {
      console.error('[Bing推送] IndexNow API 错误:', error)

      // 标记所有为失败
      await Promise.all(
        submissions.map((submission) =>
          prisma.urlSubmission.update({
            where: { id: submission.id },
            data: {
              bingSubmitStatus: 'FAILED',
              bingSubmitStatusMessage:
                error instanceof Error ? error.message : '推送过程中发生错误',
            },
          })
        )
      )

      return {
        success: false,
        message: error instanceof Error ? error.message : 'IndexNow 推送失败',
      }
    }
  } catch (error) {
    console.error('[Bing推送] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '推送过程中发生错误',
    }
  }
}
