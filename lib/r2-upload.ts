/**
 * Cloudflare R2 文件上传工具
 *
 * 使用 AWS S3 SDK 连接 R2 (R2 兼容 S3 API)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"

// R2 配置验证
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('⚠️ R2 环境变量未配置,文件上传功能将不可用')
}

// 创建 R2 客户端 (使用 S3 兼容 API)
const r2Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null

/**
 * 上传配置选项
 */
export interface UploadOptions {
  /**
   * 文件路径 (在 bucket 中的路径)
   * @example "images/categories/action.png"
   */
  key: string

  /**
   * 文件内容 (Buffer 或 Uint8Array)
   */
  body: Buffer | Uint8Array

  /**
   * 文件 MIME 类型
   * @example "image/png", "image/jpeg", "image/webp"
   */
  contentType: string

  /**
   * 缓存控制头
   * @default "public, max-age=31536000, immutable"
   */
  cacheControl?: string

  /**
   * 自定义元数据
   */
  metadata?: Record<string, string>
}

/**
 * 上传结果
 */
export interface UploadResult {
  /**
   * 文件在 R2 中的 key
   */
  key: string

  /**
   * 公共访问 URL (CDN 地址)
   */
  url: string

  /**
   * 文件大小 (字节)
   */
  size: number

  /**
   * MIME 类型
   */
  contentType: string
}

/**
 * 上传文件到 R2
 *
 * @example
 * ```typescript
 * const file = await request.formData().get('file') as File
 * const buffer = Buffer.from(await file.arrayBuffer())
 *
 * const result = await uploadToR2({
 *   key: `images/categories/${Date.now()}-${file.name}`,
 *   body: buffer,
 *   contentType: file.type,
 * })
 *
 * console.log('上传成功:', result.url)
 * ```
 */
export async function uploadToR2(options: UploadOptions): Promise<UploadResult> {
  if (!r2Client || !R2_BUCKET_NAME) {
    throw new Error('R2 未配置,请检查环境变量')
  }

  const { key, body, contentType, cacheControl = "public, max-age=31536000, immutable", metadata } = options

  try {
    // 上传文件
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    })

    await r2Client.send(command)

    // 构造公共 URL
    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}` // 回退到 r2.dev 域名

    return {
      key,
      url: publicUrl,
      size: body.length,
      contentType,
    }
  } catch (error) {
    console.error('R2 上传失败:', error)
    throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 删除 R2 中的文件
 *
 * @param key 文件 key
 * @example
 * ```typescript
 * await deleteFromR2('images/categories/old-icon.png')
 * ```
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2Client || !R2_BUCKET_NAME) {
    throw new Error('R2 未配置,请检查环境变量')
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('R2 删除失败:', error)
    throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 检查文件是否存在
 *
 * @param key 文件 key
 * @returns 是否存在
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  if (!r2Client || !R2_BUCKET_NAME) {
    return false
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
    return true
  } catch {
    return false
  }
}

/**
 * 从 R2 URL 提取 key
 *
 * @param url 完整的 R2 URL
 * @returns key 或 null
 *
 * @example
 * ```typescript
 * const key = extractKeyFromUrl('https://cdn.example.com/images/test.png')
 * // => 'images/test.png'
 * ```
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null

  try {
    const urlObj = new URL(url)
    // 移除开头的斜杠
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    return null
  }
}

/**
 * 生成唯一的文件名
 *
 * @param originalName 原始文件名
 * @returns 带时间戳的唯一文件名
 *
 * @example
 * ```typescript
 * const uniqueName = generateUniqueFileName('icon.png')
 * // => '1705234567890-icon.png'
 * ```
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50) // 限制长度

  return `${timestamp}-${randomStr}-${safeName}.${ext}`
}

/**
 * 验证文件类型
 *
 * @param contentType MIME 类型
 * @param allowedTypes 允许的类型列表
 * @returns 是否允许
 */
export function validateFileType(
  contentType: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): boolean {
  return allowedTypes.includes(contentType)
}

/**
 * 验证文件大小
 *
 * @param size 文件大小 (字节)
 * @param maxSize 最大大小 (字节)
 * @returns 是否允许
 */
export function validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize
}

/**
 * 格式化文件大小
 *
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 *
 * @example
 * ```typescript
 * formatFileSize(1024) // => '1 KB'
 * formatFileSize(1048576) // => '1 MB'
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
