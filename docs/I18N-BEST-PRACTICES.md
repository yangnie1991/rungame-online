# Next.js + next-intl 国际化最佳实践

> 基于官方文档: https://next-intl.dev/docs

## 项目信息

- **框架**: Next.js 15 (App Router)
- **国际化库**: next-intl 4.3.12
- **默认语言**: English (en) - URL不显示前缀
- **支持语言**: en, zh, es, fr

## 📁 文件结构(官方推荐)

```
rungame-nextjs/
├── i18n/
│   ├── routing.ts          # 路由配置 + Navigation APIs导出
│   ├── config.ts           # 请求配置 + 消息加载
│   └── messages/           # 翻译文件
│       ├── en.json
│       ├── zh.json
│       ├── es.json
│       └── fr.json
├── middleware.ts           # 中间件(使用routing配置)
├── next.config.ts          # Next.js配置
└── app/
    ├── [locale]/          # 国际化路由
    │   ├── layout.tsx
    │   └── page.tsx
    └── page.tsx           # 根路径重定向
```

## 🔧 核心配置文件

### 1. `i18n/routing.ts` (官方推荐方式)

```typescript
import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

// 定义路由配置
export const routing = defineRouting({
  // 支持的所有语言
  locales: ["en", "zh", "es", "fr"],

  // 默认语言
  defaultLocale: "en",

  // 使用"as-needed"模式：默认语言不显示前缀
  // - 'always': 所有语言都显示前缀 (默认)
  // - 'as-needed': 只有非默认语言显示前缀 ✅
  // - 'never': 所有语言都不显示前缀
  localePrefix: "as-needed",
})

// 导出类型安全的导航工具
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
```

**关键点:**
- ✅ 使用`defineRouting`定义配置
- ✅ 使用`createNavigation`创建导航APIs
- ✅ 导出的组件自动处理locale前缀

### 2. `i18n/config.ts` (请求配置)

```typescript
import { getRequestConfig } from "next-intl/server"
import { notFound } from "next/navigation"

export const locales = ["en", "zh", "es", "fr"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// next-intl请求配置
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  if (!locale || !isValidLocale(locale)) {
    notFound()
  }

  return {
    locale,
    // 动态导入翻译文件
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Asia/Shanghai",
    now: new Date(),
  }
})
```

### 3. `middleware.ts` (官方推荐方式)

```typescript
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

// 直接使用routing配置创建中间件 ✅
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 跳过特殊路径(admin, api等)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // 应用国际化中间件
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

**官方推荐:**
- ✅ 直接传入`routing`配置对象
- ✅ 避免重复定义locales等参数
- ✅ 保持配置集中管理

### 4. `next.config.ts`

```typescript
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/config.ts")

const nextConfig: NextConfig = {
  // 你的其他配置
}

export default withNextIntl(nextConfig)
```

## 🎯 组件使用方式

### 客户端组件

```tsx
"use client"
import { Link, usePathname, useRouter } from "@/i18n/routing"

export function MyComponent() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      {/* 基本链接 - 自动处理locale */}
      <Link href="/games">Games</Link>
      <Link href="/game/snake">Snake Game</Link>

      {/* 带查询参数 */}
      <Link href="/search?q=puzzle">Search</Link>

      {/* 语言切换 - 保持当前路径 */}
      <Link href={pathname} locale="zh">中文</Link>
      <Link href={pathname} locale="en">English</Link>

      {/* 编程式导航 */}
      <button onClick={() => router.push("/about")}>
        Go to About
      </button>
    </>
  )
}
```

### 服务端组件

```tsx
// 服务端组件传递简单路径字符串
import { GameCard } from "@/components/GameCard"

export default function HomePage() {
  return (
    <>
      {/* 传递相对路径 */}
      <GameCard href="/game/snake" />

      {/* GameCard内部使用next-intl的Link */}
    </>
  )
}
```

## 🌐 URL路由结构

| 页面类型 | 英语(默认) | 中文 | 西班牙语 | 法语 |
|---------|-----------|------|---------|------|
| 首页 | `/` | `/zh` | `/es` | `/fr` |
| 游戏列表 | `/games` | `/zh/games` | `/es/games` | `/fr/games` |
| 游戏详情 | `/game/snake` | `/zh/game/snake` | `/es/game/snake` | `/fr/game/snake` |
| 分类页 | `/games/category/action` | `/zh/games/category/action` | `/es/games/category/action` | `/fr/games/category/action` |
| 搜索 | `/search?q=puzzle` | `/zh/search?q=puzzle` | `/es/search?q=puzzle` | `/fr/search?q=puzzle` |

## ✅ 官方最佳实践检查清单

- [x] 使用`defineRouting`定义路由配置
- [x] 使用`createNavigation`创建导航APIs
- [x] middleware直接使用routing配置对象
- [x] 从`@/i18n/routing`导入Link等组件
- [x] 客户端组件使用`"use client"`
- [x] 使用相对路径,避免手动拼接locale
- [x] 语言切换使用`<Link href={pathname} locale="xx">`
- [x] 配置正确的middleware matcher
- [x] 使用next.config.ts中的next-intl插件

## 🚫 常见错误

### ❌ 错误做法

```tsx
// 1. 不要使用Next.js原生Link
import Link from "next/link"

// 2. 不要手动拼接locale
<Link href={`/${locale}/games`}>

// 3. 不要创建自定义工具函数
function getLocalizedPath(locale, path) { ... }

// 4. 不要在middleware中重复定义配置
const intlMiddleware = createIntlMiddleware({
  locales: ["en", "zh"],  // ❌ 重复定义
  defaultLocale: "en",
})
```

### ✅ 正确做法

```tsx
// 1. 使用next-intl的Link
import { Link } from "@/i18n/routing"

// 2. 使用相对路径
<Link href="/games">

// 3. next-intl自动处理
// 无需自定义工具函数!

// 4. middleware使用routing配置
import { routing } from "./i18n/routing"
const intlMiddleware = createMiddleware(routing)
```

## 🧪 测试

### 本地测试

```bash
# 启动开发服务器
npm run dev

# 访问测试URL
http://localhost:3001/          # 英语首页
http://localhost:3001/games     # 英语游戏列表
http://localhost:3001/zh        # 中文首页
http://localhost:3001/zh/games  # 中文游戏列表
```

### 测试检查项

- [ ] 英语访问 `/` 不重定向到 `/en`
- [ ] 英语访问 `/games` 显示正确内容
- [ ] 中文访问 `/zh` 显示中文内容
- [ ] 中文访问 `/zh/games` 显示中文游戏列表
- [ ] 语言切换器正常工作
- [ ] 所有链接自动添加正确的locale前缀
- [ ] 刷新页面保持当前语言
- [ ] 浏览器语言检测正常工作

## 📚 官方文档参考

- [Getting Started](https://next-intl.dev/docs/getting-started/app-router)
- [Routing Configuration](https://next-intl.dev/docs/routing/configuration)
- [Middleware](https://next-intl.dev/docs/routing/middleware)
- [Navigation APIs](https://next-intl.dev/docs/routing/navigation)

## 🎯 核心优势

1. **零配置**: 配置一次,所有路由自动处理
2. **类型安全**: 完整的TypeScript支持
3. **官方推荐**: 遵循next-intl最佳实践
4. **SEO友好**: 默认语言使用简洁URL
5. **易维护**: 配置集中,无重复代码
6. **自动化**: 无需手动处理locale逻辑

## 总结

使用`next-intl`官方推荐方式后:

1. ✅ 创建`i18n/routing.ts`定义配置
2. ✅ middleware直接使用routing配置
3. ✅ 所有组件从`@/i18n/routing`导入Link
4. ✅ 使用相对路径,其他完全自动!

**不需要任何手动URL处理或自定义工具函数!**
