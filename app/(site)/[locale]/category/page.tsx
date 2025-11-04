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

  // 根据语言生成描述和关键词
  const descriptions = {
    zh: `浏览 RunGame 的所有游戏分类，包含 ${mainCategories.length} 大主分类和 ${totalSubCategories}+ 细分类别。找到你喜欢的游戏类型，免费在线玩。`,
    en: `Browse all game categories on RunGame, featuring ${mainCategories.length} main categories and ${totalSubCategories}+ subcategories. Find your favorite game types and play for free online.`,
  }

  const keywords = {
    zh: "游戏分类,游戏类型,在线游戏,免费游戏,动作游戏,益智游戏,跑酷游戏",
    en: "game categories, game types, online games, free games, action games, puzzle games, racing games",
  }

  const ogDescriptions = {
    zh: `探索 ${mainCategories.length} 大主分类和 ${totalSubCategories}+ 子分类`,
    en: `Explore ${mainCategories.length} main categories and ${totalSubCategories}+ subcategories`,
  }

  const description = descriptions[locale as 'zh' | 'en'] || descriptions.en
  const keyword = keywords[locale as 'zh' | 'en'] || keywords.en
  const ogDescription = ogDescriptions[locale as 'zh' | 'en'] || ogDescriptions.en

  return {
    title: `${t("allCategories")} - ${totalCategories}+ ${t("gameTypes")} - ${t("siteName")}`,
    description,
    keywords: keyword,
    openGraph: {
      title: `${t("allCategories")} - ${totalCategories}+ ${locale === 'zh' ? '游戏类型' : 'Game Types'}`,
      description: ogDescription,
      url: `${siteUrl}/${locale === 'en' ? '' : locale + '/'}category`,
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
        "item": {
          "@type": "Thing",
          "name": main.name,
          "url": `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/category/${main.slug}`,
        }
      },
      ...main.subCategories.map((sub, subIndex) => ({
        "@type": "ListItem",
        "position": mainIndex * 100 + subIndex + 2,
        "item": {
          "@type": "Thing",
          "name": sub.name,
          "url": `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/category/${main.slug}/${sub.slug}`,
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
