import { getAllTags } from "@/app/(site)/actions"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"

interface AllTagsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AllTagsPageProps): Promise<Metadata> {
  const { locale } = await params

  const title = locale === "zh" ? "所有标签" : "All Tags"
  const description = locale === "zh" ? "浏览所有游戏标签" : "Browse all game tags"

  return {
    title: `${title} | RunGame`,
    description,
  }
}

export default async function AllTagsPage({ params }: AllTagsPageProps) {
  const { locale } = await params

  const tags = await getAllTags(locale)

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    allTags: locale === "zh" ? "所有标签" : "All Tags",
    games: locale === "zh" ? "游戏" : "Games",
    browseTags: locale === "zh" ? "浏览所有游戏标签，按游戏特点查找游戏" : "Browse all game tags and find games by their features",
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t.allTags}</span>
      </nav>

      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.allTags}</h1>
        <p className="text-muted-foreground">{t.browseTags}</p>
      </div>

      {/* 标签云 */}
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/games/tags/${tag.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 hover:bg-accent text-accent-foreground rounded-full transition-all hover:scale-105"
          >
            {tag.icon && <span>{tag.icon}</span>}
            <span className="font-medium">{tag.name}</span>
            <span className="text-sm text-muted-foreground">({tag.gameCount})</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
