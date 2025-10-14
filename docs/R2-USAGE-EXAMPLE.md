# R2 图片上传使用示例

本文档提供 Cloudflare R2 图片上传的前端和后端使用示例。

## 目录

- [API 端点](#api-端点)
- [前端使用示例](#前端使用示例)
- [Server Action 示例](#server-action-示例)
- [管理后台组件示例](#管理后台组件示例)
- [测试上传功能](#测试上传功能)

---

## API 端点

### POST /api/upload

**用途**: 上传图片到 R2

**权限**: 需要管理员身份验证

**请求格式**: `multipart/form-data`

**请求参数**:
- `file` (File, 必需) - 图片文件
- `type` (string, 可选) - 上传类型: `category` | `banner` | `avatar` | `misc`

**响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "url": "https://cdn.yourdomain.com/images/categories/1705234567890-abc123-icon.png",
    "key": "images/categories/1705234567890-abc123-icon.png",
    "size": 12345,
    "contentType": "image/png",
    "fileName": "1705234567890-abc123-icon.png",
    "originalName": "icon.png"
  }
}
```

### GET /api/upload

**用途**: 获取上传配置信息

**响应**:
```json
{
  "allowedTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
  "maxFileSize": 5242880,
  "maxFileSizeFormatted": "5 MB",
  "uploadTypes": ["category", "banner", "avatar", "misc"]
}
```

---

## 前端使用示例

### 1. 基础上传组件

```typescript
// components/admin/ImageUploader.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ImageUploaderProps {
  uploadType?: "category" | "banner" | "avatar" | "misc"
  onUploadSuccess?: (url: string) => void
}

export function ImageUploader({ uploadType = "misc", onUploadSuccess }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // 验证文件类型
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!validTypes.includes(selectedFile.type)) {
        setError("不支持的文件类型,请选择 JPG、PNG、WebP 或 GIF")
        return
      }

      // 验证文件大小 (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("文件过大,最大允许 5MB")
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "上传失败")
      }

      setUploadedUrl(result.data.url)
      onUploadSuccess?.(result.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {file && (
        <div className="text-sm text-gray-600">
          已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "上传中..." : "上传图片"}
      </Button>

      {uploadedUrl && (
        <div className="space-y-2">
          <div className="text-sm text-green-600">
            上传成功!
          </div>
          <img
            src={uploadedUrl}
            alt="上传的图片"
            className="max-w-xs rounded border"
          />
          <div className="text-xs text-gray-500 break-all">
            {uploadedUrl}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. 带预览的上传组件

```typescript
// components/admin/ImageUploaderWithPreview.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ImageUploaderWithPreviewProps {
  currentImageUrl?: string
  uploadType?: "category" | "banner" | "avatar" | "misc"
  onUploadSuccess?: (url: string) => void
}

export function ImageUploaderWithPreview({
  currentImageUrl,
  uploadType = "misc",
  onUploadSuccess,
}: ImageUploaderWithPreviewProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setError("不支持的文件类型")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("文件过大,最大 5MB")
      return
    }

    // 本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 上传
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "上传失败")
      }

      onUploadSuccess?.(result.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败")
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {preview && (
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="预览"
              fill
              className="object-contain"
            />
          </div>
        )}

        <div>
          <label className="cursor-pointer">
            <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50">
              {uploading ? "上传中..." : preview ? "更换图片" : "选择图片"}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}
```

---

## Server Action 示例

如果您想在 Server Actions 中使用 R2 上传:

```typescript
// app/(admin)/admin/categories/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2-upload"

export async function uploadCategoryIcon(formData: FormData) {
  // 验证权限
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("权限不足")
  }

  const file = formData.get("file") as File
  if (!file) {
    throw new Error("请选择文件")
  }

  // 读取文件
  const buffer = Buffer.from(await file.arrayBuffer())

  // 上传到 R2
  const result = await uploadToR2({
    key: `images/categories/${Date.now()}-${file.name}`,
    body: buffer,
    contentType: file.type,
  })

  return result.url
}

export async function updateCategoryWithIcon(
  categoryId: string,
  data: { name: string; iconFile?: File }
) {
  const session = await auth()
  if (!session?.user) throw new Error("未授权")

  let iconUrl: string | undefined

  // 如果有图片,先上传
  if (data.iconFile) {
    const buffer = Buffer.from(await data.iconFile.arrayBuffer())
    const result = await uploadToR2({
      key: `images/categories/${Date.now()}-${data.iconFile.name}`,
      body: buffer,
      contentType: data.iconFile.type,
    })
    iconUrl = result.url
  }

  // 更新数据库
  await prisma.category.update({
    where: { id: categoryId },
    data: {
      // name: data.name,
      // iconUrl,  // 假设 Category 模型有 iconUrl 字段
    },
  })

  revalidatePath("/admin/categories")
}
```

---

## 管理后台组件示例

### 在分类表单中集成图片上传

```typescript
// components/admin/CategoryForm.tsx
"use client"

import { useState } from "react"
import { ImageUploaderWithPreview } from "./ImageUploaderWithPreview"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function CategoryForm() {
  const [iconUrl, setIconUrl] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = {
      name: "新分类",
      iconUrl, // R2 上传后的 URL
    }

    // 提交到后端...
    console.log("提交数据:", formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label>分类名称</label>
        <Input placeholder="输入分类名称" />
      </div>

      <div>
        <label>分类图标</label>
        <ImageUploaderWithPreview
          uploadType="category"
          currentImageUrl={iconUrl}
          onUploadSuccess={(url) => setIconUrl(url)}
        />
      </div>

      <Button type="submit">保存</Button>
    </form>
  )
}
```

---

## 测试上传功能

### 1. 使用 curl 测试 API

```bash
# 获取配置信息
curl http://localhost:3000/api/upload

# 上传图片 (需要先登录获取 cookie)
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/image.png" \
  -F "type=category"
```

### 2. 创建测试页面

创建 `app/(admin)/admin/test-upload/page.tsx`:

```typescript
"use client"

import { ImageUploader } from "@/components/admin/ImageUploader"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>测试 R2 图片上传</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            uploadType="misc"
            onUploadSuccess={(url) => {
              console.log("上传成功:", url)
              alert(`上传成功!\nURL: ${url}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

访问 `http://localhost:3000/admin/test-upload` 进行测试。

---

## 故障排查

### 问题 1: "R2 未配置" 错误

**原因**: 环境变量未设置

**解决方案**:
1. 确认 `.env` 文件包含所有 R2 配置
2. 重启开发服务器 `npm run dev`
3. 检查环境变量拼写

### 问题 2: "未授权" 错误

**原因**: 未登录或不是管理员

**解决方案**:
1. 访问 `/login` 登录管理员账户
2. 确认账户角色是 `ADMIN` 或 `SUPER_ADMIN`

### 问题 3: 上传成功但图片无法显示

**原因**: R2 Public Access 未启用

**解决方案**:
1. 进入 Cloudflare R2 Dashboard
2. 选择 bucket
3. Settings → Public Access → Allow Access

### 问题 4: CORS 错误

**原因**: 跨域配置问题

**解决方案**:
1. 确认 R2 bucket 配置了正确的 CORS 规则
2. 在 Cloudflare Dashboard 中设置:
   ```json
   {
     "AllowedOrigins": ["https://yourdomain.com"],
     "AllowedMethods": ["GET", "PUT"],
     "AllowedHeaders": ["*"]
   }
   ```

---

## 相关文档

- [R2 CDN 配置指南](./R2-CDN-SETUP.md)
- [环境变量配置](./ENVIRONMENT.md)
- [API 认证指南](./API-AUTHENTICATION-GUIDE.md)

---

**最后更新**: 2025-01-14
