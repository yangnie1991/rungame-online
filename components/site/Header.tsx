"use client"

import { Link, usePathname, useRouter } from "@/i18n/routing"
import { Search, Menu } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string | null
}

interface HeaderProps {
  languages: Language[]
  currentLocale: string
}

export function SiteHeader({ languages, currentLocale }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const t = useTranslations("header")

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="bg-card py-4 z-50 shadow-sm flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo 和品牌关键词 */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity shrink-0">
              <Image
                src="/logo/logo-rungame.svg"
                alt="RunGame Logo"
                width={48}
                height={48}
                className="w-7 h-7 sm:w-8 sm:h-8"
                priority
              />
              <span className="text-xl sm:text-2xl font-bold text-primary">RunGame</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="font-medium">{t("freeOnlineGames")}</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-medium">{t("noDownload")}</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-medium">{t("playInstantly")}</span>
            </div>
          </div>

          {/* Search Box - 扩大搜索框 */}
          <div className="flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12 text-base transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>
            </form>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center space-x-2">
            {/* 语言切换 */}
            <div className="hidden md:block relative group">
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center">
                {languages.find((l) => l.code === currentLocale)?.flag || "🌐"}
                <span className="ml-1">
                  {languages.find((l) => l.code === currentLocale)?.nativeName}
                </span>
                <span className="ml-1">▾</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {languages.map((lang) => {
                    const isActive = lang.code === currentLocale
                    return (
                      <Link
                        key={lang.code}
                        href={pathname}
                        locale={lang.code as "en" | "zh" | "es" | "fr"}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {lang.flag && <span className="mr-2">{lang.flag}</span>}
                        {lang.nativeName}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 主题切换 */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* 移动端菜单按钮 */}
            <button className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="菜单">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
