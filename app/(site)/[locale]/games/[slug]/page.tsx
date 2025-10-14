import { notFound } from "next/navigation"
import { getGameBySlug, incrementPlayCount } from "../../../actions"
import Image from "next/image"
import Link from "next/link"
import { Star, Play, Calendar, Gamepad2 } from "lucide-react"
import type { Metadata } from "next"
import { GameEmbed } from "@/components/site/GameEmbed"

interface GamePageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    return {
      title: "Game Not Found",
    }
  }

  return {
    title: game.metaTitle || `${game.title} - RunGame`,
    description: game.metaDescription || game.description || "",
    keywords: game.keywords || "",
    openGraph: {
      title: game.title,
      description: game.description || "",
      images: game.banner ? [game.banner] : game.thumbnail ? [game.thumbnail] : [],
      type: "website",
    },
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    notFound()
  }

  // 增加播放次数（异步，不阻塞渲染）
  incrementPlayCount(game.id).catch(() => {})

  return (
    <div className="container py-8 space-y-8">
      {/* Game Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/${locale}/category/${game.category.slug}`}
            className="hover:text-primary"
          >
            {game.category.name}
          </Link>
          <span>/</span>
          <span>{game.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{game.title}</h1>
            {game.description && (
              <p className="text-lg text-muted-foreground mt-2">{game.description}</p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
              <span className="text-lg font-semibold">{game.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Play className="h-4 w-4 mr-1" />
              <span>{game.playCount.toLocaleString()} plays</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {game.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/${locale}/tag/${tag.slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Game Embed */}
      <div className="rounded-lg border overflow-hidden bg-black">
        <GameEmbed
          embedUrl={game.embedUrl}
          title={game.title}
          width={game.width}
          height={game.height}
        />
      </div>

      {/* Game Info Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Long Description */}
          {game.longDescription && (
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">About This Game</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {game.longDescription.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* Instructions */}
          {game.instructions && (
            <section className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center">
                <Gamepad2 className="h-6 w-6 mr-2" />
                How to Play
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {game.instructions.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Game Details Card */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Game Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <Link
                  href={`/${locale}/category/${game.category.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {game.category.name}
                </Link>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating:</span>
                <span className="font-medium flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                  {game.rating.toFixed(1)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Plays:</span>
                <span className="font-medium">{game.playCount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Added:</span>
                <span className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(game.createdAt).toLocaleDateString(locale)}
                </span>
              </div>

              {game.isFeatured && (
                <div className="pt-2 border-t">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    ⭐ Featured Game
                  </span>
                </div>
              )}
            </div>

            <Link
              href={game.gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Play in Full Screen
            </Link>
          </div>

          {/* Thumbnail */}
          {game.thumbnail && (
            <div className="rounded-lg border overflow-hidden">
              <Image
                src={game.thumbnail}
                alt={game.title}
                width={400}
                height={300}
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
