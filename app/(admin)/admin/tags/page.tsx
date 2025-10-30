import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus } from "lucide-react"
import { DeleteTagButton } from "@/components/admin/tags/DeleteTagButton"
import { ToggleTagStatus } from "@/components/admin/tags/ToggleTagStatus"
import { getAllTagsForAdmin } from "@/lib/data/tags/cache"

async function getTagsWithGameCount() {
  // ✅ 使用缓存层获取标签数据（管理端专用，包含所有状态）
  const tags = await getAllTagsForAdmin('zh')

  return tags.map(tag => ({
    id: tag.id,
    slug: tag.slug,
    isEnabled: tag.isEnabled, // 显示实际的启用状态
    name: tag.name,
    gameCount: tag.gameCount,
    createdAt: new Date(), // 缓存数据不包含 createdAt
  }))
}

async function TagsTable() {
  const tags = await getTagsWithGameCount()

  if (tags.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">暂无标签数据</p>
        <Link href="/admin/tags/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建第一个标签
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标识符 (Slug)</TableHead>
          <TableHead>名称</TableHead>
          <TableHead className="w-[100px]">游戏数</TableHead>
          <TableHead className="w-[120px]">状态</TableHead>
          <TableHead className="w-[150px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tags.map((tag) => (
          <TableRow key={tag.id}>
            <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
            <TableCell className="font-medium">{tag.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{tag.gameCount}</Badge>
            </TableCell>
            <TableCell>
              <ToggleTagStatus
                tagId={tag.id}
                tagName={tag.name}
                currentStatus={tag.isEnabled}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/tags/${tag.id}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <DeleteTagButton tagId={tag.id} tagName={tag.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">标签管理</h1>
          <p className="text-gray-600 mt-1">管理游戏标签和多语言翻译</p>
        </div>
        <Link href="/admin/tags/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建标签
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有标签</CardTitle>
          <CardDescription>按创建时间倒序显示所有游戏标签</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            <TagsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
