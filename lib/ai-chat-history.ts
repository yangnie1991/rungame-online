/**
 * AI 对话历史管理工具
 * 使用缓存数据库（Neon）存储对话历史
 */

import { PrismaClient as CachePrismaClient } from "./generated/prisma-cache"

// 创建缓存数据库客户端实例
const globalForCachePrisma = globalThis as unknown as {
  cacheClient: CachePrismaClient | undefined
}

export const cacheClient =
  globalForCachePrisma.cacheClient ??
  new CachePrismaClient({
    datasources: {
      db: {
        url: process.env.CACHE_DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalForCachePrisma.cacheClient = cacheClient
}

/**
 * 工具调用接口
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * 对话消息接口（支持工具调用）
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool"
  content: string | null

  // 🆕 工具调用支持
  tool_calls?: ToolCall[]       // AI 请求调用的工具
  tool_call_id?: string          // 工具结果关联的调用 ID
  name?: string                  // 工具名称（当 role='tool' 时）
}

/**
 * 对话历史接口
 */
export interface ChatHistory {
  id: string
  gameId: string
  locale: string
  messages: ChatMessage[]
  messageCount: number
  totalTokens: number
  createdAt: Date
  updatedAt: Date
  lastUsedAt: Date
  expiresAt: Date
}

/**
 * 保存或更新对话历史
 */
export async function saveChatHistory(
  gameId: string,
  locale: string,
  messages: ChatMessage[],
  options?: {
    adminId?: string
    templateId?: string
    context?: Record<string, any>
  }
): Promise<ChatHistory> {
  // 计算过期时间（7天后）
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // 估算 token 消耗（简单估算：每个字符约 0.25 tokens）
  const totalTokens = messages.reduce((sum, msg) => {
    return sum + Math.ceil(msg.content.length * 0.25)
  }, 0)

  const data = {
    gameId,
    locale,
    messages: messages as any,
    messageCount: messages.length,
    totalTokens,
    lastUsedAt: new Date(),
    expiresAt,
    ...(options?.adminId && { adminId: options.adminId }),
    ...(options?.templateId && { templateId: options.templateId }),
    ...(options?.context && { context: options.context as any }),
  }

  try {
    // 使用 upsert 保存或更新
    const history = await cacheClient.aiChatHistory.upsert({
      where: {
        gameId_locale: {
          gameId,
          locale,
        },
      },
      update: {
        messages: data.messages,
        messageCount: data.messageCount,
        totalTokens: data.totalTokens,
        lastUsedAt: data.lastUsedAt,
        expiresAt: data.expiresAt,
        ...(options?.templateId && { templateId: options.templateId }),
        ...(options?.context && { context: data.context }),
      },
      create: data,
    })

    return history as ChatHistory
  } catch (error) {
    console.error("保存对话历史失败:", error)
    throw new Error("保存对话历史失败")
  }
}

/**
 * 加载对话历史
 */
export async function loadChatHistory(
  gameId: string,
  locale: string
): Promise<ChatHistory | null> {
  try {
    const history = await cacheClient.aiChatHistory.findUnique({
      where: {
        gameId_locale: {
          gameId,
          locale,
        },
      },
    })

    if (!history) {
      return null
    }

    // 检查是否过期
    if (new Date() > history.expiresAt) {
      // 自动删除过期记录
      await cacheClient.aiChatHistory.delete({
        where: { id: history.id },
      })
      return null
    }

    // 更新最后使用时间
    await cacheClient.aiChatHistory.update({
      where: { id: history.id },
      data: { lastUsedAt: new Date() },
    })

    return history as ChatHistory
  } catch (error) {
    console.error("加载对话历史失败:", error)
    return null
  }
}

/**
 * 删除对话历史
 */
export async function deleteChatHistory(
  gameId: string,
  locale: string
): Promise<boolean> {
  try {
    await cacheClient.aiChatHistory.delete({
      where: {
        gameId_locale: {
          gameId,
          locale,
        },
      },
    })
    return true
  } catch (error) {
    console.error("删除对话历史失败:", error)
    return false
  }
}

/**
 * 清理过期的对话历史（定时任务）
 */
export async function cleanupExpiredChatHistory(): Promise<{
  deletedCount: number
}> {
  try {
    const result = await cacheClient.aiChatHistory.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(`清理了 ${result.count} 条过期对话历史`)
    return { deletedCount: result.count }
  } catch (error) {
    console.error("清理过期对话历史失败:", error)
    return { deletedCount: 0 }
  }
}

/**
 * 获取对话统计信息
 */
export async function getChatHistoryStats(gameId: string): Promise<{
  totalConversations: number
  totalMessages: number
  totalTokens: number
  languages: string[]
}> {
  try {
    const histories = await cacheClient.aiChatHistory.findMany({
      where: { gameId },
    })

    return {
      totalConversations: histories.length,
      totalMessages: histories.reduce((sum, h) => sum + h.messageCount, 0),
      totalTokens: histories.reduce((sum, h) => sum + h.totalTokens, 0),
      languages: [...new Set(histories.map(h => h.locale))],
    }
  } catch (error) {
    console.error("获取对话统计失败:", error)
    return {
      totalConversations: 0,
      totalMessages: 0,
      totalTokens: 0,
      languages: [],
    }
  }
}

/**
 * 获取管理员的所有对话历史
 */
export async function getAdminChatHistories(
  adminId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<ChatHistory[]> {
  try {
    const histories = await cacheClient.aiChatHistory.findMany({
      where: { adminId },
      orderBy: { lastUsedAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    })

    return histories as ChatHistory[]
  } catch (error) {
    console.error("获取管理员对话历史失败:", error)
    return []
  }
}
