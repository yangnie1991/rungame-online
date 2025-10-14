"use client"

import { Link } from "@/i18n/routing"
import { Gamepad2 } from "lucide-react"

interface FooterProps {
  locale: string
}

export function SiteFooter({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">RunGame</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              免费在线游戏平台，畅玩精选小游戏
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">快速链接</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/games`} className="hover:text-primary transition-colors">
                  所有游戏
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-3">游戏分类</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/games/category/action`}
                  className="hover:text-primary transition-colors"
                >
                  动作游戏
                </Link>
              </li>
              <li>
                <Link
                  href={`/games/category/puzzle`}
                  className="hover:text-primary transition-colors"
                >
                  益智游戏
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-3">关于我们</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-primary transition-colors">
                  关于
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-primary transition-colors"
                >
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-primary transition-colors">
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} RunGame. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
