import { getFeaturedGames, getMostPlayedGames, getNewestGames, getTrendingGames, getTotalGamesCount } from "@/lib/data"
import { getAllCategoriesFullData } from "@/lib/data/categories/cache"
import { getAllTagsFullData } from "@/lib/data/tags/cache"
import { GameSection } from "@/components/site/GameSection"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { generateHomeSEOMetadata } from "@/lib/seo-helpers"
import {
  generateWebSiteSchema,
  generateGameListSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params

  // 使用缓存的游戏总数（10分钟缓存）
  // 只在缓存未命中时才查询数据库
  const totalGames = await getTotalGamesCount()

  const metadata = generateHomeSEOMetadata(locale, totalGames)

  // 覆盖title为字符串，避免继承layout的template导致重复
  // 例如避免: "RunGame - Free Online Games - RunGame"
  return {
    ...metadata,
    title: metadata.title as string,
  }
}

// 使用动态SSR渲染，每10分钟重新验证缓存
// 这样既保证SEO友好，又能提升性能
export const revalidate = 600 // 10分钟

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  // 并行获取所有数据（游戏数据 + 分类 + 标签）
  // 分类和标签数据会被缓存，后续页面可以直接使用
  const [featuredGames, mostPlayedGames, newestGames, trendingGames] = await Promise.all([
    
    getFeaturedGames(locale, 24),
    getMostPlayedGames(locale, 24),
    getNewestGames(locale, 24),
    getTrendingGames(locale, 24),
    // 预取分类和标签数据，填充缓存
    getAllCategoriesFullData(locale),
    getAllTagsFullData(locale),
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

  // WebSite Schema
  const websiteSchema = generateWebSiteSchema(locale)

  // 游戏列表 Schema (精选游戏)
  const gameListSchema = generateGameListSchema(
    featuredGames.slice(0, 10).map(game => ({
      name: game.title,
      url: `/${locale}/play/${game.slug}`,
      image: game.thumbnail,
    })),
    locale === 'zh' ? '精选游戏' : 'Featured Games',
    `/${locale}`
  )

  return (
    <>
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(gameListSchema) }}
      />

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
