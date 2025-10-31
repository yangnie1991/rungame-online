import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"

interface AboutPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })
  const siteUrl = getSiteUrl()

  const title = t("metaTitle")
  const description = t("metaDescription")
  const path = `/about`

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

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })
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
          <span className="text-4xl md:text-5xl">ℹ️</span>
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 内容 */}
      <article className="space-y-8">
        {/* Who We Are */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("whoWeAre.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("whoWeAre.content")}
          </p>
        </section>

        {/* Our Mission */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("mission.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("mission.content")}
          </p>
        </section>

        {/* What We Offer */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("offer.title")}
          </h2>
          <ul className="space-y-3">
            {["instantPlay", "free", "diverse", "mobile", "updates", "safe"].map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <div>
                  <strong className="font-semibold">
                    {t(`offer.items.${key}.label`)}:
                  </strong>{" "}
                  <span>{t(`offer.items.${key}.text`)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Our Values */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("values.title")}
          </h2>
          <div className="space-y-4">
            {["accessibility", "quality", "community", "innovation", "safety"].map((key) => (
              <div key={key}>
                <p>
                  <strong className="font-semibold">{t(`values.items.${key}.label`)}:</strong>{" "}
                  {t(`values.items.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose RunGame */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("whyChoose.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("whyChoose.content")}
          </p>
        </section>

        {/* Join Our Community */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("community.title")}
          </h2>
          <p className="text-base leading-relaxed mb-4">
            {t("community.content")}
          </p>
          <p className="text-base leading-relaxed font-medium">
            {t("community.thanks")}
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
