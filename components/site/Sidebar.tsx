"use client"

import { Link } from "@/i18n/routing"
import { usePathname } from "next/navigation"

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
}

export function Sidebar({ mainNavItems, categories, tags, pageTypes }: SidebarProps) {
  const pathname = usePathname()

  // 判断导航项是否为当前页面
  const isCurrentPage = (href: string): boolean => {
    // 标准化路径
    const normalizeUrl = (url: string) => url.replace(/\/$/, "") || "/"
    const normalizedHref = normalizeUrl(href)
    const normalizedPath = normalizeUrl(pathname)

    // 精确匹配
    if (normalizedHref === normalizedPath) {
      return true
    }

    // 对于首页
    const isHomePage = (url: string) => {
      if (url === "" || url === "/") return true
      return /^\/[a-z]{2}$/.test(url)
    }

    if (isHomePage(normalizedHref) && isHomePage(normalizedPath)) {
      return true
    }

    // 其他页面，检查路径是否以该href开始
    if (!isHomePage(normalizedHref)) {
      return normalizedPath.startsWith(normalizedHref + "/")
    }

    return false
  }

  return (
    <aside className="hidden md:block w-64 bg-background border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0">
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
            <div className="border-t border-gray-200 dark:border-gray-800 mb-4"></div>
            <div className="space-y-1">
              {pageTypes.map((pageType) => {
                const pageTypeHref = `/${pageType.slug}`
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
            <div className="border-t border-gray-200 dark:border-gray-800 mb-4"></div>
            <div className="space-y-1">
              {categories.map((category) => {
                const categoryHref = `/games/category/${category.slug}`
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
            <div className="border-t border-gray-200 dark:border-gray-800 mb-4"></div>
            <div className="space-y-1">
              <Link
                href="/games/tags"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                  isCurrentPage("/games/tags")
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm mr-2">🏷️</span>
                  <span className="capitalize">All Tags</span>
                </div>
                <span
                  className={`text-xs transition-colors ${
                    isCurrentPage("/games/tags") ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground/70"
                  }`}
                >
                  {tags.length}
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* About Info */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🎮 RunGame offers thousands of free online games, no downloads required, play instantly in your browser!
          </p>
        </div>

        {/* Support Links */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          {/* Policy Links */}
          <div className="flex justify-between text-xs text-muted-foreground mb-3">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>

          {/* Social Media and Contact */}
          <div className="flex items-center justify-between">
            <Link href="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>

            {/* Social Media Buttons */}
            <div className="flex space-x-2">
              <a
                href="https://twitter.com/rungame"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded bg-accent hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center text-xs"
                title="Twitter"
              >
                🐦
              </a>
              <a
                href="https://github.com/rungame"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded bg-accent hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center text-xs"
                title="GitHub"
              >
                ⚡
              </a>
              <a
                href="mailto:hello@rungame.online"
                className="w-6 h-6 rounded bg-accent hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center text-xs"
                title="Email"
              >
                ✉️
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
