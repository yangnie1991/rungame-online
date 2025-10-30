"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { toggleGamePublishStatus, toggleGameFeaturedStatus } from "@/app/(admin)/admin/games/actions"
import { toast } from "sonner"

interface ToggleGamePublishStatusProps {
  gameId: string
  gameTitle: string
  currentStatus: string  // 新架构: status 是字符串类型
}

export function ToggleGamePublishStatus({
  gameId,
  gameTitle,
  currentStatus
}: ToggleGamePublishStatusProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isPublished = status === 'PUBLISHED'

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleGamePublishStatus(gameId, status)

      if (result.success) {
        // 切换状态: PUBLISHED <-> DRAFT
        setStatus(status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
        toast.success("操作成功", {
          description: `《${gameTitle}》${result.message}`
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
        checked={isPublished}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label={`切换《${gameTitle}》发布状态`}
        className={
          isPublished
            ? "data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600"
            : "data-[state=unchecked]:bg-gray-400 data-[state=unchecked]:hover:bg-gray-500"
        }
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isPublished ? "已发布" : "草稿"}
      </span>
    </div>
  )
}

interface ToggleGameFeaturedStatusProps {
  gameId: string
  gameTitle: string
  currentStatus: boolean
}

export function ToggleGameFeaturedStatus({
  gameId,
  gameTitle,
  currentStatus
}: ToggleGameFeaturedStatusProps) {
  const [isFeatured, setIsFeatured] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const result = await toggleGameFeaturedStatus(gameId, isFeatured)

      if (result.success) {
        setIsFeatured(!isFeatured)
        toast.success("操作成功", {
          description: `《${gameTitle}》${result.message}`
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
        checked={isFeatured}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label={`切换《${gameTitle}》精选状态`}
        className={
          isFeatured
            ? "data-[state=checked]:bg-amber-500 data-[state=checked]:hover:bg-amber-600"
            : "data-[state=unchecked]:bg-gray-400 data-[state=unchecked]:hover:bg-gray-500"
        }
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isFeatured ? "精选" : "普通"}
      </span>
    </div>
  )
}
