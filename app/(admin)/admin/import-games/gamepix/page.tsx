import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GamePixBrowser } from '@/components/admin/games/GamePixBrowser'
import { prisma } from '@/lib/prisma'
import { getGamePixPlatform } from '../platform-actions'

// 服务器组件，用于获取平台配置
// ✅ 优化：移除分类和标签的预加载，改为按需加载
async function GamePixBrowserContainer() {
  // 只获取平台配置（Site ID）
  const platform = await getGamePixPlatform()

  // 从数据库获取配置
  const apiConfig = platform.apiConfig as { siteId?: string }
  const defaultConfig = platform.defaultConfig as {
    orderBy?: 'quality' | 'published'
    perPage?: '12' | '24' | '48' | '96'
    category?: string
  }

  return (
    <GamePixBrowser
      initialSiteId={apiConfig.siteId || ''}
      defaultConfig={defaultConfig}
    />
  )
}

export default function GamePixImportPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎮</div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GamePix 游戏库</h1>
            <p className="text-muted-foreground">浏览并导入 GamePix 平台的高质量 HTML5 游戏</p>
          </div>
        </div>
      </div>

      {/* 游戏浏览器 */}
      <Suspense fallback={
        <Card className="p-6">
          <Skeleton className="w-full h-[800px]" />
        </Card>
      }>
        <GamePixBrowserContainer />
      </Suspense>
    </div>
  )
}
