import { notFound } from "next/navigation"
import { getGamesByCategory } from "../../../actions"
import { GameCard } from "@/components/site/GameCard"
import Link from "next/link"
import type { Metadata } from "next"

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const category = await getGamesByCategory(slug, locale)

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `${category.name} Games - RunGame`,
    description: category.description || `Browse all ${category.name} games`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params
  const category = await getGamesByCategory(slug, locale)

  if (!category) {
    notFound()
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-primary">
          Home
        </Link>
        <span>/</span>
        <span>Categories</span>
        <span>/</span>
        <span>{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {category.icon && <span className="text-5xl">{category.icon}</span>}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground mt-1">
              {category.games.length} game{category.games.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {category.description && (
          <p className="text-lg text-muted-foreground max-w-3xl">{category.description}</p>
        )}
      </div>

      {/* Games Grid */}
      {category.games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No games available in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {category.games.map((game) => (
            <GameCard
              key={game.id}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              playCount={game.playCount}
              rating={game.rating}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
