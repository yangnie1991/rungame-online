import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategories() {
  // 获取所有主分类及其子分类
  const mainCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      subCategories: {
        select: {
          slug: true,
          name: true,
        },
        orderBy: { slug: 'asc' },
      },
    },
    orderBy: { slug: 'asc' },
  })

  console.log('📁 分类结构:\n')
  for (const main of mainCategories) {
    console.log(`${main.slug} (${main.name})`)
    if (main.subCategories.length > 0) {
      for (const sub of main.subCategories) {
        console.log(`  └─ ${sub.slug} (${sub.name})`)
      }
    } else {
      console.log(`  └─ (无子分类)`)
    }
    console.log()
  }

  await prisma.$disconnect()
}

checkCategories()
