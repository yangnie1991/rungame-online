"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createGame, updateGame, getCategories, getTags, type GameFormData } from "@/app/(admin)/admin/games/actions"
import type { Game, GameTranslation } from "@prisma/client"
import { useEnabledLanguages } from "@/hooks/useEnabledLanguages"
import { Loader2 } from "lucide-react"
import { GameBasicInfo } from "./GameBasicInfo"
import { GameTranslationContent } from "./GameTranslationContent"
import { GameMediaSection } from "./GameMediaSection"
import type { CategoryOption } from "./CategoryCascader"
import {
  CONTENT_SECTION_KEYS,
  DEFAULT_CONTENT_SECTIONS,
  type ContentSection,
} from "@/lib/types/game-info"

// ContentSection 验证
const contentSectionSchema = z.object({
  content: z.union([
    z.string(),
    z.object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
  ]),
  order: z.number().int().min(1),
})

// Game content schema (用于多语言内容)
const gameContentSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),

  // ContentSections
  contentSections: z.object({
    [CONTENT_SECTION_KEYS.CONTROLS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.GAME_DETAILS]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.FAQ]: contentSectionSchema.optional(),
    [CONTENT_SECTION_KEYS.EXTRAS]: contentSectionSchema.optional(),
  }).optional(),
})

// Main game schema
const gameSchema = z.object({
  slug: z.string().min(1, "标识符不能为空").regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  categoryId: z.string().min(1, "必须选择分类"),
  width: z.coerce.number().int().min(100, "宽度至少100px").default(800),
  height: z.coerce.number().int().min(100, "高度至少100px").default(600),
  thumbnail: z.string().min(1, "缩略图不能为空").url("必须是有效的URL"),
  embedUrl: z.string().min(1, "嵌入URL不能为空").url("必须是有效的URL"),
  banner: z.string().url("必须是有效的URL").optional().or(z.literal("")),
  gameUrl: z.string().url("必须是有效的URL").optional().or(z.literal("")),
  tagIds: z.array(z.string()).default([]),
  screenshots: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).default([]),

  // 主表字段（英文作为回退）
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

  // 翻译数据
  translations: z.array(
    z.object({
      locale: z.string(),
      ...gameContentSchema.shape,
    })
  ).default([])
})

type GameFormValues = z.infer<typeof gameSchema>

interface GameFormProps {
  game?: Game & {
    translations: GameTranslation[]
    tags: { tagId: string }[]
    gameCategories: Array<{
      categoryId: string
      mainCategoryId: string
      isPrimary: boolean
    }>
  }
  mode: "create" | "edit"
}

export function GameForm({ game, mode }: GameFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])
  const router = useRouter()
  const { languages, isLoading: isLoadingLanguages } = useEnabledLanguages()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      slug: "",
      categoryId: "",
      width: 800,
      height: 600,
      thumbnail: "",
      embedUrl: "",
      banner: "",
      gameUrl: "",
      tagIds: [],
      screenshots: [],
      videos: [],
      title: "",
      description: "",
      keywords: "",
      metaTitle: "",
      metaDescription: "",
      contentSections: {},
      translations: []
    }
  })

  const { fields: translationFields } = useFieldArray({
    control,
    name: "translations"
  })

  const screenshotFields = useFieldArray({
    control,
    name: "screenshots"
  })

  const videoFields = useFieldArray({
    control,
    name: "videos"
  })

  // 加载分类和标签
  useEffect(() => {
    async function loadData() {
      const [categoriesRes, tagsRes] = await Promise.all([
        getCategories(),
        getTags()
      ])

      if (categoriesRes.success) {
        setCategories(categoriesRes.data)
      }
      if (tagsRes.success) {
        setTags(tagsRes.data)
      }
    }
    loadData()
  }, [])

  // 当语言列表加载完成后，初始化表单数据
  useEffect(() => {
    if (!isLoadingLanguages && languages.length > 0) {
      if (game) {
        // 编辑模式：从游戏数据中提取
        const dimensions = (game.dimensions as any) || { width: 800, height: 600 }
        const gameInfo = (game.gameInfo as any) || {}

        // 获取子分类 ID
        const primaryCategory = game.gameCategories?.find(gc => gc.isPrimary)

        const initialData: GameFormValues = {
          slug: game.slug,
          categoryId: primaryCategory?.categoryId || "",
          width: dimensions.width || 800,
          height: dimensions.height || 600,
          thumbnail: game.thumbnail,
          embedUrl: game.embedUrl,
          banner: game.banner || "",
          gameUrl: game.gameUrl || "",
          tagIds: game.tags?.map(t => t.tagId) || [],
          screenshots: game.screenshots || [],
          videos: game.videos || [],

          // 英文主表字段
          title: game.title || "",
          description: game.description || "",
          keywords: game.keywords || "",
          metaTitle: game.metaTitle || "",
          metaDescription: game.metaDescription || "",

          // 英文 ContentSections
          contentSections: {
            [CONTENT_SECTION_KEYS.CONTROLS]: gameInfo[CONTENT_SECTION_KEYS.CONTROLS] || { content: "", order: 1 },
            [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: gameInfo[CONTENT_SECTION_KEYS.HOW_TO_PLAY] || { content: "", order: 2 },
            [CONTENT_SECTION_KEYS.GAME_DETAILS]: gameInfo[CONTENT_SECTION_KEYS.GAME_DETAILS] || { content: "", order: 3 },
            [CONTENT_SECTION_KEYS.FAQ]: gameInfo[CONTENT_SECTION_KEYS.FAQ] || { content: "", order: 4 },
            [CONTENT_SECTION_KEYS.EXTRAS]: gameInfo[CONTENT_SECTION_KEYS.EXTRAS] || { content: "", order: 5 },
          },

          // 翻译数据
          translations: languages.map(locale => {
            if (locale.code === 'en') {
              // 英文直接使用主表字段
              return {
                locale: 'en',
                title: game.title || "",
                description: game.description || "",
                metaTitle: game.metaTitle || "",
                metaDescription: game.metaDescription || "",
                keywords: game.keywords || "",
                contentSections: {
                  [CONTENT_SECTION_KEYS.CONTROLS]: gameInfo[CONTENT_SECTION_KEYS.CONTROLS] || { content: "", order: 1 },
                  [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: gameInfo[CONTENT_SECTION_KEYS.HOW_TO_PLAY] || { content: "", order: 2 },
                  [CONTENT_SECTION_KEYS.GAME_DETAILS]: gameInfo[CONTENT_SECTION_KEYS.GAME_DETAILS] || { content: "", order: 3 },
                  [CONTENT_SECTION_KEYS.FAQ]: gameInfo[CONTENT_SECTION_KEYS.FAQ] || { content: "", order: 4 },
                  [CONTENT_SECTION_KEYS.EXTRAS]: gameInfo[CONTENT_SECTION_KEYS.EXTRAS] || { content: "", order: 5 },
                }
              }
            }

            // ✅ 懒加载优化：其他语言初始化为空
            // GameTranslationContent 组件会在用户切换到对应语言标签时懒加载数据
            return {
              locale: locale.code,
              title: "",
              description: "",
              metaTitle: "",
              metaDescription: "",
              keywords: "",
              contentSections: {
                [CONTENT_SECTION_KEYS.CONTROLS]: { content: "", order: 1 },
                [CONTENT_SECTION_KEYS.HOW_TO_PLAY]: { content: "", order: 2 },
                [CONTENT_SECTION_KEYS.GAME_DETAILS]: { content: "", order: 3 },
                [CONTENT_SECTION_KEYS.FAQ]: { content: "", order: 4 },
                [CONTENT_SECTION_KEYS.EXTRAS]: { content: "", order: 5 },
              }
            }
          })
        }

        reset(initialData)
      } else {
        // 创建模式
        reset({
          slug: "",
          categoryId: "",
          width: 800,
          height: 600,
          thumbnail: "",
          embedUrl: "",
          banner: "",
          gameUrl: "",
          tagIds: [],
          screenshots: [],
          videos: [],
          title: "",
          description: "",
          keywords: "",
          metaTitle: "",
          metaDescription: "",
          contentSections: Object.fromEntries(
            Object.entries(DEFAULT_CONTENT_SECTIONS).map(([key, config]) => [
              key,
              { content: "", order: config.order }
            ])
          ) as any,
          translations: languages.map(locale => ({
            locale: locale.code,
            title: "",
            description: "",
            metaTitle: "",
            metaDescription: "",
            keywords: "",
            contentSections: Object.fromEntries(
              Object.entries(DEFAULT_CONTENT_SECTIONS).map(([key, config]) => [
                key,
                { content: "", order: config.order }
              ])
            ) as any,
          }))
        })
      }
    }
  }, [isLoadingLanguages, languages, game, reset])

  async function onSubmit(data: GameFormValues) {
    setIsSubmitting(true)
    try {
      // 从英文翻译中提取主表字段
      const enTranslation = data.translations.find(t => t.locale === 'en')
      if (enTranslation) {
        data.title = enTranslation.title
        data.description = enTranslation.description || ""
        data.metaTitle = enTranslation.metaTitle || ""
        data.metaDescription = enTranslation.metaDescription || ""
        data.keywords = enTranslation.keywords || ""
        data.contentSections = enTranslation.contentSections
      }

      // 移除英文翻译，只保留其他语言的翻译
      const nonEnglishTranslations = data.translations.filter(t => t.locale !== 'en')

      // 构建 API 数据格式
      const apiData: GameFormData = {
        slug: data.slug,
        categoryId: data.categoryId,
        thumbnail: data.thumbnail,
        embedUrl: data.embedUrl,
        gameUrl: data.gameUrl || "",
        banner: data.banner,
        dimensions: {
          width: data.width,
          height: data.height,
          aspectRatio: `${data.width}:${data.height}`,
          orientation: data.width > data.height ? 'landscape' : data.width < data.height ? 'portrait' : 'square'
        },
        title: data.title,
        description: data.description,
        keywords: data.keywords,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        screenshots: data.screenshots,
        videos: data.videos,
        tagIds: data.tagIds,
        isFeatured: false,
        status: 'DRAFT',
        gameInfo: data.contentSections,
        translations: nonEnglishTranslations.map(t => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
          keywords: t.keywords,
          translationInfo: t.contentSections,
        }))
      }

      const result = mode === "create"
        ? await createGame(apiData)
        : await updateGame(game!.id, apiData)

      if (result.success) {
        toast.success(
          mode === "create" ? "创建成功" : "更新成功",
          { description: `游戏已${mode === "create" ? "创建" : "更新"}` }
        )
        router.push("/admin/games")
        router.refresh()
      } else {
        toast.error(
          mode === "create" ? "创建失败" : "更新失败",
          { description: result.error }
        )
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.error("操作失败", { description: "发生未知错误" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingLanguages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载语言列表...</span>
      </div>
    )
  }

  if (languages.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">未找到已启用的语言</CardTitle>
          <CardDescription className="text-orange-700">
            请先在语言管理中启用至少一种语言
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本信息 */}
      <GameBasicInfo
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        categories={categories}
        tags={tags}
        mode={mode}
      />

      {/* 多语言内容 */}
      <GameTranslationContent
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        languages={languages}
        translationFields={translationFields}
        gameId={game?.id}
        categories={categories}
      />

      {/* 游戏截图、视频 */}
      <GameMediaSection
        register={register}
        screenshotFields={screenshotFields}
        videoFields={videoFields}
      />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting} className="shadow-sm">
          {isSubmitting
            ? (mode === "create" ? "创建中..." : "更新中...")
            : (mode === "create" ? "创建游戏" : "更新游戏")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
      </div>
    </form>
  )
}
