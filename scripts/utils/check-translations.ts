import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const categories = await prisma.category.findMany({
    include: {
      translations: true,
    },
  })

  console.log(`总分类数: ${categories.length}`)

  const noTranslations = categories.filter(cat => cat.translations.length === 0)
  console.log(`没有翻译的分类: ${noTranslations.length}`)

  if (noTranslations.length > 0) {
    console.log('\n没有翻译的分类列表:')
    noTranslations.forEach(cat => {
      console.log(`  - ${cat.slug} (${cat.id})`)
    })
  }

  const withTranslations = categories.filter(cat => cat.translations.length > 0)
  console.log(`\n有翻译的分类: ${withTranslations.length}`)
  const totalTranslations = withTranslations.reduce((sum, cat) => sum + cat.translations.length, 0)
  console.log(`总翻译记录数: ${totalTranslations}`)
}

check().finally(() => prisma.$disconnect())
