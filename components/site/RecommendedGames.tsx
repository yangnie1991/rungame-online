import { getRecommendedGames } from "@/lib/data"
import { getMixedRecommendedGames } from "@/lib/data/games/detail"
import { GameCard } from "@/components/site/GameCard"
import { Link } from "@/i18n/routing"

interface RecommendedGamesSidebarProps {
  currentGameData: {
    id: string
    slug: string
    categoryId: string
    tagIds: string[]
    playCount: number
    viewCount: number
    rating: number
    ratingCount: number
    qualityScore: number
    releaseDate: Date | null
    createdAt: Date
  }
  locale: string
  title: string
}

/**
 * 侧边栏推荐游戏（异步组件）
 *
 * 使用 Suspense 边界异步加载，不阻塞主页面渲染
 */
export async function RecommendedGamesSidebar({
  currentGameData,
  locale,
  title
}: RecommendedGamesSidebarProps) {
  // 异步加载推荐游戏
  const recommendedGames = await getRecommendedGames(currentGameData, locale, 6)

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-4 space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="space-y-4">
          {recommendedGames.map((game) => (
            <GameCard
              key={game.slug}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              categoryName={game.category}
              tags={game.tags}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface SameCategoryGamesProps {
  categorySlug: string
  subCategorySlug: string | null
  currentGameSlug: string
  locale: string
  categoryName: string
  subCategoryName: string | null
}

/**
 * 底部同分类游戏（异步组件）
 *
 * 使用 Suspense 边界异步加载，不阻塞主页面渲染
 */
export async function SameCategoryGames({
  categorySlug,
  subCategorySlug,
  currentGameSlug,
  locale,
  categoryName,
  subCategoryName,
}: SameCategoryGamesProps) {
  // 异步加载同分类游戏
  const sameCategoryGames = await getMixedRecommendedGames(
    categorySlug,
    subCategorySlug,
    currentGameSlug,
    locale,
    6
  )

  if (sameCategoryGames.length === 0) {
    return null
  }

  const displayName = subCategoryName || categoryName

  return (
    <div className="mt-12 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            {locale === 'zh'
              ? `更多${displayName}游戏`
              : `More ${displayName} Games`}
          </h2>
          <Link
            href={
              subCategorySlug
                ? `/category/${categorySlug}/${subCategorySlug}`
                : `/category/${categorySlug}`
            }
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {locale === 'zh' ? '查看全部' : 'View All'} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {sameCategoryGames.map((game) => (
            <GameCard
              key={game.slug}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              categoryName={game.categoryName}
              categorySlug={game.categorySlug}
              tags={game.tags}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
