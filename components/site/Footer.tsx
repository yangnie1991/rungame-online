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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Brand - Takes 4 columns on desktop */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo/logo-rungame.svg"
                alt="RunGame Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="font-semibold">RunGame</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              {t("description")}
            </p>
          </div>

          {/* Links - Takes 8 columns on desktop, split into 2 groups */}
          <div className="md:col-span-8 grid grid-cols-2 gap-6">
            {/* Quick Links */}
            <div>
              <h3 className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                {t("quickLinks")}
              </h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="/" className="text-foreground hover:text-primary transition-colors">
                    {tCommon("home")}
                  </Link>
                </li>
                <li>
                  <Link href="/games" className="text-foreground hover:text-primary transition-colors">
                    {tCommon("allGames")}
                  </Link>
                </li>
                <li>
                  <Link href="/category" className="text-foreground hover:text-primary transition-colors">
                    {tCommon("categories")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                {t("about")}
              </h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="/about" className="text-foreground hover:text-primary transition-colors">
                    {t("about")}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-foreground hover:text-primary transition-colors">
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-foreground hover:text-primary transition-colors">
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright - Compact */}
        <div className="border-t mt-4 md:mt-6 pt-3 md:pt-4 text-center text-xs text-muted-foreground">
          <p>{t("copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
