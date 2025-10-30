"use client"

import { useState } from "react"
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CategoryCascader, type CategoryOption } from "./CategoryCascader"
import { ImageUploader } from "@/components/admin/ImageUploader"

interface GameFormValues {
  slug: string
  categoryId: string
  width: number
  height: number
  thumbnail: string
  embedUrl: string
  banner?: string
  gameUrl?: string
  tagIds: string[]
  [key: string]: any
}

interface GameBasicInfoProps {
  register: UseFormRegister<GameFormValues>
  watch: UseFormWatch<GameFormValues>
  setValue: UseFormSetValue<GameFormValues>
  errors: FieldErrors<GameFormValues>
  categories: CategoryOption[]
  tags: Array<{ id: string; name: string }>
  mode?: 'create' | 'edit'  // 新建或编辑模式
  externalCategory?: string  // 外部分类名称（来自导入网站）
}

export function GameBasicInfo({
  register,
  watch,
  setValue,
  errors,
  categories,
  tags,
  mode = 'create',
  externalCategory
}: GameBasicInfoProps) {
  const [isMatchingTags, setIsMatchingTags] = useState(false)

  // AI 自动匹配标签
  const handleAutoMatchTags = async () => {
    const gameTitle = watch("translations.0.title") || watch("title")
    const gameDescription = watch("translations.0.description") || watch("description")
    const categoryId = watch("categoryId")

    if (!gameTitle) {
      toast.error("请先填写游戏标题")
      return
    }

    setIsMatchingTags(true)

    try {
      const response = await fetch('/api/ai/match-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle,
          gameDescription,
          categoryId,
          tags: tags.map(t => ({ id: t.id, name: t.name }))
        }),
      })

      if (!response.ok) {
        throw new Error('匹配失败')
      }

      const data = await response.json()

      if (data.tagIds && data.tagIds.length > 0) {
        setValue("tagIds", data.tagIds)
        const matchedTags = tags.filter(t => data.tagIds.includes(t.id))
        toast.success(`已匹配 ${matchedTags.length} 个标签：${matchedTags.map(t => t.name).join(', ')}`)
      } else {
        toast.error('未找到匹配的标签')
      }
    } catch (error: any) {
      console.error('AI 匹配标签失败:', error)
      toast.error(error.message || 'AI 匹配失败，请重试')
    } finally {
      setIsMatchingTags(false)
    }
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="text-gray-900">基本信息</CardTitle>
        <CardDescription className="text-gray-600">设置游戏的基本属性</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 bg-white">
        {/* 标识符 - 独占一行 */}
        <div className="space-y-2">
          <Label htmlFor="slug">
            标识符 (Slug) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="my-awesome-game"
            className={errors.slug ? "border-red-500" : ""}
          />
          {errors.slug && (
            <p className="text-sm text-red-500">{errors.slug.message as string}</p>
          )}
          <p className="text-xs text-gray-500">
            只能使用小写字母、数字和连字符，用于 URL
          </p>
        </div>

        {/* 分类 - 只能选择子分类 */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">
            分类 <span className="text-red-500">*</span>
          </Label>
          <CategoryCascader
            categories={categories}
            value={watch("categoryId")}
            onChange={(categoryId) => setValue("categoryId", categoryId)}
            placeholder="选择分类"
            error={!!errors.categoryId}
          />
          {errors.categoryId && (
            <p className="text-sm text-red-500">{errors.categoryId.message as string}</p>
          )}
          <p className="text-xs text-gray-500">
            请选择具体的子分类（如"射击"、"解谜"等）
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">宽度 (px)</Label>
            <Input
              id="width"
              type="number"
              {...register("width")}
              className={errors.width ? "border-red-500" : ""}
            />
            {errors.width && (
              <p className="text-sm text-red-500">{errors.width.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">高度 (px)</Label>
            <Input
              id="height"
              type="number"
              {...register("height")}
              className={errors.height ? "border-red-500" : ""}
            />
            {errors.height && (
              <p className="text-sm text-red-500">{errors.height.message as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <ImageUploader
            value={watch('thumbnail')}
            onChange={(url) => setValue('thumbnail', url)}
            uploadType="misc"
            label="游戏缩略图"
            description="上传游戏缩略图或粘贴 URL"
            maxSize={5 * 1024 * 1024}
            accept={['image/png', 'image/jpeg', 'image/webp']}
            required
          />
          {errors.thumbnail && (
            <p className="text-sm text-red-500">{errors.thumbnail.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="embedUrl">
            嵌入 URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="embedUrl"
            {...register("embedUrl")}
            placeholder="https://example.com/game/embed"
            className={errors.embedUrl ? "border-red-500" : ""}
          />
          {errors.embedUrl && (
            <p className="text-sm text-red-500">{errors.embedUrl.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <ImageUploader
            value={watch('banner')}
            onChange={(url) => setValue('banner', url)}
            uploadType="banner"
            label="游戏横幅"
            description="上传游戏横幅图或粘贴 URL（可选）"
            maxSize={5 * 1024 * 1024}
            accept={['image/png', 'image/jpeg', 'image/webp']}
          />
          {errors.banner && (
            <p className="text-sm text-red-500">{errors.banner.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gameUrl">游戏源 URL</Label>
          <Input
            id="gameUrl"
            {...register("gameUrl")}
            placeholder="https://example.com/game"
            className={errors.gameUrl ? "border-red-500" : ""}
          />
          {errors.gameUrl && (
            <p className="text-sm text-red-500">{errors.gameUrl.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>游戏标签</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoMatchTags}
              disabled={isMatchingTags}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {isMatchingTags ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  匹配中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI 自动匹配标签
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[100px]">
            {watch("tagIds")?.map((tagId) => {
              const tag = tags.find(t => t.id === tagId)
              return tag ? (
                <div
                  key={tagId}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  <span>{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = watch("tagIds") || []
                      setValue("tagIds", current.filter(id => id !== tagId))
                    }}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null
            })}
          </div>
          <Select
            value=""
            onValueChange={(value) => {
              const current = watch("tagIds") || []
              if (!current.includes(value)) {
                setValue("tagIds", [...current, value])
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="添加标签" />
            </SelectTrigger>
            <SelectContent>
              {tags
                .filter(tag => !watch("tagIds")?.includes(tag.id))
                .map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
