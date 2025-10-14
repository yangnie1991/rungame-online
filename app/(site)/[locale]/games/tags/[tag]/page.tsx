import { getGamesByTagWithPagination } from "@/app/(site)/actions"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params
  const data = await getGamesByTagWithPagination(tag, locale, 1, 24)

  if (!data) {
    return {
      title: "Tag Not Found",
    }
  }

  return {
    title: `${data.tag.name} Games`,
    description: `Play the best ${data.tag.name} games online for free`,
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { locale, tag } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  const data = await getGamesByTagWithPagination(tag, locale, page, 24)

  if (!data) {
    notFound()
  }

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    tags: locale === "zh" ? "标签" : "Tags",
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
    tags: (game.tags || []).map((tagName: string) => ({ name: tagName })),
  }))

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <span className="text-foreground">{data.tag.name}</span>
      </nav>

      {/* 标签标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {data.tag.name} {t.games}
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.pagination.totalGames.toLocaleString()} {t.games}
        </p>
      </div>

      {/* 游戏列表 */}
      <GameSection title={`${data.tag.name} ${t.games}`} games={formattedGames} locale={locale} showTitle={false} />

      {/* 分页导航 */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 py-8">
          {page > 1 && (
            <Link
              href={`/${locale}/games/tags/${tag}?page=${page - 1}`}
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
              href={`/${locale}/games/tags/${tag}?page=${page + 1}`}
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
