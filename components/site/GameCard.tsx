"use client"

import Image from "next/image"
import { Link } from "@/i18n/routing"

interface GameCardProps {
  slug: string
  thumbnail: string
  title: string
  description?: string
  categoryName?: string
  tags?: string[]
  locale: string
  showNewBadge?: boolean
}

export function GameCard({
  slug,
  thumbnail,
  title,
  description,
  categoryName,
  tags = [],
  locale,
  showNewBadge = false,
}: GameCardProps) {
  return (
    <article className="w-full bg-card rounded-lg shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 group">
      <Link href={`/games/play/${slug}`} className="block">
        <div className="relative">
          <Image
            src={thumbnail}
            alt={`${title} - Free online ${categoryName || ''} game`}
            width={300}
            height={144}
            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {/* Category Badge */}
          {categoryName && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent text-accent-foreground">
                {categoryName}
              </span>
            </div>
          )}
          {/* NEW Badge */}
          {showNewBadge && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground">
                {locale === 'zh' ? '新' : 'NEW'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
              {description}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
