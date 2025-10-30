"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { CACHE_TAGS } from "@/lib/cache-helpers"

// 删除分类
export async function deleteCategory(categoryId: string) {
  try {
    await prisma.category.delete({
      where: { id: categoryId }
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("删除分类失败:", error)
    return { success: false, error: "删除失败，可能该分类正在被使用" }
  }
}

// 创建分类的验证 Schema
const categorySchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0, "排序值不能为负数").default(0),
  // 主表字段（英文作为回退）
  name: z.string().min(1, "英文名称不能为空"),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  // 翻译数据（可以包含英文，用于覆盖主表）
  translations: z.array(
    z.object({
      locale: z.enum(["en", "zh", "es", "fr"]),
      name: z.string().min(1, "名称不能为空"),
      description: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.string().optional(),
    })
  ).default([])
})

export type CategoryFormData = z.infer<typeof categorySchema>

// 创建分类
export async function createCategory(data: CategoryFormData) {
  try {
    // 验证数据
    const validated = categorySchema.parse(data)

    // 检查 slug 是否已存在
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug }
    })

    if (existing) {
      return { success: false, error: "该标识符已存在" }
    }

    // 创建分类及翻译
    const category = await prisma.category.create({
      data: {
        slug: validated.slug,
        icon: validated.icon || null,
        sortOrder: validated.sortOrder,
        // 主表字段（英文作为回退）
        name: validated.name,
        description: validated.description || null,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        keywords: validated.keywords || null,
        // 翻译数据
        translations: {
          create: validated.translations
        }
      },
      include: {
        translations: true
      }
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidatePath("/admin/categories")
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("创建分类失败:", error)
    return { success: false, error: "创建失败，请稍后重试" }
  }
}

// 更新分类
export async function updateCategory(categoryId: string, data: CategoryFormData) {
  try {
    // 验证数据
    const validated = categorySchema.parse(data)

    // 检查分类是否存在
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      return { success: false, error: "分类不存在" }
    }

    // 如果修改了 slug，检查新 slug 是否已被使用
    if (existing.slug !== validated.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: validated.slug }
      })
      if (slugExists) {
        return { success: false, error: "该标识符已被使用" }
      }
    }

    // 更新分类（先删除旧翻译，再创建新翻译）
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        slug: validated.slug,
        icon: validated.icon || null,
        sortOrder: validated.sortOrder,
        // 主表字段（英文作为回退）
        name: validated.name,
        description: validated.description || null,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        keywords: validated.keywords || null,
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

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidatePath("/admin/categories")
    revalidatePath(`/admin/categories/${categoryId}`)
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("更新分类失败:", error)
    return { success: false, error: "更新失败，请稍后重试" }
  }
}

// 获取单个分类（用于编辑页面）
export async function getCategory(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true
      }
    })

    if (!category) {
      return { success: false, error: "分类不存在" }
    }

    return { success: true, data: category }
  } catch (error) {
    console.error("获取分类失败:", error)
    return { success: false, error: "获取分类失败" }
  }
}

// 切换分类启用状态
export async function toggleCategoryStatus(categoryId: string, currentStatus: boolean) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return { success: false, error: "分类不存在" }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { isEnabled: !currentStatus }
    })

    // ✅ 失效缓存
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidatePath("/admin/categories")
    return {
      success: true,
      data: updatedCategory,
      message: updatedCategory.isEnabled ? "已启用" : "已禁用"
    }
  } catch (error) {
    console.error("切换分类状态失败:", error)
    return { success: false, error: "操作失败，请稍后重试" }
  }
}
