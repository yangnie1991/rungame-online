"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface GameEmbedProps {
  embedUrl: string
  title: string
  width: number
  height: number
}

export function GameEmbed({ embedUrl, title, width, height }: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)

  // 计算游戏的宽高比
  const aspectRatio = width / height

  return (
    <div className="w-full">
      <div
        className="relative w-full rounded-lg overflow-hidden bg-black"
        style={{
          aspectRatio: aspectRatio.toString(),
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
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
    </div>
  )
}
