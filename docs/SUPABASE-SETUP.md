# Supabase 数据库配置指南

本文档详细说明如何配置 Supabase PostgreSQL 数据库用于 RunGame 项目。

## 为什么选择 Supabase

- ✅ **PostgreSQL** - 与项目 Prisma schema 完全兼容
- ✅ **免费额度慷慨** - 500MB 数据库,够 MVP 使用
- ✅ **内置连接池** - PgBouncer,无需额外配置
- ✅ **自动备份** - 数据安全有保障
- ✅ **全球部署** - 低延迟访问
- ✅ **实时功能** - 未来可扩展

## 配置步骤

### 1. 创建 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **Start your project**
3. 使用 GitHub 账号登录 (推荐)

### 2. 创建新项目

1. 点击 **New Project**
2. 填写项目信息:
   - **Name**: `rungame-nextjs` (或您喜欢的名称)
   - **Database Password**: 生成强密码 (保存好!)
   - **Region**: 选择离用户最近的区域
     - 中国用户: `Southeast Asia (Singapore)`
     - 北美用户: `US West (Oregon)`
     - 欧洲用户: `Europe (Frankfurt)`
   - **Pricing Plan**: Free (免费计划)
3. 点击 **Create new project**
4. 等待项目初始化 (约 2 分钟)

### 3. 获取数据库连接字符串

1. 在项目 Dashboard,点击左侧 **Settings** (设置图标)
2. 选择 **Database**
3. 找到 **Connection string** 部分
4. 选择 **Transaction** 模式 (用于 Prisma)

**连接字符串格式**:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

5. **重要**: 添加 Prisma 所需的参数:

**开发环境** (直连):
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**生产环境** (连接池):
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20"
```

**参数说明**:
- `6543` - PgBouncer 端口 (使用连接池)
- `pgbouncer=true` - 告诉 Prisma 使用 PgBouncer 模式
- `connection_limit=10` - 每个 Prisma Client 最大连接数
- `pool_timeout=20` - 连接池超时时间(秒)

---

### ⚠️ Vercel 集成 Supabase 的特殊说明

如果您在 Vercel 中通过 **Storage** → **Connect Store** → **Supabase** 集成数据库,Vercel 会自动创建以下环境变量:

| Vercel 变量名 | 说明 | 端口 | 用途 |
|--------------|------|------|------|
| `POSTGRES_URL` | 完整连接 URL | 5432 | 不推荐 |
| `POSTGRES_URL_NON_POOLING` | 直连 URL | 5432 | 用于数据库迁移 |
| `POSTGRES_POOLER_URL` | 连接池 URL | 6543 | **推荐用于应用** |
| `POSTGRES_PRISMA_URL` | Prisma 专用 URL | 6543 | **推荐用于 Prisma** |

**推荐配置 (Vercel 部署)**:

在 Vercel 环境变量中设置:

```env
# 方式 1: 使用 Vercel 自动生成的 Prisma 变量 (推荐)
DATABASE_URL=${POSTGRES_PRISMA_URL}

# 方式 2: 使用连接池 URL + 手动参数
DATABASE_URL=${POSTGRES_POOLER_URL}?pgbouncer=true&connection_limit=10
```

**优点**:
- ✅ 无需手动复制连接字符串
- ✅ Vercel 自动管理和更新
- ✅ 环境隔离 (Production/Preview/Development)

---

### 4. 配置环境变量

在项目根目录的 `.env` 文件中:

```env
# Supabase 数据库连接
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20"

# NextAuth.js 配置
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**注意**:
- 将 `[project-ref]` 替换为您的项目 ID
- 将 `[password]` 替换为数据库密码
- 将 `[region]` 替换为您选择的区域

### 5. 推送数据库 Schema

在项目根目录执行:

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到数据库
npm run db:push

# 或使用 migrate (生产环境推荐)
npx prisma migrate deploy
```

**预期输出**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

🚀  Your database is now in sync with your Prisma schema. Done in 3.45s
```

### 6. 填充初始数据

```bash
npm run db:seed
```

这将创建:
- ✅ 超级管理员账户 (admin@rungame.online / admin123)
- ✅ 25 个游戏分类 (中英文翻译)
- ✅ 30 个示例游戏
- ✅ 所有标签
- ✅ 15 种支持的语言

**完成!** 您的数据库已配置完成。

---

## 验证连接

### 方法 1: 使用 Prisma Studio

```bash
npx prisma studio
```

浏览器自动打开 `http://localhost:5555`,可以可视化查看和编辑数据。

### 方法 2: 直接查询

创建测试文件 `test-db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const count = await prisma.category.count()
  console.log('分类数量:', count)

  const admin = await prisma.admin.findFirst()
  console.log('管理员:', admin?.email)
}

test()
```

运行:
```bash
npx tsx test-db.ts
```

---

## Supabase Dashboard 使用

### 查看数据

1. 进入 Supabase Dashboard
2. 左侧选择 **Table Editor**
3. 可以查看所有表和数据

### 执行 SQL 查询

1. 左侧选择 **SQL Editor**
2. 可以直接运行 SQL 查询

**示例查询**:
```sql
-- 查看所有分类
SELECT * FROM "Category";

-- 查看游戏数量
SELECT COUNT(*) FROM "Game";

-- 查看管理员
SELECT * FROM "Admin";
```

### 监控连接数

1. Settings → Database
2. 查看 **Connection pooling** 状态
3. 监控活跃连接数

---

## 性能优化

### 1. 连接池配置

**已内置 PgBouncer**,无需额外配置,但注意:

```env
# 开发环境 (1个实例)
connection_limit=1

# 生产环境 (多个实例)
connection_limit=10

# 计算公式
总连接数 = Vercel 实例数 × connection_limit
```

Supabase Free 计划限制: 60 个并发连接

### 2. 数据库索引

所有必要的索引已在 Prisma schema 中定义:
- Game: `slug`, `categoryId`, `isFeatured`, `playCount`
- Category: `slug`, `isEnabled`
- Tag: `slug`, `isEnabled`
- Translation: `locale`, `entityId + locale` (unique)

### 3. 查询优化

使用项目提供的翻译辅助函数:

```typescript
import { buildLocaleCondition, getTranslationWithFallback } from "@/lib/i18n-helpers"

// 查询时获取当前语言和回退语言
const game = await prisma.game.findUnique({
  where: { slug },
  include: {
    translations: {
      where: buildLocaleCondition(locale),
    },
  },
})

// 获取翻译,自动回退
const translation = getTranslationWithFallback(game.translations, locale)
```

---

## 迁移到生产环境

### Vercel 环境变量配置

1. 进入 Vercel 项目 Settings
2. 选择 **Environment Variables**
3. 添加:
   ```
   DATABASE_URL = postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
   NEXTAUTH_SECRET = your-secret-key
   NEXTAUTH_URL = https://yourdomain.com
   ```
4. 标记 `DATABASE_URL` 和 `NEXTAUTH_SECRET` 为 **Sensitive**

### 部署后初始化

**方法 1: 使用 Vercel CLI**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 运行迁移
vercel env pull .env.production
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

**方法 2: 在本地连接生产数据库**

```bash
# 临时使用生产环境变量
export DATABASE_URL="postgresql://..."

# 推送 schema
npx prisma db push

# 填充数据
npx tsx prisma/seed.ts
```

---

## 扩展到 Pro 计划

当您需要更多资源时:

### Free vs Pro 对比

| 特性 | Free | Pro ($25/月) |
|------|------|--------------|
| **数据库大小** | 500 MB | 8 GB |
| **带宽** | 5 GB | 250 GB |
| **文件存储** | 1 GB | 100 GB |
| **并发连接** | 60 | 400 |
| **备份保留** | 7 天 | 30 天 |
| **支持** | 社区 | 邮件支持 |

### 何时升级

✅ 数据库使用 > 400 MB
✅ 并发用户 > 500
✅ 需要更长备份保留期
✅ 需要技术支持

### 升级步骤

1. Supabase Dashboard → Settings → Billing
2. 选择 **Pro Plan**
3. 添加付款方式
4. 升级完成,无需修改代码

---

## 备份策略

### 自动备份 (Supabase 提供)

- Free: 保留 7 天
- Pro: 保留 30 天

### 手动备份

```bash
# 导出数据库
pg_dump "$DATABASE_URL" > backup.sql

# 压缩
gzip backup.sql

# 恢复
psql "$DATABASE_URL" < backup.sql
```

### 定期备份脚本

创建 `scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

pg_dump "$DATABASE_URL" | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

echo "备份完成: backup_$DATE.sql.gz"

# 保留最近 30 天
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

---

## 监控和维护

### 查看数据库使用情况

1. Supabase Dashboard → Settings → Usage
2. 查看:
   - 数据库大小
   - 活跃连接数
   - API 请求数

### 性能监控

```sql
-- 查看慢查询
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 查看表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 故障排查

### 问题 1: "Can't reach database server"

**原因**: 连接字符串错误或网络问题

**解决方案**:
1. 检查连接字符串格式
2. 确认密码正确
3. 测试网络连接:
   ```bash
   psql "$DATABASE_URL"
   ```

### 问题 2: "Too many connections"

**原因**: 超过并发连接限制

**解决方案**:
1. 减小 `connection_limit` 参数
2. 确保使用 PgBouncer (端口 6543)
3. 升级到 Pro 计划 (400 连接)

### 问题 3: Prisma 迁移失败

**原因**: PgBouncer 不支持某些 Prisma 命令

**解决方案**:
使用直连端口 5432 (不经过 PgBouncer):

```bash
# 临时使用直连
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" npx prisma migrate dev
```

---

## 相关文档

- [环境变量配置](./ENVIRONMENT.md)
- [部署指南](./DEPLOYMENT.md)
- [数据库连接问题](./DATABASE-CONNECTION-ISSUE.md)
- [Supabase 官方文档](https://supabase.com/docs)

---

**最后更新**: 2025-01-14
