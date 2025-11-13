/**
 * SEO URL 手动提交表单（客户端组件）
 */

'use client'

import { useState, useTransition, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitSelectedUrls, type SubmitUrlsInput } from './actions'

interface SelectedItems {
  games: string[]
  categories: string[]
  tags: string[]
  pageTypes: string[]
}

// 创建 Context 用于共享表单状态
const SubmitFormContext = createContext<{
  isPending: boolean
  selectedCount: number
  selectedItems: SelectedItems
}>({
  isPending: false,
  selectedCount: 0,
  selectedItems: {
    games: [],
    categories: [],
    tags: [],
    pageTypes: [],
  },
})

export function SubmitForm({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()
  const [selectedCount, setSelectedCount] = useState(0)
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({
    games: [],
    categories: [],
    tags: [],
    pageTypes: [],
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    // 收集选中的项目
    const games = formData.getAll('games') as string[]
    const categories = formData.getAll('categories') as string[]
    const tags = formData.getAll('tags') as string[]
    const pageTypes = formData.getAll('pageTypes') as string[]
    const engines = formData.getAll('engines') as string[]

    const input: SubmitUrlsInput = {
      games,
      categories,
      tags,
      pageTypes,
      engines,
    }

    // 验证
    const totalSelected = games.length + categories.length + tags.length + pageTypes.length
    if (totalSelected === 0) {
      toast.error('请至少选择一个要提交的内容')
      return
    }

    if (totalSelected > 50) {
      toast.error('一次最多选择 50 项内容')
      return
    }

    if (engines.length === 0) {
      toast.error('请至少选择一个搜索引擎')
      return
    }

    // 提交
    startTransition(async () => {
      try {
        const result = await submitSelectedUrls(input)

        if (result.success) {
          toast.success(result.message)

          // 显示详细统计
          if (result.stats) {
            console.log('[提交统计]', result.stats)
          }

          // 重置表单
          event.currentTarget.reset()
          setSelectedCount(0)
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '未知错误')
      }
    })
  }

  // 监听表单变化，更新选中数量和选中项
  const handleChange = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget)
    const games = formData.getAll('games') as string[]
    const categories = formData.getAll('categories') as string[]
    const tags = formData.getAll('tags') as string[]
    const pageTypes = formData.getAll('pageTypes') as string[]

    const total = games.length + categories.length + tags.length + pageTypes.length
    setSelectedCount(total)
    setSelectedItems({
      games,
      categories,
      tags,
      pageTypes,
    })
  }

  return (
    <SubmitFormContext.Provider value={{ isPending, selectedCount, selectedItems }}>
      <form onSubmit={handleSubmit} onChange={handleChange}>
        {children}
      </form>
    </SubmitFormContext.Provider>
  )
}

// 导出 hook 供子组件使用
export function useSubmitForm() {
  return useContext(SubmitFormContext)
}

// 提交按钮组件（放在右侧卡片中）
export function SubmitButton() {
  const { isPending, selectedCount } = useContext(SubmitFormContext)

  return (
    <div className="space-y-3">
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isPending || selectedCount === 0}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            提交中...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            开始提交
            {selectedCount > 0 && ` (${selectedCount} 项)`}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {selectedCount === 0
          ? '请选择要提交的内容和搜索引擎'
          : `已选择 ${selectedCount} 项内容，点击后将创建提交任务并在后台处理`}
      </p>
    </div>
  )
}
