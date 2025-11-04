import { getPageTypeGames, getPageTypeInfo } from "@/lib/data"
import { getAllCategoriesFullData } from "@/lib/data/categories/cache"
import { getAllTagsFullData } from "@/lib/data/tags/cache"
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
import { getPageTypeContent } from "@/lib/helpers/pagetype-content"

interface PageTypePageProps {
  params: Promise<{ locale: string; pageType: string }>
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
  const pageUrl = `${siteUrl}/${locale}/collection/${pageType}`

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
        'en': `${siteUrl}/en/collection/${pageType}`,
        'zh': `${siteUrl}/zh/collection/${pageType}`,
        'es': `${siteUrl}/es/collection/${pageType}`,
        'fr': `${siteUrl}/fr/collection/${pageType}`,
        'x-default': `${siteUrl}/collection/${pageType}`,
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

export default async function PageTypePage({ params }: PageTypePageProps) {
  const { locale, pageType } = await params

  // 并行获取游戏数据、分类和标签
  const [data, allCategories, allTags] = await Promise.all([
    getPageTypeGames(pageType, locale, 1, 30),
    getAllCategoriesFullData(locale),
    getAllTagsFullData(locale),
  ])

  if (!data) {
    notFound()
  }

  // ✨ 从数据库 pageInfo 中提取内容配置
  const pageContent = getPageTypeContent(
    data.pageType.pageInfo,
    data.pageType.translationPageInfo,
    locale
  )

  const tCommon = await getTranslations({ locale, namespace: "common" })

  // 根据 PageType slug 定制推荐策略
  const recommendationConfig: Record<string, {
    categoryTitle: { zh: string; en: string }
    tagTitle: { zh: string; en: string }
    sortStrategy: 'gameCount' | 'playCount' | 'rating' | 'recent'
  }> = {
    'featured': {
      categoryTitle: { zh: '精选分类', en: 'Featured Categories' },
      tagTitle: { zh: '精选标签', en: 'Featured Tags' },
      sortStrategy: 'rating', // 按评分排序
    },
    'most-played': {
      categoryTitle: { zh: '热门分类', en: 'Popular Categories' },
      tagTitle: { zh: '热门标签', en: 'Popular Tags' },
      sortStrategy: 'gameCount', // 按游戏数排序
    },
    'newest': {
      categoryTitle: { zh: '推荐分类', en: 'Recommended Categories' },
      tagTitle: { zh: '推荐标签', en: 'Recommended Tags' },
      sortStrategy: 'recent', // 按最近活跃度
    },
    'trending': {
      categoryTitle: { zh: '推荐分类', en: 'Recommended Categories' },
      tagTitle: { zh: '推荐标签', en: 'Recommended Tags' },
      sortStrategy: 'gameCount', // 按游戏数排序
    },
  }

  // 获取当前页面的推荐配置，如果没有配置则使用默认值
  const config = recommendationConfig[pageType] || {
    categoryTitle: { zh: '推荐分类', en: 'Recommended Categories' },
    tagTitle: { zh: '推荐标签', en: 'Recommended Tags' },
    sortStrategy: 'gameCount' as const,
  }

  const t = {
    home: locale === "zh" ? "首页" : "Home",
    games: locale === "zh" ? "游戏" : "Games",
    viewAllGames: locale === "zh" ? "查看全部游戏" : "View All Games",
    categoryTitle: config.categoryTitle[locale as 'zh' | 'en'],
    tagTitle: config.tagTitle[locale as 'zh' | 'en'],
    viewAll: locale === "zh" ? "查看全部" : "View All",
  }

  const formattedGames = data.games.map((game: any) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: game.title,
    description: game.description,
    category: game.categorySlug && game.category ? {
      name: game.category,
      slug: game.categorySlug
    } : undefined,
    mainCategory: game.mainCategorySlug ? {
      slug: game.mainCategorySlug
    } : undefined,
    tags: (game.tags || []).map((tag: string) => ({ name: tag })),
  }))

  // 根据策略排序分类和标签
  const sortByStrategy = <T extends { gameCount: number; id: string }>(items: T[], strategy: typeof config.sortStrategy): T[] => {
    switch (strategy) {
      case 'gameCount':
        // 按游戏数量降序
        return items.sort((a, b) => b.gameCount - a.gameCount)

      case 'rating':
        // 按评分降序（当前用游戏数作为权重，未来可以加入真实评分）
        // 优先选择游戏数适中且质量高的分类
        return items.sort((a, b) => {
          const scoreA = a.gameCount > 0 ? Math.log10(a.gameCount + 1) * 10 : 0
          const scoreB = b.gameCount > 0 ? Math.log10(b.gameCount + 1) * 10 : 0
          return scoreB - scoreA
        })

      case 'recent':
        // 按最近活跃度（用 id 的时间戳近似，新创建的 ID 通常更大）
        // 未来可以基于最近添加的游戏数量
        return items.sort((a, b) => {
          // 优先选择有游戏的分类，然后按游戏数排序
          if (a.gameCount === 0 && b.gameCount > 0) return 1
          if (a.gameCount > 0 && b.gameCount === 0) return -1
          return b.gameCount - a.gameCount
        })

      case 'playCount':
        // 按播放量降序（当前用游戏数作为近似）
        return items.sort((a, b) => b.gameCount - a.gameCount)

      default:
        return items.sort((a, b) => b.gameCount - a.gameCount)
    }
  }

  // 筛选推荐的主分类（只显示主分类，按策略排序，取前6个 - 与首页保持一致）
  const recommendedCategories = sortByStrategy(
    allCategories.filter(cat => cat.parentId === null && cat.gameCount > 0),
    config.sortStrategy
  ).slice(0, 6)

  // 筛选推荐的标签（按策略排序，取前10个 - 与首页保持一致）
  const recommendedTags = sortByStrategy(
    allTags.filter(tag => tag.gameCount > 0),
    config.sortStrategy
  ).slice(0, 10)

  // 面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: tCommon("home"), url: `/${locale}` },
    { name: data.pageType.title, url: '' },
  ])

  // 页面集合 Schema
  const collectionSchema = generateCollectionPageSchema({
    name: data.pageType.title,
    description: data.pageType.description || `Play ${data.pageType.title} games online for free`,
    url: `/${locale}/collection/${pageType}`,
    numberOfItems: data.games.length,
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

      {/* 页面标题和描述 - 优化布局 */}
      <div className="space-y-4">
        {/* 标题 + 简短描述 */}
        <div>
          <h1 className="text-3xl font-bold flex items-baseline gap-3 flex-wrap">
            {data.pageType.icon && <span>{data.pageType.icon}</span>}
            <span>{data.pageType.title}</span>
            {data.pageType.description && (
              <span className="text-base font-normal text-muted-foreground">
                {data.pageType.description}
              </span>
            )}
          </h1>
        </div>

        {/* 详细内容 - 无边框 */}
        {pageContent && (
          <div className="space-y-4 mt-6">
            {/* 详细描述 */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pageContent.detailedDescription}
            </p>

            {/* 特色标签 */}
            {pageContent.features.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {pageContent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="font-medium text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 游戏数量 */}
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{data.games.length}</span> {t.games} {locale === 'zh' ? '可供游玩' : 'available to play'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 游戏列表 - 禁用标签链接以优化内链数量 */}
      <GameSection
        title={data.pageType.title}
        games={formattedGames}
        locale={locale}
        showTitle={false}
        enableTagLinks={false}  // ✅ 禁用标签链接，减少58个链接
      />

      {/* 推荐分类区块 - 参照首页样式 */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl">🎯</span>
              <span>{t.categoryTitle}</span>
              {/* 桌面端：同行副标题 */}
              <span className="hidden md:inline text-base font-normal text-muted-foreground">
                {locale === 'zh' ? '相关游戏分类' : 'Related Game Categories'}
              </span>
            </h2>
            {/* 移动端：换行副标题 */}
            <p className="block md:hidden text-sm text-muted-foreground mt-1">
              {locale === 'zh' ? '快速浏览相关分类' : 'Browse related categories'}
            </p>
          </div>
          <Link
            href="/category"
            className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {recommendedCategories.map(category => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary bg-card hover:bg-accent transition-all hover:shadow-md"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {category.icon || '🎮'}
              </span>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category.gameCount} {locale === 'zh' ? '游戏' : 'games'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 推荐标签区块 - 参照首页样式 */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl">🏷️</span>
              <span>{t.tagTitle}</span>
              {/* 桌面端：同行副标题 */}
              <span className="hidden md:inline text-base font-normal text-muted-foreground">
                {locale === 'zh' ? '相关游戏标签' : 'Related Game Tags'}
              </span>
            </h2>
            {/* 移动端：换行副标题 */}
            <p className="block md:hidden text-sm text-muted-foreground mt-1">
              {locale === 'zh' ? '通过标签发现更多相似游戏' : 'Discover more similar games through tags'}
            </p>
          </div>
          <Link
            href="/tag"
            className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t.viewAll} →
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {recommendedTags.map(tag => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border hover:border-primary bg-card hover:bg-accent transition-all hover:shadow-md"
            >
              <span className="font-medium group-hover:text-primary transition-colors text-sm sm:text-base">
                #{tag.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({tag.gameCount})
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 底部总结区块 - 从数据库读取 */}
      {pageContent && pageContent.summary && (
        <section className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-8 space-y-6">
            {/* 总结文字 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                {locale === 'zh' ? '关于这个精选集' : 'About This Collection'}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pageContent.summary}
              </p>
            </div>

            {/* CTA 按钮组 */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {t.viewAllGames} →
              </Link>
              <Link
                href="/category"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-foreground bg-card hover:bg-accent rounded-lg transition-all border border-border"
              >
                {locale === 'zh' ? '浏览分类' : 'Browse Categories'}
              </Link>
              <Link
                href="/tag"
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-foreground bg-card hover:bg-accent rounded-lg transition-all border border-border"
              >
                {locale === 'zh' ? '浏览标签' : 'Browse Tags'}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
