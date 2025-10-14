"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { createTag, updateTag, type TagFormData } from "@/app/(admin)/admin/tags/actions"
import type { Tag, TagTranslation } from "@prisma/client"
import { useEnabledLanguages } from "@/hooks/useEnabledLanguages"
import { Loader2 } from "lucide-react"

const tagSchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  translations: z.array(
    z.object({
      locale: z.string(),
      name: z.string().min(1, "名称不能为空"),
    })
  ).min(1, "至少需要一个翻译")
})

interface TagFormProps {
  tag?: Tag & { translations: TagTranslation[] }
  mode: "create" | "edit"
}

export function TagForm({ tag, mode }: TagFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { languages, isLoading: isLoadingLanguages } = useEnabledLanguages()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      slug: "",
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
      const initialData = tag ? {
        slug: tag.slug,
        translations: languages.map(locale => {
          const translation = tag.translations.find(t => t.locale === locale.code)
          return {
            locale: locale.code,
            name: translation?.name || "",
          }
        })
      } : {
        slug: "",
        translations: languages.map(locale => ({
          locale: locale.code,
          name: "",
        }))
      }

      reset(initialData)
    }
  }, [isLoadingLanguages, languages, tag, reset])

  async function onSubmit(data: TagFormData) {
    setIsSubmitting(true)
    try {
      const result = mode === "create"
        ? await createTag(data)
        : await updateTag(tag!.id, data)

      if (result.success) {
        toast.success(
          mode === "create" ? "创建成功" : "更新成功",
          { description: `标签已${mode === "create" ? "创建" : "更新"}` }
        )
        router.push("/admin/tags")
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
          <CardDescription className="text-gray-600">设置标签的基本属性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="space-y-2">
            <Label htmlFor="slug">
              标识符 (Slug) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="multiplayer"
              className={errors.slug ? "border-red-500" : ""}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              只能使用小写字母、数字和连字符，用于 URL
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">多语言翻译</CardTitle>
          <CardDescription className="text-gray-600">
            为不同语言设置标签内容（当前已启用 {languages.length} 种语言）
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
                      placeholder={`标签名称（${currentLanguage.label}）`}
                      className={errors.translations?.[index]?.name ? "border-red-500" : ""}
                    />
                    {errors.translations?.[index]?.name && (
                      <p className="text-sm text-red-500">
                        {errors.translations[index]?.name?.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      标签仅需要名称，不需要描述信息
                    </p>
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
            : (mode === "create" ? "创建标签" : "更新标签")
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
