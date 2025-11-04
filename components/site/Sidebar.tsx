"use client"

import { Link, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"

interface NavItem {
  href: string
  icon: string
  text: string
}

interface CategoryItem {
  slug: string
  name: string
  icon: string | null
  count: number
}

interface TagItem {
  slug: string
  name: string
  icon: string | null
  count: number
}

interface PageTypeItem {
  slug: string
  type: string
  icon: string | null
  title: string
  description: string
}

interface SidebarProps {
  mainNavItems: NavItem[]
  categories: CategoryItem[]
  tags: TagItem[]
  pageTypes: PageTypeItem[]
  totalSubCategories?: number
  totalGames?: number
}

export function Sidebar({ mainNavItems, categories, tags, pageTypes, totalSubCategories, totalGames }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations()

  // 调试信息（可以在开发时查看）
  // console.log('Current pathname:', pathname)

  // 判断导航项是否为当前页面
  const isCurrentPage = (href: string): boolean => {
    // 标准化路径（移除末尾斜杠）
    const normalizeUrl = (url: string) => url.replace(/\/$/, "") || "/"
    const normalizedHref = normalizeUrl(href)
    const normalizedPath = normalizeUrl(pathname)

    // 精确匹配
    if (normalizedHref === normalizedPath) {
      return true
    }

    // 对于首页，只精确匹配
    if (normalizedHref === "/") {
      return normalizedPath === "/"
    }

    // 其他页面，检查路径是否以该 href 开始
    // 例如：href="/games/category/action" 匹配 pathname="/games/category/action/page-2"
    return normalizedPath.startsWith(normalizedHref + "/") || normalizedPath === normalizedHref
  }

  return (
    <aside className="hidden md:block w-64 bg-card overflow-y-auto flex-shrink-0 shadow-sm">
      <div className="p-4">
        {/* Main Navigation */}
        <div className="mb-6">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = isCurrentPage(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.text}
                </Link>
              )
            })}
          </div>
        </div>

        {/* PageTypes Section */}
        {pageTypes.length > 0 && (
          <div className="mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-50"></div>
            <div className="space-y-1">
              {pageTypes.map((pageType) => {
                const pageTypeHref = `/collection/${pageType.slug}`
                const isActive = isCurrentPage(pageTypeHref)
                return (
                  <Link
                    key={pageType.slug}
                    href={pageTypeHref}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                    title={pageType.description}
                  >
                    {pageType.icon && <span className="text-sm mr-2">{pageType.icon}</span>}
                    <span className="capitalize">{pageType.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-50"></div>
            <div className="space-y-1">
              {categories.map((category) => {
                const categoryHref = `/category/${category.slug}`
                const isActive = isCurrentPage(categoryHref)
                return (
                  <Link
                    key={category.slug}
                    href={categoryHref}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center">
                      {category.icon && <span className="text-sm mr-2">{category.icon}</span>}
                      <span className="capitalize">{category.name}</span>
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground/70"
                      }`}
                    >
                      {category.count}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Tags Section - 标签汇总页入口 */}
        {tags.length > 0 && (
          <div className="mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-50"></div>
            <div className="space-y-1">
              {/* 所有分类 */}
              <Link
                href="/category"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                  isCurrentPage("/category")
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">📂</span>
                  <span className="capitalize">{t("sidebar.allCategories")}</span>
                </div>
                {totalSubCategories !== undefined && (
                  <span
                    className={`text-xs transition-colors ${
                      isCurrentPage("/category") ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground/70"
                    }`}
                  >
                    {totalSubCategories}
                  </span>
                )}
              </Link>

              {/* 所有标签 */}
              <Link
                href="/tag"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                  isCurrentPage("/tag")
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">🏷️</span>
                  <span className="capitalize">{t("sidebar.allTags")}</span>
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isCurrentPage("/tag") ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground/70"
                  }`}
                >
                  {tags.length}
                </span>
              </Link>

              {/* 所有游戏 */}
              <Link
                href="/games"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                  isCurrentPage("/games")
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">🎮</span>
                  <span className="capitalize">{t("sidebar.allGames")}</span>
                </div>
                {totalGames !== undefined && (
                  <span
                    className={`text-xs transition-colors ${
                      isCurrentPage("/games") ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground/70"
                    }`}
                  >
                    {totalGames}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}
