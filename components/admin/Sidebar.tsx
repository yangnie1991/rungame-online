"use client"

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
} from "lucide-react"

const navigation = [
  { name: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { name: "分类管理", href: "/admin/categories", icon: FolderTree },
  { name: "标签管理", href: "/admin/tags", icon: Tags },
  { name: "游戏管理", href: "/admin/games", icon: Gamepad2 },
  { name: "语言管理", href: "/admin/languages", icon: Languages },
  { name: "页面类型", href: "/admin/page-types", icon: FileType },
]

export function AdminSidebar() {
  const pathname = usePathname()

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
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.name}
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
