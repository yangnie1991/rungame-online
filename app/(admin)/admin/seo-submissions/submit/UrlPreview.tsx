/**
 * URL 预览组件
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Link as LinkIcon, Globe, Layers } from 'lucide-react'
import { previewUrls, type PreviewUrlsInput, type PreviewUrlsResult } from './preview-actions'
import type { UrlInfo } from '@/lib/seo-submissions/url-generator'

interface UrlPreviewProps {
  selectedItems: PreviewUrlsInput
}

export function UrlPreview({ selectedItems }: UrlPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewUrlsResult | null>(null)

  const totalSelected =
    (selectedItems.games?.length || 0) +
    (selectedItems.categories?.length || 0) +
    (selectedItems.tags?.length || 0) +
    (selectedItems.pageTypes?.length || 0)

  // 当选中内容变化时，自动预览
  useEffect(() => {
    if (totalSelected === 0) {
      setPreview(null)
      setIsOpen(false)
      return
    }

    const loadPreview = async () => {
      setIsLoading(true)
      try {
        const result = await previewUrls(selectedItems)
        setPreview(result)
        setIsOpen(true) // 自动展开预览
      } catch (error) {
        console.error('预览失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [
    selectedItems.games?.join(','),
    selectedItems.categories?.join(','),
    selectedItems.tags?.join(','),
    selectedItems.pageTypes?.join(','),
    totalSelected,
  ])

  if (totalSelected === 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">URL 预览</CardTitle>
              <CardDescription>
                {isLoading
                  ? '正在生成 URL...'
                  : preview
                  ? `将生成 ${preview.stats.totalUrls} 个 URL（${totalSelected} 项内容 × 多语言）`
                  : ''}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                收起
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                展开
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isOpen && preview && (
        <CardContent>
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">总 URL 数</div>
              <div className="text-2xl font-bold text-blue-600">
                {preview.stats.totalUrls}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">游戏</div>
              <div className="text-2xl font-bold">{preview.stats.byType.game}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">分类</div>
              <div className="text-2xl font-bold">{preview.stats.byType.category}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-muted-foreground">标签</div>
              <div className="text-2xl font-bold">{preview.stats.byType.tag}</div>
            </div>
          </div>

          {/* URL 列表 */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                全部 ({preview.stats.totalUrls})
              </TabsTrigger>
              <TabsTrigger value="en">
                <Globe className="h-3 w-3 mr-1" />
                EN ({preview.stats.byLocale['en'] || 0})
              </TabsTrigger>
              <TabsTrigger value="zh">
                <Globe className="h-3 w-3 mr-1" />
                ZH ({preview.stats.byLocale['zh'] || 0})
              </TabsTrigger>
              <TabsTrigger value="type">
                <Layers className="h-3 w-3 mr-1" />
                按类型
              </TabsTrigger>
            </TabsList>

            {/* 全部 URLs */}
            <TabsContent value="all">
              <ScrollArea className="h-[300px] w-full rounded-md border bg-white p-4">
                <div className="space-y-2">
                  {preview.urls.map((urlInfo, index) => (
                    <UrlItem key={index} urlInfo={urlInfo} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 英文 URLs */}
            <TabsContent value="en">
              <ScrollArea className="h-[300px] w-full rounded-md border bg-white p-4">
                <div className="space-y-2">
                  {preview.urls
                    .filter((u) => u.locale === 'en')
                    .map((urlInfo, index) => (
                      <UrlItem key={index} urlInfo={urlInfo} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 中文 URLs */}
            <TabsContent value="zh">
              <ScrollArea className="h-[300px] w-full rounded-md border bg-white p-4">
                <div className="space-y-2">
                  {preview.urls
                    .filter((u) => u.locale === 'zh')
                    .map((urlInfo, index) => (
                      <UrlItem key={index} urlInfo={urlInfo} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 按类型分组 */}
            <TabsContent value="type">
              <ScrollArea className="h-[300px] w-full rounded-md border bg-white p-4">
                <div className="space-y-4">
                  {preview.stats.byType.game > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        游戏 <Badge variant="secondary">{preview.stats.byType.game}</Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {preview.urls
                          .filter((u) => u.type === 'game')
                          .map((urlInfo, index) => (
                            <UrlItem key={index} urlInfo={urlInfo} />
                          ))}
                      </div>
                    </div>
                  )}

                  {preview.stats.byType.category > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        分类 <Badge variant="secondary">{preview.stats.byType.category}</Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {preview.urls
                          .filter((u) => u.type === 'category')
                          .map((urlInfo, index) => (
                            <UrlItem key={index} urlInfo={urlInfo} />
                          ))}
                      </div>
                    </div>
                  )}

                  {preview.stats.byType.tag > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        标签 <Badge variant="secondary">{preview.stats.byType.tag}</Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {preview.urls
                          .filter((u) => u.type === 'tag')
                          .map((urlInfo, index) => (
                            <UrlItem key={index} urlInfo={urlInfo} />
                          ))}
                      </div>
                    </div>
                  )}

                  {preview.stats.byType.pagetype > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        页面类型 <Badge variant="secondary">{preview.stats.byType.pagetype}</Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {preview.urls
                          .filter((u) => u.type === 'pagetype')
                          .map((urlInfo, index) => (
                            <UrlItem key={index} urlInfo={urlInfo} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}

// URL 项组件
function UrlItem({ urlInfo }: { urlInfo: UrlInfo }) {
  const typeColors = {
    game: 'bg-green-100 text-green-700',
    category: 'bg-blue-100 text-blue-700',
    tag: 'bg-purple-100 text-purple-700',
    pagetype: 'bg-orange-100 text-orange-700',
    sitemap: 'bg-gray-100 text-gray-700',
    other: 'bg-gray-100 text-gray-700',
  }

  const typeNames = {
    game: '游戏',
    category: '分类',
    tag: '标签',
    pagetype: '页面',
    sitemap: 'Sitemap',
    other: '其他',
  }

  return (
    <div className="flex items-start gap-2 text-sm hover:bg-gray-50 p-2 rounded group">
      <Badge className={`${typeColors[urlInfo.type]} text-xs shrink-0 mt-0.5`}>
        {typeNames[urlInfo.type]}
      </Badge>
      {urlInfo.locale && (
        <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
          {urlInfo.locale.toUpperCase()}
        </Badge>
      )}
      <a
        href={urlInfo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-blue-600 hover:underline flex-1 break-all"
      >
        {urlInfo.url}
      </a>
    </div>
  )
}
