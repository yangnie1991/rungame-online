"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Maximize2, Minimize2, ThumbsUp, ThumbsDown, Share2, Eye } from "lucide-react"

interface GameEmbedProps {
  embedUrl: string
  title: string
  width: number
  height: number
  playCount?: number
  gameSlug?: string
  locale?: string
}

export function GameEmbed({
  embedUrl,
  title,
  width,
  height,
  playCount = 0,
  gameSlug = '',
  locale = 'en'
}: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算游戏的宽高比
  const aspectRatio = width / height

  // 处理点赞
  const handleLike = () => {
    if (userVote === 'like') {
      setLikes(likes - 1)
      setUserVote(null)
    } else {
      if (userVote === 'dislike') {
        setDislikes(dislikes - 1)
      }
      setLikes(likes + 1)
      setUserVote('like')
    }
  }

  // 处理踩
  const handleDislike = () => {
    if (userVote === 'dislike') {
      setDislikes(dislikes - 1)
      setUserVote(null)
    } else {
      if (userVote === 'like') {
        setLikes(likes - 1)
      }
      setDislikes(dislikes + 1)
      setUserVote('dislike')
    }
  }

  // 分享功能
  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `${locale === 'zh' ? '来玩' : 'Play'} ${title}!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // 降级到复制链接
        await navigator.clipboard.writeText(window.location.href)
        alert(locale === 'zh' ? '链接已复制到剪贴板！' : 'Link copied to clipboard!')
      }
    } catch (error) {
      console.error('分享失败:', error)
    }
  }

  // 切换全屏
  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("全屏切换失败:", error)
    }
  }

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  return (
    <div className="w-full">
      <div
        className="bg-card rounded-lg overflow-hidden shadow-md flex flex-col"
        style={{
          maxHeight: "75vh", // 整体最大高度 75vh
        }}
      >
        {/* 游戏播放器 */}
        <div
          ref={containerRef}
          className="relative w-full bg-black flex-1"
          style={{
            aspectRatio: aspectRatio.toString(),
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-orientation-lock allow-modals allow-presentation allow-storage-access-by-user-activation"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* 底部控制栏 */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-card border-t">
          {/* 左侧：游玩次数 */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{playCount.toLocaleString()}</span>
              <span className="hidden sm:inline">
                {locale === 'zh' ? '次游玩' : 'plays'}
              </span>
            </div>
          </div>

          {/* 右侧：互动按钮 */}
          <div className="flex items-center gap-2">
            {/* 赞按钮 */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                userVote === 'like'
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
              aria-label={locale === 'zh' ? '赞' : 'Like'}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">{likes}</span>
            </button>

            {/* 踩按钮 */}
            <button
              onClick={handleDislike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                userVote === 'dislike'
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
              aria-label={locale === 'zh' ? '踩' : 'Dislike'}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm font-medium">{dislikes}</span>
            </button>

            {/* 分享按钮 */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
              aria-label={locale === 'zh' ? '分享' : 'Share'}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {locale === 'zh' ? '分享' : 'Share'}
              </span>
            </button>

            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              aria-label={isFullscreen ? (locale === 'zh' ? '退出全屏' : 'Exit fullscreen') : (locale === 'zh' ? '全屏' : 'Fullscreen')}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {isFullscreen ? (locale === 'zh' ? '退出' : 'Exit') : (locale === 'zh' ? '全屏' : 'Fullscreen')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
