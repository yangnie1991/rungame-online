"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function deleteTag(tagId: string) {
  try {
    await prisma.tag.delete({ where: { id: tagId } })
    revalidatePath("/admin/tags")
    return { success: true }
  } catch (error) {
    console.error("删除标签失败:", error)
    return { success: false, error: "删除失败，可能该标签正在被使用" }
  }
}

const tagSchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  translations: z.array(
    z.object({
      locale: z.enum(["en", "zh", "es", "fr"]),
      name: z.string().min(1, "名称不能为空"),
    })
  ).min(1, "至少需要一个翻译")
})

export type TagFormData = z.infer<typeof tagSchema>

export async function createTag(data: TagFormData) {
  try {
    const validated = tagSchema.parse(data)
    const existing = await prisma.tag.findUnique({ where: { slug: validated.slug } })
    if (existing) return { success: false, error: "该标识符已存在" }

    const tag = await prisma.tag.create({
      data: {
        slug: validated.slug,
        translations: { create: validated.translations }
      },
      include: { translations: true }
    })

    revalidatePath("/admin/tags")
    return { success: true, data: tag }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.errors[0].message }
    console.error("创建标签失败:", error)
    return { success: false, error: "创建失败，请稍后重试" }
  }
}

export async function updateTag(tagId: string, data: TagFormData) {
  try {
    const validated = tagSchema.parse(data)
    const existing = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!existing) return { success: false, error: "标签不存在" }

    if (existing.slug !== validated.slug) {
      const slugExists = await prisma.tag.findUnique({ where: { slug: validated.slug } })
      if (slugExists) return { success: false, error: "该标识符已被使用" }
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        slug: validated.slug,
        translations: { deleteMany: {}, create: validated.translations }
      },
      include: { translations: true }
    })

    revalidatePath("/admin/tags")
    revalidatePath(`/admin/tags/${tagId}`)
    return { success: true, data: tag }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.errors[0].message }
    console.error("更新标签失败:", error)
    return { success: false, error: "更新失败，请稍后重试" }
  }
}

export async function getTag(tagId: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: { translations: true }
    })
    if (!tag) return { success: false, error: "标签不存在" }
    return { success: true, data: tag }
  } catch (error) {
    console.error("获取标签失败:", error)
    return { success: false, error: "获取标签失败" }
  }
}

// 切换标签启用状态
export async function toggleTagStatus(tagId: string, currentStatus: boolean) {
  try {
    const tag = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!tag) return { success: false, error: "标签不存在" }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { isEnabled: !currentStatus }
    })

    revalidatePath("/admin/tags")
    return {
      success: true,
      data: updatedTag,
      message: updatedTag.isEnabled ? "已启用" : "已禁用"
    }
  } catch (error) {
    console.error("切换标签状态失败:", error)
    return { success: false, error: "操作失败，请稍后重试" }
  }
}
