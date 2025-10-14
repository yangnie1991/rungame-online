import { GameForm } from '@/components/admin/games/GameForm'

export default function NewGamePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">添加游戏</h1>
        <p className="text-muted-foreground">创建一个新的游戏</p>
      </div>

      <GameForm />
    </div>
  )
}
