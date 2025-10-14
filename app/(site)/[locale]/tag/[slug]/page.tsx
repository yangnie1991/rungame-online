import { notFound } from "next/navigation"
import { getGamesByTag } from "../../../actions"
import { GameCard } from "@/components/site/GameCard"
import Link from "next/link"
import type { Metadata } from "next"

interface TagPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const tag = await getGamesByTag(slug, locale)

  if (!tag) {
    return {
      title: "Tag Not Found",
    }
  }

  return {
    title: `${tag.name} Games - RunGame`,
    description: tag.description || `Browse all games tagged with ${tag.name}`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, slug } = await params
  const tag = await getGamesByTag(slug, locale)

  if (!tag) {
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
        <span>Tags</span>
        <span>/</span>
        <span>{tag.name}</span>
      </div>

      {/* Tag Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {tag.icon && <span className="text-5xl">{tag.icon}</span>}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">#{tag.name}</h1>
            <p className="text-muted-foreground mt-1">
              {tag.games.length} game{tag.games.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {tag.description && (
          <p className="text-lg text-muted-foreground max-w-3xl">{tag.description}</p>
        )}
      </div>

      {/* Games Grid */}
      {tag.games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No games with this tag yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tag.games.map((game) => (
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
