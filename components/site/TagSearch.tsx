"use client"

import { useState, useMemo } from "react"
import { Link } from "@/i18n/routing"
import { Search, X } from "lucide-react"

interface Tag {
  slug: string
  name: string
  icon: string | null
  gameCount: number
}

interface TagSearchProps {
  tags: Tag[]
  locale: string
  translations: {
    search: string
    searchPlaceholder: string
    noResults: string
    games: string
    clearSearch: string
  }
}

export function TagSearch({ tags, locale, translations }: TagSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // 过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tags
    }

    const query = searchQuery.toLowerCase().trim()
    return tags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [tags, searchQuery])

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translations.searchPlaceholder}
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={translations.clearSearch}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground">
            找到 {filteredTags.length} 个结果
          </p>
        )}
      </div>

      {/* 标签列表 */}
      {filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">{translations.noResults}</h3>
          <p className="text-muted-foreground">试试其他关键词</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-card p-4 hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                {/* 图标 - 左侧 */}
                {tag.icon && (
                  <div className="flex-shrink-0">
                    <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                      {tag.icon}
                    </span>
                  </div>
                )}

                {/* 标题和游戏数量 - 右侧垂直布局 */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {tag.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-bold text-primary tabular-nums"
                      style={{
                        fontSize:
                          tag.gameCount >= 1000
                            ? "1.25rem"
                            : tag.gameCount >= 100
                            ? "1.5rem"
                            : "1.5rem",
                      }}
                    >
                      {tag.gameCount}
                    </span>
                    <span className="text-base text-muted-foreground">
                      {translations.games}
                    </span>
                  </div>
                </div>
              </div>

              {/* 装饰性渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
