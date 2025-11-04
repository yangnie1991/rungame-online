# 项目架构文档

## 项目概述

RunGame 是一个多语言在线游戏平台，采用 Next.js 15 (App Router) 构建，具有双界面架构：
- **用户端网站**: 国际化游戏门户，包含动态内容
- **管理后台**: 内容管理系统（CMS）

## 技术栈

### 核心框架
- **Next.js 15** - React 框架，使用 App Router
- **React 19** - UI 库
- **TypeScript** - 类型安全

### 数据库 & ORM
- **PostgreSQL** - 关系型数据库（Supabase 托管）
- **Prisma** - 类型安全的 ORM

### 认证
- **NextAuth.js v5** - 身份验证
- **bcrypt** - 密码加密

### 国际化
- **next-intl** - i18n 解决方案
- 支持语言: en (默认), zh, es, fr

### 样式
- **TailwindCSS 4** - CSS 框架
- **shadcn/ui** - UI 组件库
- **next-themes** - 深色模式支持

### 开发工具
- **Turbopack** - 快速构建工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化（可选）

## 项目结构

```
rungame-nextjs/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # 管理后台路由组（无国际化）
│   │   ├── layout.tsx           # 未认证重定向到 /login
│   │   └── admin/
│   │       ├── layout.tsx       # 管理后台布局（侧边栏+顶栏）
│   │       ├── games/           # 游戏管理
│   │       ├── categories/      # 分类管理
│   │       ├── tags/            # 标签管理
│   │       ├── languages/       # 语言管理
│   │       └── page-types/      # 页面类型管理
│   │
│   ├── (site)/                  # 用户网站路由组（完全国际化）
│   │   ├── layout.tsx          # 最小包装器
│   │   └── [locale]/           # 所有用户路由在 /{locale}/ 下
│   │       ├── layout.tsx      # 根 HTML + next-intl provider
│   │       ├── page.tsx        # 首页
│   │       ├── games/          # 游戏列表和详情
│   │       │   ├── page.tsx                    # 游戏列表
│   │       │   ├── play/[slug]/page.tsx       # 游戏详情
│   │       │   ├── category/[category]/page.tsx # 分类页
│   │       │   └── tags/[tag]/page.tsx        # 标签页
│   │       ├── about/          # 关于我们
│   │       ├── contact/        # 联系我们
│   │       ├── privacy/        # 隐私政策
│   │       ├── terms/          # 服务条款
│   │       └── [pageType]/     # 动态 PageType 路由
│   │
│   ├── api/                    # API 路由（无国际化）
│   │   └── auth/[...nextauth]/ # NextAuth.js 处理程序
│   │
│   └── login/                  # 登录页面（无国际化）
│       └── page.tsx
│
├── components/                 # React 组件
│   ├── admin/                 # 管理后台组件
│   │   ├── Sidebar.tsx       # 侧边栏导航
│   │   ├── Header.tsx        # 顶部导航
│   │   ├── games/            # 游戏管理组件
│   │   ├── categories/       # 分类管理组件
│   │   └── ...
│   │
│   ├── site/                  # 用户网站组件
│   │   ├── Header.tsx        # 网站头部
│   │   ├── Footer.tsx        # 网站底部
│   │   ├── Sidebar.tsx       # 侧边栏
│   │   ├── GameCard.tsx      # 游戏卡片
│   │   ├── GameEmbed.tsx     # 游戏嵌入
│   │   ├── GameSection.tsx   # 游戏区块
│   │   └── ContentRenderer.tsx # 内容渲染器
│   │
│   └── ui/                    # shadcn/ui 基础组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── lib/                       # 工具函数和配置
│   ├── prisma.ts             # Prisma 客户端
│   ├── db.ts                 # 数据库配置
│   ├── auth.ts               # NextAuth 配置
│   ├── utils.ts              # 通用工具函数
│   ├── seo-helpers.ts        # SEO 辅助函数
│   ├── i18n-helpers.ts       # 国际化辅助函数
│   ├── cache-helpers.ts      # 缓存辅助函数
│   ├── data/                 # 数据查询函数
│   │   ├── games/
│   │   │   ├── detail.ts    # 游戏详情查询
│   │   │   ├── browse.ts    # 游戏浏览查询
│   │   │   └── featured.ts  # 精选游戏查询
│   │   ├── categories/
│   │   └── tags/
│   ├── helpers/              # 辅助函数
│   │   └── game-content.ts  # 游戏内容辅助
│   └── types/                # TypeScript 类型定义
│       └── game-info.ts
│
├── i18n/                      # 国际化配置
│   ├── routing.ts            # 路由配置 + 导航 API
│   ├── config.ts             # 请求配置
│   └── messages/             # 翻译文件
│       ├── en.json
│       ├── zh.json
│       ├── es.json
│       └── fr.json
│
├── prisma/                    # Prisma ORM
│   ├── schema.prisma         # 数据库 schema
│   └── seed.ts               # 数据填充脚本
│
├── public/                    # 静态文件
│   ├── images/
│   └── ads.txt
│
├── middleware.ts              # Next.js 中间件（语言路由 + 认证）
├── next.config.ts            # Next.js 配置
├── tailwind.config.ts        # TailwindCSS 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目依赖
```

## 架构模式

### 1. 双路由架构

应用使用 Next.js 路由组实现完全分离：

#### 管理后台 `(admin)`
- **无国际化**: 仅中文界面
- **需要认证**: 中间件验证 JWT token
- **访问控制**: ADMIN 或 SUPER_ADMIN 角色
- **路由前缀**: `/admin/*`

#### 用户网站 `(site)`
- **完全国际化**: 所有路由在 `/{locale}/` 下
- **无需认证**: 公开访问
- **动态路由**: 支持动态 PageType
- **SEO 优化**: 每个页面独立 metadata

### 2. 数据层架构

#### 数据流向

```
Component (Server/Client)
    ↓
Data Query Functions (lib/data/)
    ↓
Prisma Client
    ↓
PostgreSQL Database
```

#### 查询层设计

**特点**:
- 使用 Server Actions (`"use server"`)
- 集成缓存 (`unstable_cache`)
- 类型安全
- 统一翻译处理

**示例**:
```typescript
// lib/data/games/detail.ts
"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"

export async function getGameBySlug(slug: string, locale: string) {
  return unstable_cache(
    async () => {
      // 查询逻辑
      const game = await prisma.game.findUnique({
        where: { slug, status: 'published' },
        include: {
          translations: locale === 'en' ? false : {
            where: buildLocaleCondition(locale),
          },
        },
      })

      // 翻译处理
      return transformGameData(game, locale)
    },
    ['game-detail', slug, locale],
    { revalidate: 3600 }
  )()
}
```

### 3. 国际化架构

#### 路由策略

- **默认语言 (en)**: 无前缀 `/games`
- **其他语言**: 带前缀 `/zh/games`, `/es/games`
- **自动重定向**: 根据浏览器语言偏好

#### 翻译策略

1. **英文内容**: 存储在主表
2. **其他语言**: 存储在翻译表
3. **回退机制**:
   - 当前语言 → 英文 → 第一个可用翻译

#### 导航 API

```typescript
// ❌ 错误 - 不要使用 Next.js 原生导航
import Link from 'next/link'

// ✅ 正确 - 使用 next-intl 导航
import { Link, useRouter, usePathname } from '@/i18n/routing'
```

### 4. 认证架构

#### NextAuth.js v5 配置

- **策略**: JWT
- **会话有效期**: 7 天
- **提供者**: Credentials (邮箱 + 密码)
- **密码加密**: bcrypt (10 轮)

#### 中间件保护

```typescript
// middleware.ts
export default async function middleware(req: NextRequest) {
  // 1. 国际化路由处理
  const response = handleI18nRouting(req)

  // 2. 管理后台认证
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth()

    if (!session) {
      return NextResponse.redirect('/login')
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return response
}
```

### 5. 组件架构

#### Server Components (默认)

大部分组件使用 Server Components:
- 更好的性能
- 更小的 bundle 大小
- 直接数据库访问
- SEO 友好

```typescript
// app/(site)/[locale]/games/page.tsx
export default async function GamesPage({ params }: Props) {
  const { locale } = await params

  // 直接在 Server Component 中查询
  const games = await getAllGames(locale)

  return <GameList games={games} />
}
```

#### Client Components

仅在需要交互时使用:
- 表单处理
- 状态管理
- 浏览器 API
- 事件处理

```typescript
"use client"

import { useState } from "react"

export function SearchForm() {
  const [query, setQuery] = useState("")
  // ... 交互逻辑
}
```

### 6. 缓存架构

#### 多层缓存策略

1. **Next.js 缓存**:
   - `unstable_cache` - 数据缓存
   - Route Cache - 路由缓存
   - 缓存标签 - 精确重新验证

2. **数据库查询优化**:
   - 条件加载翻译
   - Select 替代 Include
   - 连接池管理

3. **失效策略**:
   ```typescript
   import { revalidatePath, revalidateTag } from "next/cache"

   // 重新验证特定路径
   revalidatePath('/games')

   // 重新验证特定标签
   revalidateTag('games')
   ```

## 开发工作流

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接等

# 3. 推送数据库 schema
npm run db:push

# 4. 填充初始数据
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

访问:
- 用户网站: http://localhost:3000
- 管理后台: http://localhost:3000/admin
- 登录页面: http://localhost:3000/login

### 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器（Turbopack）

# 构建
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 数据库
npm run db:push      # 推送 schema 到数据库
npm run db:seed      # 填充初始数据
npx prisma studio    # 打开数据库 GUI

# 代码质量
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查
```

### 添加新功能

#### 1. 添加新的数据模型

```bash
# 1. 编辑 prisma/schema.prisma
# 2. 推送到数据库
npm run db:push
# 3. 重新生成 Prisma Client
npx prisma generate
```

#### 2. 添加新的用户页面

```bash
# 创建页面文件
app/(site)/[locale]/new-page/page.tsx

# 页面会自动支持所有语言:
# /new-page (英文)
# /zh/new-page (中文)
# /es/new-page (西班牙语)
# /fr/new-page (法语)
```

#### 3. 添加新的管理页面

```bash
# 创建页面文件
app/(admin)/admin/new-feature/page.tsx

# 创建对应的 actions
app/(admin)/admin/new-feature/actions.ts

# 创建组件
components/admin/new-feature/
```

#### 4. 添加新的翻译

```json
// i18n/messages/en.json
{
  "newKey": "New translation"
}

// i18n/messages/zh.json
{
  "newKey": "新的翻译"
}
```

使用:
```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations()
const text = t('newKey')
```

## 部署架构

### Vercel 部署

推荐使用 Vercel 部署:
- 自动 CI/CD
- 边缘网络
- 环境变量管理
- 预览部署

### 环境变量

必需的环境变量:
```env
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://yourdomain.com"

# (可选) Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### 构建优化

- **Turbopack**: 更快的构建速度
- **Image Optimization**: 自动图片优化
- **Code Splitting**: 自动代码分割
- **Static Generation**: 静态页面生成

## 性能优化

### 1. 数据查询优化

- 使用 `select` 精确选择字段
- 条件加载翻译（英文跳过翻译表）
- 使用索引加速查询
- 连接池管理

### 2. 渲染优化

- 优先使用 Server Components
- 客户端组件按需加载
- 图片懒加载
- 路由预取

### 3. 缓存优化

- 数据查询缓存
- 路由缓存
- 静态资源缓存
- CDN 加速

## 安全性

### 1. 认证安全

- JWT token 认证
- bcrypt 密码加密
- 会话过期管理
- CSRF 保护

### 2. 授权控制

- 中间件路由保护
- 角色权限检查
- API 访问控制

### 3. 数据安全

- SQL 注入防护 (Prisma)
- XSS 防护 (React)
- 环境变量隔离
- HTTPS 强制

## 故障排查

### 常见问题

1. **国际化路由不工作**
   - 检查是否使用 `@/i18n/routing` 导入
   - 检查 middleware.ts 配置

2. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 检查连接池设置
   - 验证数据库可访问性

3. **认证失败**
   - 检查 NEXTAUTH_SECRET 配置
   - 检查 NEXTAUTH_URL 设置
   - 清除浏览器 cookies

4. **构建失败**
   - 运行 `npx prisma generate`
   - 清除 `.next` 目录
   - 检查 TypeScript 错误

## 扩展指南

### 添加新语言

1. 添加到 `i18n/routing.ts`:
```typescript
export const locales = ['en', 'zh'] as const
```

2. 创建翻译文件:
```bash
i18n/messages/de.json
```

3. 在数据库添加语言记录

4. 为所有内容添加翻译

### 集成第三方服务

- **Google Analytics**: 已支持
- **Google AdSense**: 已配置
- **CDN**: 支持 Cloudflare R2
- **支付网关**: 待实现
- **评论系统**: 待实现

## 最佳实践

1. **始终使用 TypeScript**
2. **Server Components 优先**
3. **使用 next-intl 导航 API**
4. **数据查询添加缓存**
5. **遵循 shadcn/ui 组件模式**
6. **保持文件路径别名 `@/`**
7. **使用 Prisma 类型安全查询**
8. **环境变量不提交到 git**

## 相关文档

- [数据库文档](./DATABASE.md)
- [国际化文档](./I18N.md)
- [页面结构文档](./PAGE-STRUCTURE.md)
- [SEO 文档](./SEO.md)
