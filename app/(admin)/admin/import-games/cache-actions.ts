'use server'

/**
 * GamePix 缓存数据库操作
 * 用于管理独立的 Neon 缓存数据库中的 GamePix 游戏数据
 */

import { revalidatePath } from 'next/cache'
import { prismaCache } from '@/lib/prisma-cache' // 缓存数据库
import { fetchGamePixFeed, type GamePixGameItem, type ImportOptions } from '@/lib/gamepix-importer'

// 筛选选项
export interface CacheFilters {
  category?: string
  minQuality?: number
  search?: string
  isImported?: boolean
  page?: number
  perPage?: number
  orderBy?: 'quality' | 'published' | 'priority'
}

/**
 * 从缓存数据库获取游戏列表（支持高级筛选）
 */
export async function getGamePixGamesFromCache(filters: CacheFilters = {}) {
  try {
    const {
      category,
      minQuality = 0,
      search,
      isImported,
      page = 1,
      perPage = 48,
      orderBy = 'quality',
    } = filters

    // 构建查询条件
    const where: any = {
      ...(category && { category }),
      ...(minQuality > 0 && { quality_score: { gte: minQuality } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { namespace: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isImported !== undefined && { isImported }),
      isHidden: false, // 不显示隐藏的游戏
    }

    // 排序规则
    const orderByClause =
      orderBy === 'published'
        ? { date_published: 'desc' as const }
        : orderBy === 'priority'
        ? { priority: 'desc' as const }
        : { quality_score: 'desc' as const }

    // 并行查询游戏列表和总数
    const [games, total] = await Promise.all([
      prismaCache.gamePixGameCache.findMany({
        where,
        orderBy: orderByClause,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prismaCache.gamePixGameCache.count({ where }),
    ])

    return {
      success: true,
      data: {
        games,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  } catch (error) {
    console.error('从缓存获取游戏失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取游戏失败',
    }
  }
}

// 进度回调接口
export interface SyncProgressUpdate {
  currentPage: number
  totalPages: number
  processedGames: number
  newGames: number
  updatedGames: number
  currentStep: string
  estimatedTotal?: number // 预估总游戏数
}

// 同步模式
export type SyncMode = 'full' | 'incremental'

/**
 * 获取 GamePix API 中的总游戏数
 * 固定使用 perPage=96 (API 最大值) 来计算总数，减少 API 调用
 */
export async function getGamePixApiTotal(config: {
  siteId: string
}) {
  try {
    const { siteId } = config

    // 固定使用 96 每页（API 支持的最大值）来计算总数
    const perPage = 96

    // 获取第一页数据,从中提取总页数（不使用分类筛选，获取所有游戏总数）
    const feed = await fetchGamePixFeed(siteId, {
      format: 'json',
      orderBy: 'quality', // 使用 quality 排序获取总数
      perPage,
      page: 1,
    })

    // 从 last_page_url 提取总页数
    let totalPages = 1
    if (feed.last_page_url) {
      const match = feed.last_page_url.match(/[?&]page=(\d+)/)
      if (match) {
        totalPages = parseInt(match[1], 10)
      }
    }

    // 获取最后一页的实际游戏数量
    let lastPageCount: number

    if (totalPages > 1) {
      // 多页情况：获取最后一页数据
      const lastPageFeed = await fetchGamePixFeed(siteId, {
        format: 'json',
        orderBy: 'quality',
        perPage,
        page: totalPages,
      })
      lastPageCount = lastPageFeed.items?.length || 0
    } else {
      // 单页情况：第一页就是最后一页
      lastPageCount = feed.items?.length || 0
    }

    // 精确计算总游戏数：(总页数 - 1) × 96 + 最后一页实际数量
    const exactTotal = (totalPages - 1) * perPage + lastPageCount

    return {
      success: true,
      data: {
        totalPages,
        estimatedTotal: exactTotal, // 现在是精确值，不是估算值
        perPage,
      },
    }
  } catch (error) {
    console.error('获取 API 总数失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
    }
  }
}

/**
 * 从 GamePix API 同步数据到缓存数据库
 * 注意：由于 Server Action 限制，无法实时报告进度
 */
export async function syncGamePixToCache(
  config: {
    siteId: string
    mode: SyncMode // 同步模式: full=全量, incremental=增量
    orderBy?: 'quality' | 'published'
  },
  onProgress?: (update: SyncProgressUpdate) => void
) {
  const startTime = Date.now()
  const { siteId, mode, orderBy = 'quality' } = config

  console.log(`[同步开始] 模式: ${mode}, 排序: ${orderBy}`)

  try {
    let totalSynced = 0
    let newGames = 0
    let updatedGames = 0
    let actualTotalPages = 1
    let incrementalNewGamesCount = 0 // 增量同步时需要的新游戏数量

    // 第一步: 获取 API 总数和总页数
    onProgress?.({
      currentPage: 0,
      totalPages: 1,
      processedGames: 0,
      newGames: 0,
      updatedGames: 0,
      currentStep: '正在获取 API 游戏总数...',
    })

    const apiTotalResult = await getGamePixApiTotal({
      siteId,
    })

    if (!apiTotalResult.success || !apiTotalResult.data) {
      throw new Error(apiTotalResult.error || '获取 API 总数失败')
    }

    const { estimatedTotal } = apiTotalResult.data

    // 根据模式决定同步页数
    if (mode === 'full') {
      // 全量同步: 同步所有页面
      // estimatedTotal 和页数都是基于 perPage=96 计算的
      actualTotalPages = Math.ceil(estimatedTotal / 96)

      onProgress?.({
        currentPage: 0,
        totalPages: actualTotalPages,
        processedGames: 0,
        newGames: 0,
        updatedGames: 0,
        currentStep: `检测到 ${estimatedTotal} 个游戏,共 ${actualTotalPages} 页,准备全量同步...`,
        estimatedTotal,
      })
    } else {
      // 增量同步: 计算新游戏数量
      const cacheTotal = await prismaCache.gamePixGameCache.count()
      incrementalNewGamesCount = Math.max(0, estimatedTotal - cacheTotal)
      const newPagesCount = Math.ceil(incrementalNewGamesCount / 96)

      // 设置增量同步页数
      actualTotalPages = newPagesCount

      onProgress?.({
        currentPage: 0,
        totalPages: actualTotalPages,
        processedGames: 0,
        newGames: 0,
        updatedGames: 0,
        currentStep: `检测到约 ${incrementalNewGamesCount} 个新游戏,需同步 ${actualTotalPages} 页...`,
        estimatedTotal,
      })

      // 如果没有新游戏,直接返回
      if (incrementalNewGamesCount === 0) {
        onProgress?.({
          currentPage: 0,
          totalPages: 0,
          processedGames: 0,
          newGames: 0,
          updatedGames: 0,
          currentStep: '没有检测到新游戏,无需同步',
          estimatedTotal,
        })

        return {
          success: true,
          data: {
            totalSynced: 0,
            newGames: 0,
            updatedGames: 0,
            syncDuration: Date.now() - startTime,
          },
        }
      }
    }

    // 分页同步
    for (let page = 1; page <= actualTotalPages; page++) {
      // 报告进度: 开始处理当前页
      onProgress?.({
        currentPage: page,
        totalPages: actualTotalPages,
        processedGames: totalSynced,
        newGames,
        updatedGames,
        currentStep: `正在获取第 ${page}/${actualTotalPages} 页数据...`,
        estimatedTotal,
      })

      const options: ImportOptions = {
        format: 'json',
        orderBy: mode === 'incremental' ? 'published' : orderBy, // 增量同步必须按发布日期排序
        perPage: 96, // 固定使用最大值
        page,
      }

      // 从 GamePix API 获取数据
      const feed = await fetchGamePixFeed(siteId, options)
      let games = feed.items

      // 防御性检查：API 可能返回空数据
      if (!games || games.length === 0) {
        break
      }

      // 增量同步模式：最后一页可能需要截取数据
      if (mode === 'incremental' && page === actualTotalPages && incrementalNewGamesCount > 0) {
        const processedGames = (page - 1) * 96
        const remainingGames = incrementalNewGamesCount - processedGames

        // 多获取 5 条作为缓冲，防止数据遗漏
        const neededGames = Math.min(remainingGames + 5, games.length)

        if (neededGames < games.length && neededGames > 0) {
          games = games.slice(0, neededGames)
          onProgress?.({
            currentPage: page,
            totalPages: actualTotalPages,
            processedGames: totalSynced,
            newGames,
            updatedGames,
            currentStep: `最后一页：截取前 ${neededGames} 个游戏（需要 ${remainingGames}，缓冲 +5）`,
            estimatedTotal,
          })
        }
      }

      // 报告进度: 开始保存数据
      onProgress?.({
        currentPage: page,
        totalPages: actualTotalPages,
        processedGames: totalSynced,
        newGames,
        updatedGames,
        currentStep: `第 ${page} 页: 正在保存 ${games.length} 个游戏...`,
        estimatedTotal,
      })

      // ==================== 优化方案：减少数据库往返 ====================
      // 策略 1: 先尝试批量插入（skipDuplicates）
      // 策略 2: 使用原生 SQL 批量更新已存在的记录（一次数据库往返）

      const dbStart = Date.now()

      // 步骤 1: 批量插入（PostgreSQL 自动忽略重复）
      const createResult = await prismaCache.gamePixGameCache.createMany({
        data: games.map(game => ({
          id: game.id,
          namespace: game.namespace,
          title: game.title,
          description: game.description,
          category: game.category,
          quality_score: game.quality_score,
          banner_image: game.banner_image,
          image: game.image,
          url: game.url,
          width: game.width,
          height: game.height,
          orientation: game.orientation,
          date_published: new Date(game.date_published),
          date_modified: new Date(game.date_modified),
        })),
        skipDuplicates: true, // 跳过已存在的记录
      })

      const createdCount = createResult.count
      newGames += createdCount

      console.log(`[同步] 第${page}页 创建新游戏: ${createdCount}/${games.length}，耗时: ${Date.now() - dbStart}ms`)

      // 步骤 2: 批量更新已存在的游戏（一次 SQL 完成）
      const existingCount = games.length - createdCount
      if (existingCount > 0) {
        const updateStart = Date.now()

        // 使用 PostgreSQL UNNEST + UPDATE FROM 语法（最快的批量更新方式）
        // 只需要一次数据库往返，无论有多少条记录
        const values = games.map(game => {
          // SQL 注入防护：转义单引号
          const escapeStr = (str: string) => str.replace(/'/g, "''")
          return `(
            '${game.id}',
            '${escapeStr(game.namespace)}',
            '${escapeStr(game.title)}',
            '${escapeStr(game.description)}',
            '${game.category}',
            ${game.quality_score},
            '${game.banner_image}',
            '${game.image}',
            '${game.url}',
            ${game.width},
            ${game.height},
            '${game.orientation}',
            '${new Date(game.date_published).toISOString()}',
            '${new Date(game.date_modified).toISOString()}'
          )`
        }).join(',')

        await prismaCache.$executeRawUnsafe(`
          UPDATE "gamepix_games_cache" AS g
          SET
            "namespace" = v.namespace,
            "title" = v.title,
            "description" = v.description,
            "category" = v.category,
            "quality_score" = v.quality_score,
            "banner_image" = v.banner_image,
            "image" = v.image,
            "url" = v.url,
            "width" = v.width,
            "height" = v.height,
            "orientation" = v.orientation,
            "date_published" = v.date_published::timestamp,
            "date_modified" = v.date_modified::timestamp,
            "lastSyncAt" = NOW()
          FROM (
            VALUES ${values}
          ) AS v(
            id, namespace, title, description, category,
            quality_score, banner_image, image, url,
            width, height, orientation, date_published, date_modified
          )
          WHERE g.id = v.id
        `)

        updatedGames += existingCount
        console.log(`[同步] 第${page}页 更新已存在游戏: ${existingCount}/${games.length}，耗时: ${Date.now() - updateStart}ms`)
      }

      console.log(`[同步] 第${page}页 数据库总耗时: ${Date.now() - dbStart}ms`)

      totalSynced += games.length

      // 报告进度: 当前页完成
      onProgress?.({
        currentPage: page,
        totalPages: actualTotalPages,
        processedGames: totalSynced,
        newGames,
        updatedGames,
        currentStep: `第 ${page} 页完成 (${games.length} 个游戏)`,
        estimatedTotal,
      })

      // 防御性检查：如果这一页没有满，说明已经是最后一页了
      // 这可能发生在同步过程中 API 数据发生变化的情况
      if (games.length < 96) {
        break
      }
    }

    const syncDuration = Date.now() - startTime

    // 记录同步日志
    await prismaCache.syncLog.create({
      data: {
        totalGames: totalSynced,
        newGames,
        updatedGames,
        status: 'success',
        syncDuration,
        apiParams: { siteId, mode, orderBy, perPage: 96 },
      },
    })

    // 报告进度: 完成
    onProgress?.({
      currentPage: actualTotalPages,
      totalPages: actualTotalPages,
      processedGames: totalSynced,
      newGames,
      updatedGames,
      currentStep: `同步完成! 共处理 ${totalSynced} 个游戏 (API总数: ${estimatedTotal})`,
      estimatedTotal,
    })

    revalidatePath('/admin/import-games/gamepix')

    return {
      success: true,
      data: {
        totalSynced,
        newGames,
        updatedGames,
        syncDuration,
      },
    }
  } catch (error) {
    console.error('同步 GamePix 数据失败:', error)

    // 记录失败日志
    await prismaCache.syncLog.create({
      data: {
        totalGames: 0,
        newGames: 0,
        updatedGames: 0,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
        apiParams: { siteId, mode, orderBy, perPage: 96 },
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : '同步失败',
    }
  }
}

/**
 * 标记游戏为已导入
 */
export async function markGameAsImported(gamePixId: string) {
  try {
    await prismaCache.gamePixGameCache.update({
      where: { id: gamePixId },
      data: {
        isImported: true,
        importCount: { increment: 1 },
        lastImportedAt: new Date(),
      },
    })

    revalidatePath('/admin/import-games/gamepix')

    return { success: true }
  } catch (error) {
    console.error('标记游戏失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '标记失败',
    }
  }
}

/**
 * 批量标记游戏为已导入
 */
export async function markGamesAsImported(gamePixIds: string[]) {
  try {
    await prismaCache.gamePixGameCache.updateMany({
      where: { id: { in: gamePixIds } },
      data: {
        isImported: true,
        importCount: { increment: 1 },
        lastImportedAt: new Date(),
      },
    })

    revalidatePath('/admin/import-games/gamepix')

    return { success: true, count: gamePixIds.length }
  } catch (error) {
    console.error('批量标记游戏失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量标记失败',
    }
  }
}

/**
 * 获取同步日志
 */
export async function getSyncLogs(limit: number = 10) {
  try {
    const logs = await prismaCache.syncLog.findMany({
      orderBy: { syncedAt: 'desc' },
      take: limit,
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error('获取同步日志失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取日志失败',
    }
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  try {
    const [total, imported, notImported, lastSync] = await Promise.all([
      prismaCache.gamePixGameCache.count(),
      prismaCache.gamePixGameCache.count({ where: { isImported: true } }),
      prismaCache.gamePixGameCache.count({ where: { isImported: false } }),
      prismaCache.syncLog.findFirst({
        where: { status: 'success' },
        orderBy: { syncedAt: 'desc' },
      }),
    ])

    return {
      success: true,
      data: {
        total,
        imported,
        notImported,
        lastSyncAt: lastSync?.syncedAt,
        lastSyncStats: lastSync
          ? {
              totalGames: lastSync.totalGames,
              newGames: lastSync.newGames,
              updatedGames: lastSync.updatedGames,
            }
          : null,
      },
    }
  } catch (error) {
    console.error('获取缓存统计失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取统计失败',
    }
  }
}

/**
 * 取消游戏的导入状态（仅标记为未导入）
 * 注意：不再调用 revalidatePath，由调用方自行决定是否需要刷新页面
 */
export async function unmarkGameAsImported(gamePixId: string) {
  try {
    await prismaCache.gamePixGameCache.update({
      where: { id: gamePixId },
      data: {
        isImported: false,
        lastImportedAt: null,
      },
    })

    // ✅ 移除 revalidatePath，避免触发整个页面重新加载
    // 调用方会通过客户端状态更新来反映变化

    return { success: true }
  } catch (error) {
    console.error('取消导入标记失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '取消标记失败',
    }
  }
}

/**
 * 批量取消游戏的导入状态
 * 注意：不再调用 revalidatePath，由调用方自行决定是否需要刷新页面
 */
export async function unmarkGamesAsImported(gamePixIds: string[]) {
  try {
    await prismaCache.gamePixGameCache.updateMany({
      where: { id: { in: gamePixIds } },
      data: {
        isImported: false,
        lastImportedAt: null,
      },
    })

    // ✅ 移除 revalidatePath，避免触发整个页面重新加载
    // 调用方会通过客户端状态更新来反映变化

    return { success: true, count: gamePixIds.length }
  } catch (error) {
    console.error('批量取消导入标记失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量取消标记失败',
    }
  }
}
