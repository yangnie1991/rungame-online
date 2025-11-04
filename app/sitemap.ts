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

  // 2. 静态页面（重要的聚合页和信息页）
  // 注意：search 页面不包含在 sitemap 中，因为设置了 noindex
  const staticPages = [
    { path: 'games', priority: 0.9, changeFrequency: 'daily' as const },
    { path: 'category', priority: 0.8, changeFrequency: 'daily' as const },
    { path: 'tag', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: 'about', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: 'contact', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: 'privacy', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: 'terms', priority: 0.3, changeFrequency: 'monthly' as const },
  ]

  staticPages.forEach((page) => {
    locales.forEach((locale) => {
      const url =
        locale === defaultLocale
          ? `${baseUrl}/${page.path}`
          : `${baseUrl}/${locale}/${page.path}`

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              l === defaultLocale
                ? `${baseUrl}/${page.path}`
                : `${baseUrl}/${l}/${page.path}`,
            ])
          ),
        },
      })
    })
  })

  // 3. 获取所有已发布的游戏
  const games = await prisma.game.findMany({
    where: { status: 'PUBLISHED' },
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
          ? `${baseUrl}/play/${game.slug}`
          : `${baseUrl}/${locale}/play/${game.slug}`

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
                ? `${baseUrl}/play/${game.slug}`
                : `${baseUrl}/${l}/play/${game.slug}`,
            ])
          ),
        },
      })
    })
  })

  // 4. 获取所有启用的分类（包含父分类信息）
  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
      parentId: true,
      parent: {
        select: {
          slug: true,
        },
      },
      _count: {
        select: {
          gameSubCategories: {
            where: {
              game: { status: 'PUBLISHED' }
            },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 为每个分类生成多语言 URL
  // 主分类：/category/{mainCategorySlug} (如 /category/action-games)
  // 子分类：/category/{mainCategorySlug}/{subCategorySlug} (如 /category/action-games/action)
  // 注意：生成所有启用的分类，不管是否有游戏
  categories.forEach((category) => {
    // 判断是主分类还是子分类
    const isMainCategory = !category.parentId

    locales.forEach((locale) => {
      // 构建分类路径
      let categoryPath: string
      if (isMainCategory) {
        // 主分类：/category/{slug}
        categoryPath = `/category/${category.slug}`
      } else {
        // 子分类：/category/{parentSlug}/{slug}
        if (!category.parent) {
          console.warn(`子分类 ${category.slug} 缺少父分类信息`)
          return
        }
        categoryPath = `/category/${category.parent.slug}/${category.slug}`
      }

      const url =
        locale === defaultLocale
          ? `${baseUrl}${categoryPath}`
          : `${baseUrl}/${locale}${categoryPath}`

      // 根据游戏数量调整优先级和更新频率
      const hasGames = category._count.gameSubCategories > 0
      const priority = isMainCategory ? 0.7 : 0.6
      const changeFrequency = hasGames ? 'daily' : 'weekly'

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: changeFrequency as 'daily' | 'weekly',
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              l === defaultLocale
                ? `${baseUrl}${categoryPath}`
                : `${baseUrl}/${l}${categoryPath}`,
            ])
          ),
        },
      })
    })
  })

  // 5. 获取所有启用的标签
  const tags = await prisma.tag.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
      games: {
        where: { game: { status: 'PUBLISHED' } },
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
            ? `${baseUrl}/tag/${tag.slug}`
            : `${baseUrl}/${locale}/tag/${tag.slug}`

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
                  ? `${baseUrl}/tag/${tag.slug}`
                  : `${baseUrl}/${l}/tag/${tag.slug}`,
              ])
            ),
          },
        })
      })
    }
  })

  // 6. 获取所有启用的 PageType
  const pageTypes = await prisma.pageType.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 为每个 PageType 生成多语言 URL（带 /collection/ 前缀）
  pageTypes.forEach((pageType) => {
    locales.forEach((locale) => {
      const url =
        locale === defaultLocale
          ? `${baseUrl}/collection/${pageType.slug}`
          : `${baseUrl}/${locale}/collection/${pageType.slug}`

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
                ? `${baseUrl}/collection/${pageType.slug}`
                : `${baseUrl}/${l}/collection/${pageType.slug}`,
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
