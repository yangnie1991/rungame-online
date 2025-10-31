import { searchGames, getMainCategories, getAllTags } from "@/lib/data"
import { GameCard } from "@/components/site/GameCard"
import { RelatedLinks } from "@/components/site/RelatedLinks"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params
  const { q = '' } = await searchParams
  const siteUrl = getSiteUrl()

  const titles: Record<string, string> = {
    en: q ? `Search Results for "${q}" - RunGame` : 'Search Games - RunGame',
    zh: q ? `"${q}" 的搜索结果 - RunGame` : '搜索游戏 - RunGame',
    es: q ? `Resultados de búsqueda para "${q}" - RunGame` : 'Buscar Juegos - RunGame',
    fr: q ? `Résultats de recherche pour "${q}" - RunGame` : 'Rechercher des Jeux - RunGame',
  }

  const descriptions: Record<string, string> = {
    en: q ? `Find games matching "${q}". Browse our collection of free online games.` : 'Search through thousands of free online games. Find your favorite games instantly!',
    zh: q ? `查找与 "${q}" 相关的游戏。浏览我们的免费在线游戏集合。` : '搜索数千款免费在线游戏。立即找到您最喜欢的游戏！',
    es: q ? `Encuentra juegos que coincidan con "${q}". Explora nuestra colección de juegos gratis en línea.` : '¡Busca entre miles de juegos gratis en línea. Encuentra tus juegos favoritos al instante!',
    fr: q ? `Trouvez des jeux correspondant à "${q}". Parcourez notre collection de jeux gratuits en ligne.` : 'Recherchez parmi des milliers de jeux gratuits en ligne. Trouvez vos jeux préférés instantanément!',
  }

  const title = titles[locale] || titles.en
  const description = descriptions[locale] || descriptions.en
  const path = `/search${q ? `?q=${encodeURIComponent(q)}` : ''}`

  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    keywords: q ? `${q}, online games, free games, search` : 'search games, find games, online games, free games',
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
    robots: {
      index: !!q, // 只有有搜索词时才索引
      follow: true,
    },
  }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  const { q = '', page = "1", sort } = await searchParams
  const currentPage = parseInt(page, 10)
  const currentSort = (sort || "popular") as 'popular' | 'newest' | 'name'
  const searchQuery = q.trim()

  const t = await getTranslations({ locale, namespace: "search" })
  const tCommon = await getTranslations({ locale, namespace: "common" })

  // 获取搜索结果和相关链接数据
  const [{ games, pagination, query }, categories, tags] = await Promise.all([
    searchGames(searchQuery, locale, currentPage, 30, currentSort),
    getMainCategories(locale),
    getAllTags(locale),
  ])

  // 筛选热门分类和标签
  const popularCategories = categories
    .sort((a, b) => b.gameCount - a.gameCount)
    .slice(0, 6)

  const popularTags = tags
    .sort((a, b) => b.gameCount - a.gameCount)
    .slice(0, 12)

  // 生成面包屑Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: tCommon("home"), url: `/${locale}` },
    { name: t("search"), url: '' },
  ])

  // 如果有结果，生成CollectionPage Schema
  const collectionSchema = pagination.totalGames > 0 ? generateCollectionPageSchema({
    name: `${t("searchResults")}: ${query}`,
    description: `${pagination.totalGames} ${t("gamesFound")}`,
    url: `/${locale}/search?q=${encodeURIComponent(query)}`,
    numberOfItems: pagination.totalGames,
  }) : null

  return (
    <div className="container py-8 space-y-8">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      {collectionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(collectionSchema) }}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {tCommon("home")}
        </Link>
        <span>/</span>
        <span>{t("search")}</span>
      </div>

      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          {query ? `${t("searchResults")}: "${query}"` : t("search")}
        </h1>

        {query && (
          <div className="flex items-baseline justify-between">
            <p className="text-lg text-muted-foreground">
              {pagination.totalGames > 0
                ? `${t("found")} ${pagination.totalGames} ${t("gamesFound")}`
                : t("noResults")}
            </p>

            {/* 排序选项 - 仅在有结果时显示 */}
            {games.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{tCommon("sortBy")}:</span>
                <div className="flex gap-1.5">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&sort=popular`}
                    className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                      currentSort === "popular"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 hover:bg-muted"
                    }`}
                  >
                    {tCommon("sortByPopular")}
                  </Link>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&sort=newest`}
                    className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                      currentSort === "newest"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 hover:bg-muted"
                    }`}
                  >
                    {tCommon("sortByNewest")}
                  </Link>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&sort=name`}
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
            )}
          </div>
        )}

        {/* Empty state when no query */}
        {!query && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("enterSearchTerm")}</p>
          </div>
        )}
      </div>

      {/* Search Results */}
      {query && games.length > 0 && (
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
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}${currentSort !== 'popular' ? `&sort=${currentSort}` : ''}`}
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
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}${currentSort !== 'popular' ? `&sort=${currentSort}` : ''}`}
                  className="px-4 py-2 rounded-lg bg-card hover:bg-accent transition-colors"
                >
                  {tCommon("next")}
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* No results */}
      {query && games.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">{t("noResultsMessage")}</p>
          <Link
            href="/games"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("browseAllGames")}
          </Link>
        </div>
      )}

      {/* 相关链接区块 - 始终显示，帮助用户发现内容 */}
      <RelatedLinks
        locale={locale}
        title={query && games.length === 0
          ? (locale === 'zh' ? '试试这些分类' : 'Try These Categories')
          : (locale === 'zh' ? '发现更多游戏' : 'Discover More Games')
        }
        categories={popularCategories}
        tags={popularTags}
        showAllGamesLink={!query || games.length === 0}
      />
    </div>
  )
}
