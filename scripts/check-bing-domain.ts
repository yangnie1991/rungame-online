import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDomain() {
  const config = await prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
  })

  if (!config) {
    console.log('❌ 未找到 IndexNow 配置')
    return
  }

  console.log('\n=== 当前配置 ===')
  console.log('Site URL:', config.siteUrl)

  if (config.siteUrl) {
    const url = new URL(config.siteUrl)
    console.log('Host (用于 IndexNow):', url.hostname)
  }

  console.log('\n=== Bing Webmaster Tools 域名配置说明 ===')
  console.log('\n1. 检查你在 Bing Webmaster Tools 中注册的域名格式：')
  console.log('   选项 A: rungame.online (不带 www)')
  console.log('   选项 B: www.rungame.online (带 www)')
  console.log('   选项 C: 两者都注册')

  console.log('\n2. IndexNow 的 host 参数必须与 Bing 中注册的域名一致')

  console.log('\n3. 当前 IndexNow 会使用: rungame.online')

  console.log('\n=== 常见配置选项 ===')
  console.log('\n如果你在 Bing 中注册的是:')
  console.log('  • rungame.online → 当前配置正确 ✅')
  console.log('  • www.rungame.online → 需要修改 siteUrl 为 https://www.rungame.online')
  console.log('  • 两者都有 → 建议主域名使用 rungame.online（当前配置）')

  console.log('\n=== 如何检查 Bing 中的域名 ===')
  console.log('1. 访问: https://www.bing.com/webmasters')
  console.log('2. 登录后查看"网站"列表')
  console.log('3. 确认注册的域名格式（是否带 www）')

  console.log('\n=== 修改配置（如果需要） ===')
  console.log('如果需要改为 www 域名，运行:')
  console.log('  npx tsx scripts/update-bing-domain.ts www')

  await prisma.$disconnect()
}

checkDomain().catch(console.error)
