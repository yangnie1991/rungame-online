import { getAllTags } from "@/lib/data/tags"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { getTranslations } from "next-intl/server"
import { TagSearch } from "@/components/site/TagSearch"
import { generateAlternateLanguages } from "@/lib/seo-helpers"

interface AllTagsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AllTagsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })
  const tags = await getAllTags(locale)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  // 根据语言生成描述和关键词
  const descriptions = {
    zh: `浏览 RunGame 的所有游戏标签，包含 ${tags.length} 个特色标签。按游戏特点查找你喜欢的游戏，免费在线玩。`,
    en: `Browse all game tags on RunGame, featuring ${tags.length} distinct tags. Find games by characteristics and features, play for free online.`,
  }

  const keywords = {
    zh: "游戏标签,游戏特点,在线游戏,免费游戏,多人游戏,单人游戏,3D游戏",
    en: "game tags, game features, online games, free games, multiplayer games, single player games, 3D games",
  }

  const ogDescriptions = {
    zh: `探索 ${tags.length} 个游戏标签，按特点查找游戏`,
    en: `Explore ${tags.length} game tags, find games by features`,
  }

  const description = descriptions[locale as 'zh' | 'en'] || descriptions.en
  const keyword = keywords[locale as 'zh' | 'en'] || keywords.en
  const ogDescription = ogDescriptions[locale as 'zh' | 'en'] || ogDescriptions.en

  return {
    title: `${t("allTags")} - ${tags.length}+ ${t("gameTags")} - ${t("siteName")}`,
    description,
    keywords: keyword,
    openGraph: {
      title: `${t("allTags")} - ${tags.length}+ ${locale === 'zh' ? '游戏标签' : 'Game Tags'}`,
      description: ogDescription,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/tag`,
      type: 'website',
    },
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/tag`,
      languages: generateAlternateLanguages('/tag'),
    },
  }
}

export default async function AllTagsPage({ params }: AllTagsPageProps) {
  const { locale } = await params
  const tags = await getAllTags(locale)
  const t = await getTranslations({ locale, namespace: "common" })

  // 生成结构化数据（ItemList Schema）
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": t("allTags"),
    "description": t("browseTagsDescription"),
    "numberOfItems": tags.length,
    "itemListElement": tags.map((tag, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Thing",
        "name": tag.name,
        "url": `${siteUrl}${locale === 'en' ? '' : `/${locale}`}/tag/${tag.slug}`,
      }
    }))
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
        <span className="text-foreground">{t("allTags")}</span>
      </nav>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("allTags")}</h1>
        <p className="text-muted-foreground">{t("browseTagsDescription")}</p>
      </div>

      {/* 客户端搜索组件 */}
      <TagSearch
        tags={tags}
        locale={locale}
        translations={{
          search: t("search"),
          searchPlaceholder: t("searchTagsPlaceholder"),
          noResults: t("noResults"),
          games: t("games"),
          clearSearch: t("clearSearch"),
        }}
      />
    </div>
  )
}
