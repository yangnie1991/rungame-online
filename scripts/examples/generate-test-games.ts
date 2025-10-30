/**
 * ============================================
 * 生成测试游戏数据
 * ============================================
 *
 * 用于测试推荐游戏功能，生成多个测试游戏
 *
 * 运行方式:
 * npx tsx scripts/examples/generate-test-games.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateTestGames() {
  try {
    console.log('🎮 开始生成测试游戏...\n')

    // 1. 获取所有主分类
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // 只获取主分类
        isEnabled: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
      take: 5, // 取前 5 个分类
    })

    if (categories.length === 0) {
      console.log('❌ 没有找到可用的分类，请先运行 seed 脚本')
      return
    }

    console.log(`✅ 找到 ${categories.length} 个分类\n`)

    // 2. 为每个分类生成 5 个测试游戏
    let totalCreated = 0

    for (const category of categories) {
      console.log(`📁 为分类 "${category.name}" (${category.slug}) 生成游戏...`)

      for (let i = 1; i <= 5; i++) {
        const gameSlug = `test-game-${category.slug}-${i}`
        const gameTitle = `Test Game ${category.name} ${i}`

        // 检查游戏是否已存在
        const existing = await prisma.game.findUnique({
          where: { slug: gameSlug },
        })

        if (existing) {
          console.log(`  ⏭️  跳过: ${gameTitle} (已存在)`)
          continue
        }

        // 创建游戏
        const game = await prisma.game.create({
          data: {
            slug: gameSlug,
            title: gameTitle,
            description: `This is a test game in ${category.name} category. Great for testing the recommendation system!`,
            thumbnail: `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(gameTitle)}`,
            embedUrl: `https://example.com/games/${gameSlug}`,
            status: 'PUBLISHED',
            playCount: Math.floor(Math.random() * 10000), // 随机播放次数 0-10000
            rating: Math.random() * 5, // 随机评分 0-5

            // 测试用的截图和视频
            screenshots: [
              `https://via.placeholder.com/1280x720.png?text=Screenshot+1`,
              `https://via.placeholder.com/1280x720.png?text=Screenshot+2`,
              `https://via.placeholder.com/1280x720.png?text=Screenshot+3`,
            ],
            videos: [
              `https://example.com/videos/${gameSlug}-gameplay.mp4`,
            ],

            // 创建分类关联
            gameCategories: {
              create: {
                categoryId: category.id,
                mainCategoryId: category.id,
                isPrimary: true,
              },
            },
          },
        })

        console.log(`  ✅ 创建: ${game.title} (播放次数: ${game.playCount})`)
        totalCreated++
      }

      console.log()
    }

    console.log(`\n🎉 成功创建 ${totalCreated} 个测试游戏！`)

    // 3. 显示统计信息
    const stats = await prisma.game.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log('\n📊 当前游戏统计:')
    stats.forEach((stat) => {
      console.log(`  ${stat.status}: ${stat._count} 个`)
    })

    // 4. 显示每个分类的游戏数
    console.log('\n📊 每个分类的游戏数:')
    for (const category of categories) {
      const count = await prisma.gameCategory.count({
        where: {
          mainCategoryId: category.id,
        },
      })
      console.log(`  ${category.name} (${category.slug}): ${count} 个游戏`)
    }

  } catch (error) {
    console.error('❌ 生成失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 清除测试游戏
async function clearTestGames() {
  try {
    console.log('🗑️  开始清除测试游戏...\n')

    const result = await prisma.game.deleteMany({
      where: {
        slug: {
          startsWith: 'test-game-',
        },
      },
    })

    console.log(`✅ 已删除 ${result.count} 个测试游戏`)
  } catch (error) {
    console.error('❌ 清除失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'clear') {
    await clearTestGames()
  } else if (command === 'generate' || !command) {
    await generateTestGames()
  } else {
    console.log(`
使用方法:
  npx tsx scripts/examples/generate-test-games.ts [command]

命令:
  generate  - 生成测试游戏（默认）
  clear     - 清除所有测试游戏

示例:
  npx tsx scripts/examples/generate-test-games.ts          # 生成测试游戏
  npx tsx scripts/examples/generate-test-games.ts generate # 生成测试游戏
  npx tsx scripts/examples/generate-test-games.ts clear    # 清除测试游戏
    `)
  }
}

// 执行
if (require.main === module) {
  main()
}

export { generateTestGames, clearTestGames }
