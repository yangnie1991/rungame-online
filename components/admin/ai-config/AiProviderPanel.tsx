"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Trash2,
  Power,
  TestTube,
  Plus,
  ExternalLink,
  Loader2,
  Edit3,
  Eye,
  EyeOff,
  Save,
} from "lucide-react"
import {
  deleteAiConfig,
  toggleAiConfigActive,
  toggleAiConfigEnabled,
  testAiConfig,
  getDecryptedApiKey,
  updateAiConfig,
} from "@/app/(admin)/admin/ai-config/actions"
import { maskSensitiveData } from "@/lib/crypto"
import type { AiConfig, AiProviderTemplate } from "@/types/ai-config"
import { AiConfigForm } from "./AiConfigForm"
import { ModelEditDialog } from "./ModelEditDialog"

interface AiProviderPanelProps {
  provider: AiProviderTemplate
  config?: AiConfig
  onUpdate: () => void
}

export function AiProviderPanel({ provider, config, onUpdate }: AiProviderPanelProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string>("")
  const [showAddModelDialog, setShowAddModelDialog] = useState(false)
  const [editingModel, setEditingModel] = useState<{ model: any; index: number } | null>(null)
  const [deletingModel, setDeletingModel] = useState<{ model: any; index: number } | null>(null)

  // 基础配置编辑状态
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [originalApiKey, setOriginalApiKey] = useState("") // 保存原始 API Key 用于比较
  const [showApiKey, setShowApiKey] = useState(false)
  const [loadingApiKey, setLoadingApiKey] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  const defaultModel = config?.modelConfig?.models?.find(m => m.isDefault)
  const enabledModels = config?.modelConfig?.models?.filter(m => m.isEnabled) || []

  // 初始化配置数据
  useEffect(() => {
    if (config) {
      setBaseUrl(config.baseUrl)
      // 自动加载解密后的 API Key
      loadDecryptedApiKey()
    } else {
      // 未配置时使用供应商的默认端点
      setBaseUrl(provider.baseUrl)
    }
  }, [config, provider.baseUrl])

  // 加载解密后的 API Key
  const loadDecryptedApiKey = async () => {
    if (!config) return
    setLoadingApiKey(true)
    try {
      const key = await getDecryptedApiKey(config.id)
      setApiKey(key)
      setOriginalApiKey(key) // 保存原始值
    } catch (error) {
      console.error("获取 API Key 失败:", error)
    } finally {
      setLoadingApiKey(false)
    }
  }

  // 检查配置是否有变化
  const hasConfigChanges = () => {
    if (!config) return false
    return baseUrl !== config.baseUrl || apiKey !== originalApiKey
  }

  // 保存基础配置
  const handleSaveConfig = async () => {
    if (!config) return

    setSavingConfig(true)
    try {
      const updateData: any = {}

      if (baseUrl !== config.baseUrl) {
        updateData.baseUrl = baseUrl
      }

      if (apiKey !== originalApiKey) {
        updateData.apiKey = apiKey
      }

      if (Object.keys(updateData).length === 0) {
        alert("没有需要保存的更改")
        setSavingConfig(false)
        return
      }

      const result = await updateAiConfig(config.id, updateData)

      if (result.success) {
        // 更新原始值
        setOriginalApiKey(apiKey)
        onUpdate()
        alert("配置已更新")
      } else {
        alert(result.error || "保存失败")
      }
    } catch (error) {
      alert("保存失败")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleDelete = async () => {
    if (!config) return

    const result = await deleteAiConfig(config.id)
    if (result.success) {
      setShowDeleteDialog(false)
      onUpdate()
    }
  }

  const handleToggleActive = async () => {
    if (!config) return
    const result = await toggleAiConfigActive(config.id)
    if (result.success) {
      onUpdate()
    }
  }

  const handleToggleEnabled = async () => {
    if (!config) return
    const result = await toggleAiConfigEnabled(config.id)
    if (result.success) {
      onUpdate()
    } else {
      alert(result.error)
    }
  }

  const handleTest = async () => {
    if (!config) return

    // 验证必需字段
    const hasApiKey = apiKey && apiKey.trim()
    const hasBaseUrl = baseUrl && baseUrl.trim()

    if (!hasApiKey && !hasBaseUrl) {
      setTestResult("❌ 请先输入 API Key 和 API 端点")
      setTimeout(() => setTestResult(""), 3000)
      return
    }

    if (!hasApiKey) {
      setTestResult("❌ 请先输入 API Key")
      setTimeout(() => setTestResult(""), 3000)
      return
    }

    if (!hasBaseUrl) {
      setTestResult("❌ 请先输入 API 端点")
      setTimeout(() => setTestResult(""), 3000)
      return
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
      // 使用输入框中的 API Key 和 API 端点测试
      const response = await fetch('/api/admin/test-ai-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,        // 使用 state 中的 API Key（输入框中的值）
          baseUrl: baseUrl,      // 使用 state 中的 API 端点（输入框中的值）
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

  // 打开删除模型对话框
  const openDeleteModelDialog = (e: React.MouseEvent, model: any, index: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!config) return

    if (config.modelConfig.models.length === 1) {
      alert("至少需要保留一个模型")
      return
    }

    setDeletingModel({ model, index })
  }

  // 确认删除模型
  const confirmDeleteModel = async () => {
    if (!config || !deletingModel) return

    try {
      const updatedModels = config.modelConfig.models.filter((_, i) => i !== deletingModel.index)

      // 如果删除的是默认模型，将第一个模型设为默认
      if (deletingModel.model.isDefault && updatedModels.length > 0) {
        updatedModels[0].isDefault = true
      }

      const result = await updateAiConfig(config.id, {
        modelConfig: { models: updatedModels },
      })

      if (result.success) {
        setDeletingModel(null)
        onUpdate()
        alert("删除成功")
      } else {
        alert(result.error || "删除失败")
      }
    } catch (error) {
      console.error("删除模型失败:", error)
      alert("删除失败")
    }
  }

  // 统一的界面结构（配置和未配置使用相同组件）
  return (
    <>
      <div className="space-y-4">
        {/* 测试结果 */}
        {testResult && (
          <Card
            className={`border-2 ${
              testResult.startsWith("✅")
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <CardContent className="py-4">
              <p className="text-sm font-medium">{testResult}</p>
            </CardContent>
          </Card>
        )}

        {/* 配置概览 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle>{provider.displayName}</CardTitle>
                  {config?.isActive && (
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      已激活
                    </Badge>
                  )}
                  {config && !config.isEnabled && (
                    <Badge variant="secondary">已禁用</Badge>
                  )}
                </div>
                <CardDescription className="truncate">
                  {config?.name || provider.description}
                </CardDescription>
              </div>

              {/* 操作按钮组 */}
              <div className="flex gap-2 flex-wrap flex-shrink-0 ml-4">
                  {!config?.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleActive}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      激活
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={testing}
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        测试中
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleEnabled}
                  >
                    {config?.isEnabled ? (
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
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={config?.isActive}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">基础配置信息</h3>
                  <Button
                    size="sm"
                    onClick={handleSaveConfig}
                    disabled={!hasConfigChanges() || savingConfig || loadingApiKey}
                  >
                    {savingConfig ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存更改
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                    <Label className="text-sm text-gray-600">配置名称:</Label>
                    <span className="text-sm font-medium">{config?.name || "-"}</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                    <Label className="text-sm text-gray-600">API 端点:</Label>
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="text-sm font-mono"
                      placeholder={provider.baseUrl}
                    />
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                    <Label className="text-sm text-gray-600">API 密钥:</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={loadingApiKey ? "加载中..." : apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="text-sm font-mono flex-1"
                        placeholder="sk-..."
                        disabled={loadingApiKey}
                        readOnly={loadingApiKey}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={loadingApiKey}
                        title={showApiKey ? "隐藏" : "显示"}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
                    <Label className="text-sm text-gray-600">最后更新:</Label>
                    <span className="text-sm text-gray-500">
                      {config ? new Date(config.updatedAt).toLocaleString("zh-CN") : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 模型列表 */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    已添加的模型 {config ? `(${enabledModels.length}/${config.modelConfig.models.length})` : "(0)"}
                  </h3>
                  <Button size="sm" onClick={() => setShowAddModelDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加模型
                  </Button>
                </div>

                <div className="space-y-2">
                  {config?.modelConfig?.models?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">还没有添加任何模型</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowAddModelDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加第一个模型
                      </Button>
                    </div>
                  ) : (
                    config?.modelConfig?.models?.map((model, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{model.name}</span>
                            {model.isDefault && (
                              <Badge variant="default" className="text-xs">
                                ⭐ 默认
                              </Badge>
                            )}
                            {!model.isEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                已禁用
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                            {model.id}
                          </p>
                          {model.description && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {model.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setEditingModel({ model, index })
                            }}
                            title="编辑"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openDeleteModelDialog(e, model, index)}
                            disabled={config?.modelConfig?.models?.length === 1}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加模型弹窗 */}
      {config && (
        <ModelEditDialog
          open={showAddModelDialog}
          onOpenChange={setShowAddModelDialog}
          config={config}
          provider={provider}
          onUpdate={onUpdate}
          mode="add"
        />
      )}

      {/* 编辑模型弹窗 */}
      {config && editingModel && (
        <ModelEditDialog
          open={!!editingModel}
          onOpenChange={(open) => !open && setEditingModel(null)}
          config={config}
          provider={provider}
          onUpdate={onUpdate}
          mode="edit"
          model={editingModel.model}
          modelIndex={editingModel.index}
        />
      )}

      {/* 删除模型确认对话框 */}
      <AlertDialog open={!!deletingModel} onOpenChange={(open) => !open && setDeletingModel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模型</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除模型 <span className="font-semibold">"{deletingModel?.model.name}"</span> 吗？此操作无法撤销。
              {deletingModel?.model.isDefault && (
                <span className="block mt-2 text-amber-600">
                  注意：这是默认模型，删除后将自动设置第一个剩余模型为默认模型。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingModel(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteModel}
              className="bg-red-500 hover:bg-red-600"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除配置确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
