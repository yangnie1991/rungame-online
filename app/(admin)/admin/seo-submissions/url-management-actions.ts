/**
 * URL 管理 Server Actions
 * 用于生成和管理待收录的 URL 列表
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateAllUrls } from '@/lib/seo-submissions/url-generator'

export interface GenerateUrlsResult {
  success: boolean
  message: string
  stats?: {
    total: number
    new: number
    existing: number
    byType: {
      game: number
      category: number
      tag: number
      pagetype: number
      other: number
    }
  }
}

/**
 * 生成所有网站 URL 并存入数据库
 * 用于初始化或更新 URL 列表
 */
export async function generateAllUrlsToDatabase(): Promise<GenerateUrlsResult> {
  try {
    console.log(`[URL生成] 开始生成 URL...`)

    // 1. 生成所有 URL
    const allUrls = await generateAllUrls()
    console.log(`[URL生成] 共生成 ${allUrls.length} 个 URL`)

    // 2. 检查哪些 URL 已存在
    const existingUrls = await prisma.urlSubmission.findMany({
      where: {
        url: { in: allUrls.map((u) => u.url) },
      },
      select: { url: true },
    })

    const existingUrlSet = new Set(existingUrls.map((u) => u.url))

    // 3. 筛选出新的 URL
    const newUrls = allUrls.filter((u) => !existingUrlSet.has(u.url))
    console.log(`[URL生成] 新增 ${newUrls.length} 个 URL，已存在 ${existingUrls.length} 个`)

    // 4. 批量插入新 URL
    if (newUrls.length > 0) {
      await prisma.urlSubmission.createMany({
        data: newUrls.map((urlInfo) => ({
          url: urlInfo.url,
          urlType: urlInfo.type as any,
          entityId: urlInfo.entityId,
          locale: urlInfo.locale,
        })),
      })
    }

    // 5. 统计各类型 URL 数量
    const stats = {
      total: allUrls.length,
      new: newUrls.length,
      existing: existingUrls.length,
      byType: {
        game: allUrls.filter((u) => u.type === 'game').length,
        category: allUrls.filter((u) => u.type === 'category').length,
        tag: allUrls.filter((u) => u.type === 'tag').length,
        pagetype: allUrls.filter((u) => u.type === 'pagetype').length,
        other: allUrls.filter((u) => u.type === 'other' || u.type === 'sitemap')
          .length,
      },
    }

    // 6. 重新验证页面
    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: `成功生成 ${stats.total} 个 URL，新增 ${stats.new} 个，已存在 ${stats.existing} 个`,
      stats,
    }
  } catch (error) {
    console.error('[URL生成] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成 URL 时发生错误',
    }
  }
}

/**
 * 从 Sitemap 中提取 URL 并存入数据库
 * （可选功能，暂时保留接口）
 */
export async function importUrlsFromSitemap(
  searchEngineId: string,
  sitemapUrl: string
): Promise<GenerateUrlsResult> {
  try {
    // TODO: 实现从 Sitemap XML 解析 URL 的逻辑
    // 这需要额外的 XML 解析库

    return {
      success: false,
      message: '从 Sitemap 导入功能暂未实现',
    }
  } catch (error) {
    console.error('[Sitemap导入] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '导入失败',
    }
  }
}

/**
 * 清空所有 URL 记录
 * 危险操作，需要确认
 */
export async function clearAllUrls(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const result = await prisma.urlSubmission.deleteMany({})

    revalidatePath('/admin/seo-submissions')

    return {
      success: true,
      message: `已清空 ${result.count} 条 URL 记录`,
    }
  } catch (error) {
    console.error('[清空URL] 错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '清空失败',
    }
  }
}
