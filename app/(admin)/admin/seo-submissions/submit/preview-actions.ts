/**
 * URL 预览 Server Actions
 */

'use server'

import { prisma } from '@/lib/prisma'
import {
  generateGameUrls,
  generateCategoryUrls,
  generateTagUrls,
  generatePageTypeUrls,
  type UrlInfo,
} from '@/lib/seo-submissions/url-generator'

export interface PreviewUrlsInput {
  games?: string[]
  categories?: string[]
  tags?: string[]
  pageTypes?: string[]
}

export interface PreviewUrlsResult {
  success: boolean
  urls: UrlInfo[]
  stats: {
    totalUrls: number
    byType: {
      game: number
      category: number
      tag: number
      pagetype: number
    }
    byLocale: Record<string, number>
  }
}

/**
 * 预览选中内容将生成的 URLs
 */
export async function previewUrls(
  input: PreviewUrlsInput
): Promise<PreviewUrlsResult> {
  try {
    const allUrls: UrlInfo[] = []

    // 游戏 URLs
    if (input.games && input.games.length > 0) {
      const games = await prisma.game.findMany({
        where: { id: { in: input.games } },
        select: { id: true, slug: true, title: true },
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
        allUrls.push(...urls)
      }
    }

    // 标签 URLs
    if (input.tags && input.tags.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: input.tags } },
        select: { id: true, slug: true, name: true },
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
        select: { id: true, slug: true, title: true },
      })

      for (const pageType of pageTypes) {
        const urls = generatePageTypeUrls(pageType.slug, pageType.id)
        allUrls.push(...urls)
      }
    }

    // 统计信息
    const byType = {
      game: allUrls.filter((u) => u.type === 'game').length,
      category: allUrls.filter((u) => u.type === 'category').length,
      tag: allUrls.filter((u) => u.type === 'tag').length,
      pagetype: allUrls.filter((u) => u.type === 'pagetype').length,
    }

    const byLocale: Record<string, number> = {}
    allUrls.forEach((u) => {
      if (u.locale) {
        byLocale[u.locale] = (byLocale[u.locale] || 0) + 1
      }
    })

    return {
      success: true,
      urls: allUrls,
      stats: {
        totalUrls: allUrls.length,
        byType,
        byLocale,
      },
    }
  } catch (error) {
    console.error('[预览] ❌ 预览失败:', error)
    return {
      success: false,
      urls: [],
      stats: {
        totalUrls: 0,
        byType: { game: 0, category: 0, tag: 0, pagetype: 0 },
        byLocale: {},
      },
    }
  }
}
