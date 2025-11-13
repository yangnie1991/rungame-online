import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkConfig() {
  const config = await prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
  })

  if (!config) {
    console.log('未找到 IndexNow 配置')
    return
  }

  console.log('\n=== IndexNow 配置 ===')
  console.log('名称:', config.name)
  console.log('类型:', config.type)
  console.log('Site URL:', config.siteUrl)
  console.log('API Endpoint:', config.apiEndpoint)
  console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未设置')
  console.log('Extra Config:', JSON.stringify(config.extraConfig, null, 2))
  console.log('是否启用:', config.isEnabled)
  console.log('\n=== 问题分析 ===')

  const extraConfig = config.extraConfig as any
  const keyLocation = extraConfig?.keyLocation || ''
  const siteUrl = config.siteUrl || ''

  console.log('keyLocation:', keyLocation)
  console.log('siteUrl:', siteUrl)

  if (keyLocation && siteUrl) {
    try {
      const keyUrl = new URL(keyLocation)
      const siteUrlObj = new URL(siteUrl)

      if (keyUrl.hostname !== siteUrlObj.hostname) {
        console.log('❌ 错误: keyLocation 的域名与 siteUrl 不匹配')
        console.log('  keyLocation 域名:', keyUrl.hostname)
        console.log('  siteUrl 域名:', siteUrlObj.hostname)
        console.log('\n解决方案:')
        console.log(`  应该使用: ${siteUrl}/${config.apiKey}.txt`)
      } else {
        console.log('✅ keyLocation 域名正确')
      }
    } catch (e) {
      console.log('❌ URL 格式错误:', e)
    }
  }

  await prisma.$disconnect()
}

checkConfig()
