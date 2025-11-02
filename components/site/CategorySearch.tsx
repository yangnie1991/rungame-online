"use client"

import { useState, useMemo } from "react"
import { Link } from "@/i18n/routing"
import { Search, X } from "lucide-react"

interface SubCategory {
  slug: string
  name: string
  icon: string | null
  gameCount: number
}

interface CategoryWithSubs {
  slug: string
  name: string
  icon: string | null
  gameCount: number
  subCategories: SubCategory[]
}

interface CategorySearchProps {
  categories: CategoryWithSubs[]
  locale: string
  translations: {
    search: string
    searchPlaceholder: string
    noResults: string
    games: string
    viewAll: string
    clearSearch: string
  }
}

export function CategorySearch({ categories, locale, translations }: CategorySearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // 过滤分类和子分类
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories
    }

    const query = searchQuery.toLowerCase().trim()

    return categories
      .map((mainCat) => {
        const mainMatches = mainCat.name.toLowerCase().includes(query)
        const filteredSubs = mainCat.subCategories.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        )

        // 如果主分类匹配，显示所有子分类
        if (mainMatches) {
          return mainCat
        }

        // 如果有子分类匹配，只显示匹配的子分类
        if (filteredSubs.length > 0) {
          return {
            ...mainCat,
            subCategories: filteredSubs,
          }
        }

        return null
      })
      .filter((cat): cat is CategoryWithSubs => cat !== null)
  }, [categories, searchQuery])

  const totalResults = useMemo(() => {
    return filteredCategories.reduce(
      (acc, cat) => acc + 1 + cat.subCategories.length,
      0
    )
  }, [filteredCategories])

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
            找到 {totalResults} 个结果
          </p>
        )}
      </div>

      {/* 分类列表 */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">{translations.noResults}</h3>
          <p className="text-muted-foreground">试试其他关键词</p>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredCategories.map((mainCat) => (
            <div key={mainCat.slug}>
              {/* 主分类标题 */}
              <Link href={`/category/${mainCat.slug}`} className="group block mb-6">
                <div className="flex items-center gap-4">
                  {mainCat.icon && (
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                      <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                        {mainCat.icon}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold group-hover:text-primary transition-colors duration-300 mb-1">
                      {mainCat.name}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {mainCat.gameCount} {translations.games}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <span className="text-sm font-medium">{translations.viewAll}</span>
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              {/* 子分类网格 */}
              {mainCat.subCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {mainCat.subCategories.map((subCat) => (
                    <Link
                      key={subCat.slug}
                      href={`/category/${mainCat.slug}/${subCat.slug}`}
                      className="group relative overflow-hidden rounded-2xl bg-card p-4 hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        {subCat.icon && (
                          <div className="flex-shrink-0">
                            <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                              {subCat.icon}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {subCat.name}
                          </h3>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-2xl font-bold text-primary tabular-nums"
                              style={{
                                fontSize:
                                  subCat.gameCount >= 1000
                                    ? "1.25rem"
                                    : subCat.gameCount >= 100
                                    ? "1.5rem"
                                    : "1.5rem",
                              }}
                            >
                              {subCat.gameCount}
                            </span>
                            <span className="text-base text-muted-foreground">
                              {translations.games}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {translations.noResults}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
