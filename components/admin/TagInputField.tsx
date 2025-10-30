'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TagInputFieldProps {
  // 已选择的标签 ID（已存在于数据库）
  existingTagIds: string[]
  // 新标签名称（需要创建）
  newTagNames: string[]
  // 更新回调
  onExistingTagsChange: (ids: string[]) => void
  onNewTagsChange: (names: string[]) => void

  // 可用标签列表（从数据库加载）
  availableTags: Array<{ id: string; name: string }>

  // UI 配置
  placeholder?: string
  disabled?: boolean
  maxTags?: number
}

export function TagInputField({
  existingTagIds,
  newTagNames,
  onExistingTagsChange,
  onNewTagsChange,
  availableTags,
  placeholder = '输入标签名称或从列表选择...',
  disabled = false,
  maxTags = 20,
}: TagInputFieldProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // 所有已选标签总数
  const totalTags = existingTagIds.length + newTagNames.length

  // 处理从下拉列表选择已存在的标签
  const handleSelectExistingTag = (tagId: string) => {
    if (!existingTagIds.includes(tagId)) {
      onExistingTagsChange([...existingTagIds, tagId])
    }
    setOpen(false)
    setInputValue('')
  }

  // 处理添加新标签
  const handleAddNewTag = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) return

    // 检查是否已存在于数据库
    const existingTag = availableTags.find(
      (t) => t.name.toLowerCase() === trimmedValue.toLowerCase()
    )

    if (existingTag) {
      // 如果数据库中已存在，添加到 existingTagIds
      if (!existingTagIds.includes(existingTag.id)) {
        onExistingTagsChange([...existingTagIds, existingTag.id])
      }
    } else {
      // 如果是新标签，添加到 newTagNames
      if (!newTagNames.includes(trimmedValue)) {
        onNewTagsChange([...newTagNames, trimmedValue])
      }
    }

    setInputValue('')
    setOpen(false)
  }

  // 删除已存在的标签
  const handleRemoveExistingTag = (tagId: string) => {
    onExistingTagsChange(existingTagIds.filter((id) => id !== tagId))
  }

  // 删除新标签
  const handleRemoveNewTag = (tagName: string) => {
    onNewTagsChange(newTagNames.filter((name) => name !== tagName))
  }

  // 获取可选的标签（排除已选择的）
  const availableOptions = availableTags.filter(
    (tag) => !existingTagIds.includes(tag.id)
  )

  // 处理键盘 Enter 事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAddNewTag()
    }
  }

  return (
    <div className="space-y-3">
      {/* 输入区域 */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={disabled || totalTags >= maxTags}
            >
              <span className="truncate">
                {inputValue || placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="搜索标签..."
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
              />
              <CommandEmpty>
                <div className="p-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    未找到匹配的标签
                  </p>
                  {inputValue.trim() && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleAddNewTag}
                    >
                      + 创建新标签 "{inputValue.trim()}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {availableOptions
                  .filter((tag) =>
                    tag.name.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelectExistingTag(tag.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          existingTagIds.includes(tag.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 快速添加按钮 */}
        <Button
          type="button"
          size="default"
          variant="outline"
          onClick={handleAddNewTag}
          disabled={disabled || !inputValue.trim() || totalTags >= maxTags}
        >
          + 添加
        </Button>
      </div>

      {/* 已选标签显示 */}
      {totalTags > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            已选标签 ({totalTags}
            {maxTags && `/${maxTags}`})
          </p>
          <div className="flex flex-wrap gap-2">
            {/* 已存在的标签（绿色）*/}
            {existingTagIds.map((tagId) => {
              const tag = availableTags.find((t) => t.id === tagId)
              return (
                <Badge
                  key={tagId}
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                >
                  {tag?.name || tagId}
                  <button
                    type="button"
                    className="ml-1 hover:text-green-900"
                    onClick={() => handleRemoveExistingTag(tagId)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}

            {/* 新标签（红色）*/}
            {newTagNames.map((tagName) => (
              <Badge
                key={tagName}
                variant="outline"
                className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
              >
                {tagName}
                <span className="ml-1 text-xs opacity-60">(新)</span>
                <button
                  type="button"
                  className="ml-1 hover:text-red-900"
                  onClick={() => handleRemoveNewTag(tagName)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            💡 绿色 = 已存在标签，红色 = 新标签（导入时创建）
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground p-3 border rounded bg-muted/30">
          暂无标签。使用上方输入框添加标签，或使用"从网页获取更多信息"自动提取。
        </p>
      )}

      {/* 达到上限提示 */}
      {totalTags >= maxTags && (
        <p className="text-xs text-amber-600">
          ⚠️ 已达到标签数量上限 ({maxTags} 个)
        </p>
      )}
    </div>
  )
}
