"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"
import type { AiConfig, AiModelConfig } from "@/types/ai-config"
import { CACHE_TAGS } from "@/lib/cache-helpers"
import { getAllAiConfigs as getCachedAiConfigs } from "@/lib/ai-config"

/**
 * 获取所有 AI 配置列表（使用缓存层）
 */
export async function getAiConfigs() {
  try {
    const configs = await getCachedAiConfigs()

    // 将数据库模型转换为类型化的配置
    return configs.map(config => ({
      ...config,
      modelConfig: config.modelConfig as AiModelConfig,
    })) as AiConfig[]
  } catch (error) {
    console.error("获取 AI 配置失败:", error)
    throw new Error("获取 AI 配置失败")
  }
}

/**
 * 根据 ID 获取单个 AI 配置
 */
export async function getAiConfigById(id: string) {
  try {
    const config = await prisma.aiConfig.findUnique({
      where: { id },
    })

    if (!config) {
      throw new Error("配置不存在")
    }

    return {
      ...config,
      modelConfig: config.modelConfig as AiModelConfig,
    } as AiConfig
  } catch (error) {
    console.error("获取 AI 配置失败:", error)
    throw new Error("获取 AI 配置失败")
  }
}

/**
 * 获取当前激活的 AI 配置
 */
export async function getActiveAiConfig() {
  try {
    const config = await prisma.aiConfig.findFirst({
      where: { isActive: true, isEnabled: true },
    })

    if (!config) {
      return null
    }

    return {
      ...config,
      modelConfig: config.modelConfig as AiModelConfig,
    } as AiConfig
  } catch (error) {
    console.error("获取激活配置失败:", error)
    return null
  }
}

/**
 * 创建 AI 配置
 */
export async function createAiConfig(data: {
  name: string
  provider: string
  apiKey: string
  baseUrl: string
  modelConfig: AiModelConfig
  isActive?: boolean
  isEnabled?: boolean
}) {
  try {
    // 加密 API Key
    const encryptedApiKey = encrypt(data.apiKey)

    // 如果设置为激活，先将其他配置设为非激活
    if (data.isActive) {
      await prisma.aiConfig.updateMany({
        data: { isActive: false },
      })
    }

    const config = await prisma.aiConfig.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: encryptedApiKey,
        baseUrl: data.baseUrl,
        modelConfig: data.modelConfig as any,
        isActive: data.isActive ?? false,
        isEnabled: data.isEnabled ?? true,
      },
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.AI_CONFIGS)
    revalidatePath("/admin/ai-config")
    return { success: true, data: config }
  } catch (error) {
    console.error("创建 AI 配置失败:", error)
    return { success: false, error: "创建失败" }
  }
}

/**
 * 更新 AI 配置
 */
export async function updateAiConfig(
  id: string,
  data: {
    name?: string
    provider?: string
    apiKey?: string
    baseUrl?: string
    modelConfig?: AiModelConfig
    isActive?: boolean
    isEnabled?: boolean
  }
) {
  try {
    // 如果提供了新的 API Key，加密它
    const updateData: any = { ...data }
    if (data.apiKey) {
      updateData.apiKey = encrypt(data.apiKey)
    }

    // 如果设置为激活，先将其他配置设为非激活
    if (data.isActive) {
      await prisma.aiConfig.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      })
    }

    const config = await prisma.aiConfig.update({
      where: { id },
      data: updateData,
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.AI_CONFIGS)
    revalidatePath("/admin/ai-config")
    return { success: true, data: config }
  } catch (error) {
    console.error("更新 AI 配置失败:", error)
    return { success: false, error: "更新失败" }
  }
}

/**
 * 删除 AI 配置
 */
export async function deleteAiConfig(id: string) {
  try {
    await prisma.aiConfig.delete({
      where: { id },
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.AI_CONFIGS)
    revalidatePath("/admin/ai-config")
    return { success: true }
  } catch (error) {
    console.error("删除 AI 配置失败:", error)
    return { success: false, error: "删除失败" }
  }
}

/**
 * 切换配置的激活状态
 */
export async function toggleAiConfigActive(id: string) {
  try {
    // 先将所有配置设为非激活
    await prisma.aiConfig.updateMany({
      data: { isActive: false },
    })

    // 激活指定配置
    const config = await prisma.aiConfig.update({
      where: { id },
      data: { isActive: true, isEnabled: true },
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.AI_CONFIGS)
    revalidatePath("/admin/ai-config")
    return { success: true, data: config }
  } catch (error) {
    console.error("切换激活状态失败:", error)
    return { success: false, error: "切换失败" }
  }
}

/**
 * 切换配置的启用状态
 */
export async function toggleAiConfigEnabled(id: string) {
  try {
    const config = await prisma.aiConfig.findUnique({
      where: { id },
    })

    if (!config) {
      throw new Error("配置不存在")
    }

    // 如果当前是激活状态，不允许禁用
    if (config.isActive && config.isEnabled) {
      return { success: false, error: "激活的配置不能禁用，请先激活其他配置" }
    }

    const updated = await prisma.aiConfig.update({
      where: { id },
      data: { isEnabled: !config.isEnabled },
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.AI_CONFIGS)
    revalidatePath("/admin/ai-config")
    return { success: true, data: updated }
  } catch (error) {
    console.error("切换启用状态失败:", error)
    return { success: false, error: "切换失败" }
  }
}

/**
 * 测试 AI 配置连接
 */
export async function testAiConfig(id: string) {
  try {
    const config = await prisma.aiConfig.findUnique({
      where: { id },
    })

    if (!config) {
      throw new Error("配置不存在")
    }

    // 解密 API Key
    const apiKey = decrypt(config.apiKey)
    const modelConfig = config.modelConfig as AiModelConfig

    // 获取默认模型
    const defaultModel = modelConfig.models.find(m => m.isDefault && m.isEnabled)
    if (!defaultModel) {
      throw new Error("未找到可用的默认模型")
    }

    // 发送测试请求
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...defaultModel.headers,
      },
      body: JSON.stringify({
        model: defaultModel.id,
        messages: [
          {
            role: "user",
            content: "Hi, this is a test message. Please respond with 'OK'.",
          },
        ],
        max_tokens: 10,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      success: true,
      message: "连接测试成功",
      response: data.choices?.[0]?.message?.content || "收到响应",
    }
  } catch (error: any) {
    console.error("测试连接失败:", error)
    return {
      success: false,
      error: error.message || "连接测试失败",
    }
  }
}

/**
 * 获取解密后的 API Key（仅用于编辑表单回显）
 */
export async function getDecryptedApiKey(id: string) {
  try {
    const config = await prisma.aiConfig.findUnique({
      where: { id },
      select: { apiKey: true },
    })

    if (!config) {
      throw new Error("配置不存在")
    }

    return decrypt(config.apiKey)
  } catch (error) {
    console.error("解密 API Key 失败:", error)
    throw new Error("解密失败")
  }
}

/**
 * 获取所有启用的 AI 配置及其模型列表（用于前端选择）
 */
export async function getAiConfigsWithModels() {
  try {
    // 使用缓存层而不是直接查询数据库
    const allConfigs = await getCachedAiConfigs()

    // 过滤启用的配置
    const configs = allConfigs.filter(config => config.isEnabled)

    // 转换为前端需要的格式
    const formattedConfigs = configs.map(config => {
      const modelConfig = config.modelConfig as AiModelConfig
      const models = (modelConfig.models || [])
        .filter(m => m.isEnabled)
        .map(m => ({
          id: m.id,
          name: m.name,
          isDefault: m.isDefault || false,
          parameters: m.parameters || {},
        }))

      return {
        id: config.id,
        name: config.name,
        provider: config.provider,
        isActive: config.isActive,
        models,
      }
    })

    return formattedConfigs
  } catch (error) {
    console.error("获取 AI 配置和模型列表失败:", error)
    throw new Error("获取配置列表失败")
  }
}

/**
 * 测试单个模型是否可用
 */
export async function testAiModel(configId: string, modelId: string, modelName: string) {
  try {
    const config = await prisma.aiConfig.findUnique({
      where: { id: configId },
    })

    if (!config) {
      throw new Error("配置不存在")
    }

    // 解密 API Key
    const apiKey = decrypt(config.apiKey)

    // 发送测试请求
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: "Hi, this is a test message. Please respond with 'OK'.",
          },
        ],
        max_tokens: 10,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API 错误 (${response.status})`

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "收到响应"

    return {
      success: true,
      message: "模型测试成功",
      response: content,
    }
  } catch (error: any) {
    console.error("测试模型失败:", error)
    return {
      success: false,
      error: error.message || "模型测试失败",
    }
  }
}
