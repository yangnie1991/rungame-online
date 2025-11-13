/**
 * Google 提交记录客户端组件
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { CheckCircle2, XCircle, Clock, RefreshCw, Settings, ExternalLink, Send, FileText, Copy, Check, Plus, Download, ChevronLeft, ChevronRight, Loader2, TestTube, Info } from 'lucide-react'
import { checkGoogleIndexStatus, checkGoogleIndexBatch } from '../index-check-actions'
import { generateGoogleUrls, markGoogleUrlsAsSubmitted, markGoogleUrlsAsSubmittedByIds, type GeneratedUrl } from '../submit-engine-actions'
import { generateAllUrlsToDatabase } from '../url-management-actions'
import { updateGoogleConfig, testGoogleApi } from '../config-actions'
import { toast } from 'sonner'

interface GoogleConfig {
  id: string
  name: string
  type: string
  isEnabled: boolean
  apiEndpoint: string // Sitemap URL
  siteUrl: string | null
  extraConfig: any // 额外配置（JSON）
}

interface Submission {
  id: string
  url: string
  urlType: string
  locale: string | null
  entityId: string | null
  googleSubmitStatus: string | null
  googleSubmittedAt: Date | null
  indexedByGoogle: boolean | null
  googleIndexedAt: Date | null
  googleLastCheckAt: Date | null
  googleIndexStatusRaw: any | null // Google API 原始响应数据 (JSON)
  createdAt: Date
}

interface GoogleStats {
  total: number
  indexed: number
  notIndexed: number
  unchecked: number
  indexRate: string
}

// Google Search Console API 枚举值中文翻译
const verdictTranslations: Record<string, string> = {
  'VERDICT_UNSPECIFIED': '❓ 未知判定结果',
  'PASS': '✅ 有效 (已收录)',
  'PARTIAL': '⚠️ 部分 (已弃用)',
  'FAIL': '❌ 错误/无效',
  'NEUTRAL': '⊘ 已排除',
}

const indexingStateTranslations: Record<string, string> = {
  'INDEXING_ALLOWED': '允许索引',
  'BLOCKED_BY_META_TAG': '被 meta 标签阻止',
  'BLOCKED_BY_HTTP_HEADER': '被 HTTP 头阻止',
  'BLOCKED_BY_ROBOTS_TXT': '被 robots.txt 阻止',
}

const coverageStateTranslations: Record<string, string> = {
  'Submitted and indexed': '已提交并收录',
  'Crawled - currently not indexed': '已抓取 - 暂未收录',
  'Discovered - currently not indexed': '已发现 - 暂未收录',
  'Page with redirect': '页面重定向',
  'Duplicate without user-selected canonical': '重复页面（无用户指定规范）',
  'Duplicate, Google chose different canonical than user': '重复页面（Google 选择了不同规范）',
  'Not found (404)': '未找到 (404)',
  'Soft 404': '软 404',
  'Blocked by robots.txt': '被 robots.txt 阻止',
  'Blocked due to access forbidden (403)': '被禁止访问 (403)',
  'Blocked due to other 4xx issue': '被其他 4xx 错误阻止',
  'Server error (5xx)': '服务器错误 (5xx)',
}

const pageFetchStateTranslations: Record<string, string> = {
  'SUCCESSFUL': '成功',
  'SOFT_404': '软 404',
  'BLOCKED_ROBOTS_TXT': '被 robots.txt 阻止',
  'NOT_FOUND': '未找到',
  'ACCESS_DENIED': '拒绝访问',
  'SERVER_ERROR': '服务器错误',
  'REDIRECT_ERROR': '重定向错误',
  'ACCESS_FORBIDDEN': '禁止访问',
  'BLOCKED_4XX': '被 4xx 阻止',
  'INTERNAL_CRAWL_ERROR': '内部抓取错误',
  'INVALID_URL': '无效 URL',
}

const robotsTxtStateTranslations: Record<string, string> = {
  'ALLOWED': '允许',
  'DISALLOWED': '不允许',
}

const crawledAsTranslations: Record<string, string> = {
  'DESKTOP': '桌面端',
  'MOBILE': '移动端',
}

// 翻译辅助函数
function translateValue(value: string | undefined, translations: Record<string, string>): string {
  if (!value) return '-'
  return translations[value] || value
}

interface GoogleSubmissionsClientProps {
  config: GoogleConfig | null
  submissions: Submission[]
  stats: GoogleStats
}

const typeNames: Record<string, string> = {
  game: '游戏',
  category: '分类',
  tag: '标签',
  pagetype: '页面',
  other: '其他',
}

export function GoogleSubmissionsClient({ config, submissions: initialSubmissions, stats: initialStats }: GoogleSubmissionsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [stats, setStats] = useState(initialStats)
  const [filter, setFilter] = useState<'all' | 'indexed' | 'not-indexed' | 'unchecked'>('all')
  const [localeFilter, setLocaleFilter] = useState<string>('all') // 语言筛选
  const [typeFilter, setTypeFilter] = useState<string>('all') // 类型筛选
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
  const [isGeneratingUrls, setIsGeneratingUrls] = useState(false)

  // Google API 配置状态
  const [googleAccessToken, setGoogleAccessToken] = useState('')
  const [googleRefreshToken, setGoogleRefreshToken] = useState('')
  const [googleSiteUrl, setGoogleSiteUrl] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [googleTestUrl, setGoogleTestUrl] = useState('')
  const [isGoogleSaving, setIsGoogleSaving] = useState(false)
  const [isGoogleTesting, setIsGoogleTesting] = useState(false)

  // 处理 OAuth 回调的 URL 参数
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success(success)
      // 刷新页面数据以加载新的 Token
      router.refresh()
      // 清除 URL 参数
      router.replace('/admin/seo-submissions/google')
    }

    if (error) {
      toast.error(error)
      // 清除 URL 参数
      router.replace('/admin/seo-submissions/google')
    }
  }, [searchParams, router])

  // 从 config prop 初始化配置表单值
  useEffect(() => {
    if (config) {
      console.log('[Google 配置初始化] 从 config prop 加载配置:', {
        配置ID: config.id,
        isEnabled: config.isEnabled,
        siteUrl: config.siteUrl || '未配置',
        extraConfig存在: !!config.extraConfig,
      })

      // 设置基础配置
      setGoogleEnabled(config.isEnabled)
      setGoogleSiteUrl(config.siteUrl || '')

      // 从 extraConfig 中提取 OAuth 凭据
      if (config.extraConfig && typeof config.extraConfig === 'object') {
        const extraConfig = config.extraConfig as any

        if (extraConfig.accessToken) {
          setGoogleAccessToken(extraConfig.accessToken)
          console.log('[Google 配置初始化] ✅ Access Token 已加载')
        }
        if (extraConfig.refreshToken) {
          setGoogleRefreshToken(extraConfig.refreshToken)
          console.log('[Google 配置初始化] ✅ Refresh Token 已加载')
        }
        if (extraConfig.clientId) {
          setGoogleClientId(extraConfig.clientId)
          console.log('[Google 配置初始化] ✅ Client ID 已加载')
        }
        if (extraConfig.clientSecret) {
          setGoogleClientSecret(extraConfig.clientSecret)
          console.log('[Google 配置初始化] ✅ Client Secret 已加载')
        }
      }
    } else {
      console.log('[Google 配置初始化] ⚠️ config prop 为空')
    }
  }, [config])

  // 重新计算统计数据
  const recalculateStats = (currentSubmissions: Submission[]) => {
    const total = currentSubmissions.length
    const indexed = currentSubmissions.filter(s => s.indexedByGoogle === true).length
    const notIndexed = currentSubmissions.filter(s => s.indexedByGoogle === false).length
    const unchecked = currentSubmissions.filter(s => s.indexedByGoogle === null).length
    const indexRate = total > 0 ? ((indexed / total) * 100).toFixed(1) : '0'

    setStats({
      total,
      indexed,
      notIndexed,
      unchecked,
      indexRate,
    })
  }

  // URL 推送页面状态
  const [pushSubmitFilter, setPushSubmitFilter] = useState<string>('not_submitted') // 提交状态筛选：not_submitted, submitted, all
  const [pushIndexFilter, setPushIndexFilter] = useState<string>('not_indexed') // 收录状态筛选：not_indexed, indexed, all
  const [pushLocaleFilter, setPushLocaleFilter] = useState<string>('all') // 语言筛选
  const [pushTypeFilter, setPushTypeFilter] = useState<string>('all') // 类型筛选
  const [pushSelectedIds, setPushSelectedIds] = useState<string[]>([]) // 推送页面选中的IDs
  const [pushCurrentPage, setPushCurrentPage] = useState(1) // 当前页码
  const [pushPageSize, setPushPageSize] = useState(50) // 每页数量

  // 获取所有唯一的语言列表
  const availableLocales = Array.from(new Set(submissions.map(s => s.locale).filter(Boolean)))

  // 获取所有唯一的URL类型列表
  const availableTypes = Array.from(new Set(submissions.map(s => s.urlType)))

  // 根据筛选条件过滤提交记录（收录检查页面）
  const filteredSubmissions = submissions.filter((s) => {
    // 收录状态筛选
    if (filter === 'indexed' && s.indexedByGoogle !== true) return false
    if (filter === 'not-indexed' && s.indexedByGoogle !== false) return false
    if (filter === 'unchecked' && s.indexedByGoogle !== null) return false

    // 语言筛选
    if (localeFilter !== 'all' && s.locale !== localeFilter) return false

    // 类型筛选
    if (typeFilter !== 'all' && s.urlType !== typeFilter) return false

    return true
  })

  // URL 推送页面的筛选逻辑
  const pushFilteredSubmissions = submissions.filter((s) => {
    // 提交状态筛选
    if (pushSubmitFilter === 'not_submitted') {
      // 未提交：googleSubmitStatus 为空或为 null
      if (s.googleSubmitStatus && s.googleSubmitStatus !== 'PENDING') return false
    } else if (pushSubmitFilter === 'submitted') {
      // 已提交：googleSubmitStatus 不为空且不是 PENDING
      if (!s.googleSubmitStatus || s.googleSubmitStatus === 'PENDING') return false
    }
    // 'all' 不做筛选

    // 收录状态筛选
    if (pushIndexFilter === 'not_indexed') {
      // 未收录：indexedByGoogle 为 false 或 null
      if (s.indexedByGoogle === true) return false
    } else if (pushIndexFilter === 'indexed') {
      // 已收录：indexedByGoogle 为 true
      if (s.indexedByGoogle !== true) return false
    }
    // 'all' 不做筛选

    // 语言筛选
    if (pushLocaleFilter !== 'all' && s.locale !== pushLocaleFilter) return false

    // 类型筛选
    if (pushTypeFilter !== 'all' && s.urlType !== pushTypeFilter) return false

    return true
  })

  // 分页逻辑
  const pushTotalPages = Math.ceil(pushFilteredSubmissions.length / pushPageSize)
  const pushPaginatedSubmissions = pushFilteredSubmissions.slice(
    (pushCurrentPage - 1) * pushPageSize,
    pushCurrentPage * pushPageSize
  )

  // 处理全选/取消全选（收录检查页面）
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSubmissions.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  // 处理单个复选框（收录检查页面）
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  // 处理推送页面全选/取消全选
  const handlePushSelectAll = (checked: boolean) => {
    if (checked) {
      setPushSelectedIds(pushPaginatedSubmissions.map((s) => s.id))
    } else {
      setPushSelectedIds([])
    }
  }

  // 处理推送页面单个复选框
  const handlePushSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setPushSelectedIds([...pushSelectedIds, id])
    } else {
      setPushSelectedIds(pushSelectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  // 检查单个 URL
  const handleCheckOne = async (submissionId: string) => {
    try {
      setCheckingIds(prev => new Set([...prev, submissionId]))
      const result = await checkGoogleIndexStatus(submissionId)

      if (result.success) {
        toast.success(result.message)

        // 刷新页面以获取最新的 googleIndexStatusRaw 数据
        router.refresh()

        // 乐观更新：只更新对应的 submission 数据
        setSubmissions(prev => {
          const updated = prev.map(sub =>
            sub.id === submissionId
              ? {
                  ...sub,
                  indexedByGoogle: result.stats?.googleIndexed === 1,
                  googleLastCheckAt: new Date()
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

      const result = await checkGoogleIndexBatch(selectedIds)

      if (result.success) {
        toast.success(result.message)
        setSelectedIds([])

        // 乐观更新：刷新页面获取最新数据（批量操作较复杂，使用刷新）
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('批量检查失败，请稍后重试')
    } finally {
      setIsBatchChecking(false)
    }
  }

  // 生成所有 URL 到数据库
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
        // 刷新数据显示新数据
        setTimeout(() => router.refresh(), 1500)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('生成失败，请稍后重试')
    } finally {
      setIsGeneratingUrls(false)
    }
  }

  // 批量检查收录状态（针对已收录的）
  const handleBatchCheckIndexed = async () => {
    // 筛选出已收录的 URL
    const indexedSubmissions = submissions.filter((s) => s.indexedByGoogle === true)

    if (indexedSubmissions.length === 0) {
      toast.error('没有已收录的 URL 需要检查')
      return
    }

    // 限制每次最多检查 20 个
    const toCheck = indexedSubmissions.slice(0, 20)
    const confirmed = window.confirm(
      `确定要重新检查 ${toCheck.length} 个已收录 URL 的收录状态吗？\n\n这将调用 Google Search Console API 进行批量检查。`
    )

    if (!confirmed) return

    try {
      setIsBatchChecking(true)
      toast.info(`正在检查 ${toCheck.length} 个 URL...`)

      const result = await checkGoogleIndexBatch(toCheck.map((s) => s.id))

      if (result.success && result.stats) {
        toast.success(
          <div>
            <div className="font-semibold">批量检查完成</div>
            <div className="text-xs mt-1">
              仍收录: {result.stats.stillIndexed} |
              已移除: {result.stats.removed} |
              失败: {result.stats.failed}
            </div>
          </div>
        )
        setTimeout(() => router.refresh(), 1000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('批量检查失败，请稍后重试')
    } finally {
      setIsBatchChecking(false)
    }
  }

  // 推送页面：复制选中的 URLs
  const handlePushCopyUrls = async () => {
    if (pushSelectedIds.length === 0) {
      toast.error('请选择要复制的 URL')
      return
    }

    try {
      // 获取选中的 submissions
      const selectedSubmissions = submissions.filter((s) => pushSelectedIds.includes(s.id))
      const urls = selectedSubmissions.map((s) => s.url).join('\n')

      await navigator.clipboard.writeText(urls)
      toast.success(`已复制 ${pushSelectedIds.length} 个 URL`)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 推送页面：标记选中的 URLs 为已提交
  const handlePushMarkAsSubmitted = async () => {
    if (pushSelectedIds.length === 0) {
      toast.error('请选择要标记的 URL')
      return
    }

    try {
      const result = await markGoogleUrlsAsSubmittedByIds(pushSelectedIds)

      if (result.success) {
        toast.success(result.message)
        setPushSelectedIds([])

        // 乐观更新：更新被标记的 submissions
        setSubmissions(prev => {
          const updated = prev.map(sub =>
            pushSelectedIds.includes(sub.id)
              ? {
                  ...sub,
                  googleSubmitStatus: 'SUBMITTED',
                  googleSubmittedAt: new Date()
                }
              : sub
          )
          return updated
        })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('标记失败，请稍后重试')
    }
  }

  // 推送页面：复制单个 URL
  const handlePushCopyOneUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('已复制 URL')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 推送页面：标记单个 URL 为已提交
  const handlePushMarkOneAsSubmitted = async (submissionId: string) => {
    try {
      const result = await markGoogleUrlsAsSubmittedByIds([submissionId])

      if (result.success) {
        toast.success('已标记为已提交')

        // 乐观更新：更新单个 submission
        setSubmissions(prev => prev.map(sub =>
          sub.id === submissionId
            ? {
                ...sub,
                googleSubmitStatus: 'SUBMITTED',
                googleSubmittedAt: new Date()
              }
            : sub
        ))
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('标记失败，请稍后重试')
    }
  }

  // 推送页面：检查单个 URL 的收录状态
  const handlePushCheckOneIndex = async (submissionId: string) => {
    try {
      setCheckingIds(prev => new Set([...prev, submissionId]))
      const result = await checkGoogleIndexStatus(submissionId)

      if (result.success) {
        toast.success(result.message)

        // 乐观更新：更新单个 submission 的收录状态
        setSubmissions(prev => {
          const updated = prev.map(sub =>
            sub.id === submissionId
              ? {
                  ...sub,
                  indexedByGoogle: result.stats?.googleIndexed === 1,
                  googleLastCheckAt: new Date()
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

  // 保存 Google API 配置
  const handleSaveGoogleConfig = async () => {
    setIsGoogleSaving(true)
    try {
      const result = await updateGoogleConfig({
        isEnabled: googleEnabled,
        accessToken: googleAccessToken,
        refreshToken: googleRefreshToken,
        siteUrl: googleSiteUrl,
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('保存配置失败')
    } finally {
      setIsGoogleSaving(false)
    }
  }

  // 测试 Google API
  const handleTestGoogleApi = async () => {
    if (!googleAccessToken) {
      toast.error('请先填写 Access Token')
      return
    }
    if (!googleSiteUrl) {
      toast.error('请先填写 Site URL')
      return
    }

    setIsGoogleTesting(true)
    try {
      const result = await testGoogleApi({
        accessToken: googleAccessToken,
        siteUrl: googleSiteUrl,
        testUrl: googleTestUrl || undefined,
      })

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('API 测试失败')
    } finally {
      setIsGoogleTesting(false)
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
              提交到 Google Sitemap
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
              查看提交到 Google Sitemap 的 URL 和收录状态
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
                          <TableCell className="font-mono text-xs max-w-xs truncate">
                            <a
                              href={submission.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              title={submission.url}
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
                            {submission.indexedByGoogle === true ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                已收录
                              </Badge>
                            ) : submission.indexedByGoogle === false ? (
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
                            {/* 只在未收录时显示详细状态 */}
                            {submission.indexedByGoogle === false && submission.googleIndexStatusRaw ? (
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
                                        <div><span className="font-semibold">判定结果:</span> {translateValue(submission.googleIndexStatusRaw.verdict, verdictTranslations)}</div>
                                        <div><span className="font-semibold">索引状态:</span> {translateValue(submission.googleIndexStatusRaw.indexingState, indexingStateTranslations)}</div>
                                        <div><span className="font-semibold">覆盖状态:</span> {translateValue(submission.googleIndexStatusRaw.coverageState, coverageStateTranslations)}</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Google 收录详细状态</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* URL */}
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">URL</div>
                                        <div className="text-sm text-gray-600 break-all">{submission.url}</div>
                                      </div>

                                      {/* Verdict */}
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">判定结果 (Verdict)</div>
                                        <div className="text-sm text-gray-700">
                                          {translateValue(submission.googleIndexStatusRaw.verdict, verdictTranslations)}
                                        </div>
                                      </div>

                                      {/* Indexing State */}
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">索引状态 (Indexing State)</div>
                                        <div className="text-sm text-gray-700">
                                          {translateValue(submission.googleIndexStatusRaw.indexingState, indexingStateTranslations)}
                                        </div>
                                      </div>

                                      {/* Coverage State */}
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">覆盖状态 (Coverage State)</div>
                                        <div className="text-sm text-gray-700">
                                          {translateValue(submission.googleIndexStatusRaw.coverageState, coverageStateTranslations)}
                                        </div>
                                      </div>

                                      {/* Page Fetch State */}
                                      {submission.googleIndexStatusRaw.pageFetchState && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">页面抓取状态 (Page Fetch State)</div>
                                          <div className="text-sm text-gray-700">
                                            {translateValue(submission.googleIndexStatusRaw.pageFetchState, pageFetchStateTranslations)}
                                          </div>
                                        </div>
                                      )}

                                      {/* Robots.txt State */}
                                      {submission.googleIndexStatusRaw.robotsTxtState && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">Robots.txt 状态 (Robots.txt State)</div>
                                          <div className="text-sm text-gray-700">
                                            {translateValue(submission.googleIndexStatusRaw.robotsTxtState, robotsTxtStateTranslations)}
                                          </div>
                                        </div>
                                      )}

                                      {/* Last Crawl Time */}
                                      {submission.googleIndexStatusRaw.lastCrawlTime && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">最后抓取时间 (Last Crawl Time)</div>
                                          <div className="text-sm text-gray-700">
                                            {new Date(submission.googleIndexStatusRaw.lastCrawlTime).toLocaleString('zh-CN')}
                                          </div>
                                        </div>
                                      )}

                                      {/* Crawled As */}
                                      {submission.googleIndexStatusRaw.crawledAs && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">抓取身份 (Crawled As)</div>
                                          <div className="text-sm text-gray-700">
                                            {translateValue(submission.googleIndexStatusRaw.crawledAs, crawledAsTranslations)}
                                          </div>
                                        </div>
                                      )}

                                      {/* Referring URLs */}
                                      {submission.googleIndexStatusRaw.referringUrls && submission.googleIndexStatusRaw.referringUrls.length > 0 && (
                                        <div>
                                          <div className="font-semibold text-sm text-gray-900">Referring URLs (引用链接)</div>
                                          <div className="text-sm text-gray-700 space-y-1">
                                            {submission.googleIndexStatusRaw.referringUrls.map((url: string, idx: number) => (
                                              <div key={idx} className="break-all">{url}</div>
                                            ))}
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
                            {submission.googleIndexedAt
                              ? new Date(submission.googleIndexedAt).toLocaleDateString('zh-CN')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {submission.googleLastCheckAt
                              ? new Date(submission.googleLastCheckAt).toLocaleDateString('zh-CN')
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
                    onClick={handlePushCopyUrls}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    复制选中链接
                  </Button>
                  <Button
                    onClick={handlePushMarkAsSubmitted}
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    标记为已提交
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
              选择 URL 并复制后，前往 Google Search Console 手动提交
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
                          checked={pushSelectedIds.length === pushPaginatedSubmissions.length}
                          onCheckedChange={handlePushSelectAll}
                        />
                      </TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>语言</TableHead>
                      <TableHead>提交状态</TableHead>
                      <TableHead>收录状态</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
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
                          {submission.googleSubmitStatus === 'SUBMITTED' || submission.googleSubmitStatus === 'SUCCESS' ? (
                            <Badge className="bg-blue-100 text-blue-700">
                              已提交
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              未提交
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.indexedByGoogle === true ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              已收录
                            </Badge>
                          ) : submission.indexedByGoogle === false ? (
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
                        <TableCell className="text-xs text-muted-foreground">
                          {submission.googleSubmittedAt
                            ? new Date(submission.googleSubmittedAt).toLocaleDateString('zh-CN')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handlePushCopyOneUrl(submission.url)}
                              size="sm"
                              variant="ghost"
                              title="复制 URL"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handlePushMarkOneAsSubmitted(submission.id)}
                              size="sm"
                              variant="ghost"
                              title="标记为已提交"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handlePushCheckOneIndex(submission.id)}
                              disabled={checkingIds.has(submission.id)}
                              size="sm"
                              variant="ghost"
                              title="检查收录状态"
                            >
                              <RefreshCw className={`h-4 w-4 ${checkingIds.has(submission.id) ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分页控件 */}
                {pushTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      第 {pushCurrentPage} / {pushTotalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPushCurrentPage(pushCurrentPage - 1)}
                        disabled={pushCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPushCurrentPage(pushCurrentPage + 1)}
                        disabled={pushCurrentPage === pushTotalPages}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium mb-2">提交步骤</h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. 使用筛选器筛选要提交的 URL（默认显示未提交且未收录的 URL）</li>
              <li>2. 选中要提交的 URL，点击"复制选中链接"</li>
              <li>
                3. 前往{' '}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Search Console
                </a>{' '}
                手动提交
              </li>
              <li>4. 提交完成后，点击"标记为已提交"按钮</li>
            </ol>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 配置管理 Tab */}
      <TabsContent value="config" className="space-y-6">
        {/* 提示信息 */}
        <Alert>
          <AlertDescription>
            配置 Google Search Console API 可以启用官方的收录检查功能（每日 2000 次查询配额）。如果不配置 OAuth Token，系统将使用简单的网页爬取方式检查收录（准确性较低，可能被反爬虫限制）。
          </AlertDescription>
        </Alert>

        {/* Google Search Console API 配置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Google Search Console API</CardTitle>
                <CardDescription>
                  使用官方 Search Console URL Inspection API 检查收录状态
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="google-enabled">启用</Label>
                <Switch
                  id="google-enabled"
                  checked={googleEnabled}
                  onCheckedChange={setGoogleEnabled}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-site-url">Site URL</Label>
              <Input
                id="google-site-url"
                placeholder="https://example.com"
                value={googleSiteUrl}
                onChange={(e) => setGoogleSiteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                在 Google Search Console 中验证的网站 URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-access-token">OAuth Access Token</Label>
              <Input
                id="google-access-token"
                type="password"
                placeholder="ya29.a0AfH6SMB..."
                value={googleAccessToken}
                onChange={(e) => setGoogleAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                OAuth 2.0 访问令牌（需要 webmasters 或 webmasters.readonly 权限）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-refresh-token">OAuth Refresh Token</Label>
              <Input
                id="google-refresh-token"
                type="password"
                placeholder="1//0gJRnKz..."
                value={googleRefreshToken}
                onChange={(e) => setGoogleRefreshToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                用于自动刷新过期的 Access Token（强烈推荐填写）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-client-id">OAuth Client ID</Label>
              <Input
                id="google-client-id"
                type="password"
                placeholder="613565854284-xxx.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                从 Google Cloud Console 创建的 OAuth 2.0 客户端 ID（自动刷新 Token 时需要）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-client-secret">OAuth Client Secret</Label>
              <Input
                id="google-client-secret"
                type="password"
                placeholder="GOCSPX-xxx"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                从 Google Cloud Console 创建的 OAuth 2.0 客户端密钥（自动刷新 Token 时需要）
              </p>
            </div>

            {/* 一键授权按钮 */}
            <div className="space-y-2 pt-4 border-t">
              <Label>快速授权（推荐）</Label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    // 检查是否配置了 Client ID 和 Secret
                    if (!googleClientId || !googleClientSecret) {
                      toast.error('请先填写并保存 OAuth Client ID 和 Client Secret')
                      return
                    }
                    if (!googleSiteUrl) {
                      toast.error('请先填写并保存 Site URL')
                      return
                    }
                    // 重定向到 OAuth 授权端点
                    window.location.href = '/api/auth/google'
                  }}
                  disabled={!googleClientId || !googleClientSecret || !googleSiteUrl}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  一键授权 Google
                </Button>
                <p className="text-xs text-muted-foreground">
                  点击后将跳转到 Google 登录页面完成授权，授权成功后 Access Token 和 Refresh Token 会自动保存（需要先保存 Client ID、Client Secret 和 Site URL）
                </p>
              </div>
            </div>

            {/* 测试 API */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="google-test-url">测试 URL (可选)</Label>
              <div className="flex gap-2">
                <Input
                  id="google-test-url"
                  placeholder="https://example.com/page (留空则测试 Site URL)"
                  value={googleTestUrl}
                  onChange={(e) => setGoogleTestUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleTestGoogleApi}
                  disabled={isGoogleTesting || !googleAccessToken || !googleSiteUrl}
                >
                  {isGoogleTesting ? (
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
              <Button onClick={handleSaveGoogleConfig} disabled={isGoogleSaving}>
                {isGoogleSaving ? (
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
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>Google Search Console API (官方 API)</span>
                <Badge variant="default">推荐使用一键授权</Badge>
              </h4>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">🚀 快速配置（推荐）</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>前往{' '}
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Google Search Console
                    </a>{' '}
                    验证并添加您的网站
                  </li>
                  <li>访问{' '}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Google Cloud Console
                    </a>{' '}
                    创建项目并启用 "Search Console API"
                  </li>
                  <li>配置 OAuth 2.0 客户端 ID（Web 应用程序类型），添加授权回调 URL：<code className="bg-white px-1 py-0.5 rounded text-xs">https://您的域名/api/auth/google/callback</code></li>
                  <li>复制 Client ID 和 Client Secret，填写上方表单中的 Site URL、Client ID、Client Secret</li>
                  <li>点击"保存配置"，然后点击"<strong>一键授权 Google</strong>"按钮</li>
                  <li>在 Google 登录页面完成授权，系统会自动保存 Token</li>
                </ol>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                  手动配置（高级用户）
                </summary>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2 ml-4">
                  <li>使用{' '}
                    <a
                      href="https://developers.google.com/oauthplayground"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      OAuth 2.0 Playground
                    </a>{' '}
                    手动获取 Access Token 和 Refresh Token（需要 <code>webmasters</code> 或 <code>webmasters.readonly</code> 权限）
                  </li>
                  <li>在上方表单中手动填写所有字段（Site URL、Access Token、Refresh Token、Client ID、Client Secret）</li>
                  <li>点击"测试 API"验证配置，然后点击"保存配置"</li>
                </ol>
              </details>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>自动刷新 Token（推荐配置）：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>填写 Refresh Token + Client ID + Client Secret</strong>：系统会使用 Google 官方 SDK 自动刷新过期的 Access Token，无需手动更新</li>
                  <li><strong>仅填写 Access Token</strong>：Token 过期后（通常 1 小时）需要手动重新获取并更新</li>
                  <li>自动刷新使用 <code>googleapis</code> npm 包，Token 刷新后会自动更新到数据库</li>
                  <li>首次配置时，建议从 OAuth Playground 获取完整的 Tokens（包含 Refresh Token）</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>重要提示：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>使用官方 Search Console API，准确性高于搜索方式</li>
                  <li>每日查询配额：2000 次（超出后会自动降级到简单搜索方式）</li>
                  <li>OAuth 令牌和客户端凭据会加密存储在数据库的 extraConfig 字段中</li>
                  <li>如果不配置 API，系统会使用简单爬取方式（准确性较低，可能被反爬虫限制）</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Sitemap 配置信息 */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Google Sitemap 配置
              </CardTitle>
              <CardDescription>自动生成和提交 Sitemap 到 Google</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">状态</span>
                  <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                    {config.isEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>

                {config.apiEndpoint && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sitemap URL</span>
                    <a
                      href={config.apiEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      查看 Sitemap
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">说明</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sitemap 会自动包含所有已发布的游戏、分类、标签和页面</li>
                    <li>• Google 会定期抓取 Sitemap 并更新索引</li>
                    <li>• 在 Search Console 中提交 Sitemap URL 可以加快收录</li>
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
