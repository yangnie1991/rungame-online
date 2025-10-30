"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 删除页面类型
export async function deletePageType(pageTypeId: string) {
  try {
    await prisma.pageType.delete({
      where: { id: pageTypeId }
    })

    revalidatePath("/admin/page-types")
    return { success: true }
  } catch (error) {
    console.error("删除页面类型失败:", error)
    return { success: false, error: "删除失败，可能该页面类型正在被使用" }
  }
}

// 创建/更新页面类型的验证 Schema
const pageTypeSchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  type: z.enum(["GAME_LIST", "DISPLAY_PAGE", "OTHER_PAGE"]),
  icon: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0, "排序值不能为负数").default(0),
  // 主表字段（英文作为回退）
  title: z.string().min(1, "英文标题不能为空"),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  pageInfo: z.record(z.string(), z.unknown()).optional(),
  // 翻译数据
  translations: z.array(
    z.object({
      locale: z.enum(["en", "zh", "es", "fr"]),
      title: z.string().min(1, "标题不能为空"),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.string().optional(),
      pageInfo: z.record(z.string(), z.unknown()).optional(),
    })
  ).default([])
})

export type PageTypeFormData = z.infer<typeof pageTypeSchema>

// 创建页面类型
export async function createPageType(data: PageTypeFormData) {
  try {
    // 验证数据
    const validated = pageTypeSchema.parse(data)

    // 检查 slug 是否已存在
    const existing = await prisma.pageType.findUnique({
      where: { slug: validated.slug }
    })

    if (existing) {
      return { success: false, error: "该标识符已存在" }
    }

    // 创建页面类型及翻译
    const pageType = await prisma.pageType.create({
      data: {
        slug: validated.slug,
        type: validated.type,
        icon: validated.icon || null,
        isEnabled: validated.isEnabled,
        sortOrder: validated.sortOrder,
        // 主表字段（英文作为回退）
        title: validated.title,
        description: validated.description || null,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        keywords: validated.keywords || null,
        pageInfo: validated.pageInfo || null,
        // 翻译数据
        translations: {
          create: validated.translations
        }
      },
      include: {
        translations: true
      }
    })

    revalidatePath("/admin/page-types")
    return { success: true, data: pageType }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("创建页面类型失败:", error)
    return { success: false, error: "创建失败，请稍后重试" }
  }
}

// 更新页面类型
export async function updatePageType(pageTypeId: string, data: PageTypeFormData) {
  try {
    // 验证数据
    const validated = pageTypeSchema.parse(data)

    // 检查页面类型是否存在
    const existing = await prisma.pageType.findUnique({
      where: { id: pageTypeId }
    })

    if (!existing) {
      return { success: false, error: "页面类型不存在" }
    }

    // 如果修改了 slug，检查新 slug 是否已被使用
    if (existing.slug !== validated.slug) {
      const slugExists = await prisma.pageType.findUnique({
        where: { slug: validated.slug }
      })
      if (slugExists) {
        return { success: false, error: "该标识符已被使用" }
      }
    }

    // 更新页面类型（先删除旧翻译，再创建新翻译）
    const pageType = await prisma.pageType.update({
      where: { id: pageTypeId },
      data: {
        slug: validated.slug,
        type: validated.type,
        icon: validated.icon || null,
        isEnabled: validated.isEnabled,
        sortOrder: validated.sortOrder,
        // 主表字段（英文作为回退）
        title: validated.title,
        description: validated.description || null,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        keywords: validated.keywords || null,
        pageInfo: validated.pageInfo || null,
        // 翻译数据
        translations: {
          deleteMany: {},
          create: validated.translations
        }
      },
      include: {
        translations: true
      }
    })

    revalidatePath("/admin/page-types")
    revalidatePath(`/admin/page-types/${pageTypeId}`)
    return { success: true, data: pageType }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("更新页面类型失败:", error)
    return { success: false, error: "更新失败，请稍后重试" }
  }
}

// 获取单个页面类型（用于编辑页面）
export async function getPageType(pageTypeId: string) {
  try {
    const pageType = await prisma.pageType.findUnique({
      where: { id: pageTypeId },
      include: {
        translations: true
      }
    })

    if (!pageType) {
      return { success: false, error: "页面类型不存在" }
    }

    return { success: true, data: pageType }
  } catch (error) {
    console.error("获取页面类型失败:", error)
    return { success: false, error: "获取页面类型失败" }
  }
}
