#!/usr/bin/env tsx
/**
 * 清理旧的 AI 配置
 *
 * 当更换 ENCRYPTION_KEY 后，旧的加密数据无法解密
 * 此脚本将删除所有旧的 AI 配置，让用户重新创建
 *
 * 运行方式：
 * npx tsx scripts/clean-ai-configs.ts
 */

import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔍 检查现有 AI 配置...')

  const configs = await prisma.aiConfig.findMany({
    select: {
      id: true,
      name: true,
      provider: true,
      createdAt: true,
    },
  })

  if (configs.length === 0) {
    console.log('✅ 没有找到 AI 配置，无需清理')
    return
  }

  console.log(`\n找到 ${configs.length} 个 AI 配置：`)
  configs.forEach((config, index) => {
    console.log(`  ${index + 1}. ${config.name} (${config.provider})`)
    console.log(`     创建于: ${config.createdAt.toLocaleString('zh-CN')}`)
  })

  console.log('\n⚠️  警告：这些配置可能使用旧的加密密钥加密，无法解密')
  console.log('📝 建议：删除这些配置，然后在管理后台重新创建\n')

  // 删除所有 AI 配置
  const result = await prisma.aiConfig.deleteMany()

  console.log(`✅ 已删除 ${result.count} 个 AI 配置`)
  console.log('\n下一步：')
  console.log('  1. 访问管理后台 → AI 配置')
  console.log('  2. 创建新的 AI 配置')
  console.log('  3. 输入 API Key')
  console.log('  4. 点击"测试连接"验证')
  console.log('  5. 保存配置\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 错误:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
