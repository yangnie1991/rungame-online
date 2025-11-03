/**
 * GamePix 同步进度 SSE (Server-Sent Events) 端点
 * 用于实时推送同步进度到客户端
 */

import { NextRequest } from 'next/server'
import { prismaCache } from '@/lib/prisma-cache'
import { prisma } from '@/lib/prisma' // 主数据库
import { fetchGamePixFeed, type ImportOptions } from '@/lib/gamepix-importer'

// 同步模式
export type SyncMode = 'full' | 'incremental'

// 进度更新接口
export interface SyncProgressUpdate {
  currentPage: number
  totalPages: number
  processedGames: number
  newGames: number
  updatedGames: number
  currentStep: string
  estimatedTotal?: number
}

/**
 * SSE 格式化函数
 */
function formatSSE(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

/**
 * 获取 API 总数
 */
async function getApiTotal(siteId: string) {
  const perPage = 96
  const feed = await fetchGamePixFeed(siteId, {
    format: 'json',
    orderBy: 'quality',
    perPage,
    page: 1,
  })

  let totalPages = 1
  if (feed.last_page_url) {
    const match = feed.last_page_url.match(/[?&]page=(\d+)/)
    if (match) {
      totalPages = parseInt(match[1], 10)
    }
  }

  let lastPageCount: number
  if (totalPages > 1) {
    const lastPageFeed = await fetchGamePixFeed(siteId, {
      format: 'json',
      orderBy: 'quality',
      perPage,
      page: totalPages,
    })
    lastPageCount = lastPageFeed.items?.length || 0
  } else {
    lastPageCount = feed.items?.length || 0
  }

  const exactTotal = (totalPages - 1) * perPage + lastPageCount

  return {
    totalPages,
    estimatedTotal: exactTotal,
    perPage,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const siteId = searchParams.get('siteId')
  const mode = (searchParams.get('mode') as SyncMode) || 'full'
  const orderBy = (searchParams.get('orderBy') as 'quality' | 'published') || 'quality'

  // 🎯 新增：分批同步参数
  const startPage = parseInt(searchParams.get('startPage') || '1', 10)
  const maxPages = parseInt(searchParams.get('maxPages') || '0', 10) // 0 表示不限制

  if (!siteId) {
    return new Response('Missing siteId parameter', { status: 400 })
  }

  if (startPage < 1) {
    return new Response('startPage must be >= 1', { status: 400 })
  }

  // 创建 SSE 响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const startTime = Date.now()
        let totalSynced = 0
        let newGames = 0
        let updatedGames = 0
        let actualTotalPages = 1
        let incrementalNewGamesCount = 0

        // 发送进度的辅助函数
        const sendProgress = (progress: SyncProgressUpdate) => {
          controller.enqueue(encoder.encode(formatSSE(progress)))
        }

        // 步骤 1: 获取 API 总数
        console.log('[SSE同步] 开始同步，模式:', mode, '排序:', orderBy)
        sendProgress({
          currentPage: 0,
          totalPages: 1,
          processedGames: 0,
          newGames: 0,
          updatedGames: 0,
          currentStep: '正在获取 API 游戏总数...',
        })

        const apiTotalStart = Date.now()
        const { estimatedTotal } = await getApiTotal(siteId)
        console.log('[SSE同步] 获取API总数完成，耗时:', Date.now() - apiTotalStart, 'ms，总数:', estimatedTotal)

        // 根据模式决定同步页数
        if (mode === 'full') {
          actualTotalPages = Math.ceil(estimatedTotal / 96)
        } else {
          // 增量同步
          const cacheTotal = await prismaCache.gamePixGameCache.count()
          incrementalNewGamesCount = Math.max(0, estimatedTotal - cacheTotal)
          actualTotalPages = Math.ceil(incrementalNewGamesCount / 96)

          if (incrementalNewGamesCount === 0) {
            sendProgress({
              currentPage: 0,
              totalPages: 0,
              processedGames: 0,
              newGames: 0,
              updatedGames: 0,
              currentStep: '没有检测到新游戏,无需同步',
              estimatedTotal,
            })

            // 发送完成事件
            controller.enqueue(
              encoder.encode(
                formatSSE({
                  type: 'complete',
                  data: {
                    totalSynced: 0,
                    newGames: 0,
                    updatedGames: 0,
                    syncDuration: Date.now() - startTime,
                  },
                })
              )
            )
            controller.close()
            return
          }
        }

        // 🎯 计算本次实际同步的页数范围
        const syncStartPage = startPage
        const syncEndPage = maxPages > 0
          ? Math.min(startPage + maxPages - 1, actualTotalPages)
          : actualTotalPages
        const batchTotalPages = syncEndPage - syncStartPage + 1

        console.log(`[SSE同步] 分批模式: 从第 ${syncStartPage} 页开始，本次同步 ${batchTotalPages} 页（共 ${actualTotalPages} 页）`)

        sendProgress({
          currentPage: 0,
          totalPages: batchTotalPages,
          processedGames: 0,
          newGames: 0,
          updatedGames: 0,
          currentStep: maxPages > 0
            ? `分批同步: 第 ${syncStartPage}-${syncEndPage} 页 (共 ${actualTotalPages} 页)`
            : `检测到 ${estimatedTotal} 个游戏,共 ${actualTotalPages} 页,准备同步...`,
          estimatedTotal,
        })

        // 分页同步
        for (let page = syncStartPage; page <= syncEndPage; page++) {
          const batchCurrentPage = page - syncStartPage + 1
          sendProgress({
            currentPage: batchCurrentPage,
            totalPages: batchTotalPages,
            processedGames: totalSynced,
            newGames,
            updatedGames,
            currentStep: maxPages > 0
              ? `批次进度: ${batchCurrentPage}/${batchTotalPages} | 总进度: 第 ${page}/${actualTotalPages} 页`
              : `正在获取第 ${page}/${actualTotalPages} 页数据...`,
            estimatedTotal,
          })

          const options: ImportOptions = {
            format: 'json',
            orderBy: mode === 'incremental' ? 'published' : orderBy,
            perPage: 96,
            page,
          }

          const fetchStart = Date.now()
          const feed = await fetchGamePixFeed(siteId, options)
          let games = feed.items
          console.log(`[SSE同步] 第${page}页 API请求耗时:`, Date.now() - fetchStart, 'ms，获取:', games?.length, '个游戏')

          if (!games || games.length === 0) {
            break
          }

          // 增量同步：最后一页截取
          if (mode === 'incremental' && page === actualTotalPages && incrementalNewGamesCount > 0) {
            const processedGames = (page - 1) * 96
            const remainingGames = incrementalNewGamesCount - processedGames
            const neededGames = Math.min(remainingGames + 5, games.length)

            if (neededGames < games.length && neededGames > 0) {
              games = games.slice(0, neededGames)
              sendProgress({
                currentPage: batchCurrentPage,
                totalPages: batchTotalPages,
                processedGames: totalSynced,
                newGames,
                updatedGames,
                currentStep: `最后一页：截取前 ${neededGames} 个游戏（需要 ${remainingGames}，缓冲 +5）`,
                estimatedTotal,
              })
            }
          }

          sendProgress({
            currentPage: batchCurrentPage,
            totalPages: batchTotalPages,
            processedGames: totalSynced,
            newGames,
            updatedGames,
            currentStep: maxPages > 0
              ? `批次 ${batchCurrentPage}/${batchTotalPages}: 正在保存 ${games.length} 个游戏...`
              : `第 ${page} 页: 正在保存 ${games.length} 个游戏...`,
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

          console.log(`[SSE同步] 第${page}页 创建新游戏: ${createdCount}/${games.length}，耗时: ${Date.now() - dbStart}ms`)

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
            console.log(`[SSE同步] 第${page}页 更新已存在游戏: ${existingCount}/${games.length}，耗时: ${Date.now() - updateStart}ms`)
          }

          console.log(`[SSE同步] 第${page}页 数据库总耗时: ${Date.now() - dbStart}ms`)

          // ========== 步骤 3: 自动更新 isImported 状态 ==========
          // 🎯 关键优化：同步时检查主数据库，自动标记已导入的游戏
          try {
            const checkStart = Date.now()

            // 查询主数据库，找出哪些游戏已被导入
            const importedGames = await prisma.game.findMany({
              where: {
                sourcePlatform: 'gamepix',
                sourcePlatformId: {
                  in: games.map(g => g.id),
                },
              },
              select: { sourcePlatformId: true },
            })

            const importedIds = new Set(
              importedGames
                .map(g => g.sourcePlatformId)
                .filter((id): id is string => id !== null)
            )

            if (importedIds.size > 0) {
              // 批量更新 isImported 状态
              await prismaCache.gamePixGameCache.updateMany({
                where: {
                  id: { in: Array.from(importedIds) },
                },
                data: {
                  isImported: true,
                  lastImportedAt: new Date(),
                },
              })

              console.log(`[SSE同步] 第${page}页 更新 isImported 状态: ${importedIds.size}个游戏，耗时: ${Date.now() - checkStart}ms`)
            }
          } catch (checkError) {
            console.warn(`[SSE同步] 第${page}页 检查 isImported 状态失败:`, checkError)
            // 不影响主流程，继续同步
          }

          totalSynced += games.length

          sendProgress({
            currentPage: batchCurrentPage,
            totalPages: batchTotalPages,
            processedGames: totalSynced,
            newGames,
            updatedGames,
            currentStep: maxPages > 0
              ? `批次 ${batchCurrentPage}/${batchTotalPages} 完成 (${games.length} 个游戏)`
              : `第 ${page} 页完成 (${games.length} 个游戏)`,
            estimatedTotal,
          })

          if (games.length < 96) {
            break
          }
        }

        const syncDuration = Date.now() - startTime

        // 计算剩余页数
        const remainingPages = actualTotalPages - syncEndPage
        const hasMorePages = remainingPages > 0

        // 记录同步日志
        await prismaCache.syncLog.create({
          data: {
            totalGames: totalSynced,
            newGames,
            updatedGames,
            status: 'success',
            syncDuration,
            apiParams: {
              siteId,
              mode,
              orderBy,
              perPage: 96,
              startPage,
              maxPages,
              syncEndPage,
              remainingPages,
            },
          },
        })

        sendProgress({
          currentPage: batchTotalPages,
          totalPages: batchTotalPages,
          processedGames: totalSynced,
          newGames,
          updatedGames,
          currentStep: hasMorePages
            ? `批次完成! 已同步第 ${syncStartPage}-${syncEndPage} 页，还剩 ${remainingPages} 页`
            : `同步完成! 共处理 ${totalSynced} 个游戏 (API总数: ${estimatedTotal})`,
          estimatedTotal,
        })

        // 发送完成事件
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: 'complete',
              data: {
                totalSynced,
                newGames,
                updatedGames,
                syncDuration,
                // 🎯 添加分批信息，告诉前端是否还有更多页
                nextStartPage: hasMorePages ? syncEndPage + 1 : null,
                remainingPages,
                hasMorePages,
                actualTotalPages,
              },
            })
          )
        )

        controller.close()
      } catch (error) {
        console.error('同步失败:', error)

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

        // 发送错误事件
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: 'error',
              error: error instanceof Error ? error.message : '同步失败',
            })
          )
        )

        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
