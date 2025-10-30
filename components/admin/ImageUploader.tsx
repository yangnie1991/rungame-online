"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  uploadType?: 'category' | 'banner' | 'avatar' | 'misc'
  label?: string
  description?: string
  maxSize?: number
  accept?: string[]
  disabled?: boolean
  required?: boolean
}

export function ImageUploader({
  value,
  onChange,
  uploadType = 'misc',
  label = '图片',
  description,
  maxSize = 5 * 1024 * 1024,
  accept = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  disabled = false,
  required = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!accept.includes(file.type)) {
      toast.error('不支持的文件类型', {
        description: `仅支持: ${accept.join(', ')}`
      })
      return
    }

    if (file.size > maxSize) {
      toast.error('文件过大', {
        description: `最大允许 ${(maxSize / 1024 / 1024).toFixed(1)} MB`
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', uploadType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onChange(result.data.url)
        setUrlInput(result.data.url)
        toast.success('上传成功', {
          description: `文件已上传到 R2 存储`
        })
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传错误:', error)
      toast.error('上传失败', {
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput && urlInput !== value) {
      onChange(urlInput)
      toast.success('URL 已更新')
    }
  }

  const handleRemove = () => {
    onChange('')
    setUrlInput('')
    toast.success('已清除图片')
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* 图片预览 */}
      {value && (
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
          <Image
            src={value}
            alt="预览"
            fill
            className="object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 文件选择按钮 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              上传中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              选择文件上传
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* URL 手动输入 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="或直接粘贴图片 URL"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUrlSubmit}
            disabled={disabled || !urlInput || urlInput === value}
          >
            应用
          </Button>
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}
