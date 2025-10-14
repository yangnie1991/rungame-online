import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DeleteCategoryButton } from "@/components/admin/categories/DeleteCategoryButton"
import { ToggleCategoryStatus } from "@/components/admin/categories/ToggleCategoryStatus"

async function getCategoriesWithGameCount() {
  const categories = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale: 'zh' },
        select: { name: true, description: true }
      },
      _count: {
        select: { games: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    icon: cat.icon,
    sortOrder: cat.sortOrder,
    isEnabled: cat.isEnabled,
    name: cat.translations[0]?.name || cat.slug,
    description: cat.translations[0]?.description || '',
    gameCount: cat._count.games,
    createdAt: cat.createdAt
  }))
}

async function CategoriesTable() {
  const categories = await getCategoriesWithGameCount()

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">暂无分类数据</p>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建第一个分类
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
          <TableHead>标识符 (Slug)</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>描述</TableHead>
          <TableHead className="w-[100px]">游戏数</TableHead>
          <TableHead className="w-[120px]">状态</TableHead>
          <TableHead className="w-[150px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-mono">{category.sortOrder}</TableCell>
            <TableCell className="font-mono text-sm">{category.slug}</TableCell>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="text-sm text-gray-600 max-w-md truncate">
              {category.description || '-'}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{category.gameCount}</Badge>
            </TableCell>
            <TableCell>
              <ToggleCategoryStatus
                categoryId={category.id}
                categoryName={category.name}
                currentStatus={category.isEnabled}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/categories/${category.id}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">分类管理</h1>
          <p className="text-gray-600 mt-1">管理游戏分类和多语言翻译</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建分类
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有分类</CardTitle>
          <CardDescription>按排序顺序显示所有游戏分类</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            <CategoriesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
