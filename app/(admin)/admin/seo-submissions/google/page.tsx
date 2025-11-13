/**
 * Google SEO 管理页面
 * 集成配置、收录列表、批量检查等所有功能
 */

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { GoogleSubmissionsClient } from './GoogleSubmissionsClient'

export async function getGoogleStats() {
  const [total, indexed, notIndexed, unchecked] = await Promise.all([
    prisma.urlSubmission.count(),
    prisma.urlSubmission.count({
      where: {
        indexedByGoogle: true,
      },
    }),
    prisma.urlSubmission.count({
      where: {
        indexedByGoogle: false,
      },
    }),
    prisma.urlSubmission.count({
      where: {
        indexedByGoogle: null,
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

async function getGoogleConfig() {
  return prisma.searchEngineConfig.findFirst({
    where: { type: 'google' },
    select: {
      id: true,
      name: true,
      type: true,
      isEnabled: true,
      apiEndpoint: true, // Sitemap URL
      siteUrl: true,
      extraConfig: true, // 额外配置（可能包含 searchConsoleUrl）
    },
  })
}

async function getGoogleSubmissions() {
  return prisma.urlSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url: true,
      urlType: true,
      locale: true,
      entityId: true,
      googleSubmitStatus: true,
      googleSubmittedAt: true,
      indexedByGoogle: true,
      googleIndexedAt: true,
      googleLastCheckAt: true,
      createdAt: true,
    },
  })
}

// StatsCards 移至客户端组件以支持按钮交互

export default async function GoogleSubmissionsPage() {
  const stats = await getGoogleStats()
  const config = await getGoogleConfig()
  const submissions = await getGoogleSubmissions()

  if (!config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google SEO 管理</h1>
          <p className="text-muted-foreground mt-2">
            管理 Google Sitemap 配置和 URL 收录状态
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>未找到 Google 搜索引擎配置</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Google SEO 管理</h1>
        <p className="text-muted-foreground mt-2">
          管理 Google Sitemap 配置和 URL 收录状态
        </p>
      </div>

      <GoogleSubmissionsClient config={config} submissions={submissions} stats={stats} />
    </div>
  )
}
