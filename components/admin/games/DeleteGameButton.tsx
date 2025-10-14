'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteGame } from '@/app/(admin)/admin/games/actions'

interface DeleteGameButtonProps {
  gameId: string
  gameName: string
}

export function DeleteGameButton({ gameId, gameName }: DeleteGameButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteGame(gameId)

      if (result.success) {
        toast.success('游戏已删除')
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除游戏失败:', error)
      toast.error('删除失败，请稍后重试')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除游戏</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除游戏 <strong className="text-foreground">{gameName}</strong> 吗？
            <br />
            <br />
            此操作不可撤销，将会删除：
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>游戏的所有翻译内容</li>
              <li>游戏的标签关联</li>
              <li>游戏的所有统计数据</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
