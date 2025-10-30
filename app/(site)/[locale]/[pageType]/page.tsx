import { getPageTypeGames, getPageTypeInfo } from "@/lib/data"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"
import { generatePageTypeOGImageUrl } from "@/lib/og-image-helpers"

interface PageTypePageProps {
  params: Promise<{ locale: string; pageType: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageTypePageProps): Promise<Metadata> {
  const { locale, pageType } = await params

  // 只获取 PageType 信息，不查询游戏列表（避免重复查询）
  const pageTypeInfo = await getPageTypeInfo(pageType, locale)

  if (!pageTypeInfo) {
    return {
      title: "Page Not Found",
    }
  }

  // 构建 SEO 友好的标题和描述
  const title = pageTypeInfo.metaTitle || `${pageTypeInfo.title} | RunGame - Free Online Games`
  const description = pageTypeInfo.metaDescription ||
    pageTypeInfo.description ||
    `Play ${pageTypeInfo.title.toLowerCase()} on RunGame. Enjoy ${pageTypeInfo.totalGames}+ free online games, no downloads required!`

  // 构建关键词
  const keywords = [
    pageTypeInfo.title,
    'free online games',
    'browser games',
    'no download games',
    'RunGame',
    locale === 'zh' ? '免费在线游戏' : 'free games',
    locale === 'zh' ? '网页游戏' : 'web games',
  ].join(', ')

  // 获取网站 URL（根据环境变量或默认值）
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const pageUrl = `${siteUrl}/${locale}/${pageType}`

  // 🎨 使用动态生成的 PageType OG 图片
  const ogImage = generatePageTypeOGImageUrl({
    title: pageTypeInfo.title,
    description: pageTypeInfo.description || '',
    gameCount: pageTypeInfo.totalGames,
    icon: pageTypeInfo.icon || '🎯',
    type: pageTypeInfo.type as 'GAME_LIST' | 'DISPLAY_PAGE' | 'OTHER_PAGE',
  })

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'RunGame',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageTypeInfo.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@rungame',
      site: '@rungame',
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        'en': `${siteUrl}/en/${pageType}`,
        'zh': `${siteUrl}/zh/${pageType}`,
        'es': `${siteUrl}/es/${pageType}`,
        'fr': `${siteUrl}/fr/${pageType}`,
        'x-default': `${siteUrl}/${pageType}`,
      },
    },
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
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
    },
  }
}

// 导出 viewport 配置
export const viewport = {
  themeColor: '#2563eb',
}

export default async function PageTypePage({ params, searchParams }: PageTypePageProps) {
  const { locale, pageType } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  // 尝试获取游戏列表页面数据（只支持 GAME_LIST 类型）
  const data = await getPageTypeGames(pageType, locale, page, 24)

  if (!data) {
    notFound()
  }

  const tCommon = await getTranslations({ locale, namespace: "common" })

  const t = {
    home: locale === "zh" ? "首页" : "Home",
    games: locale === "zh" ? "游戏" : "Games",
    page: locale === "zh" ? "页" : "Page",
    previous: locale === "zh" ? "上一页" : "Previous",
    next: locale === "zh" ? "下一页" : "Next",
  }

  const formattedGames = data.games.map((game: any) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: game.title,
    description: game.description,
    category: { name: game.category, slug: "" },
    tags: (game.tags || []).map((tag: string) => ({ name: tag })),
  }))

  // 面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: tCommon("home"), url: `/${locale}` },
    { name: data.pageType.title, url: '' },
  ])

  // 页面集合 Schema
  const collectionSchema = generateCollectionPageSchema({
    name: data.pageType.title,
    description: data.pageType.description || `Play ${data.pageType.title} games online for free`,
    url: `/${locale}/${pageType}`,
    numberOfItems: data.pagination.totalGames,
  })

  return (
    <div className="space-y-6">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(collectionSchema) }}
      />

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {data.pageType.icon} {data.pageType.title}
        </span>
      </nav>

      {/* 页面标题和描述 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {data.pageType.icon && <span>{data.pageType.icon}</span>}
          {data.pageType.title}
        </h1>
        {data.pageType.description && <p className="text-muted-foreground">{data.pageType.description}</p>}
        <p className="text-sm text-muted-foreground">
          {data.pagination.totalGames.toLocaleString()} {t.games}
        </p>
      </div>

      {/* 游戏列表 */}
      <GameSection title={data.pageType.title} games={formattedGames} locale={locale} showTitle={false} />

      {/* 分页导航 */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 py-8">
          {page > 1 && (
            <Link
              href={`/${pageType}?page=${page - 1}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.previous}
            </Link>
          )}

          <span className="text-sm text-muted-foreground">
            {t.page} {page} / {data.pagination.totalPages}
          </span>

          {data.pagination.hasMore && (
            <Link
              href={`/${pageType}?page=${page + 1}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.next}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
