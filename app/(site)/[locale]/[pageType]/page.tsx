import { getPageTypeGames, getStaticContentPage } from "@/app/(site)/actions"
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

  // 尝试获取游戏列表页面数据
  const gameListData = await getPageTypeGames(pageType, locale, 1, 24)
  if (gameListData) {
    // 构建 SEO 友好的标题和描述
    const title = gameListData.pageType.metaTitle || `${gameListData.pageType.title} | RunGame - Free Online Games`
    const description = gameListData.pageType.metaDescription ||
      gameListData.pageType.description ||
      `Play ${gameListData.pageType.title.toLowerCase()} on RunGame. Enjoy ${gameListData.pagination.totalGames}+ free online games, no downloads required!`

    // 构建关键词
    const keywords = [
      gameListData.pageType.title,
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
    const ogImage = gameListData.pageType.icon
      ? `${siteUrl}/api/og?title=${encodeURIComponent(gameListData.pageType.title)}&icon=${encodeURIComponent(gameListData.pageType.icon)}`
      : `${siteUrl}/og-image.png`

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
            alt: gameListData.pageType.title,
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
        'theme-color': '#2563eb',
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
      },
    }
  }

  // 尝试获取静态内容页面数据
  const staticData = await getStaticContentPage(pageType, locale)
  if (staticData) {
    const title = staticData.pageType.metaTitle || `${staticData.pageType.title} | RunGame`
    const description = staticData.pageType.metaDescription || staticData.pageType.description

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
    const pageUrl = `${siteUrl}/${locale}/${pageType}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'RunGame',
        locale: locale === 'zh' ? 'zh_CN' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title,
        description,
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
      },
    }
  }

  return {
    title: "Page Not Found",
  }
}

export default async function PageTypePage({ params, searchParams }: PageTypePageProps) {
  const { locale, pageType } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  // 尝试获取游戏列表页面数据
  const gameListData = await getPageTypeGames(pageType, locale, page, 24)
  if (gameListData) {
    return renderGameListPage(gameListData, locale, page, pageType)
  }

  // 尝试获取静态内容页面数据
  const staticData = await getStaticContentPage(pageType, locale)
  if (staticData) {
    return renderStaticContentPage(staticData, locale)
  }

  // 如果两种类型都不匹配，返回 404
  notFound()
}

// 渲染游戏列表页面
function renderGameListPage(data: any, locale: string, page: number, pageType: string) {
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

// 渲染静态内容页面
function renderStaticContentPage(data: any, locale: string) {
  const t = {
    home: locale === "zh" ? "首页" : "Home",
  }

  return (
    <div className="space-y-8">
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

      {/* 页面标题区域 */}
      <div className="space-y-3 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3">
          {data.pageType.icon && <span className="text-4xl md:text-5xl">{data.pageType.icon}</span>}
          {data.pageType.title}
        </h1>
        {data.pageType.subtitle && (
          <p className="text-lg md:text-xl text-muted-foreground">{data.pageType.subtitle}</p>
        )}
      </div>

      {/* 内容块 - 使用卡片式布局 */}
      <div className="space-y-6">
        {data.contentBlocks.map((block: any) => (
          <article
            key={block.id}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 md:p-8 lg:p-10">
              {block.title && (
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                  {block.title}
                </h2>
              )}
              {block.content && (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-foreground
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground prose-p:mb-4
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:text-foreground prose-li:mb-2
                    prose-em:text-muted-foreground prose-em:italic
                    prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-muted prose-pre:border prose-pre:border-border
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.buttonText && block.buttonUrl && (
                <Link
                  href={block.buttonUrl}
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                >
                  {block.buttonText}
                  <span>→</span>
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* 返回顶部按钮 */}
      <div className="pt-8 border-t border-border">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>←</span>
          <span>{t.home}</span>
        </Link>
      </div>
    </div>
  )
}
