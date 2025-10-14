'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Zod Schema for Game form validation
const gameSchema = z.object({
  slug: z.string().min(1, '游戏slug不能为空').regex(/^[a-z0-9-]+$/, 'slug只能包含小写字母、数字和连字符'),
  thumbnail: z.string().min(1, '缩略图不能为空').url('缩略图必须是有效的URL'),
  banner: z.string().url('横幅图必须是有效的URL').optional(),
  embedUrl: z.string().min(1, '嵌入URL不能为空').url('嵌入URL必须是有效的URL'),
  gameUrl: z.string().min(1, '游戏URL不能为空').url('游戏URL必须是有效的URL'),
  width: z.coerce.number().int().min(100, '宽度至少100px').default(800),
  height: z.coerce.number().int().min(100, '高度至少100px').default(600),
  categoryId: z.string().min(1, '必须选择分类'),
  tagIds: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
  translations: z.array(
    z.object({
      locale: z.enum(['en', 'zh', 'es', 'fr']),
      title: z.string().min(1, '标题不能为空'),
      description: z.string().optional(),
      longDescription: z.string().optional(),
      instructions: z.string().optional(),
      keywords: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
  ).min(1, '至少需要一个语言的翻译'),
})

export type GameFormData = z.infer<typeof gameSchema>

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

    // Create game with translations and tags
    const game = await prisma.game.create({
      data: {
        slug: validated.slug,
        thumbnail: validated.thumbnail,
        banner: validated.banner || null,
        embedUrl: validated.embedUrl,
        gameUrl: validated.gameUrl,
        width: validated.width,
        height: validated.height,
        categoryId: validated.categoryId,
        isFeatured: validated.isFeatured,
        isPublished: validated.isPublished,
        ...(validated.metadata && { metadata: validated.metadata as Prisma.InputJsonValue }),
        translations: {
          create: validated.translations,
        },
        tags: {
          create: validated.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
      include: {
        translations: true,
        tags: true,
      },
    })

    revalidatePath('/admin/games')
    return { success: true, data: game }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('创建游戏失败:', error)
    return { success: false, error: '创建游戏失败，请稍后重试' }
  }
}

// Get a single game by ID for editing
export async function getGame(id: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        translations: {
          orderBy: { locale: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        category: true,
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

      // Update game with new data
      return await tx.game.update({
        where: { id },
        data: {
          slug: validated.slug,
          thumbnail: validated.thumbnail,
          banner: validated.banner || null,
          embedUrl: validated.embedUrl,
          gameUrl: validated.gameUrl,
          width: validated.width,
          height: validated.height,
          categoryId: validated.categoryId,
          isFeatured: validated.isFeatured,
          isPublished: validated.isPublished,
          ...(validated.metadata && { metadata: validated.metadata as Prisma.InputJsonValue }),
          translations: {
            create: validated.translations,
          },
          tags: {
            create: validated.tagIds.map((tagId) => ({
              tagId,
            })),
          },
        },
        include: {
          translations: true,
          tags: true,
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
    return { success: false, error: '更新游戏失败，请稍后重试' }
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

// Get all categories for select dropdown
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        translations: {
          where: { locale: 'zh' },
          select: { name: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return {
      success: true,
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.translations[0]?.name || cat.slug,
      })),
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    return { success: false, error: '获取分类失败' }
  }
}

// Get all tags for multi-select
export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        translations: {
          where: { locale: 'zh' },
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: tags.map((tag) => ({
        id: tag.id,
        name: tag.translations[0]?.name || tag.slug,
      })),
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    return { success: false, error: '获取标签失败' }
  }
}

// Toggle game published status
export async function toggleGamePublishStatus(gameId: string, currentStatus: boolean) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return { success: false, error: '游戏不存在' }
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        isPublished: !currentStatus,
        publishedAt: !currentStatus ? new Date() : null,
      },
    })

    revalidatePath('/admin/games')
    return {
      success: true,
      data: updatedGame,
      message: updatedGame.isPublished ? '已发布' : '已设为草稿',
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
