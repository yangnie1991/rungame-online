'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  CONTENT_SECTION_KEYS,
  type ContentSection,
} from '@/lib/types/game-info'

// Zod Schema for Game form validation
const gameSchema = z.object({
  slug: z.string().min(1, '游戏slug不能为空').regex(/^[a-z0-9-]+$/, 'slug只能包含小写字母、数字和连字符'),
  thumbnail: z.string().min(1, '缩略图不能为空').url('缩略图必须是有效的URL'),
  banner: z.string().url('横幅图必须是有效的URL').optional(),
  embedUrl: z.string().min(1, '嵌入URL不能为空').url('嵌入URL必须是有效的URL'),
  gameUrl: z.string().min(1, '游戏URL不能为空').url('游戏URL必须是有效的URL'),
  // 新架构: dimensions 替代 width 和 height
  dimensions: z.object({
    width: z.coerce.number().int().min(100, '宽度至少100px').default(800),
    height: z.coerce.number().int().min(100, '高度至少100px').default(600),
    aspectRatio: z.string().default('4:3'),
    orientation: z.enum(['landscape', 'portrait', 'square']).default('landscape'),
  }).default({ width: 800, height: 600, aspectRatio: '4:3', orientation: 'landscape' }),
  // 新架构: 英文基础字段
  title: z.string().min(1, '英文标题不能为空'),
  description: z.string().optional(),
  keywords: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  // 新增字段
  screenshots: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).default([]),
  developer: z.string().optional(),
  developerUrl: z.string().url().optional(),
  sourcePlatform: z.string().optional(),
  sourcePlatformId: z.string().optional(),
  categoryId: z.string().min(1, '必须选择分类'),
  tagIds: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  // 新架构: status 替代 isPublished (使用大写枚举值)
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'MAINTENANCE']).default('DRAFT'),
  // 新架构: gameInfo (ContentSections)
  gameInfo: z.object({
    [CONTENT_SECTION_KEYS.CONTROLS]: z.object({
      content: z.union([
        z.string(),
        z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
      ]),
      order: z.number().int().min(1),
    }).optional(),
    [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: z.object({
      content: z.union([
        z.string(),
        z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
      ]),
      order: z.number().int().min(1),
    }).optional(),
    [CONTENT_SECTION_KEYS.GAME_DETAILS]: z.object({
      content: z.union([
        z.string(),
        z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
      ]),
      order: z.number().int().min(1),
    }).optional(),
    [CONTENT_SECTION_KEYS.FAQ]: z.object({
      content: z.union([
        z.string(),
        z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
      ]),
      order: z.number().int().min(1),
    }).optional(),
    [CONTENT_SECTION_KEYS.EXTRAS]: z.object({
      content: z.union([
        z.string(),
        z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
      ]),
      order: z.number().int().min(1),
    }).optional(),
  }).optional(),
  // 翻译数据（非英文语言）
  translations: z.array(
    z.object({
      locale: z.string(), // 动态语言，不硬编码
      title: z.string().min(1, '标题不能为空'),
      description: z.string().optional(),
      keywords: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      // 新架构: translationInfo (ContentSections)
      translationInfo: z.object({
        [CONTENT_SECTION_KEYS.CONTROLS]: z.object({
          content: z.union([
            z.string(),
            z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
          ]),
          order: z.number().int().min(1),
        }).optional(),
        [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: z.object({
          content: z.union([
            z.string(),
            z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
          ]),
          order: z.number().int().min(1),
        }).optional(),
        [CONTENT_SECTION_KEYS.GAME_DETAILS]: z.object({
          content: z.union([
            z.string(),
            z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
          ]),
          order: z.number().int().min(1),
        }).optional(),
        [CONTENT_SECTION_KEYS.FAQ]: z.object({
          content: z.union([
            z.string(),
            z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
          ]),
          order: z.number().int().min(1),
        }).optional(),
        [CONTENT_SECTION_KEYS.EXTRAS]: z.object({
          content: z.union([
            z.string(),
            z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
          ]),
          order: z.number().int().min(1),
        }).optional(),
      }).optional(),
    })
  ).default([]),
})

export type GameFormData = z.infer<typeof gameSchema>

/**
 * 辅助函数：根据子分类ID获取父分类ID
 *
 * @param categoryId 子分类ID
 * @returns 父分类ID
 * @throws 如果传入的是主分类ID（parentId为null）则抛出错误
 */
async function getMainCategoryId(categoryId: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true }
  })

  if (!category) {
    throw new Error('分类不存在')
  }

  if (!category.parentId) {
    throw new Error('只能选择子分类，不能选择主分类')
  }

  return category.parentId
}

// Create a new game
export async function createGame(data: GameFormData) {
  try {
    const validated = gameSchema.parse(data)

    // Check if slug already exists
    const existing = await prisma.game.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return {
        success: false,
        error: `Slug "${validated.slug}" 已存在，请使用其他slug`,
      }
    }

    // 获取主分类ID（从选中的子分类查询）
    const mainCategoryId = await getMainCategoryId(validated.categoryId)

    // Create game with translations and tags
    const game = await prisma.game.create({
      data: {
        slug: validated.slug,
        thumbnail: validated.thumbnail,
        banner: validated.banner || null,
        embedUrl: validated.embedUrl,
        gameUrl: validated.gameUrl,
        // 新架构: dimensions JSON
        dimensions: validated.dimensions as Prisma.InputJsonValue,
        // 新架构: 英文基础字段
        title: validated.title,
        description: validated.description || null,
        keywords: validated.keywords || null,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        // 新增字段
        screenshots: validated.screenshots,
        videos: validated.videos,
        developer: validated.developer || null,
        developerUrl: validated.developerUrl || null,
        sourcePlatform: validated.sourcePlatform || null,
        sourcePlatformId: validated.sourcePlatformId || null,
        isFeatured: validated.isFeatured,
        // 新架构: status
        status: validated.status,
        // 新架构: gameInfo (ContentSections)
        ...(validated.gameInfo && { gameInfo: validated.gameInfo as Prisma.InputJsonValue }),
        // 翻译数据
        translations: {
          create: validated.translations.map(t => ({
            locale: t.locale,
            title: t.title,
            description: t.description || null,
            keywords: t.keywords || null,
            metaTitle: t.metaTitle || null,
            metaDescription: t.metaDescription || null,
            // translationInfo (ContentSections)
            ...(t.translationInfo && { translationInfo: t.translationInfo as Prisma.InputJsonValue }),
          })),
        },
        // 分类关联（使用 GameCategory 关联表）
        gameCategories: {
          create: {
            categoryId: validated.categoryId,      // 子分类ID
            mainCategoryId: mainCategoryId,        // 父分类ID
            isPrimary: true,                       // 标记为主分类
          }
        },
        // 标签关联
        tags: {
          create: validated.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        translations: true,
        tags: true,
        gameCategories: {
          include: {
            category: true,
          }
        },
      },
    })

    revalidatePath('/admin/games')
    return { success: true, data: game }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('创建游戏失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '创建游戏失败，请稍后重试' }
  }
}

/**
 * 获取游戏基础信息（用于编辑）
 *
 * ✅ 性能优化：不加载翻译数据，翻译数据将在用户切换到对应语言标签时按需加载
 */
export async function getGame(id: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        // ✅ 不加载翻译数据
        tags: {
          include: {
            tag: true,
          },
        },
        gameCategories: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!game) {
      return { success: false, error: '游戏不存在' }
    }

    return {
      success: true,
      data: {
        ...game,
        tagIds: game.tags.map((gt) => gt.tagId),
      },
    }
  } catch (error) {
    console.error('获取游戏失败:', error)
    return { success: false, error: '获取游戏失败' }
  }
}

/**
 * 按需加载某个语言的翻译数据
 *
 * @param gameId 游戏ID
 * @param locale 语言代码（如 'en', 'zh'）
 * @returns 该语言的翻译数据，如果不存在则返回空对象
 */
export async function getGameTranslation(gameId: string, locale: string) {
  try {
    const translation = await prisma.gameTranslation.findUnique({
      where: {
        gameId_locale: {
          gameId,
          locale,
        },
      },
    })

    return {
      success: true,
      data: translation || null,
    }
  } catch (error) {
    console.error(`获取游戏翻译失败 (locale: ${locale}):`, error)
    return { success: false, error: '获取翻译数据失败' }
  }
}

// Update an existing game
export async function updateGame(id: string, data: GameFormData) {
  try {
    const validated = gameSchema.parse(data)

    // Check if slug is taken by another game
    const existing = await prisma.game.findFirst({
      where: {
        slug: validated.slug,
        id: { not: id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: `Slug "${validated.slug}" 已被其他游戏使用`,
      }
    }

    // 获取主分类ID（从选中的子分类查询）
    const mainCategoryId = await getMainCategoryId(validated.categoryId)

    // Update game in a transaction
    const game = await prisma.$transaction(async (tx) => {
      // Delete existing translations
      await tx.gameTranslation.deleteMany({
        where: { gameId: id },
      })

      // Delete existing tag relationships
      await tx.gameTag.deleteMany({
        where: { gameId: id },
      })

      // Delete existing category relationships
      await tx.gameCategory.deleteMany({
        where: { gameId: id },
      })

      // Update game with new data
      return await tx.game.update({
        where: { id },
        data: {
          slug: validated.slug,
          thumbnail: validated.thumbnail,
          banner: validated.banner || null,
          embedUrl: validated.embedUrl,
          gameUrl: validated.gameUrl,
          // 新架构: dimensions JSON
          dimensions: validated.dimensions as Prisma.InputJsonValue,
          // 新架构: 英文基础字段
          title: validated.title,
          description: validated.description || null,
          keywords: validated.keywords || null,
          metaTitle: validated.metaTitle || null,
          metaDescription: validated.metaDescription || null,
          // 新增字段
          screenshots: validated.screenshots,
          videos: validated.videos,
          developer: validated.developer || null,
          developerUrl: validated.developerUrl || null,
          sourcePlatform: validated.sourcePlatform || null,
          sourcePlatformId: validated.sourcePlatformId || null,
          isFeatured: validated.isFeatured,
          // 新架构: status
          status: validated.status,
          // 新架构: gameInfo (ContentSections)
          ...(validated.gameInfo && { gameInfo: validated.gameInfo as Prisma.InputJsonValue }),
          // 翻译数据
          translations: {
            create: validated.translations.map(t => ({
              locale: t.locale,
              title: t.title,
              description: t.description || null,
              keywords: t.keywords || null,
              metaTitle: t.metaTitle || null,
              metaDescription: t.metaDescription || null,
              // translationInfo (ContentSections)
              ...(t.translationInfo && { translationInfo: t.translationInfo as Prisma.InputJsonValue }),
            })),
          },
          // 分类关联（使用 GameCategory 关联表）
          gameCategories: {
            create: {
              categoryId: validated.categoryId,      // 子分类ID
              mainCategoryId: mainCategoryId,        // 父分类ID
              isPrimary: true,                       // 标记为主分类
            }
          },
          // 标签关联
          tags: {
            create: validated.tagIds.map((tagId) => ({
              tagId,
            })),
          },
        },
        include: {
          translations: true,
          tags: true,
          gameCategories: {
            include: {
              category: true,
            }
          },
        },
      })
    })

    revalidatePath('/admin/games')
    revalidatePath(`/admin/games/${id}`)
    return { success: true, data: game }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('更新游戏失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '更新游戏失败，请稍后重试' }
  }
}

// Delete a game
export async function deleteGame(id: string) {
  try {
    await prisma.game.delete({
      where: { id },
    })

    revalidatePath('/admin/games')
    return { success: true }
  } catch (error) {
    console.error('删除游戏失败:', error)
    return { success: false, error: '删除游戏失败，请稍后重试' }
  }
}

/**
 * 获取所有子分类（用于 CategoryCascader）
 *
 * 只返回子分类（parentId !== null），并包含父分类信息
 * 🔥 优化：使用缓存层，避免重复查询数据库
 */
export async function getCategories() {
  try {
    const { getAllCategoriesForAdmin } = await import('@/lib/data/categories/cache')
    const allCategories = await getAllCategoriesForAdmin('zh')

    // 创建一个 Map 用于快速查找父分类
    const categoryMap = new Map(allCategories.map(cat => [cat.id, cat]))

    // 过滤出子分类（parentId !== null）
    const subCategories = allCategories
      .filter(cat => cat.parentId !== null)
      .map(cat => {
        const parent = cat.parentId ? categoryMap.get(cat.parentId) : null

        return {
          id: cat.id,
          name: cat.name,
          nameCn: cat.name, // 已经是中文翻译
          parentId: cat.parentId!,
          parent: parent ? {
            id: parent.id,
            name: parent.name,
            nameCn: parent.name, // 已经是中文翻译
          } : {
            id: cat.parentId!,
            name: '未知分类',
            nameCn: '未知分类',
          },
        }
      })

    return {
      success: true,
      data: subCategories,
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    return { success: false, error: '获取分类失败' }
  }
}

// Get all tags for multi-select
// 🔥 优化：使用缓存层，避免重复查询数据库
export async function getTags() {
  try {
    const { getAllTagsForAdmin } = await import('@/lib/data/tags/cache')
    const allTags = await getAllTagsForAdmin('zh')

    return {
      success: true,
      data: allTags.map((tag) => ({
        id: tag.id,
        name: tag.name, // 已经是中文翻译
      })),
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    return { success: false, error: '获取标签失败' }
  }
}

// Toggle game published status
export async function toggleGamePublishStatus(gameId: string, currentStatus: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return { success: false, error: '游戏不存在' }
    }

    // 切换状态: PUBLISHED <-> DRAFT
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: newStatus,
      },
    })

    revalidatePath('/admin/games')
    return {
      success: true,
      data: updatedGame,
      message: updatedGame.status === 'PUBLISHED' ? '已发布' : '已设为草稿',
    }
  } catch (error) {
    console.error('切换发布状态失败:', error)
    return { success: false, error: '操作失败，请稍后重试' }
  }
}

// Toggle game featured status
export async function toggleGameFeaturedStatus(gameId: string, currentStatus: boolean) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return { success: false, error: '游戏不存在' }
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: { isFeatured: !currentStatus },
    })

    revalidatePath('/admin/games')
    return {
      success: true,
      data: updatedGame,
      message: updatedGame.isFeatured ? '已设为精选' : '已取消精选',
    }
  } catch (error) {
    console.error('切换精选状态失败:', error)
    return { success: false, error: '操作失败，请稍后重试' }
  }
}
