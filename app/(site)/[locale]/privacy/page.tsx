import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"

interface PrivacyPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })
  const siteUrl = getSiteUrl()

  const title = t("metaTitle")
  const description = t("metaDescription")
  const path = `/privacy`

  const ogLocaleMap: Record<string, string> = {
    'zh': 'zh_CN',
    'en': 'en_US',
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: 'RunGame',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'website',
      images: [{
        url: `${siteUrl}/assets/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: title,
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
      canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      languages: generateAlternateLanguages(path),
    },
  }
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })
  const common = await getTranslations({ locale, namespace: "common" })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          {common("home")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t("title")}</span>
      </nav>

      {/* 页面标题 */}
      <div className="space-y-3 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-3">
          <span className="text-4xl md:text-5xl">🔒</span>
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm text-muted-foreground italic">{t("lastUpdated")}</p>
      </div>

      {/* 内容区域 */}
      <article className="space-y-8">
        {/* Introduction */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("introduction.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("introduction.content")}
          </p>
        </section>

        {/* Information We Collect */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("informationWeCollect.title")}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("informationWeCollect.automaticInfo.title")}
              </h3>
              <p className="text-base leading-relaxed">
                {t("informationWeCollect.automaticInfo.content")}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("informationWeCollect.cookies.title")}
              </h3>
              <p className="text-base leading-relaxed">
                {t("informationWeCollect.cookies.content")}
              </p>
            </div>
          </div>
        </section>

        {/* Google AdSense */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("advertising.title")}
          </h2>
          <p className="text-base leading-relaxed mb-4">
            {t("advertising.intro")}
          </p>
          <div>
            <p className="font-semibold mb-2">{t("advertising.googleUse.title")}</p>
            <ul className="space-y-2">
              {t.raw("advertising.googleUse.items").map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Google Analytics */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("analytics.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("analytics.content")}
          </p>
        </section>

        {/* How We Use */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("howWeUse.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("howWeUse.content")}
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("childrenPrivacy.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("childrenPrivacy.content")}
          </p>
        </section>

        {/* Your Rights */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("yourRights.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("yourRights.content")}
          </p>
        </section>

        {/* Contact */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("contact.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("contact.content")}
          </p>
        </section>
      </article>

      {/* CTA 区域 */}
      <div className="pt-8 border-t border-border">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold">
            {locale === 'zh' ? '准备好开始游戏了吗？' : 'Ready to Start Playing?'}
          </h3>
          <p className="text-muted-foreground">
            {locale === 'zh'
              ? '探索我们精心挑选的游戏库，立即开始畅玩！'
              : 'Explore our curated collection of games and start playing now!'}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              {locale === 'zh' ? '浏览所有游戏' : 'Browse All Games'} →
            </Link>
            <Link
              href="/category"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border-2 border-border rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              {locale === 'zh' ? '按分类浏览' : 'Browse by Category'}
            </Link>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>←</span>
            <span>{common("home")}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
