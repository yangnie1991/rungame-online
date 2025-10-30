import { Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import { DeleteGameButton } from '@/components/admin/games/DeleteGameButton'
import { ToggleGamePublishStatus, ToggleGameFeaturedStatus } from '@/components/admin/games/ToggleGameStatus'

async function getGames() {
  const games = await prisma.game.findMany({
    include: {
      translations: {
        where: { locale: 'zh' },
        select: { title: true, description: true },
      },
      gameCategories: {
        where: { isPrimary: true },
        take: 1,
        include: {
          category: {
            include: {
              translations: {
                where: { locale: 'zh' },
                select: { name: true },
              },
            },
          },
        },
      },
      tags: {
        include: {
          tag: {
            include: {
              translations: {
                where: { locale: 'zh' },
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return games.map((game) => {
    const primaryCategory = game.gameCategories[0]?.category
    return {
      id: game.id,
      slug: game.slug,
      // 新架构: 优先使用翻译，回退到英文主表
      title: game.translations[0]?.title || game.title,
      description: game.translations[0]?.description || game.description || '',
      thumbnail: game.thumbnail,
      categoryName: primaryCategory?.translations[0]?.name || primaryCategory?.name || '未分类',
      tags: game.tags.map((gt) => gt.tag.translations[0]?.name || gt.tag.name),
      // 新架构: status 替代 isPublished
      status: game.status,
      isFeatured: game.isFeatured,
      playCount: game.playCount,
      rating: game.rating,
    }
  })
}

async function GamesTable() {
  const games = await getGames()

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">还没有任何游戏</p>
        <Button asChild>
          <Link href="/admin/games/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            创建第一个游戏
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">缩略图</TableHead>
          <TableHead>标题</TableHead>
          <TableHead>分类</TableHead>
          <TableHead>标签</TableHead>
          <TableHead className="w-[120px]">发布状态</TableHead>
          <TableHead className="w-[120px]">精选</TableHead>
          <TableHead className="w-[80px]">游玩次数</TableHead>
          <TableHead className="w-[80px]">评分</TableHead>
          <TableHead className="text-right w-[100px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map((game) => (
          <TableRow key={game.id}>
            <TableCell>
              <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
                <Image
                  src={game.thumbnail}
                  alt={game.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">{game.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {game.description}
                </div>
                <div className="text-xs text-muted-foreground">/{game.slug}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{game.categoryName}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {game.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {game.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{game.tags.length - 3}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <ToggleGamePublishStatus
                gameId={game.id}
                gameTitle={game.title}
                currentStatus={game.status}
              />
            </TableCell>
            <TableCell>
              <ToggleGameFeaturedStatus
                gameId={game.id}
                gameTitle={game.title}
                currentStatus={game.isFeatured}
              />
            </TableCell>
            <TableCell className="text-center">
              {game.playCount.toLocaleString()}
            </TableCell>
            <TableCell className="text-center">
              {game.rating > 0 ? game.rating.toFixed(1) : '-'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/games/${game.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <DeleteGameButton gameId={game.id} gameName={game.title} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">游戏管理</h1>
          <p className="text-muted-foreground">管理网站上的所有游戏</p>
        </div>
        <Button asChild>
          <Link href="/admin/games/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            添加游戏
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>游戏列表</CardTitle>
          <CardDescription>
            查看和管理所有游戏，包括游戏信息、分类、标签和发布状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
            <GamesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
