/**
 * 检查数据库中的AI配置
 */

import { prisma } from '../lib/prisma'

async function checkAiConfig() {
  console.log('🔍 检查数据库中的AI配置...\n')

  try {
    const configs = await prisma.aiConfig.findMany()

    if (configs.length === 0) {
      console.log('❌ 没有找到任何AI配置')
      console.log('\n💡 请在管理后台 -> AI 配置 中添加配置')
    } else {
      console.log(`✅ 找到 ${configs.length} 个AI配置:\n`)

      configs.forEach((config, index) => {
        console.log(`配置 ${index + 1}:`)
        console.log(`  ID: ${config.id}`)
        console.log(`  名称: ${config.name}`)
        console.log(`  提供商: ${config.provider}`)
        console.log(`  基础URL: ${config.baseUrl}`)
        console.log(`  是否激活: ${config.isActive ? '✅ 是' : '❌ 否'}`)
        console.log(`  是否启用: ${config.isEnabled ? '✅ 是' : '❌ 否'}`)

        const modelConfig = config.modelConfig as any
        if (modelConfig?.models) {
          console.log(`  模型数量: ${modelConfig.models.length}`)
          const defaultModel = modelConfig.models.find((m: any) => m.isDefault)
          if (defaultModel) {
            console.log(`  默认模型: ${defaultModel.id}`)
          }
        }
        console.log()
      })

      const activeConfig = configs.find((c) => c.isActive && c.isEnabled)
      if (activeConfig) {
        console.log(`✅ 当前激活的配置: ${activeConfig.name}`)
      } else {
        console.log('⚠️  没有激活的配置，请激活一个配置')
      }
    }
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAiConfig()
