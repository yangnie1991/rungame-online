import { getPageTypeGames } from "@/app/(site)/actions"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"

interface PageTypePageProps {
  params: Promise<{ locale: string; pageType: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageTypePageProps): Promise<Metadata> {
  const { locale, pageType } = await params

  // 尝试获取页面数据，如果不存在会返回null
  const data = await getPageTypeGames(pageType, locale, 1, 24)

  if (!data) {
    return {
      title: "Page Not Found",
    }
  }

  // 构建 SEO 友好的标题和描述
  const title = data.pageType.metaTitle || `${data.pageType.title} | RunGame - Free Online Games`
  const description = data.pageType.metaDescription ||
    data.pageType.description ||
    `Play ${data.pageType.title.toLowerCase()} on RunGame. Enjoy ${data.pagination.totalGames}+ free online games, no downloads required!`

  // 构建关键词
  const keywords = [
    data.pageType.title,
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
  const ogImage = data.pageType.icon
    ? `${siteUrl}/api/og?title=${encodeURIComponent(data.pageType.title)}&icon=${encodeURIComponent(data.pageType.icon)}`
    : `${siteUrl}/og-image.png`

  return {
    title,
    description,
    keywords,

    // Open Graph (用于 Facebook, LinkedIn 等)
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
          alt: data.pageType.title,
        }
      ],
    },

    // Twitter Card (用于 Twitter/X)
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@rungame',
      site: '@rungame',
    },

    // 其他 SEO 相关配置
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

    // 机器人爬取配置
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
}

export default async function PageTypePage({ params, searchParams }: PageTypePageProps) {
  const { locale, pageType } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  // 尝试获取页面数据，如果pageType不存在或未启用，会返回null
  const data = await getPageTypeGames(pageType, locale, page, 24)

  if (!data) {
    notFound()
  }

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    games: locale === "zh" ? "游戏" : "Games",
    page: locale === "zh" ? "页" : "Page",
    previous: locale === "zh" ? "上一页" : "Previous",
    next: locale === "zh" ? "下一页" : "Next",
  }

  // 将游戏转换为GameSection需要的格式
  const formattedGames = data.games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: game.title,
    description: game.description,
    category: { name: game.category, slug: "" },
    tags: (game.tags || []).map((tag: string) => ({ name: tag })),
  }))

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
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
        {data.pageType.subtitle && <p className="text-xl text-muted-foreground">{data.pageType.subtitle}</p>}
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
              href={`/${locale}/${pageType}?page=${page - 1}`}
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
              href={`/${locale}/${pageType}?page=${page + 1}`}
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
