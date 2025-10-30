import { NextRequest, NextResponse } from 'next/server'
import { getAiConfig } from '@/lib/ai-config'

/**
 * GET /api/ai/models
 * 获取当前激活配置中的所有可用模型
 *
 * 注意：此 API 只读取模型配置，不需要解密 API Key
 */
export async function GET(request: NextRequest) {
  try {
    // 只获取配置，不解密 API Key（模型列表不需要 API Key）
    const config = await getAiConfig()

    // 从 modelConfig 中提取模型列表
    const modelConfig = config.modelConfig as any
    const models = modelConfig.models || []

    // 只返回启用的模型
    const enabledModels = models
      .filter((model: any) => model.isEnabled)
      .map((model: any) => ({
        id: model.id,
        name: model.name,
        isDefault: model.isDefault || false,
        parameters: model.parameters || {},
      }))

    if (enabledModels.length === 0) {
      return NextResponse.json(
        { error: '没有可用的 AI 模型' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      models: enabledModels,
      provider: config.provider,
      configName: config.name,
    })
  } catch (error: any) {
    console.error('获取模型列表失败:', error)
    return NextResponse.json(
      { error: error.message || '获取模型列表失败' },
      { status: 500 }
    )
  }
}
