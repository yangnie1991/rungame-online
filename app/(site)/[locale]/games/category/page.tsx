import { getAllCategories } from "@/app/(site)/actions"
import type { Metadata } from "next"
import Link from "next/link"

interface AllCategoriesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AllCategoriesPageProps): Promise<Metadata> {
  const { locale } = await params

  const title = locale === "zh" ? "所有分类" : "All Categories"
  const description = locale === "zh" ? "浏览所有游戏分类" : "Browse all game categories"

  return {
    title: `${title} | RunGame`,
    description,
  }
}

export default async function AllCategoriesPage({ params }: AllCategoriesPageProps) {
  const { locale } = await params

  const categories = await getAllCategories(locale)

  // 翻译文本
  const t = {
    home: locale === "zh" ? "首页" : "Home",
    allCategories: locale === "zh" ? "所有分类" : "All Categories",
    games: locale === "zh" ? "游戏" : "Games",
    browseCategories: locale === "zh" ? "浏览所有游戏分类，找到你最喜欢的游戏类型" : "Browse all game categories and find your favorite game types",
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {t.home}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t.allCategories}</span>
      </nav>

      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.allCategories}</h1>
        <p className="text-muted-foreground">{t.browseCategories}</p>
      </div>

      {/* 分类网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/${locale}/games/category/${category.slug}`}
            className="group p-6 bg-card border border-border rounded-lg hover:shadow-lg hover:border-primary transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {category.icon && <span className="text-4xl">{category.icon}</span>}
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.gameCount} {t.games}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
