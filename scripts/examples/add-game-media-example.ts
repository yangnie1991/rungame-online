/**
 * ============================================
 * 游戏媒体资源添加示例
 * ============================================
 *
 * 这个脚本展示如何为游戏添加截图和视频
 *
 * 运行方式:
 * npx tsx scripts/examples/add-game-media-example.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addGameMedia() {
  try {
    // 示例 1: 为已有游戏添加截图和视频
    const gameSlug = 'your-game-slug' // 替换为实际游戏 slug

    const updatedGame = await prisma.game.update({
      where: { slug: gameSlug },
      data: {
        // 添加截图 URL（使用 R2 CDN 或其他 CDN 链接）
        screenshots: [
          'https://your-cdn.com/games/game-1/screenshot-1.jpg',
          'https://your-cdn.com/games/game-1/screenshot-2.jpg',
          'https://your-cdn.com/games/game-1/screenshot-3.jpg',
          'https://your-cdn.com/games/game-1/screenshot-4.jpg',
        ],

        // 添加视频 URL（支持 mp4, webm, ogg 格式）
        videos: [
          'https://your-cdn.com/games/game-1/gameplay.mp4',
          'https://your-cdn.com/games/game-1/trailer.mp4',
        ],
      },
    })

    console.log('✅ 游戏媒体资源已更新:', updatedGame.slug)
    console.log('   截图数量:', updatedGame.screenshots.length)
    console.log('   视频数量:', updatedGame.videos.length)

    // 示例 2: 创建新游戏并包含截图和视频
    const newGame = await prisma.game.create({
      data: {
        slug: 'awesome-game',
        title: 'Awesome Game',
        description: 'An awesome game with great graphics',
        thumbnail: 'https://your-cdn.com/games/awesome-game/thumbnail.jpg',
        embedUrl: 'https://game-platform.com/play/awesome-game',

        // 添加截图
        screenshots: [
          'https://your-cdn.com/games/awesome-game/screenshot-1.jpg',
          'https://your-cdn.com/games/awesome-game/screenshot-2.jpg',
          'https://your-cdn.com/games/awesome-game/screenshot-3.jpg',
        ],

        // 添加视频
        videos: [
          'https://your-cdn.com/games/awesome-game/gameplay.mp4',
        ],

        // 其他必需字段
        status: 'PUBLISHED',
      },
    })

    console.log('✅ 新游戏已创建:', newGame.slug)

    // 示例 3: 批量更新游戏（从 GamePix 等平台导入）
    const gamesToUpdate = [
      {
        slug: 'game-1',
        screenshots: ['url1', 'url2', 'url3'],
        videos: ['video1.mp4'],
      },
      {
        slug: 'game-2',
        screenshots: ['url4', 'url5'],
        videos: ['video2.mp4', 'video3.mp4'],
      },
    ]

    for (const gameData of gamesToUpdate) {
      await prisma.game.update({
        where: { slug: gameData.slug },
        data: {
          screenshots: gameData.screenshots,
          videos: gameData.videos,
        },
      })
      console.log(`✅ 已更新: ${gameData.slug}`)
    }

  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 注意事项
console.log(`
📝 使用说明:
=============

1. 图片格式建议:
   - JPG/JPEG: 游戏截图
   - PNG: 透明背景或高质量截图
   - WebP: 现代浏览器优化格式
   - 尺寸建议: 1280x720 或 1920x1080 (16:9)

2. 视频格式建议:
   - MP4 (H.264): 最佳兼容性
   - WebM (VP9): Chrome/Firefox 优化
   - OGG: Firefox 支持
   - 分辨率: 720p 或 1080p
   - 码率: 2-5 Mbps

3. CDN 存储建议:
   - 使用 Cloudflare R2（参考 docs/R2-CDN-SETUP.md）
   - 或其他 CDN 服务（如 AWS S3, Azure Blob）
   - 启用缓存和 CDN 加速

4. 数据库字段:
   - screenshots: String[] - 截图 URL 数组
   - videos: String[] - 视频 URL 数组
   - 都是可选字段，可以为空数组

5. 显示逻辑:
   - 如果 screenshots 数组有数据，页面会显示截图轮播
   - 如果 videos 数组有数据，页面会显示视频播放器
   - 如果都为空，不显示任何媒体模块

`)

// 如果直接运行此脚本，执行添加操作
if (require.main === module) {
  console.log('⚠️  这是一个示例脚本，请修改代码后再运行！')
  // 取消注释下面这行来执行
  // addGameMedia()
}

export { addGameMedia }
