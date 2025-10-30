import { getPublishedGames } from "@/lib/data"
import { GameCard } from "@/components/site/GameCard"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { generateSEOMetadata } from "@/lib/seo-helpers"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface GamesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: GamesPageProps): Promise<Metadata> {
  const { locale } = await params
  const games = await getPublishedGames(locale)

  const titles: Record<string, string> = {
    en: 'All Games - Free Online Games | RunGame',
    zh: '所有游戏 - 免费在线游戏 | RunGame',
    es: 'Todos los Juegos - Juegos Gratis en Línea | RunGame',
    fr: 'Tous les Jeux - Jeux Gratuits en Ligne | RunGame',
  }

  const descriptions: Record<string, string> = {
    en: `Browse ${games.length}+ free online games. Play instantly, no downloads!`,
    zh: `浏览 ${games.length}+ 款免费在线游戏。即刻畅玩,无需下载!`,
    es: `Explora ${games.length}+ juegos gratis en línea. ¡Juega al instante!`,
    fr: `Parcourez ${games.length}+ jeux gratuits en ligne. Jouez instantanément!`,
  }

  return generateSEOMetadata({
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    locale,
    path: `/${locale}/games`,
    keywords: ['online games', 'free games', 'browser games'],
  })
}

export default async function GamesPage({ params }: GamesPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "games" })
  const tCommon = await getTranslations({ locale, namespace: "common" })

  const games = await getPublishedGames(locale)

  // 生成面包屑Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: tCommon("home"), url: `/${locale}` },
    { name: tCommon("games"), url: '' },
  ])

  // 生成CollectionPage Schema
  const collectionSchema = generateCollectionPageSchema({
    name: t("title"),
    description: t("description"),
    url: `/${locale}/games`,
    numberOfItems: games.length,
  })

  return (
    <div className="container py-8 space-y-8">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(collectionSchema) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
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
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
