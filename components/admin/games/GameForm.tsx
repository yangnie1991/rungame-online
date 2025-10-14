'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createGame, updateGame, type GameFormData, getCategories, getTags } from '@/app/(admin)/admin/games/actions'
import { useEnabledLanguages } from '@/hooks/useEnabledLanguages'
import Image from 'next/image'

const gameSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  thumbnail: z.string().min(1).url(),
  banner: z.string().url().optional(),
  embedUrl: z.string().min(1).url(),
  gameUrl: z.string().min(1).url(),
  width: z.coerce.number().int().min(100).default(800),
  height: z.coerce.number().int().min(100).default(600),
  categoryId: z.string().min(1),
  tagIds: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  translations: z.array(
    z.object({
      locale: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      longDescription: z.string().optional(),
      instructions: z.string().optional(),
      keywords: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
  ).min(1),
})

type GameFormValues = z.infer<typeof gameSchema>

type Category = { id: string; name: string }
type Tag = { id: string; name: string }

interface GameFormProps {
  initialData?: Partial<GameFormValues> & { id?: string }
  isEdit?: boolean
}

export function GameForm({ initialData, isEdit = false }: GameFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || [])
  const [loadingData, setLoadingData] = useState(true)
  const { languages, isLoading: isLoadingLanguages } = useEnabledLanguages()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      slug: '',
      thumbnail: '',
      banner: '',
      embedUrl: '',
      gameUrl: '',
      width: 800,
      height: 600,
      categoryId: '',
      tagIds: [],
      isFeatured: false,
      isPublished: false,
      translations: [],
    },
  })

  const { fields } = useFieldArray({
    control,
    name: 'translations',
  })

  const thumbnailUrl = watch('thumbnail')
  const bannerUrl = watch('banner')

  // Load categories and tags
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesResult, tagsResult] = await Promise.all([
          getCategories(),
          getTags(),
        ])

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        }

        if (tagsResult.success && tagsResult.data) {
          setTags(tagsResult.data)
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        toast.error('加载分类和标签失败')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Initialize form data when languages load
  useEffect(() => {
    if (!isLoadingLanguages && languages.length > 0) {
      const formData = initialData ? {
        ...initialData,
        translations: languages.map(locale => {
          const translation = initialData.translations?.find((t: { locale: string }) => t.locale === locale.code)
          return {
            locale: locale.code,
            title: translation?.title || '',
            description: translation?.description || '',
            longDescription: translation?.longDescription || '',
            instructions: translation?.instructions || '',
            keywords: translation?.keywords || '',
            metaTitle: translation?.metaTitle || '',
            metaDescription: translation?.metaDescription || '',
          }
        })
      } : {
        slug: '',
        thumbnail: '',
        banner: '',
        embedUrl: '',
        gameUrl: '',
        width: 800,
        height: 600,
        categoryId: '',
        tagIds: [],
        isFeatured: false,
        isPublished: false,
        translations: languages.map(locale => ({
          locale: locale.code,
          title: '',
          description: '',
          longDescription: '',
          instructions: '',
          keywords: '',
          metaTitle: '',
          metaDescription: '',
        })),
      }

      reset(formData)
    }
  }, [isLoadingLanguages, languages, initialData, reset])

  // Update form when selectedTags changes
  useEffect(() => {
    setValue('tagIds', selectedTags)
  }, [selectedTags, setValue])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const onSubmit = async (data: GameFormValues) => {
    setIsSubmitting(true)

    try {
      const result = isEdit && initialData?.id
        ? await updateGame(initialData.id, data)
        : await createGame(data)

      if (result.success) {
        toast.success(isEdit ? '游戏更新成功' : '游戏创建成功')
        router.push('/admin/games')
        router.refresh()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.error('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingData || isLoadingLanguages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">
          {loadingData ? '加载数据中...' : '加载语言列表...'}
        </span>
      </div>
    )
  }

  if (languages.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">未找到已启用的语言</CardTitle>
          <CardDescription className="text-orange-700">
            请先在语言管理中启用至少一种语言
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>设置游戏的基础配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">
                游戏Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="my-awesome-game"
                className={errors.slug ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                URL友好的唯一标识符（小写字母、数字、连字符）
              </p>
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                分类 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">
                游戏宽度(px) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="width"
                type="number"
                {...register('width')}
                placeholder="800"
                className={errors.width ? 'border-red-500' : ''}
              />
              {errors.width && (
                <p className="text-xs text-red-500">{errors.width.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">
                游戏高度(px) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="height"
                type="number"
                {...register('height')}
                placeholder="600"
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && (
                <p className="text-xs text-red-500">{errors.height.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图片和URL */}
      <Card>
        <CardHeader>
          <CardTitle>图片和链接</CardTitle>
          <CardDescription>配置游戏的图片资源和访问链接</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thumbnail">
              缩略图URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="thumbnail"
              {...register('thumbnail')}
              placeholder="https://example.com/thumbnail.jpg"
              className={errors.thumbnail ? 'border-red-500' : ''}
            />
            {thumbnailUrl && (
              <div className="relative w-32 h-32 rounded border overflow-hidden">
                <Image
                  src={thumbnailUrl}
                  alt="缩略图预览"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}
            {errors.thumbnail && (
              <p className="text-xs text-red-500">{errors.thumbnail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">横幅图URL（可选）</Label>
            <Input
              id="banner"
              {...register('banner')}
              placeholder="https://example.com/banner.jpg"
              className={errors.banner ? 'border-red-500' : ''}
            />
            {bannerUrl && (
              <div className="relative w-full h-48 rounded border overflow-hidden">
                <Image
                  src={bannerUrl}
                  alt="横幅图预览"
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            )}
            {errors.banner && (
              <p className="text-xs text-red-500">{errors.banner.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="embedUrl">
              嵌入URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="embedUrl"
              {...register('embedUrl')}
              placeholder="https://example.com/game-embed"
              className={errors.embedUrl ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              用于在网站中嵌入游戏的URL
            </p>
            {errors.embedUrl && (
              <p className="text-xs text-red-500">{errors.embedUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameUrl">
              游戏源URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gameUrl"
              {...register('gameUrl')}
              placeholder="https://example.com/game-source"
              className={errors.gameUrl ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              游戏的原始托管地址
            </p>
            {errors.gameUrl && (
              <p className="text-xs text-red-500">{errors.gameUrl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 标签选择 */}
      <Card>
        <CardHeader>
          <CardTitle>游戏标签</CardTitle>
          <CardDescription>选择适合该游戏的标签</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
                {selectedTags.includes(tag.id) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
          {selectedTags.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              点击标签来选择，可以选择多个标签
            </p>
          )}
        </CardContent>
      </Card>

      {/* 多语言翻译 */}
      <Card>
        <CardHeader>
          <CardTitle>多语言内容</CardTitle>
          <CardDescription>
            为不同语言提供游戏内容和SEO信息（当前已启用 {languages.length} 种语言）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={languages[0]?.code} className="w-full">
            <TabsList className={`grid w-full grid-cols-${Math.min(languages.length, 4)}`}>
              {languages.map((locale) => (
                <TabsTrigger key={locale.code} value={locale.code}>
                  {locale.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {fields.map((field, index) => {
              const currentLanguage = languages[index]
              if (!currentLanguage) return null

              return (
              <TabsContent key={field.id} value={currentLanguage.code} className="space-y-4">
                <input type="hidden" {...register(`translations.${index}.locale`)} />

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.title`}>
                    游戏标题 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`translations.${index}.title`}
                    {...register(`translations.${index}.title`)}
                    placeholder={`游戏标题（${currentLanguage.label}）`}
                  />
                  {errors.translations?.[index]?.title && (
                    <p className="text-xs text-red-500">
                      {errors.translations[index]?.title?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.description`}>
                    简短描述
                  </Label>
                  <Textarea
                    id={`translations.${index}.description`}
                    {...register(`translations.${index}.description`)}
                    placeholder={`游戏简短描述（${currentLanguage.label}）`}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.longDescription`}>
                    详细描述
                  </Label>
                  <Textarea
                    id={`translations.${index}.longDescription`}
                    {...register(`translations.${index}.longDescription`)}
                    placeholder={`游戏详细描述（${currentLanguage.label}）`}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.instructions`}>
                    游戏说明
                  </Label>
                  <Textarea
                    id={`translations.${index}.instructions`}
                    {...register(`translations.${index}.instructions`)}
                    placeholder={`游戏玩法说明（${currentLanguage.label}）`}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`translations.${index}.keywords`}>
                      关键词
                    </Label>
                    <Input
                      id={`translations.${index}.keywords`}
                      {...register(`translations.${index}.keywords`)}
                      placeholder="关键词1, 关键词2, 关键词3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`translations.${index}.metaTitle`}>
                      SEO标题
                    </Label>
                    <Input
                      id={`translations.${index}.metaTitle`}
                      {...register(`translations.${index}.metaTitle`)}
                      placeholder="SEO优化标题"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.metaDescription`}>
                    SEO描述
                  </Label>
                  <Textarea
                    id={`translations.${index}.metaDescription`}
                    {...register(`translations.${index}.metaDescription`)}
                    placeholder="SEO优化描述"
                    rows={2}
                  />
                </div>
              </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* 发布设置 */}
      <Card>
        <CardHeader>
          <CardTitle>发布设置</CardTitle>
          <CardDescription>控制游戏的显示状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">发布游戏</Label>
              <p className="text-sm text-muted-foreground">
                启用后游戏将在网站上公开显示
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={watch('isPublished')}
              onCheckedChange={(checked) => setValue('isPublished', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isFeatured">精选游戏</Label>
              <p className="text-sm text-muted-foreground">
                标记为精选后将在首页展示
              </p>
            </div>
            <Switch
              id="isFeatured"
              checked={watch('isFeatured')}
              onCheckedChange={(checked) => setValue('isFeatured', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? '更新游戏' : '创建游戏'}
        </Button>
      </div>
    </form>
  )
}
