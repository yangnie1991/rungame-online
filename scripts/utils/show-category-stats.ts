import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n📊 分类统计报告\n')
  console.log('='.repeat(80))

  // 1. 总体统计
  const totalCategories = await prisma.category.count()
  const mainCategories = await prisma.category.count({
    where: { parentId: null },
  })
  const subCategories = await prisma.category.count({
    where: { parentId: { not: null } },
  })

  console.log('\n📈 总体统计:')
  console.log(`   总分类数: ${totalCategories}`)
  console.log(`   主分类:   ${mainCategories}`)
  console.log(`   子分类:   ${subCategories}`)

  // 2. 主分类列表及其子分类数量
  console.log('\n📋 主分类列表:')
  console.log('-'.repeat(80))

  const mainCats = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { subCategories: true },
      },
    },
  })

  mainCats.forEach((cat, index) => {
    console.log(
      `${(index + 1).toString().padStart(2)}. ${cat.icon || '  '} ${cat.name.padEnd(20)} (${cat.slug.padEnd(15)}) - ${cat._count.subCategories} 个子分类`
    )
  })

  // 3. 显示每个主分类下的子分类
  console.log('\n📂 主分类详情:')
  console.log('-'.repeat(80))

  for (const mainCat of mainCats) {
    const subs = await prisma.category.findMany({
      where: { parentId: mainCat.id },
      orderBy: { slug: 'asc' },
      select: { slug: true, name: true },
    })

    console.log(`\n${mainCat.icon || '  '} ${mainCat.name} (${mainCat.slug}):`)
    if (subs.length > 0) {
      subs.forEach((sub, index) => {
        console.log(`   ${(index + 1).toString().padStart(2)}. ${sub.slug.padEnd(20)} - ${sub.name}`)
      })
    } else {
      console.log('   (无子分类)')
    }
  }

  // 4. 检查孤立分类
  console.log('\n\n🔍 数据完整性检查:')
  console.log('-'.repeat(80))

  const orphanedCategories = await prisma.category.findMany({
    where: {
      AND: [
        { parentId: { not: null } },
        { parent: null },
      ],
    },
    select: { slug: true, parentId: true },
  })

  if (orphanedCategories.length > 0) {
    console.log(`\n⚠️  发现 ${orphanedCategories.length} 个孤立分类（parentId 无效）:`)
    orphanedCategories.forEach(cat => {
      console.log(`   - ${cat.slug} (parentId: ${cat.parentId})`)
    })
  } else {
    console.log('\n✅ 所有子分类的 parentId 都有效')
  }

  // 5. 检查是否有分类没有翻译
  const categoriesWithoutTranslations = await prisma.category.findMany({
    where: {
      translations: {
        none: {},
      },
    },
    select: { slug: true, name: true },
  })

  if (categoriesWithoutTranslations.length > 0) {
    console.log(`\n⚠️  发现 ${categoriesWithoutTranslations.length} 个分类没有翻译:`)
    categoriesWithoutTranslations.forEach(cat => {
      console.log(`   - ${cat.slug} (${cat.name})`)
    })
  } else {
    console.log('✅ 所有分类都有翻译')
  }

  console.log('\n' + '='.repeat(80) + '\n')

  await prisma.$disconnect()
}

main()
