/**
 * Prisma Client for GamePix Cache Database (Neon)
 * 独立的缓存数据库客户端，用于管理 GamePix 游戏数据
 */

import { PrismaClient as PrismaCacheClient } from '@/lib/generated/prisma-cache'

const globalForPrismaCache = globalThis as unknown as {
  prismaCache: PrismaCacheClient | undefined
}

export const prismaCache =
  globalForPrismaCache.prismaCache ??
  new PrismaCacheClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // 配置连接池
    datasources: {
      db: {
        url: process.env.CACHE_DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaCache.prismaCache = prismaCache
}

// 优雅关闭
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prismaCache.$disconnect()
  })
}
