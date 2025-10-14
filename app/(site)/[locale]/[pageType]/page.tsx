import { getPageTypeGames } from "@/app/(site)/actions"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"

interface PageTypePageProps {
  params: Promise<{ locale: string; pageType: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageTypePageProps): Promise<Metadata> {
  const { locale, pageType } = await params

  // 尝试获取页面数据，如果不存在会返回null
  const data = await getPageTypeGames(pageType, locale, 1, 24)

  if (!data) {
    return {
      title: "Page Not Found",
    }
  }

  return {
    title: data.pageType.metaTitle || `${data.pageType.title} | RunGame`,
    description: data.pageType.metaDescription || data.pageType.description || "",
  }
}

export default async function PageTypePage({ params, searchParams }: PageTypePageProps) {
  const { locale, pageType } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  // 尝试获取页面数据，如果pageType不存在或未启用，会返回null
  const data = await getPageTypeGames(pageType, locale, page, 24)

  if (!data) {
    notFound()
  }

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
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
        <span className="text-foreground">
          {data.pageType.icon} {data.pageType.title}
        </span>
      </nav>

      {/* 页面标题和描述 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {data.pageType.icon && <span>{data.pageType.icon}</span>}
          {data.pageType.title}
        </h1>
        {data.pageType.subtitle && <p className="text-xl text-muted-foreground">{data.pageType.subtitle}</p>}
        {data.pageType.description && <p className="text-muted-foreground">{data.pageType.description}</p>}
        <p className="text-sm text-muted-foreground">
          {data.pagination.totalGames.toLocaleString()} {t.games}
        </p>
      </div>

      {/* 游戏列表 */}
      <GameSection title={data.pageType.title} games={formattedGames} locale={locale} showTitle={false} />

      {/* 分页导航 */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 py-8">
          {page > 1 && (
            <Link
              href={`/${locale}/${pageType}?page=${page - 1}`}
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
              href={`/${locale}/${pageType}?page=${page + 1}`}
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
