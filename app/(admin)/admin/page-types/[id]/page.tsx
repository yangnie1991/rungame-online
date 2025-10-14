import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageTypeForm } from "@/components/admin/page-types/PageTypeForm"

async function getPageType(id: string) {
  const pageType = await prisma.pageType.findUnique({
    where: { id },
    include: {
      translations: true
    }
  })

  if (!pageType) {
    notFound()
  }

  return pageType
}

export default async function EditPageTypePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pageType = await getPageType(id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">编辑页面类型</h1>
        <p className="text-gray-600 mt-1">修改页面类型配置</p>
      </div>

      <PageTypeForm mode="edit" pageType={pageType} />
    </div>
  )
}
