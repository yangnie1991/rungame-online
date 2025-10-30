import type { Metadata } from "next"
import { getLocalizedSiteConfig } from '@/lib/site-config'
import { generateGameOGImageUrl } from './og-image-helpers'

/**
 * SEO 元数据生成工具
 * 提供统一的 SEO 优化结构
 */

interface GenerateSEOMetadataOptions {
  title: string
  description: string
  locale: string
  path: string
  keywords?: string[]
  ogImage?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

/**
 * 获取网站基础 URL
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
}

/**
 * 生成标准化的 SEO 元数据
 */
export async function generateSEOMetadata(options: GenerateSEOMetadataOptions): Promise<Metadata> {
  const {
    title,
    description,
    locale,
    path,
    keywords = [],
    ogImage,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = options

  // 获取网站配置
  const siteConfig = await getLocalizedSiteConfig(locale)

  const siteUrl = siteConfig.siteUrl
  const fullUrl = `${siteUrl}${path}`

  // 使用配置中的 OG 图片或默认值
  const imageUrl = ogImage || siteConfig.ogImageUrl || `${siteUrl}/assets/images/og-image.png`

  // 合并关键词：页面关键词 + 配置的默认关键词
  const allKeywords = [...keywords, ...siteConfig.defaultKeywords].join(', ')

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  const metadata: Metadata = {
    title,
    description,
    keywords: allKeywords,

    // Open Graph
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: siteConfig.siteName,
      locale: ogLocaleMap[locale] || 'en_US',
      type: type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      ...(publishedTime && type === 'article' && { publishedTime }),
      ...(modifiedTime && type === 'article' && { modifiedTime }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: siteConfig.twitterHandle || '@rungame',
      site: siteConfig.twitterHandle || '@rungame',
    },

    // Canonical 和多语言链接
    alternates: {
      canonical: fullUrl,
      languages: generateAlternateLanguages(path),
    },

    // 搜索引擎爬虫指令
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // 其他元标签
    // 注意：theme-color 已在根 layout 的 viewport 中定义，此处不重复
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
    },
  }

  return metadata
}

/**
 * 生成多语言 alternate 链接
 */
function generateAlternateLanguages(path: string): Record<string, string> {
  const siteUrl = getSiteUrl()
  const supportedLocales = ['en', 'zh']

  // 移除路径中的语言前缀
  let cleanPath = path
  for (const locale of supportedLocales) {
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      cleanPath = path.replace(`/${locale}`, '')
      break
    }
  }

  // 确保路径以 / 开头
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath
  }

  const languages: Record<string, string> = {}

  // 英文（默认语言）不带前缀
  languages['en'] = `${siteUrl}${cleanPath}`

  // 其他语言带前缀
  for (const locale of supportedLocales) {
    if (locale !== 'en') {
      languages[locale] = `${siteUrl}/${locale}${cleanPath}`
    }
  }

  // x-default 指向默认语言（英文）
  languages['x-default'] = `${siteUrl}${cleanPath}`

  return languages
}

/**
 * 生成游戏页面的 SEO 元数据
 * 注意：此函数是异步的，因为它需要从数据库获取配置
 */
export async function generateGameSEOMetadata(options: {
  title: string
  description: string
  locale: string
  slug: string
  categoryName?: string
  categoryIcon?: string
  tags?: string[]
  thumbnail?: string
  publishedTime?: string
  modifiedTime?: string
}): Promise<Metadata> {
  const { title, description, locale, slug, categoryName, categoryIcon, tags, thumbnail, publishedTime, modifiedTime } = options

  // 国际化的标题和描述模板
  const titleTemplates: Record<string, string> = {
    en: `${title} - Play Free Online`,
    zh: `${title} - 免费在线玩`,
  }

  const descriptionTemplates: Record<string, string> = {
    en: description || `Play ${title} for free on RunGame. ${categoryName ? `${categoryName} game.` : ''} No downloads, instant fun!`,
    zh: description || `在 RunGame 上免费玩 ${title}。${categoryName ? `${categoryName}游戏。` : ''}无需下载，即刻畅玩！`,
  }

  const seoTitle = titleTemplates[locale] || titleTemplates.en
  const seoDescription = descriptionTemplates[locale] || descriptionTemplates.en

  const keywords = [
    title,
    ...(categoryName ? [categoryName] : []),
    ...(tags || []),
  ]

  // 英文（默认语言）不带前缀
  const pathPrefix = locale === 'en' ? '' : `/${locale}`

  // 🎨 使用动态生成的 OG 图片（包含游戏信息）
  const ogImage = generateGameOGImageUrl({
    title,
    category: categoryName,
    categoryIcon, // 分类图标
    thumbnail, // 游戏缩略图会显示在 OG 图片中
    tags: tags?.join(','), // 标签（逗号分隔）
  })

  return await generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `${pathPrefix}/${slug}`, // slug 已经包含 "play/" 前缀
    keywords,
    ogImage, // ✅ 使用动态生成的 OG 图片
    type: 'article',
    publishedTime,
    modifiedTime,
  })
}

/**
 * 生成分类页面的 SEO 元数据
 */
export function generateCategorySEOMetadata(options: {
  categoryName: string
  description: string
  locale: string
  slug: string
  gameCount: number
}): Metadata {
  const { categoryName, description, locale, slug, gameCount } = options

  // 国际化的标题和描述模板（修复 RunGame 重复问题）
  const titleTemplates: Record<string, string> = {
    en: `${categoryName} Games - Free Online ${categoryName} Games`,
    zh: `${categoryName}游戏 - 免费在线${categoryName}游戏`,
  }

  const descriptionTemplates: Record<string, string> = {
    en: description.length > 50
      ? description
      : `Play ${gameCount}+ free ${categoryName.toLowerCase()} games on RunGame. Enjoy browser-based gaming with no downloads required. Instant fun with action-packed ${categoryName.toLowerCase()} games!`,
    zh: description.length > 50
      ? description
      : `在 RunGame 上玩 ${gameCount}+ 款免费${categoryName}游戏。享受无需下载的网页游戏。即刻体验充满乐趣的${categoryName}游戏！`,
  }

  const keywordsTemplates: Record<string, string[]> = {
    en: [
      categoryName,
      `${categoryName} games`,
      `free ${categoryName} games`,
      `online ${categoryName} games`,
    ],
    zh: [
      categoryName,
      `${categoryName}游戏`,
      `免费${categoryName}游戏`,
      `在线${categoryName}游戏`,
    ],
  }

  const seoTitle = titleTemplates[locale] || titleTemplates.en
  const seoDescription = descriptionTemplates[locale] || descriptionTemplates.en
  const keywords = keywordsTemplates[locale] || keywordsTemplates.en

  // 英文（默认语言）不带前缀
  const pathPrefix = locale === 'en' ? '' : `/${locale}`

  return generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `${pathPrefix}/category/${slug}`,
    keywords,
  })
}

/**
 * 生成标签页面的 SEO 元数据
 */
export function generateTagSEOMetadata(options: {
  tagName: string
  locale: string
  slug: string
  gameCount: number
}): Metadata {
  const { tagName, locale, slug, gameCount } = options

  // 国际化的标题和描述模板
  const titleTemplates: Record<string, string> = {
    en: `${tagName} Games - Play Free Online`,
    zh: `${tagName}游戏 - 免费在线玩`,
  }

  const descriptionTemplates: Record<string, string> = {
    en: `Discover ${gameCount}+ free ${tagName.toLowerCase()} games on RunGame. Enjoy instant play with no downloads required. Browse our collection of ${tagName.toLowerCase()} games and start playing now!`,
    zh: `在 RunGame 上发现 ${gameCount}+ 款免费${tagName}游戏。无需下载即可畅玩。浏览我们的${tagName}游戏合集，立即开始游戏！`,
  }

  const keywordsTemplates: Record<string, string[]> = {
    en: [
      tagName,
      `${tagName} games`,
      `free ${tagName} games`,
    ],
    zh: [
      tagName,
      `${tagName}游戏`,
      `免费${tagName}游戏`,
    ],
  }

  const seoTitle = titleTemplates[locale] || titleTemplates.en
  const seoDescription = descriptionTemplates[locale] || descriptionTemplates.en
  const keywords = keywordsTemplates[locale] || keywordsTemplates.en

  // 英文（默认语言）不带前缀
  const pathPrefix = locale === 'en' ? '' : `/${locale}`

  return generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `${pathPrefix}/tag/${slug}`,
    keywords,
  })
}

/**
 * 将游戏数量转换为稳定的范围表示
 * 这样可以避免元数据频繁变化，对 SEO 更友好
 */
function getStableGameCountRange(count: number): string {
  if (count === 0) return '1000+'
  if (count < 50) return '50+'
  if (count < 100) return '100+'
  if (count < 500) return '500+'
  if (count < 1000) return '1000+'
  if (count < 5000) return '5000+'
  return '10000+'
}

/**
 * 生成首页的 SEO 元数据
 *
 * @param locale - 语言代码
 * @param totalGames - 游戏总数（可选，用于生成稳定的数量范围）
 *
 * SEO 最佳实践：
 * - 使用数量范围而非精确数字，避免元数据频繁变化
 * - 保持描述稳定，有利于搜索引擎理解和索引
 */
export function generateHomeSEOMetadata(locale: string, totalGames: number = 0): Metadata {
  // 转换为稳定的范围表示
  const gameRange = getStableGameCountRange(totalGames)

  const titles: Record<string, string> = {
    en: 'RunGame - Free Online Games | Play Browser Games No Download',
    zh: 'RunGame - 免费在线游戏 | 无需下载的网页游戏',
  }

  const descriptions: Record<string, string> = {
    en: `Play ${gameRange} free online games on RunGame! Action, puzzle, racing, sports and more. Browser games, no downloads, instant fun!`,
    zh: `在 RunGame 上玩 ${gameRange} 款免费在线游戏！动作、益智、赛车、体育等更多游戏。网页游戏，无需下载，即刻畅玩！`,
  }

  // 英文（默认语言）不带前缀
  const pathPrefix = locale === 'en' ? '' : `/${locale}`

  return generateSEOMetadata({
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    locale,
    path: pathPrefix,
  })
}
