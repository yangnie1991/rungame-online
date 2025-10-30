import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('验证SEO数据填充结果...\n')

  // 检查主分类Action的SEO数据
  const actionCategory = await prisma.category.findFirst({
    where: { slug: 'main-action' },
    include: {
      translations: {
        where: { locale: { in: ['en', 'zh'] } }
      }
    }
  })

  if (actionCategory) {
    console.log('Action分类数据:')
    console.log('基础表 metaTitle:', actionCategory.metaTitle)
    console.log('基础表 metaDescription:', actionCategory.metaDescription?.substring(0, 80) + '...')
    console.log('\n翻译数据:')
    actionCategory.translations.forEach(t => {
      console.log(`\n${t.locale}:`)
      console.log('  metaTitle:', t.metaTitle)
      console.log('  metaDescription:', t.metaDescription?.substring(0, 80) + '...')
      console.log('  keywords:', t.keywords?.substring(0, 60) + '...')
    })
  }

  // 检查PageType Most Played的SEO数据
  console.log('\n\n=================================\n')
  const mostPlayedPT = await prisma.pageType.findFirst({
    where: { slug: 'most-played' },
    include: {
      translations: {
        where: { locale: { in: ['en', 'zh'] } }
      }
    }
  })

  if (mostPlayedPT) {
    console.log('Most Played PageType数据:')
    console.log('基础表 metaTitle:', mostPlayedPT.metaTitle)
    console.log('基础表 metaDescription:', mostPlayedPT.metaDescription?.substring(0, 80) + '...')
    console.log('\n翻译数据:')
    mostPlayedPT.translations.forEach(t => {
      console.log(`\n${t.locale}:`)
      console.log('  metaTitle:', t.metaTitle)
      console.log('  metaDescription:', t.metaDescription?.substring(0, 80) + '...')
      console.log('  keywords:', t.keywords?.substring(0, 60) + '...')
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
