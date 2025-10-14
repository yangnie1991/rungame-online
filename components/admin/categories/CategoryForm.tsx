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
import { toast } from "sonner"
import { createCategory, updateCategory, type CategoryFormData } from "@/app/(admin)/admin/categories/actions"
import type { Category, CategoryTranslation } from "@prisma/client"
import { useEnabledLanguages } from "@/hooks/useEnabledLanguages"
import { Loader2 } from "lucide-react"

const categorySchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0, "排序值不能为负数").default(0),
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string().min(1, "名称不能为空"),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
  ).min(1, "至少需要一个翻译")
})

interface CategoryFormProps {
  category?: Category & { translations: CategoryTranslation[] }
  mode: "create" | "edit"
}

export function CategoryForm({ category, mode }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { languages, isLoading: isLoadingLanguages } = useEnabledLanguages()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      slug: "",
      icon: "",
      sortOrder: 0,
      translations: []
    }
  })

  const { fields } = useFieldArray({
    control,
    name: "translations"
  })

  // 当语言列表加载完成后，初始化表单数据
  useEffect(() => {
    if (!isLoadingLanguages && languages.length > 0) {
      const initialData = category ? {
        slug: category.slug,
        icon: category.icon || "",
        sortOrder: category.sortOrder,
        translations: languages.map(locale => {
          const translation = category.translations.find(t => t.locale === locale.code)
          return {
            locale: locale.code,
            name: translation?.name || "",
            description: translation?.description || "",
            metaTitle: translation?.metaTitle || "",
            metaDescription: translation?.metaDescription || "",
          }
        })
      } : {
        slug: "",
        icon: "",
        sortOrder: 0,
        translations: languages.map(locale => ({
          locale: locale.code,
          name: "",
          description: "",
          metaTitle: "",
          metaDescription: "",
        }))
      }

      reset(initialData)
    }
  }, [isLoadingLanguages, languages, category, reset])

  async function onSubmit(data: CategoryFormData) {
    setIsSubmitting(true)
    try {
      const result = mode === "create"
        ? await createCategory(data)
        : await updateCategory(category!.id, data)

      if (result.success) {
        toast.success(
          mode === "create" ? "创建成功" : "更新成功",
          { description: `分类已${mode === "create" ? "创建" : "更新"}` }
        )
        router.push("/admin/categories")
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
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">基本信息</CardTitle>
          <CardDescription className="text-gray-600">设置分类的基本属性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">
                标识符 (Slug) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="action-games"
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
              <Label htmlFor="icon">图标（可选）</Label>
              <Input
                id="icon"
                {...register("icon")}
                placeholder="🎮"
              />
              <p className="text-xs text-gray-500">
                可以使用 emoji 或图标名称
              </p>
            </div>
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
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">多语言翻译</CardTitle>
          <CardDescription className="text-gray-600">
            为不同语言设置分类内容（当前已启用 {languages.length} 种语言）
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
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
                    <Label htmlFor={`translations.${index}.name`}>
                      名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`translations.${index}.name`}
                      {...register(`translations.${index}.name`)}
                      placeholder={`分类名称（${currentLanguage.label}）`}
                      className={errors.translations?.[index]?.name ? "border-red-500" : ""}
                    />
                    {errors.translations?.[index]?.name && (
                      <p className="text-sm text-red-500">
                        {errors.translations[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`translations.${index}.description`}>描述</Label>
                    <Textarea
                      id={`translations.${index}.description`}
                      {...register(`translations.${index}.description`)}
                      placeholder={`分类描述（${currentLanguage.label}）`}
                      rows={3}
                    />
                  </div>

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
        <Button type="submit" disabled={isSubmitting} className="shadow-sm">
          {isSubmitting
            ? (mode === "create" ? "创建中..." : "更新中...")
            : (mode === "create" ? "创建分类" : "更新分类")
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
