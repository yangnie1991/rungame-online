import { prisma } from '@/lib/prisma'
import { unstable_cache, revalidateTag } from 'next/cache'
import type { SiteConfig, SiteConfigTranslation } from '@prisma/client'
import { REVALIDATE_TIME } from '@/lib/cache-helpers'

/**
 * 网站配置工具
 * 提供统一的网站配置获取接口，支持多语言
 */

export interface SiteConfigWithTranslations extends SiteConfig {
  translations: SiteConfigTranslation[]
}

/**
 * 内部数据库查询函数
 */
async function fetchSiteConfigFromDB(locale?: string): Promise<SiteConfigWithTranslations | null> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchSiteConfigFromDB - 执行数据库查询 locale: ${locale || 'all'}`)
  }

  try {
    const config = await prisma.siteConfig.findFirst({
      include: {
        translations: locale
          ? {
              where: { locale },
            }
          : true,
      },
    })

    return config
  } catch (error) {
    console.error('[getSiteConfig] 获取网站配置失败:', error)
    return null
  }
}

/**
 * 获取网站配置（持久化缓存）
 * 🔥 优化：使用 unstable_cache 替代 React cache，实现跨请求的持久化缓存
 */
export const getSiteConfig = unstable_cache(
  async (locale?: string) => fetchSiteConfigFromDB(locale),
  ['site-config'],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
    tags: ['site-config'],
  }
)

/**
 * 获取本地化的网站配置
 * 优先返回指定语言的翻译，如果没有则回退到英文
 */
export async function getLocalizedSiteConfig(locale: string = 'en') {
  const config = await getSiteConfig(locale)

  if (!config) {
    // 返回默认值
    return {
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'RunGame',
      siteDescription: 'Play free online games',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
      logoUrl: null,
      faviconUrl: null,
      ogImageUrl: null,
      contactEmail: null,
      supportEmail: null,
      socialLinks: {},
      defaultKeywords: [],
      twitterHandle: null,
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || null,
      googleAdsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || null,
      customScripts: {},
      maintenanceMode: false,
      enableComments: false,
      enableRatings: true,
      extraConfig: {},
    }
  }

  // 获取翻译（如果有）
  const translation = config.translations[0]

  return {
    siteName: translation?.siteName || config.siteName,
    siteDescription: translation?.siteDescription || config.siteDescription || '',
    siteUrl: config.siteUrl,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    ogImageUrl: config.ogImageUrl,
    contactEmail: config.contactEmail,
    supportEmail: config.supportEmail,
    socialLinks: config.socialLinks as Record<string, string>,
    defaultKeywords: translation?.keywords || config.defaultKeywords,
    twitterHandle: config.twitterHandle,
    googleAnalyticsId: config.googleAnalyticsId,
    googleAdsenseId: config.googleAdsenseId,
    customScripts: config.customScripts as { headScripts?: string[]; bodyScripts?: string[] },
    maintenanceMode: config.maintenanceMode,
    enableComments: config.enableComments,
    enableRatings: config.enableRatings,
    extraConfig: config.extraConfig as Record<string, unknown>,
  }
}

/**
 * 初始化网站配置
 * 如果数据库中没有配置，则创建默认配置
 */
export async function initializeSiteConfig() {
  const existing = await prisma.siteConfig.findFirst()

  if (existing) {
    console.log('[initializeSiteConfig] 网站配置已存在')
    return existing
  }

  console.log('[initializeSiteConfig] 创建默认网站配置...')

  const config = await prisma.siteConfig.create({
    data: {
      siteName: 'RunGame',
      siteDescription: 'Play thousands of free online games - action, puzzle, sports and more! No downloads required.',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online',
      logoUrl: '/assets/images/logo.png',
      faviconUrl: '/favicon.ico',
      ogImageUrl: '/assets/images/og-image.png',
      contactEmail: 'contact@rungame.online',
      supportEmail: 'support@rungame.online',
      socialLinks: {
        twitter: 'https://twitter.com/rungame',
        facebook: 'https://facebook.com/rungame',
      },
      defaultKeywords: [
        'free online games',
        'browser games',
        'no download games',
        'play games online',
        'RunGame',
      ],
      twitterHandle: '@rungame',
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || null,
      googleAdsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || null,
      customScripts: {},
      maintenanceMode: false,
      enableComments: false,
      enableRatings: true,
      extraConfig: {},
      translations: {
        create: [
          {
            locale: 'zh',
            siteName: 'RunGame - 免费在线游戏',
            siteDescription: '畅玩数千款免费在线游戏 - 动作、益智、体育等！无需下载。',
            keywords: [
              '免费在线游戏',
              '网页游戏',
              '无需下载游戏',
              '在线玩游戏',
              'RunGame',
            ],
          },
        ],
      },
    },
    include: {
      translations: true,
    },
  })

  console.log('[initializeSiteConfig] 默认配置创建成功')
  return config
}

/**
 * 更新网站配置
 */
export async function updateSiteConfig(data: Partial<SiteConfig>) {
  const existing = await prisma.siteConfig.findFirst()

  if (!existing) {
    throw new Error('网站配置不存在，请先初始化')
  }

  const result = await prisma.siteConfig.update({
    where: { id: existing.id },
    data,
    include: {
      translations: true,
    },
  })

  // 失效网站配置缓存
  revalidateTag('site-config')

  return result
}

/**
 * 更新网站配置翻译
 */
export async function updateSiteConfigTranslation(
  locale: string,
  data: Partial<Omit<SiteConfigTranslation, 'id' | 'siteConfigId' | 'locale' | 'createdAt' | 'updatedAt'>>
) {
  const config = await prisma.siteConfig.findFirst()

  if (!config) {
    throw new Error('网站配置不存在，请先初始化')
  }

  // 尝试查找现有翻译
  const existing = await prisma.siteConfigTranslation.findUnique({
    where: {
      siteConfigId_locale: {
        siteConfigId: config.id,
        locale,
      },
    },
  })

  let result

  if (existing) {
    // 更新现有翻译
    result = await prisma.siteConfigTranslation.update({
      where: { id: existing.id },
      data,
    })
  } else {
    // 创建新翻译
    result = await prisma.siteConfigTranslation.create({
      data: {
        siteConfigId: config.id,
        locale,
        siteName: data.siteName || config.siteName,
        siteDescription: data.siteDescription,
        keywords: data.keywords || [],
      },
    })
  }

  // 失效网站配置缓存
  revalidateTag('site-config')

  return result
}
