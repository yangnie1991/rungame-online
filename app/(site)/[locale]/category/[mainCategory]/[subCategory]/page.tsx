import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getAllCategoriesFullData, getEnabledLanguages } from "@/lib/data"
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
import {
  generateCategoryTitle,
  generateCategoryDescription,
  combineKeywords,
  generateCategoryBaseKeywords
} from "@/lib/seo-template-generator"

interface PageProps {
  params: Promise<{ locale: string; mainCategory: string; subCategory: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

// 允许动态渲染未预生成的路径
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    // 获取所有启用的语言
    const languages = await getEnabledLanguages()

    // 为每个语言生成所有分类组合的静态参数
    const allParams = []
    for (const lang of languages) {
      const allCategories = await getAllCategoriesFullData(lang.code)

      // 获取所有主分类
      const mainCategories = allCategories.filter((cat) => cat.parentId === null)

      // 为每个主分类生成其子分类的参数
      for (const mainCat of mainCategories) {
        const subCategories = allCategories.filter((cat) => cat.parentId === mainCat.id)
        for (const subCat of subCategories) {
          allParams.push({
            locale: lang.code,
            mainCategory: mainCat.slug,
            subCategory: subCat.slug,
          })
        }
      }
    }

    console.log(`✅ Generated ${allParams.length} static params for sub categories`)
    return allParams
  } catch (error) {
    console.error('❌ Error generating static params for sub categories:', error)
    // 返回空数组，让所有路径在请求时动态渲染
    return []
  }
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { locale, mainCategory, subCategory } = await params
  const { page = "1" } = await searchParams
  const currentPage = parseInt(page, 10)

  const allCategories = await getAllCategoriesFullData(locale)
  const categoryData = allCategories.find((cat) => cat.slug === subCategory && cat.parentId !== null)

  if (!categoryData) {
    return {
      title: "Category Not Found",
    }
  }

  const siteUrl = getSiteUrl()

  // ========================================
  // 1. 标题：完全使用模板生成（不使用数据库的 metaTitle）
  // ========================================
  const baseTitle = generateCategoryTitle({
    name: categoryData.name,
    gameCount: categoryData.gameCount,
    isMainCategory: false, // 这是子分类
  }, locale)

  // 为分页页面添加页码
  const title = currentPage > 1
    ? `${baseTitle} (${locale === 'zh' ? '第' : 'Page '}${currentPage}${locale === 'zh' ? '页' : ''})`
    : baseTitle

  // ========================================
  // 2. 描述：优先使用数据库的 metaDescription
  // ========================================
  let description: string
  if (currentPage > 1) {
    // 分页页面使用固定格式
    description = locale === 'zh'
      ? `浏览更多${categoryData.name}游戏 - 第${currentPage}页。在 RunGame 上免费畅玩，无需下载。`
      : `Discover more ${categoryData.name.toLowerCase()} games - Page ${currentPage}. Play instantly on RunGame, no downloads required.`
  } else {
    // 第一页：优先使用数据库的 metaDescription，回退到模板生成
    description = categoryData.metaDescription || generateCategoryDescription({
      name: categoryData.name,
      gameCount: categoryData.gameCount,
      isMainCategory: false,
    }, locale)
  }

  // ========================================
  // 3. 关键词：固定模板 + 数据库个性关键词
  // ========================================
  const baseKeywords = generateCategoryBaseKeywords({
    name: categoryData.name,
    gameCount: categoryData.gameCount,
    isMainCategory: false,
  }, locale)

  const keywords = combineKeywords(baseKeywords, categoryData.keywords)

  // 生成动态 OG 图片 URL
  const ogImageUrl = generateCategoryOGImageUrl({
    name: categoryData.name,
    description: categoryData.description,
    gameCount: categoryData.gameCount,
    icon: categoryData.icon || '🎮',
  })

  // 构建路径（包含页码）
  const path = currentPage > 1
    ? `/category/${mainCategory}/${subCategory}?page=${currentPage}`
    : `/category/${mainCategory}/${subCategory}`

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  // 获取分页信息以生成 prev/next 链接
  const gamesResult = await getGamesByCategory(subCategory, locale, currentPage, 30)
  const pagination = gamesResult?.pagination

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
      // 自引用 canonical（包含当前页码）
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,

      // Prev link（如果不是第一页）
      ...(currentPage > 1 && {
        prev: currentPage === 2
          ? `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/category/${mainCategory}/${subCategory}`
          : `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/category/${mainCategory}/${subCategory}?page=${currentPage - 1}`,
      }),

      // Next link（如果有更多页面）
      ...(pagination?.hasMore && {
        next: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/category/${mainCategory}/${subCategory}?page=${currentPage + 1}`,
      }),

      languages: generateAlternateLanguages(
        currentPage > 1 ? `/category/${mainCategory}/${subCategory}?page=${currentPage}` : `/category/${mainCategory}/${subCategory}`
      ),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function SubCategoryPage({ params, searchParams }: PageProps) {
  const { locale, mainCategory, subCategory } = await params
  const resolvedSearchParams = await searchParams
  const page = resolvedSearchParams.page || "1"
  const sort = resolvedSearchParams.sort
  const currentPage = parseInt(page, 10)
  const currentSort = sort || "popular" // 默认排序为 popular

  // 获取分类数据
  const allCategories = await getAllCategoriesFullData(locale)
  const subCategoryData = allCategories.find((cat) => cat.slug === subCategory && cat.parentId !== null)
  const mainCategoryData = allCategories.find((cat) => cat.slug === mainCategory && cat.parentId === null)

  if (!subCategoryData || !mainCategoryData) {
    notFound()
  }

  // 验证子分类确实属于该主分类
  if (subCategoryData.parentId !== mainCategoryData.id) {
    notFound()
  }

  // 获取该主分类下的所有子分类
  const subCategories = allCategories
    .filter((cat) => cat.parentId === mainCategoryData.id)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      gameCount: cat.gameCount,
    }))

  // 获取该子分类下的游戏（每页30个）
  const gamesResult = await getGamesByCategory(subCategoryData.slug, locale, currentPage, 30)
  const t = await getTranslations({ locale, namespace: "common" })

  if (!gamesResult) {
    notFound()
  }

  const { games, pagination } = gamesResult

  // 面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t("home"), url: `/${locale}` },
    { name: t("categories"), url: `/${locale}/category` },
    { name: mainCategoryData.name, url: `/${locale}/category/${mainCategory}` },
    { name: subCategoryData.name, url: '' },
  ])

  // 分类集合 Schema（页面感知）
  const collectionSchema = generateCollectionPageSchema({
    name: currentPage > 1
      ? `${subCategoryData.name} Games - ${t("page")} ${currentPage}`
      : `${subCategoryData.name} Games`,
    description: subCategoryData.description || `Play ${subCategoryData.name} games online for free`,
    url: currentPage > 1
      ? `/${locale}/category/${mainCategory}/${subCategory}?page=${currentPage}`
      : `/${locale}/category/${mainCategory}/${subCategory}`,
    numberOfItems: games.length, // 当前页面的游戏数量，而不是总数
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
        <Link href={`/category/${mainCategory}`} className="hover:text-foreground transition-colors">
          {mainCategoryData.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{subCategoryData.name}</span>
      </nav>

      {/* 分类标题 - 紧凑布局 */}
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold">
            {subCategoryData.icon && <span className="mr-2">{subCategoryData.icon}</span>}
            {subCategoryData.name}
          </h1>
          {subCategoryData.description && (
            <p className="text-sm text-muted-foreground">{subCategoryData.description}</p>
          )}
        </div>
      </div>

      {/* 筛选列表 - 极简标签 */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {/* All 标签 - 链接回主分类 */}
          <Link
            href={`/category/${mainCategory}`}
            className="inline-flex items-center px-2.5 py-1 text-xs rounded bg-muted/60 hover:bg-muted transition-colors"
          >
            <span className="font-medium">{t("all")}</span>
            <span className="ml-1 opacity-50">({mainCategoryData.gameCount})</span>
          </Link>

          {/* 子分类标签 */}
          {subCategories.map((sub) => {
            const isActive = sub.slug === subCategory
            return (
              <Link
                key={sub.slug}
                href={`/category/${mainCategory}/${sub.slug}`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {sub.icon && <span className="mr-1 text-sm">{sub.icon}</span>}
                <span className="font-medium">{sub.name}</span>
                <span className={`ml-1 ${isActive ? "opacity-80" : "opacity-50"}`}>
                  ({sub.gameCount})
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* 游戏列表 */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">{t("allGames")}</h2>

          {/* 排序选项 - 使用标签样式 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("sortBy")}:</span>
            <div className="flex gap-1.5">
              <Link
                href={`/category/${mainCategory}/${subCategory}?sort=popular`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  currentSort === "popular"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {t("sortByPopular")}
              </Link>
              <Link
                href={`/category/${mainCategory}/${subCategory}?sort=newest`}
                className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                  currentSort === "newest"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 hover:bg-muted"
                }`}
              >
                {t("sortByNewest")}
              </Link>
              <Link
                href={`/category/${mainCategory}/${subCategory}?sort=name`}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.slug}
                  slug={game.slug}
                  thumbnail={game.thumbnail}
                  title={game.title}
                  description={game.description}
                  categoryName={subCategoryData.name}
                  categorySlug={subCategory}
                  mainCategorySlug={mainCategory}
                  locale={locale}
                />
              ))}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/category/${mainCategory}/${subCategory}?page=${currentPage - 1}`}
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
                    href={`/category/${mainCategory}/${subCategory}?page=${currentPage + 1}`}
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
