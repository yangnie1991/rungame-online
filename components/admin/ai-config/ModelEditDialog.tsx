"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, TestTube, CheckCircle2, XCircle } from "lucide-react"
import { updateAiConfig, testAiModel } from "@/app/(admin)/admin/ai-config/actions"
import type { AiConfig, AiModel, AiProviderTemplate } from "@/types/ai-config"

interface ModelEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AiConfig
  provider: AiProviderTemplate
  onUpdate: () => void
  mode: "add" | "edit"
  model?: AiModel
  modelIndex?: number
}

export function ModelEditDialog({
  open,
  onOpenChange,
  config,
  provider,
  onUpdate,
  mode,
  model,
  modelIndex,
}: ModelEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState<AiModel>({
    id: "",
    name: "",
    description: "",
    isDefault: false,
    isEnabled: true,
    parameters: {
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    },
  })

  // 原始数据（用于编辑模式下检测变化）
  const [originalData, setOriginalData] = useState<AiModel | null>(null)

  // 初始化表单数据
  useEffect(() => {
    if (mode === "edit" && model) {
      setFormData(model)
      setOriginalData(JSON.parse(JSON.stringify(model))) // 深拷贝原始数据
    } else {
      // 添加模式，使用默认值
      const defaultData = {
        id: "",
        name: "",
        description: "",
        isDefault: config?.modelConfig?.models?.length === 0, // 第一个模型默认为默认模型
        isEnabled: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      }
      setFormData(defaultData)
      setOriginalData(null) // 添加模式没有原始数据
    }
    setError("")
    setTestResult(null)
  }, [mode, model, config, open])

  // 检查表单数据是否有变化（仅编辑模式）
  const hasChanges = () => {
    if (mode === "add") return true // 添加模式总是允许保存
    if (!originalData) return true

    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  // 当模型ID或名称改变时，清除测试结果（需要重新测试）
  useEffect(() => {
    if (mode === "edit" && originalData) {
      if (
        formData.id !== originalData.id ||
        formData.name !== originalData.name ||
        formData.parameters.temperature !== originalData.parameters.temperature ||
        formData.parameters.max_tokens !== originalData.parameters.max_tokens
      ) {
        setTestResult(null) // 清除测试结果，要求重新测试
      }
    }
  }, [formData.id, formData.name, formData.parameters, mode, originalData])

  // 测试模型
  const handleTest = async () => {
    setError("")
    setTestResult(null)

    // 验证
    if (!formData.id || !formData.name) {
      setError("请先填写模型 ID 和名称")
      return
    }

    setTesting(true)

    try {
      const result = await testAiModel(config.id, formData.id, formData.name)

      if (result.success) {
        setTestResult({
          success: true,
          message: `测试成功！模型响应: ${result.response}`,
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || "测试失败",
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "测试失败",
      })
    } finally {
      setTesting(false)
    }
  }

  // 保存更改
  const handleSave = async () => {
    setError("")

    // 验证
    if (!formData.id || !formData.name) {
      setError("请填写模型 ID 和名称")
      return
    }

    // 编辑模式下检查是否有变化
    if (mode === "edit" && !hasChanges()) {
      setError("没有任何修改，无需保存")
      return
    }

    // 要求测试通过
    if (!testResult || !testResult.success) {
      setError("请先测试模型，确保模型可用后再保存")
      return
    }

    setLoading(true)

    try {
      let updatedModels = [...config.modelConfig.models]

      if (mode === "add") {
        // 添加新模型
        updatedModels.push(formData)
      } else if (mode === "edit" && modelIndex !== undefined) {
        // 编辑现有模型
        updatedModels[modelIndex] = formData
      }

      // 如果设置为默认模型，取消其他模型的默认状态
      if (formData.isDefault) {
        updatedModels = updatedModels.map((m, i) => ({
          ...m,
          isDefault: mode === "add"
            ? m === formData
            : i === modelIndex,
        }))
      }

      const result = await updateAiConfig(config.id, {
        modelConfig: { models: updatedModels },
      })

      if (result.success) {
        onUpdate()
        onOpenChange(false)
      } else {
        setError(result.error || "保存失败")
      }
    } catch (err: any) {
      setError(err.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "添加模型" : "编辑模型"} - {provider.displayName}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "添加新的 AI 模型配置"
              : "编辑模型信息和参数"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`p-3 border rounded text-sm flex items-start gap-2 ${
                testResult.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium mb-1">
                  {testResult.success ? "✅ 测试通过" : "❌ 测试失败"}
                </p>
                <p className="text-xs">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* 测试按钮 */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !formData.id || !formData.name}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  测试模型
                </>
              )}
            </Button>
          </div>

          {/* 模型ID和名称 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>模型 ID *</Label>
              <Input
                placeholder="gpt-4o-mini"
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                示例: {provider.defaultModels[0]?.id}
              </p>
            </div>
            <div>
              <Label>显示名称 *</Label>
              <Input
                placeholder="GPT-4o Mini"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                示例: {provider.defaultModels[0]?.name}
              </p>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <Label>描述（可选）</Label>
            <Input
              placeholder="高性价比模型，适合日常使用"
              value={formData.description || ""}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* 参数配置 */}
          <div>
            <Label className="mb-2 block">模型参数</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Temperature</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.parameters.temperature}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Tokens</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.parameters.max_tokens}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        max_tokens: parseInt(e.target.value),
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Stream</Label>
                <div className="flex items-center h-9 mt-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.parameters.stream}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            stream: e.target.checked,
                          },
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">启用</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 状态选项 */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">模型状态</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={e =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">设为默认模型</span>
                <span className="text-xs text-gray-500">（推荐使用的模型）</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={e =>
                    setFormData({ ...formData, isEnabled: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">启用此模型</span>
                <span className="text-xs text-gray-500">（禁用后不可用）</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {mode === "edit" && !hasChanges() ? (
                <span className="text-gray-500">
                  📝 未检测到任何修改
                </span>
              ) : !testResult || !testResult.success ? (
                <span className="text-amber-600">
                  ⚠️ 请先测试模型确保可用
                </span>
              ) : (
                <span className="text-green-600">
                  ✓ 模型已测试可用
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  loading ||
                  !testResult ||
                  !testResult.success ||
                  (mode === "edit" && !hasChanges())
                }
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "add" ? "添加" : "保存"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
