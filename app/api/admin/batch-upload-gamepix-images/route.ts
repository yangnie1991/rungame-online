/**
 * 批量上传 GamePix 图片到 R2
 *
 * POST /api/admin/batch-upload-gamepix-images
 * Body: { images: Array<{ url: string, type: 'thumbnail' | 'banner' | 'screenshot' }> }
 *
 * 返回：{ success: boolean, data: { uploaded: Array<{ originalUrl: string, r2Url: string, type: string }>, failed: Array<{ url: string, error: string }> } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadGamePixImageToR2 } from '@/lib/gamepix-image-upload'

interface ImageUploadRequest {
  url: string
  type: 'thumbnail' | 'banner' | 'screenshot'
}

interface ImageUploadResult {
  originalUrl: string
  r2Url: string
  type: string
  hash: string
  size: number
  isNewUpload: boolean
}

interface FailedUpload {
  url: string
  type: string
  error: string
}

export async function POST(req: NextRequest) {
  try {
    // 1. 验证身份
    const session = await auth()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: '无权限' },
        { status: 403 }
      )
    }

    // 2. 解析请求
    const body = await req.json()
    const { images } = body as { images: ImageUploadRequest[] }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要上传的图片列表' },
        { status: 400 }
      )
    }

    console.log(`[批量上传] 开始上传 ${images.length} 张图片`)

    // 3. 批量上传（带错误处理）
    const uploaded: ImageUploadResult[] = []
    const failed: FailedUpload[] = []

    for (const image of images) {
      try {
        // 根据类型确定文件夹
        const folderMap: Record<string, string> = {
          thumbnail: 'games/thumbnails',
          banner: 'games/banners',
          screenshot: 'games/screenshots',
        }
        const folder = folderMap[image.type] || 'games/images'

        // 上传到 R2
        const result = await uploadGamePixImageToR2(image.url, { folder })

        uploaded.push({
          originalUrl: image.url,
          r2Url: result.url,
          type: image.type,
          hash: result.hash,
          size: result.size,
          isNewUpload: result.isNewUpload,
        })

        console.log(`[批量上传] ✓ ${image.type}: ${image.url} → ${result.url}`)
      } catch (error: any) {
        failed.push({
          url: image.url,
          type: image.type,
          error: error.message || '上传失败',
        })

        console.error(`[批量上传] ✗ ${image.type}: ${image.url}`, error)
      }
    }

    console.log(`[批量上传] 完成: ${uploaded.length} 成功, ${failed.length} 失败`)

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      data: {
        uploaded,
        failed,
        summary: {
          total: images.length,
          uploaded: uploaded.length,
          failed: failed.length,
        },
      },
    })
  } catch (error: any) {
    console.error('[批量上传] 请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
