'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Download, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface ExtractedGameData {
  // ========== 核心字段：Markdown 内容 ==========
  markdownContent?: string // 整合后的 Markdown（包含标签、开发者、评分、HTML转换内容）

  // ========== 游戏标签（简化版）==========
  tags?: Array<{
    name: string // 标签名称
  }>

  // ========== 多媒体资源 ==========
  screenshots?: Array<{
    url: string
    width?: number
    height?: number
  }>

  videos?: Array<{
    url: string
    platform: string // youtube/vimeo/dailymotion/twitch
    thumbnailUrl?: string
  }>

  // ========== 开发者信息 ==========
  developer?: string
  developerUrl?: string

  // ========== 评分信息 ==========
  rating?: number
  ratingCount?: number
}

interface GamePixExtractButtonProps {
  namespace: string
  onDataExtracted: (data: ExtractedGameData) => void
  disabled?: boolean
}

export function GamePixExtractButton({
  namespace,
  onDataExtracted,
  disabled = false,
}: GamePixExtractButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 清理函数
    return () => {
      // 组件卸载时移除事件监听
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 保存提取的数据到缓存
  const saveExtractedDataToCache = async (data: ExtractedGameData) => {
    try {
      const { saveGamePixExtractedData } = await import('@/app/(admin)/admin/games/import-actions')

      const tagNames = data.tags?.map(t => t.name) || []
      const markdown = data.markdownContent || ''
      const videos = data.videos?.map(v => v.url) || []
      const screenshots = data.screenshots?.map(s => s.url) || []

      if (tagNames.length > 0 || markdown || videos.length > 0 || screenshots.length > 0) {
        const result = await saveGamePixExtractedData(namespace, tagNames, markdown, videos, screenshots)
        if (result.success) {
          console.log('✅ 提取数据已保存到缓存')
          console.log(`  - 标签: ${tagNames.length} 个`)
          console.log(`  - 视频: ${videos.length} 个`)
          console.log(`  - 截图: ${screenshots.length} 个`)
        } else {
          console.error('保存缓存失败:', result.error)
        }
      }
    } catch (error) {
      console.error('保存缓存时出错:', error)
    }
  }

  const handleMessage = (event: MessageEvent) => {
    // 安全检查：只接收来自 GamePix 的消息
    if (!event.origin.includes('gamepix.com')) {
      console.log('忽略非 GamePix 来源的消息:', event.origin)
      return
    }

    console.log('收到消息:', event.data)

    if (event.data.type === 'GAMEPIX_EXTRACTED') {
      // 接收到提取的数据
      console.log('✅ 数据提取成功:', event.data.details)
      const extractedData = event.data.details

      // 保存到缓存数据库
      saveExtractedDataToCache(extractedData)

      onDataExtracted(extractedData)
      setLoading(false)
      setError(null)

      // 移除监听器
      window.removeEventListener('message', handleMessage)
    }

    if (event.data.type === 'GAMEPIX_EXTRACT_ERROR') {
      console.error('❌ 提取失败:', event.data.error)
      setError(event.data.error || '提取失败')
      setLoading(false)

      // 移除监听器
      window.removeEventListener('message', handleMessage)
    }
  }

  const handleExtract = () => {
    setLoading(true)
    setError(null)

    // 打开新窗口
    const popup = window.open(
      `https://www.gamepix.com/play/${namespace}`,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      setError('无法打开窗口。请允许浏览器弹出窗口，或检查浏览器设置。')
      setLoading(false)
      return
    }

    console.log('✅ 已打开游戏页面，等待插件提取数据...')

    // 监听来自插件的消息
    window.addEventListener('message', handleMessage)

    // 超时处理（30秒）
    const timeout = setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close()
      }
      window.removeEventListener('message', handleMessage)
      setError(
        '提取超时。请确保：\n1. 已安装浏览器插件\n2. 插件已启用\n3. GamePix 页面正常加载'
      )
      setLoading(false)
    }, 30000)

    // 检测窗口是否被用户手动关闭
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        clearTimeout(timeout)
        window.removeEventListener('message', handleMessage)

        // 如果还在加载状态，说明窗口被手动关闭
        if (loading) {
          setError('窗口已关闭。如果没有收到数据，请重试。')
          setLoading(false)
        }
      }
    }, 500)
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExtract}
        disabled={loading || disabled}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            提取中...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            从网页获取更多信息
          </>
        )}
      </Button>

      {loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            正在打开游戏页面并提取数据，请稍候...
            <br />
            <span className="text-xs text-muted-foreground">
              （这个过程需要 3-5 秒，窗口会自动关闭）
            </span>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        💡 提示：需要安装浏览器插件才能使用此功能
      </p>
    </div>
  )
}
