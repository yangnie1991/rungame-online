# 部署指南

本文档提供RunGame项目的完整部署指南。

## 目录

- [环境要求](#环境要求)
- [环境变量配置](#环境变量配置)
- [数据库设置](#数据库设置)
- [部署到Vercel](#部署到vercel)
- [部署到独立服务器](#部署到独立服务器)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)

## 环境要求

### 生产环境最低要求

- **Node.js**: 20.x 或更高版本
- **数据库**: PostgreSQL 14+
- **内存**: 最少 512MB（推荐 1GB+）
- **存储**: 最少 1GB
- **带宽**: 支持并发连接

### 推荐配置

- **Node.js**: 20.x LTS
- **PostgreSQL**: 15+ 或 16+
- **内存**: 2GB+
- **CDN**: Cloudflare 或其他 CDN 服务
- **图片托管**: 使用外部图片服务（如 Cloudinary）

## 环境变量配置

### 创建 `.env` 文件

复制 `.env.example` 并配置以下变量：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@host:port/database?schema=public&connection_limit=10&pool_timeout=20"

# NextAuth.js 配置
NEXTAUTH_SECRET="生成一个随机的密钥字符串"
NEXTAUTH_URL="https://yourdomain.com"

# 应用配置
NODE_ENV="production"
```

### 生成 NextAuth Secret

```bash
# 使用 openssl 生成随机密钥
openssl rand -base64 32
```

### 数据库连接字符串说明

**标准格式**：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[参数]
```

**重要参数**：
- `schema=public` - 默认 schema
- `connection_limit=10` - 连接池大小（根据实例数调整）
- `pool_timeout=20` - 连接池超时（秒）
- `pgbouncer=true` - 如果使用 PgBouncer（推荐）

**示例**：
```env
# 使用 PgBouncer（推荐）
DATABASE_URL="postgresql://game:password@host:6432/game?schema=public&pgbouncer=true&connection_limit=10&pool_timeout=20"

# 直接连接
DATABASE_URL="postgresql://game:password@host:5432/game?schema=public&connection_limit=10&pool_timeout=20"
```

## 数据库设置

### 1. 创建数据库

```sql
CREATE DATABASE game;
CREATE USER game_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE game TO game_user;
```

### 2. 运行迁移

```bash
# 推送 Prisma schema 到数据库
npm run db:push

# 或使用 migrate（生产环境推荐）
npx prisma migrate deploy
```

### 3. 填充初始数据

```bash
npm run db:seed
```

这将创建：
- 管理员账户（admin@rungame.online / admin123）
- 25个游戏分类（中英文翻译）
- 30个示例游戏
- 所有标签数据
- 15种支持的语言

**⚠️ 安全提醒**：部署后立即修改默认管理员密码！

### 4. 配置连接池（推荐）

**使用 PgBouncer**（阿里云 RDS / AWS RDS）：

1. 在数据库管理后台启用 PgBouncer
2. 使用 PgBouncer 端口（通常是 6432）
3. 在连接字符串中添加 `pgbouncer=true`

**连接池大小计算**：
```
总连接数 = 应用实例数 × connection_limit
```

示例：
- 3 个 Web 实例
- 每个实例 `connection_limit=10`
- 总需求：30 个连接
- 数据库 `max_connections` 应设置为 50+

## 部署到 Vercel

### 快速部署

1. **连接 GitHub 仓库**
   - 访问 [vercel.com](https://vercel.com)
   - 导入 Git 仓库

2. **配置环境变量**

   在 Vercel 项目设置中添加：
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **构建设置**

   Vercel 会自动检测 Next.js 项目，使用默认设置即可：
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **部署**

   点击 "Deploy" 按钮即可。

### Vercel 部署注意事项

**优点**：
- ✅ 零配置，自动部署
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 边缘函数支持
- ✅ 预览部署（每个 PR）

**限制**：
- ⚠️ 无服务器函数有 10 秒超时限制
- ⚠️ 冷启动可能影响首次访问速度
- ⚠️ 免费版有带宽限制

**推荐配置**：
- 使用 Vercel Postgres 或外部数据库（如 Supabase、PlanetScale）
- 配置自定义域名
- 启用分析和监控

## 部署到独立服务器

### 使用 Docker（推荐）

1. **创建 Dockerfile**

```dockerfile
FROM node:20-alpine AS base

# 依赖阶段
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

2. **构建和运行**

```bash
# 构建镜像
docker build -t rungame:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  --name rungame \
  rungame:latest
```

3. **使用 Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=game
      - POSTGRES_PASSWORD=your_password
      - POSTGRES_DB=game
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

运行：
```bash
docker-compose up -d
```

### 使用 PM2（传统方式）

1. **构建项目**

```bash
npm run build
```

2. **安装 PM2**

```bash
npm install -g pm2
```

3. **创建 PM2 配置**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rungame',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

4. **启动应用**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 代理到 Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # 图片缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 性能优化

### 1. 数据库优化

**连接池配置**：
```env
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

**索引优化**：
所有必要的索引已在 Prisma schema 中定义。

**查询优化**：
- 使用 `buildLocaleCondition()` 进行翻译查询
- 避免 N+1 查询，使用 `include` 预加载关联数据
- 分页查询使用 `take` 和 `skip`

### 2. 图片优化

Next.js 自动优化图片（`next/image` 组件）：
- 自动 WebP 转换
- 响应式图片
- 懒加载

**配置远程图片域名**（[next.config.ts](../next.config.ts)）：
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "img.gamedistribution.com" },
    { protocol: "https", hostname: "img.gamepix.com" },
  ],
}
```

### 3. 缓存策略

**静态页面缓存**：
Next.js 自动缓存静态生成的页面。

**API 路由缓存**：
```typescript
export const revalidate = 3600 // 1 小时
```

**CDN 缓存**：
使用 Cloudflare 或其他 CDN 缓存静态资源。

### 4. 构建优化

**启用 Turbopack**（已配置）：
```json
{
  "scripts": {
    "build": "next build --turbopack"
  }
}
```

**分析包大小**：
```bash
npm run build
# 查看 .next/analyze/client.html
```

## 监控和日志

### 1. 应用监控

**Vercel Analytics**（Vercel 部署）：
- 自动集成
- 实时访问统计
- 性能指标

**自建监控**：
- **Sentry** - 错误追踪
- **LogRocket** - 用户会话回放
- **New Relic** - APM 监控

### 2. 数据库监控

```sql
-- 监控活跃连接数
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = 'game';

-- 监控慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. 日志配置

**PM2 日志**：
```bash
pm2 logs rungame
pm2 logs rungame --lines 100
```

**Docker 日志**：
```bash
docker logs -f rungame
docker logs --tail 100 rungame
```

## 备份策略

### 数据库备份

**自动备份脚本**：
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="game"

# 创建备份
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# 压缩
gzip $BACKUP_DIR/backup_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**定时任务（crontab）**：
```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-db.sh
```

### 恢复数据库

```bash
# 解压备份
gunzip backup_20250114_020000.sql.gz

# 恢复数据
psql $DATABASE_URL < backup_20250114_020000.sql
```

## 故障排查

### 常见问题

**1. 数据库连接失败**
```
Error: P1001: Can't reach database server
```

解决方案：
- 检查 `DATABASE_URL` 是否正确
- 验证数据库服务是否运行
- 检查防火墙规则
- 验证用户名和密码

**2. 连接数耗尽**
```
FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

解决方案：
- 添加 `connection_limit` 参数
- 使用 PgBouncer 连接池
- 关闭不必要的连接

**3. 构建失败**
```
Error: Cannot find module '@prisma/client'
```

解决方案：
```bash
npx prisma generate
npm run build
```

**4. NextAuth 错误**
```
[next-auth][error][NO_SECRET]
```

解决方案：
- 确保设置了 `NEXTAUTH_SECRET`
- 确保设置了 `NEXTAUTH_URL`

## 安全检查清单

部署前必须完成：

- [ ] 修改默认管理员密码
- [ ] 设置强密码策略
- [ ] 配置 HTTPS（SSL 证书）
- [ ] 设置 CORS 策略
- [ ] 配置 CSP（内容安全策略）
- [ ] 启用速率限制
- [ ] 定期更新依赖包
- [ ] 配置数据库备份
- [ ] 设置错误监控
- [ ] 配置日志收集

## 性能基准

**目标指标**：
- 首屏加载时间：< 2s
- API 响应时间：< 200ms
- 数据库查询：< 50ms
- 并发用户：1000+
- 可用性：99.9%

## 扩展建议

当流量增长时：

1. **水平扩展**：增加应用实例数
2. **数据库读写分离**：使用主从复制
3. **缓存层**：添加 Redis 缓存
4. **CDN**：使用 Cloudflare 或 Fastly
5. **负载均衡**：使用 Nginx 或云负载均衡器

## 相关文档

- [环境变量说明](./ENVIRONMENT.md)
- [数据库连接问题](./DATABASE-CONNECTION-ISSUE.md)
- [国际化最佳实践](./I18N-BEST-PRACTICES.md)
- [API 认证指南](./API-AUTHENTICATION-GUIDE.md)

## 技术支持

遇到问题？

1. 查看项目 [README.md](../README.md)
2. 查看 [CLAUDE.md](../CLAUDE.md) 架构文档
3. 提交 GitHub Issue
4. 联系开发团队

---

**最后更新**: 2025-01-14
