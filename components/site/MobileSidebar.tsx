"use client"

import { Link, usePathname } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Menu } from "lucide-react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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

interface PageTypeItem {
  slug: string
  type: string
  icon: string | null
  title: string
  description: string
}

interface MobileSidebarProps {
  mainNavItems: NavItem[]
  categories: CategoryItem[]
  pageTypes: PageTypeItem[]
}

export function MobileSidebar({ mainNavItems, categories, pageTypes }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()

  // 判断导航项是否为当前页面
  const isCurrentPage = (href: string): boolean => {
    const normalizeUrl = (url: string) => url.replace(/\/$/, "") || "/"
    const normalizedHref = normalizeUrl(href)
    const normalizedPath = normalizeUrl(pathname)

    if (normalizedHref === normalizedPath) {
      return true
    }

    if (normalizedHref === "/") {
      return normalizedPath === "/"
    }

    return normalizedPath.startsWith(normalizedHref + "/") || normalizedPath === normalizedHref
  }

  // 关闭菜单的处理函数
  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
          aria-label="菜单"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>导航菜单</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Main Navigation */}
          {mainNavItems && mainNavItems.length > 0 && (
            <div className="mb-6">
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = isCurrentPage(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
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
          )}

          {/* PageTypes Section */}
          {pageTypes && pageTypes.length > 0 && (
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
                      onClick={handleLinkClick}
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
          {categories && categories.length > 0 && (
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
                      onClick={handleLinkClick}
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

          {/* View All Links */}
          <div className="mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4 opacity-50"></div>
            <div className="space-y-1">
              <Link
                href="/category"
                onClick={handleLinkClick}
                className="flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              >
                <span className="mr-2">📂</span>
                {t("sidebar.allCategories")}
              </Link>
              <Link
                href="/tag"
                onClick={handleLinkClick}
                className="flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              >
                <span className="mr-2">🏷️</span>
                {t("sidebar.allTags")}
              </Link>
              <Link
                href="/games"
                onClick={handleLinkClick}
                className="flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              >
                <span className="mr-2">🎮</span>
                {t("sidebar.allGames")}
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
