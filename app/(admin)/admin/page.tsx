import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/lib/data/stats/cache"
import { Gamepad2, FolderTree, Tags, Globe } from "lucide-react"

export default async function DashboardPage() {
  // 获取统计数据（使用缓存）
  const { gamesCount, categoriesCount, tagsCount, languagesCount } = await getDashboardStats()

  const stats = [
    { name: "游戏总数", value: gamesCount, icon: Gamepad2, color: "text-blue-600" },
    { name: "分类数量", value: categoriesCount, icon: FolderTree, color: "text-green-600" },
    { name: "标签数量", value: tagsCount, icon: Tags, color: "text-purple-600" },
    { name: "语言数量", value: languagesCount, icon: Globe, color: "text-orange-600" },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">仪表盘</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>欢迎使用 RunGame 管理后台</CardTitle>
          <CardDescription>
            从左侧菜单开始管理您的游戏、分类、标签和语言
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
