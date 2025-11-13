/**
 * SEO 提交总览页面
 * 显示各搜索引擎的状态和快速入口
 */

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Settings, Send } from 'lucide-react'

async function getSearchEnginesStats() {
  // 获取 Google 和 Bing 配置
  const [googleConfig, bingConfig] = await Promise.all([
    prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    }),
    prisma.searchEngineConfig.findFirst({
      where: { type: 'indexnow' },
    }),
  ])

  // 获取 Google 统计
  let googleStats = null
  if (googleConfig) {
    const [total, indexed] = await Promise.all([
      prisma.urlSubmission.count({
        where: { searchEngineConfigId: googleConfig.id },
      }),
      prisma.urlSubmission.count({
        where: {
          searchEngineConfigId: googleConfig.id,
          indexedByGoogle: true,
        },
      }),
    ])
    googleStats = {
      total,
      indexed,
      indexRate: total > 0 ? ((indexed / total) * 100).toFixed(1) : '0',
    }
  }

  // 获取 Bing 统计
  let bingStats = null
  if (bingConfig) {
    const [total, indexed] = await Promise.all([
      prisma.urlSubmission.count({
        where: { searchEngineConfigId: bingConfig.id },
      }),
      prisma.urlSubmission.count({
        where: {
          searchEngineConfigId: bingConfig.id,
          indexedByBing: true,
        },
      }),
    ])
    bingStats = {
      total,
      indexed,
      indexRate: total > 0 ? ((indexed / total) * 100).toFixed(1) : '0',
    }
  }

  return {
    google: {
      config: googleConfig,
      stats: googleStats,
    },
    bing: {
      config: bingConfig,
      stats: bingStats,
    },
  }
}

export default async function SEOSubmissionsPage() {
  const data = await getSearchEnginesStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO 推送管理</h1>
        <p className="text-muted-foreground mt-2">
          管理搜索引擎 URL 提交和收录状态
        </p>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            前往 Google 或 Bing 管理页面查看详细信息和配置 API
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/admin/seo-submissions/google">
              Google 管理
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/seo-submissions/bing">
              Bing 管理
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Google */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google</CardTitle>
              <CardDescription>通过 Sitemap 自动提交到 Google</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {data.google.config && (
                <Badge variant={data.google.config.isEnabled ? 'default' : 'secondary'}>
                  {data.google.config.isEnabled ? '已启用' : '已禁用'}
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/seo-submissions/google">
                  <Settings className="h-4 w-4 mr-2" />
                  管理
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.google.stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总 URL 数</span>
                <span className="font-medium">{data.google.stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已收录</span>
                <span className="font-medium text-green-600">
                  {data.google.stats.indexed} ({data.google.stats.indexRate}%)
                </span>
              </div>
              {data.google.config?.apiEndpoint && (
                <div className="pt-3 border-t">
                  <a
                    href={data.google.config.apiEndpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    查看 Sitemap
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              未配置 Google 搜索引擎
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bing (IndexNow) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bing (IndexNow)</CardTitle>
              <CardDescription>通过 IndexNow 协议主动推送到 Bing</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {data.bing.config && (
                <Badge variant={data.bing.config.isEnabled ? 'default' : 'secondary'}>
                  {data.bing.config.isEnabled ? '已启用' : '已禁用'}
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/seo-submissions/bing">
                  <Settings className="h-4 w-4 mr-2" />
                  管理
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.bing.stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总 URL 数</span>
                <span className="font-medium">{data.bing.stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已收录</span>
                <span className="font-medium text-green-600">
                  {data.bing.stats.indexed} ({data.bing.stats.indexRate}%)
                </span>
              </div>
              {data.bing.config?.apiEndpoint && (
                <div className="pt-3 border-t">
                  <a
                    href={data.bing.config.apiEndpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    IndexNow 文档
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              未配置 Bing IndexNow
            </p>
          )}
        </CardContent>
      </Card>

      {/* 初始化提示 */}
      {(!data.google.config || !data.bing.config) && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">需要初始化搜索引擎配置</p>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                npx tsx scripts/init-search-engines.ts
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
