"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createLanguage, updateLanguage, type LanguageFormData } from "@/app/(admin)/admin/languages/actions"
import type { Language } from "@prisma/client"

const languageSchema = z.object({
  code: z.string().min(2, "语言代码不能为空").max(10, "语言代码过长"),
  name: z.string().min(1, "名称不能为空"),
  nativeName: z.string().min(1, "本地名称不能为空"),
  flag: z.string().optional(),
  localeCode: z.string().min(1, "区域代码不能为空"),
  isDefault: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, "排序值不能为负数").default(0),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
})

interface LanguageFormProps {
  language?: Language
  mode: "create" | "edit"
}

export function LanguageForm({ language, mode }: LanguageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: language ? {
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      flag: language.flag || "",
      localeCode: language.localeCode,
      isDefault: language.isDefault,
      isEnabled: language.isEnabled,
      sortOrder: language.sortOrder,
      direction: language.direction as "ltr" | "rtl",
    } : {
      code: "",
      name: "",
      nativeName: "",
      flag: "",
      localeCode: "",
      isDefault: false,
      isEnabled: true,
      sortOrder: 0,
      direction: "ltr",
    }
  })

  async function onSubmit(data: LanguageFormData) {
    setIsSubmitting(true)
    try {
      const result = mode === "create" ? await createLanguage(data) : await updateLanguage(language!.id, data)
      if (result.success) {
        toast.success(mode === "create" ? "创建成功" : "更新成功", { description: `语言已${mode === "create" ? "创建" : "更新"}` })
        router.push("/admin/languages")
        router.refresh()
      } else {
        toast.error(mode === "create" ? "创建失败" : "更新失败", { description: result.error })
      }
    } catch (error) {
      toast.error("操作失败", { description: "请稍后重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>配置语言的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                语言代码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="en, zh, es, fr"
                className={errors.code ? "border-red-500" : ""}
                disabled={mode === "edit"}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
              <p className="text-xs text-gray-500">ISO 639-1 语言代码</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localeCode">
                区域代码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="localeCode"
                {...register("localeCode")}
                placeholder="en-US, zh-CN, es-ES"
                className={errors.localeCode ? "border-red-500" : ""}
              />
              {errors.localeCode && (
                <p className="text-sm text-red-500">{errors.localeCode.message}</p>
              )}
              <p className="text-xs text-gray-500">完整的语言区域代码</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="English, 中文, Español"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nativeName">
                本地名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nativeName"
                {...register("nativeName")}
                placeholder="English, 中文, Español"
                className={errors.nativeName ? "border-red-500" : ""}
              />
              {errors.nativeName && (
                <p className="text-sm text-red-500">{errors.nativeName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flag">旗帜 Emoji</Label>
              <Input
                id="flag"
                {...register("flag")}
                placeholder="🇬🇧 🇨🇳 🇪🇸 🇫🇷"
                className={errors.flag ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-500">可选，用于显示国旗</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序顺序</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder")}
                placeholder="0"
                className={errors.sortOrder ? "border-red-500" : ""}
              />
              {errors.sortOrder && (
                <p className="text-sm text-red-500">{errors.sortOrder.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置选项卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>配置选项</CardTitle>
          <CardDescription>设置语言的显示和行为选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direction">文字方向</Label>
            <select
              id="direction"
              {...register("direction")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="ltr">从左到右 (LTR)</option>
              <option value="rtl">从右到左 (RTL)</option>
            </select>
            <p className="text-xs text-gray-500">阿拉伯语、希伯来语等语言使用RTL</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isEnabled"
              {...register("isEnabled")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isEnabled" className="cursor-pointer">启用该语言</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              {...register("isDefault")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">设为默认语言</Label>
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : mode === "create" ? "创建语言" : "保存更改"}
        </Button>
      </div>
    </form>
  )
}
