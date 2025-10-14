"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { deleteLanguage } from "@/app/(admin)/admin/languages/actions"

interface DeleteLanguageButtonProps {
  languageId: string
  languageName: string
}

export function DeleteLanguageButton({ languageId, languageName }: DeleteLanguageButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteLanguage(languageId)
      if (result.success) {
        toast.success("删除成功", { description: `语言 "${languageName}" 已被删除` })
        setOpen(false)
        router.refresh()
      } else {
        toast.error("删除失败", { description: result.error || "未知错误" })
      }
    } catch (error) {
      toast.error("删除失败", { description: "操作过程中发生错误" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              你确定要删除语言 <strong>{languageName}</strong> 吗？<br />此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
