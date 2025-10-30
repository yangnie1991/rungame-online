'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle2, XCircle, Loader2, AlertTriangle, CloudDownload, RefreshCw, Download } from 'lucide-react'

type SyncMode = 'full' | 'incremental'

interface SyncProgressUpdate {
  currentPage: number
  totalPages: number
  processedGames: number
  newGames: number
  updatedGames: number
  currentStep: string
  estimatedTotal?: number
}

interface SyncProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 同步配置
  config: {
    siteId: string
    orderBy?: 'quality' | 'published'
  }
  // 完成回调
  onComplete?: () => void
}

export function SyncProgressDialog({
  open,
  onOpenChange,
  config,
  onComplete,
}: SyncProgressDialogProps) {
  // 同步状态
  const [status, setStatus] = useState<'ready' | 'syncing' | 'success' | 'failed'>('ready')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 同步模式
  const [syncMode, setSyncMode] = useState<SyncMode>('incremental')

  // 结果数据
  const [result, setResult] = useState<{
    totalSynced?: number
    newGames?: number
    updatedGames?: number
    syncDuration?: number
    error?: string
  }>({})

  // API 总游戏数
  const [estimatedTotal, setEstimatedTotal] = useState<number>(0)
  // 总页数
  const [totalPages, setTotalPages] = useState<number>(0)

  // EventSource ref
  const eventSourceRef = useRef<EventSource | null>(null)

  // 重置状态
  useEffect(() => {
    if (open) {
      setStatus('ready')
      setProgress(0)
      setCurrentStep('')
      setStartTime(0)
      setElapsedTime(0)
      setResult({})
      setEstimatedTotal(0)
      setTotalPages(0)
      setSyncMode('incremental')
    } else {
      // 关闭弹窗时清理 EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [open])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'syncing' && startTime > 0) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status, startTime])

  // 开始同步 - 使用 SSE
  const handleStartSync = async () => {
    setStatus('syncing')
    setProgress(0)
    setStartTime(Date.now())
    setCurrentStep('正在准备同步...')
    setResult({})

    try {
      // 创建 EventSource 连接到 SSE 端点
      const url = new URL('/api/gamepix/sync-stream', window.location.origin)
      url.searchParams.set('siteId', config.siteId)
      url.searchParams.set('mode', syncMode)
      url.searchParams.set('orderBy', config.orderBy || 'quality')

      const eventSource = new EventSource(url.toString())
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // 检查事件类型
          if (data.type === 'complete') {
            // 同步完成
            setStatus('success')
            setResult({
              totalSynced: data.data.totalSynced,
              newGames: data.data.newGames,
              updatedGames: data.data.updatedGames,
              syncDuration: data.data.syncDuration,
            })
            setProgress(100)
            eventSource.close()
            eventSourceRef.current = null
            onComplete?.()
          } else if (data.type === 'error') {
            // 同步失败
            setStatus('failed')
            setResult({ error: data.error })
            eventSource.close()
            eventSourceRef.current = null
          } else {
            // 进度更新
            const progressUpdate = data as SyncProgressUpdate

            setCurrentStep(progressUpdate.currentStep)
            setResult(prev => ({
              ...prev,
              totalSynced: progressUpdate.processedGames,
              newGames: progressUpdate.newGames,
              updatedGames: progressUpdate.updatedGames,
            }))

            if (progressUpdate.totalPages > 0) {
              setTotalPages(progressUpdate.totalPages)
              const progressPercent = Math.round((progressUpdate.currentPage / progressUpdate.totalPages) * 100)
              setProgress(progressPercent)
            }

            if (progressUpdate.estimatedTotal !== undefined) {
              setEstimatedTotal(progressUpdate.estimatedTotal)
            }
          }
        } catch (error) {
          console.error('解析 SSE 消息失败:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE 连接错误:', error)
        setStatus('failed')
        setResult({ error: '连接中断，同步失败' })
        eventSource.close()
        eventSourceRef.current = null
      }
    } catch (error) {
      console.error('同步失败:', error)
      setStatus('failed')
      setResult({
        error: error instanceof Error ? error.message : '同步失败',
      })
    }
  }

  // 取消同步
  const handleCancelSync = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setStatus('failed')
    setResult({ error: '用户取消同步' })
  }

  // 关闭弹窗
  const handleClose = () => {
    if (status === 'syncing') {
      // 同步进行中时，先取消同步
      handleCancelSync()
    }
    onOpenChange(false)
  }

  // 格式化时间
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'syncing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
            {status === 'ready' && <CloudDownload className="h-5 w-5 text-muted-foreground" />}
            <span>
              {status === 'syncing' && '正在同步 GamePix 数据...'}
              {status === 'success' && '同步完成'}
              {status === 'failed' && '同步失败'}
              {status === 'ready' && '同步 GamePix 数据到缓存'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {status === 'ready' && '选择同步模式并开始同步 GamePix 游戏数据到本地缓存数据库'}
            {status === 'syncing' && '正在从 GamePix API 获取并保存游戏数据，请稍候...'}
            {status === 'success' && '所有数据已成功同步到缓存数据库'}
            {status === 'failed' && '同步过程中出现错误，请检查配置后重试'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 同步模式选择 - 仅在 ready 状态显示 */}
          {status === 'ready' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">同步模式</Label>
              <RadioGroup value={syncMode} onValueChange={(value) => setSyncMode(value as SyncMode)}>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="incremental" id="incremental" className="mt-1" />
                  <Label htmlFor="incremental" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-primary" />
                      <span className="font-semibold">增量同步（推荐）</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      只同步新增的游戏，速度快，适合日常更新。按发布日期排序，自动检测新游戏数量。
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="full" id="full" className="mt-1" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold">全量同步</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      同步所有游戏并更新已存在的游戏信息。耗时较长，适合首次同步或数据修复。
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 进度显示 */}
          {status !== 'ready' && (
            <div className="space-y-4">
              {/* 进度条 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">同步进度</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* 当前步骤 */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  {status === 'syncing' && <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0 mt-0.5" />}
                  {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                  {status === 'failed' && <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium break-words">{currentStep || '准备中...'}</p>
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              {status === 'syncing' && (
                <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">同步页数:</span>
                    <span className="font-medium">{totalPages} 页</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">每页数量:</span>
                    <span className="font-medium">96 个（最大值）</span>
                  </div>
                  {estimatedTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API总数:</span>
                      <span className="font-medium text-primary">{estimatedTotal} 个游戏</span>
                    </div>
                  )}
                </div>
              )}

              {/* 实时统计 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.totalSynced || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">已处理</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.newGames || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">新增</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.updatedGames || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">更新</div>
                </div>
              </div>

              {/* 耗时 */}
              {status === 'syncing' && elapsedTime > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  已用时: {formatTime(elapsedTime)}
                </div>
              )}

              {/* 成功消息 */}
              {status === 'success' && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    同步成功! 共处理 {result.totalSynced} 个游戏，
                    新增 {result.newGames} 个，更新 {result.updatedGames} 个。
                    {result.syncDuration && ` 耗时 ${formatTime(result.syncDuration)}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* 失败消息 */}
              {status === 'failed' && result.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {status === 'ready' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button onClick={handleStartSync}>
                  <CloudDownload className="mr-2 h-4 w-4" />
                  开始同步
                </Button>
              </>
            )}

            {status === 'syncing' && (
              <Button variant="destructive" onClick={handleCancelSync}>
                <XCircle className="mr-2 h-4 w-4" />
                取消同步
              </Button>
            )}

            {(status === 'success' || status === 'failed') && (
              <>
                {status === 'failed' && (
                  <Button variant="outline" onClick={handleStartSync}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重试
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)}>
                  关闭
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
