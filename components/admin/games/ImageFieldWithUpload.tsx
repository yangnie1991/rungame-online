"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { removeWidthParameter } from '@/lib/gamepix-image-upload'

interface ImageFieldWithUploadProps {
  /**
   * 当前 URL 值（必需）
   */
  value: string

  /**
   * URL 变化回调（必需）
   */
  onChange: (url: string) => void

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 上传文件夹（R2）
   */
  folder?: string

  /**
   * 占位符
   */
  placeholder?: string

  /**
   * 字段标签（独立模式使用）
   */
  label?: string

  /**
   * 字段 ID（独立模式使用）
   */
  id?: string

  /**
   * 是否必填（独立模式使用）
   */
  required?: boolean

  /**
   * 错误信息（独立模式使用）
   */
  error?: string

  /**
   * 是否显示完整 UI（包含 Label 和 Error）
   *
   * @default true - 向后兼容，独立使用时显示完整 UI
   *
   * @example
   * // 独立使用（显示 Label 和 Error）
   * <ImageFieldWithUpload
   *   label="游戏缩略图"
   *   id="thumbnail"
   *   value={url}
   *   onChange={setUrl}
   *   showLabel={true}
   * />
   *
   * @example
   * // FormField 包装使用（不显示内部 Label 和 Error）
   * <FormField
   *   control={form.control}
   *   name="thumbnail"
   *   render={({ field }) => (
   *     <FormItem>
   *       <FormLabel>游戏缩略图</FormLabel>
   *       <FormControl>
   *         <ImageFieldWithUpload
   *           value={field.value}
   *           onChange={field.onChange}
   *           folder="games/thumbnails"
   *           showLabel={false}
   *         />
   *       </FormControl>
   *       <FormMessage />
   *     </FormItem>
   *   )}
   * />
   */
  showLabel?: boolean
}

/**
 * 图片字段组件（带上传功能）
 *
 * 功能：
 * - 显示图片预览
 * - 显示原始 GamePix URL
 * - 上传到 R2（自动去除 ?w= 参数）
 * - 清除已上传的图片
 */
export function ImageFieldWithUpload({
  value,
  onChange,
  disabled = false,
  folder = 'games/images',
  placeholder = 'https://example.com/image.jpg',
  label,
  id,
  required = false,
  error,
  showLabel = true
}: ImageFieldWithUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 判断是否已上传到 R2（URL 包含 R2 域名）
  const isR2Url = value && (value.includes('r2.dev') || value.includes('cloudflare'))

  // 判断是否是 GamePix URL
  const isGamePixUrl = value && value.includes('gamepix.com')

  // 上传图片到 R2
  const handleUpload = async () => {
    if (!value || isUploading) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // 去除 ?w= 参数
      const cleanUrl = removeWidthParameter(value)

      console.log('[ImageFieldWithUpload] 开始上传:', cleanUrl)

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
        console.log('[ImageFieldWithUpload] ✓ 上传成功:', result.data.url)
        onChange(result.data.url)
      } else {
        throw new Error('上传响应格式错误')
      }
    } catch (error: any) {
      console.error('[ImageFieldWithUpload] 上传失败:', error)
      setUploadError(error.message || '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  // 清除图片
  const handleClear = () => {
    onChange('')
    setUploadError(null)
  }

  // 复制 URL
  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  return (
    <div className="space-y-3">
      {/* 标签（独立模式） */}
      {showLabel && label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {value && (
            <div className="flex items-center gap-2">
              {isR2Url && (
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  已上传到 R2
                </Badge>
              )}
              {isGamePixUrl && !isR2Url && (
                <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                  GamePix 原图
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* 输入框 + 操作按钮 */}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(error && "border-destructive")}
        />

        {/* 复制按钮 */}
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={disabled}
            className="shrink-0"
            title="复制 URL"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}

        {/* 打开链接按钮 */}
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.open(value, '_blank')}
            disabled={disabled}
            className="shrink-0"
            title="在新标签页打开"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}

        {/* 上传按钮 */}
        {value && !isR2Url && (
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={handleUpload}
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
                上传到 R2
              </>
            )}
          </Button>
        )}

        {/* 清除按钮 */}
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0 text-destructive hover:bg-destructive/10"
            title="清除图片"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 图片预览 */}
      {value && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
          <Image
            src={removeWidthParameter(value)}
            alt={label || '图片预览'}
            fill
            className="object-contain"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* 错误信息（独立模式） */}
      {showLabel && (error || uploadError) && (
        <p className="text-sm text-destructive">
          {error || uploadError}
        </p>
      )}

      {/* 提示信息 */}
      {value && isGamePixUrl && !isR2Url && !isUploading && (
        <p className="text-xs text-muted-foreground">
          💡 检测到 GamePix 图片，建议上传到 R2 以提升加载速度
        </p>
      )}
    </div>
  )
}
