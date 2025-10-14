"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { toggleCategoryStatus } from "@/app/(admin)/admin/categories/actions"
import { toast } from "sonner"

interface ToggleCategoryStatusProps {
  categoryId: string
  categoryName: string
  currentStatus: boolean
}

export function ToggleCategoryStatus({
  categoryId,
  categoryName,
  currentStatus
}: ToggleCategoryStatusProps) {
  const [isEnabled, setIsEnabled] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleCategoryStatus(categoryId, isEnabled)

      if (result.success) {
        setIsEnabled(!isEnabled)
        toast.success("操作成功", {
          description: `分类"${categoryName}"${result.message}`
        })
        router.refresh()
      } else {
        toast.error("操作失败", {
          description: result.error
        })
      }
    } catch (error) {
      toast.error("操作失败", {
        description: "网络错误，请稍后重试"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label={`切换分类"${categoryName}"状态`}
        className={
          isEnabled
            ? "data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600"
            : "data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
        }
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isEnabled ? "启用" : "禁用"}
      </span>
    </div>
  )
}
