'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UnimportConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameTitle?: string
  gameCount?: number
  onConfirm: (deleteGame: boolean) => Promise<void>
  isLoading?: boolean
}

/**
 * 取消导入确认对话框
 * 允许用户选择是否删除游戏
 */
export function UnimportConfirmDialog({
  open,
  onOpenChange,
  gameTitle,
  gameCount = 1,
  onConfirm,
  isLoading = false,
}: UnimportConfirmDialogProps) {
  const [deleteGame, setDeleteGame] = useState(false)

  const handleConfirm = async () => {
    await onConfirm(deleteGame)
    // 重置状态
    setDeleteGame(false)
  }

  const handleCancel = () => {
    setDeleteGame(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            取消导入确认
          </DialogTitle>
          <DialogDescription>
            {gameCount === 1 && gameTitle
              ? `确定要取消 "${gameTitle}" 的导入状态吗？`
              : `确定要取消 ${gameCount} 个游戏的导入状态吗？`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 说明 */}
          <Alert>
            <AlertDescription className="text-sm">
              取消导入后，该游戏将在缓存中标记为"未导入"状态，你可以在后续重新导入。
            </AlertDescription>
          </Alert>

          {/* 删除游戏选项 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="deleteGame"
                checked={deleteGame}
                onCheckedChange={(checked) => setDeleteGame(checked === true)}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="deleteGame"
                  className="cursor-pointer font-medium text-sm"
                >
                  同时删除游戏数据
                </Label>
                <p className="text-xs text-muted-foreground">
                  勾选此项将从数据库中永久删除{gameCount === 1 ? '该游戏' : '这些游戏'}
                  的所有数据（包括翻译、标签等）
                </p>
              </div>
            </div>

            {deleteGame && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>警告：</strong>删除游戏是不可逆操作！
                  {gameCount === 1
                    ? '游戏的所有数据将被永久删除。'
                    : `${gameCount} 个游戏的所有数据将被永久删除。`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            variant={deleteGame ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                {deleteGame ? '取消导入并删除' : '仅取消导入'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
