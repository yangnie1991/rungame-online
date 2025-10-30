"use client"

import { useState } from "react"
import { UseFormRegister, UseFieldArrayReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus } from "lucide-react"

interface GameFormValues {
  screenshots: string[]
  videos: string[]
  [key: string]: any
}

interface GameMediaSectionProps {
  register: UseFormRegister<GameFormValues>
  screenshotFields: UseFieldArrayReturn<GameFormValues, "screenshots", "id">
  videoFields: UseFieldArrayReturn<GameFormValues, "videos", "id">
}

export function GameMediaSection({
  register,
  screenshotFields,
  videoFields
}: GameMediaSectionProps) {
  const [newScreenshot, setNewScreenshot] = useState("")
  const [newVideo, setNewVideo] = useState("")

  return (
    <>
      {/* 游戏截图 */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">游戏截图</CardTitle>
          <CardDescription className="text-gray-600">添加游戏截图 URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {screenshotFields.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`screenshots.${index}`)}
                placeholder="https://example.com/screenshot.jpg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => screenshotFields.remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newScreenshot}
              onChange={(e) => setNewScreenshot(e.target.value)}
              placeholder="https://example.com/screenshot.jpg"
            />
            <Button
              type="button"
              onClick={() => {
                if (newScreenshot) {
                  screenshotFields.append(newScreenshot)
                  setNewScreenshot("")
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 游戏视频 */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">游戏视频</CardTitle>
          <CardDescription className="text-gray-600">添加游戏视频 URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          {videoFields.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`videos.${index}`)}
                placeholder="https://youtube.com/watch?v=..."
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => videoFields.remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <Button
              type="button"
              onClick={() => {
                if (newVideo) {
                  videoFields.append(newVideo)
                  setNewVideo("")
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

    </>
  )
}
