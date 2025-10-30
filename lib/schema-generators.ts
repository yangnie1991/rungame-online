/**
 * Schema.org 结构化数据生成器
 * 基于 Next.js 官方文档最佳实践
 */

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * 1. Organization Schema - 网站组织信息
 * 用于所有页面的页脚或 Layout
 */
export function generateOrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RunGame',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Free online games platform. Play thousands of browser games instantly, no downloads required.',
    sameAs: [
      'https://twitter.com/rungame',
      'https://github.com/rungame',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@rungame.online',
    },
  }
}

/**
 * 2. WebSite Schema - 网站搜索功能
 * 用于首页或主 Layout
 */
export function generateWebSiteSchema(locale: string = 'en') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RunGame',
    url: `${siteUrl}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * 3. BreadcrumbList Schema - 面包屑导航
 * 用于所有带面包屑的页面
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: `${siteUrl}${item.url}` }),
    })),
  }
}

/**
 * 4. VideoGame Schema - 游戏详情页
 */
export interface GameSchemaData {
  name: string
  description: string
  image: string
  genre: string
  playCount: number
  rating?: number
  ratingCount?: number
  url: string
}

export function generateVideoGameSchema(game: GameSchemaData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: game.description,
    image: game.image,
    genre: game.genre,
    gamePlatform: 'Web browser',
    playMode: 'SinglePlayer',
    url: game.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(game.rating && game.ratingCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating.toFixed(1),
        ratingCount: game.ratingCount,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/PlayAction',
      userInteractionCount: game.playCount,
    },
  }
}

/**
 * 5. ItemList Schema - 游戏列表
 */
export interface GameListItem {
  name: string
  url: string
  image: string
}

export function generateGameListSchema(games: GameListItem[], listName: string, listUrl: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${siteUrl}${listUrl}`,
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoGame',
        name: game.name,
        url: `${siteUrl}${game.url}`,
        image: game.image,
      },
    })),
  }
}

/**
 * 6. CollectionPage Schema - 分类/标签页
 */
export interface CollectionSchemaData {
  name: string
  description: string
  url: string
  numberOfItems: number
}

export function generateCollectionPageSchema(data: CollectionSchemaData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.name,
    description: data.description,
    url: `${siteUrl}${data.url}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.numberOfItems,
    },
  }
}

/**
 * 工具函数：安全渲染 JSON-LD
 * 按照 Next.js 官方文档，需要转义 < 为 \u003c
 */
export function renderJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
