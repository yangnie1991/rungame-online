/**
 * 从缓存数据库导入演示游戏到主数据库
 * 用于SEO测试和演示
 */

import { PrismaClient } from '@prisma/client'
import { PrismaClient as CachePrismaClient } from '../lib/generated/prisma-cache'

const prisma = new PrismaClient()
const cacheDb = new CachePrismaClient()

// 分类映射：GamePix分类 -> 我们的子分类slug
const CATEGORY_MAPPING: Record<string, string> = {
  // Action相关
  'action': 'action',
  'arcade': 'arcade',
  'stickman': 'stickman',
  'parkour': 'parkour',
  'ninja': 'ninja',

  // Adventure相关
  'adventure': 'adventure',
  'survival': 'survival',
  'escape': 'escape',

  // Puzzle相关
  'puzzle': 'puzzle',
  'block': 'block',
  'match-3': 'match-3',
  'drawing': 'drawing',
  'logic': 'logic',
  'brain': 'brain',

  // Sports相关
  'sports': 'sports',
  'football': 'football',
  'basketball': 'basketball',
  'golf': 'golf',

  // Racing相关
  'racing': 'racing',
  'car': 'car',
  'bike': 'bike',
  'drift': 'drift',

  // Shooter相关
  'shooter': 'shooter',
  'gun': 'gun',
  'sniper': 'sniper',

  // Fighting相关
  'fighting': 'fighting',
  'battle': 'battle',
  'war': 'war',

  // Strategy相关
  'strategy': 'strategy',
  'tower-defense': 'tower-defense',
  'defense': 'defense',

  // RPG相关
  'rpg': 'rpg',
  'fantasy': 'fantasy',

  // Simulation相关
  'simulation': 'simulation',
  'farming': 'farming',
  'life': 'life',

  // Casual相关
  'casual': 'casual',
  'clicker': 'clicker',
  'idle': 'idle',
  'hyper-casual': 'hyper-casual',
  'runner': 'runner',
  'platformer': 'platformer',
  'jumping': 'jumping',
  'skill': 'skill',
  'fun': 'fun',

  // Board相关
  'board': 'board',
  'card': 'card',
  'chess': 'chess',
  'solitaire': 'solitaire',
  'mahjong': 'mahjong',

  // Kids相关
  'kids': 'kids',
  'baby': 'baby',
  'educational': 'educational',
  'coloring': 'coloring',

  // Girls相关
  'girls': 'games-for-girls',
  'dress-up': 'dress-up',
  'fashion': 'fashion',
  'princess': 'princess',
  'barbie': 'barbie',

  // Horror相关
  'horror': 'horror',
  'scary': 'scary',
  'zombie': 'zombie',
  'granny': 'granny',

  // Building相关
  'building': 'building',
  'minecraft': 'minecraft',
  'city-building': 'city-building',
  'tycoon': 'tycoon',

  // Animal相关
  'animal': 'animal',
  'dinosaur': 'dinosaur',
  'cats': 'cats',
  'sharks': 'sharks',

  // Multiplayer相关
  'multiplayer': 'multiplayer',
  'io': 'io',
  '2-player': '2-player',

  // Classics相关
  'classics': 'classics',
  'mario': 'mario',
  'snake': 'snake',
  'flash': 'flash',

  // Other相关
  'ball': 'ball',
  'physics': 'physics',
  'collecting': 'collecting',
  'bubble-shooter': 'bubble-shooter',
}

async function importDemoGames() {
  try {
    console.log('🎮 开始导入演示游戏...\n')

    // 1. 从缓存数据库获取10个高质量游戏
    console.log('📥 从缓存数据库查询游戏...')
    const cacheGames = await cacheDb.gamePixGameCache.findMany({
      where: {
        isImported: false, // 未导入过的
        isHidden: false,   // 未隐藏的
        quality_score: {
          gte: 0.7,        // 质量评分 >= 0.7
        },
      },
      orderBy: [
        { quality_score: 'desc' }, // 按质量评分降序
        { date_published: 'desc' }, // 然后按发布日期降序
      ],
      take: 10,
    })

    if (cacheGames.length === 0) {
      console.log('⚠️  缓存数据库中没有找到符合条件的游戏')
      return
    }

    console.log(`✅ 找到 ${cacheGames.length} 个游戏\n`)

    // 2. 获取所有分类
    console.log('📋 获取主数据库分类...')
    const categories = await prisma.category.findMany({
      where: { isEnabled: true },
      select: { id: true, slug: true },
    })

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]))
    console.log(`✅ 找到 ${categories.length} 个分类\n`)

    // 3. 导入游戏
    let successCount = 0
    let failCount = 0

    for (const game of cacheGames) {
      try {
        console.log(`\n🎯 正在导入: ${game.title}`)
        console.log(`   - 分类: ${game.category}`)
        console.log(`   - 评分: ${(game.quality_score * 10).toFixed(1)}/10`)

        // 查找对应的子分类
        const categorySlug = CATEGORY_MAPPING[game.category.toLowerCase()] || 'casual'
        const subCategory = await prisma.category.findUnique({
          where: { slug: categorySlug },
        })

        if (!subCategory || !subCategory.parentId) {
          console.log(`   ⚠️  跳过: 找不到子分类 ${categorySlug}`)
          failCount++
          continue
        }

        const categoryId = subCategory.id
        const mainCategoryId = subCategory.parentId

        // 生成slug（使用namespace）
        const slug = game.namespace.toLowerCase()

        // 检查是否已存在
        const existing = await prisma.game.findUnique({
          where: { slug },
        })

        if (existing) {
          console.log(`   ⚠️  跳过: 游戏已存在 (slug: ${slug})`)
          failCount++
          continue
        }

        // 创建游戏
        const createdGame = await prisma.game.create({
          data: {
            slug,
            title: game.title,
            description: game.description,
            thumbnail: game.banner_image || game.image,
            banner: game.banner_image,
            embedUrl: game.url,
            gameUrl: game.url,
            dimensions: {
              width: game.width,
              height: game.height,
              aspectRatio: `${game.width}:${game.height}`,
              orientation: game.orientation,
            },
            status: 'PUBLISHED',
            isFeatured: game.quality_score >= 0.9, // 高质量游戏设为精选
            qualityScore: game.quality_score * 10, // 转换为0-10分制
            sourcePlatform: 'gamepix',
            sourcePlatformId: game.id,
            developer: 'GamePix',
            releaseDate: game.date_published,
            importedAt: new Date(),
            publishedAt: new Date(),
            // 创建分类关联
            gameCategories: {
              create: {
                categoryId: categoryId,        // 子分类ID
                mainCategoryId: mainCategoryId, // 主分类ID
                isPrimary: true,
                sortOrder: 0,
              },
            },
          },
        })

        // 创建中文翻译
        await prisma.gameTranslation.create({
          data: {
            gameId: createdGame.id,
            locale: 'zh',
            title: game.title, // 暂时使用英文标题
            description: game.description, // 暂时使用英文描述
          },
        })

        // 更新缓存数据库的导入状态
        await cacheDb.gamePixGameCache.update({
          where: { id: game.id },
          data: {
            isImported: true,
            importCount: { increment: 1 },
            lastImportedAt: new Date(),
          },
        })

        console.log(`   ✅ 成功导入: ${createdGame.title}`)
        successCount++

      } catch (error) {
        console.error(`   ❌ 导入失败: ${game.title}`)
        console.error(`   错误: ${error instanceof Error ? error.message : String(error)}`)
        failCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 导入完成统计:')
    console.log(`   ✅ 成功: ${successCount} 个`)
    console.log(`   ❌ 失败: ${failCount} 个`)
    console.log(`   📝 总计: ${cacheGames.length} 个`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ 导入过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await cacheDb.$disconnect()
  }
}

// 执行导入
importDemoGames()
  .then(() => {
    console.log('\n✨ 导入完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 导入失败:', error)
    process.exit(1)
  })
