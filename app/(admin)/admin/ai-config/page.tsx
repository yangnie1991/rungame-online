"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AI_PROVIDERS, getProviderDisplayInfo } from "@/lib/ai-providers"
import { getAiConfigs } from "./actions"
import { AiProviderPanel } from "@/components/admin/ai-config/AiProviderPanel"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle } from "lucide-react"

export default function AiConfigPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(AI_PROVIDERS[0].provider)
  const [loading, setLoading] = useState(true)

  // 加载配置
  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    const data = await getAiConfigs()
    setConfigs(data)
    setLoading(false)
  }

  // 将配置按提供商分组
  const configsByProvider = configs.reduce((acc, config) => {
    acc[config.provider] = config
    return acc
  }, {} as Record<string, any>)

  // 获取激活的供应商
  const activeProvider = configs.find(c => c.isActive)?.provider

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI 配置管理</h1>
        <p className="text-gray-500 mt-2">
          配置和管理四个 AI 供应商的 API 密钥和模型
        </p>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          {AI_PROVIDERS.map(provider => {
            const config = configsByProvider[provider.provider]
            const isConfigured = !!config
            const isActive = config?.isActive
            const displayInfo = getProviderDisplayInfo(provider.provider)

            return (
              <TabsTrigger
                key={provider.provider}
                value={provider.provider}
                className="flex flex-col items-center gap-2 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{provider.displayName}</span>
                  {isActive && (
                    <Badge className="bg-green-500 text-white px-1.5 py-0">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {isConfigured ? `${config.modelConfig.models.length} 个模型` : "0 个模型"}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {AI_PROVIDERS.map(provider => (
          <TabsContent
            key={provider.provider}
            value={provider.provider}
            className="space-y-4"
          >
            <AiProviderPanel
              provider={provider}
              config={configsByProvider[provider.provider]}
              onUpdate={loadConfigs}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* 说明信息 */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📝 配置说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 每个 AI 供应商只能配置一次，配置后可以修改</li>
          <li>• 同一时间只能激活一个供应商配置（激活的配置会显示绿色勾选）</li>
          <li>• 每个供应商可以配置多个模型，选择一个作为默认模型</li>
          <li>• API 密钥会加密存储在数据库中，确保安全</li>
        </ul>
      </div>
    </div>
  )
}
