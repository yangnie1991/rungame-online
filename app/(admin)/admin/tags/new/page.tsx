import { TagForm } from "@/components/admin/tags/TagForm"

export default function NewTagPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">创建标签</h1>
        <p className="text-gray-600 mt-1">添加新的游戏标签</p>
      </div>

      <TagForm mode="create" />
    </div>
  )
}
