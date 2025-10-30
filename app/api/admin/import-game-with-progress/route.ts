/**
 * 导入游戏（支持 SSE 流式进度反馈）
 *
 * POST /api/admin/import-game-with-progress
 * Body: { game: GamePixGameItem, config: ImportConfig }
 *
 * 返回：SSE 流
 * - data: { step: number, total: number, percentage: number, message: string }
 * - data: { success: true, gameId: string }
 * - data: { error: string }
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadGamePixImageToR2 } from '@/lib/gamepix-image-upload'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache-helpers'

// SSE 辅助函数
function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

// 睡眠函数（用于重试）
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试包装器
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = baseDelay * Math.pow(2, i) // 指数退避
      console.log(`[重试] 第 ${i + 1} 次失败，${delay}ms 后重试...`)
      await sleep(delay)
    }
  }
  throw new Error('重试失败')
}

// 计算宽高比
function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9'
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export async function POST(req: NextRequest) {
  // 验证身份
  const session = await auth()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return new Response(
      createSSEMessage({ error: '无权限' }),
      { status: 403, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  // 创建 SSE 流
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(createSSEMessage(data)))
      }

      try {
        // 解析请求
        const body = await req.json()
        const { game, config } = body

        if (!game || !config) {
          send({ error: '缺少必要参数' })
          controller.close()
          return
        }

        console.log(`[导入游戏] 开始: ${game.title}`)

        // ========== 步骤 1: 上传图片到 R2 ==========
        send({ step: 1, total: 4, percentage: 0, message: '正在上传图片到 R2...' })

        const imagesToUpload: Array<{ url: string; type: 'thumbnail' | 'banner' | 'screenshot' }> = []

        // 检查哪些图片需要上传（非 R2 URL）
        if (config.thumbnail && !config.thumbnail.includes('r2.dev') && !config.thumbnail.includes('cloudflare')) {
          imagesToUpload.push({ url: config.thumbnail, type: 'thumbnail' })
        }
        if (config.banner && !config.banner.includes('r2.dev') && !config.banner.includes('cloudflare')) {
          imagesToUpload.push({ url: config.banner, type: 'banner' })
        }
        if (config.screenshots && Array.isArray(config.screenshots)) {
          config.screenshots.forEach((url: string) => {
            if (!url.includes('r2.dev') && !url.includes('cloudflare')) {
              imagesToUpload.push({ url, type: 'screenshot' })
            }
          })
        }

        console.log(`[导入游戏] 需要上传 ${imagesToUpload.length} 张图片`)

        // 批量上传图片（带重试）
        let uploadedImages: Record<string, string> = {}
        if (imagesToUpload.length > 0) {
          try {
            uploadedImages = await retryWithBackoff(async () => {
              const results: Record<string, string> = {}

              for (let i = 0; i < imagesToUpload.length; i++) {
                const image = imagesToUpload[i]
                send({
                  step: 1,
                  total: 4,
                  percentage: Math.round((i / imagesToUpload.length) * 25),
                  message: `上传图片 ${i + 1}/${imagesToUpload.length}: ${image.type}`
                })

                const folderMap: Record<string, string> = {
                  thumbnail: 'games/thumbnails',
                  banner: 'games/banners',
                  screenshot: 'games/screenshots',
                }
                const folder = folderMap[image.type]

                const result = await uploadGamePixImageToR2(image.url, { folder })
                results[image.url] = result.url
                console.log(`[导入游戏] ✓ 上传成功: ${image.type} → ${result.url}`)
              }

              return results
            })

            send({ step: 1, total: 4, percentage: 25, message: `图片上传完成！(${imagesToUpload.length} 张)` })
          } catch (error: any) {
            console.error('[导入游戏] 图片上传失败:', error)
            send({ error: `图片上传失败: ${error.message}` })
            controller.close()
            return
          }
        } else {
          send({ step: 1, total: 4, percentage: 25, message: '无需上传图片（已是 R2 URL）' })
        }

        // 更新配置中的图片 URL
        const finalThumbnail = uploadedImages[config.thumbnail] || config.thumbnail || game.banner_image || game.image
        const finalBanner = uploadedImages[config.banner] || config.banner || game.banner_image
        const finalScreenshots = (config.screenshots || []).map((url: string) => uploadedImages[url] || url)

        // ========== 步骤 2: 验证分类和获取主分类 ID ==========
        send({ step: 2, total: 4, percentage: 30, message: '验证分类信息...' })

        let mainCategoryId: string
        try {
          mainCategoryId = await retryWithBackoff(async () => {
            const { getAllCategoriesForAdmin } = await import('@/lib/data/categories/cache')
            const allCategories = await getAllCategoriesForAdmin('zh')
            const category = allCategories.find(cat => cat.id === config.categoryId)

            if (!category) {
              throw new Error('目标分类不存在')
            }

            return category.parentId || category.id
          })

          send({ step: 2, total: 4, percentage: 40, message: '分类验证完成' })
        } catch (error: any) {
          console.error('[导入游戏] 分类验证失败:', error)
          send({ error: `分类验证失败: ${error.message}` })
          controller.close()
          return
        }

        // ========== 步骤 3: 创建游戏记录 ==========
        send({ step: 3, total: 4, percentage: 50, message: '创建游戏记录...' })

        const slug = game.namespace || `gamepix-${game.id}`

        // 检查游戏是否已存在
        const existing = await prisma.game.findUnique({ where: { slug } })
        if (existing) {
          send({ error: '游戏已存在' })
          controller.close()
          return
        }

        // 准备游戏数据
        const gameData = {
          slug,
          // 英文基础信息
          title: config.title || game.title,
          description: config.description || game.description,
          // 英文 SEO 字段
          keywords: config.keywords || `${game.title}, ${game.category}, online game, free game, html5 game`,
          metaTitle: config.metaTitle || `${game.title} - Play Free Online`,
          metaDescription: config.metaDescription || game.description.substring(0, 160),
          // 媒体资源（使用 R2 URL）
          thumbnail: finalThumbnail,
          banner: finalBanner,
          embedUrl: game.url,
          gameUrl: config.gameUrl || game.url,
          screenshots: finalScreenshots,
          videos: config.videos || [],
          dimensions: {
            width: config.width || game.width,
            height: config.height || game.height,
            aspectRatio: calculateAspectRatio(config.width || game.width, config.height || game.height),
            orientation: game.orientation,
          },
          // 来源信息
          sourcePlatform: 'gamepix',
          sourcePlatformId: game.id,
          qualityScore: game.quality_score * 10,
          // 状态
          status: config.status,
          isFeatured: config.isFeatured,
          // 统计
          playCount: 0,
          viewCount: 0,
          // 时间管理
          releaseDate: game.date_published ? new Date(game.date_published) : undefined,
          sourceUpdatedAt: game.date_modified ? new Date(game.date_modified) : undefined,
          importedAt: new Date(),
          // 英文 ContentSections
          gameInfo: config.contentSections || undefined,
          // 关联分类
          gameCategories: {
            create: {
              categoryId: config.categoryId,
              mainCategoryId,
              isPrimary: true,
              sortOrder: 0,
            },
          },
          // 翻译
          ...(config.translations && config.translations.length > 0
            ? {
                translations: {
                  create: config.translations.map((t: any) => ({
                    locale: t.locale,
                    title: t.title || game.title,
                    description: t.description || game.description,
                    keywords: t.keywords || `${game.title}, ${game.category}`,
                    metaTitle: t.metaTitle || `${game.title}`,
                    metaDescription: t.metaDescription || game.description.substring(0, 160),
                    translationInfo: t.contentSections || undefined,
                  })),
                },
              }
            : {}),
          // 关联标签
          ...(config.tagIds && config.tagIds.length > 0
            ? {
                tags: {
                  create: config.tagIds.map((tagId: string) => ({ tagId })),
                },
              }
            : {}),
        }

        let createdGame
        try {
          createdGame = await retryWithBackoff(async () => {
            return await prisma.game.create({ data: gameData })
          })

          send({ step: 3, total: 4, percentage: 75, message: '游戏记录创建成功' })
          console.log(`[导入游戏] ✓ 游戏创建成功: ${createdGame.id}`)
        } catch (error: any) {
          console.error('[导入游戏] 创建游戏失败:', error)
          send({ error: `创建游戏失败: ${error.message}` })
          controller.close()
          return
        }

        // ========== 步骤 4: 更新缓存标记 ==========
        send({ step: 4, total: 4, percentage: 85, message: '更新缓存标记...' })

        try {
          await retryWithBackoff(async () => {
            const { markGameAsImported } = await import('@/app/(admin)/admin/import-games/cache-actions')
            await markGameAsImported(game.id)
          })

          send({ step: 4, total: 4, percentage: 90, message: '缓存标记更新成功' })
        } catch (error: any) {
          console.error('[导入游戏] 更新缓存标记失败:', error)
          // 缓存标记失败不影响主流程，继续执行
        }

        // ========== 步骤 5: 失效缓存 ==========
        send({ step: 4, total: 4, percentage: 95, message: '失效相关缓存...' })

        revalidateTag(CACHE_TAGS.CATEGORIES)
        revalidateTag(CACHE_TAGS.TAGS)
        revalidateTag(CACHE_TAGS.GAMES)
        revalidateTag(CACHE_TAGS.FEATURED_GAMES)
        revalidateTag(CACHE_TAGS.DASHBOARD_STATS)

        // ========== 完成 ==========
        send({ step: 4, total: 4, percentage: 100, message: '导入完成！' })
        send({ success: true, gameId: createdGame.id, message: '游戏导入成功' })

        console.log(`[导入游戏] ✅ 完成: ${game.title}`)
        controller.close()
      } catch (error: any) {
        console.error('[导入游戏] 意外错误:', error)
        send({ error: error.message || '导入失败' })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
