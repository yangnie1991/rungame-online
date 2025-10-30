import { getMainCategories } from "@/lib/data"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import type { Metadata } from "next"

interface CategoriesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "common" })

  return {
    title: `${t("allCategories")} - ${t("siteName")}`,
    description: t("browseCategoriesDescription"),
  }
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params
  const categories = await getMainCategories(locale)
  const t = await getTranslations({ locale, namespace: "common" })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t("allCategories")}</h1>
        <p className="text-muted-foreground">{t("browseCategoriesDescription")}</p>
      </div>

      {/* 分类网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="flex flex-col items-center p-6 rounded-lg bg-card hover:bg-accent transition-colors text-center"
          >
            {category.icon && (
              <span className="text-4xl mb-3">{category.icon}</span>
            )}
            <h2 className="font-semibold mb-1">{category.name}</h2>
            <span className="text-xs text-muted-foreground">
              {category.gameCount} {t("games")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
