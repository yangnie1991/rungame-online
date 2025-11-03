'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Globe,
  RefreshCw,
  Database,
  Cpu,
  Search,
  FileText,
} from 'lucide-react'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

// 生成进度数据
interface GenerationProgress {
  phase: 'searching' | 'parsing' | 'generating'
  step: string
  progress: number
  current?: number
  total?: number
  details?: string
}

export interface AiGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // 游戏基本信息
  gameTitle: string
  locale: string

  // 关键词（可预填充）
  initialKeywords?: string

  // 可选的额外上下文
  originalDescription?: string
  markdownContent?: string        // 🎯 GamePix 导入页面提供
  extractedContent?: string

  // 分类信息（可选）
  category?: string
  categoryId?: string

  // 初始模式（可选）
  initialMode?: 'fast' | 'quality'

  // 生成完成回调
  onGenerated: (results: Record<string, string>) => void
}

type GenerationPhase = 'config' | 'generating' | 'preview'
type SeoMode = 'fast' | 'quality'

// 字段字符限制配置
const FIELD_CHARACTER_LIMITS: Record<string, number | undefined> = {
  metaTitle: 60,
  metaDescription: 160,
  description: 60,
  longDescription: undefined,
  controls: undefined,
  howToPlay: undefined,
  gameDetails: undefined,
  faq: undefined,
  extras: undefined,
  keywords: undefined,
}

// 生成字段定义
const GENERATION_FIELDS = [
  { id: 'description', label: '简短描述', description: '游戏的简短介绍' },
  { id: 'metaTitle', label: 'SEO 标题', description: 'SEO 优化标题（50-60字符）' },
  { id: 'metaDescription', label: 'SEO 描述', description: 'SEO 优化描述（140-160字符）' },
  { id: 'keywords', label: '关键词', description: 'SEO 关键词（5-10个）' },
  { id: 'controls', label: '控制方式', description: '游戏的操作控制说明' },
  { id: 'howToPlay', label: '如何游玩', description: '游戏玩法和规则介绍' },
  { id: 'gameDetails', label: '详细游戏信息', description: '游戏的详细特性和亮点' },
  { id: 'faq', label: '常见问题', description: '玩家常见问题解答' },
  { id: 'extras', label: '其他内容', description: '补充信息和提示' },
]

/**
 * 统一的 AI 内容生成对话框
 *
 * 适用场景：
 * 1. GamePix 导入页面（有 markdownContent）
 * 2. 新建游戏页面（无 markdownContent）
 * 3. 编辑游戏页面（可能有 markdownContent）
 */
export function AiGenerateDialog({
  open,
  onOpenChange,
  gameTitle,
  locale,
  initialKeywords,
  originalDescription,
  markdownContent,
  extractedContent,
  category,
  categoryId,
  initialMode,
  onGenerated
}: AiGenerateDialogProps) {
  // AI 配置状态
  const [availableConfigs, setAvailableConfigs] = useState<any[]>([])
  const [selectedConfigId, setSelectedConfigId] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')

  // 配置加载状态
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  // 关键词输入 - 主关键词默认使用游戏标题，副关键词过滤掉主关键词
  const [mainKeyword, setMainKeyword] = useState(gameTitle)
  const [subKeywords, setSubKeywords] = useState(() => {
    if (!initialKeywords) return ''
    // 过滤掉主关键词（游戏标题）
    const keywords = initialKeywords.split(',').map(k => k.trim()).filter(k => k && k.toLowerCase() !== gameTitle.toLowerCase())
    return keywords.join(', ')
  })
  const [seoMode, setSeoMode] = useState<SeoMode>(initialMode || 'quality')

  // 生成阶段
  const [phase, setPhase] = useState<GenerationPhase>('config')
  const [error, setError] = useState<string | null>(null)

  // 生成结果
  const [generatedResults, setGeneratedResults] = useState<Record<string, string>>({})
  const [editedResults, setEditedResults] = useState<Record<string, string>>({})
  const [citations, setCitations] = useState<any[]>([])

  // SSE 进度
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // 预览标签页
  const [activePreviewTab, setActivePreviewTab] = useState<string>('description')

  // 加载可用配置和模型
  useEffect(() => {
    if (open) {
      loadAiConfigsAndModels()
      // 重置关键词为初始值
      setMainKeyword(gameTitle)
      // 过滤掉主关键词（游戏标题）
      if (initialKeywords) {
        const keywords = initialKeywords.split(',').map(k => k.trim()).filter(k => k && k.toLowerCase() !== gameTitle.toLowerCase())
        setSubKeywords(keywords.join(', '))
      } else {
        setSubKeywords('')
      }
    } else {
      // 关闭对话框时清理 EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [open, gameTitle, initialKeywords])

  const loadAiConfigsAndModels = async () => {
    setLoadingConfigs(true)
    setConfigError(null)

    try {
      const { getAiConfigsWithModels } = await import('@/app/(admin)/admin/ai-config/actions')
      const configs = await getAiConfigsWithModels()

      if (configs.length === 0) {
        throw new Error('没有可用的 AI 配置')
      }

      setAvailableConfigs(configs)

      // 自动选中激活的配置
      const activeConfig = configs.find(c => c.isActive)
      const selectedConfig = activeConfig || configs[0]

      setSelectedConfigId(selectedConfig.id)
      setAvailableModels(selectedConfig.models)

      // 设置默认选中的模型
      const defaultModel = selectedConfig.models.find((m: any) => m.isDefault)
      if (defaultModel) {
        setSelectedModelId(defaultModel.id)
      } else if (selectedConfig.models.length > 0) {
        setSelectedModelId(selectedConfig.models[0].id)
      }
    } catch (err: any) {
      console.error('加载 AI 配置失败:', err)
      setConfigError(err.message || '无法加载 AI 配置列表')
    } finally {
      setLoadingConfigs(false)
    }
  }

  // 当选择的配置变化时，更新模型列表
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId)
    const selectedConfig = availableConfigs.find(c => c.id === configId)
    if (selectedConfig) {
      setAvailableModels(selectedConfig.models)
      const defaultModel = selectedConfig.models.find((m: any) => m.isDefault)
      if (defaultModel) {
        setSelectedModelId(defaultModel.id)
      } else if (selectedConfig.models.length > 0) {
        setSelectedModelId(selectedConfig.models[0].id)
      }
    }
  }

  const resetToConfig = () => {
    setPhase('config')
    setError(null)
    setGeneratedResults({})
    setEditedResults({})
    setCitations([])
    setGenerationProgress(null)

    // 清理 EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const handleGenerate = () => {
    // 验证
    if (!mainKeyword.trim()) {
      setError('主关键词为必填项')
      return
    }

    if (!selectedConfigId || !selectedModelId) {
      setError('请选择 AI 配置和模型')
      return
    }

    setPhase('generating')
    setError(null)
    setGenerationProgress(null)

    // 清理旧连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    try {
      // 构建 URL
      const url = new URL('/api/ai/generate-game-content-stream', window.location.origin)
      url.searchParams.set('gameTitle', gameTitle)
      url.searchParams.set('locale', locale)
      url.searchParams.set('keywords', mainKeyword.trim())

      if (subKeywords.trim()) {
        const subKeywordsList = subKeywords.split(',').map(k => k.trim())
        url.searchParams.set('subKeywords', JSON.stringify(subKeywordsList))
      }

      if (originalDescription) {
        url.searchParams.set('originalDescription', originalDescription)
      }

      // 🎯 markdownContent 可选（仅导入页面有）
      if (markdownContent) {
        url.searchParams.set('markdownContent', markdownContent)
      }

      if (extractedContent) {
        url.searchParams.set('extractedContent', extractedContent)
      }

      if (category) url.searchParams.set('category', category)
      if (categoryId) url.searchParams.set('categoryId', categoryId)

      url.searchParams.set('configId', selectedConfigId)
      url.searchParams.set('modelId', selectedModelId)
      url.searchParams.set('mode', seoMode)

      // 创建 SSE 连接
      const eventSource = new EventSource(url.toString())
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'progress') {
            setGenerationProgress(data.data)
          } else if (data.type === 'complete') {
            setGeneratedResults(data.data.results)
            setEditedResults(data.data.results)
            setCitations(data.data.citations || [])
            setActivePreviewTab('description')
            setPhase('preview')
            setGenerationProgress(null)
            eventSource.close()
            eventSourceRef.current = null
          } else if (data.type === 'error') {
            setError(data.error || '生成失败')
            setPhase('config')
            setGenerationProgress(null)
            eventSource.close()
            eventSourceRef.current = null
          }
        } catch (err) {
          console.error('解析 SSE 消息失败:', err)
        }
      }

      eventSource.onerror = () => {
        setError('连接失败，请检查网络后重试')
        setPhase('config')
        setGenerationProgress(null)
        eventSource.close()
        eventSourceRef.current = null
      }
    } catch (err: any) {
      console.error('启动生成失败:', err)
      setError(err.message || '启动失败，请重试')
      setPhase('config')
    }
  }

  const handleRegenerate = () => {
    resetToConfig()
  }

  const handleApplyToForm = () => {
    onGenerated(editedResults)
    onOpenChange(false)
    setTimeout(resetToConfig, 300)
  }

  const handleClose = () => {
    if (phase !== 'generating') {
      onOpenChange(false)
      setTimeout(resetToConfig, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI 内容生成
          </DialogTitle>
          <DialogDescription>
            {phase === 'config' && '配置生成选项，使用 AI 一次性生成所有字段的内容'}
            {phase === 'generating' && '正在生成内容，请稍候...'}
            {phase === 'preview' && '预览并编辑生成的内容，确认后应用到表单'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 配置阶段 */}
          {phase === 'config' && (
            <>
              {/* 游戏信息 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">游戏标题：</span>
                  <span className="text-gray-900">{gameTitle || '未命名游戏'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">语言：</span>
                  <span className="text-gray-900">{locale.toUpperCase()}</span>
                </div>
                {markdownContent && (
                  <div className="text-sm pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">
                        已提取游戏内容（{markdownContent.length} 字符）
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      AI 将参考提取的内容生成更准确的游戏说明
                    </p>
                  </div>
                )}
                {category && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">分类：</span>
                    <span className="text-gray-900">{category}</span>
                  </div>
                )}
              </div>

              {/* AI 配置选择 */}
              <div className="space-y-4 border rounded-lg p-4 bg-purple-50/30">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-medium text-gray-900">AI 配置</h4>
                  <span className="text-red-500">*</span>
                </div>

                {loadingConfigs ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 p-3 border rounded-lg bg-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在加载配置列表...
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="config-select">AI 供应商</Label>
                      <Select value={selectedConfigId} onValueChange={handleConfigChange}>
                        <SelectTrigger id="config-select" className="bg-white">
                          <SelectValue placeholder="选择 AI 供应商" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              <div className="flex items-center gap-2">
                                {config.name}
                                {config.isActive && (
                                  <Badge variant="secondary" className="text-xs">激活</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model-select" className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-600" />
                        AI 模型
                      </Label>
                      <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                        <SelectTrigger id="model-select" className="bg-white">
                          <SelectValue placeholder="选择 AI 模型" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                {model.name}
                                {model.isDefault && (
                                  <Badge variant="secondary" className="text-xs">默认</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* 关键词输入 */}
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50/30">
                <div className="space-y-2">
                  <Label htmlFor="main-keyword" className="flex items-center gap-1">
                    主关键词
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="main-keyword"
                    value={mainKeyword}
                    onChange={(e) => setMainKeyword(e.target.value)}
                    placeholder="例如：puzzle, action, adventure"
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    游戏的主要类型或特征，这是必填项
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub-keywords">
                    子关键词（可选）
                  </Label>
                  <Textarea
                    id="sub-keywords"
                    value={subKeywords}
                    onChange={(e) => setSubKeywords(e.target.value)}
                    placeholder="例如：multiplayer, 3D, casual, strategy"
                    rows={2}
                    className="resize-none bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    补充的游戏特征或标签，用逗号分隔
                  </p>
                </div>
              </div>

              {/* 生成模式选择 */}
              <div className="space-y-3 border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-medium text-gray-900">SEO 优化生成</h4>
                </div>

                <p className="text-xs text-gray-600 mb-3">
                  基于 Google Top 5 页面分析和竞品内容，生成符合 SEO 最佳实践的游戏内容
                </p>

                <div>
                  <Label className="text-sm mb-2 block">生成质量</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeoMode('fast')}
                      className={`px-3 py-2 rounded-md text-sm transition-all ${
                        seoMode === 'fast'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      快速模式 (~15s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeoMode('quality')}
                      className={`px-3 py-2 rounded-md text-sm transition-all ${
                        seoMode === 'quality'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      质量模式 (~30s)
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-purple-200">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-700">
                    {seoMode === 'fast'
                      ? '单步生成：直接基于竞品分析生成内容'
                      : '两步生成：先分析竞品策略，再针对性生成高质量内容'}
                  </p>
                </div>
              </div>

              {/* 生成字段说明 */}
              <div className="border rounded-lg p-4 bg-green-50/30">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">将生成以下字段</h4>
                    <p className="text-xs text-green-700 mt-1">
                      系统将自动生成所有字段的内容，您可以在预览阶段编辑它们
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {GENERATION_FIELDS.map(field => (
                    <div key={field.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 生成阶段 - 三阶段进度显示 */}
          {phase === 'generating' && (
            <div className="space-y-4 py-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                <div className="text-center w-full max-w-lg">
                  <p className="text-lg font-medium">正在生成内容...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    AI 正在分析游戏信息并生成 {GENERATION_FIELDS.length} 个字段的内容
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {selectedModelId && (
                      <Badge variant="outline" className="gap-1">
                        <Cpu className="w-3 h-3" />
                        {availableModels.find(m => m.id === selectedModelId)?.name || selectedModelId}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      SEO {seoMode === 'fast' ? '快速' : '质量'}模式
                    </Badge>
                  </div>

                  {/* 实时进度显示 */}
                  {generationProgress && (
                    <div className="mt-6 space-y-3 text-left">
                      {/* 阶段指示器 */}
                      <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${
                          generationProgress.phase === 'searching' ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          <Search className="w-4 h-4" />
                          <span className="text-xs font-medium">搜索竞品</span>
                        </div>
                        <div className={`flex items-center gap-2 ${
                          generationProgress.phase === 'parsing' ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-medium">解析网页</span>
                        </div>
                        <div className={`flex items-center gap-2 ${
                          generationProgress.phase === 'generating' ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-medium">生成内容</span>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            generationProgress.phase === 'searching' ? 'bg-blue-600' :
                            generationProgress.phase === 'parsing' ? 'bg-orange-600' :
                            'bg-purple-600'
                          }`}
                          style={{ width: `${generationProgress.progress}%` }}
                        />
                      </div>

                      {/* 当前步骤信息 */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {generationProgress.step}
                        </p>
                        {generationProgress.current !== undefined && generationProgress.total !== undefined && (
                          <p className="text-xs text-gray-600 mt-1">
                            进度: {generationProgress.current}/{generationProgress.total}
                          </p>
                        )}
                        {generationProgress.details && (
                          <p className="text-xs text-gray-500 mt-1 break-all">
                            {generationProgress.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 预览阶段 */}
          {phase === 'preview' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">生成完成</p>
                  <p className="text-sm text-green-700 mt-1">
                    已成功生成 {Object.keys(generatedResults).length} 个字段的内容。您可以预览和编辑这些内容，确认后应用到表单。
                  </p>
                </div>
              </div>

              {/* 引用来源 */}
              {citations.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900">参考来源</h4>
                  </div>
                  <div className="space-y-2">
                    {citations.map((citation, idx) => (
                      <div key={idx} className="text-xs">
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          [{idx + 1}] {citation.title || citation.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 可编辑内容标签页 */}
              <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
                <div className="border rounded-lg p-2 bg-gray-50 mb-4">
                  <TabsList className="h-auto flex flex-wrap gap-1 bg-transparent">
                    {GENERATION_FIELDS.map(field => (
                      <TabsTrigger
                        key={field.id}
                        value={field.id}
                        className="text-xs px-3 py-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                      >
                        {field.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {GENERATION_FIELDS.map(field => (
                  <TabsContent key={field.id} value={field.id} className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Label htmlFor={`edit-${field.id}`} className="text-base font-medium">
                          {field.label}
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      </div>
                    </div>

                    {/* 根据字段类型选择编辑器 */}
                    {field.id === 'keywords' || field.id === 'metaTitle' || field.id === 'metaDescription' || field.id === 'description' ? (
                      // 简单文本字段
                      <Textarea
                        value={editedResults[field.id] || ''}
                        onChange={(e) => setEditedResults(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                        rows={field.id === 'keywords' ? 2 : 3}
                        className="resize-none"
                      />
                    ) : (
                      // 富文本字段
                      <RichTextEditor
                        content={editedResults[field.id] || ''}
                        onChange={(html) => setEditedResults(prev => ({
                          ...prev,
                          [field.id]: html
                        }))}
                        placeholder={`生成的${field.label}内容将显示在这里...`}
                        characterLimit={FIELD_CHARACTER_LIMITS[field.id]}
                        showCharacterCount={true}
                        keywords={mainKeyword}
                        locale={locale}
                      />
                    )}

                    <p className="text-xs text-gray-500">
                      {FIELD_CHARACTER_LIMITS[field.id]
                        ? `✅ 此字段有字符限制（${FIELD_CHARACTER_LIMITS[field.id]} 单位）`
                        : '💡 此字段无字符限制，您可以自由编辑内容'
                      }
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">生成失败</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* 配置错误提示 */}
          {configError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">配置加载失败</p>
                <p className="text-sm text-red-700 mt-1">{configError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadAiConfigsAndModels}
                  className="mt-2"
                >
                  重新加载
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div>
            {phase === 'preview' && (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={phase === 'generating'}
            >
              {phase === 'preview' ? '取消' : '关闭'}
            </Button>

            {phase === 'config' && (
              <Button
                onClick={handleGenerate}
                disabled={!mainKeyword.trim() || !selectedConfigId || !selectedModelId || loadingConfigs}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                开始生成
              </Button>
            )}

            {phase === 'preview' && (
              <Button
                onClick={handleApplyToForm}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                应用到表单
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
