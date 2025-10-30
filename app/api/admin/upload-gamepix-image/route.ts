import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadGamePixImageToR2 } from '@/lib/gamepix-image-upload'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * 上传单张 GamePix 图片到 R2
 *
 * POST /api/admin/upload-gamepix-image
 *
 * Body: {
 *   imageUrl: string  // GamePix 图片 URL
 *   folder?: string   // R2 文件夹（可选）
 * }
 *
 * Response: {
 *   success: true,
 *   data: {
 *     url: string           // R2 CDN URL
 *     hash: string          // 图片哈希值
 *     isNewUpload: boolean  // 是否是新上传
 *     size: number          // 文件大小
 *     contentType: string   // MIME 类型
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const session = await auth()
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: '未授权' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const body = await request.json()
    const { imageUrl, folder = 'games/images' } = body

    // 参数验证
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少必需参数: imageUrl' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[upload-gamepix-image] 开始上传图片:', imageUrl)

    // 上传图片到 R2
    const result = await uploadGamePixImageToR2(imageUrl, { folder })

    console.log('[upload-gamepix-image] ✓ 上传完成:', result.isNewUpload ? '新上传' : '已存在（跳过）')

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('[upload-gamepix-image] 上传失败:', error)

    return new Response(
      JSON.stringify({
        error: '图片上传失败',
        message: error.message || '未知错误'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
