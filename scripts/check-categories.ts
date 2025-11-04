/**
 * 检查分类结构
 */
import { prisma } from '../lib/prisma'

async function main() {
  console.log('📋 检查分类结构\n')

  // 查询所有分类
  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: {
      id: true,
      slug: true,
      name: true,
      parentId: true,
      isEnabled: true,
      parent: {
        select: {
          slug: true,
          name: true,
        },
      },
      _count: {
        select: {
          gameSubCategories: {
            where: { game: { status: 'PUBLISHED' } },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  console.log(`总共 ${categories.length} 个启用的分类\n`)

  // 分组
  const mainCategories = categories.filter(c => !c.parentId)
  const subCategories = categories.filter(c => c.parentId)

  console.log(`主分类: ${mainCategories.length} 个`)
  console.log(`子分类: ${subCategories.length} 个\n`)

  console.log('=' .repeat(80))
  console.log('主分类（应该生成 /category/{slug}）：')
  console.log('=' .repeat(80))
  mainCategories.forEach(cat => {
    console.log(`  /${cat.slug} - ${cat.name} (${cat._count.gameSubCategories} 游戏)`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('子分类（应该生成 /category/{parent}/{slug}）：')
  console.log('=' .repeat(80))
  subCategories.forEach(cat => {
    if (cat.parent) {
      console.log(`  /${cat.parent.slug}/${cat.slug} - ${cat.name} (父: ${cat.parent.name}, ${cat._count.gameSubCategories} 游戏)`)
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('❌ 当前 sitemap 问题：')
  console.log('=' .repeat(80))
  console.log('所有分类（包括子分类）都生成为 /category/{slug} 格式')
  console.log('这会导致子分类的 URL 错误\n')

  console.log('示例错误：')
  subCategories.slice(0, 3).forEach(cat => {
    if (cat.parent) {
      console.log(`  ❌ 当前: /category/${cat.slug}`)
      console.log(`  ✅ 应该: /category/${cat.parent.slug}/${cat.slug}\n`)
    }
  })

  await prisma.$disconnect()
}

main().catch(console.error)
