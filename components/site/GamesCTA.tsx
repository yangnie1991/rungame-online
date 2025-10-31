import { Link } from "@/i18n/routing"

interface GamesC TAProps {
  locale: string
  title?: string
  description?: string
}

export function GamesCTA({ locale, title, description }: GamesCTAProps) {
  const defaultTitle = locale === 'zh' ? '准备好开始游戏了吗？' : 'Ready to Start Playing?'
  const defaultDescription = locale === 'zh'
    ? '探索我们精心挑选的游戏库，立即开始畅玩！'
    : 'Explore our curated collection of games and start playing now!'

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center space-y-4">
      <h3 className="text-2xl font-bold">{title || defaultTitle}</h3>
      <p className="text-muted-foreground">{description || defaultDescription}</p>
      <div className="flex flex-wrap justify-center gap-4 pt-2">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          {locale === 'zh' ? '浏览所有游戏' : 'Browse All Games'} →
        </Link>
        <Link
          href="/category"
          className="inline-flex items-center gap-2 px-6 py-3 bg-card border-2 border-border rounded-lg font-semibold hover:bg-accent transition-colors"
        >
          {locale === 'zh' ? '按分类浏览' : 'Browse by Category'}
        </Link>
      </div>
    </div>
  )
}
