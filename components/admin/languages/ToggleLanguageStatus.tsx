"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { toggleLanguageStatus } from "@/app/(admin)/admin/languages/actions"
import { toast } from "sonner"

interface ToggleLanguageStatusProps {
  languageId: string
  languageCode: string
  languageName: string
  currentStatus: boolean
}

export function ToggleLanguageStatus({
  languageId,
  languageCode,
  languageName,
  currentStatus
}: ToggleLanguageStatusProps) {
  const [isEnabled, setIsEnabled] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    // 禁止禁用默认语言 en
    if (languageCode === 'en' && isEnabled) {
      toast.error("操作失败", {
        description: "默认语言 English (en) 不能禁用"
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await toggleLanguageStatus(languageId, isEnabled)

      if (result.success) {
        setIsEnabled(!isEnabled)
        toast.success("操作成功", {
          description: `${languageName} 已${result.message}`
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

  const isDefaultLanguage = languageCode === 'en'

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isLoading || (isDefaultLanguage && isEnabled)}
        aria-label={`切换 ${languageName} 状态`}
        className={
          isEnabled
            ? "data-[state=checked]:bg-green-500 data-[state=checked]:hover:bg-green-600"
            : "data-[state=unchecked]:bg-red-500 data-[state=unchecked]:hover:bg-red-600"
        }
      />
      {isDefaultLanguage && isEnabled && (
        <span className="text-xs text-muted-foreground">(默认)</span>
      )}
    </div>
  )
}
