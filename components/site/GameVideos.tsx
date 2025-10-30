"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

interface GameVideosProps {
  videos: string[]
  gameTitle: string
  className?: string
}

// 判断是否为嵌入式视频（YouTube, Vimeo 等）
function isEmbedVideo(url: string): boolean {
  return (
    url.includes('youtube.com/embed/') ||
    url.includes('youtu.be/') ||
    url.includes('vimeo.com/') ||
    url.includes('dailymotion.com/embed/') ||
    url.includes('embed')
  )
}

// 根据文件扩展名获取正确的 MIME 类型
function getVideoMimeType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0] // 移除查询参数
  switch (extension) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
    case 'ogv':
      return 'video/ogg'
    default:
      return 'video/mp4' // 默认使用 mp4
  }
}

// 标准化 YouTube URL 为 embed 格式
function normalizeYouTubeUrl(url: string): string {
  // 已经是 embed 格式
  if (url.includes('/embed/')) {
    return url
  }

  // youtu.be 短链接格式
  const youtuBeMatch = url.match(/youtu\.be\/([^?]+)/)
  if (youtuBeMatch) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1]}`
  }

  // youtube.com/watch?v= 格式
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`
  }

  return url
}

export function GameVideos({ videos, className }: GameVideosProps) {
  const [loadErrors, setLoadErrors] = React.useState<Set<number>>(new Set())

  // 如果没有视频，不渲染组件
  if (!videos || videos.length === 0) {
    return null
  }

  const handleVideoError = (index: number) => {
    setLoadErrors(prev => new Set(prev).add(index))
  }

  const handleIframeError = (index: number) => {
    setLoadErrors(prev => new Set(prev).add(index))
  }

  return (
    <div className={className}>
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {videos.map((video, index) => {
            const isEmbed = isEmbedVideo(video)
            const embedUrl = isEmbed ? normalizeYouTubeUrl(video) : video

            return (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                <div className="p-1">
                  <Card>
                    <CardContent className="p-0 aspect-video relative overflow-hidden bg-black">
                      {loadErrors.has(index) ? (
                        // 视频加载失败时显示错误信息
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                          <p className="text-center mb-2">视频加载失败</p>
                          <a
                            href={video}
                            className="underline text-sm hover:text-gray-300"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            在新窗口中打开
                          </a>
                        </div>
                      ) : isEmbed ? (
                        // 嵌入式视频（YouTube, Vimeo 等）
                        <iframe
                          src={embedUrl}
                          title={`Video ${index + 1}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          onError={() => handleIframeError(index)}
                        />
                      ) : (
                        // 直接视频文件（MP4, WebM 等）
                        <video
                          className="w-full h-full object-contain"
                          controls
                          preload="auto"
                          playsInline
                          onError={() => handleVideoError(index)}
                        >
                          <source src={video} type={getVideoMimeType(video)} />
                          <p className="text-white text-center py-4">
                            您的浏览器不支持视频播放。
                            <a
                              href={video}
                              className="underline ml-2"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              在新窗口中打开
                            </a>
                          </p>
                        </video>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  )
}
