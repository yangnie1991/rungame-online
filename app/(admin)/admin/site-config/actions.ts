'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { SiteConfig } from '@prisma/client'

/**
 * 获取网站配置
 */
export async function getSiteConfigAction() {
  const config = await prisma.siteConfig.findFirst({
    include: {
      translations: {
        orderBy: { locale: 'asc' },
      },
    },
  })

  return config
}

/**
 * 更新网站基础配置
 */
export async function updateSiteConfigAction(data: Partial<Omit<SiteConfig, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const existing = await prisma.siteConfig.findFirst()

    if (!existing) {
      throw new Error('网站配置不存在')
    }

    const updated = await prisma.siteConfig.update({
      where: { id: existing.id },
      data,
    })

    revalidatePath('/admin/site-config')
    revalidatePath('/', 'layout') // 重新验证所有页面

    return { success: true, data: updated }
  } catch (error) {
    console.error('[updateSiteConfigAction]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }
  }
}

/**
 * 更新网站配置翻译
 */
export async function updateSiteConfigTranslationAction(
  locale: string,
  data: {
    siteName: string
    siteDescription?: string
    keywords?: string[]
  }
) {
  try {
    const config = await prisma.siteConfig.findFirst()

    if (!config) {
      throw new Error('网站配置不存在')
    }

    // 查找现有翻译
    const existing = await prisma.siteConfigTranslation.findUnique({
      where: {
        siteConfigId_locale: {
          siteConfigId: config.id,
          locale,
        },
      },
    })

    let translation
    if (existing) {
      // 更新
      translation = await prisma.siteConfigTranslation.update({
        where: { id: existing.id },
        data,
      })
    } else {
      // 创建
      translation = await prisma.siteConfigTranslation.create({
        data: {
          siteConfigId: config.id,
          locale,
          ...data,
        },
      })
    }

    revalidatePath('/admin/site-config')
    revalidatePath(`/${locale}`, 'layout')

    return { success: true, data: translation }
  } catch (error) {
    console.error('[updateSiteConfigTranslationAction]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新翻译失败',
    }
  }
}

/**
 * 初始化网站配置（如果不存在）
 */
export async function initializeSiteConfigAction() {
  try {
    const existing = await prisma.siteConfig.findFirst()

    if (existing) {
      return { success: true, data: existing, message: '配置已存在' }
    }

    const config = await prisma.siteConfig.create({
      data: {
        siteName: 'RunGame',
        siteDescription: 'Play thousands of free online games',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
        defaultKeywords: ['free online games', 'browser games', 'RunGame'],
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || null,
        googleAdsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || null,
        translations: {
          create: [
            {
              locale: 'zh',
              siteName: 'RunGame - 免费在线游戏',
              siteDescription: '畅玩数千款免费在线游戏',
              keywords: ['免费在线游戏', '网页游戏', 'RunGame'],
            },
          ],
        },
      },
      include: {
        translations: true,
      },
    })

    revalidatePath('/admin/site-config')

    return { success: true, data: config, message: '配置初始化成功' }
  } catch (error) {
    console.error('[initializeSiteConfigAction]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '初始化失败',
    }
  }
}
