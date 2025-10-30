"use client"

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

interface GameGalleryProps {
  screenshots: string[]
  gameTitle: string
  className?: string
}

export function GameGallery({ screenshots, gameTitle, className }: GameGalleryProps) {
  // 如果没有截图，不渲染组件
  if (!screenshots || screenshots.length === 0) {
    return null
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
          {screenshots.map((screenshot, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="p-0 aspect-video relative overflow-hidden">
                    <Image
                      src={screenshot}
                      alt={`${gameTitle} - Screenshot ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  )
}
