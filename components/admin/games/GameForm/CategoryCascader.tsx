"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface CategoryOption {
  id: string              // 子分类 ID
  name: string           // 子分类英文名
  nameCn: string         // 子分类中文名
  parentId: string       // 父分类 ID
  parent: {
    id: string
    name: string         // 父分类英文名
    nameCn: string       // 父分类中文名
  }
}

interface CategoryCascaderProps {
  categories: CategoryOption[]  // 只包含子分类
  value?: string                // 选中的子分类 ID
  onChange: (categoryId: string) => void  // 只返回子分类 ID
  placeholder?: string
  className?: string
  error?: boolean
}

export function CategoryCascader({
  categories,
  value,
  onChange,
  placeholder = "选择分类",
  className,
  error = false,
}: CategoryCascaderProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // 按父分类分组子分类
  const categoryGroups = React.useMemo(() => {
    const groups = new Map<string, {
      parent: CategoryOption['parent'],
      children: CategoryOption[]
    }>()

    categories.forEach(cat => {
      if (!groups.has(cat.parentId)) {
        groups.set(cat.parentId, {
          parent: cat.parent,
          children: []
        })
      }
      groups.get(cat.parentId)!.children.push(cat)
    })

    return Array.from(groups.entries()).map(([parentId, data]) => ({
      parentId,
      parent: data.parent,
      children: data.children
    }))
  }, [categories])

  // 获取选中的分类
  const selectedCategory = React.useMemo(() => {
    return categories.find(cat => cat.id === value)
  }, [categories, value])

  // 搜索过滤（只搜索子分类）
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null

    const query = searchQuery.toLowerCase()
    return categories.filter(cat => {
      const matchesEnglish = cat.name.toLowerCase().includes(query)
      const matchesChinese = cat.nameCn.toLowerCase().includes(query)
      const matchesParentEnglish = cat.parent.name.toLowerCase().includes(query)
      const matchesParentChinese = cat.parent.nameCn.toLowerCase().includes(query)

      return matchesEnglish || matchesChinese || matchesParentEnglish || matchesParentChinese
    })
  }, [searchQuery, categories])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white",
            error && "border-red-500",
            className
          )}
        >
          {selectedCategory ? (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">
                {selectedCategory.parent.name}({selectedCategory.parent.nameCn}) /
              </span>
              <span className="text-sm">
                {selectedCategory.name}({selectedCategory.nameCn})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[500px] p-0 bg-white">
        <Command shouldFilter={false} className="bg-white border-0">
          <CommandInput
            placeholder="搜索分类（支持中英文）..."
            className="h-9 bg-white border-b"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          <CommandList className="max-h-[400px] bg-white">
            {/* 显示搜索结果 */}
            {filteredResults && filteredResults.length > 0 ? (
              <CommandGroup heading="搜索结果" className="bg-white">
                {filteredResults.map(cat => (
                  <CommandItem
                    key={cat.id}
                    value={cat.name}
                    onSelect={() => {
                      onChange(cat.id)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                    className="cursor-pointer bg-white hover:bg-gray-50"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === cat.id ? "opacity-100 text-blue-600" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        "text-sm truncate",
                        value === cat.id ? "text-blue-600 font-medium" : ""
                      )}>
                        {cat.name}({cat.nameCn})
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {cat.parent.name}({cat.parent.nameCn}) / {cat.name}({cat.nameCn})
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : searchQuery && filteredResults && filteredResults.length === 0 ? (
              /* 搜索无结果 */
              <CommandEmpty className="bg-white py-6 text-center text-sm text-gray-500">
                未找到匹配的分类
              </CommandEmpty>
            ) : !searchQuery ? (
              /* 显示分组列表（无搜索时）*/
              <>
                {categoryGroups.map(group => (
                  <CommandGroup
                    key={group.parentId}
                    heading={`${group.parent.name}（${group.parent.nameCn}）`}
                    className="bg-white"
                  >
                    {group.children.map(cat => (
                      <CommandItem
                        key={cat.id}
                        value={cat.name}
                        onSelect={() => {
                          onChange(cat.id)
                          setOpen(false)
                        }}
                        className="cursor-pointer bg-white hover:bg-gray-50"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === cat.id ? "opacity-100 text-blue-600" : "opacity-0"
                          )}
                        />
                        <span className={cn(
                          "text-sm truncate",
                          value === cat.id ? "text-blue-600 font-medium" : ""
                        )}>
                          {cat.name}({cat.nameCn})
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            ) : null}
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
