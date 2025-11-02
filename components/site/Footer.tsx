"use client"

import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import Image from "next/image"

interface FooterProps {
  locale: string
}

export function SiteFooter({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const t = useTranslations("footer")
  const tCommon = useTranslations("common")

  return (
    <footer className="border-t bg-card mt-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Brand - Full Width on Mobile */}
        <div className="mb-6 md:mb-0">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo/logo-rungame.svg"
              alt="RunGame Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="text-lg font-bold">RunGame</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            {t("description")}
          </p>
        </div>

        {/* Links Grid - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">{t("quickLinks")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  {tCommon("home")}
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-primary transition-colors">
                  {tCommon("allGames")}
                </Link>
              </li>
              <li>
                <Link href="/category" className="hover:text-primary transition-colors">
                  {tCommon("categories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Game Categories - Hidden on mobile, shown on md+ */}
          <div className="hidden md:block">
            <h3 className="font-semibold mb-3 text-sm">{t("gameCategories")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/category/action-games"
                  className="hover:text-primary transition-colors"
                >
                  {locale === "zh" ? "动作游戏" : "Action Games"}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/puzzle-games"
                  className="hover:text-primary transition-colors"
                >
                  {locale === "zh" ? "益智游戏" : "Puzzle Games"}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/sports-games"
                  className="hover:text-primary transition-colors"
                >
                  {locale === "zh" ? "体育游戏" : "Sports Games"}
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">{t("about")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-6 md:mt-8 pt-4 md:pt-6 text-center text-xs text-muted-foreground">
          <p>{t("copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
