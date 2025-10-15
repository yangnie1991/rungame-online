import { getFeaturedGames, getMostPlayedGames, getNewestGames, getTrendingGames } from "../actions"
import { GameSection } from "@/components/site/GameSection"
import { Link } from "@/i18n/routing"
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

// 使用动态SSR渲染，每10分钟重新验证缓存
// 这样既保证SEO友好，又能提升性能
export const revalidate = 600 // 10分钟

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  // 并行获取所有section的游戏数据（提升性能）
  const [featuredGames, mostPlayedGames, newestGames, trendingGames] = await Promise.all([
    getFeaturedGames(locale, 24),
    getMostPlayedGames(locale, 24),
    getNewestGames(locale, 24),
    getTrendingGames(locale, 24),
  ])

  // 获取翻译文本
  const t = await getTranslations({ locale, namespace: "home" })

  // 将游戏转换为GameSection需要的格式
  const formatGames = (games: typeof featuredGames) =>
    games.map((game) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: game.title,
      description: game.description,
      category: game.categoryName
        ? {
            name: game.categoryName,
            slug: game.categorySlug,
          }
        : undefined,
      tags: game.tags?.map((tag) => ({ name: tag.name })),
    }))

  return (
    <>
      {/* Featured Games Section */}
      <GameSection
        title={t("featured")}
        icon="⭐"
        games={formatGames(featuredGames)}
        viewAllLink="/featured"
        locale={locale}
      />

      {/* Most Played Games Section */}
      <GameSection
        title={t("mostPlayed")}
        icon="🔥"
        games={formatGames(mostPlayedGames)}
        viewAllLink="/most-played"
        locale={locale}
      />

      {/* Newest Games Section */}
      <GameSection
        title={t("newest")}
        icon="🆕"
        games={formatGames(newestGames)}
        viewAllLink="/newest"
        locale={locale}
      />

      {/* Trending Games Section */}
      <GameSection
        title={t("trending")}
        icon="📈"
        games={formatGames(trendingGames)}
        viewAllLink="/trending"
        locale={locale}
      />

      {/* Browse All Games Link */}
      <div className="mt-12 mb-8 text-center">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          {t("browseAllGames")} →
        </Link>
      </div>
    </>
  )
}
