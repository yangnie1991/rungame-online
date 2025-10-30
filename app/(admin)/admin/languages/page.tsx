import { Suspense } from "react"
import Link from "next/link"
import { getAllLanguages } from "@/lib/data/languages/cache"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus } from "lucide-react"
import { DeleteLanguageButton } from "@/components/admin/languages/DeleteLanguageButton"
import { ToggleLanguageStatus } from "@/components/admin/languages/ToggleLanguageStatus"

async function getLanguages() {
  // 使用缓存层而不是直接查询数据库
  const languages = await getAllLanguages()

  return languages.map(lang => ({
    id: lang.id,
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    sortOrder: lang.sortOrder,
    isEnabled: lang.isEnabled,
    createdAt: lang.createdAt
  }))
}

async function LanguagesTable() {
  const languages = await getLanguages()

  if (languages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">暂无语言数据</p>
        <Link href="/admin/languages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建第一个语言
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">排序</TableHead>
          <TableHead>语言代码</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>本地名称</TableHead>
          <TableHead className="w-[100px]">状态</TableHead>
          <TableHead className="w-[150px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {languages.map((language) => (
          <TableRow key={language.id}>
            <TableCell className="font-mono">{language.sortOrder}</TableCell>
            <TableCell className="font-mono text-sm">{language.code}</TableCell>
            <TableCell className="font-medium">{language.name}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {language.nativeName || '-'}
            </TableCell>
            <TableCell>
              <ToggleLanguageStatus
                languageId={language.id}
                languageCode={language.code}
                languageName={language.name}
                currentStatus={language.isEnabled}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/languages/${language.id}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <DeleteLanguageButton languageId={language.id} languageName={language.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function LanguagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">语言管理</h1>
          <p className="text-gray-600 mt-1">管理网站支持的语言</p>
        </div>
        <Link href="/admin/languages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加语言
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有语言</CardTitle>
          <CardDescription>按排序顺序显示所有语言</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            <LanguagesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
