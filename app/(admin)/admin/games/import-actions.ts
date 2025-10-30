'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS } from '@/lib/cache-helpers'
import {
  fetchGamePixFeed,
  fetchGamePixCategories,
  type GamePixGameItem,
} from '@/lib/gamepix-importer'
import { findLocalCategoryByGamePixCategory } from '@/lib/category-mapping'
import { uploadGamePixImageToR2, batchUploadGamePixImagesToR2 } from '@/lib/gamepix-image-upload'

/**
 * 计算宽高比的最简形式（使用 GCD）
 */
function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9'
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

/**
 * 批量创建标签
 * @param tagNames 标签名称数组
 * @returns 创建的标签 ID 数组
 */
export async function batchCreateTags(tagNames: string[]) {
  try {
    const createdTags: Array<{ name: string; id: string }> = []

    for (const tagName of tagNames) {
      const normalizedName = tagName.trim()
      if (!normalizedName) continue

      // 生成 slug
      const slug = normalizedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')

      // 使用 upsert 避免并发冲突
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {}, // 已存在则不更新
        create: {
          slug,
          name: normalizedName,
          icon: '',
          isEnabled: true,
          translations: {
            create: [
              { locale: 'en', name: normalizedName },
              { locale: 'zh', name: normalizedName }, // 默认使用英文名，后续可手动翻译
            ]
          }
        }
      })

      createdTags.push({ name: normalizedName, id: tag.id })
      console.log(`✅ 标签创建/获取成功: ${normalizedName} (ID: ${tag.id})`)
    }

    // 失效标签缓存，确保新标签立即可见
    revalidateTag(CACHE_TAGS.TAGS)
    revalidatePath('/admin/games')
    revalidatePath('/admin/tags')

    return {
      success: true,
      data: createdTags,
      message: `成功处理 ${createdTags.length} 个标签`
    }
  } catch (error) {
    console.error('批量创建标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      data: []
    }
  }
}

// 导入配置 Schema
const importConfigSchema = z.object({
  siteId: z.string().min(1, 'Site ID 不能为空'),
  categoryId: z.string().optional(), // 目标分类（可选，如果不提供则自动匹配）
  orderBy: z.enum(['quality', 'published']).default('quality'),
  perPage: z.enum(['12', '24', '48', '96']).default('48'),
  maxGames: z.number().int().min(1).max(1000).optional(),
  category: z.string().optional(), // GamePix 分类筛选
  page: z.number().int().min(1).default(1).optional(), // 页码
  skipExisting: z.boolean().default(true), // 是否跳过已存在的游戏
  autoPublish: z.boolean().default(false), // 是否自动发布
  markAsFeatured: z.boolean().default(false), // 是否标记为精选
  autoMatchCategory: z.boolean().default(true), // 是否自动匹配分类（新增）
})

export type ImportConfig = z.infer<typeof importConfigSchema>

// 导入结果类型
export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  failed: number
  errors: Array<{ game: string; error: string }>
  error?: string // 添加 error 字段用于单个错误消息
  message?: string
}

/**
 * 获取 GamePix 分类列表
 */
export async function getGamePixCategories() {
  try {
    const categories = await fetchGamePixCategories()
    return {
      success: true,
      data: categories,
    }
  } catch (error) {
    console.error('获取 GamePix 分类失败:', error)
    return {
      success: false,
      error: '获取分类失败，请稍后重试',
    }
  }
}

/**
 * 自动匹配 GamePix 分类到本地子分类
 * @param gamePixCategory - GamePix 分类名称
 * @returns 匹配结果
 */
export async function matchGamePixCategory(gamePixCategory: string) {
  try {
    const matched = await findLocalCategoryByGamePixCategory(gamePixCategory)

    if (matched) {
      // 使用缓存层获取主分类信息
      const { getAllCategoriesForAdmin } = await import('@/lib/data/categories/cache')
      const allCategories = await getAllCategoriesForAdmin('zh')
      const mainCategory = allCategories.find(cat => cat.id === matched.mainCategoryId)

      return {
        success: true,
        data: {
          categoryId: matched.categoryId,
          mainCategoryId: matched.mainCategoryId,
          categoryName: matched.categoryName,
          mainCategoryName: mainCategory?.name || '未知',
          isMainCategory: matched.isMainCategory,
        },
      }
    }

    return {
      success: false,
      error: `未找到与 "${gamePixCategory}" 匹配的本地子分类`,
    }
  } catch (error) {
    console.error('自动匹配分类失败:', error)
    return {
      success: false,
      error: '自动匹配分类失败，请重试',
    }
  }
}

/**
 * 测试 GamePix Site ID 是否有效
 * @param siteId - Site ID
 * @returns 是否有效
 */
export async function testGamePixSiteId(siteId: string) {
  try {
    const feed = await fetchGamePixFeed(siteId, {
      perPage: 12,
      page: 1,
    })

    return {
      success: true,
      message: `Site ID 有效！找到 ${feed.items.length} 个游戏`,
      gamesCount: feed.items.length,
    }
  } catch (error) {
    console.error('测试 Site ID 失败:', error)
    return {
      success: false,
      error: 'Site ID 无效或网络错误',
    }
  }
}

/**
 * 导入单个 GamePix 游戏（支持自定义翻译和标签）
 * @param game - GamePix 游戏数据
 * @param config - 导入配置
 */
export async function importSingleGamePixGame(
  game: GamePixGameItem,
  config: {
    categoryId: string
    tagIds?: string[]
    width?: number
    height?: number
    banner?: string
    gameUrl?: string
    screenshots?: string[]
    videos?: string[]
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'MAINTENANCE'
    isFeatured: boolean
    // 英文主表字段
    title?: string
    description?: string
    keywords?: string
    metaTitle?: string
    metaDescription?: string
    contentSections?: Record<string, {content: string | object, order: number}>
    // 多语言翻译数组
    translations?: Array<{
      locale: string
      title?: string
      description?: string
      keywords?: string
      metaTitle?: string
      metaDescription?: string
      contentSections?: Record<string, {content: string | object, order: number}>
    }>
  }
) {
  try {
    const slug = game.namespace || `gamepix-${game.id}`

    // 检查游戏是否已存在
    const existing = await prisma.game.findUnique({
      where: { slug },
    })

    if (existing) {
      return {
        success: false,
        error: '游戏已存在',
      }
    }

    // 使用缓存层验证分类是否存在并获取父分类ID
    const { getAllCategoriesForAdmin } = await import('@/lib/data/categories/cache')
    const allCategories = await getAllCategoriesForAdmin('zh')
    const category = allCategories.find(cat => cat.id === config.categoryId)

    if (!category) {
      return {
        success: false,
        error: '目标分类不存在',
      }
    }

    // mainCategoryId 应该是父分类ID（如果是子分类）或自身ID（如果是主分类）
    const mainCategoryId = category.parentId || category.id

    // ========== 图片 URL（已在前端上传到 R2）==========
    // 注意：从 config 中获取的 URL 应该已经是 R2 URL（如果用户点击了上传按钮）
    // 如果用户没有上传，config 中的 URL 将是原始 GamePix URL
    const thumbnailUrl = game.banner_image || game.image
    const bannerUrl = config.banner || game.banner_image
    const screenshotsUrls = config.screenshots || []

    console.log('[importSingleGamePixGame] 使用图片 URL:', {
      thumbnail: thumbnailUrl,
      banner: bannerUrl,
      screenshots: screenshotsUrls.length
    })

    // ========== 准备英文主表字段 ==========
    const enTitle = config.title || game.title
    const enDescription = config.description || game.description
    const enKeywords = config.keywords || `${game.title}, ${game.category}, online game, free game, html5 game`
    const enMetaTitle = config.metaTitle || `${game.title} - Play Free Online`
    const enMetaDescription = config.metaDescription || game.description.substring(0, 160)
    const enContentSections = config.contentSections || undefined

    // ========== 准备非英文翻译 ==========
    const translationsToCreate = (config.translations || []).map(t => ({
      locale: t.locale,
      title: t.title || game.title,
      description: t.description || game.description,
      keywords: t.keywords || (t.locale === 'zh' ? `${game.title}, ${game.category}, 在线游戏, 免费游戏, HTML5游戏` : `${game.title}, ${game.category}, online game, free game, html5 game`),
      metaTitle: t.metaTitle || (t.locale === 'zh' ? `${game.title} - 免费在线游玩` : `${game.title} - Play Free Online`),
      metaDescription: t.metaDescription || game.description.substring(0, 160),
      translationInfo: t.contentSections ? t.contentSections : undefined,
    }))

    // 创建游戏
    const createdGame = await prisma.game.create({
      data: {
        slug,
        // ========== 英文基础信息（存储在主表）==========
        title: enTitle,
        description: enDescription,
        // ========== 英文 SEO 字段 ==========
        keywords: enKeywords,
        metaTitle: enMetaTitle,
        metaDescription: enMetaDescription,
        // ========== 媒体资源（使用 R2 CDN URL）==========
        thumbnail: thumbnailUrl,
        banner: bannerUrl,
        embedUrl: game.url,
        gameUrl: config.gameUrl || game.url,
        screenshots: screenshotsUrls,
        videos: config.videos || [],
        dimensions: {
          width: config.width || game.width,
          height: config.height || game.height,
          aspectRatio: calculateAspectRatio(config.width || game.width, config.height || game.height),
          orientation: game.orientation,
        },
        // ========== 来源信息 ==========
        sourcePlatform: 'gamepix',
        sourcePlatformId: game.id, // 存储 GamePix ID
        qualityScore: game.quality_score * 10, // 转换为 0-10 分
        // ========== 状态 ==========
        status: config.status,
        isFeatured: config.isFeatured,
        // ========== 统计 ==========
        playCount: 0,
        viewCount: 0,
        // ========== 时间管理（修复日期映射）==========
        releaseDate: game.date_published ? new Date(game.date_published) : undefined, // date_published → releaseDate（游戏原始发布日期）
        sourceUpdatedAt: game.date_modified ? new Date(game.date_modified) : undefined, // date_modified → sourceUpdatedAt（平台最后更新时间）
        importedAt: new Date(), // 导入到本站的时间
        // ========== 英文 ContentSections（可选）==========
        gameInfo: enContentSections || undefined,
        // ========== 关联分类 ==========
        gameCategories: {
          create: {
            categoryId: config.categoryId,
            mainCategoryId, // 使用父分类ID
            isPrimary: true,
            sortOrder: 0,
          },
        },
        // ========== 翻译（仅非英文语言）==========
        ...(translationsToCreate.length > 0
          ? {
            translations: {
              create: translationsToCreate,
            },
          }
          : {}),
        // ========== 关联标签（所有标签都已创建，直接使用 ID）==========
        ...(config.tagIds && config.tagIds.length > 0
          ? {
            tags: {
              create: config.tagIds.map((tagId) => ({
                tagId, // 所有 tagId 都是有效的 ID，前端已处理好
              })),
            },
          }
          : {}),
      },
    })

    // 失效相关缓存（游戏创建/删除会影响分类和标签的计数）
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidateTag(CACHE_TAGS.TAGS)
    revalidateTag(CACHE_TAGS.GAMES)
    revalidateTag(CACHE_TAGS.FEATURED_GAMES)
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS)
    revalidatePath('/admin/games')
    revalidatePath('/[locale]', 'layout')

    return {
      success: true,
      gameId: createdGame.id,
      message: '游戏导入成功',
    }
  } catch (error) {
    console.error(`导入游戏 ${game.title} 失败:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

/**
 * 根据 GamePix ID 删除已导入的游戏
 * @param gamePixId - GamePix 游戏 ID
 * @returns 删除结果
 */
export async function deleteGameByGamePixId(gamePixId: string) {
  try {
    // 查找游戏（使用 sourcePlatform 和 sourcePlatformId）
    const game = await prisma.game.findFirst({
      where: {
        sourcePlatform: 'gamepix',
        sourcePlatformId: gamePixId,
      },
    })

    if (!game) {
      return {
        success: false,
        error: '未找到该游戏',
      }
    }

    // 删除游戏（级联删除翻译和标签关联）
    await prisma.game.delete({
      where: { id: game.id },
    })

    // 失效相关缓存（游戏创建/删除会影响分类和标签的计数）
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidateTag(CACHE_TAGS.TAGS)
    revalidateTag(CACHE_TAGS.GAMES)
    revalidateTag(CACHE_TAGS.FEATURED_GAMES)
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS)
    revalidatePath('/admin/games')
    revalidatePath('/[locale]', 'layout')

    return {
      success: true,
      message: '游戏删除成功',
    }
  } catch (error) {
    console.error(`删除游戏失败 (GamePix ID: ${gamePixId}):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    }
  }
}

/**
 * 批量删除已导入的游戏
 * @param gamePixIds - GamePix 游戏 ID 数组
 * @returns 删除结果
 */
export async function deleteGamesByGamePixIds(gamePixIds: string[]) {
  try {
    // 直接批量删除（使用 sourcePlatform 和 sourcePlatformId）
    const result = await prisma.game.deleteMany({
      where: {
        sourcePlatform: 'gamepix',
        sourcePlatformId: {
          in: gamePixIds,
        },
      },
    })

    if (result.count === 0) {
      return {
        success: false,
        error: '未找到任何匹配的游戏',
      }
    }

    // 失效相关缓存（游戏创建/删除会影响分类和标签的计数）
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidateTag(CACHE_TAGS.TAGS)
    revalidateTag(CACHE_TAGS.GAMES)
    revalidateTag(CACHE_TAGS.FEATURED_GAMES)
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS)
    revalidatePath('/admin/games')
    revalidatePath('/[locale]', 'layout')

    return {
      success: true,
      deleted: result.count,
      message: `成功删除 ${result.count} 个游戏`,
    }
  } catch (error) {
    console.error('批量删除游戏失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量删除失败',
    }
  }
}

/**
 * 保存 GamePix 游戏的提取数据到缓存
 * @param namespace - 游戏的 namespace
 * @param extractedTags - 提取的标签数组
 * @param extractedMarkdown - 提取的 Markdown 内容
 */
export async function saveGamePixExtractedData(
  namespace: string,
  extractedTags: string[],
  extractedMarkdown: string,
  extractedVideos?: string[],
  extractedScreenshots?: string[]
) {
  try {
    const { prismaCache } = await import('@/lib/prisma-cache')

    // 更新缓存中的提取数据
    await prismaCache.gamePixGameCache.update({
      where: { namespace },
      data: {
        extractedTags,
        extractedMarkdown,
        extractedVideos: extractedVideos || [],
        extractedScreenshots: extractedScreenshots || [],
        extractedAt: new Date(),
      },
    })

    return {
      success: true,
      message: '提取数据已保存到缓存',
    }
  } catch (error) {
    console.error('保存提取数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存失败',
    }
  }
}

/**
 * 从缓存获取 GamePix 游戏的提取数据
 * @param namespace - 游戏的 namespace
 */
export async function getGamePixExtractedData(namespace: string) {
  try {
    const { prismaCache } = await import('@/lib/prisma-cache')

    const gameCache = await prismaCache.gamePixGameCache.findUnique({
      where: { namespace },
      select: {
        extractedTags: true,
        extractedMarkdown: true,
        extractedVideos: true,
        extractedScreenshots: true,
        extractedAt: true,
      },
    })

    if (!gameCache) {
      return {
        success: false,
        error: '未找到缓存数据',
      }
    }

    return {
      success: true,
      data: {
        tags: gameCache.extractedTags,
        markdownContent: gameCache.extractedMarkdown,
        videos: gameCache.extractedVideos,
        screenshots: gameCache.extractedScreenshots,
        extractedAt: gameCache.extractedAt,
      },
    }
  } catch (error) {
    console.error('获取提取数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
    }
  }
}
