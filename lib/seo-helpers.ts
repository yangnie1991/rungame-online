import type { Metadata } from "next"

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
export function generateSEOMetadata(options: GenerateSEOMetadataOptions): Metadata {
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

  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}${path}`

  // 默认 OG 图片
  const defaultOgImage = `${siteUrl}/og-image.png`
  const imageUrl = ogImage || defaultOgImage

  // 标准关键词
  const standardKeywords = [
    'free online games',
    'browser games',
    'no download games',
    'RunGame',
  ]

  // 根据语言添加本地化关键词
  const localizedKeywords = locale === 'zh'
    ? ['免费在线游戏', '网页游戏', '无需下载游戏']
    : locale === 'es'
    ? ['juegos gratis', 'juegos en línea', 'juegos de navegador']
    : locale === 'fr'
    ? ['jeux gratuits', 'jeux en ligne', 'jeux de navigateur']
    : []

  const allKeywords = [...keywords, ...standardKeywords, ...localizedKeywords].join(', ')

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'es': 'es_ES',
    'fr': 'fr_FR',
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
      siteName: 'RunGame',
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
      creator: '@rungame',
      site: '@rungame',
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
    other: {
      'theme-color': '#2563eb',
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
  const supportedLocales = ['en', 'zh', 'es', 'fr']

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

  for (const locale of supportedLocales) {
    languages[locale] = `${siteUrl}/${locale}${cleanPath}`
  }

  // x-default 指向默认语言（英文）
  languages['x-default'] = `${siteUrl}${cleanPath}`

  return languages
}

/**
 * 生成游戏页面的 SEO 元数据
 */
export function generateGameSEOMetadata(options: {
  title: string
  description: string
  locale: string
  slug: string
  categoryName?: string
  tags?: string[]
  thumbnail?: string
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  const { title, description, locale, slug, categoryName, tags, thumbnail, publishedTime, modifiedTime } = options

  const seoTitle = `${title} - Play Free Online | RunGame`
  const seoDescription = description || `Play ${title} for free on RunGame. ${categoryName ? `${categoryName} game.` : ''} No downloads, instant fun!`

  const keywords = [
    title,
    ...(categoryName ? [categoryName] : []),
    ...(tags || []),
  ]

  return generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `/${locale}/games/${slug}`,
    keywords,
    ogImage: thumbnail,
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

  const seoTitle = `${categoryName} Games - Free Online ${categoryName} Games | RunGame`
  const seoDescription = description || `Play ${gameCount}+ free ${categoryName.toLowerCase()} games on RunGame. Browser games, no downloads required!`

  const keywords = [
    categoryName,
    `${categoryName} games`,
    `free ${categoryName} games`,
    `online ${categoryName} games`,
  ]

  return generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `/${locale}/games/category/${slug}`,
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

  const seoTitle = `${tagName} Games - Play Free Online | RunGame`
  const seoDescription = `Discover ${gameCount}+ free ${tagName.toLowerCase()} games on RunGame. Instant play, no downloads!`

  const keywords = [
    tagName,
    `${tagName} games`,
    `free ${tagName} games`,
  ]

  return generateSEOMetadata({
    title: seoTitle,
    description: seoDescription,
    locale,
    path: `/${locale}/games/tags/${slug}`,
    keywords,
  })
}

/**
 * 生成首页的 SEO 元数据
 */
export function generateHomeSEOMetadata(locale: string, totalGames: number = 0): Metadata {
  const titles: Record<string, string> = {
    en: 'RunGame - Free Online Games | Play Browser Games No Download',
    zh: 'RunGame - 免费在线游戏 | 无需下载的网页游戏',
    es: 'RunGame - Juegos Gratis en Línea | Juegos de Navegador Sin Descarga',
    fr: 'RunGame - Jeux Gratuits en Ligne | Jeux de Navigateur Sans Téléchargement',
  }

  const descriptions: Record<string, string> = {
    en: `Play ${totalGames || '1000+'}  free online games on RunGame! Action, puzzle, racing, sports and more. Browser games, no downloads, instant fun!`,
    zh: `在 RunGame 上玩 ${totalGames || '1000+'} 款免费在线游戏！动作、益智、赛车、体育等更多游戏。网页游戏，无需下载，即刻畅玩！`,
    es: `¡Juega ${totalGames || '1000+'} juegos gratis en línea en RunGame! Acción, puzzles, carreras, deportes y más. Juegos de navegador, sin descargas, diversión instantánea!`,
    fr: `Jouez à ${totalGames || '1000+'} jeux gratuits en ligne sur RunGame! Action, puzzle, course, sport et plus. Jeux de navigateur, pas de téléchargements, plaisir instantané!`,
  }

  return generateSEOMetadata({
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    locale,
    path: `/${locale}`,
  })
}
