import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"
import { shouldExcludeFromI18n } from "./lib/static-files"

// 创建next-intl中间件 - 使用routing配置
const intlMiddleware = createMiddleware(routing)

/**
 * 已知的静态路由（不是 PageType）
 */
const KNOWN_ROUTES = [
  '/games',
  '/category',
  '/tag',
  '/play',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/search',
  '/collection',
]

/**
 * 支持的语言代码
 */
const LOCALES = ['en', 'zh']

/**
 * 检查路径是否是旧的 PageType URL（需要重定向到 /collection/）
 */
function isOldPageTypeUrl(pathname: string): boolean {
  // 移除语言前缀
  const pathWithoutLocale = pathname.replace(/^\/(en|zh)\//, '/')

  // 如果路径只有一层（例如 /most-played），并且不是已知路由
  const segments = pathWithoutLocale.split('/').filter(Boolean)

  if (segments.length === 1) {
    const route = `/${segments[0]}`

    // 排除语言路径（如 /zh, /en）
    if (LOCALES.includes(segments[0])) {
      return false
    }

    return !KNOWN_ROUTES.includes(route)
  }

  return false
}

/**
 * 中间件主函数
 *
 * 处理顺序：
 * 1. 检查是否需要排除在国际化之外（管理后台、API、静态文件等）
 * 2. 检查是否是旧的 PageType URL，如果是则 301 重定向到 /collection/
 * 3. 如果需要国际化，则使用 next-intl 中间件处理
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否应该跳过国际化处理
  // 包括：管理后台、API 路由、登录页面、静态文件等
  if (shouldExcludeFromI18n(pathname)) {
    return NextResponse.next()
  }

  // 检查是否是旧的 PageType URL（需要重定向）
  if (isOldPageTypeUrl(pathname)) {
    // 检测语言前缀
    const localeMatch = pathname.match(/^\/(en|zh)\/(.+)$/)

    let newPath: string
    if (localeMatch) {
      // 有语言前缀：/zh/most-played → /zh/collection/most-played
      const [, locale, slug] = localeMatch
      newPath = `/${locale}/collection/${slug}`
    } else {
      // 无语言前缀（默认语言）：/most-played → /collection/most-played
      const slug = pathname.slice(1) // 移除开头的 /
      newPath = `/collection/${slug}`
    }

    // 保留查询参数
    const url = request.nextUrl.clone()
    url.pathname = newPath

    // 返回 301 永久重定向
    return NextResponse.redirect(url, { status: 301 })
  }

  // 用户端路由使用 next-intl 中间件处理国际化
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
