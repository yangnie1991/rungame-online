import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充SEO数据...\n')

  // ===================================================
  // 1. PageType SEO 数据更新
  // ===================================================

  console.log('📝 更新 PageType SEO 数据...')

  // Most Played Games
  const mostPlayedPageType = await prisma.pageType.findFirst({
    where: { slug: 'most-played' }
  })

  if (mostPlayedPageType) {
    // 更新英文翻译
    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: mostPlayedPageType.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Most Played Games - Popular Online Games | RunGame',
        metaDescription: 'Discover the most popular games played by millions worldwide! Enjoy action, puzzle, sports, racing and more. Free browser games, no downloads required. Updated daily with trending titles!',
        keywords: 'most played games, popular games, trending games, top games, free online games, browser games, RunGame'
      }
    })

    // 更新中文翻译
    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: mostPlayedPageType.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '最多人游玩的游戏 - 全球热门在线游戏合集 | RunGame',
        metaDescription: '探索全球数百万玩家喜爱的最热门游戏！包括动作、益智、体育、赛车等类型。免费网页游戏，无需下载。每日更新最新热门游戏排行榜，立即开始游玩最受欢迎的在线游戏！',
        keywords: '最多人游玩游戏, 热门游戏, 流行游戏, 排行榜游戏, 免费在线游戏, 网页游戏, RunGame'
      }
    })
    console.log('✅ Most Played Games - 完成')
  }

  // New Games
  const newGamesPageType = await prisma.pageType.findFirst({
    where: { slug: 'new-games' }
  })

  if (newGamesPageType) {
    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: newGamesPageType.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'New Games - Latest Online Games Released | RunGame',
        metaDescription: 'Check out the newest games added to our platform! Fresh content updated daily with the latest releases in action, puzzle, adventure and more. Play new browser games free, no downloads. Be the first to discover exciting new titles!',
        keywords: 'new games, latest games, new releases, recently added games, fresh games, free online games, RunGame'
      }
    })

    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: newGamesPageType.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '最新游戏 - 最新发布的在线游戏大全 | RunGame',
        metaDescription: '查看我们平台上最新添加的游戏！每日更新最新发布的动作、益智、冒险等游戏。免费玩新游戏，无需下载。第一时间发现最新最热的在线游戏，体验新鲜刺激的游戏内容！',
        keywords: '最新游戏, 新游戏, 最新发布, 新增游戏, 新鲜游戏, 免费在线游戏, RunGame'
      }
    })
    console.log('✅ New Games - 完成')
  }

  // Featured Games
  const featuredPageType = await prisma.pageType.findFirst({
    where: { slug: 'featured' }
  })

  if (featuredPageType) {
    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: featuredPageType.id,
        locale: 'en'
      },
      data: {
        metaTitle: "Featured Games - Editor's Choice Collection | RunGame",
        metaDescription: "Play our featured games - carefully selected by our team for the best gaming experience! Hand-picked top-quality games including action, puzzle, sports and more. Free browser games, no downloads. Discover editor's choice games now!",
        keywords: "featured games, editor's choice, hand-picked games, best games, recommended games, free online games, RunGame"
      }
    })

    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: featuredPageType.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '精选游戏 - 编辑推荐游戏精选合集 | RunGame',
        metaDescription: '玩我们的精选游戏 - 由我们的团队精心挑选，提供最佳游戏体验！手工挑选的高质量游戏，包括动作、益智、体育等类型。免费网页游戏，无需下载。立即发现编辑推荐的优质游戏！',
        keywords: '精选游戏, 编辑推荐, 手工挑选游戏, 最佳游戏, 推荐游戏, 免费在线游戏, RunGame'
      }
    })
    console.log('✅ Featured Games - 完成')
  }

  // Trending Games
  const trendingPageType = await prisma.pageType.findFirst({
    where: { slug: 'trending' }
  })

  if (trendingPageType) {
    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: trendingPageType.id,
        locale: 'en'
      },
      data: {
        metaTitle: "Trending Games - What's Hot Right Now | RunGame",
        metaDescription: "Discover the hottest trending games that everyone is playing right now! Join millions of players enjoying the most viral games. Free browser games, no downloads. Updated hourly with the latest gaming trends. Play trending titles now!",
        keywords: "trending games, hot games, viral games, what's hot, popular now, free online games, RunGame"
      }
    })

    await prisma.pageTypeTranslation.updateMany({
      where: {
        pageTypeId: trendingPageType.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '趋势游戏 - 当前最热门的在线游戏 | RunGame',
        metaDescription: '发现当前每个人都在玩的最热门趋势游戏！与数百万玩家一起体验最火爆的病毒式游戏。免费网页游戏，无需下载。每小时更新最新游戏趋势，立即游玩最热门的游戏！',
        keywords: '趋势游戏, 热门游戏, 病毒式游戏, 当前热门, 现在流行, 免费在线游戏, RunGame'
      }
    })
    console.log('✅ Trending Games - 完成')
  }

  // ===================================================
  // 2. Category SEO 数据更新（主分类）
  // ===================================================

  console.log('\n📂 更新 Category SEO 数据...')

  // Action
  const actionCategory = await prisma.category.findFirst({
    where: { slug: 'main-action' }
  })

  if (actionCategory) {
    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: actionCategory.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Action Games - Free Online Action Games Collection | RunGame',
        metaDescription: 'Play 100+ free action games on RunGame! Enjoy fast-paced, adrenaline-pumping gameplay with shooting, fighting, platforming and adventure. No downloads required, instant play in your browser. Experience thrilling action games now!',
        keywords: 'action games, shooting games, fighting games, platform games, free action games, online action games, browser action games, RunGame'
      }
    })

    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: actionCategory.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '动作游戏 - 免费在线动作游戏大全 | RunGame',
        metaDescription: '在 RunGame 上玩 100+ 款免费动作游戏！体验快节奏、激动人心的射击、格斗、平台跳跃和冒险玩法。无需下载，浏览器即玩。立即体验刺激的动作游戏，享受肾上腺素飙升的游戏体验！',
        keywords: '动作游戏, 射击游戏, 格斗游戏, 平台游戏, 免费动作游戏, 在线动作游戏, 网页动作游戏, RunGame'
      }
    })
    console.log('✅ Action - 完成')
  }

  // Adventure
  const adventureCategory = await prisma.category.findFirst({
    where: { slug: 'main-adventure' }
  })

  if (adventureCategory) {
    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: adventureCategory.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Adventure Games - Free Online Adventure Games | RunGame',
        metaDescription: 'Play 100+ free adventure games on RunGame! Explore exciting worlds, solve puzzles, discover secrets and embark on epic quests. No downloads, instant browser gameplay. Start your adventure journey now with point-and-click, RPG and story-driven games!',
        keywords: 'adventure games, exploration games, quest games, RPG games, free adventure games, online adventure games, browser adventure games, RunGame'
      }
    })

    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: adventureCategory.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '冒险游戏 - 免费在线冒险游戏大全 | RunGame',
        metaDescription: '在 RunGame 上玩 100+ 款免费冒险游戏！探索令人兴奋的世界，解决谜题，发现秘密，开启史诗般的任务。无需下载，浏览器即玩。立即开始你的冒险之旅，体验点击、RPG 和故事驱动游戏！',
        keywords: '冒险游戏, 探索游戏, 任务游戏, RPG游戏, 免费冒险游戏, 在线冒险游戏, 网页冒险游戏, RunGame'
      }
    })
    console.log('✅ Adventure - 完成')
  }

  // Puzzle
  const puzzleCategory = await prisma.category.findFirst({
    where: { slug: 'main-puzzle' }
  })

  if (puzzleCategory) {
    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: puzzleCategory.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Puzzle Games - Free Online Puzzle Games Collection | RunGame',
        metaDescription: 'Play 100+ free puzzle games on RunGame! Challenge your brain with match-3, logic, word puzzles, sudoku and more. No downloads, instant browser gameplay. Sharpen your mind with addictive puzzle games for all skill levels!',
        keywords: 'puzzle games, brain games, logic games, match-3 games, free puzzle games, online puzzle games, browser puzzle games, RunGame'
      }
    })

    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: puzzleCategory.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '益智游戏 - 免费在线益智游戏大全 | RunGame',
        metaDescription: '在 RunGame 上玩 100+ 款免费益智游戏！挑战你的大脑，体验三消、逻辑、文字谜题、数独等游戏。无需下载，浏览器即玩。用适合各种技能水平的上瘾益智游戏锻炼你的思维能力！',
        keywords: '益智游戏, 脑力游戏, 逻辑游戏, 三消游戏, 免费益智游戏, 在线益智游戏, 网页益智游戏, RunGame'
      }
    })
    console.log('✅ Puzzle - 完成')
  }

  // Sports
  const sportsCategory = await prisma.category.findFirst({
    where: { slug: 'main-sports' }
  })

  if (sportsCategory) {
    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: sportsCategory.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Sports Games - Free Online Sports Games Collection | RunGame',
        metaDescription: 'Play 100+ free sports games on RunGame! Enjoy football, basketball, soccer, tennis, racing and more athletic challenges. No downloads, instant browser gameplay. Experience realistic sports simulations and arcade sports action now!',
        keywords: 'sports games, football games, basketball games, soccer games, racing games, free sports games, online sports games, RunGame'
      }
    })

    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: sportsCategory.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '体育游戏 - 免费在线体育游戏大全 | RunGame',
        metaDescription: '在 RunGame 上玩 100+ 款免费体育游戏！享受足球、篮球、网球、赛车等运动挑战。无需下载，浏览器即玩。立即体验逼真的体育模拟和街机风格的体育动作游戏！',
        keywords: '体育游戏, 足球游戏, 篮球游戏, 网球游戏, 赛车游戏, 免费体育游戏, 在线体育游戏, RunGame'
      }
    })
    console.log('✅ Sports - 完成')
  }

  // Racing
  const racingCategory = await prisma.category.findFirst({
    where: { slug: 'main-racing' }
  })

  if (racingCategory) {
    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: racingCategory.id,
        locale: 'en'
      },
      data: {
        metaTitle: 'Racing Games - Free Online Racing Games Collection | RunGame',
        metaDescription: 'Play 100+ free racing games on RunGame! Race cars, bikes, trucks and more in thrilling high-speed competitions. No downloads, instant browser gameplay. Feel the adrenaline with realistic simulators and arcade racing action!',
        keywords: 'racing games, car games, driving games, speed games, free racing games, online racing games, browser racing games, RunGame'
      }
    })

    await prisma.categoryTranslation.updateMany({
      where: {
        categoryId: racingCategory.id,
        locale: 'zh'
      },
      data: {
        metaTitle: '赛车游戏 - 免费在线赛车游戏大全 | RunGame',
        metaDescription: '在 RunGame 上玩 100+ 款免费赛车游戏！驾驶汽车、摩托车、卡车等参加刺激的高速竞赛。无需下载，浏览器即玩。通过逼真的模拟器和街机赛车动作感受肾上腺素飙升！',
        keywords: '赛车游戏, 汽车游戏, 驾驶游戏, 速度游戏, 免费赛车游戏, 在线赛车游戏, 网页赛车游戏, RunGame'
      }
    })
    console.log('✅ Racing - 完成')
  }

  console.log('\n✅ 所有SEO数据填充完成！')

  // 验证更新结果
  console.log('\n📊 验证更新结果...\n')

  const pageTypes = await prisma.pageType.findMany({
    where: { slug: { in: ['most-played', 'new-games', 'featured', 'trending'] } },
    include: {
      translations: {
        where: { locale: { in: ['en', 'zh'] } }
      }
    }
  })

  console.log('PageType 更新结果:')
  pageTypes.forEach(pt => {
    console.log(`\n${pt.slug}:`)
    pt.translations.forEach(t => {
      console.log(`  ${t.locale}: ${t.metaTitle?.substring(0, 50)}...`)
    })
  })

  const categories = await prisma.category.findMany({
    where: { slug: { in: ['main-action', 'main-adventure', 'main-puzzle', 'main-sports', 'main-racing'] } },
    include: {
      translations: {
        where: { locale: { in: ['en', 'zh'] } }
      }
    }
  })

  console.log('\nCategory 更新结果:')
  categories.forEach(cat => {
    console.log(`\n${cat.slug}:`)
    cat.translations.forEach(t => {
      console.log(`  ${t.locale}: ${t.metaTitle?.substring(0, 50)}...`)
    })
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
