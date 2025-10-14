# 国际化回退修复报告

**生成日期**: 2025-10-14
**项目**: RunGame.Online
**分支**: `feature/admin-spa-refactor`
**扫描范围**: 所有 Server Actions 文件

---

## 📊 扫描结果总览

扫描了 **5 个 actions 文件**：

| 文件路径 | 状态 | 发现问题 |
|---------|------|---------|
| `app/(site)/actions.ts` | ⚠️ **有问题** | 73处国际化回退问题 |
| `app/(admin)/admin/tags/actions.ts` | ✅ **正常** | 管理端CRUD操作，无国际化查询 |
| `app/(admin)/admin/categories/actions.ts` | ✅ **正常** | 管理端CRUD操作，无国际化查询 |
| `app/(admin)/admin/languages/actions.ts` | ✅ **正常** | 语言管理，无翻译回退需求 |
| `app/(admin)/admin/page-types/actions.ts` | ✅ **正常** | 管理端CRUD操作，无国际化查询 |

### 结论

✅ **管理端 actions 文件全部正常**：管理端文件使用完整翻译数据（`include: { translations: true }`），由前端表单处理多语言，不存在回退问题。

⚠️ **用户端 actions 文件存在问题**：`app/(site)/actions.ts` 包含所有用户端展示逻辑，存在 **73 处**国际化回退问题。

---

## 🔴 问题详细分析：`app/(site)/actions.ts`

### 问题类型统计

| 问题类型 | 数量 | 严重程度 |
|---------|------|----------|
| 使用 `where: { locale }` 而非 `buildLocaleCondition(locale)` | **18处** | 🔴 高 |
| 使用 `translations[0]?.field` 而非 `getTranslatedField()` | **38处** | 🔴 高 |
| 缺少 `locale: true` 的查询 | **17处** | 🟡 中 |
| **总计** | **73处** | |

### 核心问题说明

#### 问题 1：查询条件缺少回退机制

**错误模式**：
```typescript
translations: {
  where: { locale },  // ❌ 只查询当前语言
  select: { title: true },
}
```

**正确模式**：
```typescript
translations: {
  where: buildLocaleCondition(locale),  // ✅ 查询当前语言 + 英文（回退）
  select: { title: true, locale: true },  // 必须包含 locale 字段
}
```

**影响**：当数据库中缺少当前语言的翻译时，返回空数组而非回退到英文。

---

#### 问题 2：数据访问缺少回退逻辑

**错误模式**：
```typescript
title: game.translations[0]?.title || "Untitled"  // ❌ 直接访问第一条
```

**正确模式**：
```typescript
title: getTranslatedField(game.translations, locale, "title", "Untitled")  // ✅ 智能回退
```

**`getTranslatedField()` 回退策略**：
1. 优先返回当前语言（如 `zh`）
2. 如果不存在，回退到英文（`en`）
3. 如果英文也不存在，返回第一个可用翻译
4. 如果完全没有翻译，返回默认值

---

#### 问题 3：缺少 `locale` 字段导致类型错误

**错误模式**：
```typescript
select: { title: true }  // ❌ 缺少 locale 字段
```

**TypeScript 错误**：
```
类型"{ title: string; }[]"的参数不能赋给类型"Translation[]"的参数。
类型 "{ title: string; }" 中缺少属性 "locale"，但类型 "Translation" 中需要该属性。
```

**正确模式**：
```typescript
select: { title: true, locale: true }  // ✅ 必须包含 locale
```

---

## 📋 需要修复的函数清单

### ✅ 已正确实现（10个函数）- 无需修复

| 函数名 | 行号 | 状态 |
|-------|------|------|
| `getDefaultLanguage()` | 10-15 | ✅ 无翻译需求 |
| `getEnabledLanguages()` | 20-26 | ✅ 无翻译需求 |
| `getFeaturedGames()` | 31-86 | ✅ 正确实现 |
| `getPublishedGames()` | 91-126 | ✅ 正确实现 |
| `getGameBySlug()` | 131-204 | ✅ 正确实现（最佳实践）|
| `incrementPlayCount()` | 209-220 | ✅ 无翻译需求 |
| `getGamesByCategory()` | 225-307 | ✅ 正确实现 |
| `getAllCategories()` | 364-384 | ✅ 正确实现 |
| `getAllTags()` | 389-410 | ✅ 正确实现 |
| `getAllPageTypes()` | 679-698 | ✅ 正确实现 |

---

### ⚠️ 需要修复（8个函数）

#### 优先级 P0 - 首页相关（影响最大）

##### 1. `getMostPlayedGames()` - Line 415-460

**影响页面**：首页"最受欢迎游戏"section

**问题位置**：
```typescript
// Line 457 - ❌ 错误
category: game.category.translations[0]?.name || "",

// Line 458 - ❌ 错误
tags: game.tags.map((t) => t.tag.translations[0]?.name || ""),
```

**修复方案**：
```typescript
// ✅ 正确
category: getTranslatedField(game.category.translations, locale, "name", ""),
tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
```

---

##### 2. `getTrendingGames()` - Line 465-514

**影响页面**：首页"热门趋势游戏"section

**问题位置**：
```typescript
// Line 511 - ❌ 错误
category: game.category.translations[0]?.name || "",

// Line 512 - ❌ 错误
tags: game.tags.map((t) => t.tag.translations[0]?.name || ""),
```

**修复方案**：与 `getMostPlayedGames()` 相同

---

##### 3. `getGamesByTagSlug()` - Line 519-578

**影响页面**：首页游戏分组section（如 IO Games, Puzzle Games）

**问题位置**：
```typescript
// Line 532-536 - ❌ 错误：游戏翻译查询
translations: {
  where: { locale },  // 缺少回退
  select: {
    title: true,
    description: true,
  },
}

// Line 550-553 - ❌ 错误：标签翻译查询
translations: {
  where: { locale },  // 缺少回退
  select: { name: true },  // 缺少 locale 字段
}

// Line 573-576 - ❌ 错误：数据访问
title: gt.game.translations[0]?.title || "Untitled",
description: gt.game.translations[0]?.description || "",
category: gt.game.category.translations[0]?.name || "",
tags: gt.game.tags.map((t) => t.tag.translations[0]?.name || ""),
```

**修复方案**：
```typescript
// ✅ 正确：查询
translations: {
  where: buildLocaleCondition(locale),
  select: {
    title: true,
    description: true,
    locale: true,  // 必须添加
  },
}

// ✅ 正确：数据访问
title: getTranslatedField(gt.game.translations, locale, "title", "Untitled"),
description: getTranslatedField(gt.game.translations, locale, "description", ""),
category: getTranslatedField(gt.game.category.translations, locale, "name", ""),
tags: gt.game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
```

---

#### 优先级 P0 - 游戏详情页

##### 4. `getRecommendedGames()` - Line 583-674

**影响页面**：游戏详情页推荐游戏section

**问题位置**：
```typescript
// Line 598-600 - ❌ 错误：第一批推荐游戏翻译
translations: {
  where: { locale },
  select: { title: true, description: true },
}

// Line 636-638 - ❌ 错误：第二批补充游戏翻译
translations: {
  where: { locale },
  select: { title: true, description: true },
}

// Line 642-644 - ❌ 错误：第二批分类翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 652-654 - ❌ 错误：第二批标签翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 671-672 - ❌ 错误：数据访问
category: game.category.translations[0]?.name || "",
tags: game.tags.map((t) => t.tag.translations[0]?.name || ""),
```

**修复方案**：
- 所有查询改为 `buildLocaleCondition(locale)`
- 所有 select 添加 `locale: true`
- 数据访问改用 `getTranslatedField()`

---

#### 优先级 P1 - 列表页

##### 5. `getGamesByTag()` - Line 312-359

**影响页面**：标签页面（如 `/tag/action`）

**问题位置**：
```typescript
// Line 317 - ❌ 错误：标签翻译
translations: {
  where: { locale },
}

// Line 324-330 - ❌ 错误：游戏翻译
translations: {
  where: { locale },
  select: {
    title: true,
    description: true,
  },
}

// Line 338, 344-345 - ❌ 错误：数据访问
if (!tag || !tag.translations[0]) {
  return null
}

return {
  slug: tag.slug,
  name: tag.translations[0].name,
  description: tag.translations[0].description,
  ...
}

// Line 353-354 - ❌ 错误：游戏数据访问
title: game.translations[0]?.title || "Untitled",
description: game.translations[0]?.description || "",
```

**修复方案**：
- 查询改为 `buildLocaleCondition(locale)`
- select 添加 `locale: true`
- 数据访问改用 `getTranslatedField()`
- 移除 `!tag.translations[0]` 检查，改为检查翻译是否为空数组

---

##### 6. `getGamesByTagWithPagination()` - Line 874-952

**影响页面**：标签详情页游戏列表（带分页）

**问题位置**：
```typescript
// Line 881-883 - ❌ 错误：标签翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 894-896 - ❌ 错误：游戏翻译
translations: {
  where: { locale },
  select: { title: true, description: true },
}

// Line 910-912 - ❌ 错误：嵌套标签翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 935, 940-943 - ❌ 错误：数据访问
name: tag.translations[0]?.name || "",
title: gt.game.translations[0]?.title || "Untitled",
description: gt.game.translations[0]?.description || "",
category: gt.game.category.translations[0]?.name || "",
tags: gt.game.tags.map((t) => t.tag.translations[0]?.name || ""),
```

**修复方案**：与 `getGamesByTag()` 相同

---

##### 7. `getPageTypeGames()` - Line 703-809

**影响页面**：动态页面类型页（如 `/most-played`, `/trending`, `/new`, `/featured`）

**问题位置**：
```typescript
// Line 710-717 - ❌ 错误：页面类型翻译
translations: {
  where: { locale },
  select: {
    title: true,
    subtitle: true,
    description: true,
    metaTitle: true,
    metaDescription: true,
  },
}

// Line 731-733 - ❌ 错误：游戏翻译
translations: {
  where: { locale },
  select: { title: true, description: true },
}

// Line 788-792 - ❌ 错误：页面类型数据访问
title: pageType.translations[0]?.title || "",
subtitle: pageType.translations[0]?.subtitle || "",
description: pageType.translations[0]?.description || "",
metaTitle: pageType.translations[0]?.metaTitle || "",
metaDescription: pageType.translations[0]?.metaDescription || "",

// Line 797-798 - ❌ 错误：游戏数据访问
title: game.translations[0]?.title || "Untitled",
description: game.translations[0]?.description || "",

// Line 800 - ❌ 错误：标签数据访问
tags: game.tags.map((t: any) => t.tag.translations[0]?.name || ""),
```

**修复方案**：
- 所有查询改为 `buildLocaleCondition(locale)`
- 所有 select 添加 `locale: true`
- 所有数据访问改用 `getTranslatedField()`

---

##### 8. `getAllGames()` - Line 814-869

**影响页面**：全部游戏列表页

**问题位置**：
```typescript
// Line 824-826 - ❌ 错误：游戏翻译
translations: {
  where: { locale },
  select: { title: true, description: true },
}

// Line 830-832 - ❌ 错误：分类翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 840-842 - ❌ 错误：标签翻译
translations: {
  where: { locale },
  select: { name: true },
}

// Line 857-858 - ❌ 错误：游戏数据访问
title: game.translations[0]?.title || "Untitled",
description: game.translations[0]?.description || "",

// Line 859 - ✅ 正确（但查询错误）
category: getTranslatedField(game.category.translations, locale, "name", ""),

// Line 860 - ✅ 正确（但查询错误）
tags: game.tags.map((t) => getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)),
```

**修复方案**：
- 所有查询改为 `buildLocaleCondition(locale)`
- 所有 select 添加 `locale: true`
- 游戏翻译数据访问改用 `getTranslatedField()`

---

## 🎯 修复执行计划

### 阶段 1：首页相关函数（P0 - 最高优先级）

**预估时间**：45 分钟

- [ ] 1.1 修复 `getMostPlayedGames()` - 分类和标签数据访问（2处）
- [ ] 1.2 修复 `getTrendingGames()` - 分类和标签数据访问（2处）
- [ ] 1.3 修复 `getGamesByTagSlug()` - 查询条件（2处）+ 数据访问（4处）

**预期结果**：首页所有section正确显示中文翻译

---

### 阶段 2：游戏详情页和列表页（P0/P1）

**预估时间**：60 分钟

- [ ] 2.1 修复 `getRecommendedGames()` - 查询条件（4处）+ 数据访问（2处）
- [ ] 2.2 修复 `getGamesByTag()` - 查询条件（2处）+ 数据访问（5处）
- [ ] 2.3 修复 `getGamesByTagWithPagination()` - 查询条件（3处）+ 数据访问（5处）
- [ ] 2.4 修复 `getPageTypeGames()` - 查询条件（2处）+ 数据访问（8处）
- [ ] 2.5 修复 `getAllGames()` - 查询条件（3处）+ 数据访问（2处）

**预期结果**：所有列表页和详情页正确显示中文翻译

---

### 阶段 3：类型错误修复和验证（P1）

**预估时间**：30 分钟

- [ ] 3.1 运行 `npx tsc --noEmit` 验证无 TypeScript 错误
- [ ] 3.2 修复任何遗留的类型问题
- [ ] 3.3 代码审查，确保所有修复符合模式

**预期结果**：无 TypeScript 编译错误

---

### 阶段 4：功能测试（P1）

**预估时间**：30 分钟

- [ ] 4.1 启动开发服务器：`npm run dev`
- [ ] 4.2 使用 browsermcp 测试中文环境（`/zh/`）
  - [ ] 首页所有 section
  - [ ] 游戏详情页
  - [ ] 分类列表页
  - [ ] 标签列表页
  - [ ] 动态页面类型页
- [ ] 4.3 使用 browsermcp 测试英文环境（`/en/`）
  - [ ] 验证所有页面正常显示
- [ ] 4.4 测试回退机制：删除某个游戏的中文翻译，验证是否回退到英文

**预期结果**：所有页面在中英文环境下都能正确显示

---

## 📊 修复影响评估

### 受影响页面汇总

| 页面/功能 | 函数 | 影响级别 | 预期改善 |
|----------|-----|---------|---------|
| 首页 - 最受欢迎游戏 | `getMostPlayedGames()` | 🔴 高 | 分类和标签显示中文 |
| 首页 - 热门趋势游戏 | `getTrendingGames()` | 🔴 高 | 分类和标签显示中文 |
| 首页 - IO/Puzzle/Action 游戏 | `getGamesByTagSlug()` | 🔴 高 | 游戏和标签显示中文 |
| 游戏详情页 - 推荐游戏 | `getRecommendedGames()` | 🔴 高 | 推荐游戏完整显示 |
| 标签页面 | `getGamesByTag()` | 🟡 中 | 标签和游戏显示中文 |
| 标签详情页 | `getGamesByTagWithPagination()` | 🟡 中 | 游戏列表显示中文 |
| 动态页面类型页 | `getPageTypeGames()` | 🟡 中 | 页面标题和游戏显示中文 |
| 全部游戏页面 | `getAllGames()` | 🟡 中 | 游戏列表显示中文 |

### 用户体验改善

**修复前**（中文环境）：
- ❌ 游戏分类可能显示空白
- ❌ 游戏标签可能显示空白
- ❌ 部分游戏标题/描述可能显示空白
- ❌ SEO 元数据可能缺失

**修复后**（中文环境）：
- ✅ 游戏分类正确显示中文，无翻译时回退到英文
- ✅ 游戏标签正确显示中文，无翻译时回退到英文
- ✅ 所有游戏标题/描述完整显示
- ✅ SEO 元数据完整

**预估影响用户**：100% 访问中文版网站的用户

---

## 🔧 修复模式参考

### 模式 1：修复翻译查询

**错误写法**：
```typescript
translations: {
  where: { locale },
  select: { title: true },
}
```

**正确写法**：
```typescript
translations: {
  where: buildLocaleCondition(locale),
  select: { title: true, locale: true },  // ⚠️ 必须包含 locale
}
```

---

### 模式 2：修复数据访问

**错误写法**：
```typescript
title: game.translations[0]?.title || "Untitled"
```

**正确写法**：
```typescript
title: getTranslatedField(game.translations, locale, "title", "Untitled")
```

---

### 模式 3：修复标签映射

**错误写法**：
```typescript
tags: game.tags.map((t) => t.tag.translations[0]?.name || "")
```

**正确写法**：
```typescript
tags: game.tags.map((t) =>
  getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)
)
```

---

### 模式 4：修复嵌套翻译

**错误写法**：
```typescript
category: game.category.translations[0]?.name || ""
```

**正确写法**：
```typescript
category: getTranslatedField(game.category.translations, locale, "name", "")
```

---

## 📝 最佳实践总结

### 1. 查询翻译数据

✅ **始终使用 `buildLocaleCondition(locale)`**：
```typescript
translations: {
  where: buildLocaleCondition(locale),  // 自动包含当前语言 + 英文回退
  select: {
    fieldName: true,
    locale: true,  // ⚠️ 必须包含，否则 TypeScript 报错
  },
}
```

### 2. 访问翻译字段

✅ **始终使用 `getTranslatedField()`**：
```typescript
const title = getTranslatedField(
  translations,     // 翻译数组
  locale,          // 当前语言
  "title",         // 字段名
  "Default Value"  // 默认值（可选）
)
```

### 3. 映射标签/分类

✅ **使用 `getTranslatedField()` 在 map 中**：
```typescript
tags: game.tags.map((t) =>
  getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)
)
```

### 4. 返回对象结构

✅ **统一使用 helper 函数**：
```typescript
return {
  title: getTranslatedField(game.translations, locale, "title", "Untitled"),
  description: getTranslatedField(game.translations, locale, "description", ""),
  category: getTranslatedField(game.category.translations, locale, "name", ""),
  tags: game.tags.map((t) =>
    getTranslatedField(t.tag.translations, locale, "name", t.tag.slug)
  ),
}
```

---

## ⚠️ 注意事项

1. **不要混用模式**：要么全部使用 `getTranslatedField()`，要么全部使用 `translations[0]`（不推荐）

2. **locale 字段必须查询**：使用 `getTranslatedField()` 时，select 必须包含 `locale: true`

3. **默认值要合理**：
   - 标题/名称：使用有意义的默认值（如 "Untitled"、slug）
   - 描述/可选字段：使用空字符串 `""`

4. **测试回退机制**：修复后务必测试翻译缺失时的回退行为

5. **保持一致性**：同类型的字段使用相同的默认值策略

---

## 📚 相关文档

- [国际化帮助函数实现](../lib/i18n-helpers.ts) - `buildLocaleCondition()` 和 `getTranslatedField()` 的实现
- [Prisma Schema](../prisma/schema.prisma) - 翻译表结构定义
- [URL路由指南](./url-routing-guide.md) - 国际化路由架构
- [API认证指南](./api-authentication-guide.md) - API架构说明

---

## ✅ 修复完成标准

- [ ] 所有 8 个函数已修复
- [ ] TypeScript 编译无错误
- [ ] 中文环境所有页面正确显示
- [ ] 英文环境所有页面正确显示
- [ ] 删除翻译后能正确回退
- [ ] 代码审查通过
- [ ] 功能测试通过

---

**报告结束**

如需开始修复，请按照"修复执行计划"逐步进行。
