"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Maximize2, Minimize2 } from "lucide-react"

interface GameEmbedProps {
  embedUrl: string
  title: string
  width: number
  height: number
}

export function GameEmbed({ embedUrl, title, width, height }: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算游戏的宽高比
  const aspectRatio = width / height

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
    <div className="w-full flex justify-center">
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-black group"
        style={{
          aspectRatio: aspectRatio.toString(),
          maxHeight: "850px", // 最大高度增加到 850px
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

        {/* 全屏按钮 */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
          aria-label={isFullscreen ? "退出全屏" : "全屏"}
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
