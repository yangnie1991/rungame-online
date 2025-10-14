"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createPageType, updatePageType, type PageTypeFormData } from "@/app/(admin)/admin/page-types/actions"
import { useEnabledLanguages } from "@/hooks/useEnabledLanguages"
import type { PageType, PageTypeTranslation } from "@prisma/client"

const pageTypeSchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  type: z.enum(["GAME_LIST", "STATIC_CONTENT", "MIXED"], {
    required_error: "请选择页面类型"
  }),
  icon: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, "排序值不能为负数").default(0),
  translations: z.array(
    z.object({
      locale: z.string(),
      title: z.string().min(1, "标题不能为空"),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().url().optional().or(z.literal("")),
    })
  ).min(1, "至少需要一个翻译")
})

interface PageTypeFormProps {
  pageType?: PageType & { translations: PageTypeTranslation[] }
  mode: "create" | "edit"
}

export function PageTypeForm({ pageType, mode }: PageTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { languages, isLoading: isLoadingLanguages } = useEnabledLanguages()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<PageTypeFormData>({
    resolver: zodResolver(pageTypeSchema),
    defaultValues: {
      slug: "",
      type: "GAME_LIST",
      icon: "",
      isEnabled: true,
      sortOrder: 0,
      translations: []
    }
  })

  const { fields } = useFieldArray({
    control,
    name: "translations"
  })

  const selectedType = watch("type")

  // Initialize form data when languages load
  useEffect(() => {
    if (!isLoadingLanguages && languages.length > 0) {
      const formData = pageType ? {
        slug: pageType.slug,
        type: pageType.type as "GAME_LIST" | "STATIC_CONTENT" | "MIXED",
        icon: pageType.icon || "",
        isEnabled: pageType.isEnabled,
        sortOrder: pageType.sortOrder,
        translations: languages.map(locale => {
          const translation = pageType.translations.find(t => t.locale === locale.code)
          return {
            locale: locale.code,
            title: translation?.title || "",
            subtitle: translation?.subtitle || "",
            description: translation?.description || "",
            metaTitle: translation?.metaTitle || "",
            metaDescription: translation?.metaDescription || "",
            metaKeywords: translation?.metaKeywords || "",
            ogTitle: translation?.ogTitle || "",
            ogDescription: translation?.ogDescription || "",
            ogImage: translation?.ogImage || "",
          }
        })
      } : {
        slug: "",
        type: "GAME_LIST" as const,
        icon: "",
        isEnabled: true,
        sortOrder: 0,
        translations: languages.map(locale => ({
          locale: locale.code,
          title: "",
          subtitle: "",
          description: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
        }))
      }

      reset(formData)
    }
  }, [isLoadingLanguages, languages, pageType, reset])

  async function onSubmit(data: PageTypeFormData) {
    setIsSubmitting(true)
    try {
      const result = mode === "create"
        ? await createPageType(data)
        : await updatePageType(pageType!.id, data)

      if (result.success) {
        toast.success(
          mode === "create" ? "创建成功" : "更新成功",
          { description: `页面类型已${mode === "create" ? "创建" : "更新"}` }
        )
        router.push("/admin/page-types")
        router.refresh()
      } else {
        toast.error(
          mode === "create" ? "创建失败" : "更新失败",
          { description: result.error }
        )
      }
    } catch (error) {
      toast.error("操作失败", { description: "发生未知错误" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingLanguages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载语言列表...</span>
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
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>设置页面类型的基本属性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">
                标识符 (Slug) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="most-played"
                className={errors.slug ? "border-red-500" : ""}
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              <p className="text-xs text-gray-500">
                只能使用小写字母、数字和连字符，用于 URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                页面类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="选择页面类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAME_LIST">游戏列表</SelectItem>
                  <SelectItem value="STATIC_CONTENT">静态内容</SelectItem>
                  <SelectItem value="MIXED">混合类型</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">图标（可选）</Label>
              <Input
                id="icon"
                {...register("icon")}
                placeholder="📊"
              />
              <p className="text-xs text-gray-500">
                可以使用 emoji 或图标名称
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder")}
                className={errors.sortOrder ? "border-red-500" : ""}
              />
              {errors.sortOrder && (
                <p className="text-sm text-red-500">{errors.sortOrder.message}</p>
              )}
              <p className="text-xs text-gray-500">
                数字越小越靠前
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isEnabled">启用状态</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isEnabled"
                  checked={watch("isEnabled")}
                  onCheckedChange={(checked) => setValue("isEnabled", checked)}
                />
                <Label htmlFor="isEnabled" className="font-normal">
                  {watch("isEnabled") ? "已启用" : "已禁用"}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>多语言翻译</CardTitle>
          <CardDescription>为不同语言设置页面类型内容（当前已启用 {languages.length} 种语言）</CardDescription>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`translations.${index}.title`}>
                      标题 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`translations.${index}.title`}
                      {...register(`translations.${index}.title`)}
                      placeholder={`页面标题（${currentLanguage.label}）`}
                      className={errors.translations?.[index]?.title ? "border-red-500" : ""}
                    />
                    {errors.translations?.[index]?.title && (
                      <p className="text-sm text-red-500">
                        {errors.translations[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`translations.${index}.subtitle`}>副标题</Label>
                    <Input
                      id={`translations.${index}.subtitle`}
                      {...register(`translations.${index}.subtitle`)}
                      placeholder={`页面副标题（${currentLanguage.label}）`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.description`}>描述</Label>
                  <Textarea
                    id={`translations.${index}.description`}
                    {...register(`translations.${index}.description`)}
                    placeholder={`页面描述（${currentLanguage.label}）`}
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">SEO 设置</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.metaTitle`}>SEO 标题</Label>
                      <Input
                        id={`translations.${index}.metaTitle`}
                        {...register(`translations.${index}.metaTitle`)}
                        placeholder="用于搜索引擎显示的标题"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.metaDescription`}>SEO 描述</Label>
                      <Textarea
                        id={`translations.${index}.metaDescription`}
                        {...register(`translations.${index}.metaDescription`)}
                        placeholder="用于搜索引擎显示的描述"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.metaKeywords`}>SEO 关键词</Label>
                      <Input
                        id={`translations.${index}.metaKeywords`}
                        {...register(`translations.${index}.metaKeywords`)}
                        placeholder="关键词1, 关键词2, 关键词3"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Open Graph 设置</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.ogTitle`}>OG 标题</Label>
                      <Input
                        id={`translations.${index}.ogTitle`}
                        {...register(`translations.${index}.ogTitle`)}
                        placeholder="社交媒体分享标题"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.ogDescription`}>OG 描述</Label>
                      <Textarea
                        id={`translations.${index}.ogDescription`}
                        {...register(`translations.${index}.ogDescription`)}
                        placeholder="社交媒体分享描述"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`translations.${index}.ogImage`}>OG 图片 URL</Label>
                      <Input
                        id={`translations.${index}.ogImage`}
                        {...register(`translations.${index}.ogImage`)}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              )
            })}
          </Tabs>

          {errors.translations?.root && (
            <p className="text-sm text-red-500 mt-2">
              {errors.translations.root.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? (mode === "create" ? "创建中..." : "更新中...")
            : (mode === "create" ? "创建页面类型" : "更新页面类型")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
      </div>
    </form>
  )
}
