# 数据库初始化说明

本目录包含两种方式来初始化数据库：

## 方式一：使用 SQL 文件（推荐 - 速度快）

### 1. 使用提供的 Shell 脚本（最简单）

```bash
./prisma/import-seed-data.sh
```

### 2. 手动执行 SQL 文件

如果你有 `psql` 命令行工具：

```bash
PGPASSWORD="GzhKVeHrAVyZnu33" psql \
  -h aws-1-us-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.kmwfklazjqxffjakpomg \
  -d postgres \
  < prisma/seed-data.sql
```

### 3. 在 Supabase Dashboard 中执行

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `prisma/seed-data.sql` 文件的全部内容
4. 粘贴到 SQL Editor 并执行

## 方式二：使用 TypeScript Seed 脚本（慢）

```bash
npm run db:seed
```

**注意：** 由于需要创建 152 个分类，这个方式可能需要 5 分钟以上。推荐使用方式一。

## 初始化数据内容

### 📊 数据统计

- **语言**: 2 个 (英语 en, 中文 zh)
- **管理员**: 1 个
- **导入平台**: 1 个 (GamePix)
- **分类**: 152 个 (从 GamePix API 获取)
- **页面类型**: 4 个

### 📄 页面类型

1. **最多人游玩** (`most-played`) - 按游玩次数排序
2. **最新游戏** (`new-games`) - 按创建时间排序
3. **精选游戏** (`featured`) - 编辑精选，按评分排序
4. **趋势游戏** (`trending`) - 热门趋势，按评分排序

### 🔑 管理员账号

- **邮箱**: `admin@rungame.online`
- **密码**: `admin123`
- **角色**: SUPER_ADMIN

### 🎮 导入平台

- **GamePix**
  - Site ID: `8RI7HLK9GV8W`
  - Feed URL: `https://public.gamepix.com/json/feeds/v2/games.json`
  - Category URL: `https://public.gamepix.com/json/feeds/v2/games/category/list.json`

## 重新生成 SQL 文件

如果需要修改初始化数据并重新生成 SQL 文件：

```bash
npx tsx prisma/generate-seed-sql.ts
```

这将重新生成 `prisma/seed-data.sql` 文件。

## 清空并重建数据库

**⚠️ 危险操作：** 这将删除所有现有数据！

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="清空数据库并重新填充初始数据" \
DATABASE_URL="postgres://postgres.kmwfklazjqxffjakpomg:GzhKVeHrAVyZnu33@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" \
npx prisma db push --force-reset --accept-data-loss
```

然后执行上面的任一初始化方式。
