import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * AI Match Category API
 *
 * 根据游戏标题和描述，使用 AI 自动匹配最合适的分类
 *
 * 请求体：
 * {
 *   gameTitle: string,
 *   gameDescription?: string,
 *   categories: Array<{ id: string, name: string }>
 * }
 *
 * 响应：
 * {
 *   categoryId: string,
 *   categoryName: string,
 *   confidence: number,
 *   reasoning: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { gameTitle, gameDescription, categories } = await req.json()

    // 验证必需参数
    if (!gameTitle || !categories || categories.length === 0) {
      return Response.json({ error: '缺少必需参数' }, { status: 400 })
    }

    // 🔥 从缓存获取 AI 配置（避免重复查询数据库）
    const { getAllAiConfigs } = await import('@/lib/ai-config')
    const allConfigs = await getAllAiConfigs()

    const aiConfig = allConfigs.find(c => c.isActive && c.isEnabled)

    if (!aiConfig || !aiConfig.apiKey) {
      return Response.json({ error: '未配置 AI API 密钥' }, { status: 500 })
    }

    // 解析 modelConfig 获取默认模型
    const modelConfig = aiConfig.modelConfig as any
    const defaultModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)

    if (!defaultModel) {
      return Response.json({ error: '未找到可用的默认模型' }, { status: 500 })
    }

    // 解密 API Key
    const apiKey = await decryptApiKey(aiConfig.apiKey)

    // 构建分类列表字符串
    const categoriesText = categories.map((c: any, idx: number) =>
      `${idx + 1}. ${c.name} (ID: ${c.id})`
    ).join('\n')

    // 构建 prompt
    const systemPrompt = `你是一个游戏分类专家。根据游戏的标题和描述，从给定的分类列表中选择最合适的分类。

**规则**：
1. 只能从提供的分类列表中选择一个分类
2. 必须返回分类的 ID，不是名称
3. 提供你选择这个分类的理由`

    const userPrompt = `游戏标题：${gameTitle}
${gameDescription ? `游戏描述：${gameDescription}\n` : ''}
可选分类列表：
${categoriesText}

请根据游戏的标题和描述，选择最合适的分类。返回 JSON 格式：
{
  "categoryId": "分类的 ID",
  "reasoning": "选择理由"
}`

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...defaultModel.headers,
    }

    // 调用 AI API
    const response = await fetch(aiConfig.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: defaultModel.id,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,  // 降低温度以获得更一致的结果
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('AI API 错误:', error)
      return Response.json(
        { error: error.error?.message || 'AI 匹配失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    // 解析 JSON 响应
    let result
    try {
      result = JSON.parse(content)
    } catch (e) {
      console.error('解析 AI 响应失败:', content)
      return Response.json({ error: '解析 AI 响应失败' }, { status: 500 })
    }

    // 验证返回的 categoryId 是否在列表中
    const matchedCategory = categories.find((c: any) => c.id === result.categoryId)

    if (!matchedCategory) {
      console.error('AI 返回的分类 ID 不在列表中:', result.categoryId)
      return Response.json({ error: 'AI 返回的分类无效' }, { status: 500 })
    }

    return Response.json({
      categoryId: result.categoryId,
      categoryName: matchedCategory.name,
      reasoning: result.reasoning || '无理由说明'
    })

  } catch (error: any) {
    console.error('AI 匹配分类失败:', error)
    return Response.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 解密 API Key
async function decryptApiKey(encryptedKey: string): Promise<string> {
  const crypto = require('crypto')
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('未配置 ENCRYPTION_KEY')
  }

  try {
    const parts = encryptedKey.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = Buffer.from(parts[1], 'hex')
    const key = crypto.createHash('sha256').update(encryptionKey).digest()
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (error) {
    console.error('API Key 解密失败:', error)
    throw new Error('API Key 解密失败')
  }
}
