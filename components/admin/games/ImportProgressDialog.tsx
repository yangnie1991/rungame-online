"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, Loader2, RefreshCw, Upload, Database, Tag, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 导入步骤状态
 */
export type ImportStepStatus = 'pending' | 'running' | 'success' | 'error'

/**
 * 导入步骤信息
 */
export interface ImportStep {
  id: string
  label: string
  description: string
  status: ImportStepStatus
  progress?: number // 0-100
  error?: string
  icon?: React.ReactNode
}

interface ImportProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  steps: ImportStep[]
  currentStepIndex: number
  overallProgress: number
  onRetry?: () => void
  onCancel?: () => void
  allowClose?: boolean
}

/**
 * 导入进度弹窗
 *
 * 功能：
 * - 显示多步骤导入进度
 * - 每个步骤显示状态图标（待处理、进行中、成功、失败）
 * - 失败时显示错误信息和重试按钮
 * - 阻止用户在导入进行中关闭弹窗
 */
export function ImportProgressDialog({
  open,
  onOpenChange,
  title = '导入游戏',
  steps,
  currentStepIndex,
  overallProgress,
  onRetry,
  onCancel,
  allowClose = false,
}: ImportProgressDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  // 是否有步骤失败
  const hasError = steps.some(step => step.status === 'error')

  // 是否正在运行
  const isRunning = steps.some(step => step.status === 'running')

  // 是否全部完成
  const isCompleted = steps.every(step => step.status === 'success')

  // 获取状态图标
  const getStatusIcon = (step: ImportStep) => {
    switch (step.status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
        )
    }
  }

  // 获取状态文本颜色
  const getStatusColor = (status: ImportStepStatus) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-destructive'
      case 'running':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  // 处理重试
  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  // 处理关闭
  const handleClose = () => {
    if (!allowClose && (isRunning || !isCompleted)) {
      return // 进行中或未完成时阻止关闭
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          // 进行中时阻止点击外部关闭
          if (!allowClose && (isRunning || !isCompleted)) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          // 进行中时阻止 ESC 关闭
          if (!allowClose && (isRunning || !isCompleted)) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {title} - 完成
              </>
            ) : hasError ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                {title} - 失败
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                {title} - 进行中
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? '所有步骤已成功完成'
              : hasError
              ? '部分步骤执行失败，请重试'
              : '请等待导入完成，请勿关闭此窗口'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 总进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">总进度</span>
              <span className="text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* 步骤列表 */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  step.status === 'running' && 'border-primary bg-primary/5',
                  step.status === 'success' && 'border-green-200 bg-green-50',
                  step.status === 'error' && 'border-destructive bg-destructive/5',
                  step.status === 'pending' && 'border-muted bg-muted/30'
                )}
              >
                {/* 状态图标 */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.icon || getStatusIcon(step)}
                </div>

                {/* 步骤信息 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        'font-medium text-sm',
                        getStatusColor(step.status)
                      )}
                    >
                      {step.label}
                    </h4>
                    {step.status === 'running' && step.progress !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {step.progress}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>

                  {/* 步骤进度条（运行中时） */}
                  {step.status === 'running' && step.progress !== undefined && (
                    <Progress value={step.progress} className="h-1 mt-2" />
                  )}

                  {/* 错误信息 */}
                  {step.status === 'error' && step.error && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作按钮 */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            {hasError && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                variant="default"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    重试中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重新执行
                  </>
                )}
              </Button>
            )}

            {isRunning && onCancel && (
              <Button onClick={onCancel} variant="outline">
                取消导入
              </Button>
            )}

            {isCompleted && (
              <Button onClick={handleClose} variant="default">
                <CheckCheck className="mr-2 h-4 w-4" />
                完成
              </Button>
            )}

            {!isRunning && !isCompleted && !hasError && (
              <Button onClick={handleClose} variant="outline">
                关闭
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 默认导入步骤配置
 */
export const DEFAULT_IMPORT_STEPS: ImportStep[] = [
  {
    id: 'upload-images',
    label: '上传图片到 R2',
    description: '自动上传缩略图、横幅和截图到 CDN',
    status: 'pending',
    icon: <Upload className="h-5 w-5" />,
  },
  {
    id: 'validate-category',
    label: '验证分类信息',
    description: '检查分类是否存在并获取主分类 ID',
    status: 'pending',
    icon: <Tag className="h-5 w-5" />,
  },
  {
    id: 'create-game',
    label: '创建游戏记录',
    description: '写入游戏数据到数据库',
    status: 'pending',
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: 'update-cache',
    label: '更新缓存标记',
    description: '标记游戏为已导入并失效相关缓存',
    status: 'pending',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
]
