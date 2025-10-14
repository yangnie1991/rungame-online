/**
 * 图片上传 API
 *
 * 用于管理后台上传分类图标、横幅等自定义图片到 Cloudflare R2
 *
 * 路由: POST /api/upload
 * 权限: 需要管理员身份验证
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  uploadToR2,
  generateUniqueFileName,
  validateFileType,
  validateFileSize,
  formatFileSize,
} from "@/lib/r2-upload"

/**
 * 允许的图片类型
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

/**
 * 最大文件大小: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 上传类型到文件夹的映射
 */
const UPLOAD_FOLDERS: Record<string, string> = {
  category: 'images/categories',
  banner: 'images/banners',
  avatar: 'images/avatars',
  misc: 'images/misc',
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证身份
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权,请先登录' },
        { status: 401 }
      )
    }

    // 检查管理员角色
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '权限不足,仅管理员可上传文件' },
        { status: 403 }
      )
    }

    // 2. 解析表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = (formData.get('type') as string) || 'misc' // 默认类型: misc

    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 3. 验证文件类型
    if (!validateFileType(file.type, ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json(
        {
          error: `不支持的文件类型: ${file.type}`,
          allowedTypes: ALLOWED_IMAGE_TYPES,
        },
        { status: 400 }
      )
    }

    // 4. 验证文件大小
    if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
      return NextResponse.json(
        {
          error: `文件过大: ${formatFileSize(file.size)}, 最大允许 ${formatFileSize(MAX_FILE_SIZE)}`,
          maxSize: MAX_FILE_SIZE,
          actualSize: file.size,
        },
        { status: 400 }
      )
    }

    // 5. 生成唯一文件名和路径
    const uniqueFileName = generateUniqueFileName(file.name)
    const folder = UPLOAD_FOLDERS[uploadType] || UPLOAD_FOLDERS.misc
    const key = `${folder}/${uniqueFileName}`

    // 6. 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 7. 上传到 R2
    const result = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable', // 1年缓存
      metadata: {
        originalName: file.name,
        uploadedBy: session.user.email || 'unknown',
        uploadType,
        uploadedAt: new Date().toISOString(),
      },
    })

    // 8. 返回成功结果
    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: result.url,
        key: result.key,
        size: result.size,
        contentType: result.contentType,
        fileName: uniqueFileName,
        originalName: file.name,
      },
    })
  } catch (error) {
    console.error('上传失败:', error)

    // 区分不同的错误类型
    if (error instanceof Error) {
      if (error.message.includes('R2 未配置')) {
        return NextResponse.json(
          {
            error: 'R2 存储服务未配置',
            details: '请联系管理员配置 Cloudflare R2 环境变量',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          error: '上传失败',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '上传失败,未知错误' },
      { status: 500 }
    )
  }
}

/**
 * 获取上传配置信息 (可选)
 * GET /api/upload
 */
export async function GET() {
  return NextResponse.json({
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeFormatted: formatFileSize(MAX_FILE_SIZE),
    uploadTypes: Object.keys(UPLOAD_FOLDERS),
  })
}
