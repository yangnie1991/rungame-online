import { notFound } from "next/navigation"
import { getLanguage } from "@/app/(admin)/admin/languages/actions"
import { LanguageForm } from "@/components/admin/languages/LanguageForm"

export default async function EditLanguagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getLanguage(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">编辑语言</h1>
        <p className="text-gray-600 mt-1">修改语言信息和翻译</p>
      </div>

      <LanguageForm mode="edit" language={result.data} />
    </div>
  )
}
