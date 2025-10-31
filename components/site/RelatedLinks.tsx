import { Link } from "@/i18n/routing"

interface Category {
  name: string
  slug: string
  icon?: string
  gameCount: number
}

interface Tag {
  name: string
  slug: string
  icon?: string
}

interface RelatedLinksProps {
  locale: string
  title?: string
  categories?: Category[]
  tags?: Tag[]
  showAllGamesLink?: boolean
}

export function RelatedLinks({
  locale,
  title,
  categories = [],
  tags = [],
  showAllGamesLink = true,
}: RelatedLinksProps) {
  if (categories.length === 0 && tags.length === 0) {
    return null
  }

  const defaultTitle = locale === 'zh' ? '浏览更多游戏' : 'Browse More Games'

  return (
    <section className="mt-12 py-8 border-t">
      <h2 className="text-2xl font-bold mb-6">{title || defaultTitle}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories Section */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span>
              {locale === 'zh' ? '热门分类' : 'Popular Categories'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary bg-card hover:bg-accent transition-all"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {category.icon || '🎮'}
                  </span>
                  <span className="text-sm font-medium text-center group-hover:text-primary transition-colors line-clamp-1">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.gameCount} {locale === 'zh' ? '游戏' : 'games'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🏷️</span>
              {locale === 'zh' ? '热门标签' : 'Popular Tags'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary bg-card hover:bg-accent text-sm transition-all"
                >
                  {tag.icon && <span className="text-base">{tag.icon}</span>}
                  <span>{tag.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Games Link */}
      {showAllGamesLink && (
        <div className="mt-8 text-center">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            {locale === 'zh' ? '浏览所有游戏' : 'Browse All Games'} →
          </Link>
        </div>
      )}
    </section>
  )
}
