import { notFound } from "next/navigation"
import { getTag } from "@/app/(admin)/admin/tags/actions"
import { TagForm } from "@/components/admin/tags/TagForm"

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getTag(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">编辑标签</h1>
        <p className="text-gray-600 mt-1">修改标签信息和翻译</p>
      </div>

      <TagForm mode="edit" tag={result.data} />
    </div>
  )
}
