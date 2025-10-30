import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
}

/**
 * AI Chat with Context API
 *
 * 用于处理带上下文的对话生成
 * 支持 Web Search 和 Tool Calling
 *
 * 请求体：
 * {
 *   messages: Message[],          // 完整的对话历史
 *   gameTitle: string,
 *   locale: string,
 *   keywords?: string,
 *   category?: string,
 *   categoryId?: string,
 *   enableWebSearch?: boolean,
 *   enableToolCalling?: boolean,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      gameTitle,
      locale,
      keywords,
      category,
      categoryId,
      model: customModelId,
      enableWebSearch = false,
      enableToolCalling = false,
    } = await req.json()

    // 验证必需参数
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: '缺少对话历史' }, { status: 400 })
    }

    // 🔥 从缓存获取 AI 配置（避免重复查询数据库）
    const { getAllAiConfigs } = await import('@/lib/ai-config')
    const allConfigs = await getAllAiConfigs()

    const aiConfig = allConfigs.find(c => c.isActive && c.isEnabled)

    if (!aiConfig || !aiConfig.apiKey) {
      return Response.json({ error: '未配置 AI API 密钥' }, { status: 500 })
    }

    // 解析 modelConfig 获取模型
    const modelConfig = aiConfig.modelConfig as any

    // 如果指定了自定义模型，使用自定义模型；否则使用默认模型
    let selectedModel
    if (customModelId) {
      selectedModel = modelConfig.models?.find((m: any) => m.id === customModelId && m.isEnabled)
      if (!selectedModel) {
        return Response.json({ error: `指定的模型 ${customModelId} 未找到或未启用` }, { status: 400 })
      }
    } else {
      selectedModel = modelConfig.models?.find((m: any) => m.isDefault && m.isEnabled)
      if (!selectedModel) {
        return Response.json({ error: '未找到可用的默认模型' }, { status: 500 })
      }
    }

    // 解密 API Key
    const apiKey = await decryptApiKey(aiConfig.apiKey)

    // 准备请求体
    const requestBody: any = {
      model: selectedModel.id,
      messages,
      ...selectedModel.parameters,
    }

    // 添加 Web Search（如果启用）
    if (enableWebSearch) {
      requestBody.plugins = [{
        id: 'web',
        engine: 'exa',
        max_results: 3,
        search_prompt: `搜索 "${gameTitle}" 游戏的最新信息、玩法和评价`
      }]
    }

    // 添加 Tool Calling（如果启用）
    if (enableToolCalling) {
      requestBody.tools = [
        {
          type: 'function',
          function: {
            name: 'search_similar_games',
            description: '搜索数据库中相似的游戏，用于参考',
            parameters: {
              type: 'object',
              properties: {
                category: { type: 'string', description: '游戏分类' },
                limit: { type: 'number', description: '返回数量', default: 3 }
              }
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'get_category_info',
            description: '获取游戏分类的详细信息',
            parameters: {
              type: 'object',
              properties: {
                categoryId: { type: 'string', description: '分类 ID' }
              },
              required: ['categoryId']
            }
          }
        }
      ]
      requestBody.tool_choice = 'auto'
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...selectedModel.headers,
    }

    // 调用 AI API
    const response = await fetch(aiConfig.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('AI API 错误:', error)
      return Response.json(
        { error: error.error?.message || 'AI 生成失败' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 处理 Tool Calls（如果有）
    if (data.choices[0]?.message?.tool_calls && enableToolCalling) {
      const toolCalls = data.choices[0].message.tool_calls
      const newMessages = [...messages, data.choices[0].message]

      // 执行工具调用
      for (const toolCall of toolCalls) {
        const toolResult = await executeToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          categoryId
        )

        newMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(toolResult)
        })
      }

      // 继续对话（递归调用）
      const finalResponse = await fetch(aiConfig.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'RunGame Content Generator',
        },
        body: JSON.stringify({
          ...requestBody,
          messages: newMessages,
        }),
      })

      if (!finalResponse.ok) {
        const error = await finalResponse.json()
        return Response.json({ error: error.error?.message || 'AI 生成失败' }, { status: finalResponse.status })
      }

      const finalData = await finalResponse.json()

      return Response.json({
        content: finalData.choices[0]?.message?.content || '',
        message: finalData.choices[0]?.message,
        citations: finalData.citations || [],
        toolsUsed: toolCalls.map((tc: any) => tc.function.name)
      })
    }

    // 正常响应
    return Response.json({
      content: data.choices[0]?.message?.content || '',
      message: data.choices[0]?.message,
      citations: data.citations || []
    })

  } catch (error: any) {
    console.error('Chat with context API 错误:', error)
    return Response.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 执行工具调用
async function executeToolCall(name: string, args: any, categoryId?: string) {
  try {
    switch (name) {
      case 'search_similar_games':
        const games = await prisma.game.findMany({
          where: {
            isPublished: true,
            ...(args.category ? {
              category: {
                slug: args.category
              }
            } : categoryId ? {
              categoryId
            } : {})
          },
          take: args.limit || 3,
          orderBy: {
            playCount: 'desc'
          },
          include: {
            translations: {
              where: {
                locale: 'en'
              }
            }
          }
        })

        return games.map(g => ({
          title: g.translations[0]?.title || g.slug,
          description: g.translations[0]?.description,
          playCount: g.playCount
        }))

      case 'get_category_info':
        if (!args.categoryId) return null

        const category = await prisma.category.findUnique({
          where: { id: args.categoryId },
          include: {
            translations: {
              where: {
                locale: 'en'
              }
            },
            _count: {
              select: {
                games: true
              }
            }
          }
        })

        if (!category) return null

        return {
          name: category.translations[0]?.name || category.slug,
          description: category.translations[0]?.description,
          gamesCount: category._count.games
        }

      default:
        return null
    }
  } catch (error) {
    console.error(`执行工具 ${name} 失败:`, error)
    return null
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
