import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查游戏视频数据...\n')

  // 查找所有有视频的游戏
  const gamesWithVideos = await prisma.game.findMany({
    where: {
      NOT: {
        videos: {
          isEmpty: true
        }
      }
    },
    select: {
      slug: true,
      videos: true,
      translations: {
        where: {
          locale: 'en'
        },
        select: {
          title: true
        }
      }
    },
    take: 10
  })

  if (gamesWithVideos.length === 0) {
    console.log('❌ 没有找到包含视频的游戏')
    return
  }

  console.log(`✅ 找到 ${gamesWithVideos.length} 个包含视频的游戏:\n`)

  for (const game of gamesWithVideos) {
    const title = game.translations[0]?.title || '未命名'
    console.log(`📹 ${title} (${game.slug})`)
    console.log(`   视频数量: ${game.videos.length}`)

    game.videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video}`)

      // 检查视频 URL 格式
      if (!video.startsWith('http://') && !video.startsWith('https://')) {
        console.log(`      ⚠️  警告: 不是有效的 HTTP(S) URL`)
      }

      // 检查视频扩展名
      const ext = video.split('.').pop()?.toLowerCase()
      if (!['mp4', 'webm', 'ogg', 'ogv'].includes(ext || '')) {
        console.log(`      ⚠️  警告: 不支持的视频格式 (.${ext})`)
      }
    })
    console.log()
  }

  // 统计信息
  const totalVideos = gamesWithVideos.reduce((sum, game) => sum + game.videos.length, 0)
  console.log(`\n📊 统计信息:`)
  console.log(`   总游戏数: ${gamesWithVideos.length}`)
  console.log(`   总视频数: ${totalVideos}`)
  console.log(`   平均每个游戏: ${(totalVideos / gamesWithVideos.length).toFixed(1)} 个视频`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
