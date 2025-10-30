import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo-helpers"

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })

  return generateSEOMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    path: `/contact`,
    type: 'website',
  })
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })
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
          <span className="text-4xl md:text-5xl">📧</span>
          {t("title")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 内容区域 */}
      <article className="space-y-8">
        {/* Introduction */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("intro.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("intro.content")}
          </p>
        </section>

        {/* How to Reach Us */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("howToReach.title")}
          </h2>

          <div className="space-y-6">
            {/* Email Section */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span>📧</span>
                {t("howToReach.email.title")}
              </h3>
              <div className="space-y-2 pl-6">
                <div>
                  <span className="font-semibold">{t("howToReach.email.general.label")}:</span>{" "}
                  <a href={`mailto:${t("howToReach.email.general.email")}`} className="text-primary hover:underline">
                    {t("howToReach.email.general.email")}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">{t("howToReach.email.business.label")}:</span>{" "}
                  <a href={`mailto:${t("howToReach.email.business.email")}`} className="text-primary hover:underline">
                    {t("howToReach.email.business.email")}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">{t("howToReach.email.support.label")}:</span>{" "}
                  <a href={`mailto:${t("howToReach.email.support.email")}`} className="text-primary hover:underline">
                    {t("howToReach.email.support.email")}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">{t("howToReach.email.privacy.label")}:</span>{" "}
                  <a href={`mailto:${t("howToReach.email.privacy.email")}`} className="text-primary hover:underline">
                    {t("howToReach.email.privacy.email")}
                  </a>
                </div>
              </div>
            </div>

            {/* Game Submissions */}
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span>🎮</span>
                {t("howToReach.gameSubmissions.title")}
              </h3>
              <p className="text-base leading-relaxed pl-6">
                {t("howToReach.gameSubmissions.content")}
              </p>
            </div>

            {/* Partnership Opportunities */}
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span>💼</span>
                {t("howToReach.partnerships.title")}
              </h3>
              <p className="text-base leading-relaxed pl-6">
                {t("howToReach.partnerships.content")}
              </p>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span>🌐</span>
                {t("howToReach.social.title")}
              </h3>
              <p className="text-base mb-2 pl-6">{t("howToReach.social.content")}</p>
              <ul className="space-y-1 pl-6">
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("howToReach.social.twitter")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("howToReach.social.facebook")}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Response Time */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("responseTime.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("responseTime.content")}
          </p>
        </section>

        {/* Feedback & Suggestions */}
        <section className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 border-b border-border pb-3">
            {t("feedback.title")}
          </h2>
          <p className="text-base leading-relaxed">
            {t("feedback.content")}
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
