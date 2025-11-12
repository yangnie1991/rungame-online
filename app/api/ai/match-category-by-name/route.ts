import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseAIJsonResponse } from '@/lib/ai-json-parser'

/**
 * AI Match Category By External Name API
 *
 * 根据外部网站的分类名称（如 GamePix 的原始分类），
 * 自动匹配到本站的分类系统
 *
 * 请求体：
 * {
 *   externalCategoryName?: string,  // 外部网站的分类名称
 *   gameTitle?: string,              // 游戏标题（备用）
 *   availableCategories: Array<{ id: string, name: string }>
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
    const { externalCategoryName, gameTitle, availableCategories } = await req.json()

    // 验证必需参数
    if (!availableCategories || availableCategories.length === 0) {
      return Response.json({ error: '缺少可用分类列表' }, { status: 400 })
    }

    if (!externalCategoryName && !gameTitle) {
      return Response.json({ error: '缺少外部分类名称或游戏标题' }, { status: 400 })
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
    const categoriesText = availableCategories.map((c: any, idx: number) =>
      `${idx + 1}. ${c.name} (ID: ${c.id})`
    ).join('\n')

    // 构建 prompt
    const systemPrompt = `你是一个游戏分类映射专家。你的任务是将外部网站的游戏分类名称映射到本站的分类系统中。

**规则**：
1. 只能从提供的本站分类列表中选择一个最匹配的分类
2. 必须返回分类的 ID，不是名称
3. 考虑分类的语义相似性、游戏类型的对应关系
4. 如果外部分类名称是英文，本站分类是中文，需要理解两者的语义对应关系
5. 提供详细的匹配理由

**常见映射示例**：
- "Action" → "动作游戏"
- "Puzzle" → "益智游戏"
- "Racing" → "赛车游戏"
- "Sports" → "体育游戏"
- "Adventure" → "冒险游戏"
- "Shooting" → "射击游戏"
- "Strategy" → "策略游戏"
- "Casual" → "休闲游戏"
- "RPG" / "Role Playing" → "角色扮演"
- "Arcade" → "街机游戏"
- "Fighting" → "格斗游戏"
- "Platform" / "Platformer" → "平台游戏"
- "Card" / "Board" → "棋牌游戏"`

    let userPrompt = ''
    if (externalCategoryName) {
      userPrompt = `外部网站的游戏分类：${externalCategoryName}
${gameTitle ? `游戏标题：${gameTitle}\n` : ''}
本站可用的分类列表：
${categoriesText}

请将外部分类"${externalCategoryName}"映射到本站的分类系统中，选择最合适的分类。返回 JSON 格式：
{
  "categoryId": "分类的 ID",
  "confidence": 0.95,
  "reasoning": "详细的匹配理由，说明为什么选择这个分类"
}`
    } else {
      userPrompt = `游戏标题：${gameTitle}

本站可用的分类列表：
${categoriesText}

请根据游戏标题推测游戏类型，并选择最合适的分类。返回 JSON 格式：
{
  "categoryId": "分类的 ID",
  "confidence": 0.85,
  "reasoning": "详细的匹配理由"
}`
    }

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
        temperature: 0.2,  // 非常低的温度以获得一致性
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
      result = parseAIJsonResponse(content, 'match-category-by-name')
    } catch (e) {
      console.error('解析 AI 响应失败:', content.substring(0, 500))
      return Response.json({ error: '解析 AI 响应失败' }, { status: 500 })
    }

    // 验证返回的 categoryId 是否在列表中
    const matchedCategory = availableCategories.find((c: any) => c.id === result.categoryId)

    if (!matchedCategory) {
      console.error('AI 返回的分类 ID 不在列表中:', result.categoryId)
      return Response.json({ error: 'AI 返回的分类无效' }, { status: 500 })
    }

    return Response.json({
      categoryId: result.categoryId,
      categoryName: matchedCategory.name,
      confidence: result.confidence || 0.8,
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
