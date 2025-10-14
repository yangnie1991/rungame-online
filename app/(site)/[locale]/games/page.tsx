import { getPublishedGames } from "../../actions"
import { GameCard } from "@/components/site/GameCard"
import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface GamesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: GamesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: t("allGamesTitle"),
    description: t("allGamesDescription"),
  }
}

export default async function GamesPage({ params }: GamesPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "games" })
  const tCommon = await getTranslations({ locale, namespace: "common" })

  const games = await getPublishedGames(locale)

  return (
    <div className="container py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-primary">
          {tCommon("home")}
        </Link>
        <span>/</span>
        <span>{tCommon("games")}</span>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("description")} ({tCommon("gamesCount", { count: games.length })})
        </p>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noGamesYet")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              categoryName={game.categoryName}
              categorySlug={game.categorySlug}
              playCount={game.playCount}
              rating={game.rating}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
