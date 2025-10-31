"use client"

import Image from "next/image"
import { Link } from "@/i18n/routing"

interface GameCardProps {
  slug: string
  thumbnail: string
  title: string
  description?: string
  categoryName?: string
  categorySlug?: string
  mainCategorySlug?: string
  tags?: (string | { name: string; slug?: string })[]
  locale: string
  showNewBadge?: boolean
  // 新增：链接配置
  enableCategoryLink?: boolean  // 是否启用分类链接（默认 true）
  enableTagLinks?: boolean      // 是否启用标签链接（默认 true）
}

export function GameCard({
  slug,
  thumbnail,
  title,
  description,
  categoryName,
  categorySlug,
  mainCategorySlug,
  tags = [],
  locale,
  showNewBadge = false,
  enableCategoryLink = true,  // 默认启用
  enableTagLinks = true,      // 默认启用
}: GameCardProps) {
  // 构建分类链接 URL
  const categoryUrl = categorySlug && mainCategorySlug
    ? `/category/${mainCategorySlug}/${categorySlug}`
    : categorySlug
    ? `/category/${categorySlug}`
    : undefined

  return (
    <article className="relative w-full bg-card rounded-lg shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 group">
      {/* Card Overlay Link - 整个卡片的点击区域 */}
      <Link
        href={`/play/${slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Play ${title}`}
      >
        <span className="sr-only">Play {title}</span>
      </Link>

      {/* Card Content - 内容层 */}
      <div className="relative z-10 pointer-events-none">
        <div className="relative">
          <Image
            src={thumbnail}
            alt={`Play ${title}${categoryName ? ` - ${categoryName} game` : ''} online for free on RunGame | No download required`}
            width={300}
            height={144}
            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {/* Category Badge - 条件渲染 */}
          {categoryName && (
            <div className="absolute top-2 left-2">
              {enableCategoryLink && categoryUrl ? (
                // 启用链接：可点击的分类 badge
                <div className="pointer-events-auto z-20">
                  <Link
                    href={categoryUrl}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View ${categoryName} games`}
                  >
                    {categoryName}
                  </Link>
                </div>
              ) : (
                // 禁用链接：仅展示的分类 badge
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent text-accent-foreground">
                  {categoryName}
                </span>
              )}
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
            <div className="flex flex-wrap gap-1 pointer-events-auto">
              {tags.slice(0, 2).map((tag, index) => {
                const tagName = typeof tag === 'string' ? tag : tag.name
                const tagSlug = typeof tag === 'string'
                  ? tagName.toLowerCase().replace(/\s+/g, '-')
                  : tag.slug || tagName.toLowerCase().replace(/\s+/g, '-')

                if (enableTagLinks) {
                  // 启用链接：可点击的标签
                  return (
                    <Link
                      key={`${tagName}-${index}`}
                      href={`/tag/${tagSlug}`}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`View ${tagName} games`}
                    >
                      #{tagName}
                    </Link>
                  )
                } else {
                  // 禁用链接：仅展示的标签
                  return (
                    <span
                      key={`${tagName}-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                    >
                      #{tagName}
                    </span>
                  )
                }
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
