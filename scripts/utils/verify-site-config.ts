import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 验证网站配置...\n')

  try {
    // 查询配置
    const config = await prisma.siteConfig.findFirst({
      include: {
        translations: true,
      },
    })

    if (!config) {
      console.log('❌ 未找到配置')
      return
    }

    console.log('✅ 找到配置:')
    console.log('  ID:', config.id)
    console.log('  网站名称:', config.siteName)
    console.log('  网站描述:', config.siteDescription)
    console.log('  网站 URL:', config.siteUrl)
    console.log('  默认关键词:', config.defaultKeywords)
    console.log('  Google Analytics:', config.googleAnalyticsId)
    console.log('  Google AdSense:', config.googleAdsenseId)
    console.log('\n📝 翻译:')

    config.translations.forEach((trans) => {
      console.log(`  [${trans.locale}]`)
      console.log(`    名称: ${trans.siteName}`)
      console.log(`    描述: ${trans.siteDescription}`)
      console.log(`    关键词: ${trans.keywords.join(', ')}`)
    })

    console.log('\n🎉 配置验证成功！')
  } catch (error) {
    console.error('❌ 验证失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
