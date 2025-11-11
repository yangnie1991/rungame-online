/**
 * Bing SEO 管理页面
 * 集成 IndexNow 配置、收录列表、批量检查等所有功能
 */

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { BingSubmissionsClient } from './BingSubmissionsClient'

export async function getBingStats() {
  const [total, indexed, notIndexed, unchecked] = await Promise.all([
    prisma.urlSubmission.count(),
    prisma.urlSubmission.count({
      where: {
        indexedByBing: true,
      },
    }),
    prisma.urlSubmission.count({
      where: {
        indexedByBing: false,
      },
    }),
    prisma.urlSubmission.count({
      where: {
        indexedByBing: null,
      },
    }),
  ])

  const indexRate = total > 0 ? ((indexed / total) * 100).toFixed(1) : '0'

  return {
    total,
    indexed,
    notIndexed,
    unchecked,
    indexRate,
  }
}

async function getBingConfig() {
  return prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
    select: {
      id: true,
      name: true,
      type: true,
      isEnabled: true,
      apiKey: true,
      siteUrl: true, // Site URL
      apiEndpoint: true, // IndexNow API URL
    },
  })
}

async function getBingSubmissions() {
  return prisma.urlSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url: true,
      urlType: true,
      locale: true,
      bingSubmitStatus: true,
      indexedByBing: true,
      bingIndexedAt: true,
      bingLastCheckAt: true,
      createdAt: true,
    },
  })
}

// StatsCards 移至客户端组件以支持按钮交互

export default async function BingSubmissionsPage() {
  const stats = await getBingStats()
  const config = await getBingConfig()
  const submissions = await getBingSubmissions()

  if (!config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bing SEO 管理</h1>
          <p className="text-muted-foreground mt-2">
            管理 IndexNow 配置和 URL 收录状态
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>未找到 Bing IndexNow 配置</p>
              <p className="text-sm mt-2">
                请先运行初始化脚本：
                <code className="bg-gray-100 px-2 py-1 rounded ml-2">
                  npx tsx scripts/init-search-engines.ts
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bing SEO 管理</h1>
        <p className="text-muted-foreground mt-2">
          管理 IndexNow 配置和 URL 收录状态
        </p>
      </div>

      <BingSubmissionsClient config={config} submissions={submissions} stats={stats} />
    </div>
  )
}
