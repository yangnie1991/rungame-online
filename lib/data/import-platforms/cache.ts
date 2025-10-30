"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 导入平台数据缓存层（统一数据源）
 * ============================================
 *
 * ⚠️ 这是唯一查询导入平台数据库的地方！
 * 缓存所有导入平台配置数据
 *
 * 缓存策略：
 * - 时间：24小时重新验证
 * - 原因：导入平台配置极少变化
 * - 机制：使用 unstable_cache 持久化缓存
 */

/**
 * 内部数据库查询函数 - 获取所有导入平台
 */
async function fetchImportPlatformsFromDB() {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchImportPlatformsFromDB - 执行数据库查询`)
  }

  return await prisma.importPlatform.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  })
}

/**
 * 内部数据库查询函数 - 根据 slug 获取导入平台
 */
async function fetchImportPlatformBySlugFromDB(slug: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchImportPlatformBySlugFromDB - slug: ${slug}`)
  }

  return await prisma.importPlatform.findUnique({
    where: { slug },
  })
}

/**
 * 内部数据库查询函数 - 根据 ID 获取导入平台
 */
async function fetchImportPlatformByIdFromDB(id: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] 💾 fetchImportPlatformByIdFromDB - id: ${id}`)
  }

  return await prisma.importPlatform.findUnique({
    where: { id },
  })
}

/**
 * 获取所有导入平台（缓存版本）
 */
export const getAllImportPlatforms = unstable_cache(
  async () => fetchImportPlatformsFromDB(),
  ["import-platforms-all"],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
    tags: [CACHE_TAGS.IMPORT_PLATFORMS],
  }
)

/**
 * 根据 slug 获取导入平台（缓存版本）
 */
export const getImportPlatformBySlug = unstable_cache(
  async (slug: string) => fetchImportPlatformBySlugFromDB(slug),
  ["import-platform-by-slug"],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
    tags: [CACHE_TAGS.IMPORT_PLATFORMS],
  }
)

/**
 * 根据 ID 获取导入平台（缓存版本）
 */
export const getImportPlatformById = unstable_cache(
  async (id: string) => fetchImportPlatformByIdFromDB(id),
  ["import-platform-by-id"],
  {
    revalidate: REVALIDATE_TIME.VERY_LONG, // 24小时
    tags: [CACHE_TAGS.IMPORT_PLATFORMS],
  }
)
