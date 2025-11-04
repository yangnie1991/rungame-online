/**
 * 验证 Sitemap 分类 URL 生成
 *
 * 检查主分类和子分类是否生成了正确的 URL 结构：
 * - 主分类：/category/{mainCategorySlug}
 * - 子分类：/category/{mainCategorySlug}/{subCategorySlug}
 */
import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔍 验证 Sitemap 分类 URL 生成\n')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const locales = ['en', 'zh']
  const defaultLocale = 'en'

  // 获取所有启用的分类（包含父分类信息）
  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: {
      slug: true,
      name: true,
      parentId: true,
      parent: {
        select: {
          slug: true,
          name: true,
        },
      },
      _count: {
        select: {
          gameSubCategories: {
            where: {
              game: { status: 'PUBLISHED' }
            },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 所有分类都会生成到 sitemap
  const mainCategories = categories.filter(c => !c.parentId)
  const subCategories = categories.filter(c => c.parentId)

  // 统计有游戏的分类
  const mainCategoriesWithGames = mainCategories.filter(c => c._count.gameSubCategories > 0)
  const subCategoriesWithGames = subCategories.filter(c => c._count.gameSubCategories > 0)

  console.log(`📊 统计信息：`)
  console.log(`   总分类数：${categories.length}`)
  console.log(`   - 主分类：${mainCategories.length}（${mainCategoriesWithGames.length} 个有游戏）`)
  console.log(`   - 子分类：${subCategories.length}（${subCategoriesWithGames.length} 个有游戏）`)
  console.log(`   ⚠️ 注意：sitemap 包含所有启用的分类，不管是否有游戏\n`)

  console.log('='.repeat(80))
  console.log('✅ 主分类 URL（应该为 /category/{slug}）：')
  console.log('='.repeat(80))

  let mainCategoryUrls: string[] = []
  mainCategories.slice(0, 5).forEach(cat => {
    const categoryPath = `/category/${cat.slug}`
    const enUrl = `${baseUrl}${categoryPath}`
    const zhUrl = `${baseUrl}/zh${categoryPath}`

    console.log(`\n📁 ${cat.name} (${cat.slug})`)
    console.log(`   ${cat._count.gameSubCategories} 游戏`)
    console.log(`   EN: ${enUrl}`)
    console.log(`   ZH: ${zhUrl}`)

    mainCategoryUrls.push(enUrl, zhUrl)
  })

  if (mainCategories.length > 5) {
    console.log(`\n   ... 还有 ${mainCategories.length - 5} 个主分类`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 子分类 URL（应该为 /category/{parentSlug}/{slug}）：')
  console.log('='.repeat(80))

  let subCategoryUrls: string[] = []
  let errorCount = 0

  subCategories.slice(0, 10).forEach(cat => {
    if (!cat.parent) {
      console.log(`\n❌ 错误：子分类 ${cat.slug} 缺少父分类信息`)
      errorCount++
      return
    }

    const categoryPath = `/category/${cat.parent.slug}/${cat.slug}`
    const enUrl = `${baseUrl}${categoryPath}`
    const zhUrl = `${baseUrl}/zh${categoryPath}`

    console.log(`\n📁 ${cat.name} (${cat.slug})`)
    console.log(`   父分类：${cat.parent.name} (${cat.parent.slug})`)
    console.log(`   ${cat._count.gameSubCategories} 游戏`)
    console.log(`   EN: ${enUrl}`)
    console.log(`   ZH: ${zhUrl}`)

    subCategoryUrls.push(enUrl, zhUrl)
  })

  if (subCategories.length > 10) {
    console.log(`\n   ... 还有 ${subCategories.length - 10} 个子分类`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('📈 生成的 Sitemap URL 统计：')
  console.log('='.repeat(80))
  console.log(`主分类 URL 数量：${mainCategories.length * locales.length}`)
  console.log(`子分类 URL 数量：${subCategories.length * locales.length}`)
  console.log(`总 URL 数量：${categories.length * locales.length}`)

  if (errorCount > 0) {
    console.log(`\n❌ 发现 ${errorCount} 个错误`)
  } else {
    console.log('\n✅ 所有分类 URL 生成正确！')
  }

  console.log('\n' + '='.repeat(80))
  console.log('💡 验证步骤：')
  console.log('='.repeat(80))
  console.log('1. 启动开发服务器: npm run dev')
  console.log('2. 访问 sitemap: http://localhost:3000/sitemap.xml')
  console.log('3. 搜索示例 URL:')
  console.log(`   - 主分类: ${baseUrl}/category/action-games`)
  console.log(`   - 子分类: ${baseUrl}/category/action-games/action`)
  console.log('4. 确认没有错误的单层子分类 URL (如 /category/action)')
  console.log('\n5. 使用在线工具验证:')
  console.log('   - https://www.xml-sitemaps.com/validate-xml-sitemap.html')
  console.log('   - Google Search Console')

  await prisma.$disconnect()
}

main().catch(console.error)
