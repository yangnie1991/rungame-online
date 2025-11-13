import { getFeaturedGames, getMostPlayedGames, getNewestGames, getTrendingGames } from "@/lib/data"
import { getAllCategoriesFullData } from "@/lib/data/categories/cache"
import { getPopularTags } from "@/lib/data/tags"
import { GameSection } from "@/components/site/GameSection"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"
import {
  generateWebSiteSchema,
  generateGameListSchema,
  renderJsonLd
} from "@/lib/schema-generators"

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params

  const siteUrl = getSiteUrl()
  const t = await getTranslations({ locale, namespace: "metadata" })

  // 使用翻译文件中的元数据
  const title = t("homeTitle")
  const description = t("homeDescription")

  // Keywords for homepage
  const keywordsTemplates: Record<string, string[]> = {
    en: [
      'free online games',
      'play games online',
      'browser games',
      'HTML5 games',
      'no download games',
      'instant play games',
      'RunGame',
      'online gaming platform',
    ],
    zh: [
      '免费在线游戏',
      '在线玩游戏',
      '浏览器游戏',
      'HTML5游戏',
      '无需下载游戏',
      '即时游戏',
      'RunGame',
      '在线游戏平台',
    ],
  }

  const keywords = (keywordsTemplates[locale] || keywordsTemplates.en).join(', ')

  // Open Graph locale 映射
  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  // 使用 absolute title 来完全覆盖 layout template，避免添加 | RunGame
  return {
    title: {
      absolute: title  // 完全覆盖，不应用 template
    },
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'website',
      images: [{
        url: `${siteUrl}/assets/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'RunGame',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/assets/images/og-image.png`],
      creator: '@rungame',
      site: '@rungame',
    },
    alternates: {
      // 首页canonical: 所有语言都不带尾部斜杠
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}`,
      languages: generateAlternateLanguages('/'),
    },
  }
}

// ISR 模式：在 Vercel Edge 缓存 30 分钟，平衡性能和数据新鲜度
// 首页包含最新游戏和统计数据，30分钟是合理的更新频率
export const revalidate = 1800 // 30分钟

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  // 并行获取所有数据（游戏数据 + 分类 + 标签）
  // 分类和标签数据会被缓存，后续页面可以直接使用
  const [featuredGames, mostPlayedGames, newestGames, trendingGames, allCategories, popularTags] = await Promise.all([
    getFeaturedGames(locale, 18),
    getMostPlayedGames(locale, 12),
    getNewestGames(locale, 12),
    getTrendingGames(locale, 12),
    // 获取分类数据（用于展示热门分类）
    getAllCategoriesFullData(locale),
    // 获取热门标签（前10个）
    getPopularTags(locale, 10),
  ])

  // 获取翻译文本
  const t = await getTranslations({ locale, namespace: "home" })

  // 将游戏转换为GameSection需要的格式
  const formatGames = (games: typeof featuredGames) =>
    games.map((game) => ({
      slug: game.slug,
      thumbnail: game.thumbnail,
      title: game.title,
      description: game.description,
      category: game.categoryName && game.categorySlug
        ? {
            name: game.categoryName,
            slug: game.categorySlug,
          }
        : undefined,
      mainCategory: game.mainCategorySlug
        ? {
            slug: game.mainCategorySlug,
          }
        : undefined,
      tags: game.tags?.map((tag) => ({ name: tag.name })),
    }))

  // 筛选热门主分类（只显示主分类，按游戏数量排序，取前6个）
  const popularCategories = allCategories
    .filter(cat => cat.parentId === null) // 只取主分类
    .sort((a, b) => b.gameCount - a.gameCount) // 按游戏数量降序
    .slice(0, 6) // 取前6个分类，优化SEO内链数量

  // WebSite Schema
  const websiteSchema = generateWebSiteSchema(locale)

  // 游戏列表 Schema (精选游戏) - 使用原始数据，不经过 formatGames 转换
  const gameListSchema = generateGameListSchema(
    featuredGames.slice(0, 10).map(game => ({
      name: game.title,
      url: `${locale === 'en' ? '' : `/${locale}`}/play/${game.slug}`,
      image: game.thumbnail,
      playCount: (game as any).playCount || 0,
      rating: (game as any).rating || 0,
    })),
    locale === 'zh' ? '精选游戏' : 'Featured Games',
    locale === 'en' ? '/' : `/${locale}/`
  )

  return (
    <>
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(gameListSchema) }}
      />

      {/* 站点介绍区块 - 头部 */}
      <section className="mb-8 text-center bg-gradient-to-b from-primary/5 to-transparent py-10 px-6 rounded-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {locale === 'zh'
            ? 'RunGame - 免费在线游戏平台'
            : 'RunGame - Free Online Games Platform'}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
          {locale === 'zh'
            ? '探索上千款免费在线游戏，涵盖动作、冒险、益智、射击等多个分类。无需下载，即刻畅玩！浏览我们的精选游戏、最热门游戏和最新游戏，发现你的下一个最爱。'
            : 'Explore thousands of free online games across action, adventure, puzzle, shooting and more categories. No downloads required, play instantly! Browse our featured games, most played titles, and newest releases to discover your next favorite.'}
        </p>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link
            href="/games"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            {locale === 'zh' ? '浏览所有游戏' : 'Browse All Games'} →
          </Link>
          <Link
            href="/category"
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 font-medium transition-all text-sm sm:text-base"
          >
            {locale === 'zh' ? '按分类浏览' : 'Browse by Category'}
          </Link>
          <Link
            href="/tag"
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 font-medium transition-all text-sm sm:text-base"
          >
            {locale === 'zh' ? '按标签浏览' : 'Browse by Tag'}
          </Link>
        </div>
      </section>

      {/* Featured Games Section */}
      <GameSection
        title={t("featured")}
        subtitle={locale === 'zh' ? '精选优质游戏' : 'Curated Quality Games'}
        subtitleDetailed={locale === 'zh' ? '编辑精心挑选，确保每款都值得一玩' : 'Handpicked by our editors, ensuring every game is worth playing'}
        icon="⭐"
        games={formatGames(featuredGames)}
        viewAllLink="/collection/featured"
        locale={locale}
        enableCategoryLink={false}
        enableTagLinks={false}
      />

      {/* Most Played Games Section */}
      <GameSection
        title={t("mostPlayed")}
        subtitle={locale === 'zh' ? '最受欢迎游戏' : 'Most Popular Games'}
        subtitleDetailed={locale === 'zh' ? '千万玩家的共同选择' : 'The choice of millions of players'}
        icon="🔥"
        games={formatGames(mostPlayedGames)}
        viewAllLink="/collection/most-played"
        locale={locale}
        enableCategoryLink={false}
        enableTagLinks={false}
      />

      {/* Newest Games Section */}
      <GameSection
        title={t("newest")}
        subtitle={locale === 'zh' ? '最新上线游戏' : 'Latest Releases'}
        subtitleDetailed={locale === 'zh' ? '抢先体验新鲜玩法' : 'Be the first to try new gameplay'}
        icon="🆕"
        games={formatGames(newestGames)}
        viewAllLink="/collection/new-games"
        locale={locale}
        enableCategoryLink={false}
        enableTagLinks={false}
      />

      {/* Trending Games Section */}
      <GameSection
        title={t("trending")}
        subtitle={locale === 'zh' ? '当前热门游戏' : 'Currently Trending'}
        subtitleDetailed={locale === 'zh' ? '人气飙升正在火热' : 'Rising popularity, hot right now'}
        icon="📈"
        games={formatGames(trendingGames)}
        viewAllLink="/collection/trending"
        locale={locale}
        enableCategoryLink={false}
        enableTagLinks={false}
      />

      {/* 热门分类区块 */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl">🎯</span>
              <span>{locale === 'zh' ? '热门分类' : 'Popular Categories'}</span>
              {/* 桌面端：同行副标题 */}
              <span className="hidden md:inline text-base font-normal text-muted-foreground">
                {locale === 'zh' ? '热门游戏分类' : 'Popular Game Categories'}
              </span>
            </h2>
            {/* 移动端：换行副标题 */}
            <p className="block md:hidden text-sm text-muted-foreground mt-1">
              {locale === 'zh' ? '快速找到你喜欢的游戏类型' : 'Quickly find your favorite game types'}
            </p>
          </div>
          <Link
            href="/category"
            className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {locale === 'zh' ? '查看全部' : 'View All'} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {popularCategories.map(category => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary bg-card hover:bg-accent transition-all hover:shadow-md"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {category.icon || '🎮'}
              </span>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category.gameCount} {locale === 'zh' ? '游戏' : 'games'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门标签区块 */}
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl">🏷️</span>
              <span>{locale === 'zh' ? '热门标签' : 'Popular Tags'}</span>
              {/* 桌面端：同行副标题 */}
              <span className="hidden md:inline text-base font-normal text-muted-foreground">
                {locale === 'zh' ? '热门游戏标签' : 'Popular Game Tags'}
              </span>
            </h2>
            {/* 移动端：换行副标题 */}
            <p className="block md:hidden text-sm text-muted-foreground mt-1">
              {locale === 'zh' ? '通过标签发现相似游戏，一键直达' : 'Discover similar games through tags, one click away'}
            </p>
          </div>
          <Link
            href="/tag"
            className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {locale === 'zh' ? '查看全部' : 'View All'} →
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {popularTags.map(tag => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border hover:border-primary bg-card hover:bg-accent transition-all hover:shadow-md"
            >
              <span className="font-medium group-hover:text-primary transition-colors text-sm sm:text-base">
                #{tag.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({tag.gameCount})
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 详细游戏说明区块 */}
      <section className="mt-12 mb-8 bg-gradient-to-br from-card via-card to-primary/5 rounded-xl p-6 sm:p-8 border border-border shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center">
          <span className="text-2xl mr-3">📖</span>
          {locale === 'zh' ? '关于 RunGame' : 'About RunGame'}
        </h2>

        <div className="space-y-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
          <p>
            {locale === 'zh'
              ? 'RunGame 是一个提供免费在线游戏的平台，致力于为全球玩家提供高质量、无需下载的游戏体验。我们精心挑选并整理了上千款游戏，涵盖动作、冒险、益智、射击、体育、竞速等多个分类。'
              : 'RunGame is a platform that offers free online games, dedicated to providing players worldwide with high-quality, no-download gaming experiences. We have carefully selected and organized thousands of games across action, adventure, puzzle, shooting, sports, racing, and many other categories.'}
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-3">
            {locale === 'zh' ? '为什么选择 RunGame？' : 'Why Choose RunGame?'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">🎮</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '无需下载' : 'No Downloads Required'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '所有游戏都可以直接在浏览器中运行，无需安装任何软件。'
                    : 'All games run directly in your browser without installing any software.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">🆓</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '完全免费' : 'Completely Free'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '所有游戏都可以免费畅玩，没有隐藏费用。'
                    : 'All games are free to play with no hidden costs.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">🌍</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '多语言支持' : 'Multilingual Support'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '支持中文、英文、西班牙文、法文等多种语言。'
                    : 'Available in Chinese, English, Spanish, French, and more.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">📱</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '跨平台兼容' : 'Cross-Platform Compatible'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '支持电脑、平板、手机等多种设备。'
                    : 'Works on computers, tablets, smartphones, and more.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">🎯</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '精选内容' : 'Curated Content'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '我们的团队会定期更新和推荐高质量游戏。'
                    : 'Our team regularly updates and recommends high-quality games.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
              <span className="flex-shrink-0 text-xl">🚫</span>
              <div>
                <strong className="text-foreground">{locale === 'zh' ? '无需注册' : 'No Registration Required'}</strong>
                <p className="text-sm mt-1">
                  {locale === 'zh'
                    ? '直接开始游戏，无需创建账户。'
                    : 'Start playing immediately without creating an account.'}
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-3">
            {locale === 'zh' ? '如何开始？' : 'How to Get Started?'}
          </h3>

          <p>
            {locale === 'zh'
              ? '浏览我们的游戏分类，找到你感兴趣的游戏类型。点击游戏卡片即可立即开始游戏。你也可以使用顶部的搜索功能快速找到特定游戏，或者通过标签发现相似游戏。'
              : 'Browse our game categories to find the types of games you\'re interested in. Click on any game card to start playing immediately. You can also use the search function at the top to quickly find specific games, or discover similar games through tags.'}
          </p>

          <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3 sm:gap-4">
            <Link href="/about" className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base inline-flex items-center gap-1 transition-all hover:gap-2">
              {locale === 'zh' ? '了解更多关于我们' : 'Learn More About Us'} →
            </Link>
            <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base inline-flex items-center gap-1 transition-all hover:gap-2">
              {locale === 'zh' ? '隐私政策' : 'Privacy Policy'} →
            </Link>
            <Link href="/contact" className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base inline-flex items-center gap-1 transition-all hover:gap-2">
              {locale === 'zh' ? '联系我们' : 'Contact Us'} →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
