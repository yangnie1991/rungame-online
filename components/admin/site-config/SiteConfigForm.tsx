'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateSiteConfigAction, updateSiteConfigTranslationAction } from '@/app/(admin)/admin/site-config/actions'
import { Loader2, Save } from 'lucide-react'
import type { SiteConfig, SiteConfigTranslation } from '@prisma/client'

const siteConfigSchema = z.object({
  siteName: z.string().min(1, '网站名称不能为空'),
  siteDescription: z.string().optional(),
  siteUrl: z.string().url('请输入有效的 URL'),
  logoUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  faviconUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  ogImageUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  contactEmail: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
  supportEmail: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
  twitterHandle: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  googleAdsenseId: z.string().optional(),
  defaultKeywords: z.string().optional(), // 逗号分隔的字符串
})

const translationSchema = z.object({
  siteName: z.string().min(1, '网站名称不能为空'),
  siteDescription: z.string().optional(),
  keywords: z.string().optional(), // 逗号分隔的字符串
})

type SiteConfigFormData = z.infer<typeof siteConfigSchema>
type TranslationFormData = z.infer<typeof translationSchema>

interface SiteConfigFormProps {
  config: SiteConfig & { translations: SiteConfigTranslation[] }
}

export function SiteConfigForm({ config }: SiteConfigFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [isSaving, setIsSaving] = useState(false)

  // 基础配置表单
  const basicForm = useForm<SiteConfigFormData>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      siteName: config.siteName,
      siteDescription: config.siteDescription || '',
      siteUrl: config.siteUrl,
      logoUrl: config.logoUrl || '',
      faviconUrl: config.faviconUrl || '',
      ogImageUrl: config.ogImageUrl || '',
      contactEmail: config.contactEmail || '',
      supportEmail: config.supportEmail || '',
      twitterHandle: config.twitterHandle || '',
      googleAnalyticsId: config.googleAnalyticsId || '',
      googleAdsenseId: config.googleAdsenseId || '',
      defaultKeywords: config.defaultKeywords.join(', '),
    },
  })

  // 翻译表单
  const zhTranslation = config.translations.find(t => t.locale === 'zh')
  const translationForm = useForm<TranslationFormData>({
    resolver: zodResolver(translationSchema),
    defaultValues: {
      siteName: zhTranslation?.siteName || '',
      siteDescription: zhTranslation?.siteDescription || '',
      keywords: zhTranslation?.keywords.join(', ') || '',
    },
  })

  async function onSubmitBasic(data: SiteConfigFormData) {
    setIsSaving(true)
    try {
      const keywords = data.defaultKeywords
        ? data.defaultKeywords.split(',').map(k => k.trim()).filter(Boolean)
        : []

      const result = await updateSiteConfigAction({
        siteName: data.siteName,
        siteDescription: data.siteDescription || null,
        siteUrl: data.siteUrl,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        ogImageUrl: data.ogImageUrl || null,
        contactEmail: data.contactEmail || null,
        supportEmail: data.supportEmail || null,
        twitterHandle: data.twitterHandle || null,
        googleAnalyticsId: data.googleAnalyticsId || null,
        googleAdsenseId: data.googleAdsenseId || null,
        defaultKeywords: keywords,
      })

      if (result.success) {
        router.refresh()
        alert('保存成功！')
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  async function onSubmitTranslation(data: TranslationFormData) {
    setIsSaving(true)
    try {
      const keywords = data.keywords
        ? data.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : []

      const result = await updateSiteConfigTranslationAction('zh', {
        siteName: data.siteName,
        siteDescription: data.siteDescription || undefined,
        keywords,
      })

      if (result.success) {
        router.refresh()
        alert('保存成功！')
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="basic">基础配置</TabsTrigger>
        <TabsTrigger value="translation">中文翻译</TabsTrigger>
      </TabsList>

      {/* 基础配置 */}
      <TabsContent value="basic">
        <form onSubmit={basicForm.handleSubmit(onSubmitBasic)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
              <CardDescription>网站的基本信息配置（英文）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">网站名称 *</Label>
                <Input
                  id="siteName"
                  {...basicForm.register('siteName')}
                  placeholder="RunGame"
                />
                {basicForm.formState.errors.siteName && (
                  <p className="text-sm text-red-500">{basicForm.formState.errors.siteName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">网站描述</Label>
                <Textarea
                  id="siteDescription"
                  {...basicForm.register('siteDescription')}
                  placeholder="Play thousands of free online games..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteUrl">网站 URL *</Label>
                <Input
                  id="siteUrl"
                  {...basicForm.register('siteUrl')}
                  placeholder="https://rungame.online"
                />
                {basicForm.formState.errors.siteUrl && (
                  <p className="text-sm text-red-500">{basicForm.formState.errors.siteUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultKeywords">默认 SEO 关键词</Label>
                <Input
                  id="defaultKeywords"
                  {...basicForm.register('defaultKeywords')}
                  placeholder="free online games, browser games, RunGame"
                />
                <p className="text-sm text-gray-500">用逗号分隔多个关键词</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>品牌资源</CardTitle>
              <CardDescription>网站的 Logo、图标等资源链接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  {...basicForm.register('logoUrl')}
                  placeholder="/assets/images/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  {...basicForm.register('faviconUrl')}
                  placeholder="/favicon.ico"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogImageUrl">Open Graph 默认图片</Label>
                <Input
                  id="ogImageUrl"
                  {...basicForm.register('ogImageUrl')}
                  placeholder="/assets/images/og-image.png"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>联系方式</CardTitle>
              <CardDescription>网站的联系邮箱</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...basicForm.register('contactEmail')}
                  placeholder="contact@rungame.online"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">客服邮箱</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  {...basicForm.register('supportEmail')}
                  placeholder="support@rungame.online"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>第三方服务</CardTitle>
              <CardDescription>Google Analytics、AdSense 等服务 ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  {...basicForm.register('googleAnalyticsId')}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsenseId">Google AdSense ID</Label>
                <Input
                  id="googleAdsenseId"
                  {...basicForm.register('googleAdsenseId')}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterHandle">Twitter 账号</Label>
                <Input
                  id="twitterHandle"
                  {...basicForm.register('twitterHandle')}
                  placeholder="@rungame"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </form>
      </TabsContent>

      {/* 中文翻译 */}
      <TabsContent value="translation">
        <form onSubmit={translationForm.handleSubmit(onSubmitTranslation)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>中文翻译</CardTitle>
              <CardDescription>网站的中文本地化内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zh-siteName">网站名称（中文）*</Label>
                <Input
                  id="zh-siteName"
                  {...translationForm.register('siteName')}
                  placeholder="RunGame - 免费在线游戏"
                />
                {translationForm.formState.errors.siteName && (
                  <p className="text-sm text-red-500">{translationForm.formState.errors.siteName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zh-siteDescription">网站描述（中文）</Label>
                <Textarea
                  id="zh-siteDescription"
                  {...translationForm.register('siteDescription')}
                  placeholder="畅玩数千款免费在线游戏..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zh-keywords">SEO 关键词（中文）</Label>
                <Input
                  id="zh-keywords"
                  {...translationForm.register('keywords')}
                  placeholder="免费在线游戏, 网页游戏, RunGame"
                />
                <p className="text-sm text-gray-500">用逗号分隔多个关键词</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存翻译
                </>
              )}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}
