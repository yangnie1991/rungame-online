import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { getSiteUrl, generateAlternateLanguages } from "@/lib/seo-helpers"

interface TermsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })
  const siteUrl = getSiteUrl()

  const title = t("metaTitle")
  const description = t("metaDescription")
  const path = `/terms`

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

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })
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
          <span className="text-4xl md:text-5xl">📜</span>
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm text-muted-foreground italic">{t("lastUpdated")}</p>
      </div>

      {/* 内容区域 */}
      <article className="space-y-8">
        {/* Agreement to Terms */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("agreement.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("agreement.content")}
          </p>
        </section>

        {/* Use License */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("license.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("license.content")}
          </p>
        </section>

        {/* Acceptable Use */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("acceptableUse.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("acceptableUse.content")}
          </p>
        </section>

        {/* Third-Party Games */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("thirdPartyGames.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("thirdPartyGames.content")}
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("intellectualProperty.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("intellectualProperty.content")}
          </p>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("disclaimer.title")}
          </h2>
          <p className="text-base leading-relaxed font-mono text-sm bg-muted p-4 rounded">
            {t("disclaimer.content")}
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("limitation.title")}
          </h2>
          <p className="text-base leading-relaxed font-mono text-sm bg-muted p-4 rounded">
            {t("limitation.content")}
          </p>
        </section>

        {/* Advertising */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("advertising.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("advertising.content")}
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("changes.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("changes.content")}
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

      {/* 返回首页 */}
      <div className="pt-8 border-t border-border">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>←</span>
          <span>{common("home")}</span>
        </Link>
      </div>
    </div>
  )
}
