"use client"

import { Link } from "@/i18n/routing"
import { GameCard } from "./GameCard"

interface Game {
  slug: string
  thumbnail: string
  title: string
  description?: string
  category?: {
    name: string
    slug: string
  }
  tags?: Array<{ name: string }>
}

interface GameSectionProps {
  title: string
  icon?: string
  games: Game[]
  viewAllLink?: string
  locale: string
  showTitle?: boolean
}

export function GameSection({ title, icon, games, viewAllLink, locale, showTitle = true }: GameSectionProps) {
  return (
    <section className="mb-8">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            {icon && <span className="text-2xl mr-3">{icon}</span>}
            {title}
          </h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View All →
            </Link>
          )}
        </div>
      )}

      {/* Responsive grid layout - optimized for large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
        {games && games.length > 0 ? (
          games.map((game) => (
            <GameCard
              key={game.slug}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              categoryName={game.category?.name}
              tags={game.tags?.map((tag) => tag.name)}
              locale={locale}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No games available in this section</p>
          </div>
        )}
      </div>
    </section>
  )
}
