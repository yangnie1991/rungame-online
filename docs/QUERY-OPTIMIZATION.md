# 查询性能优化指南

本文档说明如何优化 RunGame 的数据库查询性能。

## 📊 当前查询性能分析

### 游戏列表查询

**文件**: [app/(admin)/admin/games/page.tsx](../app/(admin)/admin/games/page.tsx)

**查询方式**: Prisma `findMany` + `include`

**性能指标** (10个游戏):
- 查询数量: 6个 SELECT 查询
- 总耗时: ~6.4秒
- 平均每查询: ~440ms

**查询流程**:
1. 查询所有游戏 (1次)
2. 批量查询游戏翻译 - `WHERE game_id IN (...)` (1次)
3. 批量查询游戏分类关系 - `WHERE game_id IN (...)` (1次)
4. 批量查询分类信息 - `WHERE id IN (...)` (1次)
5. 批量查询分类翻译 - `WHERE category_id IN (...)` (1次)
6. 批量查询游戏标签 - `WHERE game_id IN (...)` (1次)

### 评估

✅ **优点**:
- 使用批量查询，不是 N+1 问题
- 查询数量固定，不随数据增长
- 代码可读性高

⚠️ **缺点**:
- 查询耗时较长（主要是连接延迟）
- 多次往返数据库（6次网络请求）
- 没有利用数据库的 JOIN 优化

---

## 🔧 优化方案

### 方案一：使用 Prisma 查询优化（推荐）

**适用场景**: 大部分情况

**优势**:
- 类型安全
- 代码简洁
- 维护成本低

**优化建议**:

1. **启用连接池**

确保 `DATABASE_URL` 包含连接池配置：

```env
# 开发环境
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"

# 生产环境（使用 PgBouncer）
DATABASE_URL="postgresql://user:pass@host:6432/db?pgbouncer=true&connection_limit=20&pool_timeout=30"
```

2. **使用数据缓存**

在生产环境启用 Next.js 数据缓存：

```typescript
// app/(admin)/admin/games/page.tsx
export const revalidate = 60 // 缓存60秒

async function getGames() {
  const games = await prisma.game.findMany({
    // ...
  })
  return games
}
```

3. **分页加载**

不要一次加载所有游戏：

```typescript
async function getGames(page = 1, limit = 20) {
  const games = await prisma.game.findMany({
    take: limit,
    skip: (page - 1) * limit,
    // ...
  })
  return games
}
```

### 方案二：使用原生 SQL JOIN（高性能）

**适用场景**:
- 数据量大（>1000条）
- 对性能要求极高
- 查询逻辑复杂

**优势**:
- 只需1次数据库往返
- 利用数据库 JOIN 优化
- 性能最佳

**示例代码**:

```typescript
// lib/queries/games.ts
import { prisma } from '@/lib/prisma'

export async function getGamesOptimized() {
  const result = await prisma.$queryRaw`
    SELECT
      g.id,
      g.slug,
      g.title,
      g.thumbnail,
      g.status,
      g.is_featured,
      g.play_count,
      g.rating,

      -- 游戏翻译
      gt.title as translated_title,

      -- 主分类
      c.id as category_id,
      c.slug as category_slug,
      ct.name as category_name,

      -- 标签（聚合为数组）
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('id', t.id, 'name', tt.name)
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as tags

    FROM games g

    -- 游戏翻译
    LEFT JOIN game_translations gt
      ON gt.game_id = g.id AND gt.locale = 'zh'

    -- 游戏分类关系
    LEFT JOIN game_categories gc
      ON gc.game_id = g.id AND gc.is_primary = true
    LEFT JOIN categories c
      ON c.id = gc.category_id
    LEFT JOIN category_translations ct
      ON ct.category_id = c.id AND ct.locale = 'zh'

    -- 游戏标签
    LEFT JOIN game_tags gtag
      ON gtag.game_id = g.id
    LEFT JOIN tags t
      ON t.id = gtag.tag_id
    LEFT JOIN tag_translations tt
      ON tt.tag_id = t.id AND tt.locale = 'zh'

    GROUP BY
      g.id, g.slug, g.title, g.thumbnail, g.status,
      g.is_featured, g.play_count, g.rating,
      gt.title, c.id, c.slug, ct.name

    ORDER BY g.created_at DESC
  `

  return result
}
```

**性能对比**:
- Prisma include: ~6.4秒 (6次查询)
- 原生 JOIN: ~0.5秒 (1次查询) **提升12倍**

### 方案三：使用数据库视图

**适用场景**:
- 查询逻辑固定
- 多个页面使用相同查询
- 需要最佳性能

**步骤**:

1. 创建数据库视图

```sql
-- migrations/create_game_list_view.sql
CREATE OR REPLACE VIEW game_list_view AS
SELECT
  g.id,
  g.slug,
  g.title,
  g.thumbnail,
  g.status,
  g.is_featured,
  g.play_count,
  g.rating,
  gt.title as zh_title,
  c.id as category_id,
  ct.name as category_name,
  json_agg(DISTINCT tt.name) FILTER (WHERE tt.name IS NOT NULL) as tag_names
FROM games g
LEFT JOIN game_translations gt ON gt.game_id = g.id AND gt.locale = 'zh'
LEFT JOIN game_categories gc ON gc.game_id = g.id AND gc.is_primary = true
LEFT JOIN categories c ON c.id = gc.category_id
LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = 'zh'
LEFT JOIN game_tags gtag ON gtag.game_id = g.id
LEFT JOIN tags t ON t.id = gtag.tag_id
LEFT JOIN tag_translations tt ON tt.tag_id = t.id AND tt.locale = 'zh'
GROUP BY g.id, gt.title, c.id, ct.name;
```

2. 在代码中查询视图

```typescript
const games = await prisma.$queryRaw`
  SELECT * FROM game_list_view
  ORDER BY created_at DESC
`
```

---

## 📈 性能测试

使用提供的脚本测试查询性能：

```bash
# 分析当前查询
npx tsx scripts/analyze-game-queries.ts

# 比较不同方案
npx tsx scripts/benchmark-queries.ts
```

---

## 💡 最佳实践

### 1. 合理使用索引

确保以下字段有索引：
- ✅ 外键字段 (`game_id`, `category_id`, `tag_id`)
- ✅ 查询条件字段 (`locale`, `isPrimary`, `status`)
- ✅ 排序字段 (`createdAt`, `playCount`)

### 2. 避免 SELECT *

只查询需要的字段：

```typescript
// ❌ 不好
const games = await prisma.game.findMany()

// ✅ 好
const games = await prisma.game.findMany({
  select: {
    id: true,
    slug: true,
    title: true,
    thumbnail: true,
  }
})
```

### 3. 使用分页

不要一次加载所有数据：

```typescript
// 分页参数
const page = 1
const limit = 20

const [games, total] = await Promise.all([
  prisma.game.findMany({
    take: limit,
    skip: (page - 1) * limit,
    // ...
  }),
  prisma.game.count(),
])
```

### 4. 启用缓存

对于不常变化的数据，使用缓存：

```typescript
import { unstable_cache } from 'next/cache'

const getGames = unstable_cache(
  async () => {
    return await prisma.game.findMany({
      // ...
    })
  },
  ['games-list'],
  { revalidate: 300 } // 5分钟
)
```

### 5. 监控查询性能

在开发环境启用 Prisma 查询日志：

```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})
```

---

## 🔍 故障排查

### 查询慢的常见原因

1. **缺少索引**
   - 运行 `EXPLAIN ANALYZE` 检查执行计划
   - 添加必要的索引

2. **N+1 问题**
   - 使用 `include` 而不是循环查询
   - 使用批量查询

3. **网络延迟**
   - 使用连接池
   - 考虑使用 PgBouncer

4. **数据量大**
   - 实施分页
   - 添加筛选条件

5. **缺乏缓存**
   - 使用 Next.js 缓存
   - 考虑 Redis 缓存

### 性能调试工具

```bash
# 查看慢查询
psql -U user -d database -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 分析查询计划
psql -U user -d database -c "EXPLAIN ANALYZE SELECT ..."

# 查看索引使用情况
psql -U user -d database -c "SELECT * FROM pg_stat_user_indexes;"
```

---

## 📚 相关文档

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

**最后更新**: 2025-01-20
**版本**: v1.0
