import { notFound } from "next/navigation"
import { getCategory } from "@/app/(admin)/admin/categories/actions"
import { CategoryForm } from "@/components/admin/categories/CategoryForm"

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getCategory(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">编辑分类</h1>
        <p className="text-gray-600 mt-1">修改分类信息和翻译</p>
      </div>

      <CategoryForm mode="edit" category={result.data} />
    </div>
  )
}
