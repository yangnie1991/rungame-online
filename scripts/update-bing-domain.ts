import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDomain() {
  const args = process.argv.slice(2)
  const useWww = args[0] === 'www'

  const config = await prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
  })

  if (!config) {
    console.log('❌ 未找到 IndexNow 配置')
    return
  }

  const currentUrl = config.siteUrl || ''
  const newUrl = useWww
    ? 'https://www.rungame.online'
    : 'https://rungame.online'

  console.log('\n=== 更新域名配置 ===')
  console.log('当前 Site URL:', currentUrl)
  console.log('新 Site URL:', newUrl)

  if (currentUrl === newUrl) {
    console.log('\n✅ 配置已经是目标值，无需更新')
    await prisma.$disconnect()
    return
  }

  // 更新配置
  await prisma.searchEngineConfig.update({
    where: { id: config.id },
    data: {
      siteUrl: newUrl,
    },
  })

  console.log('\n✅ 配置已更新')

  // 显示新的 host
  const url = new URL(newUrl)
  console.log('\n=== 新配置 ===')
  console.log('Site URL:', newUrl)
  console.log('Host (IndexNow):', url.hostname)
  console.log('API Key 文件:', `${newUrl}/${config.apiKey}.txt`)

  console.log('\n⚠️ 重要提醒:')
  console.log('1. 确保 API Key 文件可以通过新域名访问')
  console.log('2. 确保新域名已在 Bing Webmaster Tools 中注册')
  console.log('3. 如果使用了 CDN，确保域名解析正确')

  await prisma.$disconnect()
}

updateDomain().catch(console.error)
