"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, Check, X, RefreshCw, ExternalLink, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImageUploadItem {
  /**
   * 图片类型
   */
  type: 'thumbnail' | 'banner' | 'screenshot'

  /**
   * 原始 GamePix URL
   */
  originalUrl: string

  /**
   * 上传状态
   */
  status: 'pending' | 'uploading' | 'success' | 'error'

  /**
   * R2 URL（上传成功后）
   */
  r2Url?: string

  /**
   * 错误信息
   */
  error?: string

  /**
   * 图片哈希值
   */
  hash?: string

  /**
   * 是否是新上传（false 表示使用了已有图片）
   */
  isNewUpload?: boolean

  /**
   * 文件大小（字节）
   */
  size?: number
}

interface ImageUploadListProps {
  /**
   * 图片列表
   */
  images: ImageUploadItem[]

  /**
   * 重新上传单张图片
   */
  onRetry?: (index: number) => void

  /**
   * 显示模式
   */
  mode?: 'compact' | 'detailed'
}

/**
 * 图片上传列表组件
 *
 * 显示图片的上传状态，包括：
 * - 图片预览
 * - 原始 URL
 * - 上传状态
 * - R2 URL
 */
export function ImageUploadList({
  images,
  onRetry,
  mode = 'detailed'
}: ImageUploadListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // 复制 URL 到剪贴板
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 格式化文件大小
  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // 获取类型标签
  const getTypeLabel = (type: ImageUploadItem['type']) => {
    const labels = {
      thumbnail: '缩略图',
      banner: '横幅图',
      screenshot: '游戏截图'
    }
    return labels[type]
  }

  // 获取状态徽章
  const getStatusBadge = (item: ImageUploadItem) => {
    switch (item.status) {
      case 'pending':
        return <Badge variant="outline" className="text-gray-500">等待上传</Badge>
      case 'uploading':
        return (
          <Badge variant="outline" className="text-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            上传中
          </Badge>
        )
      case 'success':
        return (
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            {item.isNewUpload ? '已上传' : '已存在（跳过）'}
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
            <X className="h-3 w-3 mr-1" />
            上传失败
          </Badge>
        )
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无图片
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {images.map((item, index) => (
        <Card key={index} className={cn(
          "p-4 transition-colors",
          item.status === 'error' && "border-red-200 bg-red-50/50"
        )}>
          <div className="flex gap-4">
            {/* 图片预览 */}
            <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-muted">
              <Image
                src={item.originalUrl}
                alt={getTypeLabel(item.type)}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png'
                }}
              />

              {/* 状态覆盖层 */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}

              {item.status === 'success' && (
                <div className="absolute top-1 right-1">
                  <div className="bg-green-500 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              {item.status === 'error' && (
                <div className="absolute top-1 right-1">
                  <div className="bg-red-500 rounded-full p-1">
                    <X className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* 信息区域 */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* 标题行 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{getTypeLabel(item.type)}</span>
                  {getStatusBadge(item)}
                  {item.size && (
                    <span className="text-xs text-muted-foreground">
                      {formatSize(item.size)}
                    </span>
                  )}
                </div>

                {/* 操作按钮 */}
                {item.status === 'error' && onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(index)}
                    className="h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    重试
                  </Button>
                )}
              </div>

              {/* 原始 URL */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">原始 URL:</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                    {item.originalUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(item.originalUrl, '_blank')}
                    title="在新标签页打开"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(item.originalUrl, index * 2)}
                    title="复制 URL"
                  >
                    {copiedIndex === index * 2 ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* R2 URL */}
              {item.r2Url && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">R2 CDN URL:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded truncate border border-green-200">
                      {item.r2Url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(item.r2Url, '_blank')}
                      title="在新标签页打开"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(item.r2Url!, index * 2 + 1)}
                      title="复制 URL"
                    >
                      {copiedIndex === index * 2 + 1 ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {item.error && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  ❌ {item.error}
                </div>
              )}

              {/* 额外信息 */}
              {mode === 'detailed' && item.hash && (
                <div className="text-xs text-muted-foreground">
                  哈希值: <code className="text-xs">{item.hash.substring(0, 16)}...</code>
                  {item.isNewUpload !== undefined && (
                    <span className="ml-2">
                      {item.isNewUpload ? '(新上传)' : '(已存在，跳过上传)'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * 图片上传进度摘要组件
 */
export function ImageUploadSummary({ images }: { images: ImageUploadItem[] }) {
  const total = images.length
  const pending = images.filter(i => i.status === 'pending').length
  const uploading = images.filter(i => i.status === 'uploading').length
  const success = images.filter(i => i.status === 'success').length
  const error = images.filter(i => i.status === 'error').length
  const newUploads = images.filter(i => i.isNewUpload === true).length
  const skipped = images.filter(i => i.isNewUpload === false).length

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">总计:</span>
        <span className="font-medium">{total}</span>
      </div>

      {uploading > 0 && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>上传中: {uploading}</span>
        </div>
      )}

      {success > 0 && (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-3 w-3" />
          <span>成功: {success}</span>
          {newUploads > 0 && <span className="text-xs text-muted-foreground">(新上传: {newUploads})</span>}
          {skipped > 0 && <span className="text-xs text-muted-foreground">(已存在: {skipped})</span>}
        </div>
      )}

      {error > 0 && (
        <div className="flex items-center gap-2 text-red-600">
          <X className="h-3 w-3" />
          <span>失败: {error}</span>
        </div>
      )}

      {pending > 0 && (
        <div className="flex items-center gap-2 text-gray-500">
          <span>等待: {pending}</span>
        </div>
      )}
    </div>
  )
}
