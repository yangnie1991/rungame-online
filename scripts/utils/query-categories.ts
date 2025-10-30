import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      translations: {
        where: {
          locale: 'en'
        }
      },
      _count: {
        select: {
          games: true
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { slug: 'asc' }
    ]
  })

  console.log(`总分类数: ${categories.length}\n`)
  console.log('ID | Slug | 英文名称 | 游戏数 | 启用状态 | 排序')
  console.log('-'.repeat(120))

  categories.forEach(cat => {
    const enName = cat.translations[0]?.name || cat.name || '(无英文翻译)'
    console.log(`${cat.id.slice(0, 8)} | ${cat.slug.padEnd(30)} | ${enName.padEnd(30)} | ${cat._count.games.toString().padEnd(5)} | ${cat.isEnabled ? '✓' : '✗'} | ${cat.sortOrder}`)
  })

  // 按游戏数量统计
  const withGames = categories.filter(c => c._count.games > 0).length
  const withoutGames = categories.filter(c => c._count.games === 0).length
  const disabled = categories.filter(c => !c.isEnabled).length

  console.log('\n统计信息:')
  console.log(`- 有游戏的分类: ${withGames}`)
  console.log(`- 无游戏的分类: ${withoutGames}`)
  console.log(`- 已禁用的分类: ${disabled}`)
  console.log(`- 已启用的分类: ${categories.length - disabled}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
