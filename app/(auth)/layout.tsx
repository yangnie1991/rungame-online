import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../(admin)/admin.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "登录 - RunGame.Online",
  description: "管理员登录",
}

/**
 * 认证页面布局（登录、注册等）
 * 必须包含<html>和<body>标签
 * 不包含认证检查
 */
export default function AuthLayout({
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
