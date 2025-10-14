import { getGameBySlug, incrementPlayCount, getRecommendedGames } from "@/app/(site)/actions"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { GameCard } from "@/components/site/GameCard"

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

  return {
    title: game.metaTitle || game.title,
    description: game.metaDescription || game.description,
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    notFound()
  }

  // 获取推荐游戏
  const recommendedGames = await getRecommendedGames(game.category.slug, game.slug, locale, 6)

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    category: locale === "zh" ? "分类" : "Category",
    playCount: locale === "zh" ? "播放次数" : "Play Count",
    rating: locale === "zh" ? "评分" : "Rating",
    howToPlay: locale === "zh" ? "游戏玩法" : "How to Play",
    controls: locale === "zh" ? "游戏操作" : "Controls",
    tags: locale === "zh" ? "标签" : "Tags",
    recommended: locale === "zh" ? "推荐游戏" : "Recommended Games",
    fullscreen: locale === "zh" ? "全屏" : "Fullscreen",
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <Link
          href={`/${locale}/games/category/${game.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {game.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{game.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 游戏标题和信息 */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <Link
                    href={`/${locale}/games/category/${game.category.slug}`}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {game.category.name}
                  </Link>
                  <span className="flex items-center">
                    👁️ {game.playCount.toLocaleString()} {t.playCount}
                  </span>
                  {game.rating > 0 && (
                    <span className="flex items-center">
                      ⭐ {game.rating.toFixed(1)} {t.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 游戏描述 */}
            {game.description && <p className="text-muted-foreground">{game.description}</p>}

            {/* 标签 */}
            {game.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">{t.tags}:</span>
                {game.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/${locale}/games/tags/${tag.slug}`}
                    className="text-sm px-2 py-1 bg-accent/50 hover:bg-accent text-accent-foreground rounded transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 游戏播放器 */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: `${game.width} / ${game.height}` }}>
            <iframe
              src={game.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              title={game.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* 游戏玩法说明 */}
          {game.instructions && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-xl font-bold">{t.howToPlay}</h2>
              <div className="text-muted-foreground whitespace-pre-wrap">{game.instructions}</div>
            </div>
          )}

          {/* 游戏操作说明 */}
          {game.longDescription && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-xl font-bold">{t.controls}</h2>
              <div className="text-muted-foreground whitespace-pre-wrap">{game.longDescription}</div>
            </div>
          )}
        </div>

        {/* 侧边栏 - 推荐游戏 */}
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
