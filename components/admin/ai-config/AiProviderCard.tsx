"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Check,
  X,
  Settings,
  Trash2,
  Power,
  TestTube,
  Plus,
  MoreVertical,
  ExternalLink,
} from "lucide-react"
import {
  deleteAiConfig,
  toggleAiConfigActive,
  toggleAiConfigEnabled,
  testAiConfig,
} from "@/app/(admin)/admin/ai-config/actions"
import { maskSensitiveData } from "@/lib/crypto"
import { getProviderDisplayInfo } from "@/lib/ai-providers"
import type { AiConfig } from "@/types/ai-config"
import type { AiProviderTemplate } from "@/types/ai-config"

interface AiProviderCardProps {
  provider: AiProviderTemplate
  config?: AiConfig
}

export function AiProviderCard({ provider, config }: AiProviderCardProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string>("")

  const providerDisplay = getProviderDisplayInfo(provider.provider)
  const defaultModel = config?.modelConfig?.models?.find(m => m.isDefault)
  const enabledModels = config?.modelConfig?.models?.filter(m => m.isEnabled) || []

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteAiConfig(deleteId)
    if (result.success) {
      router.refresh()
    }
    setDeleteId(null)
  }

  const handleToggleActive = async () => {
    if (!config) return
    const result = await toggleAiConfigActive(config.id)
    if (result.success) {
      router.refresh()
    }
  }

  const handleToggleEnabled = async () => {
    if (!config) return
    const result = await toggleAiConfigEnabled(config.id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleTest = async () => {
    if (!config) return

    // 提示用户输入 API Key
    const apiKey = window.prompt(
      '为了测试连接，请输入此配置的 API Key：\n\n' +
      '（出于安全考虑，API Key 已加密存储，无法自动读取）'
    )

    if (!apiKey) {
      return // 用户取消
    }

    setTesting(true)
    setTestResult("")

    const defaultModel = config.modelConfig.models.find(m => m.isDefault && m.isEnabled)
    if (!defaultModel) {
      setTestResult("❌ 未找到可用的默认模型")
      setTesting(false)
      return
    }

    try {
      // 使用用户输入的明文 API Key 测试
      const response = await fetch('/api/admin/test-ai-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl: config.baseUrl,
          modelId: defaultModel.id,
          headers: defaultModel.headers || {},
        }),
      })

      const data = await response.json()

      setTestResult(
        data.success
          ? `✅ ${data.message}: ${data.response}`
          : `❌ ${data.error}`
      )
    } catch (error: any) {
      setTestResult(`❌ 测试失败: ${error.message}`)
    } finally {
      setTesting(false)
      // 5秒后清除测试结果
      setTimeout(() => setTestResult(""), 5000)
    }
  }

  // 未配置状态
  if (!config) {
    return (
      <Card className="border-2 border-dashed hover:border-gray-400 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                <Badge variant="secondary">未配置</Badge>
              </div>
              <CardDescription>{provider.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* 预设模型预览 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                预设推荐模型 ({provider.defaultModels.length} 个)
              </p>
              <div className="space-y-1">
                {provider.defaultModels.slice(0, 3).map((model, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{model.name}</span>
                    {model.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        推荐
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 配置按钮 */}
            <div className="flex gap-2">
              <Link
                href={`/admin/ai-config/new?provider=${provider.provider}`}
                className="flex-1"
              >
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  立即配置
                </Button>
              </Link>
              <a
                href={provider.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 已配置状态
  return (
    <>
      <Card className={`border-2 ${config.isActive ? "border-green-500 shadow-lg" : ""}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                {config.isActive && (
                  <Badge className="bg-green-500">✓ 激活</Badge>
                )}
                {!config.isEnabled && (
                  <Badge variant="secondary">已禁用</Badge>
                )}
                <Badge className={`${providerDisplay.color} ${providerDisplay.textColor}`}>
                  已配置
                </Badge>
              </div>
              <CardDescription>{config.name || provider.description}</CardDescription>
            </div>

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/ai-config/${config.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    编辑配置
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggleActive}
                  disabled={config.isActive}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {config.isActive ? "当前激活" : "激活配置"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleToggleEnabled}>
                  {config.isEnabled ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      禁用
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      启用
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleTest} disabled={testing}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing ? "测试中..." : "测试连接"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setDeleteId(config.id)}
                  className="text-red-600"
                  disabled={config.isActive}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除配置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* 测试结果 */}
            {testResult && (
              <div className={`p-2 rounded text-sm ${
                testResult.startsWith("✅")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}>
                {testResult}
              </div>
            )}

            {/* 模型信息 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  配置模型 ({enabledModels.length} 个)
                </p>
                {defaultModel && (
                  <p className="text-xs text-gray-500">
                    默认: {defaultModel.name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {config.modelConfig.models.map((model, index) => (
                  <Badge
                    key={index}
                    variant={model.isEnabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {model.name}
                    {model.isDefault && " ⭐"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <p className="text-xs text-gray-500">
                API Key: <span className="font-mono">{maskSensitiveData(config.apiKey, 4)}</span>
              </p>
            </div>

            {/* 更新时间 */}
            <div className="text-xs text-gray-400 border-t pt-2">
              更新于: {new Date(config.updatedAt).toLocaleString("zh-CN")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 {provider.displayName} 的配置吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
