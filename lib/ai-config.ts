import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'
import { decrypt } from './crypto'
import { CACHE_TAGS, REVALIDATE_TIME } from './cache-helpers'

/**
 * AI 配置辅助函数
 * 用于获取和解密 AI API 配置
 */

/**
 * 获取活动的 AI 配置（带缓存）
 */
export async function getAiConfig() {
  // 使用 unstable_cache 缓存 AI 配置，1小时过期
  const getCachedConfig = unstable_cache(
    async () => {
      const config = await prisma.aiConfig.findFirst({
        where: {
          isActive: true,
          isEnabled: true
        }
      })

      if (!config || !config.apiKey) {
        throw new Error('未配置 AI API 密钥')
      }

      return config
    },
    ['ai-config-active'],
    {
      revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
      tags: [CACHE_TAGS.AI_CONFIGS],
    }
  )

  return getCachedConfig()
}

/**
 * 解密 API Key
 * 直接使用 crypto 模块的 decrypt 函数
 */
export function decryptApiKey(encryptedKey: string): string {
  return decrypt(encryptedKey)
}

/**
 * 获取活动的 AI 配置并解密 API Key
 */
export async function getDecryptedAiConfig() {
  const config = await getAiConfig()
  const apiKey = decryptApiKey(config.apiKey)

  // 解析 modelConfig 获取默认模型
  const modelConfig = config.modelConfig as any
  const defaultModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)

  if (!defaultModel) {
    throw new Error('未找到可用的默认模型')
  }

  return {
    ...config,
    apiKey,  // 解密后的 API Key
    baseUrl: config.baseUrl,
    model: defaultModel.id,
    modelConfig
  }
}

/**
 * 获取所有 AI 配置（带缓存）- 用于管理端
 */
export async function getAllAiConfigs() {
  const getCachedConfigs = unstable_cache(
    async () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Cache] 💾 getAllAiConfigs - 执行数据库查询`)
      }

      const configs = await prisma.aiConfig.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      })

      return configs
    },
    ['ai-configs-all'],
    {
      revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
      tags: [CACHE_TAGS.AI_CONFIGS],
    }
  )

  return getCachedConfigs()
}
