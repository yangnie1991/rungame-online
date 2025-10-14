import { getGamesByCategory } from "@/app/(site)/actions"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { generateCategorySEOMetadata } from "@/lib/seo-helpers"

interface CategoryPageProps {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params
  const data = await getGamesByCategory(category, locale, 1, 24)

  if (!data) {
    return {
      title: "Category Not Found",
    }
  }

  // 使用统一的 SEO 元数据生成函数
  return generateCategorySEOMetadata({
    categoryName: data.category.name,
    description: data.category.description || `Play ${data.pagination.totalGames}+ free ${data.category.name.toLowerCase()} games on RunGame. Browser games, no downloads required!`,
    locale,
    slug: category,
    gameCount: data.pagination.totalGames,
  })
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, category } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  const data = await getGamesByCategory(category, locale, page, 24)

  if (!data) {
    notFound()
  }

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    categories: locale === "zh" ? "分类" : "Categories",
    games: locale === "zh" ? "游戏" : "Games",
    page: locale === "zh" ? "页" : "Page",
    previous: locale === "zh" ? "上一页" : "Previous",
    next: locale === "zh" ? "下一页" : "Next",
  }

  // 将游戏转换为GameSection需要的格式
  const formattedGames = data.games.map((game) => ({
    slug: game.slug,
    thumbnail: game.thumbnail,
    title: game.title,
    description: game.description,
    category: { name: game.category, slug: "" },
    tags: (game.tags || []).map((tag: string) => ({ name: tag })),
  }))

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <span className="text-foreground">{data.category.name}</span>
      </nav>

      {/* 分类标题和描述 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {data.category.name} {t.games}
        </h1>
        {data.category.description && <p className="text-muted-foreground">{data.category.description}</p>}
        <p className="text-sm text-muted-foreground">
          {data.pagination.totalGames.toLocaleString()} {t.games}
        </p>
      </div>

      {/* 游戏列表 */}
      <GameSection
        title={`${data.category.name} ${t.games}`}
        games={formattedGames}
        locale={locale}
        showTitle={false}
      />

      {/* 分页导航 */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 py-8">
          {page > 1 && (
            <Link
              href={`/games/category/${category}?page=${page - 1}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.previous}
            </Link>
          )}

          <span className="text-sm text-muted-foreground">
            {t.page} {page} / {data.pagination.totalPages}
          </span>

          {data.pagination.hasMore && (
            <Link
              href={`/games/category/${category}?page=${page + 1}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.next}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
