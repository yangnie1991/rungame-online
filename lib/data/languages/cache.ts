"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 语言数据缓存层（统一数据源）
 * ============================================
 *
 * ⚠️ 这是唯一查询语言数据库的地方！
 * 缓存所有启用的语言数据
 *
 * 缓存策略：
 * - 时间：24小时重新验证
 * - 原因：语言配置很少变化
 * - 机制：使用 unstable_cache 持久化缓存
 */

/**
 * 内部数据库查询函数 - 获取默认语言
 */
async function fetchDefaultLanguageFromDB() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchDefaultLanguageFromDB - 执行数据库查询`)
  }

  const language = await prisma.language.findFirst({
    where: { isDefault: true, isEnabled: true },
    select: { code: true, name: true, flag: true },
  })

  return language
}

/**
 * 内部数据库查询函数 - 获取所有启用的语言
 */
async function fetchEnabledLanguagesFromDB() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchEnabledLanguagesFromDB - 执行数据库查询`)
  }

  const languages = await prisma.language.findMany({
    where: { isEnabled: true },
    select: { code: true, name: true, nativeName: true, flag: true },
    orderBy: { sortOrder: "asc" },
  })

  return languages
}

/**
 * 获取默认语言（缓存版本）
 */
export const getDefaultLanguageCached = unstable_cache(
  async () => fetchDefaultLanguageFromDB(),
  ["default-language"],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG,
    tags: [CACHE_TAGS.LANGUAGES],
  }
)

/**
 * 获取所有启用的语言（缓存版本）
 */
export const getEnabledLanguagesCached = unstable_cache(
  async () => fetchEnabledLanguagesFromDB(),
  ["enabled-languages"],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG,
    tags: [CACHE_TAGS.LANGUAGES],
  }
)
