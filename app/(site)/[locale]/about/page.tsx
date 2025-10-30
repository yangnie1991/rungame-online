import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo-helpers"

interface AboutPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })

  return generateSEOMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    path: `/about`,
    type: 'website',
  })
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
