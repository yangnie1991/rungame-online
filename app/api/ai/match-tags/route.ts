import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * AI Match Tags API
 *
 * 根据游戏标题、描述和分类，使用 AI 自动匹配最合适的标签
 *
 * 请求体：
 * {
 *   gameTitle: string,
 *   gameDescription?: string,
 *   categoryId?: string,
 *   tags: Array<{ id: string, name: string }>
 * }
 *
 * 响应：
 * {
 *   tagIds: string[],
 *   tagNames: string[],
 *   reasoning: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { gameTitle, gameDescription, categoryId, tags } = await req.json()

    // 验证必需参数
    if (!gameTitle || !tags || tags.length === 0) {
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

    // 获取分类信息（如果提供了）
    let categoryName = ''
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          translations: {
            where: { locale: 'en' }
          }
        }
      })
      categoryName = category?.translations[0]?.name || category?.slug || ''
    }

    // 构建标签列表字符串
    const tagsText = tags.map((t: any, idx: number) =>
      `${idx + 1}. ${t.name} (ID: ${t.id})`
    ).join('\n')

    // 构建 prompt
    const systemPrompt = `你是一个游戏标签专家。根据游戏的标题、描述和分类，从给定的标签列表中选择最合适的标签。

**规则**：
1. 只能从提供的标签列表中选择标签
2. 可以选择多个标签（建议 3-8 个）
3. 必须返回标签的 ID 数组，不是名称
4. 选择最能描述游戏特性、玩法和主题的标签
5. 提供你选择这些标签的理由`

    const userPrompt = `游戏标题：${gameTitle}
${gameDescription ? `游戏描述：${gameDescription}\n` : ''}${categoryName ? `游戏分类：${categoryName}\n` : ''}
可选标签列表：
${tagsText}

请根据游戏的信息，选择最合适的标签（3-8 个）。返回 JSON 格式：
{
  "tagIds": ["标签 ID 1", "标签 ID 2", ...],
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
        max_tokens: 800,
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

    // 验证返回的 tagIds 是否在列表中
    if (!Array.isArray(result.tagIds)) {
      return Response.json({ error: 'AI 返回的标签格式无效' }, { status: 500 })
    }

    const validTagIds = result.tagIds.filter((id: string) =>
      tags.some((t: any) => t.id === id)
    )

    if (validTagIds.length === 0) {
      console.error('AI 返回的标签 ID 都不在列表中:', result.tagIds)
      return Response.json({ error: 'AI 返回的标签无效' }, { status: 500 })
    }

    const matchedTags = tags.filter((t: any) => validTagIds.includes(t.id))

    return Response.json({
      tagIds: validTagIds,
      tagNames: matchedTags.map((t: any) => t.name),
      reasoning: result.reasoning || '无理由说明'
    })

  } catch (error: any) {
    console.error('AI 匹配标签失败:', error)
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
