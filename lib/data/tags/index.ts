"use server"

import { getAllTagsFullData } from "./cache"

/**
 * ============================================
 * 标签业务函数层（从缓存派生）
 * ============================================
 *
 * 所有函数都从 cache.ts 的统一数据源派生，不直接查询数据库
 * 只使用 unstable_cache 实现持久化缓存，无需 React.cache()
 */

/**
 * 获取标签 ID → 名称的映射
 *
 * 用途：游戏列表中需要显示标签名称时使用（内存拼接）
 * 数据来源：从 getAllTagsFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllTagTranslationsMap("en")
 * const tagName = map[tag.tagId] // "Multiplayer"
 */
export async function getAllTagTranslationsMap(locale: string) {

  const fullData = await getAllTagsFullData(locale)
  const map: Record<string, string> = {}
  fullData.forEach((tag) => {
    map[tag.id] = tag.name
  })
  return map
}

/**
 * 获取标签 ID → { slug, name } 的映射
 *
 * 用途：游戏详情页需要显示标签完整信息时使用
 * 数据来源：从 getAllTagsFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllTagsDataMap("en")
 * const tagInfo = map[tagId] // { slug: "multiplayer", name: "Multiplayer" }
 */
export async function getAllTagsDataMap(locale: string) {

  const fullData = await getAllTagsFullData(locale)
  const dataMap: Record<string, { slug: string; name: string }> = {}
  fullData.forEach((tag) => {
    dataMap[tag.id] = { slug: tag.slug, name: tag.name }
  })
  return dataMap
}

/**
 * 获取所有标签列表（只显示有游戏的标签）
 *
 * 用途：导航菜单、标签选择器等
 * 数据来源：从 getAllTagsFullData 派生，不查询数据库
 *
 * @example
 * const tags = await getAllTags("en")
 * // [{ slug: "multiplayer", name: "Multiplayer", icon: "👥", gameCount: 15 }, ...]
 */
export async function getAllTags(locale: string) {

  const fullData = await getAllTagsFullData(locale)
  return fullData
    .filter((tag) => tag.gameCount > 0)
    .map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      icon: tag.icon,
      gameCount: tag.gameCount,
    }))
}

/**
 * 获取标签 slug → 完整信息的映射（包含游戏数量）
 *
 * 用途：标签页面需要显示标签详细信息时使用
 * 数据来源：从 getAllTagsFullData 派生，不查询数据库
 *
 * @example
 * const map = await getAllTagsInfoMap("en")
 * const tagInfo = map["multiplayer"] // { slug, name, icon, gameCount }
 */
export async function getAllTagsInfoMap(locale: string) {

  const fullData = await getAllTagsFullData(locale)
  const map: Record<string, {
    slug: string
    name: string
    icon: string | null
    gameCount: number
  }> = {}

  fullData.forEach((tag) => {
    map[tag.slug] = {
      slug: tag.slug,
      name: tag.name,
      icon: tag.icon,
      gameCount: tag.gameCount,
    }
  })

  return map
}
