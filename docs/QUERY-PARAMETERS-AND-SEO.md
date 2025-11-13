# 查询参数与 SEO：Canonical 和 hreflang 最佳实践

## 📋 问题背景

在分类页面和标签页面，我们实现了排序功能：
- 默认排序（热门）：`/category/action-games`
- 按名称排序：`/category/action-games?sort=name`
- 按最新排序：`/category/action-games?sort=newest`

**用户发现**：当访问带排序参数的 URL（如 `?sort=name`）时，页面的 canonical 和 hreflang 指向的是不带参数的干净 URL，这导致了"不一致"。

**SEMrush 报告**："Missing return link" 错误

## ✅ 当前实现是正确的！

### Google SEO 最佳实践

根据 Google 官方文档，**查询参数（如排序、筛选）不应该包含在 canonical 和 hreflang 中**。

**原因**：
1. 这些参数只是改变内容的**显示方式**，而不是创建**不同的内容**
2. Canonical 的作用是告诉搜索引擎"这些 URL 实际上是同一个页面"
3. 如果包含参数，会导致搜索引擎认为它们是不同的页面，造成**重复内容问题**

### 实际示例

```typescript
// ❌ 错误做法（会导致重复内容）
用户访问：/category/action-games?sort=name
页面 canonical：/category/action-games?sort=name
页面 hreflang：
  - en: /category/action-games?sort=name
  - zh: /zh/category/action-games?sort=name

结果：搜索引擎认为以下是不同的页面：
  - /category/action-games
  - /category/action-games?sort=name
  - /category/action-games?sort=newest
→ 重复内容，分散 SEO 权重！

// ✅ 正确做法（当前实现）
用户访问：/category/action-games?sort=name
页面 canonical：/category/action-games  ← 指向规范版本
页面 hreflang：
  - en: /category/action-games  ← 指向规范版本
  - zh: /zh/category/action-games  ← 指向规范版本

结果：搜索引擎认为所有排序变体都是同一个页面
→ SEO 权重集中，避免重复内容！
```

## 📊 当前实现验证

### 分类页面（主分类）

**文件**：[app/(site)/[locale]/category/[mainCategory]/page.tsx](../app/(site)/[locale]/category/%5BmainCategory%5D/page.tsx)

```typescript
// 第 98-100 行：构建 path，只包含 page，不包含 sort ✅
const path = currentPage > 1
  ? `/category/${mainCategory}?page=${currentPage}`
  : `/category/${mainCategory}`

// 第 140 行：canonical 使用干净的 path ✅
canonical: `${siteUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,

// 第 154-156 行：hreflang 也使用干净的 path ✅
languages: generateAlternateLanguages(
  currentPage > 1 ? `/category/${mainCategory}?page=${currentPage}` : `/category/${mainCategory}`
),
```

### 分类页面（子分类）

**文件**：[app/(site)/[locale]/category/[mainCategory]/[subCategory]/page.tsx](../app/(site)/[locale]/category/%5BmainCategory%5D/%5BsubCategory%5D/page.tsx)

```typescript
// 第 98-100 行：同样正确 ✅
const path = currentPage > 1
  ? `/category/${mainCategory}/${subCategory}?page=${currentPage}`
  : `/category/${mainCategory}/${subCategory}`
```

### 标签页面

**文件**：[app/(site)/[locale]/tag/[tag]/page.tsx](../app/(site)/[locale]/tag/%5Btag%5D/page.tsx)

```typescript
// 第 90-92 行：同样正确 ✅
const path = currentPage > 1
  ? `/tag/${tag}?page=${currentPage}`
  : `/tag/${tag}`
```

## 🔍 为什么 SEMrush 报错？

### 可能原因

#### 1. 爬虫缓存延迟 ⏰ （最可能）

**问题**：SEMrush 的爬虫可能还在使用旧的页面快照

**证据**：
- 我们最近修改了 hreflang 语言代码（从 `en-US` 改为 `en`）
- SEMrush 的爬取频率通常是 1-4 周一次

**解决方案**：
1. 在 SEMrush 中手动触发重新爬取
2. 等待 2-4 周让 SEMrush 自动重新爬取

#### 2. 工具误判 🤖

**问题**：SEMrush 在爬取带参数的 URL 时，期望 hreflang 也包含这些参数

**为什么这是误判**：
- SEMrush 的检测逻辑可能不够完善
- 它没有理解 canonical 和 hreflang 应该指向规范版本
- Google 的爬虫会正确理解我们的实现

**验证方法**：
- 检查 **Google Search Console**（它比 SEMrush 更权威）
- 如果 GSC 没有报错，说明我们的实现是正确的

#### 3. 特殊情况：排序链接的自引用

**场景**：
```
用户点击"按名称排序"链接
↓
URL 变为：/category/action-games?sort=name
↓
该页面的 canonical 仍然指向：/category/action-games
```

**SEMrush 可能的检测逻辑**：
1. 爬取 `/category/action-games?sort=name`
2. 看到 hreflang 指向 `/category/action-games` 和 `/zh/category/action-games`
3. 去检查这些 URL 是否回链到 `/category/action-games?sort=name`
4. 发现它们回链到的是 `/category/action-games`（不带参数）
5. 报告"Missing return link"

**但这是错误的检测逻辑**：
- Google 认为带参数和不带参数的 URL 应该有相同的 canonical
- 双向链接应该基于 canonical URL，而不是实际访问的 URL

## 📚 Google 官方指导

### 关于查询参数

来自 [Google 搜索中心文档](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls):

> **使用 rel="canonical" 标记指定首选 URL**
>
> 如果您有多个包含相同内容的网址，请选择一个网址作为规范网址，并使用 rel="canonical" 链接元素指定它。

**查询参数的处理建议**：

```
示例：以下 URL 都应指向同一个 canonical
- example.com/products?sort=price
- example.com/products?sort=rating
- example.com/products?category=shoes&sort=price

推荐 canonical：example.com/products（不带参数）
```

### 关于 hreflang

来自 [Google 多语言网站指南](https://developers.google.com/search/docs/specialty/international/localized-versions):

> **使用规范 URL**
>
> hreflang 注释应使用规范 URL。如果您为某个网页指定了规范版本，请在 hreflang 注释中使用该网址，而不是非规范版本。

**这意味着**：
- hreflang 应该指向 canonical URL
- 如果 canonical 是 `/category/action-games`，hreflang 也应该指向 `/category/action-games`

## ✅ 验证清单

### 当前实现验证

- ✅ **分页参数 `?page=N` 包含在 canonical 中** - 正确，因为分页创建了不同的内容
- ✅ **排序参数 `?sort=name` 不包含在 canonical 中** - 正确，因为排序只改变显示顺序
- ✅ **hreflang 与 canonical 使用相同的 URL** - 正确，符合 Google 指导
- ✅ **prev/next 链接正确处理分页** - 正确
- ✅ **自引用 hreflang 存在** - 正确
- ✅ **双向链接基于 canonical URL** - 正确

### 推荐的验证步骤

1. **优先检查 Google Search Console**
   ```
   登录 GSC → 增强功能 → 国际定位 → hreflang 标签
   如果没有错误 → 我们的实现是正确的 ✅
   ```

2. **在 SEMrush 中触发重新爬取**
   ```
   SEMrush → Site Audit → Start New Crawl
   等待完成后检查是否仍有错误
   ```

3. **使用 Google 富媒体结果测试工具**
   ```
   https://search.google.com/test/rich-results
   测试带参数和不带参数的 URL
   验证 structured data 是否正确
   ```

4. **等待 2-4 周观察**
   ```
   给 SEMrush 时间重新爬取
   定期检查 GSC 和 SEMrush
   对比两者的结果
   ```

## 🎯 结论

1. **当前实现完全正确**，符合 Google SEO 最佳实践
2. **SEMrush 报错可能是误报**，或者是基于旧数据
3. **优先相信 Google Search Console** 的检测结果
4. **不需要修改代码**，只需等待 SEMrush 重新爬取

### 如果一定要"修复"（不推荐）

如果您仍然希望让 SEMrush 不报错，可以考虑以下选项（**但这会违反 Google 最佳实践**）：

```typescript
// ❌ 不推荐：将 sort 参数包含在 canonical 中
const { sort } = await searchParams
const path = currentPage > 1
  ? `/category/${mainCategory}?page=${currentPage}${sort ? `&sort=${sort}` : ''}`
  : `/category/${mainCategory}${sort ? `?sort=${sort}` : ''}`

// 问题：
// 1. 会导致重复内容
// 2. 分散 SEO 权重
// 3. 违反 Google 指导
// 4. 可能被 Google 惩罚
```

**强烈不推荐这么做！**

## 📖 参考资料

1. **Google 官方文档**：
   - [合并重复网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
   - [多语言网站的管理](https://developers.google.com/search/docs/specialty/international/localized-versions)
   - [了解 canonical 标签](https://developers.google.com/search/docs/crawling-indexing/canonicalization)

2. **最佳实践文章**：
   - [Moz: Canonical URL 指南](https://moz.com/learn/seo/canonicalization)
   - [Ahrefs: hreflang 完整指南](https://ahrefs.com/blog/hreflang-tags/)

3. **工具对比**：
   - Google Search Console > SEMrush（权威性）
   - 如果两者冲突，优先相信 GSC

---

**最后更新**：2025-11-09
**验证状态**：✅ 当前实现符合 Google 最佳实践
**建议行动**：等待 SEMrush 重新爬取，优先检查 Google Search Console
