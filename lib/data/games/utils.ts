"use server"

import { prisma } from "@/lib/db"

/**
 * ============================================
 * 游戏工具函数
 * ============================================
 * 包含游戏相关的辅助工具函数
 */

/**
 * 增加游戏播放次数
 */
export async function incrementPlayCount(gameId: string) {
  try {
    await prisma.game.update({
      where: { id: gameId },
      data: { playCount: { increment: 1 } },
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to increment play count:", error)
    return { success: false }
  }
}
