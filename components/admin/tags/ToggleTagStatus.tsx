"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { toggleTagStatus } from "@/app/(admin)/admin/tags/actions"
import { toast } from "sonner"

interface ToggleTagStatusProps {
  tagId: string
  tagName: string
  currentStatus: boolean
}

export function ToggleTagStatus({
  tagId,
  tagName,
  currentStatus
}: ToggleTagStatusProps) {
  const [isEnabled, setIsEnabled] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleTagStatus(tagId, isEnabled)

      if (result.success) {
        setIsEnabled(!isEnabled)
        toast.success("操作成功", {
          description: `标签"${tagName}"${result.message}`
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
        aria-label={`切换标签"${tagName}"状态`}
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
