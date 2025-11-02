import { getMainCategories, getAllCategoriesFullData, getSubCategoriesCount } from "@/lib/data"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { CategorySearch } from "@/components/site/CategorySearch"

interface CategoriesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  // 获取统计数据用于元数据
  const [mainCategories, totalSubCategories] = await Promise.all([
    getMainCategories(locale),
    getSubCategoriesCount(locale),
  ])

  const totalCategories = mainCategories.length + totalSubCategories
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    title: `${t("allCategories")} - ${totalCategories}+ ${t("gameTypes")} - ${t("siteName")}`,
    description: `浏览 RunGame 的所有游戏分类，包含 ${mainCategories.length} 大主分类和 ${totalSubCategories}+ 细分类别。找到你喜欢的游戏类型，免费在线玩。`,
    keywords: "游戏分类,游戏类型,在线游戏,免费游戏,动作游戏,益智游戏,跑酷游戏",
    openGraph: {
      title: `${t("allCategories")} - ${totalCategories}+ 游戏类型`,
      description: `探索 ${mainCategories.length} 大主分类和 ${totalSubCategories}+ 子分类`,
      url: `${siteUrl}/${locale}/category`,
      type: 'website',
    },
  }
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params
  const mainCategories = await getMainCategories(locale)
  const t = await getTranslations({ locale, namespace: "common" })

  // 为每个主分类获取子分类（需要获取完整数据以获得 id）
  const allCategories = await getAllCategoriesFullData(locale)
  const categoriesWithSubs = mainCategories.map((mainCat) => {
    const fullMainCat = allCategories.find(c => c.slug === mainCat.slug)
    const subCategories = allCategories.filter(c => c.parentId === fullMainCat?.id)
    return {
      ...mainCat,
      subCategories
    }
  })

  // 生成结构化数据（ItemList Schema）
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": t("allCategories"),
    "description": t("browseCategoriesDescription"),
    "numberOfItems": categoriesWithSubs.reduce((total, main) => total + 1 + main.subCategories.length, 0),
    "itemListElement": categoriesWithSubs.flatMap((main, mainIndex) => [
      {
        "@type": "ListItem",
        "position": mainIndex * 100 + 1,
        "name": main.name,
        "url": `${siteUrl}/${locale}/category/${main.slug}`,
        "item": {
          "@type": "Thing",
          "name": main.name,
          "url": `${siteUrl}/${locale}/category/${main.slug}`,
        }
      },
      ...main.subCategories.map((sub, subIndex) => ({
        "@type": "ListItem",
        "position": mainIndex * 100 + subIndex + 2,
        "name": `${main.name} - ${sub.name}`,
        "url": `${siteUrl}/${locale}/category/${sub.slug}`,
        "item": {
          "@type": "Thing",
          "name": sub.name,
          "url": `${siteUrl}/${locale}/category/${sub.slug}`,
        }
      }))
    ])
  }

  return (
    <div className="space-y-8">
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t("home")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t("allCategories")}</span>
      </nav>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("allCategories")}</h1>
        <p className="text-muted-foreground">{t("browseCategoriesDescription")}</p>
      </div>

      {/* 客户端搜索组件 */}
      <CategorySearch
        categories={categoriesWithSubs}
        locale={locale}
        translations={{
          search: t("search"),
          searchPlaceholder: t("searchCategoriesPlaceholder"),
          noResults: t("noResults"),
          games: t("games"),
          viewAll: t("viewAll"),
          clearSearch: t("clearSearch"),
        }}
      />
    </div>
  )
}
