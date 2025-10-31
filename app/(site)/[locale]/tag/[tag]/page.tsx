import { getGamesByTagWithPagination, getAllTagsInfoMap } from "@/lib/data"
import { GameSection } from "@/components/site/GameSection"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Link } from "@/i18n/routing"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import { generateTagOGImageUrl } from "@/lib/og-image-helpers"
import {
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params

  // 只获取标签信息，不查询游戏列表（避免重复查询）
  const tagsMap = await getAllTagsInfoMap(locale)
  const tagInfo = tagsMap[tag]

  if (!tagInfo) {
    return {
      title: "Tag Not Found",
    }
  }

  const siteUrl = getSiteUrl()

  // 构建 SEO 友好的标题和描述
  const titleTemplates: Record<string, string> = {
    en: `${tagInfo.name} Games - Play Free Online`,
    zh: `${tagInfo.name}游戏 - 免费在线玩`,
  }

  const descriptionTemplates: Record<string, string> = {
    en: `Discover ${tagInfo.gameCount}+ free ${tagInfo.name.toLowerCase()} games on RunGame. Enjoy instant play with no downloads required.`,
    zh: `在 RunGame 上发现 ${tagInfo.gameCount}+ 款免费${tagInfo.name}游戏。无需下载即可畅玩。`,
  }

  const keywordsTemplates: Record<string, string[]> = {
    en: [
      tagInfo.name,
      `${tagInfo.name} games`,
      `free ${tagInfo.name} games`,
    ],
    zh: [
      tagInfo.name,
      `${tagInfo.name}游戏`,
      `免费${tagInfo.name}游戏`,
    ],
  }

  const title = titleTemplates[locale] || titleTemplates.en
  const description = descriptionTemplates[locale] || descriptionTemplates.en
  const keywords = (keywordsTemplates[locale] || keywordsTemplates.en).join(', ')

  // 生成动态 OG 图片 URL
  const ogImageUrl = generateTagOGImageUrl({
    name: tagInfo.name,
    gameCount: tagInfo.gameCount,
    icon: '🏷️',
  })

  // 构建路径（不带语言前缀）
  const path = `/tag/${tag}`

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'website',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: tagInfo.name,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@rungame',
      site: '@rungame',
    },
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      languages: generateAlternateLanguages(path),
    },
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { locale, tag } = await params
  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  const data = await getGamesByTagWithPagination(tag, locale, page, 30)

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

  // 面包屑 Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.home, url: `/${locale}` },
    { name: data.tag.name, url: '' },
  ])

  // 标签集合 Schema
  const collectionSchema = generateCollectionPageSchema({
    name: `${data.tag.name} Games`,
    description: `Play the best ${data.tag.name} games online for free`,
    url: `/${locale}/tag/${tag}`,
    numberOfItems: data.pagination.totalGames,
  })

  return (
    <div className="space-y-6">
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(collectionSchema) }}
      />

      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
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
              href={`/tag/${tag}?page=${page - 1}`}
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
              href={`/tag/${tag}?page=${page + 1}`}
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
