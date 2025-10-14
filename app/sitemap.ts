import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

/**
 * 动态 Sitemap 生成器
 *
 * Next.js 15 官方推荐使用动态 sitemap.ts 文件
 * 文档: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 *
 * 生成包含所有语言版本的 URL
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const locales = routing.locales // ['en', 'zh', 'es', 'fr']
  const defaultLocale = routing.defaultLocale // 'en'

  const sitemap: MetadataRoute.Sitemap = []

  // 1. 首页
  locales.forEach((locale) => {
    const url = locale === defaultLocale ? baseUrl : `${baseUrl}/${locale}`
    sitemap.push({
      url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [
            l,
            l === defaultLocale ? baseUrl : `${baseUrl}/${l}`,
          ])
        ),
      },
    })
  })

  // 2. 获取所有已发布的游戏
  const games = await prisma.game.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { playCount: 'desc' },
  })

  // 为每个游戏生成多语言 URL
  games.forEach((game) => {
    locales.forEach((locale) => {
      const url =
        locale === defaultLocale
          ? `${baseUrl}/games/${game.slug}`
          : `${baseUrl}/${locale}/games/${game.slug}`

      sitemap.push({
        url,
        lastModified: game.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              l === defaultLocale
                ? `${baseUrl}/games/${game.slug}`
                : `${baseUrl}/${l}/games/${game.slug}`,
            ])
          ),
        },
      })
    })
  })

  // 3. 获取所有启用的分类
  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
      _count: {
        select: {
          games: {
            where: { isPublished: true },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 为每个分类生成多语言 URL
  categories.forEach((category) => {
    if (category._count.games > 0) {
      locales.forEach((locale) => {
        const url =
          locale === defaultLocale
            ? `${baseUrl}/games/category/${category.slug}`
            : `${baseUrl}/${locale}/games/category/${category.slug}`

        sitemap.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [
                l,
                l === defaultLocale
                  ? `${baseUrl}/games/category/${category.slug}`
                  : `${baseUrl}/${l}/games/category/${category.slug}`,
              ])
            ),
          },
        })
      })
    }
  })

  // 4. 获取所有启用的标签
  const tags = await prisma.tag.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
      games: {
        where: { game: { isPublished: true } },
        take: 1,
      },
    },
  })

  // 为每个标签生成多语言 URL
  tags.forEach((tag) => {
    if (tag.games.length > 0) {
      locales.forEach((locale) => {
        const url =
          locale === defaultLocale
            ? `${baseUrl}/games/tags/${tag.slug}`
            : `${baseUrl}/${locale}/games/tags/${tag.slug}`

        sitemap.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [
                l,
                l === defaultLocale
                  ? `${baseUrl}/games/tags/${tag.slug}`
                  : `${baseUrl}/${l}/games/tags/${tag.slug}`,
              ])
            ),
          },
        })
      })
    }
  })

  // 5. 获取所有启用的 PageType
  const pageTypes = await prisma.pageType.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 为每个 PageType 生成多语言 URL
  pageTypes.forEach((pageType) => {
    locales.forEach((locale) => {
      const url =
        locale === defaultLocale
          ? `${baseUrl}/${pageType.slug}`
          : `${baseUrl}/${locale}/${pageType.slug}`

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              l === defaultLocale
                ? `${baseUrl}/${pageType.slug}`
                : `${baseUrl}/${l}/${pageType.slug}`,
            ])
          ),
        },
      })
    })
  })

  return sitemap
}

/**
 * 设置动态生成，每次请求时重新生成
 * 这样可以确保 sitemap 始终是最新的
 */
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 每小时重新验证一次
