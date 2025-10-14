import { PageTypeForm } from "@/components/admin/page-types/PageTypeForm"

export default function NewPageTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">创建页面类型</h1>
        <p className="text-gray-600 mt-1">添加新的页面类型配置</p>
      </div>

      <PageTypeForm mode="create" />
    </div>
  )
}
