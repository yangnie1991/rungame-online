import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getMainCategories, getSubCategoriesByParentSlug, getAllCategoriesFullData, getEnabledLanguages } from "@/lib/data"
import { getGamesByCategory } from "@/lib/data"
import { GameCard } from "@/components/site/GameCard"
import { Link } from "@/i18n/routing"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import { generateCategoryOGImageUrl } from "@/lib/og-image-helpers"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface PageProps {
  params: Promise<{ locale: string; mainCategory: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateStaticParams() {
  // 获取所有启用的语言
  const languages = await getEnabledLanguages()

  // 为每个语言生成主分类的静态参数
  const allParams = []
  for (const lang of languages) {
    const mainCategories = await getMainCategories(lang.code)
    for (const cat of mainCategories) {
      allParams.push({
        locale: lang.code,
        mainCategory: cat.slug,
      })
    }
  }

  return allParams
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, mainCategory } = await params

  const allCategories = await getAllCategoriesFullData(locale)
  const categoryData = allCategories.find((cat) => cat.slug === mainCategory && cat.parentId === null)

  if (!categoryData) {
    return {
      title: "Category Not Found",
    }
  }

  const siteUrl = getSiteUrl()

  // 优先使用数据库中的 SEO 字段，如果为空则生成默认值
  const title = categoryData.metaTitle || `${categoryData.name} Games - Free Online ${categoryData.name} Games | RunGame`
  const description = categoryData.metaDescription ||
    categoryData.description ||
    `Play ${categoryData.gameCount}+ free ${categoryData.name.toLowerCase()} games on RunGame. Enjoy browser-based gaming with no downloads required.`

  const keywords = categoryData.keywords || [
    categoryData.name,
    `${categoryData.name} games`,
    `free ${categoryData.name} games`,
    `online ${categoryData.name} games`,
    'RunGame'
  ].join(', ')

  // 生成动态 OG 图片 URL
  const ogImageUrl = generateCategoryOGImageUrl({
    name: categoryData.name,
    description: categoryData.description,
    gameCount: categoryData.gameCount,
    icon: categoryData.icon || '🎮',
  })

  // 构建路径（不带语言前缀）
  const path = `/category/${mainCategory}`

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'website',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: categoryData.name,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@rungame',
      site: '@rungame',
    },
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      languages: generateAlternateLanguages(path),
    },
  }
}

export default async function MainCategoryPage({ params, searchParams }: PageProps) {
  const { locale, mainCategory } = await params
  const { page = "1", sort } = await searchParams
  const currentPage = parseInt(page, 10)
  const currentSort = sort || "popular" // 默认排序为 popular

  // 获取分类数据
  const allCategories = await getAllCategoriesFullData(locale)
  const categoryData = allCategories.find((cat) => cat.slug === mainCategory && cat.parentId === null)

  if (!categoryData) {
    notFound()
  }

  // 获取子分类
  const subCategories = await getSubCategoriesByParentSlug(mainCategory, locale)

  // 获取该主分类下的游戏（每页30个）
  const gamesResult = await getGamesByCategory(categoryData.slug, locale, currentPage, 30)
  const t = await getTranslations({ locale, namespace: "common" })

  if (!gamesResult) {
    notFound()
  }

  const { games, pagination } = gamesResult

  // 面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t("home"), url: `/${locale}` },
    { name: t("categories"), url: `/${locale}/category` },
    { name: categoryData.name, url: '' },
  ])

  // 分类集合 Schema
  const collectionSchema = generateCollectionPageSchema({
    name: `${categoryData.name} Games`,
    description: categoryData.description || `Play ${categoryData.name} games online for free`,
    url: `/${locale}/category/${mainCategory}`,
    numberOfItems: pagination.totalGames,
  })

  return (
    <div className="space-y-6">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(collectionSchema) }}
      />

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t("home")}
        </Link>
        <span>/</span>
        <Link href="/category" className="hover:text-foreground transition-colors">
          {t("categories")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{categoryData.name}</span>
      </nav>

      {/* 分类标题 - 紧凑布局 */}
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold">
            {categoryData.icon && <span className="mr-2">{categoryData.icon}</span>}
            {categoryData.name}
          </h1>
          {categoryData.description && (
            <p className="text-sm text-muted-foreground">{categoryData.description}</p>
          )}
        </div>
      </div>

      {/* 筛选列表 - 极简标签 */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {/* All 标签 - 始终显示在最前面 */}
          <Link
            href={`/category/${mainCategory}`}
            className="inline-flex items-center px-2.5 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span className="font-medium">{t("all")}</span>
            <span className="ml-1 opacity-80">({categoryData.gameCount})</span>
          </Link>

          {/* 子分类标签 */}
          {subCategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/category/${mainCategory}/${sub.slug}`}
              className="inline-flex items-center px-2.5 py-1 text-xs rounded bg-muted/60 hover:bg-muted transition-colors"
            >
              {sub.icon && <span className="mr-1 text-sm">{sub.icon}</span>}
              <span className="font-medium">{sub.name}</span>
              <span className="ml-1 opacity-50">({sub.gameCount})</span>
            </Link>
          ))}
        </div>
      )}

      {/* 游戏列表 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-semibold">{t("allGames")}</h2>

          {/* 排序选项 - 使用标签样式 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("sortBy")}:</span>
            <div className="flex gap-1.5">
              <Link
                href={`/category/${mainCategory}?sort=popular`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  currentSort === "popular"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {t("sortByPopular")}
              </Link>
              <Link
                href={`/category/${mainCategory}?sort=newest`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  currentSort === "newest"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {t("sortByNewest")}
              </Link>
              <Link
                href={`/category/${mainCategory}?sort=name`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  currentSort === "name"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {t("sortByName")}
              </Link>
            </div>
          </div>
        </div>
        {games.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/category/${mainCategory}?page=${currentPage - 1}`}
                    className="px-4 py-2 rounded-lg bg-card hover:bg-accent transition-colors"
                  >
                    {t("previous")}
                  </Link>
                )}
                <span className="px-4 py-2">
                  {t("page")} {currentPage} / {pagination.totalPages}
                </span>
                {pagination.hasMore && (
                  <Link
                    href={`/category/${mainCategory}?page=${currentPage + 1}`}
                    className="px-4 py-2 rounded-lg bg-card hover:bg-accent transition-colors"
                  >
                    {t("next")}
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">{t("noGamesFound")}</p>
        )}
      </div>
    </div>
  )
}
