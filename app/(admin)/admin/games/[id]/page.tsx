import { notFound } from 'next/navigation'
import { GameForm } from '@/components/admin/games'
import { getGame } from '@/app/(admin)/admin/games/actions'

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getGame(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">编辑游戏</h1>
        <p className="text-muted-foreground">
          修改游戏信息：{result.data.title || result.data.slug}
        </p>
      </div>

      <GameForm game={result.data} mode="edit" />
    </div>
  )
}
