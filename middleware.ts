import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { routing } from "./i18n/routing"

// 创建next-intl中间件 - 使用routing配置
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 管理后台认证检查（跳过国际化处理）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = await auth()

    if (!session) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      )
    }

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
