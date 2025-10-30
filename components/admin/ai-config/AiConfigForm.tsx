"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2, Check, X } from "lucide-react"
import { createAiConfig, updateAiConfig } from "@/app/(admin)/admin/ai-config/actions"
import { AI_PROVIDERS, getProviderConfig } from "@/lib/ai-providers"
import type { AiConfig, AiModel, AiModelParameters } from "@/types/ai-config"

interface AiConfigFormProps {
  config?: AiConfig
  mode?: "create" | "edit"
  initialProvider?: string  // 预选的供应商
}

export function AiConfigForm({ config, mode = "create", initialProvider }: AiConfigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  // 如果有 initialProvider，自动加载预设模型
  const getInitialModels = () => {
    if (config?.modelConfig?.models) {
      return config.modelConfig.models
    }

    if (initialProvider) {
      const providerConfig = getProviderConfig(initialProvider as any)
      if (providerConfig) {
        return providerConfig.defaultModels.map(m => ({ ...m, isEnabled: true }))
      }
    }

    return [
      {
        id: "",
        name: "",
        isDefault: true,
        isEnabled: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        },
      },
    ]
  }

  const [models, setModels] = useState<AiModel[]>(getInitialModels())

  // 获取初始 baseUrl
  const getInitialBaseUrl = () => {
    if (config?.baseUrl) return config.baseUrl
    if (initialProvider) {
      const providerConfig = getProviderConfig(initialProvider as any)
      return providerConfig?.baseUrl || ""
    }
    return "https://openrouter.ai/api/v1/chat/completions"
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: config?.name || "",
      provider: config?.provider || initialProvider || "openrouter",
      apiKey: "", // 不显示原有密钥，需要重新输入
      baseUrl: getInitialBaseUrl(),
      isActive: config?.isActive || false,
      isEnabled: config?.isEnabled ?? true,
    },
  })

  const provider = watch("provider")

  // 获取当前提供商的配置
  const currentProviderConfig = provider ? getProviderConfig(provider as any) : null

  // 当提供商变化时，自动填充 baseUrl 和模型
  const handleProviderChange = (value: string) => {
    setValue("provider", value)
    const providerConfig = getProviderConfig(value as any)

    if (providerConfig && !config) {
      // 自动填充 baseUrl
      setValue("baseUrl", providerConfig.baseUrl)

      // 自动填充预设模型
      const presetsModels = providerConfig.defaultModels.map(model => ({
        ...model,
        isEnabled: true,
      }))
      setModels(presetsModels)
    }
  }

  // 加载提供商预设模型
  const loadProviderPresetModels = () => {
    if (!currentProviderConfig) return

    const presetModels = currentProviderConfig.defaultModels.map(model => ({
      ...model,
      isEnabled: true,
    }))
    setModels(presetModels)
  }

  // 添加模型
  const addModel = () => {
    setModels([
      ...models,
      {
        id: "",
        name: "",
        isDefault: models.length === 0,
        isEnabled: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        },
      },
    ])
  }

  // 删除模型
  const removeModel = (index: number) => {
    if (models.length === 1) {
      setError("至少需要一个模型")
      return
    }
    setModels(models.filter((_, i) => i !== index))
  }

  // 更新模型字段
  const updateModel = (index: number, field: keyof AiModel, value: any) => {
    const updated = [...models]
    updated[index] = { ...updated[index], [field]: value }
    setModels(updated)
  }

  // 更新模型参数
  const updateModelParameter = (
    index: number,
    param: keyof AiModelParameters,
    value: any
  ) => {
    const updated = [...models]
    updated[index] = {
      ...updated[index],
      parameters: {
        ...updated[index].parameters,
        [param]: value,
      },
    }
    setModels(updated)
  }

  // 设置默认模型
  const setDefaultModel = (index: number) => {
    const updated = models.map((m, i) => ({
      ...m,
      isDefault: i === index,
    }))
    setModels(updated)
  }

  // 提交表单
  const onSubmit = async (data: any) => {
    setLoading(true)
    setError("")

    try {
      // 验证模型配置
      if (models.length === 0) {
        setError("至少需要配置一个模型")
        setLoading(false)
        return
      }

      const hasDefault = models.some(m => m.isDefault)
      if (!hasDefault) {
        setError("至少需要一个默认模型")
        setLoading(false)
        return
      }

      for (const model of models) {
        if (!model.id || !model.name) {
          setError("所有模型都需要填写 ID 和名称")
          setLoading(false)
          return
        }
      }

      // API Key 验证
      if (mode === "create" && !data.apiKey) {
        setError("请输入 API Key")
        setLoading(false)
        return
      }

      const formData = {
        name: data.name,
        provider: data.provider,
        baseUrl: data.baseUrl,
        modelConfig: { models },
        isActive: data.isActive,
        isEnabled: data.isEnabled,
        ...(data.apiKey && { apiKey: data.apiKey }),
      }

      const result =
        mode === "create"
          ? await createAiConfig(formData)
          : await updateAiConfig(config!.id, formData)

      if (result.success) {
        router.push("/admin/ai-config")
        router.refresh()
      } else {
        setError(result.error || "操作失败")
      }
    } catch (err: any) {
      setError(err.message || "操作失败")
    } finally {
      setLoading(false)
    }
  }

  // 测试 AI 连接
  const handleTestConnection = async () => {
    // 验证必需字段
    const apiKey = watch("apiKey")
    const baseUrl = watch("baseUrl")

    if (!apiKey) {
      setTestResult({ success: false, message: "请先输入 API Key" })
      return
    }

    if (!baseUrl) {
      setTestResult({ success: false, message: "请先输入 API 端点" })
      return
    }

    // 获取默认模型
    const defaultModel = models.find(m => m.isDefault && m.isEnabled)
    if (!defaultModel || !defaultModel.id) {
      setTestResult({ success: false, message: "请先配置默认模型" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/test-ai-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          modelId: defaultModel.id,
          headers: defaultModel.headers || {},
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `✅ ${data.message}: ${data.response}`,
        })
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error}`,
        })
      }

      // 5秒后清除结果
      setTimeout(() => setTestResult(null), 5000)
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ 测试失败: ${err.message}`,
      })
      setTimeout(() => setTestResult(null), 5000)
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 测试结果 */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>配置 AI 提供商的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 配置名称 */}
          <div>
            <Label htmlFor="name">配置名称 *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="OpenRouter - Free Models"
              disabled={mode === "edit"}
              className={mode === "edit" ? "bg-gray-50" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">请输入配置名称</p>
            )}
            {mode === "edit" && (
              <p className="text-xs text-gray-500 mt-1">
                配置名称不可修改
              </p>
            )}
          </div>

          {/* 提供商 */}
          <div>
            <Label htmlFor="provider">提供商 *</Label>
            <Select
              value={provider}
              onValueChange={handleProviderChange}
              disabled={mode === "edit" || (!!initialProvider && mode === "create")}
            >
              <SelectTrigger className={mode === "edit" ? "bg-gray-50" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(p => (
                  <SelectItem key={p.provider} value={p.provider}>
                    <div>
                      <div className="font-medium">{p.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {p.defaultModels[0]?.name || "多个模型可选"}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {initialProvider && mode === "create" && (
              <p className="text-xs text-gray-500 mt-1">
                已预选供应商，如需更换请返回上一步
              </p>
            )}
            {currentProviderConfig && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  {currentProviderConfig.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={currentProviderConfig.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📚 查看官方文档
                  </a>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-600">
                    预设 {currentProviderConfig.defaultModels.length} 个推荐模型
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <Label htmlFor="apiKey">
              API Key {mode === "create" && "*"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                {...register("apiKey", { required: mode === "create" })}
                placeholder={
                  mode === "edit"
                    ? "留空则保持不变"
                    : "sk-or-v1-xxxxx 或 sk-xxxxx"
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                className="whitespace-nowrap"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>
            </div>
            {mode === "create" && errors.apiKey && (
              <p className="text-sm text-red-500 mt-1">请输入 API Key</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              API Key 将加密存储在数据库中。点击"测试连接"可验证配置是否正确。
            </p>
          </div>

          {/* Base URL */}
          <div>
            <Label htmlFor="baseUrl">API 端点 *</Label>
            <Input
              id="baseUrl"
              {...register("baseUrl", { required: true })}
              placeholder="https://openrouter.ai/api/v1/chat/completions"
            />
            {errors.baseUrl && (
              <p className="text-sm text-red-500 mt-1">请输入 API 端点地址</p>
            )}
          </div>

          {/* 状态 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isActive")}
                className="rounded"
              />
              <span className="text-sm">设为激活配置</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isEnabled")}
                className="rounded"
              />
              <span className="text-sm">启用此配置</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 模型配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>模型配置</CardTitle>
              <CardDescription>配置可用的 AI 模型及其参数</CardDescription>
            </div>
            <div className="flex gap-2">
              {currentProviderConfig && (
                <Button
                  type="button"
                  onClick={loadProviderPresetModels}
                  size="sm"
                  variant="outline"
                >
                  <Check className="h-4 w-4 mr-2" />
                  加载预设模型
                </Button>
              )}
              <Button type="button" onClick={addModel} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                手动添加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {models.map((model, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    模型 #{index + 1}
                    {model.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        默认
                      </span>
                    )}
                  </CardTitle>
                  {models.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModel(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 模型 ID 和名称 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>模型 ID *</Label>
                    <Input
                      value={model.id}
                      onChange={e => updateModel(index, "id", e.target.value)}
                      placeholder={
                        currentProviderConfig?.defaultModels[0]?.id || "model-id"
                      }
                    />
                    {currentProviderConfig && (
                      <p className="text-xs text-gray-400 mt-1">
                        示例: {currentProviderConfig.defaultModels[0]?.id}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>显示名称 *</Label>
                    <Input
                      value={model.name}
                      onChange={e => updateModel(index, "name", e.target.value)}
                      placeholder={
                        currentProviderConfig?.defaultModels[0]?.name || "模型名称"
                      }
                    />
                    {currentProviderConfig && (
                      <p className="text-xs text-gray-400 mt-1">
                        示例: {currentProviderConfig.defaultModels[0]?.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* 模型描述 */}
                <div>
                  <Label>描述（可选）</Label>
                  <Input
                    value={model.description || ""}
                    onChange={e =>
                      updateModel(index, "description", e.target.value)
                    }
                    placeholder="快速、免费的模型，适合日常使用"
                  />
                </div>

                {/* 参数配置 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={model.parameters.temperature}
                      onChange={e =>
                        updateModelParameter(
                          index,
                          "temperature",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      min="1"
                      value={model.parameters.max_tokens}
                      onChange={e =>
                        updateModelParameter(
                          index,
                          "max_tokens",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Top P (可选)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={model.parameters.top_p || ""}
                      onChange={e =>
                        updateModelParameter(
                          index,
                          "top_p",
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="1.0"
                    />
                  </div>
                </div>

                {/* 状态选项 */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={model.isDefault}
                      onChange={() => setDefaultModel(index)}
                      className="rounded"
                    />
                    <span className="text-sm">设为默认模型</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={model.isEnabled}
                      onChange={e =>
                        updateModel(index, "isEnabled", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">启用此模型</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={model.parameters.stream}
                      onChange={e =>
                        updateModelParameter(index, "stream", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">流式输出</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "创建配置" : "保存更改"}
        </Button>
      </div>
    </form>
  )
}
