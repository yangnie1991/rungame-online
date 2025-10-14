# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

RunGame 是一个多语言在线游戏平台，采用 Next.js 15 (App Router) 构建，具有双界面架构：
- **用户端网站**: 国际化游戏门户，包含动态内容
- **管理后台**: 内容管理系统，用于管理游戏、分类、标签、语言和页面类型

**技术栈**: Next.js 15, React 19, TypeScript, Prisma (PostgreSQL), NextAuth.js, next-intl, TailwindCSS 4, shadcn/ui

## 开发命令

```bash
# 开发
npm run dev                    # 启动开发服务器（Turbopack），端口 :3000

# 数据库
npm run db:push                # 将 Prisma schema 推送到数据库
npm run db:seed                # 填充数据库初始数据（管理员、分类、游戏）

# 生产
npm run build                  # 使用 Turbopack 构建生产版本
npm run start                  # 启动生产服务器
npm run lint                   # 运行 ESLint
```

**管理员登录**（填充数据后）:
- URL: http://localhost:3000/login
- 邮箱: admin@rungame.online
- 密码: admin123

## 架构概览

### 双路由结构

应用使用 Next.js 路由组实现完全分离：

```
app/
├── (admin)/                   # 管理后台 - 无国际化
│   ├── layout.tsx            # 未认证时重定向到 /login
│   └── admin/
│       ├── layout.tsx        # 管理后台侧边栏 + 顶部布局
│       ├── games/            # 游戏管理
│       ├── categories/       # 分类管理
│       ├── tags/             # 标签管理
│       ├── languages/        # 语言管理
│       └── page-types/       # PageType 管理
│
├── (site)/                   # 公开网站 - 完全国际化
│   ├── layout.tsx           # 最小包装器
│   └── [locale]/            # 所有用户路由在 /{locale}/ 下
│       ├── layout.tsx       # 根 HTML，包含 next-intl provider
│       ├── page.tsx         # 首页
│       ├── games/           # 游戏列表和详情页
│       └── [slug]/          # 动态 PageType 路由
│
├── api/                     # API 路由（无国际化）
│   └── auth/[...nextauth]/  # NextAuth.js 处理程序
│
└── login/                   # 登录页面（无国际化）
```

### 国际化 (next-intl)

**配置文件**:
- [i18n/routing.ts](i18n/routing.ts) - 定义语言、默认语言，并导出类型安全的导航 API
- [i18n/config.ts](i18n/config.ts) - 请求配置，加载翻译消息
- [i18n/messages/](i18n/messages/) - JSON 翻译文件 (en.json, zh.json, es.json, fr.json)
- [middleware.ts](middleware.ts) - 处理语言路由和管理员身份验证

**支持的语言**: en (默认), zh, es, fr
- 默认语言 (en) 无 URL 前缀: `/games`
- 其他语言有前缀: `/zh/games`, `/es/games`

**导航规则**:
- 始终从 `@/i18n/routing` 导入: `import { Link, useRouter, usePathname } from "@/i18n/routing"`
- 用户端页面**禁止**使用 Next.js 原生 `next/link`
- **禁止**手动构造带语言前缀的 URL
- 语言切换: `<Link href={pathname} locale="zh">中文</Link>`

**翻译回退系统** ([lib/i18n-helpers.ts](lib/i18n-helpers.ts)):
- `getTranslationWithFallback()` - 返回请求语言的翻译，回退到默认语言 (en)，然后是第一个可用的翻译
- `buildLocaleCondition()` - 构建 Prisma 查询以获取当前语言和回退语言
- 在整个应用中用于游戏标题、分类名称等

### 数据库架构 (Prisma)

**翻译模式**: 主表存储不可翻译数据；独立的 `*Translation` 表存储特定语言的内容。

**核心模型**:
- `Category` + `CategoryTranslation` - 游戏分类（每个语言的名称、描述、元标签）
- `Tag` + `TagTranslation` - 游戏标签（每个语言的名称）
- `Game` + `GameTranslation` - 游戏（每个语言的标题、描述、说明）
- `Language` - 系统中可用的语言（包含 nameCn 字段用于中文名称）
- `PageType` + `PageTypeTranslation` - 动态页面类型（见下文 PageType 系统）
- `Admin` - 管理员用户，使用 bcrypt 密码
- `ApiKey` - API 密钥管理，包含作用域和速率限制

**重要索引**:
- 所有翻译表都有 `@@unique([entityId, locale])` 和 `@@index([locale])`
- 游戏索引: `slug`, `categoryId`, `isFeatured`, `isPublished`, `playCount`
- 分类和标签索引: `slug` 和 `isEnabled`

**数据填充**:
- 运行 `npm run db:seed` 填充初始数据
- 创建超级管理员、25个游戏分类（中英文翻译）、30个示例游戏和所有标签
- 在 [prisma/seed.ts](prisma/seed.ts) 中设置 `RESET_DATABASE = true` 可清除并重建数据（危险操作！）

### 身份验证与授权

**NextAuth.js v5** 配置在 [lib/auth.ts](lib/auth.ts):
- 策略: JWT，7天会话
- 提供者: Credentials（邮箱 + bcrypt 密码）
- 自定义回调将 `role` 注入会话
- 登录时更新 `lastLoginAt` 时间戳

**中间件保护** ([middleware.ts](middleware.ts)):
- 管理员路由 (`/admin/*`) 需要身份验证 + 角色检查（ADMIN 或 SUPER_ADMIN）
- 未认证用户重定向到 `/login?callbackUrl={pathname}`
- 权限不足返回 403 JSON 响应

**使用方法**:
```typescript
import { auth } from "@/lib/auth"

// Server Components
const session = await auth()
if (!session) redirect("/login")

// API Routes
const session = await auth()
if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })
```

### PageType 系统

**三种 PageType 模式** (详见 [docs/PAGETYPE-EXPLANATION.md](docs/PAGETYPE-EXPLANATION.md)):

1. **GAME_LIST**: 根据配置筛选/排序的动态游戏列表
   - 示例: 最多游玩、热门、新游戏
   - 配置: `gameListConfig` JSON（筛选、排序、分页）
   - URL: `/{locale}/most-played`, `/{locale}/new-games`

2. **STATIC_CONTENT**: 纯内容页面
   - 示例: 关于我们、隐私政策、条款
   - 内容来自 `PageContentBlock` + `PageContentBlockTranslation`
   - 块类型: TEXT, IMAGE, VIDEO, HTML

3. **MIXED**: 静态内容 + 游戏列表的组合
   - 示例: 夏日游戏活动、益智挑战
   - 同时使用 `gameListConfig` 和内容块
   - `layoutConfig` 控制块/游戏列表的位置

**关键字段**:
- `slug` - URL 标识符（如 "most-played"）
- `type` - GAME_LIST, STATIC_CONTENT 或 MIXED
- `gameListConfig` - 游戏的 JSON 筛选/排序规则
- `layoutConfig` - JSON 布局设置（网格 vs 列表、列数、侧边栏）
- `cacheConfig` - JSON 缓存策略（TTL、失效触发器）

### 组件组织

**管理后台组件** ([components/admin/](components/admin/)):
- 使用 react-hook-form + zod 验证的复杂表单
- 多语言输入的语言标签（如 CategoryForm, GameForm）
- 用于变更的 Server Actions（如分类 actions、游戏 actions）
- 可重用的删除/切换状态按钮

**网站组件** ([components/site/](components/site/)):
- GameCard, GameSection - 显示游戏列表
- GameEmbed - 嵌入游戏的 iframe 包装器
- Header, Sidebar, Footer - 网站框架，带语言切换

**UI 组件** ([components/ui/](components/ui/)):
- shadcn/ui 基础组件（button, input, card, dialog 等）
- 符合 shadcn 约定（cn 工具函数，cva 用于变体）

### 样式

**TailwindCSS 4** 带自定义动画:
- 配置在 [tailwind.config.ts](tailwind.config.ts)（如果存在）或使用 `@tailwindcss/postcss`
- 使用 `@/lib/utils` 的 `cn()` 进行类合并
- 管理后台强制浅色模式: `style={{ colorScheme: 'light' }}`
- 用户网站支持 `next-themes` 的深色模式

## 重要模式

### Server Actions

管理后台变更使用 Server Actions 并进行重新验证：

```typescript
"use server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function updateCategory(id: string, data: CategoryData) {
  await prisma.category.update({ where: { id }, data })
  revalidatePath("/admin/categories")
  revalidatePath("/[locale]", "layout") // 重新验证用户端页面
}
```

### 翻译查询

始终获取当前语言和回退语言：

```typescript
import { buildLocaleCondition, getTranslationWithFallback } from "@/lib/i18n-helpers"

const game = await prisma.game.findUnique({
  where: { slug },
  include: {
    translations: {
      where: buildLocaleCondition(locale), // 获取当前语言 + en 回退
    },
  },
})

const translation = getTranslationWithFallback(game.translations, locale)
const title = translation?.title || "未命名游戏"
```

### 多语言表单

管理后台表单使用动态语言标签：

```typescript
const [activeLocale, setActiveLocale] = useState("en")
const locales = ["en", "zh", "es", "fr"]

return (
  <Tabs value={activeLocale} onValueChange={setActiveLocale}>
    <TabsList>
      {locales.map(locale => (
        <TabsTrigger key={locale} value={locale}>
          {locale.toUpperCase()}
        </TabsTrigger>
      ))}
    </TabsList>
    {locales.map(locale => (
      <TabsContent key={locale} value={locale}>
        <Input {...register(`translations.${locale}.title`)} />
      </TabsContent>
    ))}
  </Tabs>
)
```

## 配置说明

- **路径别名**: `@/*` 映射到根目录（见 [tsconfig.json](tsconfig.json)）
- **图片域名**: 在 [next.config.ts](next.config.ts) 中配置游戏缩略图（gamedistribution.com, gamepix.com 等）
- **Turbopack**: 构建和开发使用 `--turbopack` 标志以获得更快性能
- **数据库**: 需要 PostgreSQL（在 `.env` 中设置 `DATABASE_URL`）

## 关键约束

1. **禁止直接修改翻译** - 始终通过翻译表操作
2. **管理后台路由仅英文** - 管理后台无国际化
3. **用户路由必须使用 next-intl 导航** - 从 `@/i18n/routing` 导入，而非 `next/navigation`
4. **PageType slug 是 URL slug** - 必须是 URL 安全且唯一的
5. **游戏 embedUrl 必须是 HTTPS** - iframe 的安全要求
6. **Language.code 必须匹配 next-intl locales** - 同步 [i18n/routing.ts](i18n/routing.ts) 和 Language 表

## 常见任务

**添加新语言**:
1. 添加到 [i18n/routing.ts](i18n/routing.ts) 的 `locales` 数组
2. 创建 [i18n/messages/{locale}.json](i18n/messages/)
3. 运行 seed 或手动插入到 Language 表
4. 为所有分类、标签和游戏添加翻译

**创建新 PageType**:
1. 管理后台 → 页面类型 → 创建
2. 选择类型（GAME_LIST, STATIC_CONTENT 或 MIXED）
3. 如适用，配置 gameListConfig JSON
4. 为所有启用的语言添加翻译
5. 对于 STATIC_CONTENT 或 MIXED，添加 PageContentBlocks

**添加游戏**:
1. 确保分类存在
2. 管理后台 → 游戏 → 创建
3. 填写 slug、embedUrl、缩略图、尺寸
4. 为所有语言添加翻译
5. 分配分类和标签
6. 切换 `isPublished` 以在网站上显示

## 数据库连接最佳实践

**使用连接池**（必需）：

```env
# 开发环境
DATABASE_URL="postgresql://game:password@localhost:5432/game?schema=public&connection_limit=5&pool_timeout=10"

# 生产环境（使用 PgBouncer）
DATABASE_URL="postgresql://game:password@host:6432/game?schema=public&pgbouncer=true&connection_limit=10&pool_timeout=20"
```

**连接池大小计算**：
```
总连接数 = 应用实例数 × connection_limit
```

更多详情见 [docs/DATABASE-CONNECTION-ISSUE.md](docs/DATABASE-CONNECTION-ISSUE.md)

## 文件引用格式

在引用代码位置时，使用以下格式：

- 文件: [filename.ts](path/to/filename.ts)
- 特定行: [filename.ts:42](path/to/filename.ts#L42)
- 行范围: [filename.ts:42-51](path/to/filename.ts#L42-L51)
- 文件夹: [src/utils/](src/utils/)

示例：
- 客户端错误处理在 [app/(site)/actions.ts:156](app/(site)/actions.ts#L156) 的 `getGameBySlug` 函数中
- 翻译辅助函数在 [lib/i18n-helpers.ts](lib/i18n-helpers.ts)

## 相关文档

### 核心文档
- [README.md](README.md) - 项目快速开始
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - 完整部署指南
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) - 环境变量配置

### 技术参考
- [docs/I18N-BEST-PRACTICES.md](docs/I18N-BEST-PRACTICES.md) - next-intl 最佳实践
- [docs/PAGETYPE-EXPLANATION.md](docs/PAGETYPE-EXPLANATION.md) - PageType 系统详解
- [docs/SHADCN-UI-EXPLAINED.md](docs/SHADCN-UI-EXPLAINED.md) - shadcn/ui 使用说明
- [docs/IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md) - 实现指南

### 问题排查
- [docs/DATABASE-CONNECTION-ISSUE.md](docs/DATABASE-CONNECTION-ISSUE.md) - 数据库连接问题
- [docs/I18N-FALLBACK-FIX-REPORT.md](docs/I18N-FALLBACK-FIX-REPORT.md) - 国际化回退修复报告
- [docs/REORDER-TABLE-COLUMNS.md](docs/REORDER-TABLE-COLUMNS.md) - 数据库表字段重排序
- [docs/LANGUAGES-TABLE-REBUILD-SUMMARY.md](docs/LANGUAGES-TABLE-REBUILD-SUMMARY.md) - Languages表重建总结

---
## 强制性限制
- 所有的内容回复使用中文进行回复
- 对于涉及的组件、框架、css框架、UI组件、框架插件的使用和代码书写必须遵循官方的最佳实践指导，相关的官方技术文档使用Context7mcp工具进行获取
- 对于页面功能的调试、测试必须优先使用browsermcp进行，如果该工具未连接，提示用户进行mcp工具连接后，再进行功能调试、测试工作

**最后更新**: 2025-01-14
**项目版本**: v1.0
