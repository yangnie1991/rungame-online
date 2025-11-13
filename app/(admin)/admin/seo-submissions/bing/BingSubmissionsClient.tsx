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
import { CheckCircle2, XCircle, Clock, RefreshCw, Settings, ExternalLink, Send, FileText, Loader2, Plus, TestTube, Info } from 'lucide-react'
import { checkBingIndexStatus, checkBingIndexBatch } from '../index-check-actions'
import { submitBingUrls } from '../submit-engine-actions'
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

  // Submit tab 状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPageTypes, setSelectedPageTypes] = useState<string[]>([])

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

  // 提交到 Bing (IndexNow)
  const handleSubmitBing = async () => {
    const totalSelected =
      selectedGames.length +
      selectedCategories.length +
      selectedTags.length +
      selectedPageTypes.length

    if (totalSelected === 0) {
      toast.error('请至少选择一个内容')
      return
    }

    try {
      setIsSubmitting(true)
      toast.info('正在推送到 Bing...')

      const result = await submitBingUrls({
        games: selectedGames,
        categories: selectedCategories,
        tags: selectedTags,
        pageTypes: selectedPageTypes,
      })

      if (result.success) {
        toast.success(result.message)
        // 清空选择
        setSelectedGames([])
        setSelectedCategories([])
        setSelectedTags([])
        setSelectedPageTypes([])
        // 刷新页面
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('推送失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
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

  // 批量更新已收录 URL 的收录状态
  const handleBatchCheckIndexed = async () => {
    const indexedSubmissions = submissions.filter((s) => s.indexedByBing === true)

    if (indexedSubmissions.length === 0) {
      toast.error('没有已收录的 URL 需要检查')
      return
    }

    const toCheck = indexedSubmissions.slice(0, 20) // 限制一次最多检查 20 个
    const confirmed = window.confirm(
      `确定要重新检查 ${toCheck.length} 个已收录 URL 的收录状态吗？\n\n这将调用 Bing Webmaster API 进行批量检查。`
    )

    if (!confirmed) return

    try {
      setIsBatchChecking(true)
      toast.info(`正在检查 ${toCheck.length} 个 URL...`)

      const result = await checkBingIndexBatch(toCheck.map((s) => s.id))

      if (result.success) {
        toast.success(result.message)
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
            {stats.total === 0 && (
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
                    生成中...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-2" />
                    生成 URL 列表
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">已收录</div>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.indexed}</div>
            <p className="text-xs text-muted-foreground mb-3">
              收录率: {stats.indexRate}%
            </p>
            {stats.indexed > 0 && (
              <Button
                onClick={handleBatchCheckIndexed}
                disabled={isBatchChecking}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isBatchChecking ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    批量更新收录
                  </>
                )}
              </Button>
            )}
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
        <Card>
          <CardHeader>
            <CardTitle>URL 推送</CardTitle>
            <CardDescription>
              通过 IndexNow 协议主动推送 URL 到 Bing、Yandex 等搜索引擎
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 选择内容 */}
              <div>
                <h3 className="text-sm font-medium mb-2">选择要推送的内容</h3>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={selectedGames.length > 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const ids = prompt('请输入游戏ID（用逗号分隔）:')
                      if (ids) {
                        setSelectedGames(ids.split(',').map((id) => id.trim()))
                      }
                    }}
                  >
                    游戏 {selectedGames.length > 0 && `(${selectedGames.length})`}
                  </Button>
                  <Button
                    variant={selectedCategories.length > 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const ids = prompt('请输入分类ID（用逗号分隔）:')
                      if (ids) {
                        setSelectedCategories(ids.split(',').map((id) => id.trim()))
                      }
                    }}
                  >
                    分类 {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                  </Button>
                  <Button
                    variant={selectedTags.length > 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const ids = prompt('请输入标签ID（用逗号分隔）:')
                      if (ids) {
                        setSelectedTags(ids.split(',').map((id) => id.trim()))
                      }
                    }}
                  >
                    标签 {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Button>
                  <Button
                    variant={selectedPageTypes.length > 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const ids = prompt('请输入页面ID（用逗号分隔）:')
                      if (ids) {
                        setSelectedPageTypes(ids.split(',').map((id) => id.trim()))
                      }
                    }}
                  >
                    页面 {selectedPageTypes.length > 0 && `(${selectedPageTypes.length})`}
                  </Button>
                </div>
              </div>

              {/* 推送按钮 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">推送到 Bing</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  系统将自动生成所有语言版本的 URL 并通过 IndexNow API 推送到 Bing、Yandex
                  等搜索引擎。推送成功后，这些 URL 会出现在"收录检查"标签页中。
                </p>
                <Button
                  onClick={handleSubmitBing}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      推送中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      开始推送
                      {selectedGames.length +
                        selectedCategories.length +
                        selectedTags.length +
                        selectedPageTypes.length >
                        0 &&
                        ` (${
                          selectedGames.length +
                          selectedCategories.length +
                          selectedTags.length +
                          selectedPageTypes.length
                        } 项)`}
                    </>
                  )}
                </Button>
              </div>

              {/* 说明 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">关于 IndexNow</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• IndexNow 是一个开放协议，允许网站主动通知搜索引擎</li>
                  <li>• 提交的 URL 会同步到多个搜索引擎：Bing、Yandex、Seznam、Naver</li>
                  <li>• 推荐批量提交 100-500 个 URL，最多支持 10,000 个</li>
                  <li>• 主动推送可以加快收录速度，但不保证一定会被收录</li>
                  <li>• 推送后需要一段时间才能看到收录结果，请在"收录检查"中查看</li>
                </ul>
              </div>
            </div>
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
