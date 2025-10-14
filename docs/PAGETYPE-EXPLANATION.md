# PageType 页面类型详解

## 概述

PageType（页面类型）是 RunGame.Online 的核心功能，用于创建不同类型的动态页面。系统支持三种页面类型，每种类型适用于不同的使用场景。

## 三种页面类型详解

### 1. GAME_LIST（游戏列表页）

#### 用途
展示游戏列表的动态页面，根据特定规则筛选和排序游戏。

#### 典型应用场景
- **Most Played（最多游玩）** - 显示游玩次数最多的游戏
- **Trending（热门游戏）** - 显示最近热门的游戏
- **New Games（新游戏）** - 显示最新添加的游戏
- **Top Rated（最高评分）** - 显示评分最高的游戏
- **Featured（精选游戏）** - 显示管理员精选的游戏

#### 配置示例

##### URL 结构
```
https://rungame.online/most-played
https://rungame.online/trending
https://rungame.online/new-games
https://rungame.online/zh/most-played
```

##### gameListConfig 配置
```json
{
  "filters": {
    "isPublished": true,
    "isFeatured": false,
    "maxAge": 30
  },
  "sorting": {
    "field": "playCount",
    "direction": "desc",
    "secondaryField": "createdAt"
  },
  "pagination": {
    "defaultLimit": 24,
    "maxLimit": 100
  }
}
```

##### 配置字段说明

**filters（筛选条件）**：
- `isPublished`: 只显示已发布的游戏
- `isFeatured`: 是否只显示精选游戏
- `maxAge`: 最大游戏年龄（天数），用于"新游戏"或"热门"页面
- `categoryId`: 指定分类ID
- `minRating`: 最低评分

**sorting（排序规则）**：
- `field`: 排序字段
  - `playCount` - 按游玩次数
  - `rating` - 按评分
  - `createdAt` - 按创建时间
  - `updatedAt` - 按更新时间
  - `random` - 随机排序
- `direction`: 排序方向（`asc` 升序 / `desc` 降序）
- `secondaryField`: 次要排序字段（当主字段相同时使用）

**pagination（分页配置）**：
- `defaultLimit`: 默认每页显示数量
- `maxLimit`: 最大每页显示数量

#### 实际案例

##### 1. Most Played（最多游玩）
```json
{
  "slug": "most-played",
  "type": "GAME_LIST",
  "icon": "🎮",
  "gameListConfig": {
    "filters": {
      "isPublished": true
    },
    "sorting": {
      "field": "playCount",
      "direction": "desc"
    },
    "pagination": {
      "defaultLimit": 24,
      "maxLimit": 100
    }
  }
}
```

##### 2. Trending（热门游戏 - 最近30天）
```json
{
  "slug": "trending",
  "type": "GAME_LIST",
  "icon": "🔥",
  "gameListConfig": {
    "filters": {
      "isPublished": true,
      "maxAge": 30
    },
    "sorting": {
      "field": "playCount",
      "direction": "desc",
      "secondaryField": "rating"
    },
    "pagination": {
      "defaultLimit": 24,
      "maxLimit": 100
    }
  }
}
```

##### 3. New Games（新游戏）
```json
{
  "slug": "new",
  "type": "GAME_LIST",
  "icon": "✨",
  "gameListConfig": {
    "filters": {
      "isPublished": true
    },
    "sorting": {
      "field": "createdAt",
      "direction": "desc"
    },
    "pagination": {
      "defaultLimit": 24,
      "maxLimit": 100
    }
  }
}
```

---

### 2. STATIC_CONTENT（静态内容页）

#### 用途
展示静态内容的页面，如关于我们、使用条款、隐私政策等。

#### 典型应用场景
- **About Us（关于我们）** - 公司/项目介绍
- **Privacy Policy（隐私政策）** - 隐私条款
- **Terms of Service（服务条款）** - 使用条款
- **FAQ（常见问题）** - 帮助文档
- **Contact（联系我们）** - 联系方式
- **Help（帮助中心）** - 使用指南

#### 配置示例

##### URL 结构
```
https://rungame.online/about
https://rungame.online/privacy
https://rungame.online/terms
https://rungame.online/zh/about
```

##### 内容来源
静态内容页的内容来自 **PageContentBlock（内容块）** 模型，支持：
- 多个内容块组成一个页面
- 每个内容块可以是：文本、图片、视频、HTML等
- 支持多语言翻译
- 可排序、可启用/禁用

##### 实际案例

##### 1. About Us（关于我们）
```json
{
  "slug": "about",
  "type": "STATIC_CONTENT",
  "icon": "ℹ️",
  "translations": [
    {
      "locale": "zh",
      "title": "关于我们",
      "description": "了解 RunGame.Online 的故事、使命和团队"
    }
  ]
}
```

配套的 ContentBlock：
```json
{
  "pageTypeId": "<about-page-id>",
  "blockType": "TEXT",
  "sortOrder": 1,
  "translations": [
    {
      "locale": "zh",
      "title": "我们的使命",
      "content": "RunGame.Online 致力于为全球玩家提供最佳的免费在线游戏体验..."
    }
  ]
}
```

##### 2. Privacy Policy（隐私政策）
```json
{
  "slug": "privacy",
  "type": "STATIC_CONTENT",
  "icon": "🔒",
  "translations": [
    {
      "locale": "zh",
      "title": "隐私政策",
      "description": "我们如何收集、使用和保护您的个人信息"
    }
  ]
}
```

---

### 3. MIXED（混合模式）

#### 用途
结合游戏列表和静态内容的混合页面，既展示游戏又包含说明性内容。

#### 典型应用场景
- **特殊活动页面** - 显示活动介绍 + 相关游戏列表
- **游戏专题** - 主题说明 + 精选游戏
- **新手引导** - 教程内容 + 推荐游戏
- **比赛活动** - 比赛规则 + 参赛游戏
- **季节活动** - 节日介绍 + 主题游戏

#### 配置示例

##### URL 结构
```
https://rungame.online/summer-games
https://rungame.online/christmas-special
https://rungame.online/puzzle-challenge
```

##### 页面结构
```
┌─────────────────────────────────┐
│   静态内容块 1：活动介绍           │
├─────────────────────────────────┤
│   静态内容块 2：活动规则           │
├─────────────────────────────────┤
│   游戏列表：相关游戏（动态）        │
├─────────────────────────────────┤
│   静态内容块 3：奖品说明           │
└─────────────────────────────────┘
```

##### 实际案例

##### 1. Summer Games（夏日游戏）
```json
{
  "slug": "summer-games",
  "type": "MIXED",
  "icon": "☀️",
  "gameListConfig": {
    "filters": {
      "isPublished": true,
      "tags": ["summer", "outdoor"]
    },
    "sorting": {
      "field": "rating",
      "direction": "desc"
    },
    "pagination": {
      "defaultLimit": 12,
      "maxLimit": 50
    }
  },
  "layoutConfig": {
    "contentBlocksPosition": "top",
    "gameListPosition": "middle",
    "showGameListTitle": true
  },
  "translations": [
    {
      "locale": "zh",
      "title": "夏日游戏特辑",
      "subtitle": "清凉一夏，畅玩精选游戏",
      "description": "精选夏日主题游戏，让你在炎炎夏日中享受清凉乐趣"
    }
  ]
}
```

配套内容块：
```json
[
  {
    "blockType": "HERO",
    "sortOrder": 1,
    "translations": [
      {
        "locale": "zh",
        "title": "夏日游戏狂欢",
        "content": "欢迎来到我们的夏日游戏特辑！..."
      }
    ]
  },
  {
    "blockType": "TEXT",
    "sortOrder": 2,
    "translations": [
      {
        "locale": "zh",
        "title": "活动时间",
        "content": "2025年6月1日 - 8月31日"
      }
    ]
  }
]
```

##### 2. Puzzle Challenge（益智挑战）
```json
{
  "slug": "puzzle-challenge",
  "type": "MIXED",
  "icon": "🧩",
  "gameListConfig": {
    "filters": {
      "isPublished": true,
      "categorySlug": "puzzle"
    },
    "sorting": {
      "field": "rating",
      "direction": "desc"
    }
  },
  "layoutConfig": {
    "contentBlocksPosition": "top",
    "gameListPosition": "bottom"
  }
}
```

---

## 布局配置 (layoutConfig)

### 通用布局选项

```json
{
  "layoutConfig": {
    "style": "grid",              // 布局样式：grid（网格）/ list（列表）/ carousel（轮播）
    "columns": 4,                 // 网格列数（桌面）
    "columnsTablet": 3,           // 平板列数
    "columnsMobile": 2,           // 手机列数
    "showSidebar": true,          // 是否显示侧边栏
    "sidebarPosition": "right",   // 侧边栏位置：left / right
    "showBreadcrumb": true,       // 是否显示面包屑导航
    "showShareButtons": true,     // 是否显示分享按钮
    "headerImage": "url",         // 页面头部图片
    "backgroundColor": "#f5f5f5"  // 页面背景色
  }
}
```

### MIXED 模式特有配置

```json
{
  "layoutConfig": {
    "contentBlocksPosition": "top",     // 内容块位置：top / bottom / between
    "gameListPosition": "middle",       // 游戏列表位置
    "gameListTitle": "相关游戏",         // 游戏列表标题
    "showGameListTitle": true,          // 是否显示游戏列表标题
    "alternateLayout": false            // 是否交替显示内容块和游戏
  }
}
```

---

## 缓存配置 (cacheConfig)

```json
{
  "cacheConfig": {
    "enabled": true,              // 是否启用缓存
    "ttl": 3600,                  // 缓存时间（秒）
    "strategy": "stale-while-revalidate",  // 缓存策略
    "varyByLocale": true,         // 是否按语言分别缓存
    "varyByQuery": false,         // 是否按查询参数分别缓存
    "invalidateOn": [             // 缓存失效触发条件
      "game_created",
      "game_updated",
      "game_deleted"
    ]
  }
}
```

---

## 数据库关系图

```
PageType (页面类型)
├── translations[] (翻译)
│   ├── title (标题)
│   ├── subtitle (副标题)
│   ├── description (描述)
│   └── SEO/OG 元数据
│
├── contentBlocks[] (内容块 - STATIC_CONTENT 和 MIXED 使用)
│   ├── blockType (TEXT / IMAGE / VIDEO / HTML)
│   ├── sortOrder (排序)
│   └── translations[]
│
└── gameListConfig (JSON - GAME_LIST 和 MIXED 使用)
    ├── filters (筛选条件)
    ├── sorting (排序规则)
    └── pagination (分页配置)
```

---

## 实际使用流程

### 1. 创建 GAME_LIST 页面

```
1. 管理后台 → 页面类型 → 创建页面类型
2. 选择类型：GAME_LIST
3. 设置基本信息：
   - Slug: most-played
   - Icon: 🎮
   - 排序: 1
4. 配置 gameListConfig (暂时先不配置，使用默认)
5. 添加多语言翻译
6. 保存
```

前端会自动生成路由：`/most-played`, `/zh/most-played` 等

### 2. 创建 STATIC_CONTENT 页面

```
1. 管理后台 → 页面类型 → 创建页面类型
2. 选择类型：STATIC_CONTENT
3. 设置基本信息：
   - Slug: about
   - Icon: ℹ️
4. 添加多语言翻译
5. 保存页面类型
6. 然后添加内容块：
   - 创建 ContentBlock
   - 关联到该 PageType
   - 添加文本/图片内容
```

### 3. 创建 MIXED 页面

```
1. 创建 MIXED 类型的页面类型
2. 配置 gameListConfig（设置要显示的游戏）
3. 配置 layoutConfig（设置布局）
4. 添加翻译
5. 添加内容块（说明性内容）
6. 保存
```

---

## API 调用示例

### 获取页面类型详情
```typescript
// 前端调用
const { data } = trpc.pageType.get.useQuery({
  slug: 'most-played',
  locale: 'zh'
})

// 返回：
{
  id: "xxx",
  slug: "most-played",
  type: "GAME_LIST",
  translation: {
    title: "最多游玩",
    subtitle: "最受欢迎的游戏",
    description: "..."
  },
  gameListConfig: { ... },
  contentBlocks: []
}
```

### 获取游戏列表
```typescript
// 前端调用
const { data } = trpc.pageType.getGames.useQuery({
  slug: 'most-played',
  locale: 'zh',
  page: 1,
  limit: 24
})

// 返回：
{
  games: [...],
  pagination: {
    page: 1,
    limit: 24,
    total: 156,
    totalPages: 7,
    hasNext: true,
    hasPrev: false
  }
}
```

---

## 总结

### 快速选择指南

| 需求 | 页面类型 | 说明 |
|------|---------|------|
| 显示游戏列表（按规则筛选） | GAME_LIST | 如：热门、新游戏、最高评分 |
| 显示静态文字内容 | STATIC_CONTENT | 如：关于、隐私政策、帮助 |
| 既要游戏列表又要说明文字 | MIXED | 如：活动页面、游戏专题 |

### 三种类型的核心区别

- **GAME_LIST**: 纯动态，数据来自游戏数据库
- **STATIC_CONTENT**: 纯静态，数据来自内容块
- **MIXED**: 动静结合，既有内容块又有游戏列表

希望这个详细的说明能帮助你理解三种页面类型的用途和配置方法！
