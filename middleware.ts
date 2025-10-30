import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"
import { shouldExcludeFromI18n } from "./lib/static-files"

// 创建next-intl中间件 - 使用routing配置
const intlMiddleware = createMiddleware(routing)

/**
 * 中间件主函数
 *
 * 处理顺序：
 * 1. 检查是否需要排除在国际化之外（管理后台、API、静态文件等）
 * 2. 如果需要国际化，则使用 next-intl 中间件处理
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否应该跳过国际化处理
  // 包括：管理后台、API 路由、登录页面、静态文件等
  if (shouldExcludeFromI18n(pathname)) {
    return NextResponse.next()
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
