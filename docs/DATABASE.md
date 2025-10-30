# 数据库文档

## 概述

RunGame 使用 PostgreSQL 数据库，通过 Prisma ORM 进行管理。数据库采用翻译分离架构，主表存储不可翻译数据和英文内容，翻译表存储其他语言的内容。

## 数据库连接

### 环境变量

```env
# 主数据库（Supabase）
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&connection_limit=5&pool_timeout=10"
```

### 连接池配置

**开发环境**:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=5&pool_timeout=10"
```

**生产环境** (使用 PgBouncer):
```env
DATABASE_URL="postgresql://user:password@host:6432/database?pgbouncer=true&connection_limit=10&pool_timeout=20"
```

**连接池大小计算**:
```
总连接数 = 应用实例数 × connection_limit
```

建议每个实例 5-10 个连接，避免超过数据库连接上限。

## 核心数据模型

### 翻译架构模式

所有需要多语言的实体都遵循以下模式：
- **主表**: 存储不可翻译数据 + 英文内容
- **翻译表**: 存储其他语言的翻译内容
- **关系**: 一对多 (主表 → 翻译表)

### 1. Game (游戏)

游戏是系统的核心实体。

#### Game 表

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| slug | String | URL 标识符 | ✓ unique |
| thumbnail | String | 缩略图 URL | |
| banner | String? | 横幅图 URL | |
| embedUrl | String | 嵌入游戏 URL | |
| gameUrl | String | 游戏源 URL | |
| **dimensions** | **Json** | **尺寸信息** | |
| **title** | **String** | **英文标题** | |
| **description** | **String?** | **英文描述** | |
| **keywords** | **String?** | **英文关键词** | |
| **metaTitle** | **String?** | **英文 Meta 标题** | |
| **metaDescription** | **String?** | **英文 Meta 描述** | |
| screenshots | String[] | 截图 URL 数组 | |
| videos | String[] | 视频 URL 数组 | |
| categoryId | String | 分类 ID (外键) | ✓ |
| **status** | **String** | **状态** | ✓ |
| isFeatured | Boolean | 是否精选 | ✓ |
| playCount | Int | 游玩次数 | ✓ |
| viewCount | Int | 浏览次数 | |
| rating | Float | 评分 | |
| ratingCount | Int | 评分人数 | |
| qualityScore | Float? | 质量分数 | |
| developer | String? | 开发者 | |
| developerUrl | String? | 开发者网站 | |
| sourcePlatform | String? | 来源平台 | |
| sourcePlatformId | String? | 来源平台 ID | |
| **gameInfo** | **Json?** | **游戏内容信息** | |
| publishedAt | DateTime? | 发布时间 | |
| createdAt | DateTime | 创建时间 | |
| updatedAt | DateTime | 更新时间 | |

**重要字段说明**:

**dimensions** (JSON):
```json
{
  "width": 800,
  "height": 600,
  "aspectRatio": "4:3",
  "orientation": "landscape"  // landscape | portrait | square
}
```

**status** (String 枚举):
- `draft` - 草稿
- `published` - 已发布
- `archived` - 已归档

**gameInfo** (JSON Object) - 结构化游戏内容:

`gameInfo` 是一个 JSON 对象，key 为区块标识符，value 为 ContentSection。

**数据结构**:
```json
{
  "about": {
    "type": "json",
    "content": "This is an exciting puzzle game...",
    "order": 1
  },
  "how-to-play": {
    "type": "json",
    "content": {
      "type": "doc",
      "content": [...]
    },
    "order": 2
  },
  "screenshots": {
    "type": "array",
    "content": [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg"
    ],
    "order": 3
  }
}
```

**ContentSection 字段**:
- `type` (string) - 内容类型: `'json'` 或 `'array'`
- `content` (JSON) - 内容数据
- `order` (number) - 显示顺序，数字越小越靠前

**type 字段说明**:
- `'json'` - content 是字符串或对象（文本、Markdown、HTML、Tiptap JSON、URL 等）
- `'array'` - content 是数组（仅用于图片画廊、视频画廊）

**对象格式的优势**:
- ✅ 直接访问：`gameInfo.about`, `gameInfo.faq`
- ✅ 直接修改：`gameInfo.about = { type: 'json', content: '...', order: 1 }`
- ✅ 检查存在：`if (gameInfo.screenshots)`
- ✅ 无需遍历数组查找
- ✅ 按序渲染：`Object.entries(gameInfo).sort((a, b) => a[1].order - b[1].order)`

#### GameTranslation 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| gameId | String | 游戏 ID (外键) |
| locale | String | 语言代码 (zh, es, fr) |
| title | String | 翻译标题 |
| description | String? | 翻译描述 |
| keywords | String? | 翻译关键词 |
| metaTitle | String? | 翻译 Meta 标题 |
| metaDescription | String? | 翻译 Meta 描述 |
| **translationInfo** | **Json?** | **翻译内容信息** |

**索引**: `@@unique([gameId, locale])`, `@@index([locale])`

**注意**: 英文内容不在翻译表，直接使用主表字段。

**translationInfo** (JSON Object) - 翻译的游戏内容:

结构与 `gameInfo` 完全相同，也是以 key 为索引的对象：

```json
{
  "about": {
    "type": "json",
    "content": "这是一款激动人心的解谜游戏...",
    "order": 1
  },
  "how-to-play": {
    "type": "json",
    "content": { "type": "doc", "content": [...] },
    "order": 2
  },
  "screenshots": {
    "type": "array",
    "content": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    "order": 3
  }
}
```

每个翻译表记录存储对应语言的完整内容区块对象，key 与 `gameInfo` 保持一致。

### 2. Category (分类)

#### Category 表

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| slug | String | URL 标识符 | ✓ unique |
| icon | String? | 图标 URL | |
| sortOrder | Int | 排序 | ✓ |
| isEnabled | Boolean | 是否启用 | ✓ |
| createdAt | DateTime | 创建时间 | |
| updatedAt | DateTime | 更新时间 | |

#### CategoryTranslation 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| categoryId | String | 分类 ID (外键) |
| locale | String | 语言代码 (en, zh, es, fr) |
| name | String | 分类名称 |
| description | String? | 分类描述 |
| keywords | String? | SEO 关键词 |
| metaTitle | String? | Meta 标题 |
| metaDescription | String? | Meta 描述 |

### 3. Tag (标签)

#### Tag 表

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| slug | String | URL 标识符 | ✓ unique |
| isEnabled | Boolean | 是否启用 | ✓ |
| createdAt | DateTime | 创建时间 | |
| updatedAt | DateTime | 更新时间 | |

#### TagTranslation 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| tagId | String | 标签 ID (外键) |
| locale | String | 语言代码 (en, zh, es, fr) |
| name | String | 标签名称 |

### 4. Language (语言)

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| code | String | 语言代码 (en, zh, es, fr) | ✓ unique |
| name | String | 英文名称 (如 English) | |
| nativeName | String | 本地名称 (如 中文) | |
| nameCn | String | 中文名称 (如 英语) | |
| isEnabled | Boolean | 是否启用 | ✓ |
| isDefault | Boolean | 是否默认语言 | |
| sortOrder | Int | 排序 | |

**支持的语言**:
- `en` - English (默认)
- `zh` - 中文
- `es` - Español
- `fr` - Français

### 5. PageType (页面类型)

#### PageType 表

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| slug | String | URL 标识符 | ✓ unique |
| type | String | 页面类型 | ✓ |
| gameListConfig | Json? | 游戏列表配置 | |
| layoutConfig | Json? | 布局配置 | |
| cacheConfig | Json? | 缓存配置 | |
| isEnabled | Boolean | 是否启用 | ✓ |
| sortOrder | Int | 排序 | |
| createdAt | DateTime | 创建时间 | |
| updatedAt | DateTime | 更新时间 | |

**页面类型**:
- `GAME_LIST` - 游戏列表页
- `STATIC_CONTENT` - 静态内容页
- `MIXED` - 混合页面

#### PageTypeTranslation 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| pageTypeId | String | 页面类型 ID (外键) |
| locale | String | 语言代码 |
| name | String | 页面名称 |
| title | String | 页面标题 |
| description | String? | 页面描述 |
| keywords | String? | SEO 关键词 |
| metaTitle | String? | Meta 标题 |
| metaDescription | String? | Meta 描述 |

### 6. Admin (管理员)

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| id | String (cuid) | 主键 | ✓ |
| email | String | 邮箱 | ✓ unique |
| name | String | 名称 | |
| password | String | 密码 (bcrypt) | |
| role | String | 角色 (ADMIN, SUPER_ADMIN) | |
| isActive | Boolean | 是否激活 | |
| lastLoginAt | DateTime? | 最后登录时间 | |
| createdAt | DateTime | 创建时间 | |
| updatedAt | DateTime | 更新时间 | |

### 7. 关联表

#### GameTag (游戏-标签关联)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| gameId | String | 游戏 ID (外键) |
| tagId | String | 标签 ID (外键) |
| createdAt | DateTime | 创建时间 |

**索引**: `@@unique([gameId, tagId])`, `@@index([gameId])`, `@@index([tagId])`

## 数据库操作

### Prisma 命令

```bash
# 推送 schema 到数据库
npm run db:push

# 生成 Prisma Client
npx prisma generate

# 填充初始数据
npm run db:seed

# 打开 Prisma Studio（数据库可视化管理）
npx prisma studio
```

### 查询模式

#### 查询游戏（带翻译）

```typescript
import { prisma } from '@/lib/prisma'
import { buildLocaleCondition } from '@/lib/i18n-helpers'

// 英文查询（跳过翻译表）
if (locale === 'en') {
  const game = await prisma.game.findUnique({
    where: { slug, status: 'published' },
    select: {
      id: true,
      slug: true,
      title: true,        // 直接使用主表英文字段
      description: true,
      // ... 其他字段
    },
  })
}

// 其他语言查询（加载翻译）
const game = await prisma.game.findUnique({
  where: { slug, status: 'published' },
  include: {
    translations: {
      where: buildLocaleCondition(locale),  // 查询当前语言 + en 回退
      select: {
        locale: true,
        title: true,
        description: true,
      },
    },
  },
})

// 获取翻译内容（带回退）
const translation = game.translations.find(t => t.locale === locale)
const title = translation?.title || game.title  // 回退到英文
```

#### 创建游戏

```typescript
await prisma.game.create({
  data: {
    slug: 'my-game',
    thumbnail: 'https://...',
    embedUrl: 'https://...',
    gameUrl: 'https://...',
    dimensions: {
      width: 800,
      height: 600,
      aspectRatio: '4:3',
      orientation: 'landscape',
    },
    // 英文内容在主表
    title: 'My Game',
    description: 'A fun game',
    keywords: 'game, fun',
    categoryId: '...',
    status: 'published',
    // 其他语言翻译
    translations: {
      create: [
        {
          locale: 'zh',
          title: '我的游戏',
          description: '一个有趣的游戏',
        },
        {
          locale: 'es',
          title: 'Mi Juego',
          description: 'Un juego divertido',
        },
      ],
    },
  },
})
```

#### 更新游戏

```typescript
// 使用事务更新（删除旧翻译，创建新翻译）
await prisma.$transaction(async (tx) => {
  // 删除旧翻译
  await tx.gameTranslation.deleteMany({
    where: { gameId: id },
  })

  // 更新游戏
  await tx.game.update({
    where: { id },
    data: {
      title: 'Updated Title',
      description: 'Updated description',
      status: 'published',
      translations: {
        create: [
          { locale: 'zh', title: '更新的标题' },
          { locale: 'es', title: 'Título actualizado' },
        ],
      },
    },
  })
})
```

## 数据迁移

### 填充初始数据

运行 seed 脚本填充：
- 超级管理员账号
- 25 个游戏分类（中英文翻译）
- 所有标签
- 4 种语言配置

```bash
npm run db:seed
```

**管理员账号**:
- 邮箱: `admin@rungame.online`
- 密码: `admin123`
- 角色: SUPER_ADMIN

### 重置数据库

**警告**: 这将删除所有数据！

```typescript
// 在 seed.ts 中设置
const RESET_DATABASE = true

// 然后运行
npm run db:seed
```

## 性能优化

### 索引策略

所有关键查询字段都已建立索引：
- 唯一标识符 (slug, email)
- 外键 (categoryId, gameId, tagId)
- 常用过滤字段 (status, isEnabled, isFeatured)
- 排序字段 (sortOrder, playCount, rating)

### 连接池优化

1. 使用连接池限制并发连接
2. 生产环境使用 PgBouncer 连接池
3. 设置合理的 `pool_timeout`
4. 监控连接使用情况

### 查询优化

1. **使用 select 而非 include**:
   ```typescript
   // ❌ 不好 - 加载所有字段
   include: { translations: true }

   // ✅ 好 - 只加载需要的字段
   select: {
     translations: {
       select: { locale: true, title: true }
     }
   }
   ```

2. **条件加载翻译**:
   ```typescript
   // 英文不需要加载翻译表
   translations: locale === 'en' ? false : { ... }
   ```

3. **使用 unstable_cache 缓存查询结果**:
   ```typescript
   const getCachedGames = unstable_cache(
     async () => { /* 查询逻辑 */ },
     ['games-list'],
     { revalidate: 3600 }
   )
   ```

## 备份与恢复

### 备份数据库

```bash
pg_dump -h host -U user -d database -F c -f backup.dump
```

### 恢复数据库

```bash
pg_restore -h host -U user -d database -c backup.dump
```

## 故障排查

### 常见问题

1. **连接池耗尽**
   - 检查 `connection_limit` 配置
   - 检查是否有连接泄漏
   - 使用 `prisma.$disconnect()` 关闭连接

2. **查询性能慢**
   - 检查是否缺少索引
   - 使用 `EXPLAIN ANALYZE` 分析查询
   - 考虑添加缓存

3. **Prisma Client 过期**
   - 运行 `npx prisma generate` 重新生成

4. **迁移失败**
   - 检查数据库连接
   - 不要在连接池 URL 上运行迁移
   - 使用直连 URL (port 5432)

## 相关文件

- Schema 定义: [prisma/schema.prisma](../prisma/schema.prisma)
- 数据填充: [prisma/seed.ts](../prisma/seed.ts)
- Prisma 客户端: [lib/prisma.ts](../lib/prisma.ts)
- 数据库配置: [lib/db.ts](../lib/db.ts)
