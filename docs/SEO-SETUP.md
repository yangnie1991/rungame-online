# SEO 配置文档

## 📋 概述

本文档说明 RunGame 项目的 SEO 优化配置，包括 robots.txt、sitemap.xml 和其他搜索引擎优化设置。

## 🚀 已实现的 SEO 功能

### 1. robots.txt（动态生成）

**文件位置**: [app/robots.ts](app/robots.ts)

**功能**:
- ✅ 使用 Next.js 15 官方推荐的动态 `robots.ts` 文件
- ✅ 自动禁止爬取管理后台（/admin/）
- ✅ 自动禁止爬取 API 路由（/api/）
- ✅ 自动禁止爬取登录页面（/login）
- ✅ 为不同搜索引擎配置专用规则（Google、Bing）
- ✅ 自动引用 sitemap.xml

**访问地址**:
- 开发环境: http://localhost:3000/robots.txt
- 生产环境: https://rungame.online/robots.txt

**生成内容示例**:

```txt
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login

User-Agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Crawl-delay: 0

User-Agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Crawl-delay: 0

Sitemap: https://rungame.online/sitemap.xml
```

---

### 2. sitemap.xml（动态生成，支持多语言）

**文件位置**: [app/sitemap.ts](app/sitemap.ts)

**功能**:
- ✅ 使用 Next.js 15 官方推荐的动态 `sitemap.ts` 文件
- ✅ 自动从数据库获取所有已发布的游戏
- ✅ 自动生成所有分类、标签、PageType 的 URL
- ✅ 支持多语言（en, zh, es, fr）
- ✅ 包含 `hreflang` 替代 URL（SEO 最佳实践）
- ✅ 自动设置优先级和更新频率
- ✅ 每小时自动重新验证（`revalidate = 3600`）

**访问地址**:
- 开发环境: http://localhost:3000/sitemap.xml
- 生产环境: https://rungame.online/sitemap.xml

**包含的 URL 类型**:

| URL 类型 | 优先级 | 更新频率 | 示例 |
|---------|--------|---------|------|
| 首页 | 1.0 | daily | `/`, `/zh`, `/es`, `/fr` |
| 游戏详情 | 0.8 | weekly | `/games/red-hide-ball`, `/zh/games/red-hide-ball` |
| 分类页面 | 0.7 | daily | `/games/category/puzzle`, `/zh/games/category/puzzle` |
| PageType | 0.7 | daily | `/most-played`, `/zh/most-played` |
| 标签页面 | 0.6 | weekly | `/games/tags/casual`, `/zh/games/tags/casual` |

**多语言支持**:

每个 URL 都包含 `hreflang` 替代链接：

```xml
<url>
  <loc>https://rungame.online/games/red-hide-ball</loc>
  <lastmod>2025-10-14</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="en" href="https://rungame.online/games/red-hide-ball"/>
  <xhtml:link rel="alternate" hreflang="zh" href="https://rungame.online/zh/games/red-hide-ball"/>
  <xhtml:link rel="alternate" hreflang="es" href="https://rungame.online/es/games/red-hide-ball"/>
  <xhtml:link rel="alternate" hreflang="fr" href="https://rungame.online/fr/games/red-hide-ball"/>
</url>
```

---

## 🔧 环境变量配置

### 必需的环境变量

在 `.env.local` 或生产环境中配置：

```env
# 网站 URL（用于 SEO、sitemap、robots.txt）
# 开发环境
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 生产环境
NEXT_PUBLIC_SITE_URL="https://rungame.online"

# Google Analytics（可选）
NEXT_PUBLIC_GA_ID="G-DXC4W78DF6"
```

### 为什么需要 NEXT_PUBLIC_SITE_URL？

- robots.txt 需要知道 sitemap.xml 的完整 URL
- sitemap.xml 需要生成完整的 URL（包含域名）
- 多语言 hreflang 链接需要完整 URL

**重要**: 在生产环境部署前，务必设置正确的 `NEXT_PUBLIC_SITE_URL`！

---

## 📊 SEO 优化技术细节

### 1. 优先级（Priority）设置

优先级范围：0.0 - 1.0

| 页面类型 | 优先级 | 原因 |
|---------|--------|------|
| 首页 | 1.0 | 最重要的入口页面 |
| 游戏详情 | 0.8 | 核心内容页面，包含大量独特内容 |
| 分类页面 | 0.7 | 重要的导航页面 |
| PageType | 0.7 | 动态内容聚合页面 |
| 标签页面 | 0.6 | 次要的导航页面 |

### 2. 更新频率（Change Frequency）

| 页面类型 | 更新频率 | 原因 |
|---------|---------|------|
| 首页 | daily | 经常添加新游戏 |
| 分类页面 | daily | 分类下的游戏经常变化 |
| PageType | daily | 动态内容列表 |
| 游戏详情 | weekly | 游戏信息相对稳定 |
| 标签页面 | weekly | 标签下的游戏相对稳定 |

### 3. 多语言 SEO（Hreflang）

**为什么重要**:
- 告诉搜索引擎不同语言版本的页面关系
- 防止重复内容惩罚
- 提高国际化 SEO 效果

**实现方式**:

```typescript
alternates: {
  languages: {
    en: 'https://rungame.online/games/red-hide-ball',
    zh: 'https://rungame.online/zh/games/red-hide-ball',
    es: 'https://rungame.online/es/games/red-hide-ball',
    fr: 'https://rungame.online/fr/games/red-hide-ball',
  }
}
```

这会在 sitemap.xml 中生成：

```xml
<xhtml:link rel="alternate" hreflang="en" href="..."/>
<xhtml:link rel="alternate" hreflang="zh" href="..."/>
...
```

---

## 🧪 测试和验证

### 1. 本地测试

**测试 robots.txt**:

```bash
# 启动开发服务器
npm run dev

# 访问 robots.txt
curl http://localhost:3000/robots.txt

# 或在浏览器中访问
open http://localhost:3000/robots.txt
```

**测试 sitemap.xml**:

```bash
# 访问 sitemap.xml
curl http://localhost:3000/sitemap.xml

# 或在浏览器中访问
open http://localhost:3000/sitemap.xml
```

### 2. 生产环境验证

**使用 Google Search Console**:

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加您的网站属性
3. 在左侧菜单 → 索引 → 站点地图
4. 提交 sitemap: `https://rungame.online/sitemap.xml`
5. 检查是否有错误

**使用 Bing Webmaster Tools**:

1. 访问 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 添加您的网站
3. 提交 sitemap: `https://rungame.online/sitemap.xml`

### 3. 在线工具验证

**验证 robots.txt**:
- [Google Robots Testing Tool](https://www.google.com/webmasters/tools/robots-testing-tool)
- [Bing Robots.txt Tester](https://www.bing.com/webmaster)

**验证 sitemap.xml**:
- [XML-Sitemaps.com Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Merkle XML Sitemap Validator](https://technicalseo.com/tools/xml-sitemap-validator/)

**验证 Hreflang**:
- [Hreflang Tags Testing Tool](https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/)

---

## 🚀 部署清单

在部署到生产环境前，请确保：

### 必需配置

- [ ] 在 Vercel 环境变量中设置 `NEXT_PUBLIC_SITE_URL`
  ```
  NEXT_PUBLIC_SITE_URL=https://rungame.online
  ```

- [ ] 验证 sitemap.xml 可以访问
  ```
  https://rungame.online/sitemap.xml
  ```

- [ ] 验证 robots.txt 可以访问
  ```
  https://rungame.online/robots.txt
  ```

### Google Search Console

- [ ] 添加网站属性
- [ ] 提交 sitemap.xml
- [ ] 验证域名所有权
- [ ] 检查索引覆盖率

### Bing Webmaster Tools

- [ ] 添加网站
- [ ] 提交 sitemap.xml
- [ ] 验证域名所有权

### 其他搜索引擎（可选）

- [ ] Yandex Webmaster
- [ ] Baidu Webmaster Tools（如果目标中国市场）

---

## 📈 性能优化

### Sitemap 缓存策略

当前配置：

```typescript
export const dynamic = 'force-dynamic'  // 动态生成
export const revalidate = 3600          // 每小时重新验证
```

**为什么这样配置**:
- `force-dynamic`: 确保 sitemap 始终是最新的
- `revalidate = 3600`: 避免每次请求都查询数据库，减轻服务器负担

**如果网站更新不频繁**，可以增加重新验证时间：

```typescript
export const revalidate = 86400  // 每天重新验证一次
```

**如果网站更新非常频繁**，可以减少重新验证时间：

```typescript
export const revalidate = 1800  // 每30分钟重新验证一次
```

### 数据库查询优化

当前 sitemap 生成时的查询已优化：

1. **只查询必要字段**：
   ```typescript
   select: {
     slug: true,
     updatedAt: true,
   }
   ```

2. **按热门程度排序**：
   ```typescript
   orderBy: { playCount: 'desc' }
   ```

3. **使用数据库聚合**：
   ```typescript
   _count: {
     select: {
       games: { where: { isPublished: true } }
     }
   }
   ```

---

## 🔍 常见问题

### Q1: sitemap.xml 中的 URL 数量有限制吗？

**A**: 是的，Google 建议单个 sitemap 文件不超过 50,000 个 URL，文件大小不超过 50MB。

如果超过限制，需要使用 **sitemap 索引**：

```typescript
// app/sitemap-index.xml/route.ts
export async function GET() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://rungame.online/sitemap-games.xml</loc>
      </sitemap>
      <sitemap>
        <loc>https://rungame.online/sitemap-categories.xml</loc>
      </sitemap>
    </sitemapindex>
  `)
}
```

### Q2: robots.txt 可以阻止恶意爬虫吗？

**A**: **不能**。`robots.txt` 只是一个建议，遵守与否取决于爬虫。恶意爬虫通常会忽略 robots.txt。

要阻止恶意爬虫，需要：
1. 使用服务器级别的 IP 封禁
2. 使用 WAF（Web Application Firewall）
3. 使用 Cloudflare 等 CDN 的防护功能

### Q3: sitemap 中应该包含所有页面吗？

**A**: **不是**。只应包含：
- ✅ 希望被搜索引擎索引的页面
- ✅ 可以被公开访问的页面
- ❌ 不要包含：管理后台、登录页、API 路由、重复内容

### Q4: 多久提交一次 sitemap？

**A**: **一次即可**。提交到 Google Search Console 和 Bing Webmaster Tools 后，搜索引擎会定期自动检查更新。

只有在以下情况需要重新提交：
- 网站结构发生重大变化
- sitemap URL 改变
- sitemap 格式错误需要修复

### Q5: hreflang 标签是必需的吗？

**A**: 对于多语言网站，**强烈推荐**。好处包括：
- 避免重复内容惩罚
- 提高国际化 SEO
- 为用户显示正确语言的搜索结果

---

## 📚 相关资源

### 官方文档

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Next.js robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Google Search Central](https://developers.google.com/search)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)

### SEO 工具

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

### 相关文件

- [app/robots.ts](app/robots.ts) - robots.txt 生成器
- [app/sitemap.ts](app/sitemap.ts) - sitemap.xml 生成器
- [.env.example](.env.example) - 环境变量示例
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - 部署指南

---

## ✅ 下一步

1. **本地测试**:
   ```bash
   npm run dev
   open http://localhost:3000/robots.txt
   open http://localhost:3000/sitemap.xml
   ```

2. **部署到生产环境**

3. **提交到搜索引擎**:
   - Google Search Console
   - Bing Webmaster Tools

4. **监控索引状态**:
   - 定期检查 Google Search Console
   - 查看索引覆盖率报告
   - 修复任何索引错误

5. **持续优化**:
   - 根据搜索引擎反馈调整优先级
   - 优化页面标题和描述
   - 提高页面加载速度

---

**最后更新**: 2025-10-14
**状态**: ✅ 已实现并测试
**Next.js 版本**: 15.5.4
