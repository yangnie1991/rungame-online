"use client"

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeywordsTagInputProps {
  value: string // 逗号分隔的关键词字符串
  onChange: (value: string) => void
  placeholder?: string
  limit?: number // 关键词数量限制（默认 10）
  disabled?: boolean
  className?: string
}

/**
 * 关键词标签输入组件
 *
 * 特点：
 * - 将逗号分隔的关键词字符串显示为标签（Badge）
 * - 支持添加、删除标签
 * - 实时统计标签数量
 * - 限制标签数量（推荐 5-10 个）
 */
export function KeywordsTagInput({
  value,
  onChange,
  placeholder = '输入关键词后按 Enter',
  limit = 10,
  disabled = false,
  className
}: KeywordsTagInputProps) {
  const [inputValue, setInputValue] = useState('')

  // 解析当前关键词为数组
  const keywords = value
    ? value.split(',').map(k => k.trim()).filter(k => k)
    : []

  // 添加关键词
  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim()

    // 验证：空字符串、重复、超出限制
    if (!trimmed) return
    if (keywords.includes(trimmed)) {
      alert('该关键词已存在')
      return
    }
    if (keywords.length >= limit) {
      alert(`关键词数量不能超过 ${limit} 个`)
      return
    }

    const newKeywords = [...keywords, trimmed]
    onChange(newKeywords.join(', '))
    setInputValue('')
  }

  // 删除关键词
  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index)
    onChange(newKeywords.join(', '))
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      // 当输入框为空且按下退格键时，删除最后一个关键词
      removeKeyword(keywords.length - 1)
    }
  }

  // 处理失焦事件
  const handleBlur = () => {
    if (inputValue.trim()) {
      addKeyword(inputValue)
    }
  }

  // 判断状态
  const count = keywords.length
  const isOverLimit = count > limit
  const isNearLimit = count >= limit * 0.8
  const isUnderRecommended = count < 5

  // 获取颜色类
  const getColorClass = () => {
    if (isOverLimit) return 'text-red-600 font-semibold'
    if (isNearLimit) return 'text-amber-600 font-medium'
    if (isUnderRecommended) return 'text-gray-400'
    return 'text-green-600'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 标签显示区域 */}
      <div className="min-h-[100px] p-3 border border-input rounded-md bg-background">
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-2.5 pr-1 py-1 gap-1 cursor-default"
            >
              <span>{keyword}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                  aria-label={`删除关键词: ${keyword}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}

          {/* 输入框 */}
          {!disabled && keywords.length < limit && (
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={keywords.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 px-0"
              disabled={disabled}
            />
          )}

          {/* 达到限制提示 */}
          {keywords.length >= limit && (
            <span className="text-xs text-muted-foreground self-center">
              已达到限制
            </span>
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          推荐: 5-10 个关键词
        </span>
        <div className="flex items-center gap-2">
          <span className={getColorClass()}>
            {count} / {limit} 个
          </span>
          {isOverLimit && (
            <span className="text-red-600">⚠️ 超出限制</span>
          )}
        </div>
      </div>

      {/* 使用提示 */}
      {keywords.length === 0 && (
        <p className="text-xs text-muted-foreground">
          💡 提示：输入关键词后按 Enter 添加，点击标签上的 ✕ 删除
        </p>
      )}
    </div>
  )
}
