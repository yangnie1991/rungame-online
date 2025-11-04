import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/Sidebar"
import { AdminHeader } from "@/components/admin/Header"

// 强制动态渲染，避免在构建时执行数据库查询
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/admin/login")
  }

  return (
    <div className="flex h-screen bg-gray-100" style={{ colorScheme: 'light' }}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
