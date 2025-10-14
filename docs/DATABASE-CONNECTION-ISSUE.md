# 数据库连接池问题分析与解决方案

## ✅ 已解决 - 使用PgBouncer

**最终解决方案**: 在阿里云RDS上启用了PgBouncer连接池代理。

**当前配置** (`.env`):
```env
DATABASE_URL="postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:6432/game?schema=public&pgbouncer=true&connection_limit=10&pool_timeout=20"
```

**效果**:
- ✅ 连接池由PgBouncer管理，应用层连接数大幅减少
- ✅ 支持更多并发连接
- ✅ 连接复用率高，性能提升
- ✅ 不再出现连接数耗尽问题

---

## 问题现象（已解决）

之前频繁出现以下错误：
```
Too many database connections opened: FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

## 问题原因

### 1. **连接池配置缺失**

当前数据库连接字符串：
```
postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:5432/game?schema=public
```

**缺少连接池参数**，导致：
- 每次创建PrismaClient都会建立新连接
- 连接不会被复用
- 连接不会自动关闭
- 快速达到数据库最大连接数限制

### 2. **多个Prisma实例同时运行**

在开发过程中可能同时运行：
- ✅ Prisma Studio (后台进程)
- ✅ 种子脚本 (npm run db:seed)
- ✅ 开发服务器 (npm run dev)
- ✅ 临时测试脚本 (npx tsx -e "...")
- ✅ API服务器

每个实例都会创建自己的连接池！

### 3. **阿里云RDS默认连接数限制**

阿里云RDS PostgreSQL的默认最大连接数通常为：
- **基础版**: 100连接
- **高可用版**: 根据实例规格，通常100-800连接

但是会保留一些连接给SUPERUSER角色，普通用户可用连接数更少。

## 解决方案

### 方案1: 配置连接池参数（推荐）

修改 `.env` 文件中的 `DATABASE_URL`，添加连接池参数：

```env
DATABASE_URL="postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:5432/game?schema=public&connection_limit=5&pool_timeout=10"
```

**参数说明**：
- `connection_limit=5`: 每个Prisma Client实例最多5个连接（默认是无限制）
- `pool_timeout=10`: 连接池超时10秒

**推荐配置**：
```env
# 开发环境（单个开发者）
DATABASE_URL="postgresql://game:password@host:5432/game?schema=public&connection_limit=5&pool_timeout=10"

# 生产环境（多个实例）
DATABASE_URL="postgresql://game:password@host:5432/game?schema=public&connection_limit=10&pool_timeout=20"
```

### 方案2: 使用单例模式创建PrismaClient

创建 `lib/prisma.ts` 文件：

```typescript
import { PrismaClient } from '@prisma/client'

// 防止在开发环境hot-reload时创建多个实例
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

然后在所有文件中使用：
```typescript
import { prisma } from './lib/prisma'
// 而不是每次都 new PrismaClient()
```

### 方案3: 确保连接正确关闭

在所有脚本和测试中，确保使用 `try...finally`：

```typescript
const prisma = new PrismaClient()

async function main() {
  try {
    // 你的代码
    await prisma.user.findMany()
  } finally {
    await prisma.$disconnect() // 重要！确保连接关闭
  }
}

main()
```

### 方案4: 关闭不需要的Prisma Studio进程

```bash
# 查找所有Prisma Studio进程
ps aux | grep "prisma studio"

# 关闭所有Prisma Studio
pkill -f "prisma studio"

# 或者关闭5555端口的进程
lsof -ti:5555 | xargs kill -9
```

### 方案5: 增加数据库最大连接数（阿里云RDS）

1. 登录阿里云控制台
2. 进入RDS实例管理
3. 参数设置 → 搜索 `max_connections`
4. 修改为更大的值（如200或300）
5. 重启实例使配置生效

**注意**：这只是临时方案，根本问题还是要配置连接池！

## 立即修复步骤

### Step 1: 停止所有运行的进程

```bash
# 停止所有Node进程
pkill -f node

# 或者手动停止
# Ctrl+C 停止开发服务器
# 关闭所有终端窗口
```

### Step 2: 修改数据库连接字符串

编辑 `/Users/yangnie/Desktop/game/rungame-nextjs/.env`:

```env
# 旧的（有问题）
# DATABASE_URL="postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:5432/game?schema=public"

# 新的（添加连接池限制）
DATABASE_URL="postgresql://game:password@yangnie-test.pgsql.cn-chengdu.rds.aliyuncs.com:5432/game?schema=public&connection_limit=5&pool_timeout=10"
```

### Step 3: 重新生成Prisma Client

```bash
cd /Users/yangnie/Desktop/game/rungame-nextjs
npx prisma generate
```

### Step 4: 验证修复

```bash
# 运行种子文件测试
npm run db:seed

# 应该不再出现连接数错误
```

## 最佳实践

### 1. **开发环境**

- ✅ 使用较小的连接池限制 (`connection_limit=5`)
- ✅ 只运行必要的进程
- ✅ 用完Prisma Studio后及时关闭
- ✅ 使用单例模式创建PrismaClient

### 2. **生产环境**

- ✅ 根据实例数量配置连接池
- ✅ 使用连接池代理（如PgBouncer）
- ✅ 监控数据库连接数
- ✅ 设置连接超时和重试机制

### 3. **计算连接池大小**

公式：
```
总连接数 = 应用实例数 × 每个实例的连接池大小
```

示例：
- 3个API服务器实例
- 每个实例connection_limit=10
- 总共需要 3 × 10 = 30个连接
- 加上10%缓冲：33个连接
- 数据库max_connections应设置为至少50

### 4. **监控连接数**

定期检查当前连接数：

```sql
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = 'game';
```

## 问题排查清单

遇到连接数问题时，按此清单检查：

- [ ] 检查DATABASE_URL是否包含connection_limit参数
- [ ] 检查是否有多个Prisma Studio在运行
- [ ] 检查是否有僵尸Node进程（`ps aux | grep node`）
- [ ] 检查数据库当前连接数
- [ ] 检查代码中是否正确调用$disconnect()
- [ ] 检查是否使用了单例模式的PrismaClient
- [ ] 检查数据库max_connections配置

## 参考资料

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Prisma Connection Pool](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)
- [阿里云RDS PostgreSQL参数说明](https://help.aliyun.com/document_detail/26179.html)
