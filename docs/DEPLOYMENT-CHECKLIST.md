# 完整部署清单

本文档提供 RunGame 项目从开发到生产的完整部署清单。

**架构**: Vercel + Supabase + Cloudflare R2

---

## 📋 部署前检查

### 环境准备

- [ ] Node.js 20.x 已安装
- [ ] Git 仓库已创建
- [ ] GitHub 账号已准备
- [ ] 域名已购买 (可选,Vercel 提供免费子域名)

### 账号注册

- [ ] [Vercel 账号](https://vercel.com) - 使用 GitHub 登录
- [ ] [Supabase 账号](https://supabase.com) - 使用 GitHub 登录
- [ ] [Cloudflare 账号](https://cloudflare.com) - 邮箱注册

---

## 第一步: 配置 Supabase 数据库 (10分钟)

### 1.1 创建项目

- [ ] 访问 [https://supabase.com](https://supabase.com)
- [ ] 点击 **New Project**
- [ ] 填写项目信息:
  - Name: `rungame-nextjs`
  - Database Password: (生成强密码并保存)
  - Region: 选择离用户最近的
    - 中国: `Southeast Asia (Singapore)`
    - 北美: `US West (Oregon)`
  - Plan: **Free**
- [ ] 点击 **Create new project**
- [ ] 等待初始化完成 (约 2 分钟)

### 1.2 获取连接字符串

- [ ] Settings → Database → Connection string
- [ ] 选择 **Transaction** 模式
- [ ] 复制连接字符串
- [ ] 修改为 PgBouncer 模式 (端口改为 6543)

**连接字符串格式**:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20
```

### 1.3 本地配置

- [ ] 在项目根目录创建 `.env` 文件
- [ ] 添加数据库连接:
  ```env
  DATABASE_URL="postgresql://..."
  NEXTAUTH_SECRET="生成的随机密钥"
  NEXTAUTH_URL="http://localhost:3000"
  ```

### 1.4 推送数据库 Schema

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema
npm run db:push

# 填充初始数据
npm run db:seed
```

- [ ] 确认命令执行成功
- [ ] 使用 `npx prisma studio` 验证数据

**完成!** 数据库已配置。

详细步骤见: [SUPABASE-SETUP.md](./SUPABASE-SETUP.md)

---

## 第二步: 配置 Cloudflare R2 (15分钟)

### 2.1 启用 R2

- [ ] 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] 左侧菜单 → **R2 Object Storage**
- [ ] 点击 **Purchase R2 Plan** (选择免费计划)
- [ ] 确认并启用

### 2.2 创建 Bucket

- [ ] 点击 **Create bucket**
- [ ] Bucket name: `rungame-assets`
- [ ] Location: **Automatic**
- [ ] 点击 **Create bucket**

### 2.3 启用公共访问

- [ ] 进入 bucket → **Settings**
- [ ] 找到 **Public Access**
- [ ] 点击 **Allow Access**
- [ ] 记录 r2.dev 域名: `https://pub-xxxxxxxxxx.r2.dev`

### 2.4 创建 API Token

- [ ] R2 Overview → **Manage R2 API Tokens**
- [ ] 点击 **Create API Token**
- [ ] 配置:
  - Name: `rungame-nextjs-upload`
  - Permissions: **Object Read & Write**
  - Specify bucket: `rungame-assets`
- [ ] 保存以下信息 (只显示一次!):
  - Access Key ID
  - Secret Access Key
  - Account ID

### 2.5 添加环境变量

在 `.env` 文件中添加:

```env
R2_ACCOUNT_ID="你的 Account ID"
R2_ACCESS_KEY_ID="你的 Access Key ID"
R2_SECRET_ACCESS_KEY="你的 Secret Access Key"
R2_BUCKET_NAME="rungame-assets"
R2_PUBLIC_URL="https://pub-xxxxxxxxxx.r2.dev"
```

### 2.6 测试上传

```bash
# 启动开发服务器
npm run dev

# 访问测试页面 (如果您创建了测试页面)
# http://localhost:3000/admin/test-upload

# 或使用 curl 测试 API
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.png" \
  -F "type=misc"
```

- [ ] 确认上传成功
- [ ] 访问返回的 URL,验证图片可访问

**完成!** R2 存储已配置。

详细步骤见: [R2-CDN-SETUP.md](./R2-CDN-SETUP.md)

---

## 第三步: 部署到 Vercel (10分钟)

### 3.1 推送代码到 GitHub

```bash
# 初始化 Git (如果还未初始化)
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 完成项目配置,准备部署"

# 推送到 GitHub
git remote add origin https://github.com/yourusername/rungame-nextjs.git
git branch -M main
git push -u origin main
```

- [ ] 确认代码已推送到 GitHub

### 3.2 连接 Vercel

- [ ] 访问 [https://vercel.com](https://vercel.com)
- [ ] 使用 GitHub 账号登录
- [ ] 点击 **Add New... → Project**
- [ ] 选择您的 GitHub 仓库 `rungame-nextjs`
- [ ] 点击 **Import**

### 3.3 (可选) 集成 Supabase 存储

**方式 A: 通过 Vercel Storage 集成 (推荐,自动配置)**

- [ ] Vercel 项目 → **Storage** 标签
- [ ] 点击 **Connect Store**
- [ ] 选择 **Supabase**
- [ ] 选择或创建 Supabase 项目
- [ ] 点击 **Connect**

**完成!** Vercel 会自动创建以下环境变量:
- `POSTGRES_URL`
- `POSTGRES_POOLER_URL`
- `POSTGRES_PRISMA_URL` ✅ (推荐用于 Prisma)
- `POSTGRES_URL_NON_POOLING`

然后:
- [ ] Settings → Environment Variables
- [ ] 添加一个新变量:
  ```
  DATABASE_URL = ${POSTGRES_PRISMA_URL}
  ```

这样 `DATABASE_URL` 会自动引用 Vercel 提供的 Prisma 专用连接字符串。

---

**方式 B: 手动配置环境变量 (如果不使用 Vercel 集成)**

### 3.3 配置环境变量

在 Vercel 项目配置中:

- [ ] 进入 **Settings → Environment Variables**
- [ ] 添加以下变量 (适用于 Production, Preview, Development):

```
# 数据库 (手动配置)
DATABASE_URL = postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20

# 认证
NEXTAUTH_SECRET = your-random-secret-key
NEXTAUTH_URL = https://your-app.vercel.app

# R2 存储
R2_ACCOUNT_ID = xxx
R2_ACCESS_KEY_ID = xxx
R2_SECRET_ACCESS_KEY = xxx
R2_BUCKET_NAME = rungame-assets
R2_PUBLIC_URL = https://pub-xxx.r2.dev
```

**重要**:
- [ ] `DATABASE_URL` 使用 Supabase 连接字符串 (端口 6543,含 pgbouncer 参数)
- [ ] `NEXTAUTH_SECRET` 使用强随机密钥 (生成: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` 使用您的 Vercel 域名
- [ ] `R2_SECRET_ACCESS_KEY` 标记为 **Sensitive**
- [ ] `NEXTAUTH_SECRET` 标记为 **Sensitive**

**推荐**: 优先使用方式 A (Vercel Storage 集成),更简单且自动管理。

### 3.4 部署

- [ ] 点击 **Deploy**
- [ ] 等待构建完成 (约 3-5 分钟)
- [ ] 查看部署日志,确认无错误

### 3.5 初始化生产数据库

**方法 1: 使用本地连接**

```bash
# 使用生产数据库连接字符串
export DATABASE_URL="postgresql://..."

# 推送 schema
npx prisma db push

# 填充数据
npx tsx prisma/seed.ts
```

- [ ] 确认数据填充成功

**方法 2: 使用 Vercel CLI**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 拉取环境变量
vercel env pull .env.production

# 运行 seed
npx tsx prisma/seed.ts
```

### 3.6 验证部署

- [ ] 访问 Vercel 提供的域名: `https://your-app.vercel.app`
- [ ] 测试首页加载
- [ ] 访问 `/login` 测试登录:
  - Email: `admin@rungame.online`
  - Password: `admin123`
- [ ] 登录成功后访问 `/admin` 管理后台
- [ ] 测试浏览游戏、分类等功能

**完成!** 应用已成功部署。

---

## 第四步: 配置自定义域名 (可选,10分钟)

### 4.1 在 Vercel 添加域名

- [ ] Vercel 项目 → Settings → Domains
- [ ] 输入您的域名: `yourdomain.com`
- [ ] 点击 **Add**

### 4.2 配置 DNS

Vercel 会提供 DNS 配置信息:

**A 记录** (推荐):
```
类型: A
名称: @
目标: 76.76.21.21
```

**CNAME 记录** (或):
```
类型: CNAME
名称: @
目标: cname.vercel-dns.com
```

- [ ] 在域名注册商处添加 DNS 记录
- [ ] 等待 DNS 传播 (5-30 分钟)

### 4.3 验证域名

- [ ] 返回 Vercel,等待域名验证完成
- [ ] 验证成功后,Vercel 自动配置 HTTPS
- [ ] 访问 `https://yourdomain.com` 测试

### 4.4 更新环境变量

- [ ] Vercel → Settings → Environment Variables
- [ ] 更新 `NEXTAUTH_URL`:
  ```
  NEXTAUTH_URL = https://yourdomain.com
  ```
- [ ] 重新部署应用

**完成!** 自定义域名已配置。

---

## 第五步: R2 自定义 CDN 域名 (可选,15分钟)

如果您希望图片使用自己的域名 (如 `cdn.yourdomain.com`):

### 方案选择

**如果域名在 Cloudflare**:
- [ ] 使用方案 B: R2 直接绑定
- [ ] 见 [R2-CDN-SETUP.md](./R2-CDN-SETUP.md) "方式 B"

**如果域名不在 Cloudflare**:
- [ ] 使用方案 C: Cloudflare Workers
- [ ] 见 [R2-CDN-SETUP.md](./R2-CDN-SETUP.md) "方式 C"

配置完成后:

- [ ] 更新 Vercel 环境变量:
  ```
  R2_PUBLIC_URL = https://cdn.yourdomain.com
  ```
- [ ] 更新 `next.config.ts`:
  ```typescript
  {
    protocol: "https",
    hostname: "cdn.yourdomain.com",
  }
  ```
- [ ] 重新部署

**完成!** CDN 自定义域名已配置。

---

## 第六步: 安全配置 (必做!)

### 6.1 修改默认管理员密码

- [ ] 登录管理后台
- [ ] 访问管理员设置
- [ ] 修改密码为强密码
- [ ] 保存

### 6.2 配置 CORS (如需要)

在 R2 Bucket Settings 中配置 CORS:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 6.3 启用 Vercel Analytics (可选)

- [ ] Vercel 项目 → Analytics
- [ ] 启用 Web Analytics
- [ ] 查看访问数据

### 6.4 配置错误监控 (可选)

推荐使用:
- [Sentry](https://sentry.io) - 错误追踪
- [LogRocket](https://logrocket.com) - 会话回放

---

## 第七步: 性能优化

### 7.1 图片优化

- [ ] 确认所有图片使用 Next.js `<Image>` 组件
- [ ] 使用 WebP 格式
- [ ] 压缩图片 (< 100KB)

### 7.2 缓存配置

- [ ] 确认 R2 文件设置了正确的 Cache-Control
- [ ] 静态资源使用长期缓存

### 7.3 数据库优化

- [ ] 确认所有索引已创建 (Prisma schema 已定义)
- [ ] 使用 `buildLocaleCondition()` 进行翻译查询
- [ ] 监控慢查询

---

## 部署后验证清单

### 功能测试

- [ ] 首页正常加载
- [ ] 游戏列表显示正确
- [ ] 游戏详情页可访问
- [ ] 游戏可正常游玩
- [ ] 分类筛选功能正常
- [ ] 语言切换功能正常
- [ ] 搜索功能正常

### 管理后台测试

- [ ] 管理员登录成功
- [ ] 游戏管理功能正常
- [ ] 分类管理功能正常
- [ ] 标签管理功能正常
- [ ] 图片上传功能正常 (R2)

### 性能测试

- [ ] 首屏加载时间 < 2s
- [ ] Lighthouse 性能评分 > 90
- [ ] 移动端响应正常

### 安全测试

- [ ] HTTPS 已启用
- [ ] 管理后台需要身份验证
- [ ] 默认密码已修改
- [ ] 敏感信息未暴露

---

## 监控和维护

### 每日检查

- [ ] Vercel Deployment 状态
- [ ] 错误日志 (如有)
- [ ] 访问统计

### 每周检查

- [ ] Supabase 数据库使用量
- [ ] R2 存储使用量
- [ ] 性能指标

### 每月检查

- [ ] 依赖包更新
- [ ] 安全补丁
- [ ] 备份验证

---

## 成本监控

### 预计成本 (MVP 阶段)

```
Vercel Hobby:      $0/月
Supabase Free:     $0/月
Cloudflare R2:     $0/月
─────────────────────
总计:              $0/月
```

### 升级触发条件

**升级 Vercel Pro ($20/月)**:
- [ ] 需要团队协作
- [ ] 需要更多构建时间
- [ ] 需要密码保护的预览部署

**升级 Supabase Pro ($25/月)**:
- [ ] 数据库 > 400MB
- [ ] 并发连接 > 50
- [ ] 需要更长备份保留期

**R2 超出免费额度** (约 $5-10/月):
- [ ] 存储 > 10GB
- [ ] 读取 > 1000万次/月

---

## 故障排查

### 部署失败

**症状**: Vercel 构建失败

**检查**:
- [ ] 查看构建日志
- [ ] 确认环境变量已设置
- [ ] 本地运行 `npm run build` 测试

### 数据库连接失败

**症状**: "Can't reach database server"

**检查**:
- [ ] Supabase 项目状态
- [ ] `DATABASE_URL` 格式正确
- [ ] 网络连接正常

### R2 上传失败

**症状**: "R2 未配置" 或 "AccessDenied"

**检查**:
- [ ] 所有 R2 环境变量已设置
- [ ] API Token 权限正确
- [ ] Bucket Public Access 已启用

---

## 回滚计划

如果生产环境出现问题:

### 快速回滚

1. Vercel Dashboard → Deployments
2. 找到上一个稳定版本
3. 点击 **Promote to Production**

### 数据库回滚

1. Supabase Dashboard → Database → Backups
2. 选择备份点
3. 恢复

---

## 相关文档

- [Supabase 配置](./SUPABASE-SETUP.md)
- [R2 CDN 配置](./R2-CDN-SETUP.md)
- [环境变量说明](./ENVIRONMENT.md)
- [部署指南](./DEPLOYMENT.md)

---

## 支持和帮助

遇到问题?

1. 查看 [故障排查](#故障排查) 章节
2. 查看项目文档 [CLAUDE.md](../CLAUDE.md)
3. 查看技术栈官方文档:
   - [Next.js](https://nextjs.org/docs)
   - [Vercel](https://vercel.com/docs)
   - [Supabase](https://supabase.com/docs)
   - [Cloudflare R2](https://developers.cloudflare.com/r2/)
4. 提交 GitHub Issue

---

**最后更新**: 2025-01-14
**预计部署时间**: 45-60 分钟
**部署难度**: ⭐⭐⭐ (中等)
