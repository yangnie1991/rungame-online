"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 获取所有已启用的语言（用于表单的多语言Tab）
export async function getEnabledLanguages() {
  try {
    const languages = await prisma.language.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        nativeName: true,
      }
    })

    return {
      success: true,
      data: languages.map(lang => ({
        code: lang.code,
        label: lang.nativeName || lang.name,
        name: lang.name
      }))
    }
  } catch (error) {
    console.error("获取已启用语言失败:", error)
    return {
      success: false,
      error: "获取语言列表失败",
      data: []
    }
  }
}

export async function deleteLanguage(languageId: string) {
  try {
    await prisma.language.delete({
      where: { id: languageId }
    })
    revalidatePath("/admin/languages")
    return { success: true }
  } catch (error) {
    console.error("删除语言失败:", error)
    return { success: false, error: "删除失败" }
  }
}

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

export type LanguageFormData = z.infer<typeof languageSchema>

export async function createLanguage(data: LanguageFormData) {
  try {
    const validated = languageSchema.parse(data)

    const existing = await prisma.language.findUnique({
      where: { code: validated.code }
    })

    if (existing) {
      return { success: false, error: "该语言代码已存在" }
    }

    const language = await prisma.language.create({
      data: {
        code: validated.code,
        name: validated.name,
        nativeName: validated.nativeName,
        flag: validated.flag || null,
        localeCode: validated.localeCode,
        isDefault: validated.isDefault,
        isEnabled: validated.isEnabled,
        sortOrder: validated.sortOrder,
        direction: validated.direction,
      }
    })

    revalidatePath("/admin/languages")
    return { success: true, data: language }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("创建语言失败:", error)
    return { success: false, error: "创建失败，请稍后重试" }
  }
}

export async function updateLanguage(languageId: string, data: LanguageFormData) {
  try {
    const validated = languageSchema.parse(data)

    const existing = await prisma.language.findUnique({
      where: { id: languageId }
    })

    if (!existing) {
      return { success: false, error: "语言不存在" }
    }

    if (existing.code !== validated.code) {
      const codeExists = await prisma.language.findUnique({
        where: { code: validated.code }
      })
      if (codeExists) {
        return { success: false, error: "该语言代码已被使用" }
      }
    }

    const language = await prisma.language.update({
      where: { id: languageId },
      data: {
        code: validated.code,
        name: validated.name,
        nativeName: validated.nativeName,
        flag: validated.flag || null,
        localeCode: validated.localeCode,
        isDefault: validated.isDefault,
        isEnabled: validated.isEnabled,
        sortOrder: validated.sortOrder,
        direction: validated.direction,
      }
    })

    revalidatePath("/admin/languages")
    revalidatePath(`/admin/languages/${languageId}`)
    return { success: true, data: language }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("更新语言失败:", error)
    return { success: false, error: "更新失败，请稍后重试" }
  }
}

export async function getLanguage(languageId: string) {
  try {
    const language = await prisma.language.findUnique({
      where: { id: languageId }
    })

    if (!language) {
      return { success: false, error: "语言不存在" }
    }

    return { success: true, data: language }
  } catch (error) {
    console.error("获取语言失败:", error)
    return { success: false, error: "获取语言失败" }
  }
}

export async function toggleLanguageStatus(languageId: string, currentStatus: boolean) {
  try {
    const language = await prisma.language.findUnique({
      where: { id: languageId }
    })

    if (!language) {
      return { success: false, error: "语言不存在" }
    }

    // 禁止禁用默认语言 en
    if (language.code === 'en' && currentStatus === true) {
      return { success: false, error: "默认语言 English (en) 不能禁用" }
    }

    const updatedLanguage = await prisma.language.update({
      where: { id: languageId },
      data: { isEnabled: !currentStatus }
    })

    revalidatePath("/admin/languages")
    return {
      success: true,
      data: updatedLanguage,
      message: updatedLanguage.isEnabled ? "已启用" : "已禁用"
    }
  } catch (error) {
    console.error("切换语言状态失败:", error)
    return { success: false, error: "操作失败，请稍后重试" }
  }
}
