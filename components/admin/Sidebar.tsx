"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderTree,
  Tags,
  Gamepad2,
  Languages,
  FileType,
  Download,
  ChevronDown,
  ChevronRight,
  Bot,
  Settings,
  Share2,
} from "lucide-react"

interface SubMenuItem {
  name: string
  href: string
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  children?: SubMenuItem[]
}

const navigation: NavigationItem[] = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "分类管理", href: "/admin/categories", icon: FolderTree },
  { name: "标签管理", href: "/admin/tags", icon: Tags },
  { name: "游戏管理", href: "/admin/games", icon: Gamepad2 },
  {
    name: "游戏导入",
    href: "/admin/import-games",
    icon: Download,
    children: [
      { name: "GamePix", href: "/admin/import-games/gamepix" },
    ]
  },
  { name: "语言管理", href: "/admin/languages", icon: Languages },
  { name: "页面类型", href: "/admin/page-types", icon: FileType },
  {
    name: "SEO 推送",
    href: "/admin/seo-submissions",
    icon: Share2,
    children: [
      { name: "Google", href: "/admin/seo-submissions/google" },
      { name: "Bing (IndexNow)", href: "/admin/seo-submissions/bing" },
    ]
  },
  { name: "AI 配置", href: "/admin/ai-config", icon: Bot },
  { name: "网站配置", href: "/admin/site-config", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // 默认展开包含当前路径的菜单项
    const expanded: string[] = []
    navigation.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) {
        expanded.push(item.name)
      }
    })
    return expanded
  })

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemActive = (href: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      return pathname.startsWith(href + "/")
    }
    return pathname === href
  }

  return (
    <aside
      className="w-64 flex flex-col shadow-xl"
      style={{
        backgroundColor: '#0f172a',
        colorScheme: 'dark'
      }}
    >
      {/* Logo 区域 */}
      <div className="p-6" style={{ borderBottom: '1px solid #1e293b' }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
          RunGame Admin
        </h1>
        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
          管理控制台
        </p>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.name)
          const isActive = isItemActive(item.href, hasChildren)

          return (
            <div key={item.name}>
              {/* 主菜单项 */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 my-1 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive && "shadow-lg"
                  )}
                  style={{
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#1e293b'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#cbd5e1'
                    }
                  }}
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 my-1 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive && "shadow-lg"
                  )}
                  style={{
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#1e293b'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#cbd5e1'
                    }
                  }}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              )}

              {/* 子菜单项 */}
              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200",
                          isChildActive && "shadow-md"
                        )}
                        style={{
                          color: isChildActive ? '#ffffff' : '#94a3b8',
                          backgroundColor: isChildActive ? '#3b82f6' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isChildActive) {
                            e.currentTarget.style.backgroundColor = '#1e293b'
                            e.currentTarget.style.color = '#ffffff'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChildActive) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = '#94a3b8'
                          }
                        }}
                      >
                        <span className="truncate">{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 底部版权信息 */}
      <div className="p-4" style={{ borderTop: '1px solid #1e293b' }}>
        <div className="text-xs text-center" style={{ color: '#64748b' }}>
          © 2025 RunGame.Online
        </div>
      </div>
    </aside>
  )
}
