import { getGameBySlug, incrementPlayCount, getGameRealtimeStats } from "@/lib/data"
import { getUserVote } from "@/app/(site)/actions/game-vote"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { Suspense } from "react"
import { GameEmbed } from "@/components/site/GameEmbed"
import { GameGallery } from "@/components/site/GameGallery"
import { GameVideos } from "@/components/site/GameVideos"
import { ContentRenderer } from "@/components/site/ContentRenderer"
import { RecommendedGamesSidebar, SameCategoryGames } from "@/components/site/RecommendedGames"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import { generateGameOGImageUrl } from "@/lib/og-image-helpers"
import {
  generateVideoGameSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    return {
      title: "Game Not Found",
    }
  }

  const siteUrl = getSiteUrl()

  // 构建 SEO 友好的标题和描述
  const titleTemplates: Record<string, string> = {
    en: `${game.title} - Play Free Online`,
    zh: `${game.title} - 免费在线玩`,
  }

  const descriptionTemplates: Record<string, string> = {
    en: game.metaDescription || game.description || `Play ${game.title} for free on RunGame. ${game.category.name} game. No downloads, instant fun!`,
    zh: game.metaDescription || game.description || `在 RunGame 上免费玩 ${game.title}。${game.category.name}游戏。无需下载，即刻畅玩！`,
  }

  const title = titleTemplates[locale] || titleTemplates.en
  const description = descriptionTemplates[locale] || descriptionTemplates.en

  // 生成动态 OG 图片 URL
  const ogImageUrl = generateGameOGImageUrl({
    title: game.title,
    category: game.category.name,
    categoryIcon: '🎮',
    thumbnail: game.banner || game.thumbnail,
    tags: game.tags.map(t => t.name).join(','),
  })

  // 构建路径（不带语言前缀）
  const path = `/play/${slug}`

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    keywords: [
      game.title,
      game.category.name,
      ...game.tags.map(t => t.name),
    ].join(', '),

    // Open Graph
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: game.title,
        }
      ],
      publishedTime: game.createdAt ? new Date(game.createdAt).toISOString() : undefined,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@rungame',
      site: '@rungame',
    },

    // 多语言 alternate 链接
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      languages: generateAlternateLanguages(path),
    },
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    notFound()
  }

  // 增加播放次数（异步，不阻塞渲染）
  incrementPlayCount(game.id).catch(() => { })

  // 获取实时统计数据（不缓存，始终最新）
  const stats = await getGameRealtimeStats(game.id)

  // 获取用户的投票状态
  const userVoteResult = await getUserVote(game.id)
  const initialUserVote = userVoteResult.success ? userVoteResult.vote : null

  // 准备推荐引擎需要的当前游戏数据（传递给异步组件）
  const currentGameData = {
    id: game.id,
    slug: game.slug,
    categoryId: game.categoryId,
    tagIds: game.tagIds,
    playCount: game.playCount,
    viewCount: game.viewCount,
    rating: game.rating,
    ratingCount: game.ratingCount,
    qualityScore: game.qualityScore,
    releaseDate: game.releaseDate,
    createdAt: game.createdAt,
  }

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    games: locale === "zh" ? "游戏" : "Games",
    category: locale === "zh" ? "分类" : "Category",
    categoryLabel: locale === "zh" ? "分类：" : "Category:",
    playCount: locale === "zh" ? "播放次数" : "Play Count",
    playCountLabel: locale === "zh" ? "播放次数：" : "Plays:",
    rating: locale === "zh" ? "评分" : "Rating",
    ratingLabel: locale === "zh" ? "评分：" : "Rating:",
    howToPlay: locale === "zh" ? "游戏玩法" : "How to Play",
    controls: locale === "zh" ? "游戏操作" : "Controls",
    tags: locale === "zh" ? "标签" : "Tags",
    tagsLabel: locale === "zh" ? "标签：" : "Tags:",
    info: locale === "zh" ? "信息" : "Info",
    recommended: locale === "zh" ? "推荐游戏" : "Recommended Games",
    fullscreen: locale === "zh" ? "全屏" : "Fullscreen",
    screenshots: locale === "zh" ? "游戏截图" : "Screenshots",
    videos: locale === "zh" ? "游戏视频" : "Videos",
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  // 生成面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.home, url: `/${locale}` },
    { name: t.games, url: `/${locale}/games` },
    { name: game.category.name, url: `/${locale}/category/${game.category.slug}` },
    { name: game.title, url: '' }, // 当前页面不需要 URL
  ])

  // 生成游戏 Schema
  const gameSchema = generateVideoGameSchema({
    name: game.title,
    description: game.description || `Play ${game.title} for free on RunGame`,
    image: game.thumbnail,
    genre: game.category.name,
    playCount: stats.playCount, // 使用实时播放次数
    rating: game.rating || undefined,
    ratingCount: game.ratingCount || undefined, // 使用实际评分数量
    url: `/${locale}/play/${slug}`,
  })

  return (
    <div className="space-y-4">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(gameSchema) }}
      />

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <Link href="/games" className="hover:text-foreground transition-colors">
          {t.games}
        </Link>
        <span>/</span>
        <Link
          href={`/${game.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {game.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{game.title}</span>
      </nav>

      {/* 游戏标题 - 精简头部 */}
      <div className="flex items-baseline gap-3 overflow-hidden">
        <h1 className="text-2xl lg:text-3xl font-bold shrink-0">{game.title}</h1>
        {game.description && (
          <span className="text-sm text-muted-foreground truncate">
            {game.description}
          </span>
        )}
      </div>

      {/* 游戏播放器 - 全宽 */}
      <GameEmbed
        embedUrl={game.embedUrl}
        title={game.title}
        width={game.dimensions.width}
        height={game.dimensions.height}
        playCount={stats.playCount}
        gameId={game.id}
        gameSlug={game.slug}
        locale={locale}
        initialLikes={stats.likes}
        initialDislikes={stats.dislikes}
        initialUserVote={initialUserVote}
      />

      {/* 下方内容区 - 3/4 和 1/4 分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主要内容区 - 3/4 */}
        <div className="lg:col-span-3">
          {/* 统一的大卡片容器 */}
          <div className="bg-card rounded-lg shadow-md">
            {/* 游戏基本信息 */}
            <div className="px-6 py-2 space-y-4">
              <h2 className="text-xl font-bold">{game.title}</h2>

              {/* 分类、播放次数、评分 - 统一行 */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{t.categoryLabel}</span>

                  {/* 主分类 */}
                  <Link
                    href={`/category/${game.category.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors font-medium"
                  >
                    {game.category.icon && <span>{game.category.icon}</span>}
                    {game.category.name}
                  </Link>

                  {/* 分隔符 + 子分类 */}
                  {game.subCategory && (
                    <>
                      <span className="text-muted-foreground">›</span>
                      <Link
                        href={`/category/${game.category.slug}/${game.subCategory.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/80 text-secondary-foreground rounded-full hover:bg-secondary transition-colors font-medium"
                      >
                        {game.subCategory.icon && <span>{game.subCategory.icon}</span>}
                        {game.subCategory.name}
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{t.playCountLabel}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">👁️</span>
                    <span className="font-medium">{game.playCount.toLocaleString()}</span>
                  </span>
                </div>
                {game.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">{t.ratingLabel}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">⭐</span>
                      <span className="font-medium">{game.rating.toFixed(1)}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* 标签 - 单独一行 */}
              {game.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">{t.tagsLabel}</span>
                  {game.tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/tag/${tag.slug}`}
                      className="text-sm px-2.5 py-1 bg-accent/50 hover:bg-accent text-accent-foreground rounded-md transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 游戏描述 */}
            <div className="game-info px-6 max-w-none ">
              {game.description && (
                <div>
                  <h2>{game.title} {t.info}</h2>
                  <p>{game.description}</p>
                </div>
              )}

              {/* 游戏详细内容（使用 gameInfo） */}
              <ContentRenderer gameInfo={game.gameInfo} locale={locale} />
            </div>

            {/* 游戏截图展示 */}
            {game.screenshots && game.screenshots.length > 0 && (
              <div className="px-6 py-4 space-y-3">
                <h2 className="text-xl font-bold">{t.screenshots}</h2>
                <GameGallery
                  screenshots={game.screenshots}
                  gameTitle={game.title}
                />
              </div>
            )}

            {/* 游戏视频展示 */}
            {game.videos && game.videos.length > 0 && (
              <div className="px-6 py-4 space-y-3">
                <h2 className="text-xl font-bold">{t.videos}</h2>
                <GameVideos
                  videos={game.videos}
                  gameTitle={game.title}
                />
              </div>
            )}
          </div>
        </div>

        {/* 侧边栏 - 推荐游戏 - 1/4 */}
        <Suspense fallback={<RecommendedGamesSkeleton title={t.recommended} />}>
          <RecommendedGamesSidebar
            currentGameData={currentGameData}
            locale={locale}
            title={t.recommended}
          />
        </Suspense>
      </div>

      {/* 底部推荐模块 - 混合推荐（最多游玩、最新、高评分） */}
      <Suspense fallback={<SameCategoryGamesSkeleton />}>
        <SameCategoryGames
          categorySlug={game.category.slug}
          subCategorySlug={game.subCategory?.slug || null}
          currentGameSlug={game.slug}
          locale={locale}
          categoryName={game.category.name}
          subCategoryName={game.subCategory?.name || null}
        />
      </Suspense>
    </div>
  )
}

/**
 * 侧边栏推荐游戏加载骨架屏
 */
function RecommendedGamesSkeleton({ title }: { title: string }) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-4 space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg overflow-hidden border animate-pulse"
            >
              {/* 缩略图骨架 */}
              <div className="aspect-video bg-muted" />
              {/* 内容骨架 */}
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 底部推荐游戏加载骨架屏
 */
function SameCategoryGamesSkeleton() {
  return (
    <div className="mt-12 space-y-8">
      <section>
        {/* 标题骨架 */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        </div>
        {/* 游戏卡片骨架 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg overflow-hidden border animate-pulse"
            >
              <div className="aspect-video bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
