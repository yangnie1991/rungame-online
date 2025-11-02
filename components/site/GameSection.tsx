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
  mainCategory?: {
    slug: string
  }
  tags?: Array<{ name: string }>
}

interface GameSectionProps {
  title: string
  icon?: string
  subtitle?: string  // 桌面端简短副标题
  subtitleDetailed?: string  // 移动端详细副标题
  games: Game[]
  viewAllLink?: string
  locale: string
  showTitle?: boolean
  viewAllText?: string
  // 新增：传递给 GameCard 的配置
  enableCategoryLink?: boolean
  enableTagLinks?: boolean
}

export function GameSection({
  title,
  icon,
  subtitle,
  subtitleDetailed,
  games,
  viewAllLink,
  locale,
  showTitle = true,
  viewAllText,
  enableCategoryLink,
  enableTagLinks,
}: GameSectionProps) {
  return (
    <section className="mb-8">
      {showTitle && (
        <div className="mb-4">
          <div className="flex items-start md:items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground">
              {icon && <span className="text-2xl mr-2">{icon}</span>}
              <span className="inline md:mr-3">{title}</span>
              {/* 桌面端：同行副标题 */}
              {subtitle && (
                <span className="hidden md:inline text-base font-normal text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </h2>
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="flex-shrink-0 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {viewAllText || (locale === 'zh' ? '查看全部' : 'View All')} →
              </Link>
            )}
          </div>
          {/* 移动端：换行副标题 */}
          {subtitleDetailed && (
            <p className="block md:hidden text-sm text-muted-foreground">
              {subtitleDetailed}
            </p>
          )}
        </div>
      )}

      {/* Responsive grid layout - optimized for large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {games && games.length > 0 ? (
          games.map((game) => (
            <GameCard
              key={game.slug}
              slug={game.slug}
              thumbnail={game.thumbnail}
              title={game.title}
              description={game.description}
              categoryName={game.category?.name}
              categorySlug={game.category?.slug}
              mainCategorySlug={game.mainCategory?.slug}
              tags={game.tags?.map((tag) => tag.name)}
              locale={locale}
              enableCategoryLink={enableCategoryLink}
              enableTagLinks={enableTagLinks}
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
