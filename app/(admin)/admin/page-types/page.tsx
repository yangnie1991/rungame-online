import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus } from "lucide-react"
import { DeletePageTypeButton } from "@/components/admin/page-types/DeletePageTypeButton"

async function getPageTypesWithDetails() {
  const pageTypes = await prisma.pageType.findMany({
    include: {
      translations: {
        where: { locale: 'zh' },
        select: { title: true, description: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return pageTypes.map(pt => ({
    id: pt.id,
    slug: pt.slug,
    type: pt.type,
    icon: pt.icon,
    sortOrder: pt.sortOrder,
    isEnabled: pt.isEnabled,
    title: pt.translations[0]?.title || pt.title,
    description: pt.translations[0]?.description || pt.description || '',
    createdAt: pt.createdAt
  }))
}

const typeLabels: Record<string, string> = {
  GAME_LIST: '游戏列表',
  STATIC_CONTENT: '静态内容',
  MIXED: '混合类型'
}

async function PageTypesTable() {
  const pageTypes = await getPageTypesWithDetails()

  if (pageTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-4 text-gray-600">暂无页面类型数据</p>
        <Link href="/admin/page-types/new">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            创建第一个页面类型
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] font-semibold">排序</TableHead>
            <TableHead className="min-w-[200px] font-semibold">标识符 (Slug)</TableHead>
            <TableHead className="min-w-[200px] font-semibold">标题</TableHead>
            <TableHead className="w-[120px] font-semibold">类型</TableHead>
            <TableHead className="w-[100px] text-center font-semibold">状态</TableHead>
            <TableHead className="w-[150px] text-center font-semibold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageTypes.map((pageType) => (
            <TableRow key={pageType.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-center font-semibold">{pageType.sortOrder}</TableCell>
              <TableCell className="font-mono text-sm">
                {pageType.icon && <span className="mr-2 text-lg">{pageType.icon}</span>}
                <span className="text-gray-900 font-medium">{pageType.slug}</span>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-gray-900">{pageType.title}</div>
                {pageType.description && (
                  <div className="text-sm text-gray-600 mt-0.5">{pageType.description}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium">
                  {typeLabels[pageType.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={pageType.isEnabled ? "default" : "secondary"} className="font-medium">
                  {pageType.isEnabled ? "启用" : "禁用"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Link href={`/admin/page-types/${pageType.id}`}>
                    <Button variant="outline" size="sm" title="编辑">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeletePageTypeButton pageTypeId={pageType.id} pageTypeName={pageType.title} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function PageTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">页面类型管理</h1>
          <p className="text-gray-600 mt-1">管理动态页面类型和多语言配置</p>
        </div>
        <Link href="/admin/page-types/new">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            创建页面类型
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">所有页面类型</CardTitle>
          <CardDescription className="text-gray-600">按排序顺序显示所有页面类型配置</CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <Suspense fallback={<div className="text-center py-8 text-gray-600">加载中...</div>}>
            <PageTypesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
