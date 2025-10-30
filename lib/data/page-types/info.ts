"use server"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { getTranslatedField, buildLocaleCondition } from "@/lib/i18n-helpers"
import { CACHE_TAGS, REVALIDATE_TIME } from "@/lib/cache-helpers"

/**
 * ============================================
 * 页面类型信息查询函数
 * ============================================
 *
 * 提供页面类型的元数据和信息查询
 * 每个函数内部直接实现缓存，避免多层缓存嵌套
 */

/**
 * 获取所有启用的页面类型（用于导航）
 *
 * @example
 * const pageTypes = await getAllPageTypes("en")
 * // [{ slug: "most-played", type: "GAME_LIST", icon: "🔥", title: "Most Played", ... }]
 */
export async function getAllPageTypes(locale: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 📄 getAllPageTypes - 开始查询 locale: ${locale}`)
  }

  // 定义缓存函数：一次性查询并组装完整数据
  const getCachedData = unstable_cache(
    async () => {
      const pageTypes = await prisma.pageType.findMany({
        where: { isEnabled: true },
        select: {
          slug: true,
          type: true,
          icon: true,
          // 主表的英文字段作为回退
          title: true,
          description: true,
          translations: {
            where: buildLocaleCondition(locale),
            select: { title: true, description: true, locale: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      })

      return pageTypes.map((pt) => ({
        slug: pt.slug,
        type: pt.type,
        icon: pt.icon,
        title: getTranslatedField(pt.translations, locale, "title", pt.title),
        description: getTranslatedField(pt.translations, locale, "description", pt.description || ""),
      }))
    },
    ["page-types-all", locale],
    {
      revalidate: REVALIDATE_TIME.VERY_LONG,
      tags: [CACHE_TAGS.PAGE_TYPES],
    }
  )

  return getCachedData()
}

/**
 * 根据 slug 获取单个 PageType 的信息（不包含游戏列表）
 * 用于 generateMetadata，避免重复查询游戏列表
 *
 * @example
 * const pageInfo = await getPageTypeInfo("most-played", "en")
 * // { slug, type, icon, title, subtitle, description, metaTitle, metaDescription, totalGames }
 */
export async function getPageTypeInfo(pageTypeSlug: string, locale: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Query] 📄 getPageTypeInfo - 开始查询 pageTypeSlug: ${pageTypeSlug}, locale: ${locale}`)
  }

  // 定义缓存函数：一次性查询并组装完整数据
  const getCachedData = unstable_cache(
    async () => {
      // 直接查询 pageType 数据
      const pageType = await prisma.pageType.findUnique({
        where: { slug: pageTypeSlug, isEnabled: true },
        select: {
          slug: true,
          type: true,
          icon: true,
          // 主表的英文字段作为回退
          title: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          pageInfo: true,
          translations: {
            where: buildLocaleCondition(locale),
            select: {
              title: true,
              description: true,
              metaTitle: true,
              metaDescription: true,
              locale: true,
            },
          },
        },
      })

      if (!pageType || pageType.type !== "GAME_LIST") return null

      // 获取游戏总数（用于 SEO 描述）
      const pageInfo = (pageType.pageInfo as any) || {}
      const gameListConfig = pageInfo.gameList || {}
      const configFilters = gameListConfig.filters || {}
      const totalGames = await prisma.game.count({
        where: {
          status: 'PUBLISHED',
          ...configFilters,
        },
      })

      return {
        slug: pageType.slug,
        type: pageType.type,
        icon: pageType.icon,
        title: getTranslatedField(pageType.translations, locale, "title", pageType.title),
        description: getTranslatedField(pageType.translations, locale, "description", pageType.description || ""),
        metaTitle: getTranslatedField(pageType.translations, locale, "metaTitle", pageType.metaTitle || ""),
        metaDescription: getTranslatedField(pageType.translations, locale, "metaDescription", pageType.metaDescription || ""),
        totalGames,
      }
    },
    ["page-type-info", pageTypeSlug, locale],
    {
      revalidate: REVALIDATE_TIME.VERY_LONG,
      tags: [CACHE_TAGS.PAGE_TYPES],
    }
  )

  return getCachedData()
}
