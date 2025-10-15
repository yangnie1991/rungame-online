# 必备页面实现说明

本文档说明了 Google AdSense 审核所需的4个必备页面的实现方式。

## 页面列表

| 页面 | 路径 | 用途 |
|------|------|------|
| About Us | `/about` | 关于我们，介绍网站和使命 |
| Privacy Policy | `/privacy` | 隐私政策，包含 Google AdSense 和 Cookie 使用声明 |
| Terms of Service | `/terms` | 使用条款，服务规则和法律声明 |
| Contact Us | `/contact` | 联系我们，提供联系方式 |

## 实现方式

### 技术方案

这些页面使用 **独立静态页面 + next-intl 翻译文件** 的方式实现，而不是使用 PageType 动态系统。

**原因**:
1. 这些页面内容不会频繁变更
2. 不需要通过管理后台修改
3. 静态页面性能更好（无数据库查询）
4. 更符合 next-intl 最佳实践
5. 维护更简单（直接编辑 JSON 文件）

### 文件结构

```
app/(site)/[locale]/
├── about/page.tsx          # 关于我们页面
├── privacy/page.tsx        # 隐私政策页面
├── terms/page.tsx          # 使用条款页面
└── contact/page.tsx        # 联系我们页面

i18n/messages/
├── en.json                 # 英文翻译
└── zh.json                 # 中文翻译
```

### 翻译文件格式

每个页面在翻译文件中有独立的命名空间：

```json
{
  "about": {
    "title": "About Us",
    "subtitle": "Learn more about RunGame",
    "metaTitle": "About Us - RunGame Free Online Games",
    "metaDescription": "...",
    "content": "<h2>Who We Are</h2><p>...</p>..."
  },
  "privacy": { ... },
  "terms": { ... },
  "contact": { ... }
}
```

### 页面组件结构

每个页面都遵循相同的结构：

```typescript
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 面包屑导航 */}
      <nav>...</nav>

      {/* 页面标题 */}
      <div>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>

      {/* 内容 - 使用 dangerouslySetInnerHTML 渲染 HTML */}
      <article>
        <div dangerouslySetInnerHTML={{ __html: t.raw("content") }} />
      </article>

      {/* 返回首页 */}
      <div>...</div>
    </div>
  )
}
```

## 样式特性

- ✅ 响应式设计（移动端友好）
- ✅ 深色模式支持
- ✅ Tailwind Typography (prose) 样式
- ✅ 卡片式布局
- ✅ 完整的 SEO metadata

## 内容管理

### 如何修改页面内容

1. 打开对应的翻译文件：
   - 英文：`i18n/messages/en.json`
   - 中文：`i18n/messages/zh.json`

2. 找到对应的命名空间（about, privacy, terms, contact）

3. 修改 `content` 字段中的 HTML 内容

4. 提交并推送到 Git 仓库

5. Vercel 自动部署

**无需数据库操作！**

### 支持的 HTML 标签

内容支持完整的 HTML 标签：
- 标题：`<h2>`, `<h3>`
- 段落：`<p>`
- 列表：`<ul>`, `<ol>`, `<li>`
- 链接：`<a href="..." target="_blank" rel="noopener noreferrer">`
- 强调：`<strong>`, `<em>`
- 代码：`<code>`

## Google AdSense 要求

### Privacy Policy 页面必须包含的内容

我们的 Privacy Policy 页面已包含所有必需内容：

1. ✅ **信息收集说明** - 自动收集的信息类型
2. ✅ **Cookie 使用说明** - Cookie 类型和用途
3. ✅ **Google AdSense 说明** - 详细说明 Google 如何使用 Cookie
4. ✅ **Google Analytics 说明** - 分析工具使用说明
5. ✅ **用户隐私权** - 用户的权利和选择
6. ✅ **联系方式** - 隐私问题联系邮箱
7. ✅ **选择退出链接** - Google Ads Settings 和 aboutads.info 链接

### 其他必备内容

- ✅ **About Us** - 详细介绍网站使命和价值观
- ✅ **Terms of Service** - 完整的使用条款和免责声明
- ✅ **Contact Us** - 多种联系方式

## URL 结构

### 英文版本
- https://rungame.online/about
- https://rungame.online/privacy
- https://rungame.online/terms
- https://rungame.online/contact

### 中文版本
- https://rungame.online/zh/about
- https://rungame.online/zh/privacy
- https://rungame.online/zh/terms
- https://rungame.online/zh/contact

## 添加新语言

如果需要添加新语言（如西班牙语、法语）：

1. 在 `i18n/messages/` 创建新的语言文件（如 `es.json`, `fr.json`）
2. 添加相同的命名空间和字段
3. 翻译所有内容
4. 页面会自动支持新语言

## 注意事项

1. **不要使用 PageType 系统** - 这些页面是独立的静态页面
2. **保持 HTML 格式** - 内容以 HTML 格式存储在翻译文件中
3. **定期更新日期** - Privacy Policy 和 Terms 页面包含"最后更新"日期
4. **保持一致性** - 所有语言版本的内容结构应保持一致

## 数据库清理

已从数据库中删除之前创建的 PageType 记录：
- ❌ about (STATIC_CONTENT)
- ❌ privacy (STATIC_CONTENT)
- ❌ terms (STATIC_CONTENT)
- ❌ contact (STATIC_CONTENT)

当前数据库中只保留游戏列表相关的 PageType：
- ✅ most-played (GAME_LIST)
- ✅ new-games (GAME_LIST)
- ✅ trending (GAME_LIST)
- ✅ featured (GAME_LIST)

---

**最后更新**: 2025-01-15
