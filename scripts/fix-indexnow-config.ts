import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixConfig() {
  const config = await prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
  })

  if (!config) {
    console.log('未找到 IndexNow 配置')
    return
  }

  console.log('\n=== 当前配置 ===')
  console.log('Site URL:', config.siteUrl)
  console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未设置')

  const extraConfig = config.extraConfig as any
  console.log('当前 keyLocation:', extraConfig?.keyLocation || '未设置')

  // 方案 1: 移除 keyLocation（推荐）
  // IndexNow 会自动从根目录查找 {api-key}.txt
  const newExtraConfig = {
    ...extraConfig,
    keyLocation: undefined, // 移除 keyLocation
  }

  // 方案 2: 设置正确的 keyLocation
  // const keyFileName = `${config.apiKey}.txt`
  // const newExtraConfig = {
  //   ...extraConfig,
  //   keyLocation: `${config.siteUrl}/${keyFileName}`,
  // }

  await prisma.searchEngineConfig.update({
    where: { id: config.id },
    data: {
      extraConfig: newExtraConfig,
    },
  })

  console.log('\n=== 修复后配置 ===')
  console.log('新 keyLocation:', '未设置（将自动从根目录查找）')
  console.log('\n⚠️ 重要提醒:')
  console.log(`1. 需要在网站根目录部署 API Key 文件:`)
  console.log(`   文件名: ${config.apiKey}.txt`)
  console.log(`   文件内容: ${config.apiKey}`)
  console.log(`   访问地址: ${config.siteUrl}/${config.apiKey}.txt`)
  console.log(`\n2. 文件必须是 UTF-8 编码的纯文本文件`)
  console.log(`\n3. 确保该文件可以公开访问（HTTP 200）`)

  await prisma.$disconnect()
}

fixConfig().catch(console.error)
