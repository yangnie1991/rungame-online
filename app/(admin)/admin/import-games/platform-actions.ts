'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * GamePix 平台默认配置
 */
const GAMEPIX_DEFAULT_CONFIG = {
  orderBy: 'quality',
  perPage: '48',
  category: '',
  skipExisting: true,
  autoPublish: false,
  markAsFeatured: false,
}

/**
 * 获取或创建 GamePix 平台配置
 */
export async function getGamePixPlatform() {
  let platform = await prisma.importPlatform.findUnique({
    where: { slug: 'gamepix' },
  })

  // 如果不存在，创建默认配置
  if (!platform) {
    platform = await prisma.importPlatform.create({
      data: {
        name: 'GamePix',
        slug: 'gamepix',
        type: 'gamepix',
        icon: '🎮',
        apiConfig: {
          siteId: '', // 待配置
        },
        defaultConfig: GAMEPIX_DEFAULT_CONFIG,
        isEnabled: true,
        sortOrder: 1,
      },
    })
  }

  return platform
}

/**
 * 更新 GamePix Site ID
 */
export async function updateGamePixSiteId(siteId: string) {
  try {
    // 获取或创建平台配置
    let platform = await prisma.importPlatform.findUnique({
      where: { slug: 'gamepix' },
    })

    if (!platform) {
      // 创建新配置
      platform = await prisma.importPlatform.create({
        data: {
          name: 'GamePix',
          slug: 'gamepix',
          type: 'gamepix',
          icon: '🎮',
          apiConfig: {
            siteId,
          },
          defaultConfig: GAMEPIX_DEFAULT_CONFIG,
          isEnabled: true,
          sortOrder: 1,
        },
      })
    } else {
      // 更新现有配置
      platform = await prisma.importPlatform.update({
        where: { slug: 'gamepix' },
        data: {
          apiConfig: {
            siteId,
          },
        },
      })
    }

    revalidatePath('/admin/import-games/gamepix')

    return {
      success: true,
      platform,
    }
  } catch (error) {
    console.error('更新 GamePix Site ID 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }
  }
}

/**
 * 更新 GamePix 默认配置
 */
export async function updateGamePixDefaultConfig(config: {
  orderBy?: 'quality' | 'published'
  perPage?: '12' | '24' | '48' | '96'
  category?: string
}) {
  try {
    const platform = await prisma.importPlatform.findUnique({
      where: { slug: 'gamepix' },
    })

    if (!platform) {
      return {
        success: false,
        error: '平台配置不存在，请先配置 Site ID',
      }
    }

    const currentConfig = (platform.defaultConfig as any) || GAMEPIX_DEFAULT_CONFIG
    const updatedConfig = {
      ...currentConfig,
      ...config,
    }

    await prisma.importPlatform.update({
      where: { slug: 'gamepix' },
      data: {
        defaultConfig: updatedConfig,
      },
    })

    revalidatePath('/admin/import-games/gamepix')

    return {
      success: true,
      config: updatedConfig,
    }
  } catch (error) {
    console.error('更新默认配置失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }
  }
}

/**
 * 获取分类和标签数据（按需加载）
 * ✅ 优化：使用缓存层，仅在用户需要导入时才加载
 */
export async function getCategoriesAndTags() {
  try {
    // 使用缓存层获取分类和标签（并行请求中英文）
    const { getAllCategoriesForAdmin } = await import('@/lib/data/categories/cache')
    const { getAllTagsForAdmin } = await import('@/lib/data/tags/cache')

    const [categoriesZh, categoriesEn, tagsZh] = await Promise.all([
      getAllCategoriesForAdmin('zh'),
      getAllCategoriesForAdmin('en'),
      getAllTagsForAdmin('zh'),
    ])

    // 创建分类映射表（用于快速查找父分类）
    const categoryMapZh = new Map(categoriesZh.map(c => [c.id, c]))
    const categoryMapEn = new Map(categoriesEn.map(c => [c.id, c]))

    // 在内存中过滤出启用的子分类（parentId != null）
    const subCategories = categoriesZh.filter(cat => cat.isEnabled && cat.parentId !== null)

    // 转换为表单需要的格式（包含中英文名称和父分类）
    const categoryOptions = subCategories.map((catZh) => {
      const catEn = categoryMapEn.get(catZh.id)

      const zhName = catZh.name
      const enName = catEn?.name || catZh.slug

      // 获取父分类名称
      const parentZh = catZh.parentId ? categoryMapZh.get(catZh.parentId) : null
      const parentEn = catZh.parentId ? categoryMapEn.get(catZh.parentId) : null
      const parentZhName = parentZh?.name || ''
      const parentEnName = parentEn?.name || ''

      return {
        id: catZh.id,
        name: zhName,
        nameEn: enName,
        parentId: catZh.parentId,
        parentName: parentZhName,
        parentNameEn: parentEnName,
        // 显示格式：父分类 > 子分类
        displayName: `${parentZhName} > ${zhName}`,
        displayNameEn: `${parentEnName} > ${enName}`,
      }
    })

    // 过滤启用的标签并转换格式
    const tags = tagsZh.filter(tag => tag.isEnabled)
    const tagOptions = tags.map((tag) => ({
      id: tag.id,
      name: tag.name, // getAllTags 已经返回了翻译后的 name
    }))

    return {
      success: true,
      data: {
        categories: categoryOptions,
        tags: tagOptions,
      },
    }
  } catch (error) {
    console.error('获取分类和标签失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
    }
  }
}
