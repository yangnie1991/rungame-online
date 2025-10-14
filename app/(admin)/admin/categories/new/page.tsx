import { CategoryForm } from "@/components/admin/categories/CategoryForm"

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">创建分类</h1>
        <p className="text-gray-600 mt-1">添加新的游戏分类</p>
      </div>

      <CategoryForm mode="create" />
    </div>
  )
}
