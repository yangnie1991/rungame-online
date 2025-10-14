import { getGameBySlug, getRecommendedGames, incrementPlayCount } from "@/app/(site)/actions"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { GameCard } from "@/components/site/GameCard"
import { GameEmbed } from "@/components/site/GameEmbed"
import { generateGameSEOMetadata } from "@/lib/seo-helpers"

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
  return generateGameSEOMetadata({
    title: game.title,
    description: game.metaDescription || game.description || `Play ${game.title} for free on RunGame. ${game.category.name} game. No downloads, instant fun!`,
    locale,
    slug: `play/${slug}`,
    categoryName: game.category.name,
    tags: game.tags.map(t => t.name),
    thumbnail: game.banner || game.thumbnail,
    publishedTime: game.createdAt.toISOString(),
    modifiedTime: game.createdAt.toISOString(),
  })
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    notFound()
  }

  // 增加播放次数（异步，不阻塞渲染）
  incrementPlayCount(game.id).catch(() => {})

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
  }

  return (
    <div className="space-y-4">
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
          href={`/games/category/${game.category.slug}`}
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
          width={game.width}
          height={game.height}
        />
      </div>

      {/* 下方内容区 - 3/4 和 1/4 分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主要内容区 - 3/4 */}
        <div className="lg:col-span-3">
          {/* 统一的大卡片容器 */}
          <div className="bg-card rounded-lg shadow-md divide-y divide-border/50">
            {/* 游戏基本信息 */}
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{game.title}</h2>

              {/* 分类、播放次数、评分 - 统一行 */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{t.categoryLabel}</span>
                  <Link
                    href={`/games/category/${game.category.slug}`}
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
                      href={`/games/tags/${tag.slug}`}
                      className="text-sm px-2.5 py-1 bg-accent/50 hover:bg-accent text-accent-foreground rounded-md transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 游戏描述 */}
            {game.description && (
              <div className="p-6 space-y-3">
                <h2 className="text-xl font-bold">{game.title} {t.info}</h2>
                <p className="text-muted-foreground leading-relaxed">{game.description}</p>
              </div>
            )}

            {/* 游戏玩法说明 */}
            {game.instructions && (
              <div className="p-6 space-y-3">
                <h2 className="text-xl font-bold">{t.howToPlay} {game.title}</h2>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{game.instructions}</div>
              </div>
            )}

            {/* 游戏操作说明 */}
            {game.longDescription && (
              <div className="p-6 space-y-3">
                <h2 className="text-xl font-bold">{game.title} {t.controls}</h2>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{game.longDescription}</div>
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
