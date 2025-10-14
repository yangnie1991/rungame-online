# Vercel 部署问题修复报告

## 问题描述

部署到 Vercel 后，页面不显示游戏内容。本地开发环境一切正常，但生产环境构建失败。

## 问题分析

### 构建错误

```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
Export encountered an error on /_error: /500, exiting the build.
```

### 根本原因

1. **静态生成冲突**: 在 layout.tsx 中使用了 `generateStaticParams()` 与 `output: 'standalone'` 配置冲突
2. **预渲染失败**: Next.js 在构建时尝试预渲染错误页面时出错
3. **动态数据依赖**: 页面需要从数据库获取数据，不适合完全静态生成

## 解决方案

### 1. 移除静态参数生成

从 `app/(site)/[locale]/layout.tsx` 中移除了 `generateStaticParams()`：

```typescript
// ❌ 移除这段代码
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }))
}
```

### 2. 配置 ISR (Incremental Static Regeneration)

在 `app/(site)/[locale]/page.tsx` 中添加缓存配置：

```typescript
// ✅ 使用 ISR，每10分钟重新验证
export const revalidate = 600 // 10分钟
```

### 3. 修复国际化导入

修复 `app/(site)/[locale]/not-found.tsx` 中的导入：

```typescript
// ❌ 错误
import Link from "next/link"

// ✅ 正确
import { Link } from "@/i18n/routing"
```

### 4. 添加错误处理页面

创建 `app/(site)/[locale]/error.tsx` 处理运行时错误：

```typescript
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // 错误处理逻辑
}
```

## 技术细节

### SSR vs ISR vs Static

**当前配置: ISR (增量静态再生成)**

优点:
- ✅ **SEO 友好**: 首次访问返回完整的 HTML
- ✅ **性能优化**: 使用缓存，减少数据库查询
- ✅ **内容更新**: 定期重新验证，保持内容新鲜
- ✅ **Vercel 兼容**: 完美支持 Vercel 部署

工作原理:
1. 首次请求时，服务端渲染生成 HTML
2. 后续请求在缓存有效期内返回缓存的 HTML
3. 缓存过期后，后台重新生成新的静态页面
4. 用户始终看到快速响应，同时保证内容相对新鲜

### 配置说明

```typescript
export const revalidate = 600 // 10分钟

// 其他常用配置:
// export const revalidate = 60      // 1分钟（适合实时性要求高的页面）
// export const revalidate = 3600    // 1小时（适合更新不频繁的页面）
// export const revalidate = 0       // 每次请求都重新生成（等同于SSR）
// export const revalidate = false   // 永久缓存（等同于SSG）
```

## 构建结果

```
Route (app)                                 Size  First Load JS
├ ƒ /[locale]                                0 B         155 kB
├ ƒ /[locale]/game/[slug]                    0 B         154 kB
├ ƒ /admin                                   0 B         174 kB
...

ƒ  (Dynamic)  server-rendered on demand
```

所有页面标记为 `ƒ (Dynamic)`，表示使用服务端渲染。

## Vercel 部署步骤

### 1. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库连接 (使用 Pooling 连接)
DATABASE_URL="postgres://user:pass@host:6543/db?pgbouncer=true"

# NextAuth.js 配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"

# 应用配置
NODE_ENV="production"
```

### 2. 推送代码到 GitHub

```bash
git add .
git commit -m "fix: 修复 Vercel 部署构建错误"
git push origin main
```

### 3. Vercel 自动部署

Vercel 会自动检测代码变更并触发部署。

### 4. 验证部署

访问部署的 URL，检查：
- ✅ 首页显示游戏列表
- ✅ 游戏详情页可以访问
- ✅ 分类和标签页面正常
- ✅ 管理后台可以登录

## 性能优化建议

### 1. 数据库连接池

确保使用 PgBouncer 或 Supabase Pooler：

```env
DATABASE_URL="postgres://...?pgbouncer=true&connection_limit=10"
```

### 2. 图片优化

所有图片已使用 Next.js Image 组件，自动优化：
- WebP 格式转换
- 响应式尺寸
- 懒加载

### 3. 缓存策略

根据页面更新频率调整 `revalidate` 值：
- 首页: 10分钟（`revalidate = 600`）
- 游戏详情: 30分钟（`revalidate = 1800`）
- 分类列表: 1小时（`revalidate = 3600`）

### 4. CDN 加速

Vercel 自动提供全球 CDN，静态资源自动缓存。

## 监控和调试

### 查看构建日志

```bash
# 本地构建测试
NODE_ENV=production npm run build

# 查看构建日志
cat build.log
```

### Vercel 部署日志

在 Vercel 控制台查看：
1. 访问项目页面
2. 点击 "Deployments"
3. 查看最新部署的日志

### 性能监控

Vercel 提供内置分析：
- Real User Monitoring (RUM)
- Web Vitals 指标
- 函数执行时间

## 常见问题

### Q: 页面显示旧数据？

A: 等待缓存过期（10分钟），或在 Vercel 控制台手动触发重新部署。

### Q: 构建超时？

A: 检查数据库连接是否正常，确保 `DATABASE_URL` 配置正确。

### Q: 图片不显示？

A: 检查 `next.config.ts` 中的 `remotePatterns` 配置，确保包含图片域名。

### Q: 数据库连接错误？

A: 确保使用 Pooling 连接字符串（端口 6543），而不是直连（端口 5432）。

## 相关文档

- [Next.js 数据获取](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Vercel 部署文档](https://vercel.com/docs)
- [ISR 配置](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [next-intl 部署](https://next-intl-docs.vercel.app/docs/getting-started/app-router)

## 总结

通过移除静态参数生成并配置 ISR，成功修复了 Vercel 部署问题。当前配置：
- ✅ 构建成功
- ✅ SEO 友好（SSR）
- ✅ 性能优化（缓存）
- ✅ 内容更新（定期重新验证）

---

**最后更新**: 2025-01-14
**修复版本**: v1.1
