"use server"

import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache-helpers"

/**
 * 获取用户IP地址
 */
async function getUserIp(): Promise<string> {
  const headersList = await headers()

  // 尝试从各种头部获取真实IP
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const cfConnectingIp = headersList.get("cf-connecting-ip")

  if (cfConnectingIp) return cfConnectingIp
  if (realIp) return realIp
  if (forwardedFor) return forwardedFor.split(",")[0].trim()

  return "unknown"
}

/**
 * 用户投票（赞或踩）
 */
export async function voteGame(gameId: string, isLike: boolean) {
  try {
    const userIp = await getUserIp()

    if (userIp === "unknown") {
      return { success: false, error: "无法获取IP地址", likes: 0, dislikes: 0 }
    }

    // 检查是否已投票
    const existingVote = await prisma.gameVote.findUnique({
      where: {
        gameId_userIp: {
          gameId,
          userIp,
        },
      },
    })

    let updatedGame

    if (existingVote) {
      // 已投票
      if (existingVote.isLike === isLike) {
        // 取消投票：删除记录，减少对应计数
        const [, game] = await prisma.$transaction([
          prisma.gameVote.delete({
            where: { id: existingVote.id },
          }),
          prisma.game.update({
            where: { id: gameId },
            data: {
              [isLike ? "likes" : "dislikes"]: { decrement: 1 },
            },
            select: { likes: true, dislikes: true },
          }),
        ])
        updatedGame = game

        // 清除游戏详情缓存
        revalidateTag(CACHE_TAGS.GAMES)

        return {
          success: true,
          action: "cancelled",
          message: isLike ? "取消赞" : "取消踩",
          likes: updatedGame.likes,
          dislikes: updatedGame.dislikes,
        }
      } else {
        // 切换投票：更新记录，一边+1一边-1
        const [, game] = await prisma.$transaction([
          prisma.gameVote.update({
            where: { id: existingVote.id },
            data: { isLike },
          }),
          prisma.game.update({
            where: { id: gameId },
            data: {
              likes: { [isLike ? "increment" : "decrement"]: 1 },
              dislikes: { [isLike ? "decrement" : "increment"]: 1 },
            },
            select: { likes: true, dislikes: true },
          }),
        ])
        updatedGame = game

        // 清除游戏详情缓存
        revalidateTag(CACHE_TAGS.GAMES)

        return {
          success: true,
          action: "switched",
          message: isLike ? "已改为赞" : "已改为踩",
          likes: updatedGame.likes,
          dislikes: updatedGame.dislikes,
        }
      }
    } else {
      // 新投票：创建记录，增加对应计数
      const [, game] = await prisma.$transaction([
        prisma.gameVote.create({
          data: {
            gameId,
            userIp,
            isLike,
          },
        }),
        prisma.game.update({
          where: { id: gameId },
          data: {
            [isLike ? "likes" : "dislikes"]: { increment: 1 },
          },
          select: { likes: true, dislikes: true },
        }),
      ])
      updatedGame = game

      // 清除游戏详情缓存
      revalidateTag(CACHE_TAGS.GAMES)

      return {
        success: true,
        action: "created",
        message: isLike ? "已赞" : "已踩",
        likes: updatedGame.likes,
        dislikes: updatedGame.dislikes,
      }
    }
  } catch (error) {
    console.error("投票失败:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "投票失败，请稍后重试",
      likes: 0,
      dislikes: 0,
    }
  }
}

/**
 * 获取用户的投票状态
 */
export async function getUserVote(gameId: string) {
  try {
    const userIp = await getUserIp()

    if (userIp === "unknown") {
      return { success: false, vote: null }
    }

    const vote = await prisma.gameVote.findUnique({
      where: {
        gameId_userIp: {
          gameId,
          userIp,
        },
      },
    })

    return {
      success: true,
      vote: vote ? (vote.isLike ? "like" : "dislike") : null,
    }
  } catch (error) {
    console.error("获取投票状态失败:", error)
    return { success: false, vote: null }
  }
}

/**
 * 获取游戏的赞踩统计
 */
export async function getGameVoteStats(gameId: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        likes: true,
        dislikes: true,
      },
    })

    if (!game) {
      return { success: false, likes: 0, dislikes: 0 }
    }

    return {
      success: true,
      likes: game.likes,
      dislikes: game.dislikes,
    }
  } catch (error) {
    console.error("获取投票统计失败:", error)
    return { success: false, likes: 0, dislikes: 0 }
  }
}
