"use client"

import { useState, useCallback, useEffect } from "react"
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { AiGenerateDialog } from "../AiGenerateDialog"
import { KeywordsTagInput } from "@/components/admin/KeywordsTagInput"
import { Sparkles, Loader2 } from "lucide-react"
import type { CategoryOption } from "./CategoryCascader"
import {
  CONTENT_SECTION_KEYS,
  CONTENT_SECTION_LABELS,
  CONTENT_SECTION_PLACEHOLDERS,
  type ContentSection,
  type ContentSectionKey,
} from "@/lib/types/game-info"
import { getGameTranslation } from "@/app/(admin)/admin/games/actions"
import { SeoTextInput } from "@/components/admin/SeoTextInput"

interface Language {
  code: string
  label: string
}

interface GameFormValues {
  translations: Array<{
    locale: string
    title: string
    description?: string
    longDescription?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    contentSections?: Record<string, ContentSection>
  }>
  [key: string]: any
}

interface GameTranslationContentProps {
  register: UseFormRegister<GameFormValues>
  watch: UseFormWatch<GameFormValues>
  setValue: UseFormSetValue<GameFormValues>
  errors: FieldErrors<GameFormValues>
  languages: Language[]
  translationFields: any[]
  gameId?: string  // 游戏 ID（用于 AI 对话历史和懒加载翻译）
  categories?: CategoryOption[]  // 分类列表（用于 AI 生成）
}

export function GameTranslationContent({
  register,
  watch,
  setValue,
  errors,
  languages,
  translationFields,
  gameId,
  categories = []
}: GameTranslationContentProps) {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [currentLocaleIndex, setCurrentLocaleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(languages[0]?.code || 'en')

  // ✅ 懒加载：记录已加载的语言
  const [loadedLocales, setLoadedLocales] = useState<Set<string>>(new Set(['en']))  // 英文默认已加载
  const [loadingLocale, setLoadingLocale] = useState<string | null>(null)

  const handleBatchGenerated = (results: Record<string, string>) => {
    // 自动填充生成的内容到当前语言的表单字段
    Object.entries(results).forEach(([field, content]) => {
      setValue(`translations.${currentLocaleIndex}.${field}` as any, content)
    })
  }

  // 获取当前选择的分类信息
  const categoryId = watch('categoryId')
  const selectedCategory = categories.find(c => c.id === categoryId)

  // ✅ 优化：使用 useCallback 稳定 onChange 回调函数
  // 为每个 ContentSection 创建稳定的 onChange 处理器
  const createContentSectionHandler = useCallback((index: number, sectionKey: string) => {
    return (value: string) => {
      setValue(`translations.${index}.contentSections.${sectionKey}.content` as any, value)
    }
  }, [setValue])

  // ✅ 懒加载：当切换到新语言标签时，加载该语言的翻译数据
  const handleTabChange = useCallback(async (locale: string) => {
    setActiveTab(locale)

    // 英文数据在主表中，无需加载
    if (locale === 'en') return

    // 如果该语言已加载过，无需重复加载
    if (loadedLocales.has(locale)) return

    // 编辑模式且有游戏ID时才加载
    if (!gameId) return

    // 开始加载
    setLoadingLocale(locale)

    try {
      const result = await getGameTranslation(gameId, locale)

      if (result.success && result.data) {
        // 找到该语言在 translations 数组中的索引
        const localeIndex = languages.findIndex(l => l.code === locale)

        if (localeIndex !== -1) {
          const translation = result.data
          const translationInfo = (translation.translationInfo as any) || {}

          // 填充基础字段
          setValue(`translations.${localeIndex}.title`, translation.title || '')
          setValue(`translations.${localeIndex}.description`, translation.description || '')
          setValue(`translations.${localeIndex}.keywords`, translation.keywords || '')
          setValue(`translations.${localeIndex}.metaTitle`, translation.metaTitle || '')
          setValue(`translations.${localeIndex}.metaDescription`, translation.metaDescription || '')

          // 填充 ContentSections
          Object.values(CONTENT_SECTION_KEYS).forEach((sectionKey, idx) => {
            const section = translationInfo[sectionKey] || { content: "", order: idx + 1 }
            setValue(`translations.${localeIndex}.contentSections.${sectionKey}`, section)
          })
        }
      }

      // 标记该语言已加载
      setLoadedLocales(prev => new Set([...prev, locale]))
    } catch (error) {
      console.error(`加载 ${locale} 翻译数据失败:`, error)
    } finally {
      setLoadingLocale(null)
    }
  }, [gameId, languages, loadedLocales, setValue])

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="bg-white">
        <CardTitle className="text-gray-900">多语言内容</CardTitle>
        <CardDescription className="text-gray-600">
          为不同语言设置游戏内容（当前已启用 {languages.length} 种语言）
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(languages.length, 4)}`}>
            {languages.map((locale) => (
              <TabsTrigger key={locale.code} value={locale.code}>
                {locale.label}
                {loadingLocale === locale.code && (
                  <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {translationFields.map((field, index) => {
            const currentLanguage = languages[index]
            if (!currentLanguage) return null

            const isLoading = loadingLocale === currentLanguage.code

            return (
              <TabsContent key={field.id} value={currentLanguage.code} className="space-y-4">
                <input type="hidden" {...register(`translations.${index}.locale`)} />

                {/* 加载状态提示 */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在加载 {currentLanguage.label} 翻译数据...
                  </div>
                )}

                {/* 表单内容 */}
                <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>

                {/* AI 生成游戏信息按钮 */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentLocaleIndex(index)
                      setBatchDialogOpen(true)
                    }}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI 生成游戏信息
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.title`}>
                    游戏标题 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`translations.${index}.title`}
                    {...register(`translations.${index}.title`)}
                    placeholder={`游戏标题（${currentLanguage.label}）`}
                    className={errors.translations?.[index]?.title ? "border-red-500" : ""}
                  />
                  {errors.translations?.[index]?.title && (
                    <p className="text-sm text-red-500">
                      {errors.translations[index]?.title?.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.description`}>简短描述</Label>
                  <Textarea
                    id={`translations.${index}.description`}
                    {...register(`translations.${index}.description`)}
                    placeholder={`简短描述（${currentLanguage.label}）`}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.longDescription`}>详细描述</Label>
                  <Textarea
                    id={`translations.${index}.longDescription`}
                    {...register(`translations.${index}.longDescription`)}
                    placeholder={`详细描述（${currentLanguage.label}）`}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.metaTitle`}>SEO 标题</Label>
                  <SeoTextInput
                    value={watch(`translations.${index}.metaTitle`) || ''}
                    onChange={(value) => setValue(`translations.${index}.metaTitle` as any, value)}
                    placeholder="用于搜索引擎显示的标题"
                    limit={60}
                    locale={currentLanguage.code}
                    type="metaTitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.metaDescription`}>SEO 描述</Label>
                  <SeoTextInput
                    value={watch(`translations.${index}.metaDescription`) || ''}
                    onChange={(value) => setValue(`translations.${index}.metaDescription` as any, value)}
                    placeholder="用于搜索引擎显示的描述"
                    limit={160}
                    locale={currentLanguage.code}
                    type="metaDescription"
                    className="whitespace-normal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`translations.${index}.keywords`}>关键词</Label>
                  <KeywordsTagInput
                    value={watch(`translations.${index}.keywords`) || ''}
                    onChange={(value) => setValue(`translations.${index}.keywords` as any, value)}
                    placeholder="输入关键词后按 Enter"
                    limit={10}
                  />
                  <p className="text-xs text-gray-500">
                    关键词将用于 AI 生成内容时的参考依据
                  </p>
                </div>

                {/* ContentSections - 5个预定义内容区块 */}
                {Object.entries(CONTENT_SECTION_KEYS).map(([key, sectionKey]) => (
                  <div key={sectionKey} className="space-y-2">
                    <Label>
                      {CONTENT_SECTION_LABELS[sectionKey as ContentSectionKey]}
                    </Label>
                    <RichTextEditor
                      content={watch(`translations.${index}.contentSections.${sectionKey}.content`) || ""}
                      onChange={createContentSectionHandler(index, sectionKey)}
                      placeholder={CONTENT_SECTION_PLACEHOLDERS[sectionKey as ContentSectionKey]}
                      gameId={gameId}
                      keywords={watch(`translations.${index}.keywords`) || ""}
                      locale={currentLanguage.code}
                    />
                  </div>
                ))}

                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>

      {/* AI 生成游戏信息对话框 */}
      <AiGenerateDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        gameTitle={watch(`translations.${currentLocaleIndex}.title`) || '未命名游戏'}
        locale={languages[currentLocaleIndex]?.code || 'en'}
        initialKeywords={watch(`translations.${currentLocaleIndex}.keywords`) || ''}
        originalDescription={watch(`translations.${currentLocaleIndex}.description`) || ''}
        category={selectedCategory?.name}
        categoryId={categoryId}
        onGenerated={handleBatchGenerated}
      />
    </Card>
  )
}
