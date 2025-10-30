import { getGameBySlug, getRecommendedGames, incrementPlayCount } from "@/lib/data"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { GameCard } from "@/components/site/GameCard"
import { GameEmbed } from "@/components/site/GameEmbed"
import { GameGallery } from "@/components/site/GameGallery"
import { GameVideos } from "@/components/site/GameVideos"
import { ContentRenderer } from "@/components/site/ContentRenderer"
import { generateGameSEOMetadata } from "@/lib/seo-helpers"
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

  // 使用统一的 SEO 元数据生成函数
  // 🎨 使用动态生成的 OG 图片（包含游戏标题、分类图标和缩略图）
  return await generateGameSEOMetadata({
    title: game.title,
    description: game.metaDescription || game.description || `Play ${game.title} for free on RunGame. ${game.category.name} game. No downloads, instant fun!`,
    locale,
    slug: `play/${slug}`,
    categoryName: game.category.name,
    categoryIcon: game.category.icon || '🎮', // 传递分类图标
    tags: game.tags.map(t => t.name),
    thumbnail: game.banner || game.thumbnail, // 游戏缩略图会显示在 OG 图片中
    publishedTime: game.createdAt ? new Date(game.createdAt).toISOString() : undefined,
    modifiedTime: game.updatedAt ? new Date(game.updatedAt).toISOString() : undefined,
  })
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    notFound()
  }

  // 增加播放次数（异步，不阻塞渲染）
  incrementPlayCount(game.id).catch(() => { })

  // 获取推荐游戏
  const recommendedGames = await getRecommendedGames(game.category.slug, game.slug, locale, 6)

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
    playCount: game.playCount,
    rating: game.rating || undefined,
    ratingCount: game.rating ? 100 : undefined, // 如果有评分，假设有 100 个评分
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
      <div className="bg-black rounded-lg overflow-hidden">
        <GameEmbed
          embedUrl={game.embedUrl}
          title={game.title}
          width={game.dimensions.width}
          height={game.dimensions.height}
        />
      </div>

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
                  <Link
                    href={`/${game.category.slug}`}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors font-medium"
                  >
                    {game.category.name}
                  </Link>
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
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <h2 className="text-xl font-bold">{t.recommended}</h2>
            <div className="space-y-4">
              {recommendedGames.map((recommendedGame) => (
                <GameCard
                  key={recommendedGame.slug}
                  slug={recommendedGame.slug}
                  thumbnail={recommendedGame.thumbnail}
                  title={recommendedGame.title}
                  description={recommendedGame.description}
                  categoryName={recommendedGame.category}
                  tags={recommendedGame.tags}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
