'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Info, ExternalLink, Sparkles, Maximize2, Minimize2, AlertCircle, Cpu, Download, Database, ChevronDown } from 'lucide-react'
import { TagInputField } from '@/components/admin/TagInputField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImportProgressDialog, DEFAULT_IMPORT_STEPS, type ImportStep, type ImportStepStatus } from './ImportProgressDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { GamePixGameItem } from '@/lib/gamepix-importer'
import { GamePixExtractButton, type ExtractedGameData } from './GamePixExtractButton'
import { matchGamePixCategory } from '@/app/(admin)/admin/games/import-actions'
import { removeWidthParameter } from '@/lib/gamepix-image-upload'
import { ImageFieldWithUpload } from './ImageFieldWithUpload'
import { ScreenshotsFieldWithUpload } from './ScreenshotsFieldWithUpload'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  CONTENT_SECTION_KEYS,
  CONTENT_SECTION_LABELS,
  CONTENT_SECTION_PLACEHOLDERS,
  DEFAULT_CONTENT_SECTIONS,
  type ContentSection,
  type ContentSectionKey,
} from '@/lib/types/game-info'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { SeoTextInput } from '@/components/admin/SeoTextInput'
import { KeywordsTagInput } from '@/components/admin/KeywordsTagInput'
import { AiGenerateDialog } from './AiGenerateDialog'

// ContentSection 验证 schema
const contentSectionSchema = z.object({
  content: z.union([
    z.string(),
    z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
  ]),
  order: z.number().int().min(1),
})

// 翻译内容 schema（每种语言的内容）
const translationContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  // ContentSections（5个富文本区块）
  contentSections: z.object({
    [CONTENT_SECTION_KEYS.CONTROLS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.GAME_DETAILS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.FAQ]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.EXTRAS]: contentSectionSchema.optional(),
  }).optional(),
})

// 导入表单验证 Schema
const importFormSchema = z.object({
  // ========== 核心必需字段 ==========
  slug: z.string().min(1, "URL slug 不能为空"),
  thumbnail: z.string().url("必须是有效的URL"),
  embedUrl: z.string().url("必须是有效的URL"),

  // ========== 基础信息 ==========
  categoryId: z.string().min(1, '请选择分类'),
  existingTagIds: z.array(z.string()).default([]), // 已存在的标签 ID（绿色）
  newTagNames: z.array(z.string()).default([]), // 新标签名称（红色，需要创建）

  // ========== 游戏尺寸 ==========
  width: z.coerce.number().int().min(100, "宽度至少100px").default(800),
  height: z.coerce.number().int().min(100, "高度至少100px").default(600),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),

  // ========== 媒体资源 ==========
  banner: z.string().url("必须是有效的URL").optional().or(z.literal("")),
  gameUrl: z.string().url("必须是有效的URL").optional().or(z.literal("")),
  screenshots: z.array(z.string().url("必须是有效的URL")).default([]),
  videos: z.array(z.string().url("必须是有效的URL")).default([]),

  // ========== 发布设置 ==========
  status: z.enum(['DRAFT', 'PUBLISHED', 'MAINTENANCE', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),

  // ========== 质量评分 ==========
  qualityScore: z.number().min(0).max(1).optional(),

  // ========== 来源信息 ==========
  sourcePlatform: z.string().default('gamepix'),
  sourcePlatformId: z.string(),

  // ========== 开发者信息 ==========
  developer: z.string().optional(),
  developerUrl: z.string().url("必须是有效的URL").optional().or(z.literal("")),

  // ========== 时间字段 ==========
  releaseDate: z.string().datetime().optional(),
  sourceUpdatedAt: z.string().datetime().optional(),
  importedAt: z.string().datetime(),

  // ========== 英文主表字段 ==========
  title: z.string().min(1, "英文标题不能为空"),
  description: z.string().optional(),
  keywords: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  // 英文 ContentSections
  contentSections: z.object({
    [CONTENT_SECTION_KEYS.CONTROLS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.GAME_DETAILS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.FAQ]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.EXTRAS]: contentSectionSchema.optional(),
  }).optional(),

  // ========== 多语言翻译 ==========
  translations: z.array(
    z.object({
      locale: z.string(),
      ...translationContentSchema.shape,
    })
  ).default([]),
})

export type ImportFormData = z.infer<typeof importFormSchema>

// ========== ContentSections 编辑器组件（可复用）==========
interface ContentSectionsEditorProps {
  pathPrefix: string // 表单路径前缀，如 'contentSections' 或 'translations.0.contentSections'
  form: any // react-hook-form 实例
}

function ContentSectionsEditor({ pathPrefix, form }: ContentSectionsEditorProps) {
  // 定义所有区块配置（按顺序）
  const sections = [
    { key: CONTENT_SECTION_KEYS.CONTROLS, order: 1 },
    { key: CONTENT_SECTION_KEYS.HOW_TO_PLAY, order: 2 },
    { key: CONTENT_SECTION_KEYS.GAME_DETAILS, order: 3 },
    { key: CONTENT_SECTION_KEYS.FAQ, order: 4 },
    { key: CONTENT_SECTION_KEYS.EXTRAS, order: 5 },
  ]

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">内容区块</Label>

      {sections.map(({ key, order }) => (
        <div key={key} className="space-y-2">
          <Label>{CONTENT_SECTION_LABELS[key as ContentSectionKey]}</Label>
          <RichTextEditor
            content={form.watch(`${pathPrefix}.${key}.content` as any) || ''}
            onChange={(html) => {
              form.setValue(`${pathPrefix}.${key}` as any, {
                content: html,
                order
              })
            }}
            placeholder={CONTENT_SECTION_PLACEHOLDERS[key as ContentSectionKey]}
            characterLimit={undefined}
            showCharacterCount={false}
          />
        </div>
      ))}
    </div>
  )
}

interface GameImportConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: GamePixGameItem | null
  categories: Array<{
    id: string
    name: string
    nameEn: string
    displayName: string
    displayNameEn: string
    parentId: string | null
    parentName: string
    parentNameEn: string
  }>
  tags: Array<{ id: string; name: string }>
  onConfirm: (gameId: string, data: ImportFormData) => Promise<void>
  onLoadCategories?: () => Promise<boolean>  // 加载分类的回调函数
  isImporting?: boolean
  isLoadingCategories?: boolean  // 添加分类加载状态
}

export function GameImportConfirmDialog({
  open,
  onOpenChange,
  game,
  categories: propsCategories,
  tags,
  onConfirm,
  onLoadCategories,
  isImporting = false,
  isLoadingCategories = false,
}: GameImportConfirmDialogProps) {
  const [activeLocale, setActiveLocale] = useState('en')
  const [extraDetails, setExtraDetails] = useState<ExtractedGameData | null>(null)

  // 🔧 本地分类列表状态（允许添加自动匹配的分类）
  const [categories, setCategories] = useState(propsCategories)

  // 当 props 中的分类更新时，同步到本地状态
  useEffect(() => {
    if (propsCategories.length > 0) {
      setCategories(propsCategories)
    }
  }, [propsCategories])

  // 自动匹配分类状态
  const [isMatchingCategory, setIsMatchingCategory] = useState(false)
  const [matchedCategoryInfo, setMatchedCategoryInfo] = useState<{
    categoryId: string
    mainCategoryId: string
    categoryName: string
    mainCategoryName: string
  } | null>(null)

  // AI 生成状态
  const [batchGenerateLocale, setBatchGenerateLocale] = useState('en')
  const [selectedAiConfigId, setSelectedAiConfigId] = useState<string>('')  // 选中的 AI 配置 ID
  const [selectedModelId, setSelectedModelId] = useState<string>('')  // 选中的模型 ID
  const [availableAiConfigs, setAvailableAiConfigs] = useState<any[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [showAiConfigDialog, setShowAiConfigDialog] = useState(false)

  // AI 生成配置
  const [aiConfig, setAiConfig] = useState({
    mainKeyword: '',
    subKeywords: [] as string[],
  })

  // 弹窗大小控制
  const [isFullscreen, setIsFullscreen] = useState(false)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      slug: '',
      thumbnail: '',
      embedUrl: '',
      categoryId: '',
      existingTagIds: [],
      newTagNames: [],
      width: 800,
      height: 600,
      orientation: 'landscape',
      status: 'DRAFT',
      qualityScore: 0,
      sourcePlatform: 'gamepix',
      sourcePlatformId: '',
      developer: '',
      developerUrl: '',
      releaseDate: undefined,
      sourceUpdatedAt: undefined,
      importedAt: new Date().toISOString(),
      banner: '',
      gameUrl: '',
      screenshots: [],
      videos: [],
      isFeatured: false,
      title: '',
      description: '',
      keywords: '',
      metaTitle: '',
      metaDescription: '',
      contentSections: {},
      translations: [],
    },
  })

  // useFieldArray 用于管理截图和视频数组
  const { fields: screenshotFields, append: appendScreenshot, remove: removeScreenshot } = useFieldArray({
    control: form.control,
    name: 'screenshots' as any,
  })

  const { fields: videoFields, append: appendVideo, remove: removeVideo } = useFieldArray({
    control: form.control,
    name: 'videos' as any,
  })

  // 动态翻译数组
  const { fields: translationFields, append: appendTranslation, update: updateTranslation } = useFieldArray({
    control: form.control,
    name: 'translations' as any,
  })

  // 获取当前选择的分类信息
  const categoryId = form.watch('categoryId')
  const selectedCategory = categories.find(c => c.id === categoryId)

  // ========== 辅助函数 ==========

  // Slug 生成函数
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')      // 空格替换为 -
      .replace(/[^\w\-]+/g, '')  // 删除非字母数字和连字符的字符
      .replace(/\-\-+/g, '-')    // 多个连字符替换为单个
      .replace(/^-+/, '')        // 删除开头的连字符
      .replace(/-+$/, '')        // 删除结尾的连字符
  }

  // 计算 AspectRatio
  const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height) return '16:9'
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(width, height)
    return `${width / divisor}:${height / divisor}`
  }

  // 🎯 统一的标签分类函数（所有数据源都使用此函数）
  const classifyTags = useCallback((tagNames: string[], source: string = 'unknown'): {
    existingIds: string[]
    newNames: string[]
  } => {
    const existingIds: string[] = []
    const newNames: string[] = []

    console.log(`🔄 [标签分类-${source}] 开始分类 ${tagNames.length} 个标签`)
    console.log(`🔄 [标签分类-${source}] 可用标签列表: ${tags.length} 个`)

    tagNames.forEach(tagName => {
      const normalizedName = tagName.trim()
      if (!normalizedName) return // 跳过空标签

      // 尝试在已有标签中匹配（忽略大小写）
      const matchedTag = tags.find(dbTag =>
        dbTag.name.toLowerCase() === normalizedName.toLowerCase()
      )

      if (matchedTag) {
        // ✅ 已存在的标签（绿色）
        existingIds.push(matchedTag.id)
        console.log(`  ✅ [${source}] 已存在: "${tagName}" → ID: ${matchedTag.id}`)
      } else {
        // 🆕 新标签（红色）
        newNames.push(normalizedName)
        console.log(`  🆕 [${source}] 新标签: "${normalizedName}" (需要创建)`)
      }
    })

    console.log(`✅ [标签分类-${source}] 完成: ${existingIds.length} 个已存在, ${newNames.length} 个待创建`)

    return { existingIds, newNames }
  }, [tags])

  // 🎯 当弹窗关闭时，清理所有状态和表单数据
  useEffect(() => {
    if (!open) {
      // 延迟清理，确保动画完成后再清理数据
      const timer = setTimeout(() => {
        // 重置所有状态
        setExtraDetails(null)
        setMatchedCategoryInfo(null)
        setIsMatchingCategory(false)
        setActiveLocale('en')
        setBatchGenerateLocale('en')
        setSelectedAiConfigId('')
        setSelectedModelId('')
        setAvailableAiConfigs([])
        setAvailableModels([])
        setLoadingConfigs(false)
        setConfigError(null)
        setShowAiConfigDialog(false)
        setAiConfig({
          mainKeyword: '',
          subKeywords: [],
        })
        setIsFullscreen(false)
        setIsGenerating(false)
        setGenerationProgress('')

        // 重置表单
        form.reset()

        console.log('✅ 弹窗关闭，已清理所有状态和表单数据')
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [open, form])

  // 加载 AI 配置和模型列表
  useEffect(() => {
    if (showAiConfigDialog) {
      loadAiConfigsAndModels()
    }
  }, [showAiConfigDialog])

  const loadAiConfigsAndModels = async () => {
    setLoadingConfigs(true)
    setConfigError(null)

    try {
      const { getAiConfigsWithModels } = await import('@/app/(admin)/admin/ai-config/actions')
      const configs = await getAiConfigsWithModels()

      if (configs.length === 0) {
        throw new Error('没有可用的 AI 配置')
      }

      setAvailableAiConfigs(configs)

      // 自动选中激活的配置
      const activeConfig = configs.find(c => c.isActive)
      const selectedConfig = activeConfig || configs[0]

      setSelectedAiConfigId(selectedConfig.id)
      setAvailableModels(selectedConfig.models)

      // 设置默认选中的模型
      const defaultModel = selectedConfig.models.find((m: any) => m.isDefault)
      if (defaultModel) {
        setSelectedModelId(defaultModel.id)
      } else if (selectedConfig.models.length > 0) {
        setSelectedModelId(selectedConfig.models[0].id)
      }
    } catch (error: any) {
      console.error('加载 AI 配置失败:', error)
      setConfigError(error.message || '无法加载 AI 配置列表')
    } finally {
      setLoadingConfigs(false)
    }
  }

  // 当选择的配置变化时，更新模型列表
  const handleAiConfigChange = (configId: string) => {
    setSelectedAiConfigId(configId)
    const selectedConfig = availableAiConfigs.find(c => c.id === configId)
    if (selectedConfig) {
      setAvailableModels(selectedConfig.models)
      // 自动选中默认模型
      const defaultModel = selectedConfig.models.find((m: any) => m.isDefault)
      if (defaultModel) {
        setSelectedModelId(defaultModel.id)
      } else if (selectedConfig.models.length > 0) {
        setSelectedModelId(selectedConfig.models[0].id)
      }
    }
  }

  // 从缓存加载提取数据
  useEffect(() => {
    if (open && game?.namespace) {
      loadCachedExtractedData()
    }
  }, [open, game?.namespace])

  const loadCachedExtractedData = async () => {
    if (!game?.namespace) return

    try {
      const { getGamePixExtractedData } = await import('@/app/(admin)/admin/games/import-actions')
      const result = await getGamePixExtractedData(game.namespace)

      if (result.success && result.data) {
        const { tags: cachedTags, markdownContent, videos, screenshots } = result.data

        // 如果有缓存数据，自动填充
        if (markdownContent || cachedTags.length > 0 || videos?.length > 0 || screenshots?.length > 0) {
          const extractedData: ExtractedGameData = {
            markdownContent: markdownContent || undefined,
            tags: cachedTags.map(name => ({ name })),
            videos: videos?.map(url => ({ url, platform: 'unknown' })) || [],
            screenshots: screenshots?.map(url => ({ url })) || [],
          }

          setExtraDetails(extractedData)

          // 🔧 将缓存数据填充到表单字段

          // 1. 填充标签并分类（已存在 vs 新标签）
          if (cachedTags.length > 0) {
            // 🎯 统一使用 classifyTags 函数进行分类
            if (tags.length === 0) {
              // 标签列表还未加载，先暂存到 newTagNames，等标签加载后再分类
              console.log('⚠️ [缓存数据源] 标签列表尚未加载，暂存待分类')
              form.setValue('newTagNames', cachedTags.map(t => t.trim()))
              form.setValue('existingTagIds', [])
            } else {
              // 标签列表已加载，调用统一的分类函数
              const { existingIds, newNames } = classifyTags(cachedTags, '缓存数据源')
              form.setValue('existingTagIds', existingIds)
              form.setValue('newTagNames', newNames)
            }
          }

          // 2. 填充视频到表单（提取 URL 字符串数组）
          if (videos && videos.length > 0) {
            // videos 从缓存返回的是字符串数组，直接使用
            form.setValue('videos', videos)
          }

          // 3. 填充截图到表单（提取 URL 字符串数组）
          if (screenshots && screenshots.length > 0) {
            // 获取现有截图（可能包含 thumbnail 和 banner）
            const existingScreenshots = form.getValues('screenshots') || []
            // 合并缓存截图和现有截图，去重
            const allScreenshots = [...new Set([...existingScreenshots, ...screenshots])]
            form.setValue('screenshots', allScreenshots)
          }

          console.log('✅ 已从缓存加载提取数据并填充到表单')
          console.log(`  - 标签: ${cachedTags.length} 个`)
          console.log(`  - 视频: ${videos?.length || 0} 个`)
          console.log(`  - 截图: ${screenshots?.length || 0} 个`)
        }
      }
    } catch (error) {
      console.error('加载缓存数据失败:', error)
    }
  }

  // 🎯 当 tags 加载完成后，重新分类已有的标签（针对标签列表延迟加载的情况）
  useEffect(() => {
    if (tags.length > 0) {
      const currentNewTags = form.getValues('newTagNames') || []
      const currentExistingIds = form.getValues('existingTagIds') || []

      // 🔧 简化条件：只有当有待分类的标签且当前没有已存在标签时才重新分类
      // （这表明之前标签列表未加载，所有标签都被暂存到 newTagNames）
      if (currentNewTags.length === 0 || currentExistingIds.length > 0) {
        return
      }

      console.log('🔄 [重新分类] Tags 已加载，重新分类待分类标签...')
      console.log('🔄 [重新分类] 待分类标签数量:', currentNewTags.length)

      // 🎯 使用统一的分类函数
      const { existingIds, newNames } = classifyTags(currentNewTags, '重新分类')

      form.setValue('existingTagIds', existingIds)
      form.setValue('newTagNames', newNames)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, classifyTags])

  // 当打开 AI 配置对话框时，自动填充关键词
  useEffect(() => {
    if (showAiConfigDialog && game) {
      const currentKeywords = batchGenerateLocale === 'en'
        ? form.watch('keywords')
        : (() => {
            const translationIndex = form.watch('translations')?.findIndex(t => t.locale === batchGenerateLocale)
            return translationIndex !== undefined && translationIndex >= 0
              ? form.watch(`translations.${translationIndex}.keywords`)
              : ''
          })()

      if (currentKeywords) {
        const keywords = currentKeywords.split(',').map(k => k.trim()).filter(k => k)
        setAiConfig(prev => ({
          ...prev,
          mainKeyword: keywords[0] || game.category,
          subKeywords: keywords.slice(1),
        }))
      } else {
        // 如果没有关键词，使用游戏分类作为主关键词
        setAiConfig(prev => ({
          ...prev,
          mainKeyword: game.category,
          subKeywords: [],
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiConfigDialog, batchGenerateLocale, game?.category])

  // 当游戏数据变化时，预填充表单
  useEffect(() => {
    if (game) {
      // ========== 1. 核心必需字段 ==========
      form.setValue('slug', generateSlug(game.namespace || game.title))
      // 去除 ?w= 参数，获取原始图片
      form.setValue('thumbnail', removeWidthParameter(game.image))
      form.setValue('embedUrl', game.url)

      // ========== 2. 游戏尺寸和方向 ==========
      form.setValue('width', game.width)
      form.setValue('height', game.height)
      form.setValue('orientation', game.orientation)

      // ========== 3. 状态和质量评分 ==========
      form.setValue('status', 'PUBLISHED') // 默认发布状态，导入后直接可用
      form.setValue('qualityScore', game.quality_score)

      // ========== 4. 来源信息 ==========
      form.setValue('sourcePlatform', 'gamepix')
      form.setValue('sourcePlatformId', game.id)

      // ========== 5. 开发者信息 ==========
      // 这些字段在 GamePix RSS 中不存在，留空
      form.setValue('developer', '')
      form.setValue('developerUrl', '')

      // ========== 6. 时间字段 ==========
      if (game.date_published) {
        // 转换为标准 ISO 8601 格式字符串
        const releaseDateISO = new Date(game.date_published).toISOString()
        console.log('📅 设置 releaseDate:', {
          原始值: game.date_published,
          类型: typeof game.date_published,
          转换后: releaseDateISO,
          转换后类型: typeof releaseDateISO
        })
        form.setValue('releaseDate', releaseDateISO)
      }
      if (game.date_modified) {
        // 转换为标准 ISO 8601 格式字符串
        const sourceUpdatedAtISO = new Date(game.date_modified).toISOString()
        console.log('📅 设置 sourceUpdatedAt:', {
          原始值: game.date_modified,
          类型: typeof game.date_modified,
          转换后: sourceUpdatedAtISO,
          转换后类型: typeof sourceUpdatedAtISO
        })
        form.setValue('sourceUpdatedAt', sourceUpdatedAtISO)
      }
      form.setValue('importedAt', new Date().toISOString())

      // ========== 7. 媒体资源 ==========
      form.setValue('banner', removeWidthParameter(game.banner_image || '')) // 去除 w= 参数
      form.setValue('gameUrl', game.url || '')

      // ========== 8. 英文主表字段 ==========
      form.setValue('title', game.title)
      form.setValue('description', game.description)
      form.setValue('keywords', `${game.title}, ${game.category}, online game, free game, html5 game`)
      form.setValue('metaTitle', `${game.title} - Play Free Online`)
      form.setValue('metaDescription', game.description.substring(0, 160))

      // ========== 9. 发布设置 ==========
      // 默认不设置为精选游戏，需要手动选择
      form.setValue('isFeatured', false)

      // ========== 10. 初始化翻译数组（EN 和 ZH）==========
      const initialTranslations = [
        {
          locale: 'zh',
          title: game.title,
          description: game.description,
          keywords: `${game.title}, ${game.category}, 在线游戏, 免费游戏, HTML5游戏`,
          metaTitle: `${game.title} - 免费在线游玩`,
          metaDescription: game.description.substring(0, 160),
          contentSections: {},
        }
      ]

      // 使用 replace 方法替换整个 translations 数组
      form.setValue('translations', initialTranslations)

      console.log('✅ 表单已初始化，包含所有新字段')
    }
  }, [game, form])

  // 执行导入的核心逻辑
  const executeImport = async (data: any) => {
    console.log('🚀 开始执行导入流程')

    // 重置进度状态
    setImportSteps(DEFAULT_IMPORT_STEPS.map(step => ({ ...step, status: 'pending' as ImportStepStatus })))
    setCurrentStepIndex(0)
    setOverallProgress(0)
    setImportError(null)

    // 显示进度弹窗
    setShowImportProgress(true)

    // 辅助函数：更新步骤状态
    const updateStep = (stepId: string, status: ImportStepStatus, progress?: number, error?: string) => {
      setImportSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? { ...step, status, progress, error }
            : step
        )
      )
    }

    // 辅助函数：设置当前步骤
    const setStep = (index: number) => {
      setCurrentStepIndex(index)
      const progress = Math.round((index / DEFAULT_IMPORT_STEPS.length) * 100)
      setOverallProgress(progress)
    }

    try {
      let allTagIds = [...(data.existingTagIds || [])]

      // ========== 预处理：创建新标签（如果有）==========
      if (data.newTagNames && data.newTagNames.length > 0) {
        console.log('🔄 预处理：创建新标签...', data.newTagNames)

        const { batchCreateTags } = await import('@/app/(admin)/admin/games/import-actions')
        const result = await batchCreateTags(data.newTagNames)

        if (result.success && result.data) {
          const newTagIds = result.data.map(tag => tag.id)
          allTagIds = [...allTagIds, ...newTagIds]
          console.log(`✅ 标签创建成功，新增 ${newTagIds.length} 个标签`)
        } else {
          throw new Error(result.error || '创建标签失败')
        }
      }

      // 构造最终提交数据
      const submitData: ImportFormData = {
        ...data,
        tagIds: allTagIds,
        dimensions: {
          width: data.width,
          height: data.height,
          aspectRatio: calculateAspectRatio(data.width, data.height),
          orientation: data.orientation,
        },
      }

      console.log('📤 提交游戏数据:', submitData)

      // ========== 调用 SSE 导入 API ==========
      const response = await fetch('/api/admin/import-game-with-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, config: submitData }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 处理 SSE 流
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let finalResult: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue

          try {
            const jsonStr = line.substring(5).trim()
            const eventData = JSON.parse(jsonStr)

            if (eventData.step && eventData.message) {
              // 进度更新
              const stepIndex = eventData.step - 1
              setStep(stepIndex)

              const stepId = DEFAULT_IMPORT_STEPS[stepIndex]?.id
              if (stepId) {
                updateStep(stepId, 'running', eventData.percentage)
              }

              console.log(`[导入进度] ${eventData.percentage}% - ${eventData.message}`)
            } else if (eventData.success && eventData.gameId) {
              // 完成
              setOverallProgress(100)
              DEFAULT_IMPORT_STEPS.forEach(step => {
                updateStep(step.id, 'success')
              })
              finalResult = eventData
              console.log('✅ 导入成功:', eventData)
            } else if (eventData.error) {
              // 错误
              const currentStep = DEFAULT_IMPORT_STEPS[currentStepIndex]
              if (currentStep) {
                updateStep(currentStep.id, 'error', undefined, eventData.error)
              }
              setImportError(eventData.error)
              throw new Error(eventData.error)
            }
          } catch (e) {
            console.warn('解析 SSE 数据失败:', line, e)
          }
        }
      }

      if (!finalResult || !finalResult.success) {
        throw new Error('导入失败：未收到成功响应')
      }

      // 导入成功，延迟关闭
      setTimeout(() => {
        setShowImportProgress(false)
        onOpenChange(false)
      }, 2000)

    } catch (error: any) {
      console.error('导入失败:', error)
      setImportError(error.message || '导入失败')

      // 标记当前步骤为失败
      const currentStep = DEFAULT_IMPORT_STEPS[currentStepIndex]
      if (currentStep) {
        updateStep(currentStep.id, 'error', undefined, error.message)
      }
    }
  }

  const handleSubmit = form.handleSubmit(async (data: any) => {
    console.log('🎯 handleSubmit 被调用')

    if (!game) {
      console.log('❌ game 为 null，提前返回')
      return
    }

    // 阻止表单重复提交
    if (showImportProgress) {
      console.log('⚠️ 导入进行中，跳过重复提交')
      return
    }

    await executeImport(data)
  })

  // 自动匹配分类
  const handleAutoMatchCategory = async () => {
    if (!game) return

    setIsMatchingCategory(true)
    setMatchedCategoryInfo(null)

    try {
      const result = await matchGamePixCategory(game.category)

      if (result.success && result.data) {
        setMatchedCategoryInfo({
          categoryId: result.data.categoryId,
          mainCategoryId: result.data.mainCategoryId,
          categoryName: result.data.categoryName,
          mainCategoryName: result.data.mainCategoryName,
        })

        // 🔧 如果分类列表为空，尝试重新加载分类列表
        if (categories.length === 0) {
          console.log('⚠️ 分类列表为空，尝试重新加载...')

          if (onLoadCategories) {
            const loadSuccess = await onLoadCategories()

            if (loadSuccess) {
              console.log('✅ 分类列表加载成功')
              // 加载成功后，自动填充到表单并触发验证
              form.setValue('categoryId', result.data.categoryId, { shouldValidate: true })
            } else {
              // 加载失败，添加临时分类项并提示用户
              console.log('❌ 分类列表加载失败，使用临时分类')
              const tempCategory = {
                id: result.data.categoryId,
                name: result.data.categoryName,
                nameEn: result.data.categoryName,
                displayName: result.data.categoryName,
                displayNameEn: result.data.categoryName,
                parentId: result.data.mainCategoryId,
                parentName: result.data.mainCategoryName,
                parentNameEn: result.data.mainCategoryName,
              }
              setCategories([tempCategory])
              form.setValue('categoryId', result.data.categoryId, { shouldValidate: true })

              alert('⚠️ 分类列表加载失败，已使用匹配结果。如需查看完整分类列表，请刷新页面后重试。')
            }
          } else {
            // 没有提供加载函数，直接使用临时分类
            console.log('⚠️ 未提供分类加载函数，使用临时分类')
            const tempCategory = {
              id: result.data.categoryId,
              name: result.data.categoryName,
              nameEn: result.data.categoryName,
              displayName: result.data.categoryName,
              displayNameEn: result.data.categoryName,
              parentId: result.data.mainCategoryId,
              parentName: result.data.mainCategoryName,
              parentNameEn: result.data.mainCategoryName,
            }
            setCategories([tempCategory])
            form.setValue('categoryId', result.data.categoryId, { shouldValidate: true })
          }
        } else {
          // 分类列表不为空，直接填充并触发验证
          form.setValue('categoryId', result.data.categoryId, { shouldValidate: true })

          // 如果匹配的分类不在列表中，添加临时分类项
          const categoryExists = categories.some(cat => cat.id === result.data.categoryId)
          if (!categoryExists) {
            console.log('⚠️ 匹配的分类不在列表中，添加临时分类项')
            const tempCategory = {
              id: result.data.categoryId,
              name: result.data.categoryName,
              nameEn: result.data.categoryName,
              displayName: result.data.categoryName,
              displayNameEn: result.data.categoryName,
              parentId: result.data.mainCategoryId,
              parentName: result.data.mainCategoryName,
              parentNameEn: result.data.mainCategoryName,
            }
            setCategories(prev => [...prev, tempCategory])
          }
        }
      } else {
        // 未找到匹配
        setMatchedCategoryInfo(null)
        alert(result.error || `未能找到与 "${game.category}" 匹配的本地分类`)
      }
    } catch (error) {
      console.error('自动匹配分类失败:', error)
      alert('自动匹配分类失败，请手动选择')
    } finally {
      setIsMatchingCategory(false)
    }
  }

  // 处理从浏览器插件提取的数据
  const handleDataExtracted = (data: ExtractedGameData) => {
    console.log('收到提取的数据:', data)
    setExtraDetails(data as any)

    // ========== 1. 标签处理（分离存储）==========
    if (data.tags && data.tags.length > 0) {
      const tagNames = data.tags.map(t => t.name)

      // 🎯 统一使用 classifyTags 函数进行分类
      if (tags.length === 0) {
        // 标签列表还未加载，先暂存到 newTagNames，等标签加载后再分类
        console.log('⚠️ [浏览器插件数据源] 标签列表尚未加载，暂存待分类')
        form.setValue('newTagNames', tagNames.map(t => t.trim()))
        form.setValue('existingTagIds', [])
      } else {
        // 标签列表已加载，调用统一的分类函数
        const { existingIds, newNames } = classifyTags(tagNames, '浏览器插件数据源')
        form.setValue('existingTagIds', existingIds)
        form.setValue('newTagNames', newNames)
      }
    }

    // ========== 2. 多媒体资源（自动填充到表单）==========
    if (data.screenshots && data.screenshots.length > 0) {
      const screenshotUrls = data.screenshots.map(s => s.url)
      form.setValue('screenshots', screenshotUrls)
      console.log(`✅ 已填充 ${screenshotUrls.length} 张截图`)
    }

    if (data.videos && data.videos.length > 0) {
      const videoUrls = data.videos.map(v => v.url)
      form.setValue('videos', videoUrls)
      console.log(`✅ 已填充 ${videoUrls.length} 个视频`)
    }

    // ========== 3. 开发者信息（自动填充到表单）==========
    if (data.developer) {
      form.setValue('developer', data.developer)
      console.log(`✅ 已填充开发者: ${data.developer}`)
    }

    if (data.developerUrl) {
      form.setValue('developerUrl', data.developerUrl)
      console.log(`✅ 已填充开发者URL: ${data.developerUrl}`)
    }

    // ========== 4. Markdown 内容（保存到状态，供 AI 使用）==========
    if (data.markdownContent) {
      console.log('✅ Markdown 内容已保存，供 AI 批量生成使用')
      console.log('📝 Markdown 内容预览（前200字符）:')
      console.log(data.markdownContent.substring(0, 200) + '...')
    }

    console.log('✅ 插件数据处理完成：标签匹配 + 多媒体填充 + 开发者信息 + Markdown 内容')
  }

  // ========== AI 批量生成 - GamePix 导入专用逻辑 ==========
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [generationPercentage, setGenerationPercentage] = useState(0)
  const [generationStep, setGenerationStep] = useState(0)
  const [generationTotal, setGenerationTotal] = useState(0)

  // 导入进度状态（使用独立弹窗）
  const [showImportProgress, setShowImportProgress] = useState(false)
  const [importSteps, setImportSteps] = useState<ImportStep[]>(DEFAULT_IMPORT_STEPS)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)

  const handleGamePixAIGenerate = async () => {
    if (!game || !extraDetails?.markdownContent) {
      alert('请先使用"从网页获取更多信息"提取游戏的完整内容')
      return
    }

    if (!aiConfig.mainKeyword) {
      alert('请先设置主关键词')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(`初始化 ${aiConfigMode === 'fast' ? '快速' : '质量'} 模式...`)
    setGenerationPercentage(0)
    setGenerationStep(0)
    setGenerationTotal(aiConfigMode === 'fast' ? 2 : 5)

    try {
      // 🎯 使用 fetch + ReadableStream 接收流式响应
      const response = await fetch('/api/ai/generate-gamepix-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle: game.title,
          mainKeyword: aiConfig.mainKeyword,
          subKeywords: aiConfig.subKeywords,
          originalDescription: game.description,
          markdownContent: extraDetails.markdownContent,
          locale: batchGenerateLocale,
          mode: aiConfigMode,
          aiConfigId: selectedAiConfigId,
          modelId: selectedModelId
        })
      })

      if (!response.ok) {
        throw new Error('请求失败')
      }

      if (!response.body) {
        throw new Error('响应流不可用')
      }

      // 读取流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let result: any = null

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })

        // 按行分割
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后的不完整行

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue

          try {
            // 解析 SSE 数据
            const jsonStr = line.substring(5).trim() // 移除 "data: "
            const data = JSON.parse(jsonStr)

            // 处理不同类型的事件
            if (data.step && data.message) {
              // 进度更新
              setGenerationStep(data.step)
              setGenerationTotal(data.total)
              setGenerationPercentage(data.percentage)
              setGenerationProgress(data.message)
            } else if (data.success && data.data) {
              // 完成
              setGenerationPercentage(100)
              setGenerationProgress('生成完成！')
              result = data
            } else if (data.error) {
              // 错误
              throw new Error(data.error)
            }
          } catch (e) {
            console.warn('解析 SSE 数据失败:', line, e)
          }
        }
      }

      if (!result || !result.success) {
        throw new Error('生成失败')
      }

      console.log('[GamePix AI 生成] 成功:', result.data)

      // 应用生成结果到表单
      if (batchGenerateLocale === 'en') {
        // ========== 更新英文主表字段 ==========
        form.setValue('description', result.data.description)
        form.setValue('keywords', result.data.keywords)
        form.setValue('metaTitle', result.data.metaTitle)
        form.setValue('metaDescription', result.data.metaDescription)

        // ========== 更新英文 ContentSections ==========
        const enContentSections: any = {}
        if (result.data.contentSections.controls) {
          enContentSections[CONTENT_SECTION_KEYS.CONTROLS] = {
            content: result.data.contentSections.controls,
            order: 1
          }
        }
        if (result.data.contentSections.howToPlay) {
          enContentSections[CONTENT_SECTION_KEYS.HOW_TO_PLAY] = {
            content: result.data.contentSections.howToPlay,
            order: 2
          }
        }
        if (result.data.contentSections.gameDetails) {
          enContentSections[CONTENT_SECTION_KEYS.GAME_DETAILS] = {
            content: result.data.contentSections.gameDetails,
            order: 3
          }
        }
        if (result.data.contentSections.faq) {
          enContentSections[CONTENT_SECTION_KEYS.FAQ] = {
            content: result.data.contentSections.faq,
            order: 4
          }
        }
        if (result.data.contentSections.extras) {
          enContentSections[CONTENT_SECTION_KEYS.EXTRAS] = {
            content: result.data.contentSections.extras,
            order: 5
          }
        }
        form.setValue('contentSections', enContentSections)
      } else {
        // ========== 更新指定语言的翻译 ==========
        const translations = form.getValues('translations')
        console.log('[调试] 当前所有翻译:', translations)
        console.log('[调试] 目标语言:', batchGenerateLocale)

        const translationIndex = translations?.findIndex(t => t.locale === batchGenerateLocale)
        console.log('[调试] 找到的翻译索引:', translationIndex)

        if (translationIndex !== undefined && translationIndex >= 0) {
          const currentTranslation = form.getValues(`translations.${translationIndex}`)
          console.log('[调试] 当前翻译数据:', currentTranslation)

          const updatedTranslation: any = { ...currentTranslation }

          updatedTranslation.description = result.data.description
          updatedTranslation.keywords = result.data.keywords
          updatedTranslation.metaTitle = result.data.metaTitle
          updatedTranslation.metaDescription = result.data.metaDescription

          console.log('[调试] 更新后的翻译数据:', {
            description: updatedTranslation.description?.substring(0, 50),
            keywords: updatedTranslation.keywords,
            metaTitle: updatedTranslation.metaTitle,
            metaDescription: updatedTranslation.metaDescription?.substring(0, 50)
          })

          // 更新 ContentSections
          const contentSections: any = {}
          if (result.data.contentSections.controls) {
            contentSections[CONTENT_SECTION_KEYS.CONTROLS] = {
              content: result.data.contentSections.controls,
              order: 1
            }
          }
          if (result.data.contentSections.howToPlay) {
            contentSections[CONTENT_SECTION_KEYS.HOW_TO_PLAY] = {
              content: result.data.contentSections.howToPlay,
              order: 2
            }
          }
          if (result.data.contentSections.gameDetails) {
            contentSections[CONTENT_SECTION_KEYS.GAME_DETAILS] = {
              content: result.data.contentSections.gameDetails,
              order: 3
            }
          }
          if (result.data.contentSections.faq) {
            contentSections[CONTENT_SECTION_KEYS.FAQ] = {
              content: result.data.contentSections.faq,
              order: 4
            }
          }
          if (result.data.contentSections.extras) {
            contentSections[CONTENT_SECTION_KEYS.EXTRAS] = {
              content: result.data.contentSections.extras,
              order: 5
            }
          }
          updatedTranslation.contentSections = contentSections

          console.log('[调试] 准备更新翻译，索引:', translationIndex)
          updateTranslation(translationIndex, updatedTranslation)

          // 🔥 强制触发表单重新验证，确保 UI 立即更新
          // 使用 setValue 显式更新每个字段，触发 FormField 的重新渲染
          form.setValue(`translations.${translationIndex}.description`, result.data.description, { shouldValidate: true, shouldDirty: true })
          form.setValue(`translations.${translationIndex}.keywords`, result.data.keywords, { shouldValidate: true, shouldDirty: true })
          form.setValue(`translations.${translationIndex}.metaTitle`, result.data.metaTitle, { shouldValidate: true, shouldDirty: true })
          form.setValue(`translations.${translationIndex}.metaDescription`, result.data.metaDescription, { shouldValidate: true, shouldDirty: true })

          console.log('[调试] 翻译已更新（包含强制刷新）')

          // 验证更新是否成功
          const verifyTranslation = form.getValues(`translations.${translationIndex}`)
          console.log('[调试] 验证更新后的数据:', {
            description: verifyTranslation?.description?.substring(0, 50),
            keywords: verifyTranslation?.keywords,
            metaTitle: verifyTranslation?.metaTitle,
            metaDescription: verifyTranslation?.metaDescription?.substring(0, 50)
          })
        } else {
          console.error('[调试] 未找到翻译索引！语言:', batchGenerateLocale)
        }
      }

      setGenerationProgress('✅ 生成完成！')
      console.log('✅ AI 生成的内容已应用到表单')

      // 3秒后清除进度消息
      setTimeout(() => setGenerationProgress(''), 3000)

    } catch (error: any) {
      console.error('[GamePix AI 生成] 失败:', error)
      alert(`AI 生成失败: ${error.message}`)
      setGenerationProgress('')
    } finally {
      setIsGenerating(false)
    }
  }

  // ========== 兼容旧的批量生成回调（游戏编辑场景使用）==========
  const handleBatchGenerated = (results: Record<string, string>) => {
    console.log('AI 批量生成结果:', results)

    // 根据当前语言决定更新哪个部分
    if (batchGenerateLocale === 'en') {
      // ========== 更新英文主表字段 ==========
      if (results.description) form.setValue('description', results.description)
      if (results.keywords) form.setValue('keywords', results.keywords)
      if (results.metaTitle) form.setValue('metaTitle', results.metaTitle)
      if (results.metaDescription) form.setValue('metaDescription', results.metaDescription)

      // ========== 更新英文 ContentSections ==========
      const enContentSections: any = {}
      if (results.controls) {
        enContentSections[CONTENT_SECTION_KEYS.CONTROLS] = {
          content: results.controls,
          order: 1
        }
      }
      if (results.howToPlay) {
        enContentSections[CONTENT_SECTION_KEYS.HOW_TO_PLAY] = {
          content: results.howToPlay,
          order: 2
        }
      }
      if (results.gameDetails) {
        enContentSections[CONTENT_SECTION_KEYS.GAME_DETAILS] = {
          content: results.gameDetails,
          order: 3
        }
      }
      if (results.faq) {
        enContentSections[CONTENT_SECTION_KEYS.FAQ] = {
          content: results.faq,
          order: 4
        }
      }
      if (results.extras) {
        enContentSections[CONTENT_SECTION_KEYS.EXTRAS] = {
          content: results.extras,
          order: 5
        }
      }
      form.setValue('contentSections', enContentSections)
    } else {
      // ========== 更新指定语言的翻译 ==========
      const translationIndex = form.getValues('translations')?.findIndex(t => t.locale === batchGenerateLocale)
      if (translationIndex !== undefined && translationIndex >= 0) {
        const currentTranslation = form.getValues(`translations.${translationIndex}`)

        const updatedTranslation: any = { ...currentTranslation }

        if (results.description) updatedTranslation.description = results.description
        if (results.keywords) updatedTranslation.keywords = results.keywords
        if (results.metaTitle) updatedTranslation.metaTitle = results.metaTitle
        if (results.metaDescription) updatedTranslation.metaDescription = results.metaDescription

        // 更新 ContentSections
        const contentSections: any = {}
        if (results.controls) {
          contentSections[CONTENT_SECTION_KEYS.CONTROLS] = {
            content: results.controls,
            order: 1
          }
        }
        if (results.howToPlay) {
          contentSections[CONTENT_SECTION_KEYS.HOW_TO_PLAY] = {
            content: results.howToPlay,
            order: 2
          }
        }
        if (results.gameDetails) {
          contentSections[CONTENT_SECTION_KEYS.GAME_DETAILS] = {
            content: results.gameDetails,
            order: 3
          }
        }
        if (results.faq) {
          contentSections[CONTENT_SECTION_KEYS.FAQ] = {
            content: results.faq,
            order: 4
          }
        }
        if (results.extras) {
          contentSections[CONTENT_SECTION_KEYS.EXTRAS] = {
            content: results.extras,
            order: 5
          }
        }
        updatedTranslation.contentSections = contentSections

        updateTranslation(translationIndex, updatedTranslation)
      }
    }

    console.log('✅ AI 生成的内容已应用到表单')
  }

  // ========== UI 辅助函数 ==========

  const handleGenerateSlug = () => {
    const title = form.watch('title') || game?.title || ''
    if (title) {
      const slug = generateSlug(title)
      form.setValue('slug', slug)
    }
  }

  const currentWidth = form.watch('width') || 800
  const currentHeight = form.watch('height') || 600
  const aspectRatio = calculateAspectRatio(currentWidth, currentHeight)

  if (!game) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          isFullscreen
            ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none'
            : 'w-[70vw] sm:max-w-[70vw] max-h-[85vh]'
        } overflow-hidden flex flex-col`}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>确认导入游戏</DialogTitle>
              <DialogDescription>
                请补充游戏信息并配置导入选项
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">

        <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 游戏预览 */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="relative w-32 h-32 rounded overflow-hidden flex-shrink-0">
              <Image
                src={removeWidthParameter(game.banner_image || game.image)}
                alt={game.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{game.title}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://www.gamepix.com/play/${game.namespace}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    查看原页面
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {game.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{game.category}</Badge>
                <Badge variant="outline">{game.orientation}</Badge>
                <Badge variant="outline">⭐ {(game.quality_score * 10).toFixed(1)}</Badge>
                <Badge variant="outline">{game.width}x{game.height}</Badge>
              </div>
              {/* 日期信息 */}
              {(game.date_published || game.date_modified) && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {game.date_published && (
                    <div>发布日期: {new Date(game.date_published).toLocaleDateString('zh-CN')}</div>
                  )}
                  {game.date_modified && (
                    <div>最后更新: {new Date(game.date_modified).toLocaleDateString('zh-CN')}</div>
                  )}
                </div>
              )}
              {extraDetails?.tags && extraDetails.tags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">发现的标签：</p>
                  <div className="flex flex-wrap gap-1">
                    {extraDetails.tags.slice(0, 5).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== 1. 核心字段（必填）========== */}
          <div className="space-y-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <Label className="text-base font-semibold text-blue-900">1️⃣ 核心字段（必填）</Label>

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL Slug <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="game-title-slug"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateSlug}
                      className="whitespace-nowrap"
                    >
                      自动生成
                    </Button>
                  </div>
                  <FormDescription className="text-xs">
                    URL 标识符，用于游戏详情页链接（如：/games/play/game-title-slug）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thumbnail */}
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    游戏缩略图 URL <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ImageFieldWithUpload
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="https://example.com/thumbnail.jpg"
                      folder="games/thumbnails"
                      showLabel={false}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    推荐尺寸：800x600 或 16:9 比例。GamePix 图片会自动上传到 R2 CDN
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EmbedUrl */}
            <FormField
              control={form.control}
              name="embedUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    游戏嵌入 URL <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/embed/game"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    游戏 iframe 嵌入地址，用于在网站上显示游戏（必须是 HTTPS）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ========== 2. 游戏尺寸和方向 ========== */}
          <div className="space-y-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <Label className="text-base font-semibold text-purple-900">2️⃣ 游戏尺寸和方向</Label>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>宽度 (px) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="800"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>高度 (px) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="600"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orientation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      屏幕方向 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="landscape">横屏 (Landscape)</SelectItem>
                        <SelectItem value="portrait">竖屏 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 显示计算的 AspectRatio */}
            <div className="p-3 bg-white border rounded-md">
              <p className="text-sm">
                <span className="font-medium">计算比例：</span>
                <span className="ml-2 text-muted-foreground">{aspectRatio}</span>
                <span className="ml-4 text-xs text-muted-foreground">
                  ({currentWidth} × {currentHeight})
                </span>
              </p>
            </div>
          </div>

          {/* ========== 3. 状态和质量评分 ========== */}
          <div className="space-y-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <Label className="text-base font-semibold text-green-900">3️⃣ 状态和质量评分</Label>

            {/* Status - RadioGroup */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    发布状态 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="DRAFT" id="status-draft" />
                        </FormControl>
                        <FormLabel htmlFor="status-draft" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <div>
                              <div className="font-medium">草稿</div>
                              <div className="text-xs text-muted-foreground">未发布</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="PUBLISHED" id="status-published" />
                        </FormControl>
                        <FormLabel htmlFor="status-published" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div>
                              <div className="font-medium">已发布</div>
                              <div className="text-xs text-muted-foreground">网站可见</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="MAINTENANCE" id="status-maintenance" />
                        </FormControl>
                        <FormLabel htmlFor="status-maintenance" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div>
                              <div className="font-medium">维护中</div>
                              <div className="text-xs text-muted-foreground">暂时下线</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="ARCHIVED" id="status-archived" />
                        </FormControl>
                        <FormLabel htmlFor="status-archived" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div>
                              <div className="font-medium">已归档</div>
                              <div className="text-xs text-muted-foreground">已下架</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-xs">
                    选择游戏的发布状态（草稿和归档不会在网站显示）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 精选设置 - RadioGroup */}
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>精选游戏</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'true')}
                      defaultValue={field.value ? 'true' : 'false'}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="false" id="featured-no" />
                        </FormControl>
                        <FormLabel htmlFor="featured-no" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <div>
                              <div className="font-medium">普通游戏</div>
                              <div className="text-xs text-muted-foreground">正常显示</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="true" id="featured-yes" />
                        </FormControl>
                        <FormLabel htmlFor="featured-yes" className="flex-1 font-normal cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div>
                              <div className="font-medium">⭐ 精选游戏</div>
                              <div className="text-xs text-muted-foreground">优先展示</div>
                            </div>
                          </div>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-xs">
                    精选游戏会在首页和分类页面优先显示
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">

              {/* Quality Score */}
              <div className="space-y-2">
                <Label>质量评分</Label>
                <div className="p-3 bg-white border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold">
                      {game.quality_score ? (game.quality_score * 10).toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 10.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(game.quality_score || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== 4. 来源信息（只读）========== */}
          <div className="space-y-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <Label className="text-base font-semibold text-yellow-900">4️⃣ 来源信息（自动填充）</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">来源平台</Label>
                <div className="p-2 bg-white border rounded-md">
                  <Badge variant="outline">GamePix</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">平台游戏 ID</Label>
                <div className="p-2 bg-white border rounded-md text-sm font-mono">
                  {game.id}
                </div>
              </div>
            </div>
          </div>

          {/* ========== 5. 开发者信息（可选）========== */}
          <div className="space-y-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <Label className="text-base font-semibold text-orange-900">5️⃣ 开发者信息（可选）</Label>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="developer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开发者名称</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="开发商或工作室名称"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      游戏开发商或工作室的名称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="developerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开发者网站</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://developer-website.com"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      开发者官方网站 URL（可选）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ========== 6. 时间信息（只读）========== */}
          <div className="space-y-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <Label className="text-base font-semibold text-gray-900">6️⃣ 时间信息（自动填充）</Label>

            <div className="grid grid-cols-3 gap-4">
              {game.date_published && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">原始发布日期</Label>
                  <div className="p-2 bg-white border rounded-md text-sm">
                    {new Date(game.date_published).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </div>
                </div>
              )}

              {game.date_modified && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">平台最后更新</Label>
                  <div className="p-2 bg-white border rounded-md text-sm">
                    {new Date(game.date_modified).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">导入时间</Label>
                <div className="p-2 bg-white border rounded-md text-sm">
                  {new Date().toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 从浏览器插件提取更多信息 */}
          <div className="space-y-4 p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
            <div className="space-y-2">
              <Label className="text-base font-semibold">🔍 获取更多游戏信息</Label>
              <p className="text-sm text-muted-foreground">
                使用浏览器插件从 GamePix 页面提取完整的游戏信息（标签、说明、截图等）
              </p>
            </div>

            {/* 有缓存数据时显示提示和重新提取按钮 */}
            {extraDetails && extraDetails.markdownContent && extraDetails.tags && extraDetails.tags.length > 0 ? (
              <div className="space-y-3">
                <Alert className="bg-green-50 border-green-200">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    ✅ 已从缓存加载游戏信息（{extraDetails.tags.length} 个标签，{extraDetails.videos?.length || 0} 个视频，{extraDetails.screenshots?.length || 0} 张截图，{extraDetails.markdownContent.length} 字符内容）
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setExtraDetails(null)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  重新提取最新数据
                </Button>
              </div>
            ) : (
              /* 无缓存数据时显示提取按钮 */
              <>
                <GamePixExtractButton
                  namespace={game.namespace || ''}
                  onDataExtracted={handleDataExtracted}
                  disabled={!game.namespace}
                />

                {/* 部分数据提示 */}
                {extraDetails && (!extraDetails.markdownContent || !extraDetails.tags || extraDetails.tags.length === 0) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      ⚠️ 数据不完整：
                      {!extraDetails.markdownContent && ' 缺少内容描述'}
                      {(!extraDetails.tags || extraDetails.tags.length === 0) && ' 缺少标签'}
                      。请重新提取。
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* 显示提取到的数据 */}
            {extraDetails && (
              <Collapsible className="space-y-2">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                  <ChevronDown className="h-4 w-4" />
                  查看提取到的完整数据
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* 标签 */}
                  {extraDetails.tags && extraDetails.tags.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">提取到的标签</Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                        {extraDetails.tags.map((tag: any, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 开发者信息 */}
                  {extraDetails.developer && (
                    <div className="space-y-1">
                      <Label className="text-xs">开发者信息</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p>
                          <strong>{extraDetails.developer}</strong>
                          {extraDetails.developerUrl && (
                            <a
                              href={extraDetails.developerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              访问网站
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 评分信息 */}
                  {extraDetails.rating && (
                    <div className="space-y-1">
                      <Label className="text-xs">评分信息</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p>
                          ⭐ {extraDetails.rating} / 5.0
                          {extraDetails.ratingCount && ` (${extraDetails.ratingCount} 次评分)`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Markdown 内容预览 */}
                  {extraDetails.markdownContent && (
                    <div className="space-y-1">
                      <Label className="text-xs">Markdown 内容预览（供 AI 使用）</Label>
                      <div className="p-3 bg-muted rounded-md text-xs max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                          {extraDetails.markdownContent.substring(0, 1000)}
                          {extraDetails.markdownContent.length > 1000 && '\n\n...(已截断，完整内容已保存)'}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 多媒体资源统计 */}
                  {(extraDetails.screenshots || extraDetails.videos) && (
                    <div className="space-y-1">
                      <Label className="text-xs">多媒体资源</Label>
                      <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                        {extraDetails.screenshots && extraDetails.screenshots.length > 0 && (
                          <p>📸 截图: {extraDetails.screenshots.length} 张</p>
                        )}
                        {extraDetails.videos && extraDetails.videos.length > 0 && (
                          <p>🎥 视频: {extraDetails.videos.length} 个</p>
                        )}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* 分类信息对比 */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            {/* 第一行：原始分类和自动匹配按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">原始分类（GamePix）</Label>
                <div className="flex items-center gap-2 p-3 bg-background rounded border">
                  <Badge variant="outline">{game.category}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>智能匹配</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAutoMatchCategory}
                  disabled={isMatchingCategory || isImporting}
                >
                  {isMatchingCategory ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      匹配中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      自动匹配分类
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 匹配结果提示 */}
            {matchedCategoryInfo && (
              <Alert className="border-green-600 bg-green-600">
                <Sparkles className="h-4 w-4 text-white" />
                <AlertDescription className="text-white font-medium">
                  ✓ 已匹配：<strong>{matchedCategoryInfo.mainCategoryName}</strong> → <strong>{matchedCategoryInfo.categoryName}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* 第二行：目标分类选择 */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    目标分类（子分类） <span className="text-destructive">*</span>
                  </FormLabel>
                  {isLoadingCategories ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded border">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">加载分类中...</span>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded border">
                      <span className="text-sm text-muted-foreground">暂无可用分类</span>
                    </div>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择要导入到的子分类">
                            {field.value && (() => {
                              const selected = categories.find(c => c.id === field.value)
                              if (!selected) return null
                              // 只显示 "主分类>子分类" 格式
                              return `${selected.parentName} > ${selected.name}`
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.parentId !== null)  // 只显示子分类
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {`${cat.parentName} > ${cat.name}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormDescription className="text-xs">
                    选择游戏所属的子分类，游戏将显示在该分类下
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 媒体资源管理 */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>媒体资源</Label>
              <p className="text-xs text-muted-foreground">可选</p>
            </div>

            {/* Banner 图片 */}
            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner 图片 URL</FormLabel>
                  <FormControl>
                    <ImageFieldWithUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="https://example.com/banner.jpg"
                      folder="games/banners"
                      showLabel={false}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    游戏横幅图片，推荐尺寸：1920x600 或 16:5 比例（可选）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 游戏链接 */}
            <FormField
              control={form.control}
              name="gameUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>游戏外部链接</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/play"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    游戏的外部链接（可选）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 截图列表 */}
            <FormField
              control={form.control}
              name="screenshots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>游戏截图</FormLabel>
                  <FormControl>
                    <ScreenshotsFieldWithUpload
                      screenshots={field.value || []}
                      onChange={field.onChange}
                      folder="games/screenshots"
                      showLabel={false}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    推荐上传 3-6 张游戏截图，展示游戏特色和玩法
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 视频列表 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>游戏视频</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => appendVideo('')}
                >
                  + 添加视频
                </Button>
              </div>
              {videoFields.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 border rounded">
                  暂无视频，点击"添加视频"按钮添加
                </p>
              ) : (
                <div className="space-y-2">
                  {videoFields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`videos.${index}` as const}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                type="url"
                                placeholder={`视频 ${index + 1} URL`}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeVideo(index)}
                            >
                              删除
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                添加游戏宣传视频或游玩录像的 URL（可选）
              </p>
            </div>
          </div>

          {/* 游戏标签 - 统一输入组件 */}
          <FormField
            control={form.control}
            name="existingTagIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">游戏标签</FormLabel>
                <FormControl>
                  <TagInputField
                    existingTagIds={form.watch('existingTagIds') || []}
                    newTagNames={form.watch('newTagNames') || []}
                    onExistingTagsChange={(ids) => {
                      form.setValue('existingTagIds', ids)
                    }}
                    onNewTagsChange={(names) => {
                      form.setValue('newTagNames', names)
                    }}
                    availableTags={tags}
                    maxTags={20}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  从列表选择已存在的标签，或输入新标签名称。最多 20 个标签。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 游戏内容管理 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">游戏内容管理</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setBatchGenerateLocale(activeLocale)
                  setShowAiConfigDialog(true)
                }}
                disabled={
                  isGenerating ||
                  !extraDetails?.markdownContent ||
                  !extraDetails?.tags ||
                  extraDetails.tags.length === 0
                }
                title={
                  !extraDetails?.markdownContent || !extraDetails?.tags || extraDetails.tags.length === 0
                    ? '需要先提取游戏信息（标签和内容）'
                    : ''
                }
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI 生成游戏内容
              </Button>
            </div>

            {/* 生成进度提示 */}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {/* 步骤和百分比 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">
                    {generationStep > 0 ? `步骤 ${generationStep}/${generationTotal}` : '准备中...'}
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {generationPercentage}%
                  </span>
                </div>

                {/* 进度条 */}
                <Progress value={generationPercentage} className="h-2" />

                {/* 详细消息 */}
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{generationProgress}</span>
                </div>
              </div>
            )}

            {/* 提示信息 */}
            {!extraDetails?.markdownContent && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
                <Info className="w-4 h-4 inline mr-2" />
                请先使用"从网页获取更多信息"提取游戏的完整内容，然后才能使用 AI 生成功能
              </div>
            )}

            <Tabs value={activeLocale} onValueChange={setActiveLocale}>
              <TabsList>
                <TabsTrigger value="en">英文 (EN)</TabsTrigger>
                <TabsTrigger value="zh">中文 (ZH)</TabsTrigger>
              </TabsList>

              {/* 英文内容标签页 */}
              <TabsContent value="en" className="space-y-6">
                {/* 基础字段 */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>游戏标题 <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="游戏标题" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          英文游戏标题，将显示在游戏详情页
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>简短描述</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="简短的游戏描述"
                            rows={2}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          英文游戏简介，建议 100-200 字符
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO 标题</FormLabel>
                        <FormControl>
                          <SeoTextInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="用于搜索引擎显示的标题"
                            limit={60}
                            locale="en"
                            type="metaTitle"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          推荐长度：50-60 字符，用于搜索引擎显示
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO 描述</FormLabel>
                        <FormControl>
                          <SeoTextInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="用于搜索引擎显示的描述"
                            limit={160}
                            locale="en"
                            type="metaDescription"
                            className="whitespace-normal"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          推荐长度：150-160 字符，简洁描述游戏内容
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO 关键词</FormLabel>
                        <FormControl>
                          <KeywordsTagInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="输入关键词后按 Enter"
                            limit={10}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          关键词将用于 AI 生成内容时的参考依据
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ContentSections - 英文 */}
                <ContentSectionsEditor pathPrefix="contentSections" form={form} />
              </TabsContent>

              {/* 中文内容标签页 */}
              <TabsContent value="zh" className="space-y-6">
                {(() => {
                  const zhIndex = translationFields.findIndex((f: any) => f.locale === 'zh')
                  if (zhIndex === -1) {
                    return <p className="text-sm text-muted-foreground">未找到中文翻译</p>
                  }

                  return (
                    <>
                      {/* 基础字段 */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`translations.${zhIndex}.title` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>游戏标题</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="游戏标题" />
                              </FormControl>
                              <FormDescription className="text-xs">
                                中文游戏标题，将显示在游戏详情页
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${zhIndex}.description` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>简短描述</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="简短的游戏描述"
                                  rows={2}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                中文游戏简介，建议 100-200 字符
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${zhIndex}.metaTitle` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO 标题</FormLabel>
                              <FormControl>
                                <SeoTextInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="用于搜索引擎显示的标题"
                                  limit={60}
                                  locale="zh"
                                  type="metaTitle"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                推荐长度：50-60 字符，用于搜索引擎显示
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${zhIndex}.metaDescription` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO 描述</FormLabel>
                              <FormControl>
                                <SeoTextInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="用于搜索引擎显示的描述"
                                  limit={160}
                                  locale="zh"
                                  type="metaDescription"
                                  className="whitespace-normal"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                推荐长度：150-160 字符，简洁描述游戏内容
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${zhIndex}.keywords` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO 关键词</FormLabel>
                              <FormControl>
                                <KeywordsTagInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="输入关键词后按 Enter"
                                  limit={10}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                关键词将用于 AI 生成内容时的参考依据
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* ContentSections - 中文 */}
                      <ContentSectionsEditor
                        pathPrefix={`translations.${zhIndex}.contentSections`}
                        form={form}
                      />
                    </>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </div>

          {/* 导入摘要 */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              导入信息摘要
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 游戏来源：GamePix ({game.namespace || game.id})</li>
              <li>• 游戏分类：{game.category}</li>
              <li>• 质量评分：{(game.quality_score * 10).toFixed(1)} / 10</li>
              <li>• 游戏尺寸：{game.width} x {game.height} ({game.orientation})</li>
              {game.url && (
                <li>• 游戏 URL：<a href={game.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{game.url}</a></li>
              )}
              {game.date_published && (
                <li>• 发布日期：{new Date(game.date_published).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
              )}
              {game.date_modified && (
                <li>• 最后更新：{new Date(game.date_modified).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
              )}
              <li>• 支持语言：英文、中文</li>
              <li>
                • 发布状态：
                {form.watch('status') === 'PUBLISHED' ? '已发布' :
                 form.watch('status') === 'DRAFT' ? '草稿' :
                 form.watch('status') === 'MAINTENANCE' ? '维护中' : '已归档'}
                {form.watch('isFeatured') && '，标记为精选'}
              </li>
              {(form.watch('existingTagIds')?.length > 0 || form.watch('newTagNames')?.length > 0) && (
                <li>• 已选标签：{(form.watch('existingTagIds')?.length || 0) + (form.watch('newTagNames')?.length || 0)} 个</li>
              )}
            </ul>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row">
            {/* 显示详细的验证错误提示（提交后） */}
            {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
              <div className="sm:order-first sm:flex-1 space-y-2">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">以下字段需要修正：</p>
                    <ul className="space-y-1 text-xs">
                      {form.formState.errors.slug && (
                        <li>• URL Slug: {form.formState.errors.slug.message}</li>
                      )}
                      {form.formState.errors.thumbnail && (
                        <li>• 游戏缩略图: {form.formState.errors.thumbnail.message}</li>
                      )}
                      {form.formState.errors.embedUrl && (
                        <li>• 游戏嵌入链接: {form.formState.errors.embedUrl.message}</li>
                      )}
                      {form.formState.errors.categoryId && (
                        <li>• 游戏分类: {form.formState.errors.categoryId.message}</li>
                      )}
                      {form.formState.errors.title && (
                        <li>• 英文标题: {form.formState.errors.title.message}</li>
                      )}
                      {form.formState.errors.width && (
                        <li>• 游戏宽度: {form.formState.errors.width.message}</li>
                      )}
                      {form.formState.errors.height && (
                        <li>• 游戏高度: {form.formState.errors.height.message}</li>
                      )}
                      {form.formState.errors.banner && (
                        <li>• 横幅图片: {form.formState.errors.banner.message}</li>
                      )}
                      {form.formState.errors.gameUrl && (
                        <li>• 游戏链接: {form.formState.errors.gameUrl.message}</li>
                      )}
                      {form.formState.errors.developerUrl && (
                        <li>• 开发者链接: {form.formState.errors.developerUrl.message}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting || showImportProgress}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isImporting || showImportProgress}
              className="bg-green-600 hover:bg-green-700"
            >
              {(isImporting || showImportProgress) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                '确认导入'
              )}
            </Button>
          </DialogFooter>
        </form>
        </Form>
        </div>

      </DialogContent>

      {/* AI 生成统一对话框 */}
      <AiGenerateDialog
        open={showAiConfigDialog}
        onOpenChange={setShowAiConfigDialog}
        gameTitle={form.watch('title') || game.title}
        locale={batchGenerateLocale}
        initialKeywords={(() => {
          if (batchGenerateLocale === 'en') {
            return form.watch('keywords') || ''
          }
          const translationIndex = form.watch('translations')?.findIndex(t => t.locale === batchGenerateLocale)
          return translationIndex !== undefined && translationIndex >= 0
            ? form.watch(`translations.${translationIndex}.keywords`) || ''
            : ''
        })()}
        originalDescription={game.description}
        markdownContent={extraDetails?.markdownContent}
        category={selectedCategory?.name}
        categoryId={form.watch('categoryId')}
        onGenerated={handleBatchGenerated}
      />

      {/* AI 配置加载失败提示对话框 */}
      <AlertDialog open={!!configError} onOpenChange={(open) => !open && setConfigError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              AI 配置加载失败
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <p className="mb-2">{configError}</p>
              <p className="text-xs text-muted-foreground">
                请检查：
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside mt-1 space-y-1">
                <li>是否已配置 AI 服务</li>
                <li>AI 配置是否已启用</li>
                <li>网络连接是否正常</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={loadAiConfigsAndModels}>
              重新加载
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入进度弹窗 */}
      <ImportProgressDialog
        open={showImportProgress}
        onOpenChange={setShowImportProgress}
        title="导入游戏"
        steps={importSteps}
        currentStepIndex={currentStepIndex}
        overallProgress={overallProgress}
        onRetry={async () => {
          // 重新执行导入
          const formData = form.getValues()
          await executeImport(formData)
        }}
        allowClose={false}
      />
    </Dialog>
  )
}
