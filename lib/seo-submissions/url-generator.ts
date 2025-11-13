/**
 * URL 生成工具
 *
 * 用于生成各种类型的 URL（游戏、分类、标签、PageType等）
 * 支持多语言 URL 生成
 */

import { routing } from '@/i18n/routing'

// SEO 提交专用 URL
// 优先使用 SEO_SITE_URL，如果不存在则回退到 NEXT_PUBLIC_SITE_URL
const SITE_URL = process.env.SEO_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

export interface UrlInfo {
  url: string
  type: 'game' | 'category' | 'tag' | 'pagetype' | 'sitemap' | 'other'
  entityId?: string
  locale?: string
}

/**
 * 生成游戏 URL（所有语言）
 */
export function generateGameUrls(gameSlug: string, gameId: string): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale
    const url = isDefault
      ? `${SITE_URL}/play/${gameSlug}`
      : `${SITE_URL}/${locale}/play/${gameSlug}`

    urls.push({
      url,
      type: 'game',
      entityId: gameId,
      locale,
    })
  }

  return urls
}

/**
 * 生成分类 URL（所有语言）
 *
 * 主分类: /category/{slug}
 * 子分类: /category/{parentSlug}/{slug}
 */
export function generateCategoryUrls(
  categorySlug: string,
  categoryId: string,
  parentSlug?: string
): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale

    const categoryPath = parentSlug
      ? `/category/${parentSlug}/${categorySlug}`
      : `/category/${categorySlug}`

    const url = isDefault
      ? `${SITE_URL}${categoryPath}`
      : `${SITE_URL}/${locale}${categoryPath}`

    urls.push({
      url,
      type: 'category',
      entityId: categoryId,
      locale,
    })
  }

  return urls
}

/**
 * 生成标签 URL（所有语言）
 */
export function generateTagUrls(tagSlug: string, tagId: string): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale
    const url = isDefault
      ? `${SITE_URL}/tag/${tagSlug}`
      : `${SITE_URL}/${locale}/tag/${tagSlug}`

    urls.push({
      url,
      type: 'tag',
      entityId: tagId,
      locale,
    })
  }

  return urls
}

/**
 * 生成 PageType URL（所有语言）
 */
export function generatePageTypeUrls(
  pageTypeSlug: string,
  pageTypeId: string
): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale
    const url = isDefault
      ? `${SITE_URL}/collection/${pageTypeSlug}`
      : `${SITE_URL}/${locale}/collection/${pageTypeSlug}`

    urls.push({
      url,
      type: 'pagetype',
      entityId: pageTypeId,
      locale,
    })
  }

  return urls
}

/**
 * 生成静态页面 URL（所有语言）
 * 注意：Next.js 默认不使用 trailingSlash，所以静态页面URL不带斜杠
 */
export function generateStaticPageUrls(pagePath: string): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale
    const url = isDefault
      ? `${SITE_URL}${pagePath}`
      : `${SITE_URL}/${locale}${pagePath}`

    urls.push({
      url,
      type: 'other',
      locale,
    })
  }

  return urls
}

/**
 * 生成 Sitemap URL
 */
export function generateSitemapUrl(): UrlInfo {
  return {
    url: `${SITE_URL}/sitemap.xml`,
    type: 'sitemap',
  }
}

/**
 * 生成首页 URL（所有语言）
 * 注意：所有 URL 统一不带斜杠
 */
export function generateHomepageUrls(): UrlInfo[] {
  const urls: UrlInfo[] = []

  for (const locale of routing.locales) {
    const isDefault = locale === routing.defaultLocale
    // 所有首页 URL 都不带斜杠
    const url = isDefault ? SITE_URL : `${SITE_URL}/${locale}`

    urls.push({
      url,
      type: 'other',
      locale,
    })
  }

  return urls
}

/**
 * 生成游戏列表页 URL
 */
export function generateGamesListUrl(): UrlInfo[] {
  return generateStaticPageUrls('/games')
}

/**
 * 生成分类列表页 URL
 */
export function generateCategoryListUrl(): UrlInfo[] {
  return generateStaticPageUrls('/category')
}

/**
 * 生成标签列表页 URL
 */
export function generateTagListUrl(): UrlInfo[] {
  return generateStaticPageUrls('/tag')
}

/**
 * 批量生成所有游戏 URL
 */
export async function generateAllGameUrls(): Promise<UrlInfo[]> {
  const { prisma } = await import('@/lib/prisma')

  const games = await prisma.game.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true },
  })

  const urls: UrlInfo[] = []

  for (const game of games) {
    urls.push(...generateGameUrls(game.slug, game.id))
  }

  return urls
}

/**
 * 批量生成所有分类 URL
 */
export async function generateAllCategoryUrls(): Promise<UrlInfo[]> {
  const { prisma } = await import('@/lib/prisma')

  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: {
      id: true,
      slug: true,
      parentId: true,
      parent: {
        select: { slug: true },
      },
    },
  })

  const urls: UrlInfo[] = []

  for (const category of categories) {
    urls.push(
      ...generateCategoryUrls(
        category.slug,
        category.id,
        category.parent?.slug
      )
    )
  }

  return urls
}

/**
 * 批量生成所有标签 URL
 */
export async function generateAllTagUrls(): Promise<UrlInfo[]> {
  const { prisma } = await import('@/lib/prisma')

  const tags = await prisma.tag.findMany({
    where: { isEnabled: true },
    select: { id: true, slug: true },
  })

  const urls: UrlInfo[] = []

  for (const tag of tags) {
    urls.push(...generateTagUrls(tag.slug, tag.id))
  }

  return urls
}

/**
 * 批量生成所有 PageType URL
 */
export async function generateAllPageTypeUrls(): Promise<UrlInfo[]> {
  const { prisma } = await import('@/lib/prisma')

  const pageTypes = await prisma.pageType.findMany({
    where: { isEnabled: true },
    select: { id: true, slug: true },
  })

  const urls: UrlInfo[] = []

  for (const pageType of pageTypes) {
    urls.push(...generatePageTypeUrls(pageType.slug, pageType.id))
  }

  return urls
}

/**
 * 生成所有 URL（游戏、分类、标签、PageType、静态页）
 */
export async function generateAllUrls(): Promise<UrlInfo[]> {
  const [
    gameUrls,
    categoryUrls,
    tagUrls,
    pageTypeUrls,
    homepageUrls,
    gamesListUrls,
    categoryListUrls,
    tagListUrls,
    sitemapUrl,
  ] = await Promise.all([
    generateAllGameUrls(),
    generateAllCategoryUrls(),
    generateAllTagUrls(),
    generateAllPageTypeUrls(),
    Promise.resolve(generateHomepageUrls()),
    Promise.resolve(generateGamesListUrl()),
    Promise.resolve(generateCategoryListUrl()),
    Promise.resolve(generateTagListUrl()),
    Promise.resolve([generateSitemapUrl()]),
  ])

  return [
    ...homepageUrls,
    ...gamesListUrls,
    ...categoryListUrls,
    ...tagListUrls,
    ...gameUrls,
    ...categoryUrls,
    ...tagUrls,
    ...pageTypeUrls,
    ...sitemapUrl,
  ]
}

/**
 * 根据筛选条件生成 URL
 */
export async function generateUrlsByFilter(filter: {
  types?: Array<'game' | 'category' | 'tag' | 'pagetype' | 'other'>
  locales?: string[]
  entityIds?: string[]
}): Promise<UrlInfo[]> {
  let urls: UrlInfo[] = []

  // 根据类型生成 URL
  if (!filter.types || filter.types.includes('game')) {
    urls.push(...(await generateAllGameUrls()))
  }

  if (!filter.types || filter.types.includes('category')) {
    urls.push(...(await generateAllCategoryUrls()))
  }

  if (!filter.types || filter.types.includes('tag')) {
    urls.push(...(await generateAllTagUrls()))
  }

  if (!filter.types || filter.types.includes('pagetype')) {
    urls.push(...(await generateAllPageTypeUrls()))
  }

  if (!filter.types || filter.types.includes('other')) {
    urls.push(...generateHomepageUrls())
    urls.push(...generateGamesListUrl())
    urls.push(...generateCategoryListUrl())
    urls.push(...generateTagListUrl())
    urls.push(generateSitemapUrl())
  }

  // 按语言筛选
  if (filter.locales && filter.locales.length > 0) {
    urls = urls.filter(
      (u) => !u.locale || filter.locales!.includes(u.locale)
    )
  }

  // 按实体 ID 筛选
  if (filter.entityIds && filter.entityIds.length > 0) {
    urls = urls.filter(
      (u) => u.entityId && filter.entityIds!.includes(u.entityId)
    )
  }

  return urls
}
