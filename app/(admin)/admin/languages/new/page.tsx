import { LanguageForm } from "@/components/admin/languages/LanguageForm"

export default function NewLanguagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">添加语言</h1>
        <p className="text-gray-600 mt-1">添加新的网站语言</p>
      </div>

      <LanguageForm mode="create" />
    </div>
  )
}
