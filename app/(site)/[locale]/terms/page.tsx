import { getTranslations } from "next-intl/server"
import Link from "next/link"
import type { Metadata } from "next"

interface TermsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
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
      </div>

      {/* 内容 */}
      <article className="bg-card rounded-lg border border-border shadow-sm">
        <div
          className="p-6 md:p-8 lg:p-10 prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground prose-p:mb-4
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-foreground prose-li:mb-2"
          dangerouslySetInnerHTML={{ __html: t.raw("content") }}
        />
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
