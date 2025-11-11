/**
 * SEO URL 手动提交 Server Actions
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

export interface SubmitUrlsInput {
  games?: string[] // Game IDs
  categories?: string[] // Category IDs
  tags?: string[] // Tag IDs
  pageTypes?: string[] // PageType IDs
  engines?: string[] // SearchEngineConfig IDs
}

export interface SubmitUrlsResult {
  success: boolean
  message: string
  stats?: {
    totalUrls: number
    submitted: number
    successful: number
    failed: number
  }
}

/**
 * 手动提交选中的 URLs 到搜索引擎
 */
export async function submitSelectedUrls(
  input: SubmitUrlsInput
): Promise<SubmitUrlsResult> {
  try {
    // 验证输入
    if (
      (!input.games || input.games.length === 0) &&
      (!input.categories || input.categories.length === 0) &&
      (!input.tags || input.tags.length === 0) &&
      (!input.pageTypes || input.pageTypes.length === 0)
    ) {
      return {
        success: false,
        message: '请至少选择一个要提交的内容',
      }
    }

    if (!input.engines || input.engines.length === 0) {
      return {
        success: false,
        message: '请至少选择一个搜索引擎',
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
    if (input.games && input.games.length > 0) {
      const games = await prisma.game.findMany({
        where: { id: { in: input.games } },
        select: { id: true, slug: true },
      })

      for (const game of games) {
        const urls = generateGameUrls(game.slug, game.id)
        allUrls.push(...urls)
      }
    }

    // 分类 URLs
    if (input.categories && input.categories.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: input.categories } },
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
    if (input.tags && input.tags.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: input.tags } },
        select: { id: true, slug: true },
      })

      for (const tag of tags) {
        const urls = generateTagUrls(tag.slug, tag.id)
        allUrls.push(...urls)
      }
    }

    // PageType URLs
    if (input.pageTypes && input.pageTypes.length > 0) {
      const pageTypes = await prisma.pageType.findMany({
        where: { id: { in: input.pageTypes } },
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

    // 2. 获取搜索引擎配置
    const engineConfigs = await prisma.searchEngineConfig.findMany({
      where: {
        id: { in: input.engines },
        isEnabled: true,
      },
    })

    if (engineConfigs.length === 0) {
      return {
        success: false,
        message: '未找到启用的搜索引擎配置',
      }
    }

    // 3. 提交到每个搜索引擎
    let totalSubmitted = 0
    let totalSuccess = 0
    let totalFailed = 0

    for (const engineConfig of engineConfigs) {
      // 跳过 Google（不支持主动推送）
      if (engineConfig.type === 'google') {
        console.log('[提交] ⏭️  跳过 Google（仅支持 Sitemap）')
        continue
      }

      console.log(`[提交] 📤 开始提交到 ${engineConfig.name}...`)

      // 为当前引擎创建提交记录
      const submissionPromises = allUrls.map(async (urlInfo) => {
        return prisma.urlSubmission.create({
          data: {
            url: urlInfo.url,
            urlType: urlInfo.type,
            entityId: urlInfo.entityId,
            locale: urlInfo.locale || undefined,
            searchEngineConfigId: engineConfig.id,
            searchEngineName: engineConfig.name,
            status: 'PENDING',
            submitMethod: 'manual',
          },
        })
      })

      const submissions = await Promise.all(submissionPromises)
      totalSubmitted += submissions.length

      // 根据引擎类型调用对应的 API
      if (engineConfig.type === 'indexnow') {
        try {
          const urlList = allUrls.map((u) => u.url)

          const results = await submitToIndexNow(
            urlList,
            {
              apiKey: engineConfig.apiKey!,
              keyLocation: engineConfig.extraConfig?.keyLocation || '',
              host: new URL(engineConfig.siteUrl!).hostname,
              apiEndpoint: engineConfig.apiEndpoint,
            },
            100 // 每批 100 个 URL
          )

          // 更新提交记录状态
          for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const submission = submissions[i]

            if (submission) {
              await prisma.urlSubmission.update({
                where: { id: submission.id },
                data: {
                  status: result.success ? 'SUCCESS' : 'FAILED',
                  statusMessage: result.message,
                  httpStatus: result.statusCode,
                  responseTime: result.responseTime,
                  submittedAt: new Date(),
                  completedAt: new Date(),
                },
              })

              if (result.success) {
                totalSuccess++
              } else {
                totalFailed++
              }
            }
          }

          // 更新搜索引擎统计
          await prisma.searchEngineConfig.update({
            where: { id: engineConfig.id },
            data: {
              totalSubmitted: { increment: submissions.length },
              totalSuccess: { increment: results.filter((r) => r.success).length },
              totalFailed: { increment: results.filter((r) => !r.success).length },
              lastSubmitAt: new Date(),
            },
          })

          console.log(`[提交] ✅ ${engineConfig.name} 提交完成:`, {
            total: results.length,
            success: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          })
        } catch (error) {
          console.error(`[提交] ❌ ${engineConfig.name} 提交失败:`, error)

          // 标记所有提交为失败
          await Promise.all(
            submissions.map((submission) =>
              prisma.urlSubmission.update({
                where: { id: submission.id },
                data: {
                  status: 'FAILED',
                  statusMessage:
                    error instanceof Error
                      ? error.message
                      : '提交过程中发生错误',
                  completedAt: new Date(),
                },
              })
            )
          )

          totalFailed += submissions.length
        }
      } else if (engineConfig.type === 'baidu') {
        // 暂时跳过百度（用户要求先完成 Bing 和 Google）
        console.log('[提交] ⏭️  跳过百度推送（暂未启用）')

        // 标记为 PENDING
        await Promise.all(
          submissions.map((submission) =>
            prisma.urlSubmission.update({
              where: { id: submission.id },
              data: {
                status: 'PENDING',
                statusMessage: '百度推送暂未启用',
              },
            })
          )
        )
      }
    }

    // 4. 重新验证相关页面
    revalidatePath('/admin/seo-submissions')
    revalidatePath('/admin/seo-submissions/config')

    return {
      success: true,
      message: `成功提交 ${totalSuccess} 个 URL，失败 ${totalFailed} 个`,
      stats: {
        totalUrls: allUrls.length,
        submitted: totalSubmitted,
        successful: totalSuccess,
        failed: totalFailed,
      },
    }
  } catch (error) {
    console.error('[提交] ❌ 提交失败:', error)

    return {
      success: false,
      message:
        error instanceof Error ? error.message : '提交过程中发生未知错误',
    }
  }
}
