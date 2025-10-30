/**
 * 检查数据库中游戏的发布状态
 *
 * 使用方法:
 * npx tsx scripts/check-game-status.ts
 */

import { prisma } from '../lib/prisma'

async function checkGameStatus() {
  console.log('🔍 检查数据库中游戏的发布状态...\n')

  try {
    // 统计各状态的游戏数量
    const statusCounts = await prisma.game.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log('📊 游戏状态统计:')
    statusCounts.forEach((item) => {
      console.log(`  ${item.status}: ${item._count} 个游戏`)
    })

    // 查询所有游戏的状态详情
    const games = await prisma.game.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        createdAt: true,
        publishedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // 只显示最新的20个游戏
    })

    console.log('\n📝 游戏详细信息 (最新20个):')
    console.log('─'.repeat(100))
    console.log(
      'ID'.padEnd(30) +
        'Slug'.padEnd(25) +
        'Title'.padEnd(25) +
        'Status'.padEnd(15) +
        'Published At'
    )
    console.log('─'.repeat(100))

    games.forEach((game) => {
      console.log(
        game.id.padEnd(30) +
          game.slug.substring(0, 23).padEnd(25) +
          game.title.substring(0, 23).padEnd(25) +
          game.status.padEnd(15) +
          (game.publishedAt?.toISOString() || 'N/A')
      )
    })

    // 检查是否有发布但没有 publishedAt 的游戏
    const publishedWithoutDate = await prisma.game.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: null,
      },
    })

    if (publishedWithoutDate > 0) {
      console.log(
        `\n⚠️  发现 ${publishedWithoutDate} 个已发布但没有发布日期的游戏`
      )
    }

    // 检查是否有草稿但有 publishedAt 的游戏
    const draftWithDate = await prisma.game.count({
      where: {
        status: 'DRAFT',
        publishedAt: { not: null },
      },
    })

    if (draftWithDate > 0) {
      console.log(
        `\n⚠️  发现 ${draftWithDate} 个草稿状态但有发布日期的游戏`
      )
    }

    console.log('\n✅ 检查完成')
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGameStatus()
