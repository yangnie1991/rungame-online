import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, ArrowRight, ExternalLink, CheckCircle2, Clock, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// 导入源配置
const importSources = [
  {
    id: 'gamepix',
    name: 'GamePix',
    description: '从 GamePix 批量导入高质量 HTML5 游戏',
    icon: '🎮',
    stats: {
      games: '12,000+',
      quality: '高质量精选',
      formats: 'JSON/XML',
    },
    features: [
      '按质量或日期排序',
      '支持分类筛选',
      '每页 12-96 个游戏',
      '自动生成中英文翻译',
      '质量评分自动标记精选',
    ],
    url: '/admin/import-games/gamepix',
    docsUrl: 'https://docs.gamepix.com/docs',
    status: 'active', // active | coming-soon | beta
  },
  // 未来可以添加更多导入源
  // {
  //   id: 'crazygames',
  //   name: 'CrazyGames',
  //   description: '从 CrazyGames 导入热门游戏',
  //   icon: '🎯',
  //   stats: {
  //     games: '10,000+',
  //     quality: '热门游戏',
  //     formats: 'API',
  //   },
  //   features: [
  //     '热门游戏优先',
  //     '多类别支持',
  //     '实时数据同步',
  //   ],
  //   url: '/admin/import-games/crazygames',
  //   status: 'coming-soon',
  // },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          可用
        </Badge>
      )
    case 'beta':
      return (
        <Badge variant="secondary" className="gap-1">
          <Beaker className="h-3 w-3" />
          测试版
        </Badge>
      )
    case 'coming-soon':
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          即将推出
        </Badge>
      )
    default:
      return null
  }
}

export default function ImportGamesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">游戏导入</h1>
          <p className="text-muted-foreground">选择游戏平台，批量导入高质量游戏到你的网站</p>
        </div>
      </div>

      {/* 导入源列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {importSources.map((source) => (
          <Card key={source.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{source.icon}</div>
                  <div>
                    <CardTitle className="text-xl">{source.name}</CardTitle>
                    <div className="mt-1">{getStatusBadge(source.status)}</div>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-3">{source.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-xs text-muted-foreground">游戏数量</div>
                  <div className="text-sm font-semibold">{source.stats.games}</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-xs text-muted-foreground">质量</div>
                  <div className="text-sm font-semibold">{source.stats.quality}</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-xs text-muted-foreground">格式</div>
                  <div className="text-sm font-semibold">{source.stats.formats}</div>
                </div>
              </div>

              {/* 功能特性 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">功能特性:</div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {source.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                {source.status === 'active' ? (
                  <>
                    <Button asChild className="flex-1">
                      <Link href={source.url}>
                        开始导入
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {source.docsUrl && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={source.docsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <Button disabled className="flex-1">
                    {source.status === 'beta' ? '申请测试' : '即将推出'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle>导入说明</CardTitle>
          <CardDescription>关于游戏导入功能的重要信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">批量导入流程</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>选择上方的游戏平台</li>
              <li>配置平台账号和导入选项</li>
              <li>预览将要导入的游戏列表</li>
              <li>确认无误后批量导入到数据库</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 提示</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>导入的游戏会自动创建多语言版本（英文和中文）</li>
              <li>高质量游戏会自动标记为精选游戏</li>
              <li>可以在游戏管理页面编辑游戏信息和翻译</li>
              <li>建议先预览游戏，确认质量后再批量导入</li>
              <li>导入过程中不会重复导入已存在的游戏</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ 注意事项</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>每个平台需要单独注册账号并获取 API 密钥</li>
              <li>导入大量游戏可能需要较长时间，请耐心等待</li>
              <li>确保目标分类已存在，否则导入会失败</li>
              <li>导入后请检查游戏的显示效果和功能</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
