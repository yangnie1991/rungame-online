"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, Upload, Trash2, ExternalLink, Copy, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { removeWidthParameter } from '@/lib/gamepix-image-upload'

interface ScreenshotsFieldWithUploadProps {
  /**
   * 截图 URL 数组
   */
  screenshots: string[]

  /**
   * 截图数组变化回调
   */
  onChange: (screenshots: string[]) => void

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 上传文件夹（R2）
   */
  folder?: string

  /**
   * 字段标签（仅在独立模式下使用）
   */
  label?: string

  /**
   * 显示完整 UI（包括 Label）
   * @default true - 向后兼容
   * 当 FormField 包装时设为 false，避免重复 label
   */
  showLabel?: boolean
}

/**
 * 截图字段组件（带上传功能）
 *
 * 功能：
 * - 显示截图列表
 * - 每个截图独立上传/删除
 * - 添加新截图
 */
export function ScreenshotsFieldWithUpload({
  screenshots,
  onChange,
  disabled = false,
  folder = 'games/screenshots',
  label,
  showLabel = true
}: ScreenshotsFieldWithUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Map<number, string>>(new Map())
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // 添加新截图
  const handleAdd = () => {
    onChange([...screenshots, ''])
  }

  // 删除截图
  const handleRemove = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index)
    onChange(newScreenshots)

    // 清除该截图的错误信息
    const newErrors = new Map(uploadErrors)
    newErrors.delete(index)
    setUploadErrors(newErrors)
  }

  // 更新截图 URL
  const handleUrlChange = (index: number, url: string) => {
    const newScreenshots = [...screenshots]
    newScreenshots[index] = url
    onChange(newScreenshots)
  }

  // 上传截图到 R2
  const handleUpload = async (index: number) => {
    const url = screenshots[index]
    if (!url || uploadingIndex !== null) return

    setUploadingIndex(index)

    // 清除之前的错误
    const newErrors = new Map(uploadErrors)
    newErrors.delete(index)
    setUploadErrors(newErrors)

    try {
      // 去除 ?w= 参数
      const cleanUrl = removeWidthParameter(url)

      console.log(`[ScreenshotsField] 开始上传截图 ${index + 1}:`, cleanUrl)

      const response = await fetch('/api/admin/upload-gamepix-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: cleanUrl,
          folder
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '上传失败')
      }

      const result = await response.json()

      if (result.success && result.data.url) {
        console.log(`[ScreenshotsField] ✓ 截图 ${index + 1} 上传成功:`, result.data.url)
        handleUrlChange(index, result.data.url)
      } else {
        throw new Error('上传响应格式错误')
      }
    } catch (error: any) {
      console.error(`[ScreenshotsField] 截图 ${index + 1} 上传失败:`, error)
      const newErrors = new Map(uploadErrors)
      newErrors.set(index, error.message || '上传失败')
      setUploadErrors(newErrors)
    } finally {
      setUploadingIndex(null)
    }
  }

  // 复制 URL
  const handleCopy = async (index: number, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 判断是否已上传到 R2
  const isR2Url = (url: string) => url && (url.includes('r2.dev') || url.includes('cloudflare'))

  // 判断是否是 GamePix URL
  const isGamePixUrl = (url: string) => url && url.includes('gamepix.com')

  return (
    <div className="space-y-3">
      {/* 标题栏 - 仅在独立模式下显示 */}
      {showLabel && label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加截图
          </Button>
        </div>
      )}

      {/* 当不显示 label 时，添加按钮独立显示 */}
      {!showLabel && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加截图
          </Button>
        </div>
      )}

      {/* 截图列表 */}
      {screenshots.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
          暂无截图，点击"添加截图"按钮添加
        </p>
      ) : (
        <div className="space-y-3">
          {screenshots.map((url, index) => {
            const isUploading = uploadingIndex === index
            const hasError = uploadErrors.has(index)
            const error = uploadErrors.get(index)

            return (
              <Card key={index} className={cn(
                "p-4 transition-colors",
                hasError && "border-red-200 bg-red-50/50"
              )}>
                <div className="space-y-3">
                  {/* 标题行 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">截图 {index + 1}</span>
                      {url && isR2Url(url) && (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          已上传到 R2
                        </Badge>
                      )}
                      {url && isGamePixUrl(url) && !isR2Url(url) && (
                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                          GamePix 原图
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 输入框 + 操作按钮 */}
                  <div className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder={`截图 ${index + 1} URL`}
                      disabled={disabled || isUploading}
                      className={cn(hasError && "border-destructive")}
                    />

                    {/* 复制按钮 */}
                    {url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(index, url)}
                        disabled={disabled}
                        className="shrink-0"
                        title="复制 URL"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* 打开链接按钮 */}
                    {url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(url, '_blank')}
                        disabled={disabled}
                        className="shrink-0"
                        title="在新标签页打开"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}

                    {/* 上传按钮 */}
                    {url && !isR2Url(url) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => handleUpload(index)}
                        disabled={isUploading || disabled}
                        className="shrink-0"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            上传中
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            上传
                          </>
                        )}
                      </Button>
                    )}

                    {/* 删除按钮 */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                      className="shrink-0 text-destructive hover:bg-destructive/10"
                      title="删除截图"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 图片预览 */}
                  {url && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
                      <Image
                        src={removeWidthParameter(url)}
                        alt={`截图 ${index + 1}`}
                        fill
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 错误信息 */}
                  {error && (
                    <p className="text-sm text-destructive">
                      ❌ {error}
                    </p>
                  )}

                  {/* 提示信息 */}
                  {url && isGamePixUrl(url) && !isR2Url(url) && !isUploading && (
                    <p className="text-xs text-muted-foreground">
                      💡 检测到 GamePix 图片，建议上传到 R2 以提升加载速度
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
