/**
 * Bing 提交记录客户端组件
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, XCircle, Clock, RefreshCw, Settings, ExternalLink, Send, FileText, Loader2, TestTube, Info } from 'lucide-react'
import { checkBingIndexStatus, checkBingIndexBatch } from '../index-check-actions'
import { submitBingUrls, submitBingUrlsDirect } from '../submit-engine-actions'
import { generateAllUrlsToDatabase } from '../url-management-actions'
import { updateBingConfig, testBingApi } from '../config-actions'
import { toast } from 'sonner'

interface BingConfig {
  id: string
  name: string
  type: string
  isEnabled: boolean
  apiKey: string | null
  siteUrl: string | null // Site URL
  apiEndpoint: string // IndexNow API URL
}

interface Submission {
  id: string
  url: string
  urlType: string
  locale: string | null
  bingSubmitStatus: string | null
  indexedByBing: boolean | null
  bingIndexedAt: Date | null
  bingLastCheckAt: Date | null
  bingIndexStatusRaw: any | null // Bing API 原始响应数据 (JSON)
  createdAt: Date
}

interface BingStats {
  total: number
  indexed: number
  notIndexed: number
  unchecked: number
  indexRate: string
}

interface BingSubmissionsClientProps {
  config: BingConfig | null
  submissions: Submission[]
  stats: BingStats
}

const typeNames: Record<string, string> = {
  game: '游戏',
  category: '分类',
  tag: '标签',
  pagetype: '页面',
  other: '其他',
}

export function BingSubmissionsClient({ config, submissions: initialSubmissions, stats: initialStats }: BingSubmissionsClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [stats, setStats] = useState(initialStats)
  const [filter, setFilter] = useState<'all' | 'indexed' | 'not-indexed' | 'unchecked'>('all')
  const [localeFilter, setLocaleFilter] = useState<string>('all') // 语言筛选
  const [typeFilter, setTypeFilter] = useState<string>('all') // 类型筛选
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
  const [isGeneratingUrls, setIsGeneratingUrls] = useState(false)

  // Bing API 配置状态
  const [bingApiKey, setBingApiKey] = useState('')
  const [bingSiteUrl, setBingSiteUrl] = useState('')
  const [bingEnabled, setBingEnabled] = useState(false)
  const [bingTestUrl, setBingTestUrl] = useState('')
  const [isBingSaving, setIsBingSaving] = useState(false)
  const [isBingTesting, setIsBingTesting] = useState(false)

  // 从 config prop 初始化配置表单值
  useEffect(() => {
    if (config) {
      console.log('[Bing 配置初始化] 从 config prop 加载配置:', {
        配置ID: config.id,
        isEnabled: config.isEnabled,
        apiKey: config.apiKey ? '已配置' : '未配置',
        siteUrl: config.siteUrl || '未配置',
      })

      // 设置基础配置
      setBingEnabled(config.isEnabled)
      setBingApiKey(config.apiKey || '')
      setBingSiteUrl(config.siteUrl || '')

      console.log('[Bing 配置初始化] ✅ 配置已加载')
    } else {
      console.log('[Bing 配置初始化] ⚠️ config prop 为空')
    }
  }, [config])

  // 重新计算统计数据
  const recalculateStats = (currentSubmissions: Submission[]) => {
    const total = currentSubmissions.length
    const indexed = currentSubmissions.filter(s => s.indexedByBing === true).length
    const notIndexed = currentSubmissions.filter(s => s.indexedByBing === false).length
    const unchecked = currentSubmissions.filter(s => s.indexedByBing === null).length
    const indexRate = total > 0 ? ((indexed / total) * 100).toFixed(1) : '0'

    setStats({
      total,
      indexed,
      notIndexed,
      unchecked,
      indexRate,
    })
  }

  // Submit tab 状态（保留旧的用于快速推送）
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPageTypes, setSelectedPageTypes] = useState<string[]>([])

  // URL 推送页面状态
  const [pushSubmitFilter, setPushSubmitFilter] = useState<string>('not_submitted') // 提交状态筛选：not_submitted, submitted, all
  const [pushIndexFilter, setPushIndexFilter] = useState<string>('all') // 收录状态筛选：not_indexed, indexed, all
  const [pushLocaleFilter, setPushLocaleFilter] = useState<string>('all') // 语言筛选
  const [pushTypeFilter, setPushTypeFilter] = useState<string>('all') // 类型筛选
  const [pushSelectedIds, setPushSelectedIds] = useState<string[]>([]) // 推送页面选中的IDs
  const [pushCurrentPage, setPushCurrentPage] = useState(1) // 当前页码
  const [pushPageSize, setPushPageSize] = useState(50) // 每页数量
  const [pushingSingleId, setPushingSingleId] = useState<string | null>(null) // 正在单独推送的 ID
  const [pushingBatchIds, setPushingBatchIds] = useState<string[]>([]) // 正在批量推送的 IDs

  // 获取所有唯一的语言列表
  const availableLocales = Array.from(new Set(submissions.map(s => s.locale).filter(Boolean)))

  // 获取所有唯一的URL类型列表
  const availableTypes = Array.from(new Set(submissions.map(s => s.urlType)))

  // 根据筛选条件过滤提交记录
  const filteredSubmissions = submissions.filter((s) => {
    // 收录状态筛选
    if (filter === 'indexed' && s.indexedByBing !== true) return false
    if (filter === 'not-indexed' && s.indexedByBing !== false) return false
    if (filter === 'unchecked' && s.indexedByBing !== null) return false

    // 语言筛选
    if (localeFilter !== 'all' && s.locale !== localeFilter) return false

    // 类型筛选
    if (typeFilter !== 'all' && s.urlType !== typeFilter) return false

    return true
  })

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSubmissions.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  // 处理单个复选框
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  // 检查单个 URL
  const handleCheckOne = async (submissionId: string) => {
    try {
      setCheckingIds(prev => new Set([...prev, submissionId]))
      const result = await checkBingIndexStatus(submissionId)

      if (result.success) {
        toast.success(result.message)

        // 乐观更新：只更新对应的 submission 数据
        setSubmissions(prev => {
          const updated = prev.map(sub =>
            sub.id === submissionId
              ? {
                  ...sub,
                  indexedByBing: result.stats?.bingIndexed === 1,
                  bingLastCheckAt: new Date()
                }
              : sub
          )
          // 重新计算统计数据
          recalculateStats(updated)
          return updated
        })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('检查失败，请稍后重试')
    } finally {
      setCheckingIds(prev => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
    }
  }

  // 批量检查
  const handleBatchCheck = async () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要检查的 URL')
      return
    }

    if (selectedIds.length > 20) {
      toast.error('一次最多检查 20 个 URL')
      return
    }

    try {
      setIsBatchChecking(true)
      toast.info(`正在检查 ${selectedIds.length} 个 URL...`)

      const result = await checkBingIndexBatch(selectedIds)

      if (result.success) {
        toast.success(result.message)
        setSelectedIds([])

        // 批量操作：刷新整个页面获取最新数据
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('批量检查失败，请稍后重试')
    } finally {
      setIsBatchChecking(false)
    }
  }


  // 生成所有 URL 列表
  const handleGenerateAllUrls = async () => {
    const confirmed = window.confirm(
      '确定要生成所有网站 URL 吗？\n\n这将从数据库中提取所有已发布的内容（游戏、分类、标签、PageType等）生成 URL 列表。\n\n新增的 URL 将被添加到数据库，已存在的 URL 不会重复添加。'
    )

    if (!confirmed) return

    try {
      setIsGeneratingUrls(true)
      toast.info('正在生成 URL 列表...')

      const result = await generateAllUrlsToDatabase()

      if (result.success && result.stats) {
        toast.success(
          <div>
            <div className="font-semibold">{result.message}</div>
            <div className="text-xs mt-1">
              游戏: {result.stats.byType.game} | 分类: {result.stats.byType.category} |
              标签: {result.stats.byType.tag} | 页面: {result.stats.byType.pagetype} |
              其他: {result.stats.byType.other}
            </div>
          </div>
        )
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('生成失败，请稍后重试')
    } finally {
      setIsGeneratingUrls(false)
    }
  }


  // 保存 Bing Webmaster API 配置
  const handleSaveBingConfig = async () => {
    setIsBingSaving(true)
    try {
      const result = await updateBingConfig({
        isEnabled: bingEnabled,
        apiKey: bingApiKey,
        siteUrl: bingSiteUrl,
      })

      if (result.success) {
        toast.success(result.message)
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('保存配置失败')
    } finally {
      setIsBingSaving(false)
    }
  }

  // 测试 Bing Webmaster API
  const handleTestBingApi = async () => {
    if (!bingApiKey) {
      toast.error('请先填写 API Key')
      return
    }

    if (!bingSiteUrl) {
      toast.error('请先填写 Site URL')
      return
    }

    setIsBingTesting(true)
    try {
      const result = await testBingApi({
        apiKey: bingApiKey,
        siteUrl: bingSiteUrl,
        testUrl: bingTestUrl || undefined,
      })

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('API 测试失败')
    } finally {
      setIsBingTesting(false)
    }
  }

  // URL 推送页面：根据筛选条件过滤提交记录
  const pushFilteredSubmissions = submissions.filter((s) => {
    // 提交状态筛选
    if (pushSubmitFilter === 'not_submitted' && s.bingSubmitStatus !== null) return false
    if (pushSubmitFilter === 'submitted' && s.bingSubmitStatus === null) return false

    // 收录状态筛选
    if (pushIndexFilter === 'not_indexed' && s.indexedByBing !== false) return false
    if (pushIndexFilter === 'indexed' && s.indexedByBing !== true) return false

    // 语言筛选
    if (pushLocaleFilter !== 'all' && s.locale !== pushLocaleFilter) return false

    // 类型筛选
    if (pushTypeFilter !== 'all' && s.urlType !== pushTypeFilter) return false

    return true
  })

  // URL 推送页面：分页数据
  const pushPaginatedSubmissions = pushFilteredSubmissions.slice(
    (pushCurrentPage - 1) * pushPageSize,
    pushCurrentPage * pushPageSize
  )

  // URL 推送页面：总页数
  const pushTotalPages = Math.ceil(pushFilteredSubmissions.length / pushPageSize)

  // URL 推送页面：处理全选/取消全选
  const handlePushSelectAll = (checked: boolean) => {
    if (checked) {
      setPushSelectedIds(pushPaginatedSubmissions.map((s) => s.id))
    } else {
      setPushSelectedIds([])
    }
  }

  // URL 推送页面：处理单个复选框
  const handlePushSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setPushSelectedIds([...pushSelectedIds, id])
    } else {
      setPushSelectedIds(pushSelectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  // URL 推送页面：批量推送选中的 URL
  const handlePushBatchSubmit = async () => {
    if (pushSelectedIds.length === 0) {
      toast.error('请选择要推送的 URL')
      return
    }

    setIsSubmitting(true)
    setPushingBatchIds(pushSelectedIds) // 标记正在批量推送的 IDs
    try {
      // 直接传递选中的 submission IDs
      const result = await submitBingUrlsDirect(pushSelectedIds)

      if (result.success) {
        toast.success(result.message)
        // 清空选中
        setPushSelectedIds([])
        setPushingBatchIds([])
        // 刷新页面
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '推送失败')
    } finally {
      setIsSubmitting(false)
      setPushingBatchIds([]) // 清空批量推送标记
    }
  }

  // URL 推送页面：单独推送一个 URL
  const handlePushSingleSubmit = async (submissionId: string) => {
    setPushingSingleId(submissionId)
    try {
      const result = await submitBingUrlsDirect([submissionId])

      if (result.success) {
        toast.success(result.message)
        // 刷新页面
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '推送失败')
    } finally {
      setPushingSingleId(null)
    }
  }

  // URL 推送页面：批量检查选中的 URL 收录状态
  const handlePushBatchCheck = async () => {
    if (pushSelectedIds.length === 0) {
      toast.error('请选择要检查的 URL')
      return
    }

    // 限制一次最多检查 20 个
    const toCheckIds = pushSelectedIds.slice(0, 20)
    const confirmed = window.confirm(
      `确定要检查 ${toCheckIds.length} 个 URL 的收录状态吗？\n\n这将调用 Bing Webmaster API 进行批量检查。`
    )

    if (!confirmed) return

    try {
      setIsBatchChecking(true)
      toast.info(`正在检查 ${toCheckIds.length} 个 URL...`)

      const result = await checkBingIndexBatch(toCheckIds)

      if (result.success) {
        toast.success(result.message)
        setPushSelectedIds([])
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('批量检查失败，请稍后重试')
    } finally {
      setIsBatchChecking(false)
    }
  }


  return (
    <>
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">总 URL 数</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mb-3">
              提交到 IndexNow
            </p>
            <Button
              onClick={handleGenerateAllUrls}
              disabled={isGeneratingUrls}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {isGeneratingUrls ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  {stats.total === 0 ? '生成 URL 列表' : '更新 URL 列表'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">已收录</div>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.indexed}</div>
            <p className="text-xs text-muted-foreground">
              收录率: {stats.indexRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">未收录</div>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.notIndexed}</div>
            <p className="text-xs text-muted-foreground">
              需要优化 SEO
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">未检查</div>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.unchecked}</div>
            <p className="text-xs text-muted-foreground">
              等待检查
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="check" className="space-y-6">
        <TabsList>
          <TabsTrigger value="check">
            <FileText className="h-4 w-4 mr-2" />
            收录检查
          </TabsTrigger>
          <TabsTrigger value="submit">
            <Send className="h-4 w-4 mr-2" />
            URL 推送
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            配置管理
          </TabsTrigger>
        </TabsList>

      {/* 收录检查 Tab */}
      <TabsContent value="check" className="space-y-6">
        {/* 批量操作栏 */}
        {selectedIds.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedIds.length} 个 URL
                </span>
                <Button
                  onClick={handleBatchCheck}
                  disabled={isBatchChecking}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isBatchChecking ? 'animate-spin' : ''}`} />
                  批量检查收录
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 提交记录表格 */}
        <Card>
          <CardHeader>
            <CardTitle>提交记录</CardTitle>
            <CardDescription>
              查看通过 IndexNow 推送到 Bing 的 URL 和收录状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <div className="flex items-center gap-4 mb-4">
                <TabsList>
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="indexed">已收录</TabsTrigger>
                  <TabsTrigger value="not-indexed">未收录</TabsTrigger>
                  <TabsTrigger value="unchecked">未检查</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 ml-auto">
                  <Select value={localeFilter} onValueChange={setLocaleFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="语言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部语言</SelectItem>
                      {availableLocales.map((locale) => (
                        <SelectItem key={locale} value={locale || ''}>
                          {locale?.toUpperCase() || '未知'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      {availableTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeNames[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value={filter} className="mt-0">
                {filteredSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="mb-2">暂无提交记录</p>
                    <p className="text-sm">
                      请先到"URL 推送"标签页提交 URL
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.length === filteredSubmissions.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>语言</TableHead>
                        <TableHead>收录状态</TableHead>
                        <TableHead>详细状态</TableHead>
                        <TableHead>收录时间</TableHead>
                        <TableHead>最后检查</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(submission.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(submission.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-md truncate">
                            <a
                              href={submission.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {submission.url}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {typeNames[submission.urlType] || submission.urlType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {submission.locale?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {submission.indexedByBing === true ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                已收录
                              </Badge>
                            ) : submission.indexedByBing === false ? (
                              <Badge className="bg-red-100 text-red-700">
                                <XCircle className="h-3 w-3 mr-1" />
                                未收录
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700">
                                <Clock className="h-3 w-3 mr-1" />
                                未检查
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {/* 只在有 API 响应数据时显示详细状态 */}
                            {submission.bingIndexStatusRaw ? (
                              <Dialog>
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                        >
                                          <Info className="h-3 w-3 mr-1" />
                                          详细
                                        </Button>
                                      </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs bg-white text-gray-900 border-gray-200 shadow-lg">
                                      <div className="space-y-1 text-xs">
                                        <div><span className="font-semibold">最后抓取:</span> {submission.bingIndexStatusRaw.LastCrawledDate ? new Date(submission.bingIndexStatusRaw.LastCrawledDate).toLocaleDateString('zh-CN') : '-'}</div>
                                        <div><span className="font-semibold">发现日期:</span> {submission.bingIndexStatusRaw.DiscoveryDate ? new Date(submission.bingIndexStatusRaw.DiscoveryDate).toLocaleDateString('zh-CN') : '-'}</div>
                                        <div><span className="font-semibold">HTTP状态:</span> {submission.bingIndexStatusRaw.HttpStatus || '-'}</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Bing 收录详细状态</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* URL */}
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">URL</div>
                                        <div className="text-sm text-gray-600 break-all">{submission.url}</div>
                                      </div>

                                      {/* 最后抓取时间 */}
                                      {submission.bingIndexStatusRaw.LastCrawledDate && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">最后抓取时间 (Last Crawled Date)</div>
                                          <div className="text-sm text-gray-700">
                                            {new Date(submission.bingIndexStatusRaw.LastCrawledDate).toLocaleString('zh-CN')}
                                          </div>
                                        </div>
                                      )}

                                      {/* 发现日期 */}
                                      {submission.bingIndexStatusRaw.DiscoveryDate && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">发现日期 (Discovery Date)</div>
                                          <div className="text-sm text-gray-700">
                                            {new Date(submission.bingIndexStatusRaw.DiscoveryDate).toLocaleString('zh-CN')}
                                          </div>
                                        </div>
                                      )}

                                      {/* HTTP 状态码 */}
                                      {submission.bingIndexStatusRaw.HttpStatus && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">HTTP 状态码 (HTTP Status)</div>
                                          <div className="text-sm text-gray-700">
                                            {submission.bingIndexStatusRaw.HttpStatus}
                                          </div>
                                        </div>
                                      )}

                                      {/* 文档大小 */}
                                      {submission.bingIndexStatusRaw.DocumentSize && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">文档大小 (Document Size)</div>
                                          <div className="text-sm text-gray-700">
                                            {(submission.bingIndexStatusRaw.DocumentSize / 1024).toFixed(2)} KB
                                          </div>
                                        </div>
                                      )}

                                      {/* 锚文本数量 */}
                                      {submission.bingIndexStatusRaw.AnchorCount !== undefined && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">锚文本数量 (Anchor Count)</div>
                                          <div className="text-sm text-gray-700">
                                            {submission.bingIndexStatusRaw.AnchorCount}
                                          </div>
                                        </div>
                                      )}

                                      {/* 子 URL 数量 */}
                                      {submission.bingIndexStatusRaw.TotalChildUrlCount !== undefined && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">子 URL 数量 (Total Child URL Count)</div>
                                          <div className="text-sm text-gray-700">
                                            {submission.bingIndexStatusRaw.TotalChildUrlCount}
                                          </div>
                                        </div>
                                      )}

                                      {/* 是否为页面 */}
                                      {submission.bingIndexStatusRaw.IsPage !== undefined && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">是否为页面 (Is Page)</div>
                                          <div className="text-sm text-gray-700">
                                            {submission.bingIndexStatusRaw.IsPage ? '是' : '否'}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {submission.bingIndexedAt
                              ? new Date(submission.bingIndexedAt).toLocaleDateString('zh-CN')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {submission.bingLastCheckAt
                              ? new Date(submission.bingLastCheckAt).toLocaleDateString('zh-CN')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCheckOne(submission.id)}
                              disabled={checkingIds.has(submission.id)}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${checkingIds.has(submission.id) ? 'animate-spin' : ''}`} />
                              检查
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* URL 推送 Tab */}
      <TabsContent value="submit" className="space-y-6">
        {/* 批量操作栏 */}
        {pushSelectedIds.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已选择 {pushSelectedIds.length} 个 URL
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePushBatchSubmit}
                    size="sm"
                    disabled={isSubmitting || isBatchChecking}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        推送中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        批量推送
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handlePushBatchCheck}
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting || isBatchChecking}
                  >
                    {isBatchChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        检查中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        批量检查收录
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* URL 列表 */}
        <Card>
          <CardHeader>
            <CardTitle>URL 推送列表</CardTitle>
            <CardDescription>
              选择 URL 并推送到 Bing（通过 IndexNow 协议）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 筛选器 */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">提交状态:</span>
                <Select value={pushSubmitFilter} onValueChange={setPushSubmitFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_submitted">未提交</SelectItem>
                    <SelectItem value="submitted">已提交</SelectItem>
                    <SelectItem value="all">全部</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">收录状态:</span>
                <Select value={pushIndexFilter} onValueChange={setPushIndexFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_indexed">未收录</SelectItem>
                    <SelectItem value="indexed">已收录</SelectItem>
                    <SelectItem value="all">全部</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">语言:</span>
                <Select value={pushLocaleFilter} onValueChange={setPushLocaleFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部语言</SelectItem>
                    {availableLocales.map((locale) => (
                      <SelectItem key={locale} value={locale || ''}>
                        {locale?.toUpperCase() || '未知'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">类型:</span>
                <Select value={pushTypeFilter} onValueChange={setPushTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeNames[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-medium">每页:</span>
                <Select
                  value={pushPageSize.toString()}
                  onValueChange={(v) => {
                    setPushPageSize(Number(v))
                    setPushCurrentPage(1) // 重置到第一页
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 条</SelectItem>
                    <SelectItem value="50">50 条</SelectItem>
                    <SelectItem value="100">100 条</SelectItem>
                    <SelectItem value="200">200 条</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="text-sm text-muted-foreground mb-4">
              共 {pushFilteredSubmissions.length} 个 URL，显示第 {pushPaginatedSubmissions.length > 0 ? (pushCurrentPage - 1) * pushPageSize + 1 : 0} - {Math.min(pushCurrentPage * pushPageSize, pushFilteredSubmissions.length)} 条
            </div>

            {/* URL 表格 */}
            {pushPaginatedSubmissions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">没有符合条件的 URL</p>
                <p className="text-sm">尝试调整筛选条件</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={pushSelectedIds.length === pushPaginatedSubmissions.length && pushPaginatedSubmissions.length > 0}
                          onCheckedChange={handlePushSelectAll}
                        />
                      </TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>语言</TableHead>
                      <TableHead>提交状态</TableHead>
                      <TableHead>收录状态</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pushPaginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <Checkbox
                            checked={pushSelectedIds.includes(submission.id)}
                            onCheckedChange={(checked) =>
                              handlePushSelectOne(submission.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-md truncate">
                          <a
                            href={submission.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-blue-600"
                          >
                            {submission.url}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeNames[submission.urlType] || submission.urlType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {submission.locale?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {submission.bingSubmitStatus ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              已提交
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">
                              <Clock className="h-3 w-3 mr-1" />
                              未提交
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {submission.indexedByBing === true ? (
                            <Badge className="bg-green-100 text-green-700 whitespace-nowrap">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              已收录
                            </Badge>
                          ) : submission.indexedByBing === false ? (
                            <Badge className="bg-red-100 text-red-700 whitespace-nowrap">
                              <XCircle className="h-3 w-3 mr-1" />
                              未收录
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 whitespace-nowrap">
                              <Clock className="h-3 w-3 mr-1" />
                              未检查
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {submission.bingSubmitStatus
                            ? new Date(submission.createdAt).toLocaleDateString('zh-CN')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePushSingleSubmit(submission.id)}
                            disabled={pushingSingleId !== null || pushingBatchIds.length > 0}
                            className="h-8"
                          >
                            {pushingSingleId === submission.id || pushingBatchIds.includes(submission.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                推送
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分页控制 */}
                {pushTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      第 {pushCurrentPage} 页，共 {pushTotalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPushCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={pushCurrentPage === 1}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPushCurrentPage((p) => Math.min(pushTotalPages, p + 1))}
                        disabled={pushCurrentPage === pushTotalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* 配置管理 Tab */}
      <TabsContent value="config" className="space-y-6">
        {/* 提示信息 */}
        <Alert>
          <AlertDescription>
            配置 Bing Webmaster Tools API 可以启用官方的收录检查功能，获取准确的索引数据。如果不配置 API，系统将使用简单的网页爬取方式检查收录（准确性较低，可能被反爬虫限制）。
          </AlertDescription>
        </Alert>

        {/* Bing Webmaster Tools API 配置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bing Webmaster Tools API</CardTitle>
                <CardDescription>
                  使用官方 Webmaster Tools API 检查 URL 收录状态
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="bing-enabled">启用</Label>
                <Switch
                  id="bing-enabled"
                  checked={bingEnabled}
                  onCheckedChange={setBingEnabled}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bing-site-url">Site URL</Label>
              <Input
                id="bing-site-url"
                placeholder="https://example.com"
                value={bingSiteUrl}
                onChange={(e) => setBingSiteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                您在{' '}
                <a
                  href="https://www.bing.com/webmasters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Bing Webmaster Tools
                </a>{' '}
                中验证的网站 URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bing-api-key">API Key</Label>
              <Input
                id="bing-api-key"
                type="password"
                placeholder="输入 Bing Webmaster API Key"
                value={bingApiKey}
                onChange={(e) => setBingApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                从{' '}
                <a
                  href="https://www.bing.com/webmasters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Bing Webmaster Tools
                </a>{' '}
                的 Settings &gt; API Access 中获取 API Key
              </p>
            </div>

            {/* 测试 API */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="bing-test-url">测试 URL (可选)</Label>
              <div className="flex gap-2">
                <Input
                  id="bing-test-url"
                  placeholder="https://example.com (留空使用 bing.com)"
                  value={bingTestUrl}
                  onChange={(e) => setBingTestUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleTestBingApi}
                  disabled={isBingTesting || !bingApiKey}
                >
                  {isBingTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      测试中
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      测试 API
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveBingConfig} disabled={isBingSaving}>
                {isBingSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中
                  </>
                ) : (
                  '保存配置'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Bing Webmaster Tools API</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>访问 <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Bing Webmaster Tools</a></li>
                <li>添加并验证您的网站</li>
                <li>进入 Settings &gt; API Access</li>
                <li>接受条款并点击 "Generate API Key"</li>
                <li>复制 API Key 和您的 Site URL</li>
                <li>在上方填写 Site URL 和 API Key，测试后保存</li>
              </ol>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>重要提示：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>使用官方 Webmaster Tools API，数据更准确可靠</li>
                  <li>API Key 会加密存储在数据库中</li>
                  <li>一个用户只能生成一个 API Key，可用于所有已验证的网站</li>
                  <li>如果 API Key 泄露，请删除并重新生成</li>
                  <li>如果不配置 API，系统会使用简单爬取方式（准确性较低）</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* IndexNow 配置信息 */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bing IndexNow 配置
              </CardTitle>
              <CardDescription>使用 IndexNow 协议主动推送 URL 到 Bing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">状态</span>
                  <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                    {config.isEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>

                {config.apiKey && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">IndexNow Key</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {config.apiKey.substring(0, 16)}...
                    </code>
                  </div>
                )}

                {config.apiEndpoint && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Endpoint</span>
                    <a
                      href={config.apiEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      查看文档
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">关于 IndexNow</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• IndexNow 是一个开放协议，允许网站主动通知搜索引擎</li>
                    <li>• 提交的 URL 会同步到多个搜索引擎：Bing、Yandex、Seznam、Naver</li>
                    <li>• 推荐批量提交 100-500 个 URL，最多支持 10,000 个</li>
                    <li>• 主动推送可以加快收录速度</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
    </>
  )
}
