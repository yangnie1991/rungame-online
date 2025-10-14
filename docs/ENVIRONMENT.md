# 环境变量配置说明

本文档详细说明 RunGame 项目所需的所有环境变量。

## 环境变量文件

项目使用 `.env` 文件存储环境变量。Next.js 会自动加载该文件。

### 文件位置

```
/Users/yangnie/Desktop/game/rungame-nextjs/.env
```

### 创建环境文件

```bash
# 从示例文件复制
cp .env.example .env

# 或手动创建
touch .env
```

## 必需的环境变量

### 1. 数据库连接 (DATABASE_URL)

**用途**: 连接 PostgreSQL 数据库

**格式**:
```env
DATABASE_URL="postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[参数]"
```

**开发环境示例**:
```env
DATABASE_URL="postgresql://game:password@localhost:5432/game?schema=public&connection_limit=5&pool_timeout=10"
```

**生产环境示例（使用 PgBouncer）**:
```env
DATABASE_URL="postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:6432/game?schema=public&pgbouncer=true&connection_limit=10&pool_timeout=20"
```

**参数说明**:

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `schema` | 数据库 schema | `public` |
| `connection_limit` | 每个 Prisma Client 的最大连接数 | 开发: `5`, 生产: `10` |
| `pool_timeout` | 连接池超时（秒） | 开发: `10`, 生产: `20` |
| `pgbouncer` | 是否使用 PgBouncer | 生产环境: `true` |

**重要提示**:
- ⚠️ 不要将密码明文提交到 Git
- ⚠️ 使用强密码
- ⚠️ 生产环境必须使用加密连接

### 2. NextAuth 密钥 (NEXTAUTH_SECRET)

**用途**: 加密 JWT token 和会话数据

**生成方法**:
```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 在线生成
# https://generate-secret.vercel.app/32
```

**配置**:
```env
NEXTAUTH_SECRET="your-random-generated-secret-key-here"
```

**要求**:
- 最少 32 字符
- 随机生成
- 生产和开发环境使用不同的密钥
- 绝对不要公开或提交到版本控制

### 3. NextAuth URL (NEXTAUTH_URL)

**用途**: NextAuth.js 回调 URL 基础路径

**开发环境**:
```env
NEXTAUTH_URL="http://localhost:3000"
```

**生产环境**:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

**说明**:
- 必须是完整的 URL（包括协议）
- 不要在末尾添加斜杠
- 生产环境必须使用 HTTPS

## 可选的环境变量

### 4. Node 环境 (NODE_ENV)

**用途**: 指定运行环境

```env
# 开发环境
NODE_ENV="development"

# 生产环境
NODE_ENV="production"

# 测试环境
NODE_ENV="test"
```

**说明**:
- Next.js 会根据命令自动设置
- `npm run dev` → `development`
- `npm run build` → `production`
- 手动设置会覆盖自动值

### 5. 端口号 (PORT)

**用途**: 指定应用监听端口

```env
PORT=3000
```

**默认值**: `3000`

**说明**:
- 开发环境通常使用 3000
- 生产环境可根据需求修改
- Vercel 会自动分配端口

### 6. 日志级别 (LOG_LEVEL)

**用途**: 控制日志输出级别

```env
LOG_LEVEL="info"
```

**可选值**:
- `debug` - 详细调试信息
- `info` - 一般信息（推荐）
- `warn` - 警告信息
- `error` - 仅错误信息

### 7. Cloudflare R2 配置 (可选)

**用途**: 用于上传和存储自定义图片（分类图标、横幅等）

详细配置步骤见 [R2-CDN-SETUP.md](./R2-CDN-SETUP.md)

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID="你的 Account ID"
R2_ACCESS_KEY_ID="你的 Access Key ID"
R2_SECRET_ACCESS_KEY="你的 Secret Access Key"
R2_BUCKET_NAME="rungame-assets"

# R2 公共 CDN 地址 (根据您的选择填写其一)
# 方式 A: 使用 r2.dev 域名
R2_PUBLIC_URL="https://pub-xxxxxxxxxxxxx.r2.dev"

# 方式 B: 使用自定义域名 (推荐)
# R2_PUBLIC_URL="https://cdn.yourdomain.com"
```

**参数说明**:

| 参数 | 说明 | 是否必需 |
|------|------|----------|
| `R2_ACCOUNT_ID` | Cloudflare Account ID | 是 |
| `R2_ACCESS_KEY_ID` | R2 API Token Access Key | 是 |
| `R2_SECRET_ACCESS_KEY` | R2 API Token Secret | 是 |
| `R2_BUCKET_NAME` | R2 Bucket 名称 | 是 |
| `R2_PUBLIC_URL` | 公共访问 CDN 地址 | 是 |

**说明**:
- 如果不配置,项目仍可正常运行,但无法上传自定义图片
- 游戏缩略图来自第三方平台,不需要 R2
- 仅管理员上传自定义分类图标、横幅时需要

## 环境变量配置示例

### 开发环境完整配置

```env
# .env (开发环境)

# 数据库连接
DATABASE_URL="postgresql://game:dev_password@localhost:5432/game_dev?schema=public&connection_limit=5&pool_timeout=10"

# NextAuth.js 配置
NEXTAUTH_SECRET="dev-secret-key-change-this-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
NODE_ENV="development"
PORT=3000
LOG_LEVEL="debug"
```

### 生产环境完整配置

```env
# .env.production (生产环境)

# 数据库连接（使用 PgBouncer）
DATABASE_URL="postgresql://game:strong_prod_password@db.example.com:6432/game_prod?schema=public&pgbouncer=true&connection_limit=10&pool_timeout=20"

# NextAuth.js 配置
NEXTAUTH_SECRET="production-secret-key-very-long-and-random-32chars-or-more"
NEXTAUTH_URL="https://rungame.online"

# 应用配置
NODE_ENV="production"
LOG_LEVEL="info"
```

## 平台特定配置

### Vercel

在 Vercel 项目设置中配置环境变量：

1. 进入项目 Settings
2. 选择 Environment Variables
3. 添加以下变量：

```
DATABASE_URL = postgresql://...
NEXTAUTH_SECRET = your-secret
NEXTAUTH_URL = https://your-app.vercel.app
```

**注意**: Vercel 会自动设置 `NODE_ENV`

### Docker

使用 `.env` 文件或通过 Docker 命令传递：

```bash
# 使用 .env 文件
docker run --env-file .env -p 3000:3000 rungame

# 直接传递变量
docker run \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://..." \
  -p 3000:3000 \
  rungame
```

### Docker Compose

```yaml
services:
  app:
    image: rungame
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    # 或使用 env_file
    env_file:
      - .env
```

## 安全最佳实践

### 1. 不要提交敏感信息

确保 `.env` 文件在 `.gitignore` 中：

```gitignore
# .gitignore
.env
.env.local
.env.production
.env.development
```

### 2. 使用不同的环境配置

```
.env                  # 默认配置（提交到 Git，不包含敏感信息）
.env.local            # 本地覆盖（不提交）
.env.development      # 开发环境（不提交）
.env.production       # 生产环境（不提交）
```

**加载优先级**:
1. `.env.local`（最高优先级）
2. `.env.development` 或 `.env.production`
3. `.env`（最低优先级）

### 3. 使用密钥管理服务

生产环境推荐使用：

- **Vercel**: 内置环境变量管理
- **AWS Secrets Manager**: AWS 服务
- **HashiCorp Vault**: 企业级密钥管理
- **Google Secret Manager**: GCP 服务

### 4. 定期轮换密钥

- 每 90 天更换 `NEXTAUTH_SECRET`
- 数据库密码定期更新
- API 密钥定期轮换

### 5. 限制访问权限

- 只有必要的人员可访问生产环境变量
- 使用 RBAC（基于角色的访问控制）
- 记录所有密钥访问日志

## 验证环境变量

### 开发时验证

创建验证脚本 `scripts/check-env.ts`:

```typescript
// scripts/check-env.ts
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

运行验证：
```bash
npx tsx scripts/check-env.ts
```

### 使用 Zod 验证（推荐）

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

export const env = envSchema.parse(process.env);
```

## 故障排查

### 问题 1: 找不到环境变量

**症状**:
```
Error: DATABASE_URL is not defined
```

**解决方案**:
1. 确认 `.env` 文件存在于项目根目录
2. 重启开发服务器（`npm run dev`）
3. 检查变量名拼写是否正确
4. 确认没有多余的空格或引号

### 问题 2: 数据库连接失败

**症状**:
```
Error: P1001: Can't reach database server
```

**解决方案**:
1. 验证 `DATABASE_URL` 格式是否正确
2. 测试数据库连接：
   ```bash
   psql "postgresql://game:password@host:5432/game"
   ```
3. 检查防火墙和网络配置
4. 确认数据库服务正在运行

### 问题 3: NextAuth 错误

**症状**:
```
[next-auth][error][NO_SECRET]
```

**解决方案**:
1. 确保设置了 `NEXTAUTH_SECRET`
2. 确保密钥长度 >= 32 字符
3. 重启应用使新配置生效

### 问题 4: 环境变量在客户端不可用

**说明**:
- Next.js 中，默认只有以 `NEXT_PUBLIC_` 开头的变量才能在浏览器中访问
- `DATABASE_URL`、`NEXTAUTH_SECRET` 等敏感信息只能在服务端使用

**正确用法**:
```typescript
// ✅ 服务端（Server Component、API Route、getServerSideProps）
const dbUrl = process.env.DATABASE_URL;

// ❌ 客户端（Client Component）
const dbUrl = process.env.DATABASE_URL; // undefined

// ✅ 客户端公开变量
// .env: NEXT_PUBLIC_API_URL="https://api.example.com"
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

## 环境变量清单

部署前检查：

**必需**:
- [ ] `DATABASE_URL` - 数据库连接字符串
- [ ] `NEXTAUTH_SECRET` - NextAuth 密钥
- [ ] `NEXTAUTH_URL` - 应用 URL

**可选**:
- [ ] `NODE_ENV` - 运行环境
- [ ] `PORT` - 端口号
- [ ] `LOG_LEVEL` - 日志级别

**安全检查**:
- [ ] 密钥足够复杂（32+ 字符）
- [ ] 生产密钥与开发环境不同
- [ ] `.env` 文件已加入 `.gitignore`
- [ ] 生产环境使用 HTTPS
- [ ] 数据库连接使用加密

## 相关文档

- [部署指南](./DEPLOYMENT.md) - 完整部署流程
- [数据库连接问题](./DATABASE-CONNECTION-ISSUE.md) - 连接故障排查
- [README.md](../README.md) - 项目快速开始

---

**最后更新**: 2025-01-14
