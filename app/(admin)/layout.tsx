import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./admin.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "管理后台 - RunGame.Online",
  description: "游戏门户网站管理系统",
}

/**
 * 管理后台根布局
 * 根据Next.js最佳实践，这是管理后台路由组的根布局
 * 必须包含<html>和<body>标签
 * 使用独立的 admin.css 避免全局样式冲突
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning className="light">
      <body className={`${inter.className} antialiased`} style={{ colorScheme: 'light' }}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
