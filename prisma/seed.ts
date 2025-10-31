import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充数据库...')

  // ==================== 1. 语言数据 ====================
  console.log('\n📝 创建语言数据...')

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      localeCode: 'en-US',
      direction: 'LTR',
      isDefault: true,
      isEnabled: true,
      sortOrder: 1,
      translations: {
        create: [
          {
            locale: 'zh',
            name: '英语',
            description: '美式英语',
          },
        ],
      },
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      localeCode: 'zh-CN',
      direction: 'LTR',
      isDefault: false,
      isEnabled: true,
      sortOrder: 2,
      translations: {
        create: [
          {
            locale: 'en',
            name: 'Chinese',
            description: 'Simplified Chinese',
          },
          {
            locale: 'zh',
            name: '中文',
            description: '简体中文',
          },
        ],
      },
    },
  ]

  for (const lang of languages) {
    await prisma.language.create({
      data: lang,
    })
    console.log(`   ✓ ${lang.name} (${lang.code})`)
  }

  // ==================== 2. 管理员数据 ====================
  console.log('\n👤 创建管理员数据...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.create({
    data: {
      email: 'admin@rungame.online',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log(`   ✓ ${admin.name} (${admin.email})`)

  // ==================== 3. 导入平台数据 ====================
  console.log('\n🎮 创建导入平台数据...')

  const platforms = [
    {
      name: 'GamePix',
      slug: 'gamepix',
      type: 'gamepix',
      icon: '🎯',
      apiConfig: {
        siteId: '8RI7HLK9GV8W',
        feedUrl: 'https://public.gamepix.com/json/feeds/v2/games.json',
        categoryUrl: 'https://public.gamepix.com/json/feeds/v2/games/category/list.json',
      },
      defaultConfig: {
        autoPublish: false,
        setFeatured: false,
        importImages: true,
        importTranslations: true,
      },
      isEnabled: true,
      sortOrder: 1,
    },
  ]

  for (const platform of platforms) {
    await prisma.importPlatform.create({
      data: platform,
    })
    console.log(`   ✓ ${platform.name} (${platform.slug})`)
  }

  // ==================== 4. 分类数据（从 GamePix API）====================
  console.log('\n📁 创建分类数据...')

  // 从 GamePix API 获取的分类数据，包含中文翻译
  const categories = [
    { slug: '2048', name: '2048', nameCn: '2048游戏' },
    { slug: 'simulation', name: 'Simulation', nameCn: '模拟' },
    { slug: 'arcade', name: 'Arcade', nameCn: '街机' },
    { slug: 'shooter', name: 'Shooter', nameCn: '射击' },
    { slug: 'drawing', name: 'Drawing', nameCn: '绘画' },
    { slug: 'stickman', name: 'Stickman', nameCn: '火柴人' },
    { slug: 'ball', name: 'Ball', nameCn: '球类' },
    { slug: 'adventure', name: 'Adventure', nameCn: '冒险' },
    { slug: 'block', name: 'Block', nameCn: '方块' },
    { slug: 'kids', name: 'Kids', nameCn: '儿童' },
    { slug: 'sports', name: 'Sports', nameCn: '体育' },
    { slug: 'fighting', name: 'Fighting', nameCn: '格斗' },
    { slug: 'educational', name: 'Educational', nameCn: '教育' },
    { slug: 'basketball', name: 'Basketball', nameCn: '篮球' },
    { slug: 'memory', name: 'Memory', nameCn: '记忆' },
    { slug: 'puzzle', name: 'Puzzle', nameCn: '益智' },
    { slug: 'racing', name: 'Racing', nameCn: '竞速' },
    { slug: 'animal', name: 'Animal', nameCn: '动物' },
    { slug: 'fun', name: 'Fun', nameCn: '趣味' },
    { slug: 'retro', name: 'Retro', nameCn: '复古' },
    { slug: 'trivia', name: 'Trivia', nameCn: '问答' },
    { slug: 'christmas', name: 'Christmas', nameCn: '圣诞节' },
    { slug: 'runner', name: 'Runner', nameCn: '跑酷' },
    { slug: 'action', name: 'Action', nameCn: '动作' },
    { slug: 'idle', name: 'Idle', nameCn: '放置' },
    { slug: 'parkour', name: 'Parkour', nameCn: '跑酷' },
    { slug: 'robots', name: 'Robots', nameCn: '机器人' },
    { slug: 'golf', name: 'Golf', nameCn: '高尔夫' },
    { slug: 'board', name: 'Board', nameCn: '棋盘' },
    { slug: 'match-3', name: 'Match 3', nameCn: '三消' },
    { slug: 'snake', name: 'Snake', nameCn: '贪吃蛇' },
    { slug: 'platformer', name: 'Platformer', nameCn: '平台' },
    { slug: 'monster', name: 'Monster', nameCn: '怪物' },
    { slug: 'strategy', name: 'Strategy', nameCn: '策略' },
    { slug: 'tanks', name: 'Tanks', nameCn: '坦克' },
    { slug: 'mobile', name: 'Mobile', nameCn: '移动' },
    { slug: 'math', name: 'Math', nameCn: '数学' },
    { slug: 'addictive', name: 'Addictive', nameCn: '上瘾' },
    { slug: 'clicker', name: 'Clicker', nameCn: '点击' },
    { slug: 'casual', name: 'Casual', nameCn: '休闲' },
    { slug: 'io', name: 'Io', nameCn: 'IO游戏' },
    { slug: 'halloween', name: 'Halloween', nameCn: '万圣节' },
    { slug: 'hyper-casual', name: 'Hyper casual', nameCn: '超休闲' },
    { slug: 'war', name: 'War', nameCn: '战争' },
    { slug: 'scary', name: 'Scary', nameCn: '恐怖' },
    { slug: 'skill', name: 'Skill', nameCn: '技能' },
    { slug: 'dinosaur', name: 'Dinosaur', nameCn: '恐龙' },
    { slug: 'first-person-shooter', name: 'First person shooter', nameCn: '第一人称射击' },
    { slug: 'car', name: 'Car', nameCn: '汽车' },
    { slug: 'two-player', name: 'Two player', nameCn: '双人' },
    { slug: 'driving', name: 'Driving', nameCn: '驾驶' },
    { slug: 'dirt-bike', name: 'Dirt bike', nameCn: '越野摩托' },
    { slug: 'flight', name: 'Flight', nameCn: '飞行' },
    { slug: 'survival', name: 'Survival', nameCn: '生存' },
    { slug: 'skibidi-toilet', name: 'Skibidi toilet', nameCn: '马桶人' },
    { slug: 'brain', name: 'Brain', nameCn: '智力' },
    { slug: 'jigsaw-puzzles', name: 'Jigsaw puzzles', nameCn: '拼图' },
    { slug: 'money', name: 'Money', nameCn: '金钱' },
    { slug: 'sniper', name: 'Sniper', nameCn: '狙击' },
    { slug: 'building', name: 'Building', nameCn: '建造' },
    { slug: 'skateboard', name: 'Skateboard', nameCn: '滑板' },
    { slug: 'music', name: 'Music', nameCn: '音乐' },
    { slug: 'battle', name: 'Battle', nameCn: '战斗' },
    { slug: 'cats', name: 'Cats', nameCn: '猫咪' },
    { slug: 'archery', name: 'Archery', nameCn: '射箭' },
    { slug: 'chess', name: 'Chess', nameCn: '国际象棋' },
    { slug: 'horror', name: 'Horror', nameCn: '恐怖' },
    { slug: 'granny', name: 'Granny', nameCn: '奶奶' },
    { slug: 'tap', name: 'Tap', nameCn: '点击' },
    { slug: 'card', name: 'Card', nameCn: '卡牌' },
    { slug: 'fashion', name: 'Fashion', nameCn: '时尚' },
    { slug: 'management', name: 'Management', nameCn: '管理' },
    { slug: 'gangster', name: 'Gangster', nameCn: '黑帮' },
    { slug: 'zombie', name: 'Zombie', nameCn: '僵尸' },
    { slug: 'escape', name: 'Escape', nameCn: '逃脱' },
    { slug: 'tetris', name: 'Tetris', nameCn: '俄罗斯方块' },
    { slug: 'airplane', name: 'Airplane', nameCn: '飞机' },
    { slug: 'hidden-object', name: 'Hidden object', nameCn: '隐藏物品' },
    { slug: 'jewel', name: 'Jewel', nameCn: '宝石' },
    { slug: 'pixel', name: 'Pixel', nameCn: '像素' },
    { slug: 'soccer', name: 'Soccer', nameCn: '足球' },
    { slug: 'coloring', name: 'Coloring', nameCn: '涂色' },
    { slug: 'surgery', name: 'Surgery', nameCn: '手术' },
    { slug: 'spinner', name: 'Spinner', nameCn: '旋转' },
    { slug: 'baseball', name: 'Baseball', nameCn: '棒球' },
    { slug: 'fishing', name: 'Fishing', nameCn: '钓鱼' },
    { slug: 'bowling', name: 'Bowling', nameCn: '保龄球' },
    { slug: 'hunting', name: 'Hunting', nameCn: '狩猎' },
    { slug: 'classics', name: 'Classics', nameCn: '经典' },
    { slug: 'dress-up', name: 'Dress up', nameCn: '换装' },
    { slug: 'minecraft', name: 'Minecraft', nameCn: '我的世界' },
    { slug: 'cooking', name: 'Cooking', nameCn: '烹饪' },
    { slug: 'ninja', name: 'Ninja', nameCn: '忍者' },
    { slug: 'farming', name: 'Farming', nameCn: '农场' },
    { slug: 'bike', name: 'Bike', nameCn: '自行车' },
    { slug: 'mermaid', name: 'Mermaid', nameCn: '美人鱼' },
    { slug: 'games-for-girls', name: 'Games for girls', nameCn: '女孩游戏' },
    { slug: 'multiplayer', name: 'Multiplayer', nameCn: '多人' },
    { slug: 'crazy', name: 'Crazy', nameCn: '疯狂' },
    { slug: 'baby', name: 'Baby', nameCn: '婴儿' },
    { slug: 'hair-salon', name: 'Hair salon', nameCn: '发廊' },
    { slug: 'jumping', name: 'Jumping', nameCn: '跳跃' },
    { slug: 'boxing', name: 'Boxing', nameCn: '拳击' },
    { slug: 'gun', name: 'Gun', nameCn: '枪战' },
    { slug: 'pirates', name: 'Pirates', nameCn: '海盗' },
    { slug: 'tycoon', name: 'Tycoon', nameCn: '大亨' },
    { slug: 'naval', name: 'Naval', nameCn: '海战' },
    { slug: 'rpg', name: 'Rpg', nameCn: '角色扮演' },
    { slug: 'bejeweled', name: 'Bejeweled', nameCn: '宝石迷阵' },
    { slug: 'word', name: 'Word', nameCn: '文字' },
    { slug: 'parking', name: 'Parking', nameCn: '停车' },
    { slug: 'wrestling', name: 'Wrestling', nameCn: '摔跤' },
    { slug: 'worm', name: 'Worm', nameCn: '蠕虫' },
    { slug: 'mining', name: 'Mining', nameCn: '挖矿' },
    { slug: 'battle-royale', name: 'Battle royale', nameCn: '大逃杀' },
    { slug: 'offroad', name: 'Offroad', nameCn: '越野' },
    { slug: 'ninja-turtle', name: 'Ninja turtle', nameCn: '忍者神龟' },
    { slug: 'truck', name: 'Truck', nameCn: '卡车' },
    { slug: 'flash', name: 'Flash', nameCn: 'Flash游戏' },
    { slug: 'princess', name: 'Princess', nameCn: '公主' },
    { slug: 'world-cup', name: 'World cup', nameCn: '世界杯' },
    { slug: 'cricket', name: 'Cricket', nameCn: '板球' },
    { slug: 'drifting', name: 'Drifting', nameCn: '漂移' },
    { slug: 'bubble-shooter', name: 'Bubble shooter', nameCn: '泡泡射击' },
    { slug: 'solitaire', name: 'Solitaire', nameCn: '纸牌' },
    { slug: 'pool', name: 'Pool', nameCn: '台球' },
    { slug: 'mahjong', name: 'Mahjong', nameCn: '麻将' },
    { slug: 'anime', name: 'Anime', nameCn: '动漫' },
    { slug: 'dragons', name: 'Dragons', nameCn: '龙' },
    { slug: 'mario', name: 'Mario', nameCn: '马里奥' },
    { slug: 'mmorpg', name: 'Mmorpg', nameCn: '大型多人在线角色扮演游戏' },
    { slug: 'police', name: 'Police', nameCn: '警察' },
    { slug: 'makeup', name: 'Makeup', nameCn: '化妆' },
    { slug: 'sword', name: 'Sword', nameCn: '剑' },
    { slug: 'checkers', name: 'Checkers', nameCn: '跳棋' },
    { slug: 'restaurant', name: 'Restaurant', nameCn: '餐厅' },
    { slug: 'junior', name: 'Junior', nameCn: '少年' },
    { slug: 'fire-and-water', name: 'Fire and water', nameCn: '冰火人' },
    { slug: 'knight', name: 'Knight', nameCn: '骑士' },
    { slug: 'coding', name: 'Coding', nameCn: '编程' },
    { slug: 'gdevelop', name: 'Gdevelop', nameCn: 'GDevelop游戏' },
    { slug: 'cool', name: 'Cool', nameCn: '酷' },
    { slug: 'horse', name: 'Horse', nameCn: '马' },
    { slug: 'scrabble', name: 'Scrabble', nameCn: '拼字游戏' },
    { slug: 'hockey', name: 'Hockey', nameCn: '曲棍球' },
    { slug: 'piano', name: 'Piano', nameCn: '钢琴' },
    { slug: 'city-building', name: 'City building', nameCn: '城市建设' },
    { slug: 'barbie', name: 'Barbie', nameCn: '芭比' },
    { slug: 'sharks', name: 'Sharks', nameCn: '鲨鱼' },
    { slug: 'open-world', name: 'Open world', nameCn: '开放世界' },
    { slug: 'family', name: 'Family', nameCn: '家庭' },
    { slug: 'helicopter', name: 'Helicopter', nameCn: '直升机' },
  ]

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    await prisma.category.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        description: `Play ${cat.name} games online`,
        metaTitle: `${cat.name} Games - Play Free Online`,
        metaDescription: `Play the best ${cat.name} games online for free. No downloads required!`,
        keywords: `${cat.slug}, ${cat.name.toLowerCase()}, ${cat.name.toLowerCase()} games`,
        sortOrder: i + 1,
        isEnabled: true,
        translations: {
          create: [
            {
              locale: 'zh',
              name: cat.nameCn,
              description: `在线玩${cat.nameCn}游戏`,
              metaTitle: `${cat.nameCn}游戏 - 免费在线玩`,
              metaDescription: `在线免费玩最好的${cat.nameCn}游戏。无需下载！`,
              keywords: `${cat.slug}, ${cat.nameCn}, ${cat.nameCn}游戏`,
            },
          ],
        },
      },
    })

    // 每10个打印一次进度
    if ((i + 1) % 10 === 0) {
      console.log(`   已创建 ${i + 1}/${categories.length} 个分类...`)
    }
  }
  console.log(`   ✅ 完成创建 ${categories.length} 个分类`)

  // ==================== 3. 页面类型数据 ====================
  console.log('\n📄 创建页面类型数据...')

  const pageTypes = [
    {
      slug: 'most-played',
      type: 'GAME_LIST',
      icon: '🔥',
      isEnabled: true,
      sortOrder: 1,
      title: 'Most Played Games',
      description: 'The most popular games played by our community',
      metaTitle: 'Most Played Games - Popular Online Games',
      metaDescription: 'Play the most popular games loved by millions of players worldwide!',
      keywords: 'most played games, popular games, trending games',
      pageInfo: {
        gameList: {
          filters: {},
          orderBy: 'playCount',
          orderDirection: 'desc',
          pageSize: 24,
        },
        content: {
          detailedDescription: 'Explore our collection of most played games, loved by millions of players worldwide. These games have proven their excellence through consistent player engagement and positive feedback. From action-packed adventures to brain-teasing puzzles, find your next favorite game here.',
          features: [
            { icon: '🔥', text: 'Community Favorites' },
            { icon: '🎮', text: 'High Player Count' },
            { icon: '⭐', text: 'Proven Quality' },
            { icon: '🌍', text: 'Global Appeal' },
          ],
          summary: 'These most played games represent the best of what our platform has to offer. Join millions of players worldwide and discover why these games have captured the hearts of our community. Updated regularly based on real-time play statistics.',
        },
      },
      translations: {
        create: [
          {
            locale: 'zh',
            title: '最多人游玩',
            description: '我们社区中最受欢迎的游戏',
            metaTitle: '最多人游玩的游戏 - 热门在线游戏',
            metaDescription: '玩全球数百万玩家喜爱的最热门游戏！',
            keywords: '最多人玩,热门游戏,流行游戏',
            pageInfo: {
              gameList: {
                filters: {},
                orderBy: 'playCount',
                orderDirection: 'desc',
                pageSize: 24,
              },
              content: {
                detailedDescription: '探索全球数百万玩家喜爱的最热门游戏合集。这些游戏通过持续的玩家参与度和积极反馈证明了它们的卓越品质。从动作冒险到益智解谜，在这里找到你的下一个最爱游戏。',
                features: [
                  { icon: '🔥', text: '社区最爱' },
                  { icon: '🎮', text: '高人气游戏' },
                  { icon: '⭐', text: '品质保证' },
                  { icon: '🌍', text: '全球流行' },
                ],
                summary: '这些最多人游玩的游戏代表了我们平台的精华。加入全球数百万玩家，发现为什么这些游戏能够俘获我们社区的心。基于实时游玩数据定期更新。',
              },
            },
          },
        ],
      },
    },
    {
      slug: 'new-games',
      type: 'GAME_LIST',
      icon: '🆕',
      isEnabled: true,
      sortOrder: 2,
      title: 'New Games',
      description: 'Latest games added to our collection',
      metaTitle: 'New Games - Latest Online Games',
      metaDescription: 'Check out the newest games added to our platform. Fresh content updated daily!',
      keywords: 'new games, latest games, recent games',
      pageInfo: {
        gameList: {
          filters: {},
          orderBy: 'createdAt',
          orderDirection: 'desc',
          pageSize: 24,
        },
        content: {
          detailedDescription: 'Discover the latest games freshly added to our collection. Be among the first to experience new adventures, innovative gameplay, and exciting challenges. Our platform is constantly updated with fresh content to keep your gaming experience exciting and new.',
          features: [
            { icon: '🆕', text: 'Recently Added' },
            { icon: '🎯', text: 'Fresh Content' },
            { icon: '🚀', text: 'Be the First' },
            { icon: '📅', text: 'Daily Updates' },
          ],
          summary: 'Stay ahead of the curve with our newest game additions. Updated daily to bring you the freshest gaming content from around the world. Don\'t miss out on discovering your next favorite game before everyone else!',
        },
      },
      translations: {
        create: [
          {
            locale: 'zh',
            title: '最新游戏',
            description: '最新添加到我们收藏的游戏',
            metaTitle: '最新游戏 - 最新在线游戏',
            metaDescription: '查看我们平台上最新添加的游戏。每天更新新内容！',
            keywords: '新游戏,最新游戏,最近游戏',
            pageInfo: {
              gameList: {
                filters: {},
                orderBy: 'createdAt',
                orderDirection: 'desc',
                pageSize: 24,
              },
              content: {
                detailedDescription: '发现最新添加到我们合集的游戏。抢先体验新冒险、创新玩法和激动人心的挑战。我们的平台持续更新新内容，让您的游戏体验始终充满新鲜感。',
                features: [
                  { icon: '🆕', text: '最新上架' },
                  { icon: '🎯', text: '新鲜内容' },
                  { icon: '🚀', text: '抢先体验' },
                  { icon: '📅', text: '每日更新' },
                ],
                summary: '领先一步体验我们最新的游戏。每日更新，为您带来来自世界各地最新鲜的游戏内容。不要错过在其他人之前发现您的下一个最爱游戏！',
              },
            },
          },
        ],
      },
    },
    {
      slug: 'featured',
      type: 'GAME_LIST',
      icon: '⭐',
      isEnabled: true,
      sortOrder: 3,
      title: 'Featured Games',
      description: 'Hand-picked games selected by our editors',
      metaTitle: 'Featured Games - Editor\'s Choice',
      metaDescription: 'Play our featured games - carefully selected by our team for the best gaming experience.',
      keywords: 'featured games, editor\'s choice, best games',
      pageInfo: {
        gameList: {
          filters: {
            isFeatured: true,
          },
          orderBy: 'rating',
          orderDirection: 'desc',
          pageSize: 24,
        },
        content: {
          detailedDescription: 'Experience hand-picked excellence with our featured games collection. Each game is carefully selected by our editorial team based on gameplay quality, innovation, and overall entertainment value. These are the games that define what great gaming should be.',
          features: [
            { icon: '⭐', text: 'Editor\'s Choice' },
            { icon: '🎨', text: 'Premium Quality' },
            { icon: '🏆', text: 'Award Winners' },
            { icon: '✨', text: 'Exceptional Gameplay' },
          ],
          summary: 'Our featured games represent the pinnacle of online gaming. Handpicked by experts who understand what makes a game truly exceptional. Each title offers a unique and memorable gaming experience worth your time.',
        },
      },
      translations: {
        create: [
          {
            locale: 'zh',
            title: '精选游戏',
            description: '由我们编辑精心挑选的游戏',
            metaTitle: '精选游戏 - 编辑推荐',
            metaDescription: '玩我们的精选游戏 - 由我们的团队精心挑选，提供最佳游戏体验。',
            keywords: '精选游戏,编辑推荐,最佳游戏',
            pageInfo: {
              gameList: {
                filters: {
                  isFeatured: true,
                },
                orderBy: 'rating',
                orderDirection: 'desc',
                pageSize: 24,
              },
              content: {
                detailedDescription: '体验编辑精心挑选的卓越游戏合集。每款游戏都是由我们的编辑团队根据游戏品质、创新性和整体娱乐价值精心挑选。这些游戏定义了优秀游戏的标准。',
                features: [
                  { icon: '⭐', text: '编辑之选' },
                  { icon: '🎨', text: '高端品质' },
                  { icon: '🏆', text: '获奖作品' },
                  { icon: '✨', text: '卓越体验' },
                ],
                summary: '我们的精选游戏代表了在线游戏的巅峰。由了解什么是真正卓越游戏的专家精心挑选。每款游戏都提供独特且难忘的游戏体验，值得您花时间体验。',
              },
            },
          },
        ],
      },
    },
    {
      slug: 'trending',
      type: 'GAME_LIST',
      icon: '📈',
      isEnabled: true,
      sortOrder: 4,
      title: 'Trending Games',
      description: 'Games that are trending right now',
      metaTitle: 'Trending Games - What\'s Hot Now',
      metaDescription: 'Discover the hottest trending games that everyone is playing right now!',
      keywords: 'trending games, hot games, popular now',
      pageInfo: {
        gameList: {
          filters: {},
          orderBy: 'rating',
          orderDirection: 'desc',
          pageSize: 24,
        },
        content: {
          detailedDescription: 'Jump into the action with games that are trending right now. These are the titles everyone is talking about and playing today. Stay current with gaming trends and join the community in experiencing what\'s hot in the gaming world.',
          features: [
            { icon: '📈', text: 'Currently Trending' },
            { icon: '🔥', text: 'Hot Right Now' },
            { icon: '💬', text: 'Community Buzz' },
            { icon: '⚡', text: 'Viral Favorites' },
          ],
          summary: 'Don\'t miss out on what\'s trending in gaming. These games are capturing the attention of players worldwide and creating buzz in the gaming community. Join the trend and see what everyone is excited about!',
        },
      },
      translations: {
        create: [
          {
            locale: 'zh',
            title: '趋势游戏',
            description: '当前正在流行的游戏',
            metaTitle: '趋势游戏 - 当前热门',
            metaDescription: '发现当前每个人都在玩的最热门趋势游戏！',
            keywords: '趋势游戏,热门游戏,当前流行',
            pageInfo: {
              gameList: {
                filters: {},
                orderBy: 'rating',
                orderDirection: 'desc',
                pageSize: 24,
              },
              content: {
                detailedDescription: '投入当前正在流行的游戏行动中。这些是当今每个人都在谈论和游玩的游戏。紧跟游戏潮流，加入社区一起体验游戏世界的热门内容。',
                features: [
                  { icon: '📈', text: '当前趋势' },
                  { icon: '🔥', text: '热门榜首' },
                  { icon: '💬', text: '社区热议' },
                  { icon: '⚡', text: '病毒式流行' },
                ],
                summary: '不要错过游戏界的流行趋势。这些游戏正在吸引全球玩家的注意力，并在游戏社区中引发热议。加入潮流，看看大家都在为什么兴奋！',
              },
            },
          },
        ],
      },
    },
  ]

  for (const page of pageTypes) {
    await prisma.pageType.create({
      data: page,
    })
    console.log(`   ✓ ${page.title} (${page.slug})`)
  }

  console.log('\n✅ 数据库填充完成！')
  console.log('\n📊 创建的数据：')
  console.log(`   - 语言: ${languages.length} 个`)
  console.log(`   - 管理员: 1 个`)
  console.log(`   - 导入平台: ${platforms.length} 个`)
  console.log(`   - 分类: ${categories.length} 个`)
  console.log(`   - 页面类型: ${pageTypes.length} 个`)
}

main()
  .catch((e) => {
    console.error('❌ 填充数据库时出错：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
