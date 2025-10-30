"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink } from "lucide-react"
import { AI_PROVIDERS } from "@/lib/ai-providers"
import type { AiProviderTemplate } from "@/types/ai-config"

interface ProviderSelectorProps {
  onSelect: (provider: AiProviderTemplate) => void
  selectedProvider?: string
}

export function ProviderSelector({ onSelect, selectedProvider }: ProviderSelectorProps) {
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">选择 AI 提供商</h2>
        <p className="text-gray-500">
          选择一个 AI 供应商来配置 API 密钥和模型
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {AI_PROVIDERS.map(provider => {
          const isSelected = selectedProvider === provider.provider
          const isHovered = hoveredProvider === provider.provider

          return (
            <Card
              key={provider.provider}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 border-2 shadow-lg"
                  : isHovered
                  ? "border-gray-400 shadow-md"
                  : "hover:border-gray-300"
              }`}
              onMouseEnter={() => setHoveredProvider(provider.provider)}
              onMouseLeave={() => setHoveredProvider(null)}
              onClick={() => onSelect(provider)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                      {isSelected && (
                        <Badge className="bg-blue-500">
                          <Check className="h-3 w-3 mr-1" />
                          已选择
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* 预设模型展示 */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      预设推荐模型 ({provider.defaultModels.length} 个)
                    </p>
                    <div className="space-y-1">
                      {provider.defaultModels.slice(0, 3).map((model, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span className="font-medium">{model.name}</span>
                          {model.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              默认
                            </Badge>
                          )}
                        </div>
                      ))}
                      {provider.defaultModels.length > 3 && (
                        <p className="text-xs text-gray-500 ml-4">
                          还有 {provider.defaultModels.length - 3} 个模型...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 文档链接 */}
                  <div className="pt-3 border-t">
                    <a
                      href={provider.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      查看官方文档
                    </a>
                  </div>

                  {/* 选择按钮 */}
                  <Button
                    type="button"
                    className="w-full mt-2"
                    variant={isSelected ? "default" : "outline"}
                    onClick={e => {
                      e.stopPropagation()
                      onSelect(provider)
                    }}
                  >
                    {isSelected ? "已选择此供应商" : "选择此供应商"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 提示：</span>
          选择供应商后，系统会自动加载推荐的模型配置，你也可以手动添加或修改模型。
        </p>
      </div>
    </div>
  )
}
