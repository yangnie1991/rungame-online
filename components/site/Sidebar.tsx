"use client"

import { Link, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Twitter, Github, Mail } from "lucide-react"

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
            </div>
          </div>
        )}

        {/* About Info */}
        <div className="mt-6 pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-50"></div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            🎮 {t("sidebar.aboutInfo")}
          </p>
        </div>

        {/* Support Links */}
        <div className="mt-4 pt-3">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-30"></div>

          {/* Policy and Contact Links - Flexible Grid */}
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/privacy" className="hover:text-primary transition-colors px-2 py-1">
              {t("sidebar.privacy")}
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/terms" className="hover:text-primary transition-colors px-2 py-1">
              {t("sidebar.terms")}
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/contact" className="hover:text-primary transition-colors px-2 py-1">
              {t("sidebar.contact")}
            </Link>
          </div>

          {/* Social Media Buttons - Full Width */}
          <div className="flex justify-center space-x-3">
            <a
              href="https://twitter.com/rungame"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-9 h-9 rounded-lg bg-accent hover:bg-blue-500 transition-all hover:scale-110 flex items-center justify-center shadow-sm"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Twitter
              </span>
            </a>
            <a
              href="https://github.com/rungame"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-9 h-9 rounded-lg bg-accent hover:bg-gray-800 dark:hover:bg-gray-700 transition-all hover:scale-110 flex items-center justify-center shadow-sm"
              aria-label="Visit our GitHub"
            >
              <Github className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                GitHub
              </span>
            </a>
            <a
              href="mailto:hello@rungame.online"
              className="group relative w-9 h-9 rounded-lg bg-accent hover:bg-green-500 transition-all hover:scale-110 flex items-center justify-center shadow-sm"
              aria-label="Send us an email"
            >
              <Mail className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Email
              </span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  )
}
