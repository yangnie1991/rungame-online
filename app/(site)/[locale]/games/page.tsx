import { getAllGames } from "@/lib/data"
import { GameCard } from "@/components/site/GameCard"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface GamesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params }: GamesPageProps): Promise<Metadata> {
  const { locale } = await params
  const siteUrl = getSiteUrl()

  const titles: Record<string, string> = {
    en: 'All Games - Free Online Games | RunGame',
    zh: '所有游戏 - 免费在线游戏 | RunGame',
    es: 'Todos los Juegos - Juegos Gratis en Línea | RunGame',
    fr: 'Tous les Jeux - Jeux Gratuits en Ligne | RunGame',
  }

  const descriptions: Record<string, string> = {
    en: `Browse thousands of free online games. Play instantly, no downloads!`,
    zh: `浏览数千款免费在线游戏。即刻畅玩,无需下载!`,
    es: `Explora miles de juegos gratis en línea. ¡Juega al instante!`,
    fr: `Parcourez des milliers de jeux gratuits en ligne. Jouez instantanément!`,
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en
  const path = `/games`

  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    keywords: 'online games, free games, browser games',
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'website',
      images: [{
        url: `${siteUrl}/assets/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'RunGame',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/assets/images/og-image.png`],
      creator: '@rungame',
      site: '@rungame',
    },
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      languages: generateAlternateLanguages(path),
    },
  }
}

export default async function GamesPage({ params, searchParams }: GamesPageProps) {
  const { locale } = await params
  const { page = "1", sort } = await searchParams
  const currentPage = parseInt(page, 10)
  const currentSort = (sort || "popular") as 'popular' | 'newest' | 'name'

  const t = await getTranslations({ locale, namespace: "games" })
  const tCommon = await getTranslations({ locale, namespace: "common" })

  // 获取游戏数据（每页30个）
  const { games, pagination } = await getAllGames(locale, currentPage, 30, currentSort)

  // 生成面包屑Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: tCommon("home"), url: `/${locale}` },
    { name: tCommon("allGames"), url: '' },
  ])

  // 生成CollectionPage Schema
  const collectionSchema = generateCollectionPageSchema({
    name: t("title"),
    description: t("description"),
    url: `/${locale}/games`,
    numberOfItems: pagination.totalGames,
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
        <span>{tCommon("allGames")}</span>
      </div>

      {/* Header with Sort */}
      <div className="flex items-baseline justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("description")} ({tCommon("gamesCount", { count: pagination.totalGames })})
          </p>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{tCommon("sortBy")}:</span>
          <div className="flex gap-1.5">
            <Link
              href="/games?sort=popular"
              className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                currentSort === "popular"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 hover:bg-muted"
              }`}
            >
              {tCommon("sortByPopular")}
            </Link>
            <Link
              href="/games?sort=newest"
              className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                currentSort === "newest"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 hover:bg-muted"
              }`}
            >
              {tCommon("sortByNewest")}
            </Link>
            <Link
              href="/games?sort=name"
              className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                currentSort === "name"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 hover:bg-muted"
              }`}
            >
              {tCommon("sortByName")}
            </Link>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noGamesYet")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.slug}
                slug={game.slug}
                thumbnail={game.thumbnail}
                title={game.title}
                description={game.description}
                categoryName={game.category}
                categorySlug={game.categorySlug}
                mainCategorySlug={game.mainCategorySlug}
                locale={locale}
              />
            ))}
          </div>

          {/* 分页导航 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/games?page=${currentPage - 1}${currentSort !== 'popular' ? `&sort=${currentSort}` : ''}`}
                  className="px-4 py-2 rounded-lg bg-card hover:bg-accent transition-colors"
                >
                  {tCommon("previous")}
                </Link>
              )}
              <span className="px-4 py-2">
                {tCommon("page")} {currentPage} / {pagination.totalPages}
              </span>
              {pagination.hasMore && (
                <Link
                  href={`/games?page=${currentPage + 1}${currentSort !== 'popular' ? `&sort=${currentSort}` : ''}`}
                  className="px-4 py-2 rounded-lg bg-card hover:bg-accent transition-colors"
                >
                  {tCommon("next")}
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
