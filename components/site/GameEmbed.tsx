"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface GameEmbedProps {
  embedUrl: string
  title: string
  width: number
  height: number
}

export function GameEmbed({ embedUrl, title, width, height }: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculateDimensions = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const gameAspectRatio = width / height

      // 如果游戏宽度超过容器宽度，进行等比例缩放
      if (width > containerWidth) {
        setDimensions({
          width: containerWidth,
          height: containerWidth / gameAspectRatio,
        })
      } else {
        // 使用游戏原始尺寸
        setDimensions({
          width,
          height,
        })
      }
    }

    // 初始计算
    calculateDimensions()

    // 监听窗口大小变化
    window.addEventListener("resize", calculateDimensions)
    return () => window.removeEventListener("resize", calculateDimensions)
  }, [width, height])

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        className="relative"
        style={{
          width: dimensions.width || "100%",
          height: dimensions.height || "auto",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full rounded-lg"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-orientation-lock allow-modals allow-presentation allow-storage-access-by-user-activation"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  )
}
