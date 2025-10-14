"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface GameEmbedProps {
  embedUrl: string
  title: string
  width: number
  height: number
}

export function GameEmbed({ embedUrl, title, width, height }: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(height / width)

  useEffect(() => {
    setAspectRatio(height / width)
  }, [width, height])

  return (
    <div className="relative w-full" style={{ paddingBottom: `${aspectRatio * 100}%` }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
