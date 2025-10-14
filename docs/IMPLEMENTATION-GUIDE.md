# RunGame Next.js 全栈重构实施指南

**项目路径**: `/Users/yangnie/Desktop/game/rungame-nextjs`
**当前状态**: Next.js 15.5.4 已创建
**目标**: All-in Next.js 全栈架构，NextAuth.js + shadcn/ui + Tailwind CSS

---

## 🚀 第一步：安装必要依赖（立即执行）

```bash
cd /Users/yangnie/Desktop/game/rungame-nextjs

# 1. 安装认证相关
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# 2. 安装数据库相关
npm install @prisma/client
npm install -D prisma

# 3. 安装表单和验证
npm install react-hook-form @hookform/resolvers zod

# 4. 安装动画库（shadcn/ui 需要）
npm install tailwindcss-animate

# 5. 安装表格组件
npm install @tanstack/react-table

# 6. 安装日期处理
npm install date-fns

# 注意：@radix-ui/* 包会在第六步运行 shadcn CLI 添加组件时自动安装
```

---

## 📁 第二步：创建项目目录结构

```bash
# 在项目根目录执行
cd /Users/yangnie/Desktop/game/rungame-nextjs

# 创建核心目录
mkdir -p app/\(public\)/\[lang\]
mkdir -p app/\(admin\)/admin
mkdir -p app/api/auth/\[...nextauth\]
mkdir -p components/ui
mkdir -p components/admin
mkdir -p components/web
mkdir -p lib
mkdir -p actions
mkdir -p types
mkdir -p hooks
mkdir -p prisma
```

---

## 🗄️ 第三步：复制 Prisma Schema

```bash
# 复制现有项目的 Prisma Schema
cp /Users/yangnie/Desktop/game/rungame-admin-spa/apps/api/prisma/schema.prisma ./prisma/

# 初始化 Prisma
npx prisma generate
```

如果数据库已存在：
```bash
# 连接到现有数据库（配置 .env 后执行）
npx prisma db pull
npx prisma generate
```

---

## 🔧 第四步：配置环境变量

创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
# 数据库连接
DATABASE_URL="postgresql://postgres:123456789@localhost:5432/game"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-change-in-production"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
EOF
```

生成安全的 NEXTAUTH_SECRET：
```bash
openssl rand -base64 32
```

---

## 📝 第五步：创建核心配置文件

### 1. Prisma Client 单例

创建 `lib/prisma.ts`：

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2. NextAuth.js 配置

创建 `lib/auth.ts`：

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          const admin = await prisma.admin.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              isActive: true,
            },
          })

          if (!admin || !admin.isActive) {
            return null
          }

          const isValidPassword = await bcrypt.compare(password, admin.password)
          if (!isValidPassword) {
            return null
          }

          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name || admin.email,
            role: admin.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

### 3. NextAuth.js API Route

创建 `app/api/auth/[...nextauth]/route.ts`：

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

### 4. TypeScript 类型定义

创建 `types/next-auth.d.ts`：

```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
```

### 5. Middleware（认证守卫 + 国际化）

创建 `middleware.ts`：

```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const locales = ["en", "zh", "es", "fr"]
const defaultLocale = "en"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 管理后台认证检查
  if (pathname.startsWith("/admin") && !pathname.startsWith("/login")) {
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
  }

  // 2. 国际化路由处理（仅用户端）
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/login")) {
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (!pathnameHasLocale) {
      const locale = getLocale(request)

      if (pathname === "/" || pathname === "") {
        // 首页重定向
        const url = new URL(`/${locale}`, request.url)
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  const acceptLanguage = request.headers.get("accept-language")
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().toLowerCase())
      .find((lang) => {
        const shortLang = lang.split("-")[0]
        return locales.includes(shortLang)
      })

    if (preferredLocale) {
      return preferredLocale.split("-")[0]
    }
  }

  return defaultLocale
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

---

## 🎨 第六步：初始化 shadcn/ui

```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 回答配置问题：
# ✔ Would you like to use TypeScript? yes
# ✔ Which style would you like to use? Default
# ✔ Which color would you like to use as base color? Slate
# ✔ Where is your global CSS file? app/globals.css
# ✔ Would you like to use CSS variables for colors? yes
# ✔ Where is your tailwind.config.js located? tailwind.config.ts
# ✔ Configure the import alias for components: @/components
# ✔ Configure the import alias for utils: @/lib/utils
```

### 安装常用 shadcn/ui 组件

```bash
# 表单相关
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add form

# 布局相关
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add tabs

# 反馈相关
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add alert

# 数据展示
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar

# 导航相关
npx shadcn@latest add dropdown-menu
```

---

## 🏗️ 第七步：创建基础布局

### 1. 根布局

更新 `app/layout.tsx`：

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RunGame.Online - Free Online Games",
  description: "Play thousands of free online games instantly",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### 2. 管理后台布局

创建 `app/(admin)/admin/layout.tsx`：

```typescript
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/Sidebar"
import { AdminHeader } from "@/components/admin/Header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3. 用户端布局

创建 `app/(public)/[lang]/layout.tsx`：

```typescript
import { WebHeader } from "@/components/web/Header"
import { WebFooter } from "@/components/web/Footer"

export default function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <WebHeader locale={params.lang} />
      <main className="flex-1">
        {children}
      </main>
      <WebFooter />
    </div>
  )
}
```

---

## 🔐 第八步：创建登录页面

创建 `app/login/page.tsx`：

```typescript
import { LoginForm } from "@/components/admin/LoginForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>请输入您的凭据以访问管理后台</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
```

创建 `components/admin/LoginForm.tsx`：

```typescript
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "登录失败",
          description: "邮箱或密码错误",
          variant: "destructive",
        })
        return
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/admin"
      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      toast({
        title: "登录失败",
        description: "发生了意外错误",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "登录中..." : "登录"}
      </Button>
    </form>
  )
}
```

---

## 📋 第九步：创建管理后台组件

### 1. Sidebar 组件

创建 `components/admin/Sidebar.tsx`：

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderTree,
  Tags,
  Gamepad2,
  Languages
} from "lucide-react"

const navigation = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "分类管理", href: "/admin/categories", icon: FolderTree },
  { name: "标签管理", href: "/admin/tags", icon: Tags },
  { name: "游戏管理", href: "/admin/games", icon: Gamepad2 },
  { name: "语言管理", href: "/admin/languages", icon: Languages },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">RunGame Admin</h1>
      </div>
      <nav className="mt-6">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

### 2. Header 组件

创建 `components/admin/Header.tsx`：

```typescript
"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "AD"

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">管理后台</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name || "管理员"}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button className="w-full cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              个人设置
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

---

## 🎯 第十步：创建第一个管理页面（Dashboard）

创建 `app/(admin)/admin/page.tsx`：

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Gamepad2, FolderTree, Tags, Globe } from "lucide-react"

export default async function DashboardPage() {
  // 获取统计数据
  const [gamesCount, categoriesCount, tagsCount, languagesCount] = await Promise.all([
    prisma.game.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.language.count(),
  ])

  const stats = [
    { name: "游戏总数", value: gamesCount, icon: Gamepad2, color: "text-blue-600" },
    { name: "分类数量", value: categoriesCount, icon: FolderTree, color: "text-green-600" },
    { name: "标签数量", value: tagsCount, icon: Tags, color: "text-purple-600" },
    { name: "语言数量", value: languagesCount, icon: Globe, color: "text-orange-600" },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">仪表盘</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>欢迎使用 RunGame 管理后台</CardTitle>
          <CardDescription>
            从左侧菜单开始管理您的游戏、分类、标签和语言
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
```

---

## ✅ 验证步骤

现在你可以启动项目并测试：

```bash
# 1. 确保数据库正在运行
# 2. 生成 Prisma Client
npx prisma generate

# 3. 启动开发服务器
npm run dev
```

访问：
- http://localhost:3000/login - 登录页面
- http://localhost:3000/admin - 管理后台（需要登录）

默认管理员账号（如果已运行过 seed）：
- 邮箱: `admin@rungame.online`
- 密码: `admin123`

---

## 📝 下一步任务清单

- [ ] 完成 `tsconfig.json` 路径别名配置
- [ ] 创建分类管理 CRUD 页面
- [ ] 创建标签管理 CRUD 页面
- [ ] 创建游戏管理 CRUD 页面
- [ ] 创建语言管理 CRUD 页面
- [ ] 创建用户端首页
- [ ] 创建游戏详情页
- [ ] 实现国际化路由

---

## 🆘 常见问题

### Q: TypeScript 报错找不到模块？
A: 确保 `tsconfig.json` 中配置了路径别名：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Q: Prisma Client 类型错误？
A: 重新生成：
```bash
npx prisma generate
```

### Q: 认证不工作？
A: 检查：
1. `.env.local` 中的 `NEXTAUTH_SECRET` 是否配置
2. 数据库连接是否正常
3. Admin 表中是否有用户数据

---

## 📚 参考文档

- [Next.js 15 文档](https://nextjs.org/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/docs)

---

**准备好了吗？开始执行第一步吧！** 🚀
