import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"

// 创建next-intl中间件 - 使用routing配置
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 管理后台路由 - 认证检查在服务器端 layout 中进行
  // 中间件只负责路由，不处理认证（避免 Edge Function 体积过大）
  if (pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // 2. API路由和登录页面跳过国际化处理
  if (pathname.startsWith("/api") || pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  // 3. 用户端使用next-intl中间件处理国际化
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
