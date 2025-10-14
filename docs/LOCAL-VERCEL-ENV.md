# 本地 Vercel 环境配置指南

本指南说明如何在本地开发环境中模拟 Vercel 生产环境配置。

## 为什么需要本地 Vercel 环境？

在 Vercel 部署时，我们需要确保：
1. 本地开发环境与生产环境使用相同的配置
2. 在提交代码前验证功能在生产环境中能正常工作
3. 避免频繁部署导致的时间浪费和构建配额消耗

## 配置步骤

### 1. 环境变量配置

Next.js 支持多种环境文件，优先级从高到低：

```
.env.local          <- 本地开发专用（优先级最高，不提交到 Git）
.env.development    <- 开发环境专用
.env.production     <- 生产环境专用
.env                <- 所有环境的默认值（提交到 Git）
```

**推荐配置：**
- `.env` - 存放通用配置模板
- `.env.local` - 存放本地敏感配置（模拟 Vercel 环境）

### 2. 配置 `.env.local`

创建或编辑 `.env.local` 文件（此文件已在 `.gitignore` 中）：

```bash
# ==================== Vercel 本地开发环境配置 ====================
# 此文件模拟 Vercel 生产环境的环境变量

# ==================== 数据库配置 ====================
# Supabase Database (与 Vercel 生产环境一致)
DATABASE_URL="postgres://your-connection-string"

# ==================== NextAuth.js 配置 ====================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# ==================== 应用配置 ====================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ==================== Cloudflare R2 配置 (可选) ====================
# 从 Vercel 控制台复制
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

### 3. 从 Vercel 同步环境变量

#### 方法 A：手动复制（推荐，简单直接）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目 → Settings → Environment Variables
3. 复制 Production 环境的变量到 `.env.local`

#### 方法 B：使用 Vercel CLI（自动同步）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local
```

### 4. 启动本地开发服务器

```bash
# 使用 .env.local 中的配置启动
npm run dev
```

服务器将：
- ✅ 自动加载 `.env.local` 配置（优先级高于 `.env`）
- ✅ 连接到 Supabase 生产数据库（只读或测试数据）
- ✅ 模拟 Vercel 生产环境行为

## 验证配置

### 1. 检查环境变量加载

启动服务器后，查看输出：

```
✓ Starting...
- Environments: .env.local, .env
```

如果看到 `.env.local`，说明配置成功。

### 2. 测试数据库连接

查看 Prisma 查询日志：

```bash
# 启用 Prisma 查询日志
DEBUG=prisma:query npm run dev
```

应该能看到类似的输出：

```
prisma:query SELECT * FROM "public"."games" ...
```

### 3. 测试核心功能

访问以下页面验证功能：

| 功能 | URL | 验证点 |
|------|-----|--------|
| 首页 | http://localhost:3000 | 显示游戏列表 |
| 游戏详情 | http://localhost:3000/games/{slug} | 加载游戏数据 |
| 管理后台 | http://localhost:3000/login | 登录功能 |
| 多语言 | http://localhost:3000/zh | 中文界面 |

## 常见问题

### Q1: 本地环境会影响生产数据库吗？

**A:** 看配置方式：
- 如果使用 Supabase 生产数据库 → 会影响（不推荐）
- 推荐做法：
  1. 创建 Supabase 开发项目
  2. 在 `.env.local` 中使用开发项目连接字符串
  3. 运行 `npm run db:seed` 填充测试数据

### Q2: 如何切换不同的数据库？

在 `.env.local` 中注释/取消注释不同的 `DATABASE_URL`：

```bash
# 使用 Supabase 生产数据库
DATABASE_URL="postgres://prod-connection-string"

# 使用本地 PostgreSQL
# DATABASE_URL="postgresql://localhost:5432/rungame_dev"

# 使用阿里云 RDS
# DATABASE_URL="postgresql://rds-connection-string"
```

### Q3: `.env.local` 会被提交到 Git 吗？

**不会。** `.env.local` 已在 `.gitignore` 中排除，只存在于本地。

### Q4: 如何同步团队成员的环境配置？

1. 使用 `.env.example` 作为模板（已提交到 Git）
2. 团队成员复制 `.env.example` → `.env.local`
3. 填入各自的敏感信息（数据库密码、API 密钥等）

### Q5: 本地开发可以使用 Vercel 的 Edge Functions 吗？

**不能。** `npm run dev` 不支持 Edge Runtime。

如需测试 Edge Functions：
```bash
vercel dev
```

但大多数情况下，普通的 `npm run dev` 足够用。

## Vercel CLI 高级用法

如果需要更接近 Vercel 的本地环境：

```bash
# 启动 Vercel 本地开发环境（模拟 Serverless Functions）
vercel dev

# 指定端口
vercel dev --listen 3001

# 使用生产环境变量
vercel dev --environment production
```

**区别：**

| 特性 | `npm run dev` | `vercel dev` |
|------|--------------|--------------|
| 启动速度 | 快 | 慢 |
| Edge Runtime | ❌ | ✅ |
| Serverless Functions | ❌ | ✅ |
| 环境变量同步 | 手动 | 自动 |
| 适用场景 | 日常开发 | 测试部署 |

## 最佳实践

### 1. 环境分离

```bash
.env                 # 通用配置（提交）
.env.local           # 本地开发（不提交）
.env.production      # 生产专用（Vercel 自动使用）
```

### 2. 敏感信息管理

❌ **错误做法：**
```bash
# .env（会提交到 Git）
DATABASE_URL="postgres://user:password@host/db"
```

✅ **正确做法：**
```bash
# .env.example（模板，可提交）
DATABASE_URL="postgres://user:password@host/db"

# .env.local（实际值，不提交）
DATABASE_URL="postgres://real-password@supabase.com/prod"
```

### 3. 开发 vs 生产

使用不同的数据库和服务：

| 环境 | 数据库 | 存储 | 认证 |
|------|-------|------|------|
| 本地开发 | Supabase Dev | Cloudflare R2 Dev | 测试账号 |
| Vercel 生产 | Supabase Prod | Cloudflare R2 Prod | 真实用户 |

### 4. 环境变量检查清单

部署前确认：

- [ ] `DATABASE_URL` 是否指向正确的数据库？
- [ ] `NEXTAUTH_URL` 是否是生产域名？
- [ ] `NEXTAUTH_SECRET` 是否足够安全（至少 32 字符）？
- [ ] R2 配置是否正确（如果使用图片上传）？
- [ ] 敏感信息是否已从 `.env` 移除？

## 相关文档

- [Next.js 环境变量文档](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel 环境变量指南](https://vercel.com/docs/projects/environment-variables)
- [项目部署文档](./DEPLOYMENT.md)
- [Supabase 配置文档](./SUPABASE-SETUP.md)
- [Vercel-Supabase 集成](./VERCEL-SUPABASE-INTEGRATION.md)

---

**创建时间:** 2025-10-14
**最后更新:** 2025-10-14
