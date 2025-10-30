'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CACHE_TAGS } from '@/lib/cache-helpers'

// 导入平台配置 Schema
const platformConfigSchema = z.object({
  name: z.string().min(1, '平台名称不能为空'),
  slug: z.string().min(1, '平台标识不能为空'),
  type: z.string().min(1, '平台类型不能为空'),
  icon: z.string().optional(),
  apiConfig: z.record(z.any()),
  defaultConfig: z.record(z.any()).optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export type PlatformConfig = z.infer<typeof platformConfigSchema>

/**
 * 获取所有导入平台（使用缓存层）
 */
export async function getAllImportPlatforms() {
  try {
    // 使用缓存层而不是直接查询数据库
    const { getAllImportPlatforms: getCachedPlatforms } = await import('@/lib/data/import-platforms/cache')
    const platforms = await getCachedPlatforms()

    return {
      success: true,
      data: platforms,
    }
  } catch (error) {
    console.error('获取导入平台失败:', error)
    return {
      success: false,
      error: '获取导入平台失败',
    }
  }
}

/**
 * 获取单个导入平台
 */
export async function getImportPlatformById(id: string) {
  try {
    const platform = await prisma.importPlatform.findUnique({
      where: { id },
    })

    if (!platform) {
      return {
        success: false,
        error: '导入平台不存在',
      }
    }

    return {
      success: true,
      data: platform,
    }
  } catch (error) {
    console.error('获取导入平台失败:', error)
    return {
      success: false,
      error: '获取导入平台失败',
    }
  }
}

/**
 * 根据 slug 获取导入平台
 */
export async function getImportPlatformBySlug(slug: string) {
  try {
    const platform = await prisma.importPlatform.findUnique({
      where: { slug },
    })

    if (!platform) {
      return {
        success: false,
        error: '导入平台不存在',
      }
    }

    return {
      success: true,
      data: platform,
    }
  } catch (error) {
    console.error('获取导入平台失败:', error)
    return {
      success: false,
      error: '获取导入平台失败',
    }
  }
}

/**
 * 创建导入平台
 */
export async function createImportPlatform(config: PlatformConfig) {
  try {
    const validated = platformConfigSchema.parse(config)

    // 检查 slug 是否已存在
    const existing = await prisma.importPlatform.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return {
        success: false,
        error: '平台标识已存在',
      }
    }

    const platform = await prisma.importPlatform.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        type: validated.type,
        icon: validated.icon,
        apiConfig: validated.apiConfig,
        defaultConfig: validated.defaultConfig || {},
        isEnabled: validated.isEnabled,
        sortOrder: validated.sortOrder,
      },
    })

    // 失效导入平台缓存
    revalidateTag(CACHE_TAGS.IMPORT_PLATFORMS)
    revalidatePath('/admin/import-platforms')
    revalidatePath('/admin/import-games')

    return {
      success: true,
      data: platform,
    }
  } catch (error) {
    console.error('创建导入平台失败:', error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: '配置验证失败',
      }
    }
    return {
      success: false,
      error: '创建导入平台失败',
    }
  }
}

/**
 * 更新导入平台
 */
export async function updateImportPlatform(id: string, config: Partial<PlatformConfig>) {
  try {
    // 检查平台是否存在
    const existing = await prisma.importPlatform.findUnique({
      where: { id },
    })

    if (!existing) {
      return {
        success: false,
        error: '导入平台不存在',
      }
    }

    // 如果更新 slug，检查是否冲突
    if (config.slug && config.slug !== existing.slug) {
      const slugExists = await prisma.importPlatform.findUnique({
        where: { slug: config.slug },
      })
      if (slugExists) {
        return {
          success: false,
          error: '平台标识已存在',
        }
      }
    }

    const platform = await prisma.importPlatform.update({
      where: { id },
      data: config,
    })

    // 失效导入平台缓存
    revalidateTag(CACHE_TAGS.IMPORT_PLATFORMS)
    revalidatePath('/admin/import-platforms')
    revalidatePath('/admin/import-games')

    return {
      success: true,
      data: platform,
    }
  } catch (error) {
    console.error('更新导入平台失败:', error)
    return {
      success: false,
      error: '更新导入平台失败',
    }
  }
}

/**
 * 删除导入平台
 */
export async function deleteImportPlatform(id: string) {
  try {
    await prisma.importPlatform.delete({
      where: { id },
    })

    // 失效导入平台缓存
    revalidateTag(CACHE_TAGS.IMPORT_PLATFORMS)
    revalidatePath('/admin/import-platforms')
    revalidatePath('/admin/import-games')

    return {
      success: true,
    }
  } catch (error) {
    console.error('删除导入平台失败:', error)
    return {
      success: false,
      error: '删除导入平台失败',
    }
  }
}

/**
 * 切换平台启用状态
 */
export async function togglePlatformEnabled(id: string) {
  try {
    const platform = await prisma.importPlatform.findUnique({
      where: { id },
    })

    if (!platform) {
      return {
        success: false,
        error: '导入平台不存在',
      }
    }

    await prisma.importPlatform.update({
      where: { id },
      data: { isEnabled: !platform.isEnabled },
    })

    // 失效导入平台缓存
    revalidateTag(CACHE_TAGS.IMPORT_PLATFORMS)
    revalidatePath('/admin/import-platforms')
    revalidatePath('/admin/import-games')

    return {
      success: true,
    }
  } catch (error) {
    console.error('切换平台状态失败:', error)
    return {
      success: false,
      error: '切换平台状态失败',
    }
  }
}

/**
 * 更新平台统计信息
 */
export async function updatePlatformStats(id: string, importedCount: number) {
  try {
    await prisma.importPlatform.update({
      where: { id },
      data: {
        totalImported: {
          increment: importedCount,
        },
        lastImportAt: new Date(),
      },
    })

    // 失效导入平台缓存
    revalidateTag(CACHE_TAGS.IMPORT_PLATFORMS)
    revalidatePath('/admin/import-platforms')

    return {
      success: true,
    }
  } catch (error) {
    console.error('更新平台统计失败:', error)
    return {
      success: false,
      error: '更新平台统计失败',
    }
  }
}
