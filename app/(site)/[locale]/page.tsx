import { getMostPlayedGames, getTrendingGames, getGamesByTagSlug } from "../actions"
import { GameSection } from "@/components/site/GameSection"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  // 并行获取所有section的游戏数据（提升性能）
  const [mostPlayedGames, trendingGames, ioGames, puzzleGames, actionGames] = await Promise.all([
    getMostPlayedGames(locale, 24),
    getTrendingGames(locale, 24),
    getGamesByTagSlug("io", locale, 24),
    getGamesByTagSlug("puzzle", locale, 24),
    getGamesByTagSlug("action", locale, 24),
  ])

  // 翻译文本
  const content = {
    mostPlayed: locale === "zh" ? "最受欢迎" : "Most Played",
    trending: locale === "zh" ? "热门趋势" : "Trending",
    ioGames: locale === "zh" ? "IO游戏" : "IO Games",
    puzzleGames: locale === "zh" ? "益智游戏" : "Puzzle Games",
    actionGames: locale === "zh" ? "动作游戏" : "Action Games",
  }

  // 将游戏转换为GameSection需要的格式
  const formatGames = (games: typeof mostPlayedGames) =>
    games.map((game) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: game.title,
      description: game.description,
      category: game.category
        ? {
            name: game.category,
            slug: "", // slug will be determined by category name
          }
        : undefined,
      tags: (game.tags || []).map((tag: string) => ({ name: tag })),
    }))

  return (
    <>
      {/* Most Played Games Section */}
      <GameSection
        title={content.mostPlayed}
        icon="🔥"
        games={formatGames(mostPlayedGames)}
        viewAllLink="/most-played"
        locale={locale}
      />

      {/* Trending Games Section */}
      <GameSection
        title={content.trending}
        icon="📈"
        games={formatGames(trendingGames)}
        viewAllLink="/trending"
        locale={locale}
      />

      {/* IO Games Section */}
      <GameSection
        title={content.ioGames}
        icon="🌐"
        games={formatGames(ioGames)}
        viewAllLink="/games/tags/io"
        locale={locale}
      />

      {/* Puzzle Games Section */}
      <GameSection
        title={content.puzzleGames}
        icon="🧩"
        games={formatGames(puzzleGames)}
        viewAllLink="/games/tags/puzzle"
        locale={locale}
      />

      {/* Action Games Section */}
      <GameSection
        title={content.actionGames}
        icon="⚡"
        games={formatGames(actionGames)}
        viewAllLink="/games/tags/action"
        locale={locale}
      />
    </>
  )
}
