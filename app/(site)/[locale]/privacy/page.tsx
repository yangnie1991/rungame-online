import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo-helpers"

interface PrivacyPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "privacy" })

  return generateSEOMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    path: `/privacy`,
    type: 'website',
  })
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
