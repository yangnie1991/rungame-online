"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {  Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Check,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  TestTube,
  Eye,
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

interface AiConfigListProps {
  configs: AiConfig[]
}

export function AiConfigList({ configs }: AiConfigListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string>("")

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteAiConfig(deleteId)
    if (result.success) {
      router.refresh()
    }
    setDeleteId(null)
  }

  const handleToggleActive = async (id: string) => {
    const result = await toggleAiConfigActive(id)
    if (result.success) {
      router.refresh()
    }
  }

  const handleToggleEnabled = async (id: string) => {
    const result = await toggleAiConfigEnabled(id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleTest = async (id: string) => {
    // 提示用户输入 API Key
    const apiKey = window.prompt(
      '为了测试连接，请输入此配置的 API Key：\n\n' +
      '（出于安全考虑，API Key 已加密存储，无法自动读取）'
    )

    if (!apiKey) {
      return // 用户取消
    }

    setTesting(id)
    setTestResult("")

    // 获取配置信息
    const config = configs.find(c => c.id === id)
    if (!config) {
      setTestResult("❌ 配置不存在")
      setTesting(null)
      return
    }

    const defaultModel = config.modelConfig.models.find(m => m.isDefault && m.isEnabled)
    if (!defaultModel) {
      setTestResult("❌ 未找到可用的默认模型")
      setTesting(null)
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
      setTesting(null)
      // 3秒后清除测试结果
      setTimeout(() => setTestResult(""), 5000)
    }
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <p className="text-lg mb-4">还没有配置任何 AI 提供商</p>
          <Link href="/admin/ai-config/new">
            <Button>创建第一个配置</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {testResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <p className="text-sm">{testResult}</p>
          </CardContent>
        </Card>
      )}

      {configs.map(config => {
        const defaultModel = config.modelConfig.models.find(m => m.isDefault)
        const enabledModels = config.modelConfig.models.filter(m => m.isEnabled)
        const providerDisplay = getProviderDisplayInfo(config.provider)

        return (
          <Card key={config.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle>{config.name}</CardTitle>
                    {config.isActive && (
                      <Badge className="bg-green-500">✓ 激活</Badge>
                    )}
                    {!config.isEnabled && (
                      <Badge variant="secondary">已禁用</Badge>
                    )}
                    <Badge
                      className={`${providerDisplay.color} ${providerDisplay.textColor}`}
                    >
                      {providerDisplay.displayName}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">模型:</span>{" "}
                        {enabledModels.length} 个可用
                      </span>
                      {defaultModel && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">默认:</span>{" "}
                            {defaultModel.name}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono text-xs">
                        API Key: {maskSensitiveData(config.apiKey, 4)}
                      </span>
                    </div>
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/ai-config/${config.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleToggleActive(config.id)}
                      disabled={config.isActive}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {config.isActive ? "当前激活" : "激活配置"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleToggleEnabled(config.id)}
                    >
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

                    <DropdownMenuItem
                      onClick={() => handleTest(config.id)}
                      disabled={testing === config.id}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testing === config.id ? "测试中..." : "测试连接"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setDeleteId(config.id)}
                      className="text-red-600"
                      disabled={config.isActive}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">API 端点:</p>
                  <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                    {config.baseUrl}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">可用模型:</p>
                  <div className="flex flex-wrap gap-2">
                    {config.modelConfig.models.map((model, index) => (
                      <Badge
                        key={index}
                        variant={model.isEnabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {model.name}
                        {model.isDefault && " ⭐"}
                        {!model.isEnabled && " (禁用)"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  创建于: {new Date(config.createdAt).toLocaleString("zh-CN")}
                  {config.updatedAt !== config.createdAt && (
                    <>
                      {" "}
                      • 更新于:{" "}
                      {new Date(config.updatedAt).toLocaleString("zh-CN")}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个 AI 配置吗？此操作无法撤销。
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
    </div>
  )
}
