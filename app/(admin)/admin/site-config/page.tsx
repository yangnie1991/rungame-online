import { Suspense } from 'react'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SiteConfigForm } from '@/components/admin/site-config/SiteConfigForm'
import { getSiteConfigAction, initializeSiteConfigAction } from './actions'

async function SiteConfigContent() {
  const config = await getSiteConfigAction()

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>网站配置未初始化</CardTitle>
          <CardDescription>
            检测到数据库中还没有网站配置，点击下方按钮初始化默认配置。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={initializeSiteConfigAction}>
            <Button type="submit">初始化网站配置</Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return <SiteConfigForm config={config} />
}

export default function SiteConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-gray-700" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">网站配置</h1>
          <p className="text-gray-600 mt-1">管理网站的全局配置和多语言内容</p>
        </div>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-8 text-center text-gray-600">
              加载配置中...
            </CardContent>
          </Card>
        }
      >
        <SiteConfigContent />
      </Suspense>
    </div>
  )
}
