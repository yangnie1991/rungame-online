# SEO问题修复报告

**日期**: 2025-11-06
**版本**: v1.0

## 概述

本报告记录了在2025年1月6日发现并修复的多个SEO相关问题。

## 问题列表

### ✅ 已修复的问题

#### 1. 首页hreflang尾部斜杠不一致

**问题描述**:
- 中文首页的hreflang指向 `https://rungame.online/zh/`
- 但该URL会308重定向到 `https://rungame.online/zh`
- 违反Google最佳实践：hreflang应指向最终URL，而非重定向URL

**根本原因**:
- `lib/seo-helpers.ts` 中的 `generateAlternateLanguages()` 函数对非默认语言的首页添加了尾部斜杠

**修复方案**:
```typescript
// 修复前
languages[hreflangCode] = `${siteUrl}/${locale}/`

// 修复后
const localizedPath = cleanPath === '/' ? '' : cleanPath
languages[hreflangCode] = `${siteUrl}/${locale}${localizedPath}`
```

**影响文件**:
- [lib/seo-helpers.ts](../lib/seo-helpers.ts#L79-L81)
- [app/(site)/[locale]/page.tsx](../app/(site)/[locale]/page.tsx#L92)

**参考资料**:
- [Google hreflang最佳实践](https://developers.google.com/search/docs/specialty/international/localized-versions)

---

#### 2. 静态页面/zh/zh重复语言前缀

**问题描述**:
- 静态页面（about, privacy, terms, contact）的面包屑导航显示 `/zh/zh`
- 原因：`<Link href={`/${locale}`}>` 会被next-intl自动添加语言前缀

**根本原因**:
- next-intl的Link组件会自动为href添加当前locale前缀
- 手动拼接 `/${locale}` 导致双重前缀

**修复方案**:
```tsx
// 修复前
<Link href={`/${locale}`}>首页</Link>

// 修复后
<Link href="/">首页</Link>
```

**影响文件**:
- [app/(site)/[locale]/about/page.tsx](../app/(site)/[locale]/about/page.tsx#L65)
- [app/(site)/[locale]/privacy/page.tsx](../app/(site)/[locale]/privacy/page.tsx)
- [app/(site)/[locale]/terms/page.tsx](../app/(site)/[locale]/terms/page.tsx)
- [app/(site)/[locale]/contact/page.tsx](../app/(site)/[locale]/contact/page.tsx)

---

#### 3. GameCard组件标签链接使用中文slug

**问题描述**:
- GameCard组件渲染的标签链接出现中文URL：`/zh/tag/街机游戏`
- 正确应该是：`/zh/tag/arcade`

**根本原因**:
- GameCard组件的tag参数支持两种类型：`string | { name: string; slug?: string }`
- 当tag是字符串类型且内容为中文时（如"街机游戏"），代码尝试用 `toLowerCase().replace(/\s+/g, '-')` 生成slug
- 这对中文无效，导致直接使用中文作为URL

**修复方案**:
```tsx
// 修复前
const tagSlug = typeof tag === 'string'
  ? tagName.toLowerCase().replace(/\s+/g, '-')
  : tag.slug || tagName.toLowerCase().replace(/\s+/g, '-')

// 修复后
const tagSlug = typeof tag === 'string'
  ? null // 字符串类型不生成链接
  : tag.slug

// 没有有效slug时只显示文本，不生成链接
if (!tagSlug || !enableTagLinks) {
  return <span>#{tagName}</span>
}
```

**影响文件**:
- [components/site/GameCard.tsx](../components/site/GameCard.tsx#L106-L141)
- [components/site/GameSection.tsx](../components/site/GameSection.tsx#L95) - 修改为传递完整对象
- [lib/data/games/detail.ts](../lib/data/games/detail.ts#L263-L265) - 修复 getRecommendedGames 函数

**技术说明**:
- 数据库中Tag.slug字段是正确的英文
- 问题出在某些地方传递给GameCard的是翻译后的中文字符串
- 修复分为两步：
  1. **GameCard组件**：拒绝为字符串类型的tag生成链接
  2. **数据源函数**：确保所有数据源返回对象数组（含slug）而非字符串数组

**数据源修复**:
```typescript
// lib/data/games/detail.ts - getRecommendedGames()
// 修复前（返回字符串数组）
const [categoryTranslations, tagTranslations] = await Promise.all([
  getAllCategoryTranslationsMap(locale),
  getAllTagTranslationsMap(locale),  // ❌ 只返回翻译后的名称
])
tags: game.tags.map((t) => tagTranslations[t.tagId] || "").filter(Boolean)

// 修复后（返回对象数组）
const [categoryTranslations, tagsDataMap] = await Promise.all([
  getAllCategoryTranslationsMap(locale),
  getAllTagsDataMap(locale),  // ✅ 返回 { slug, name }
])
tags: game.tags
  .map((t) => tagsDataMap[t.tagId])
  .filter((tag): tag is { slug: string; name: string } => tag !== undefined)
```

**影响范围分析**:
- ✅ [GameSection.tsx](../components/site/GameSection.tsx) - 已修复
- ✅ [RecommendedGames.tsx](../components/site/RecommendedGames.tsx) - SameCategoryGames 使用 getMixedRecommendedGames (已正确)
- ✅ [RecommendedGames.tsx](../components/site/RecommendedGames.tsx) - RecommendedGamesSidebar 使用 getRecommendedGames (已修复)
- ✅ [search/page.tsx](../app/(site)/[locale]/search/page.tsx) - 不传递 tags，无影响
- ✅ [games/page.tsx](../app/(site)/[locale]/games/page.tsx) - 不传递 tags，无影响
- ✅ [category 页面](../app/(site)/[locale]/category) - 不传递 tags，无影响

---

### ❓ 需要进一步验证的问题

#### 4. 非存在的分类链接

**用户报告**: `/zh/racing-games` 这种不存在的主分类链接

**状态**: 需要验证是否真实存在，当前未在代码中发现

**建议**: 使用搜索工具在全站HTML中查找此类链接

---

### ℹ️ 不存在的问题（误报）

#### 5. 缺少自引用hreflang

**用户报告**: 子分类、pageType、games、play详情页、tag页、主分类、静态页缺少hreflang

**验证结果**:
- 检查了所有页面类型的metadata生成代码
- 所有页面都正确包含 `canonical` 和 `languages`（hreflang）
- 该问题不存在

**检查的文件**:
- [app/(site)/[locale]/play/[slug]/page.tsx](../app/(site)/[locale]/play/[slug]/page.tsx)
- [app/(site)/[locale]/tag/[tag]/page.tsx](../app/(site)/[locale]/tag/[tag]/page.tsx)
- [app/(site)/[locale]/category/[category]/page.tsx](../app/(site)/[locale]/category/[category]/page.tsx)
- 所有静态页面

---

## Google SEO最佳实践参考

### Hreflang标签

根据Google官方文档，hreflang标签必须：

1. **指向最终URL**: 不能指向重定向的URL
2. **使用完全限定URL**: 必须包含协议（https://）和域名
3. **保持一致性**: canonical、hreflang和内部链接应指向同一URL
4. **格式要求**: 使用 `language-REGION` 格式（如 `en-US`, `zh-CN`）
5. **包含x-default**: 为未匹配的语言提供回退选项

### URL结构

1. **尾部斜杠一致性**:
   - Next.js默认 `trailingSlash: false`
   - 所有URL应不带尾部斜杠（除非目录索引）
   - 示例：`/zh` 而不是 `/zh/`

2. **多语言URL模式**:
   - 默认语言：`/path` （无前缀）
   - 其他语言：`/zh/path` （带前缀）
   - 首页特殊处理：`/` 和 `/zh`（不是 `/zh/`）

### 内部链接

1. **使用next-intl的Link组件**: 自动处理语言前缀
2. **避免手动拼接语言代码**: 防止双重前缀
3. **URL一致性**: 内部链接应与canonical URL匹配

---

## 技术总结

### 修复的代码模式

1. **多语言URL生成**:
   ```typescript
   // ❌ 错误
   href={`/${locale}/path`}

   // ✅ 正确
   href="/path" // next-intl自动添加前缀
   ```

2. **Hreflang生成**:
   ```typescript
   // ❌ 错误（首页）
   languages['zh-CN'] = `${siteUrl}/zh/`

   // ✅ 正确
   languages['zh-CN'] = `${siteUrl}/zh`
   ```

3. **Tag slug处理**:
   ```typescript
   // ❌ 错误（中文无效）
   slug = tagName.toLowerCase().replace(/\s+/g, '-')

   // ✅ 正确
   slug = tag.slug || null // 只使用数据库中的英文slug
   ```

---

## 相关文档

- [SEO完整指南](./SEO.md)
- [多语言实现](./I18N.md)
- [项目架构](./ARCHITECTURE.md)

---

**报告生成时间**: 2025-11-06
**修复提交**: 6c9baba (fix: 修复多语言SEO问题)
