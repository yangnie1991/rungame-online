import { notFound } from 'next/navigation'
import { GameForm } from '@/components/admin/games/GameForm'
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

  const game = result.data

  // Transform game data to match form structure
  const initialData = {
    id: game.id,
    slug: game.slug,
    thumbnail: game.thumbnail,
    banner: game.banner || '',
    embedUrl: game.embedUrl,
    gameUrl: game.gameUrl,
    width: game.width,
    height: game.height,
    categoryId: game.categoryId,
    tagIds: game.tagIds,
    isFeatured: game.isFeatured,
    isPublished: game.isPublished,
    metadata: (typeof game.metadata === 'object' && game.metadata !== null) ? game.metadata as Record<string, unknown> : undefined,
    translations: game.translations.map((t) => ({
      locale: t.locale as 'en' | 'zh' | 'es' | 'fr',
      title: t.title,
      description: t.description || '',
      longDescription: t.longDescription || '',
      instructions: t.instructions || '',
      keywords: t.keywords || '',
      metaTitle: t.metaTitle || '',
      metaDescription: t.metaDescription || '',
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">编辑游戏</h1>
        <p className="text-muted-foreground">
          修改游戏信息：{game.translations.find((t) => t.locale === 'zh')?.title || game.slug}
        </p>
      </div>

      <GameForm initialData={initialData} isEdit />
    </div>
  )
}
