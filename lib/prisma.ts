import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prismaClientSingleton = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // 使用 Prisma Client Extensions 替代已废弃的 $use 中间件
  const client = baseClient.$extends({
    name: 'mainCategoryIdAutoFill',
    query: {
      gameCategory: {
        async create({ args, query }) {
          // 自动维护 mainCategoryId
          if (args.data.categoryId) {
            const category = await baseClient.category.findUnique({
              where: { id: args.data.categoryId },
              select: { id: true, parentId: true },
            })
            if (category) {
              // 如果有父分类，使用父分类ID；否则使用自己的ID
              args.data.mainCategoryId = category.parentId || category.id
            }
          }
          return query(args)
        },
        async update({ args, query }) {
          // 如果更新了 categoryId，也要更新 mainCategoryId
          if (args.data.categoryId) {
            const categoryId = typeof args.data.categoryId === 'string'
              ? args.data.categoryId
              : args.data.categoryId.set

            if (categoryId) {
              const category = await baseClient.category.findUnique({
                where: { id: categoryId },
                select: { id: true, parentId: true },
              })
              if (category) {
                args.data.mainCategoryId = category.parentId || category.id
              }
            }
          }
          return query(args)
        },
      },
    },
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
