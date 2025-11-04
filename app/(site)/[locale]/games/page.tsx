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

export async function generateMetadata({ params, searchParams }: GamesPageProps): Promise<Metadata> {
  const { locale } = await params
  const { page = "1" } = await searchParams
  const currentPage = parseInt(page, 10)
  const siteUrl = getSiteUrl()

  // 基础 titles (不包含 | RunGame，由 layout 的 template 自动添加)
  const baseTitles: Record<string, string> = {
    en: 'All Games - Free Online Games',
    zh: '所有游戏 - 免费在线游戏',
    es: 'Todos los Juegos - Juegos Gratis en Línea',
    fr: 'Tous les Jeux - Jeux Gratuits en Ligne',
  }

  // 如果不是第1页，添加页码标识
  const title = currentPage > 1
    ? `${baseTitles[locale] || baseTitles.en} (${locale === 'zh' ? '第' : 'Page '}${currentPage}${locale === 'zh' ? '页' : ''})`
    : (baseTitles[locale] || baseTitles.en)

  // 基础 descriptions
  const baseDescriptions: Record<string, string> = {
    en: `Browse thousands of free online games. Play instantly, no downloads!`,
    zh: `浏览数千款免费在线游戏。即刻畅玩,无需下载!`,
    es: `Explora miles de juegos gratis en línea. ¡Juega al instante!`,
    fr: `Parcourez des milliers de jeux gratuits en ligne. Jouez instantanément!`,
  }

  const pageDescriptions: Record<string, string> = {
    en: `Discover more exciting games - Page ${currentPage}. Play instantly, no downloads!`,
    zh: `发现更多精彩游戏 - 第${currentPage}页。即刻畅玩,无需下载!`,
    es: `Descubre más juegos emocionantes - Página ${currentPage}. ¡Juega al instante!`,
    fr: `Découvrez plus de jeux passionnants - Page ${currentPage}. Jouez instantanément!`,
  }

  const description = currentPage > 1
    ? (pageDescriptions[locale] || pageDescriptions.en)
    : (baseDescriptions[locale] || baseDescriptions.en)

  // 构建包含页码的 path（用于 canonical 和 OG）
  const path = currentPage > 1 ? `/games?page=${currentPage}` : `/games`

  // 获取分页信息（用于 prev/next 链接）
  const { pagination } = await getAllGames(locale, currentPage, 30, 'popular')

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
      // Self-referencing canonical (每个分页指向自己)
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,

      // Prev link (如果不是第1页)
      ...(currentPage > 1 && {
        prev: currentPage === 2
          ? `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/games`
          : `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/games?page=${currentPage - 1}`,
      }),

      // Next link (如果还有更多页)
      ...(pagination.hasMore && {
        next: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/games?page=${currentPage + 1}`,
      }),

      languages: generateAlternateLanguages(currentPage > 1 ? `/games?page=${currentPage}` : `/games`),
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
    name: currentPage > 1 ? `${t("title")} - ${tCommon("page")} ${currentPage}` : t("title"),
    description: t("description"),
    url: currentPage > 1 ? `/${locale}/games?page=${currentPage}` : `/${locale}/games`,
    numberOfItems: games.length, // 当前页的游戏数量
  })

  return (
    <div className="py-8 px-4 md:px-6 lg:px-8 space-y-8">
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
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {tCommon("home")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{tCommon("allGames")}</span>
      </nav>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")} ({tCommon("gamesCount", { count: pagination.totalGames })})
        </p>
      </div>

      {/* 排序选项 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground hidden sm:inline">{tCommon("sortBy")}:</span>
        <div className="flex gap-1.5 flex-wrap">
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
