# Vercel + Supabase 集成配置指南

本文档说明如何使用 Vercel 提供的自动 Supabase 集成环境变量。

## Vercel 自动生成的环境变量

当您通过 Vercel Storage 集成 Supabase 后,Vercel 会自动创建以下环境变量:

### 数据库连接变量

| 变量名 | 说明 | 用途 |
|--------|------|------|
| `DATABASE_POSTGRES_URL` | 完整连接 URL (6543) | 通用连接 |
| `DATABASE_POSTGRES_PRISMA_URL` | Prisma 专用 URL (6543) | ✅ **推荐用于 Prisma** |
| `DATABASE_POSTGRES_URL_NON_POOLING` | 直连 URL (5432) | 用于数据库迁移 |

### 数据库信息变量

| 变量名 | 说明 |
|--------|------|
| `DATABASE_POSTGRES_USER` | 数据库用户名 |
| `DATABASE_POSTGRES_PASSWORD` | 数据库密码 |
| `DATABASE_POSTGRES_HOST` | 数据库主机地址 |
| `DATABASE_POSTGRES_DATABASE` | 数据库名称 |

### Supabase API 变量

| 变量名 | 说明 |
|--------|------|
| `DATABASE_SUPABASE_URL` | Supabase API URL |
| `DATABASE_NEXT_PUBLIC_SUPABASE_URL` | 公开的 Supabase URL (客户端) |
| `DATABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名访问密钥 (客户端) |
| `DATABASE_SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥 (服务端) |
| `DATABASE_SUPABASE_JWT_SECRET` | JWT 签名密钥 |

---

## 配置步骤

### 1. 添加 DATABASE_URL 环境变量

在 Vercel 项目中:

**Settings → Environment Variables → Add New**

```
Name: DATABASE_URL
Value: ${DATABASE_POSTGRES_PRISMA_URL}
```

**Environment**: 勾选 Production, Preview, Development

点击 **Save**

### 2. 验证变量

在 Vercel 环境变量页面,您应该看到:

```
DATABASE_URL = ${DATABASE_POSTGRES_PRISMA_URL}
DATABASE_POSTGRES_PRISMA_URL = postgres://postgres.xxx...
DATABASE_POSTGRES_URL = postgres://postgres.xxx...
DATABASE_POSTGRES_URL_NON_POOLING = postgres://postgres.xxx...
... (其他变量)
```

### 3. 本地开发配置

在本地 `.env` 文件中:

```env
# 从 Vercel 复制 POSTGRES_PRISMA_URL 的值
DATABASE_URL="postgres://postgres.kmwfklazjqxffjakpomg:GzhKVeHrAVyZnu33@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# NextAuth 配置
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# R2 配置 (可选)
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="rungame-assets"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
```

**注意**: 本地开发时直接使用完整的连接字符串,因为 `${VAR}` 引用语法只在 Vercel 中生效。

### 4. 推送数据库 Schema

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到数据库
npm run db:push

# 填充初始数据
npm run db:seed
```

---

## 重要说明

### ✅ 正确的连接字符串

使用 **`DATABASE_POSTGRES_PRISMA_URL`**:

```
postgres://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**特点**:
- ✅ 端口 6543 (PgBouncer 连接池)
- ✅ `pgbouncer=true` 参数
- ✅ `sslmode=require` SSL 连接

### ❌ 不推荐使用的连接

**`DATABASE_POSTGRES_URL`**:
```
postgres://...?sslmode=require&supa=base-pooler.x
```
- ❌ 缺少 `pgbouncer=true` 参数
- ⚠️ 可能导致连接问题

**`DATABASE_POSTGRES_URL_NON_POOLING`**:
```
postgres://...5432/postgres
```
- ❌ 端口 5432 (直连,无连接池)
- ⚠️ 容易耗尽连接数
- ✅ 仅用于数据库迁移

---

## 数据库迁移

如果需要运行 Prisma 迁移:

```bash
# 使用非连接池 URL (端口 5432)
DATABASE_URL="${DATABASE_POSTGRES_URL_NON_POOLING}" npx prisma migrate dev

# 或在 Vercel 中
vercel env pull .env.local
export DATABASE_URL=$(grep DATABASE_POSTGRES_URL_NON_POOLING .env.local | cut -d '=' -f2-)
npx prisma migrate deploy
```

**原因**: PgBouncer 不支持某些迁移命令,需要直连。

---

## Prisma 配置说明

您的 `prisma/schema.prisma` 应该包含:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

当部署到 Vercel 时:
- `DATABASE_URL` = `${DATABASE_POSTGRES_PRISMA_URL}`
- 自动使用正确的连接池配置

---

## 连接池配置

`DATABASE_POSTGRES_PRISMA_URL` 已包含 `pgbouncer=true`,但您可以添加额外参数:

```env
# 在 Vercel 环境变量中
DATABASE_URL = ${DATABASE_POSTGRES_PRISMA_URL}&connection_limit=10&pool_timeout=20
```

**推荐配置**:
- `connection_limit=10` - 每个实例最大连接数
- `pool_timeout=20` - 连接超时 (秒)

---

## 验证配置

### 1. 测试连接

```bash
# 使用 Prisma Studio
npx prisma studio

# 或直接查询
npx prisma db execute --stdin <<< "SELECT version();"
```

### 2. 检查连接池

在 Supabase Dashboard 中:

**Settings → Database → Connection pooling**

查看:
- Active connections
- Idle connections
- Max connections

### 3. Vercel 部署日志

部署后,在 Vercel Deployment Logs 中查找:

```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Connected to PostgreSQL database
```

---

## 常见问题

### Q1: 如何在本地获取 Vercel 环境变量?

**A**: 使用 Vercel CLI:

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 拉取环境变量
vercel env pull .env.local
```

然后从 `.env.local` 复制 `DATABASE_POSTGRES_PRISMA_URL` 的值到 `.env`。

---

### Q2: 为什么要使用 `${DATABASE_POSTGRES_PRISMA_URL}` 而不是直接值?

**A**: 使用变量引用的优点:

- ✅ Vercel 自动管理和更新
- ✅ 跨环境一致 (Production/Preview/Development)
- ✅ 安全,不暴露实际连接字符串
- ✅ Supabase 更新密钥时自动同步

---

### Q3: `DATABASE_URL` 和 `DATABASE_POSTGRES_PRISMA_URL` 的区别?

**A**:

| 变量 | 说明 |
|------|------|
| `DATABASE_POSTGRES_PRISMA_URL` | Vercel 自动生成的 Prisma 专用 URL |
| `DATABASE_URL` | 您手动创建的变量,引用上面的 URL |

`DATABASE_URL` 是 Prisma 默认查找的变量名,所以需要创建它并指向 `DATABASE_POSTGRES_PRISMA_URL`。

---

### Q4: 如何切换数据库环境?

**A**: Vercel 自动为不同环境提供不同的数据库连接:

- **Production**: 生产数据库
- **Preview**: 预览数据库 (可配置)
- **Development**: 开发数据库 (可配置)

在 Vercel Storage 设置中可配置每个环境使用的 Supabase 项目。

---

## 完整配置示例

### Vercel 环境变量

```env
# Prisma 连接 (必需)
DATABASE_URL = ${DATABASE_POSTGRES_PRISMA_URL}

# NextAuth (必需)
NEXTAUTH_SECRET = xxx
NEXTAUTH_URL = https://yourdomain.com

# R2 存储 (可选)
R2_ACCOUNT_ID = xxx
R2_ACCESS_KEY_ID = xxx
R2_SECRET_ACCESS_KEY = xxx (Sensitive)
R2_BUCKET_NAME = rungame-assets
R2_PUBLIC_URL = https://pub-xxx.r2.dev

# Vercel 自动生成的 Supabase 变量 (无需手动添加)
DATABASE_POSTGRES_PRISMA_URL = postgres://...
DATABASE_POSTGRES_URL = postgres://...
DATABASE_POSTGRES_URL_NON_POOLING = postgres://...
DATABASE_SUPABASE_URL = https://...
... (其他变量)
```

### 本地 .env 文件

```env
# 数据库连接 (从 Vercel 复制完整 URL)
DATABASE_URL="postgres://postgres.kmwfklazjqxffjakpomg:GzhKVeHrAVyZnu33@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# NextAuth
NEXTAUTH_SECRET="your-local-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# R2
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="rungame-assets"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
```

---

## 相关文档

- [Supabase 配置指南](./SUPABASE-SETUP.md)
- [部署清单](./DEPLOYMENT-CHECKLIST.md)
- [环境变量配置](./ENVIRONMENT.md)
- [Vercel 官方文档](https://vercel.com/docs/storage/vercel-postgres)

---

**最后更新**: 2025-01-14
