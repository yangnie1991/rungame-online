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
        {/* Compact single row layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Image
              src="/logo/logo-rungame.svg"
              alt="RunGame Logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="font-semibold">RunGame</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              - {t("description")}
            </span>
          </div>

          {/* Links - Inline */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              {tCommon("home")}
            </Link>
            <Link href="/games" className="hover:text-primary transition-colors">
              {tCommon("allGames")}
            </Link>
            <Link href="/category" className="hover:text-primary transition-colors">
              {tCommon("categories")}
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/about" className="hover:text-primary transition-colors">
              {t("about")}
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t("terms")}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground">
            <p>{t("copyright", { year: currentYear })}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
