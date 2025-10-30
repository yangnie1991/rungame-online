# 页面结构文档

## 概述

RunGame 使用 PageType 系统实现灵活的页面管理，支持三种页面类型：
1. **GAME_LIST** - 游戏列表页
2. **STATIC_CONTENT** - 静态内容页
3. **MIXED** - 混合页面（内容 + 游戏列表）

## PageType 系统

### 核心概念

PageType 允许管理员在后台动态创建各种类型的页面，无需修改代码。每个 PageType 都有：

- **唯一 slug**: 用作 URL 路径
- **类型**: 决定页面行为
- **配置**: JSON 格式的页面配置
- **多语言翻译**: 标题、描述、SEO 信息

### 数据结构

#### PageType 表

```typescript
{
  id: string
  slug: string              // URL: /{locale}/{slug}
  type: 'GAME_LIST' | 'STATIC_CONTENT' | 'MIXED'
  gameListConfig: Json?     // 游戏列表配置
  layoutConfig: Json?       // 布局配置
  cacheConfig: Json?        // 缓存配置
  isEnabled: boolean
  sortOrder: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### PageTypeTranslation 表

```typescript
{
  id: string
  pageTypeId: string
  locale: string            // en, zh, es, fr
  name: string             // 页面名称（导航用）
  title: string            // 页面标题
  description: string?     // 页面描述
  keywords: string?        // SEO 关键词
  metaTitle: string?       // Meta 标题
  metaDescription: string? // Meta 描述
}
```

## 页面类型详解

### 1. GAME_LIST 页面

显示根据配置筛选和排序的游戏列表。

#### 用途示例

- 最多游玩游戏
- 最新游戏
- 热门游戏
- 高评分游戏
- 特定分类游戏

#### gameListConfig 结构

```json
{
  "filters": {
    "categoryId": "category-id",  // 可选: 指定分类
    "tags": ["action", "puzzle"], // 可选: 包含标签
    "isFeatured": true,           // 可选: 只显示精选
    "minRating": 4.0,             // 可选: 最低评分
    "minPlayCount": 100           // 可选: 最低游玩次数
  },
  "sorting": {
    "field": "playCount",         // playCount | rating | createdAt | viewCount
    "order": "desc"               // desc | asc
  },
  "pagination": {
    "perPage": 24,                // 每页显示数量
    "defaultPage": 1              // 默认页码
  }
}
```

#### 示例配置

**最多游玩游戏**:
```json
{
  "filters": {
    "status": "published"
  },
  "sorting": {
    "field": "playCount",
    "order": "desc"
  },
  "pagination": {
    "perPage": 24
  }
}
```

**精选高分游戏**:
```json
{
  "filters": {
    "isFeatured": true,
    "minRating": 4.5
  },
  "sorting": {
    "field": "rating",
    "order": "desc"
  },
  "pagination": {
    "perPage": 12
  }
}
```

### 2. STATIC_CONTENT 页面

显示纯内容，不包含游戏列表。

#### 用途示例

- 关于我们
- 隐私政策
- 服务条款
- 联系我们
- 帮助文档

#### 内容结构

使用 `PageContentBlock` 和 `PageContentBlockTranslation` 表存储内容块。

#### PageContentBlock 结构

```typescript
{
  id: string
  pageTypeId: string
  type: string             // TEXT | IMAGE | VIDEO | HTML
  order: number            // 显示顺序
  config: Json?            // 块配置
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 内容块类型

1. **TEXT** - 文本块
   ```json
   {
     "config": {
       "format": "plain"   // plain | markdown | html
     }
   }
   ```

2. **IMAGE** - 图片块
   ```json
   {
     "config": {
       "url": "https://...",
       "alt": "Image alt text",
       "width": 800,
       "height": 600
     }
   }
   ```

3. **VIDEO** - 视频块
   ```json
   {
     "config": {
       "url": "https://...",
       "type": "youtube"  // youtube | vimeo | direct
     }
   }
   ```

4. **HTML** - HTML 块
   ```json
   {
     "config": {
       "allowedTags": ["p", "h2", "ul", "li"]
     }
   }
   ```

### 3. MIXED 页面

结合静态内容和游戏列表。

#### 用途示例

- 夏日游戏活动（活动介绍 + 相关游戏）
- 游戏推荐专题（编辑推荐 + 游戏列表）
- 节日特辑（节日内容 + 主题游戏）

#### layoutConfig 结构

```json
{
  "layout": "content-then-games",  // content-then-games | games-then-content | sidebar
  "contentBlocks": {
    "position": "top",             // top | bottom | left | right
    "width": "full"                // full | half | third
  },
  "gamesList": {
    "position": "bottom",
    "columns": 4,                  // 列数
    "displayStyle": "grid"         // grid | list
  }
}
```

#### 示例配置

**内容在上，游戏在下**:
```json
{
  "layout": "content-then-games",
  "contentBlocks": {
    "position": "top"
  },
  "gamesList": {
    "position": "bottom",
    "columns": 4
  }
}
```

**侧边栏布局**:
```json
{
  "layout": "sidebar",
  "contentBlocks": {
    "position": "left",
    "width": "third"
  },
  "gamesList": {
    "position": "right",
    "columns": 3
  }
}
```

## 路由处理

### 动态路由

```
app/(site)/[locale]/[pageType]/page.tsx
```

### 路由逻辑

```typescript
// 1. 根据 slug 查询 PageType
const pageType = await prisma.pageType.findUnique({
  where: { slug: params.pageType },
  include: {
    translations: {
      where: { locale: params.locale }
    }
  }
})

// 2. 根据类型渲染不同组件
switch (pageType.type) {
  case 'GAME_LIST':
    return <GameListPage config={pageType.gameListConfig} />

  case 'STATIC_CONTENT':
    return <StaticContentPage pageType={pageType} />

  case 'MIXED':
    return <MixedPage pageType={pageType} />
}
```

### URL 示例

假设创建了以下 PageType:

| slug | type | URL |
|------|------|-----|
| most-played | GAME_LIST | `/most-played` 或 `/zh/most-played` |
| about | STATIC_CONTENT | `/about` 或 `/zh/about` |
| summer-games | MIXED | `/summer-games` 或 `/zh/summer-games` |

## 特殊页面

### 固定页面（非 PageType）

一些页面不使用 PageType 系统，而是直接定义：

#### 1. 首页 `/`

```
app/(site)/[locale]/page.tsx
```

显示内容：
- Hero 区域
- 精选游戏
- 热门分类
- 最新游戏

#### 2. 游戏列表 `/games`

```
app/(site)/[locale]/games/page.tsx
```

显示所有游戏，带筛选和分页。

#### 3. 游戏详情 `/games/play/[slug]`

```
app/(site)/[locale]/games/play/[slug]/page.tsx
```

显示单个游戏：
- 游戏播放器
- 游戏信息
- 游戏说明
- 推荐游戏

#### 4. 分类页 `/games/category/[category]`

```
app/(site)/[locale]/games/category/[category]/page.tsx
```

显示特定分类的游戏。

#### 5. 标签页 `/games/tags/[tag]`

```
app/(site)/[locale]/games/tags/[tag]/page.tsx
```

显示带有特定标签的游戏。

#### 6. 必备页面

这些页面使用独立路由，内容存储在翻译文件中：

- `/about` - 关于我们
- `/contact` - 联系我们
- `/privacy` - 隐私政策
- `/terms` - 服务条款

## 缓存配置

### cacheConfig 结构

```json
{
  "ttl": 3600,                    // 缓存时间（秒）
  "revalidateOn": [
    "game_created",               // 触发条件
    "game_updated",
    "game_deleted"
  ],
  "tags": ["games", "featured"]   // 缓存标签
}
```

### 使用缓存

```typescript
import { unstable_cache } from 'next/cache'

const getPageData = unstable_cache(
  async (slug: string, locale: string) => {
    // 查询逻辑
  },
  ['page-type', slug, locale],
  {
    revalidate: pageType.cacheConfig?.ttl || 3600,
    tags: pageType.cacheConfig?.tags || ['pages']
  }
)
```

## 管理后台操作

### 创建 PageType

1. 进入管理后台
2. 导航到 "页面类型"
3. 点击 "创建页面类型"
4. 填写信息：
   - Slug (URL 标识符)
   - 类型 (GAME_LIST / STATIC_CONTENT / MIXED)
   - 根据类型配置 JSON
5. 添加多语言翻译
6. 保存

### 编辑 PageType

1. 在页面类型列表找到目标
2. 点击 "编辑"
3. 修改配置或翻译
4. 保存（自动重新验证缓存）

### 删除 PageType

1. 在页面类型列表找到目标
2. 点击 "删除"
3. 确认删除
4. 相关内容块也会被删除

### 添加内容块（STATIC_CONTENT 或 MIXED）

1. 编辑 PageType
2. 进入 "内容块" 标签
3. 点击 "添加内容块"
4. 选择类型 (TEXT / IMAGE / VIDEO / HTML)
5. 配置内容块
6. 添加多语言翻译
7. 设置显示顺序
8. 保存

## 前端渲染

### GameListPage 组件

```typescript
interface GameListPageProps {
  pageType: PageType
  locale: string
}

export function GameListPage({ pageType, locale }: GameListPageProps) {
  // 解析配置
  const config = pageType.gameListConfig as GameListConfig

  // 查询游戏
  const games = await getGamesByConfig(config, locale)

  // 渲染游戏列表
  return (
    <div>
      <h1>{pageType.translations[0]?.title}</h1>
      <GameGrid games={games} />
      <Pagination config={config.pagination} />
    </div>
  )
}
```

### StaticContentPage 组件

```typescript
interface StaticContentPageProps {
  pageType: PageType
  locale: string
}

export function StaticContentPage({ pageType, locale }: StaticContentPageProps) {
  // 获取内容块
  const contentBlocks = await getPageContentBlocks(pageType.id, locale)

  // 按顺序渲染
  return (
    <div>
      <h1>{pageType.translations[0]?.title}</h1>
      {contentBlocks.map((block) => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </div>
  )
}
```

### MixedPage 组件

```typescript
interface MixedPageProps {
  pageType: PageType
  locale: string
}

export function MixedPage({ pageType, locale }: MixedPageProps) {
  const layoutConfig = pageType.layoutConfig as LayoutConfig
  const contentBlocks = await getPageContentBlocks(pageType.id, locale)
  const games = await getGamesByConfig(pageType.gameListConfig, locale)

  // 根据布局配置渲染
  if (layoutConfig.layout === 'content-then-games') {
    return (
      <>
        <ContentSection blocks={contentBlocks} />
        <GamesSection games={games} />
      </>
    )
  }

  if (layoutConfig.layout === 'sidebar') {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <ContentSection blocks={contentBlocks} />
        </div>
        <div className="col-span-2">
          <GamesSection games={games} />
        </div>
      </div>
    )
  }

  // ...
}
```

## SEO 优化

### 动态 Metadata

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, pageType: slug } = await params

  const pageType = await getPageType(slug, locale)

  if (!pageType) {
    return { title: 'Not Found' }
  }

  const translation = pageType.translations[0]

  return {
    title: translation.metaTitle || translation.title,
    description: translation.metaDescription || translation.description,
    keywords: translation.keywords,
    openGraph: {
      title: translation.metaTitle || translation.title,
      description: translation.metaDescription || translation.description,
      type: 'website',
      locale: locale,
    },
  }
}
```

## 最佳实践

### 1. PageType Slug 命名

✅ **推荐**:
- `most-played`
- `new-games`
- `summer-special`
- `puzzle-challenge`

❌ **避免**:
- `most_played` (使用连字符而非下划线)
- `MostPlayed` (小写)
- `mostPlayed` (使用连字符分隔)
- `games` (避免与现有路由冲突)

### 2. 配置 JSON 验证

在保存前验证 JSON 格式：

```typescript
// gameListConfig schema
const gameListConfigSchema = z.object({
  filters: z.object({
    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
  }).optional(),
  sorting: z.object({
    field: z.enum(['playCount', 'rating', 'createdAt']),
    order: z.enum(['asc', 'desc']),
  }),
  pagination: z.object({
    perPage: z.number().min(1).max(100),
  }),
})
```

### 3. 内容块排序

使用 `order` 字段控制显示顺序，建议使用 10 的倍数：
- 10, 20, 30, 40...
- 方便在中间插入新块

### 4. 缓存策略

- **GAME_LIST**: 短缓存 (1小时)，游戏更新时失效
- **STATIC_CONTENT**: 长缓存 (24小时)，内容很少变化
- **MIXED**: 中等缓存 (6小时)，平衡更新频率

## 故障排查

### 问题：PageType 页面 404

**原因**:
1. PageType 未启用 (`isEnabled = false`)
2. Slug 拼写错误
3. 缺少翻译

**解决**:
1. 检查数据库 PageType 记录
2. 确认 `isEnabled = true`
3. 确认有对应语言的翻译

### 问题：游戏列表为空

**原因**:
1. gameListConfig 过滤条件太严格
2. 没有符合条件的游戏
3. 游戏未发布

**解决**:
1. 检查 gameListConfig 配置
2. 放宽筛选条件
3. 确认游戏 `status = 'published'`

### 问题：内容块不显示

**原因**:
1. 内容块未关联到 PageType
2. 缺少翻译
3. Order 设置问题

**解决**:
1. 检查 `pageTypeId` 关联
2. 添加对应语言翻译
3. 检查 `order` 字段

## 相关文件

- 动态路由: [app/(site)/[locale]/[pageType]/page.tsx](../app/(site)/[locale]/[pageType]/page.tsx)
- 游戏列表查询: [lib/data/games/browse.ts](../lib/data/games/browse.ts)
- PageType 查询: [lib/data/page-types/](../lib/data/page-types/)
- 管理后台: [app/(admin)/admin/page-types/](../app/(admin)/admin/page-types/)
- 数据库 Schema: [prisma/schema.prisma](../prisma/schema.prisma)
