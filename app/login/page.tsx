import { Suspense } from "react"
import { LoginForm } from "@/components/admin/LoginForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>请输入您的凭据以访问管理后台</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>加载中...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
