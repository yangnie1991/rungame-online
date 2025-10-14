import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 分类数据（包含英文和中文翻译）
const categoriesData = [
  {
    slug: 'puzzle',
    icon: '🧩',
    en: {
      name: 'Puzzle',
      description: 'Challenge your mind with brain-teasing puzzle games',
      metaTitle: 'Puzzle Games - Play Free Online Brain Teasers',
      metaDescription: 'Test your problem-solving skills with our collection of puzzle games. From logic puzzles to brain teasers, find the perfect challenge.',
    },
    zh: {
      name: '益智游戏',
      description: '挑战你的智力，玩转各种烧脑益智游戏',
      metaTitle: '益智游戏 - 免费在线玩智力游戏',
      metaDescription: '通过我们的益智游戏合集测试你的解决问题能力。从逻辑谜题到脑筋急转弯，找到完美的挑战。',
    },
  },
  {
    slug: 'casual',
    icon: '🎮',
    en: {
      name: 'Casual',
      description: 'Easy to play, fun casual games for everyone',
      metaTitle: 'Casual Games - Free & Fun Online Games',
      metaDescription: 'Enjoy relaxing casual games perfect for quick breaks. Simple, fun, and addictive gameplay for all ages.',
    },
    zh: {
      name: '休闲游戏',
      description: '简单有趣，适合所有人的休闲游戏',
      metaTitle: '休闲游戏 - 免费好玩的在线游戏',
      metaDescription: '享受轻松的休闲游戏，非常适合快速休息。简单、有趣、令人上瘾的游戏玩法，适合所有年龄段。',
    },
  },
  {
    slug: 'match-3',
    icon: '💎',
    en: {
      name: 'Match-3',
      description: 'Classic match-3 puzzle games with colorful gems',
      metaTitle: 'Match-3 Games - Free Gem Matching Puzzles',
      metaDescription: 'Play addictive match-3 games online. Match colorful gems, candies, and jewels in hundreds of challenging levels.',
    },
    zh: {
      name: '三消游戏',
      description: '经典的三消益智游戏，色彩缤纷的宝石',
      metaTitle: '三消游戏 - 免费宝石匹配益智游戏',
      metaDescription: '在线玩令人上瘾的三消游戏。在数百个充满挑战的关卡中匹配彩色宝石、糖果和珠宝。',
    },
  },
  {
    slug: 'dress-up',
    icon: '👗',
    en: {
      name: 'Dress-up',
      description: 'Fashion and styling games for creative minds',
      metaTitle: 'Dress-up Games - Fashion & Styling Fun',
      metaDescription: 'Express your style with dress-up games. Create fashionable outfits, style characters, and become a fashion designer.',
    },
    zh: {
      name: '换装游戏',
      description: '时尚造型游戏，发挥你的创意',
      metaTitle: '换装游戏 - 时尚造型趣味游戏',
      metaDescription: '通过换装游戏展现你的风格。创建时尚服装，为角色造型，成为时尚设计师。',
    },
  },
  {
    slug: 'mahjong-connect',
    icon: '🀄',
    en: {
      name: 'Mahjong & Connect',
      description: 'Traditional mahjong and tile matching games',
      metaTitle: 'Mahjong & Connect Games - Free Tile Matching',
      metaDescription: 'Play classic mahjong solitaire and connect games. Match tiles, clear boards, and relax with these timeless puzzles.',
    },
    zh: {
      name: '麻将连连看',
      description: '传统麻将和图块匹配游戏',
      metaTitle: '麻将连连看游戏 - 免费图块匹配',
      metaDescription: '玩经典的麻将接龙和连连看游戏。匹配图块，清除棋盘，享受这些永恒的益智游戏。',
    },
  },
  {
    slug: 'agility',
    icon: '⚡',
    en: {
      name: 'Agility',
      description: 'Fast-paced action games testing your reflexes',
      metaTitle: 'Agility Games - Test Your Reflexes',
      metaDescription: 'Challenge your reflexes with fast-paced agility games. Quick thinking and lightning-fast reactions required.',
    },
    zh: {
      name: '敏捷游戏',
      description: '快节奏动作游戏，测试你的反应力',
      metaTitle: '敏捷游戏 - 测试你的反应速度',
      metaDescription: '通过快节奏的敏捷游戏挑战你的反应能力。需要快速思考和闪电般的反应。',
    },
  },
  {
    slug: 'racing-driving',
    icon: '🏎️',
    en: {
      name: 'Racing & Driving',
      description: 'High-speed racing and driving simulation games',
      metaTitle: 'Racing & Driving Games - Free Online Racing',
      metaDescription: 'Feel the speed with racing and driving games. From formula racing to drift challenges, burn rubber on virtual tracks.',
    },
    zh: {
      name: '赛车游戏',
      description: '高速赛车和驾驶模拟游戏',
      metaTitle: '赛车游戏 - 免费在线竞速游戏',
      metaDescription: '通过赛车和驾驶游戏感受速度。从方程式赛车到漂移挑战，在虚拟赛道上燃烧橡胶。',
    },
  },
  {
    slug: 'adventure',
    icon: '🗺️',
    en: {
      name: 'Adventure',
      description: 'Epic adventures and exploration games',
      metaTitle: 'Adventure Games - Epic Quests & Exploration',
      metaDescription: 'Embark on epic adventures. Explore new worlds, solve mysteries, and become a hero in these thrilling games.',
    },
    zh: {
      name: '冒险游戏',
      description: '史诗般的冒险和探索游戏',
      metaTitle: '冒险游戏 - 史诗任务与探索',
      metaDescription: '开启史诗般的冒险。探索新世界，解开谜团，在这些惊险刺激的游戏中成为英雄。',
    },
  },
  {
    slug: 'cards',
    icon: '🃏',
    en: {
      name: 'Cards',
      description: 'Classic card games and solitaire collections',
      metaTitle: 'Card Games - Free Solitaire & Card Classics',
      metaDescription: 'Play classic card games online. Enjoy solitaire, poker, and other timeless card game favorites.',
    },
    zh: {
      name: '纸牌游戏',
      description: '经典纸牌游戏和接龙合集',
      metaTitle: '纸牌游戏 - 免费接龙与经典纸牌',
      metaDescription: '在线玩经典纸牌游戏。享受接龙、扑克和其他永恒的纸牌游戏最爱。',
    },
  },
  {
    slug: 'simulation',
    icon: '🎭',
    en: {
      name: 'Simulation',
      description: 'Realistic simulation and life management games',
      metaTitle: 'Simulation Games - Life & Management Sims',
      metaDescription: 'Experience realistic simulations. Manage cities, farms, businesses, and live virtual lives in detailed simulation games.',
    },
    zh: {
      name: '模拟游戏',
      description: '真实的模拟和生活管理游戏',
      metaTitle: '模拟游戏 - 生活与管理模拟',
      metaDescription: '体验真实的模拟。管理城市、农场、企业，在详细的模拟游戏中过虚拟生活。',
    },
  },
  {
    slug: 'shooter',
    icon: '🎯',
    en: {
      name: 'Shooter',
      description: 'Action-packed shooting and combat games',
      metaTitle: 'Shooter Games - Action Combat & Shooting',
      metaDescription: 'Lock and load with intense shooter games. From first-person shooters to arcade blasters, test your aim.',
    },
    zh: {
      name: '射击游戏',
      description: '充满动作的射击和战斗游戏',
      metaTitle: '射击游戏 - 动作战斗与射击',
      metaDescription: '在激烈的射击游戏中上膛开火。从第一人称射击到街机射击，测试你的瞄准能力。',
    },
  },
  {
    slug: 'strategy',
    icon: '♟️',
    en: {
      name: 'Strategy',
      description: 'Tactical strategy and planning games',
      metaTitle: 'Strategy Games - Tactical Planning & War Games',
      metaDescription: 'Outsmart opponents with strategy games. Plan, build, and conquer in tactical battles and strategic challenges.',
    },
    zh: {
      name: '策略游戏',
      description: '战术策略和规划游戏',
      metaTitle: '策略游戏 - 战术规划与战争游戏',
      metaDescription: '通过策略游戏智胜对手。在战术战斗和战略挑战中规划、建设和征服。',
    },
  },
  {
    slug: 'bubble-shooter',
    icon: '🫧',
    en: {
      name: 'Bubble Shooter',
      description: 'Pop colorful bubbles in classic shooter games',
      metaTitle: 'Bubble Shooter Games - Free Bubble Pop Fun',
      metaDescription: 'Pop bubbles and clear boards in addictive bubble shooter games. Match colors and create satisfying bubble bursts.',
    },
    zh: {
      name: '泡泡射击',
      description: '在经典射击游戏中消除彩色泡泡',
      metaTitle: '泡泡射击游戏 - 免费泡泡消除趣味',
      metaDescription: '在令人上瘾的泡泡射击游戏中消除泡泡和清除棋盘。匹配颜色，创造令人满意的泡泡爆破。',
    },
  },
  {
    slug: 'boardgames',
    icon: '🎲',
    en: {
      name: 'Boardgames',
      description: 'Classic board games and tabletop favorites',
      metaTitle: 'Board Games - Classic Tabletop Games Online',
      metaDescription: 'Play beloved board games online. From chess to checkers, enjoy digital versions of classic tabletop games.',
    },
    zh: {
      name: '棋盘游戏',
      description: '经典棋盘游戏和桌面游戏最爱',
      metaTitle: '棋盘游戏 - 在线经典桌面游戏',
      metaDescription: '在线玩心爱的棋盘游戏。从国际象棋到跳棋，享受经典桌面游戏的数字版本。',
    },
  },
  {
    slug: 'battle',
    icon: '⚔️',
    en: {
      name: 'Battle',
      description: 'Intense combat and multiplayer battle games',
      metaTitle: 'Battle Games - Multiplayer Combat Action',
      metaDescription: 'Engage in epic battles. Fight opponents, lead armies, and dominate the battlefield in thrilling combat games.',
    },
    zh: {
      name: '战斗游戏',
      description: '激烈的战斗和多人对战游戏',
      metaTitle: '战斗游戏 - 多人战斗动作',
      metaDescription: '参与史诗般的战斗。在惊险的战斗游戏中对抗对手，率领军队，统治战场。',
    },
  },
  {
    slug: 'sports',
    icon: '⚽',
    en: {
      name: 'Sports',
      description: 'Athletic sports games and competitions',
      metaTitle: 'Sports Games - Play Online Sports & Athletics',
      metaDescription: 'Play your favorite sports online. From soccer to tennis, compete in realistic sports simulations.',
    },
    zh: {
      name: '体育游戏',
      description: '竞技体育游戏和比赛',
      metaTitle: '体育游戏 - 在线玩体育竞技游戏',
      metaDescription: '在线玩你最喜欢的体育项目。从足球到网球，在真实的体育模拟中竞技。',
    },
  },
  {
    slug: 'football',
    icon: '🏈',
    en: {
      name: 'Football',
      description: 'Soccer and football games for sports fans',
      metaTitle: 'Football Games - Play Soccer & Football Online',
      metaDescription: 'Score goals in exciting football games. Manage teams, take penalties, and become a football champion.',
    },
    zh: {
      name: '足球游戏',
      description: '为体育迷准备的足球游戏',
      metaTitle: '足球游戏 - 在线玩足球游戏',
      metaDescription: '在激动人心的足球游戏中进球。管理球队，罚点球，成为足球冠军。',
    },
  },
  {
    slug: 'merge',
    icon: '🔀',
    en: {
      name: 'Merge',
      description: 'Combine and merge items to create new ones',
      metaTitle: 'Merge Games - Combine & Build Games',
      metaDescription: 'Merge items and build empires. Combine objects, unlock new items, and grow in satisfying merge games.',
    },
    zh: {
      name: '合并游戏',
      description: '组合和合并物品创造新物品',
      metaTitle: '合并游戏 - 组合与建造游戏',
      metaDescription: '合并物品并建立帝国。组合对象，解锁新物品，在令人满意的合并游戏中成长。',
    },
  },
  {
    slug: 'io',
    icon: '🌐',
    en: {
      name: '.IO',
      description: 'Multiplayer .io games with competitive gameplay',
      metaTitle: '.IO Games - Multiplayer Browser Games',
      metaDescription: 'Join the .io phenomenon. Play addictive multiplayer games, grow bigger, and dominate the leaderboard.',
    },
    zh: {
      name: '.IO游戏',
      description: '竞技玩法的多人.io游戏',
      metaTitle: '.IO游戏 - 多人浏览器游戏',
      metaDescription: '加入.io热潮。玩令人上瘾的多人游戏，变得更大，统治排行榜。',
    },
  },
  {
    slug: 'art',
    icon: '🎨',
    en: {
      name: 'Art',
      description: 'Creative art, drawing, and coloring games',
      metaTitle: 'Art Games - Drawing & Creative Games',
      metaDescription: 'Express your creativity with art games. Draw, paint, color, and create beautiful artwork online.',
    },
    zh: {
      name: '艺术游戏',
      description: '创意艺术、绘画和涂色游戏',
      metaTitle: '艺术游戏 - 绘画与创意游戏',
      metaDescription: '通过艺术游戏表达你的创造力。在线绘画、着色和创作美丽的艺术作品。',
    },
  },
  {
    slug: 'educational',
    icon: '📚',
    en: {
      name: 'Educational',
      description: 'Learn while playing educational games',
      metaTitle: 'Educational Games - Learning Through Play',
      metaDescription: 'Learn and have fun with educational games. Improve skills in math, language, science, and more while playing.',
    },
    zh: {
      name: '教育游戏',
      description: '在玩教育游戏的同时学习',
      metaTitle: '教育游戏 - 通过游戏学习',
      metaDescription: '通过教育游戏学习和娱乐。在玩游戏的同时提高数学、语言、科学等技能。',
    },
  },
  {
    slug: 'basketball',
    icon: '🏀',
    en: {
      name: 'Basketball',
      description: 'Shoot hoops in exciting basketball games',
      metaTitle: 'Basketball Games - Play Hoops Online',
      metaDescription: 'Experience the thrill of basketball. Shoot three-pointers, dunk, and compete in basketball tournaments.',
    },
    zh: {
      name: '篮球游戏',
      description: '在激动人心的篮球游戏中投篮',
      metaTitle: '篮球游戏 - 在线打篮球',
      metaDescription: '体验篮球的刺激。投三分球，扣篮，在篮球锦标赛中竞争。',
    },
  },
  {
    slug: 'cooking',
    icon: '🍳',
    en: {
      name: 'Cooking',
      description: 'Cook delicious dishes in fun cooking games',
      metaTitle: 'Cooking Games - Virtual Kitchen & Chef Games',
      metaDescription: 'Become a master chef with cooking games. Prepare recipes, manage restaurants, and serve delicious dishes.',
    },
    zh: {
      name: '烹饪游戏',
      description: '在有趣的烹饪游戏中制作美味菜肴',
      metaTitle: '烹饪游戏 - 虚拟厨房与厨师游戏',
      metaDescription: '通过烹饪游戏成为大厨。准备食谱，管理餐厅，提供美味佳肴。',
    },
  },
  {
    slug: 'care',
    icon: '💝',
    en: {
      name: 'Care',
      description: 'Nurture and care for pets and characters',
      metaTitle: 'Care Games - Pet & Character Care Games',
      metaDescription: 'Show your caring side. Take care of pets, babies, and characters in heartwarming care games.',
    },
    zh: {
      name: '照顾游戏',
      description: '照顾和养育宠物与角色',
      metaTitle: '照顾游戏 - 宠物与角色护理游戏',
      metaDescription: '展现你的关怀之心。在温馨的照顾游戏中照料宠物、婴儿和角色。',
    },
  },
  {
    slug: 'quiz',
    icon: '❓',
    en: {
      name: 'Quiz',
      description: 'Test your knowledge with trivia quizzes',
      metaTitle: 'Quiz Games - Trivia & Knowledge Tests',
      metaDescription: 'Challenge your knowledge with quiz games. Answer trivia questions, learn facts, and become a quiz master.',
    },
    zh: {
      name: '问答游戏',
      description: '通过趣味问答测试你的知识',
      metaTitle: '问答游戏 - 趣味知识测试',
      metaDescription: '通过问答游戏挑战你的知识。回答趣味问题，学习事实，成为问答大师。',
    },
  },
  {
    slug: 'jigsaw',
    icon: '🧩',
    en: {
      name: 'Jigsaw',
      description: 'Relax with beautiful jigsaw puzzle games',
      metaTitle: 'Jigsaw Puzzle Games - Relaxing Puzzles Online',
      metaDescription: 'Piece together beautiful jigsaw puzzles. Choose from hundreds of images and difficulty levels.',
    },
    zh: {
      name: '拼图游戏',
      description: '在美丽的拼图游戏中放松',
      metaTitle: '拼图游戏 - 在线放松拼图',
      metaDescription: '拼凑美丽的拼图。从数百张图片和难度级别中选择。',
    },
  },
]

async function main() {
  console.log('开始种子数据...')

  // 1. 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@rungame.online' },
    update: {},
    create: {
      email: 'admin@rungame.online',
      password: hashedPassword,
      name: '超级管理员',
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✅ 创建管理员用户:', admin.email)

  // 2. 创建语言数据（包含所有语言的中文名称）
  const languages = [
    {
      code: 'en',
      name: 'English',
      nameCn: '英语',
      nativeName: 'English',
      flag: '🇬🇧',
      localeCode: 'en-US',
      isDefault: true,
      isEnabled: true,
      sortOrder: 1,
    },
    {
      code: 'zh',
      name: 'Chinese',
      nameCn: '中文',
      nativeName: '中文',
      flag: '🇨🇳',
      localeCode: 'zh-CN',
      isEnabled: true,
      sortOrder: 2,
    },
    {
      code: 'es',
      name: 'Spanish',
      nameCn: '西班牙语',
      nativeName: 'Español',
      flag: '🇪🇸',
      localeCode: 'es-ES',
      isEnabled: false,
      sortOrder: 3,
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nameCn: '葡萄牙语',
      nativeName: 'Português',
      flag: '🇧🇷',
      localeCode: 'pt-BR',
      isEnabled: false,
      sortOrder: 4,
    },
    {
      code: 'fr',
      name: 'French',
      nameCn: '法语',
      nativeName: 'Français',
      flag: '🇫🇷',
      localeCode: 'fr-FR',
      isEnabled: false,
      sortOrder: 5,
    },
    {
      code: 'de',
      name: 'German',
      nameCn: '德语',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      localeCode: 'de-DE',
      isEnabled: false,
      sortOrder: 6,
    },
    {
      code: 'ja',
      name: 'Japanese',
      nameCn: '日语',
      nativeName: '日本語',
      flag: '🇯🇵',
      localeCode: 'ja-JP',
      isEnabled: false,
      sortOrder: 7,
    },
    {
      code: 'ko',
      name: 'Korean',
      nameCn: '韩语',
      nativeName: '한국어',
      flag: '🇰🇷',
      localeCode: 'ko-KR',
      isEnabled: false,
      sortOrder: 8,
    },
    {
      code: 'ar',
      name: 'Arabic',
      nameCn: '阿拉伯语',
      nativeName: 'العربية',
      flag: '🇸🇦',
      localeCode: 'ar-SA',
      isEnabled: false,
      sortOrder: 9,
      direction: 'rtl',
    },
    {
      code: 'ru',
      name: 'Russian',
      nameCn: '俄语',
      nativeName: 'Русский',
      flag: '🇷🇺',
      localeCode: 'ru-RU',
      isEnabled: false,
      sortOrder: 10,
    },
    {
      code: 'it',
      name: 'Italian',
      nameCn: '意大利语',
      nativeName: 'Italiano',
      flag: '🇮🇹',
      localeCode: 'it-IT',
      isEnabled: false,
      sortOrder: 11,
    },
    {
      code: 'nl',
      name: 'Dutch',
      nameCn: '荷兰语',
      nativeName: 'Nederlands',
      flag: '🇳🇱',
      localeCode: 'nl-NL',
      isEnabled: false,
      sortOrder: 12,
    },
    {
      code: 'tr',
      name: 'Turkish',
      nameCn: '土耳其语',
      nativeName: 'Türkçe',
      flag: '🇹🇷',
      localeCode: 'tr-TR',
      isEnabled: false,
      sortOrder: 13,
    },
    {
      code: 'pl',
      name: 'Polish',
      nameCn: '波兰语',
      nativeName: 'Polski',
      flag: '🇵🇱',
      localeCode: 'pl-PL',
      isEnabled: false,
      sortOrder: 14,
    },
    {
      code: 'vi',
      name: 'Vietnamese',
      nameCn: '越南语',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      localeCode: 'vi-VN',
      isEnabled: false,
      sortOrder: 15,
    },
  ]

  for (const lang of languages) {
    const languageData = {
      code: lang.code,
      name: lang.name,
      nameCn: lang.nameCn,
      nativeName: lang.nativeName,
      flag: lang.flag,
      localeCode: lang.localeCode,
      isDefault: lang.isDefault || false,
      isEnabled: lang.isEnabled !== undefined ? lang.isEnabled : true,
      sortOrder: lang.sortOrder,
      direction: lang.direction || 'ltr',
    }

    await prisma.language.upsert({
      where: { code: lang.code },
      update: languageData,
      create: languageData,
    })
    console.log(`✅ 创建/更新语言: ${lang.name} / ${lang.nameCn}`)
  }

  // 3. 数据库重置选项
  // ==========================================
  // 设置为 true：清空所有游戏、标签、分类数据，然后重新创建（⚠️ 危险操作！）
  // 设置为 false：保留现有数据，仅更新或创建新的分类数据（推荐）
  // ==========================================
  const RESET_DATABASE = false

  if (RESET_DATABASE) {
    console.log('\n⚠️  警告：即将清空所有游戏和分类数据...')

    // 清空游戏相关数据
    console.log('\n清空游戏数据...')
    const deletedGameViews = await prisma.gameView.deleteMany({})
    const deletedGameTags = await prisma.gameTag.deleteMany({})
    const deletedGameTranslations = await prisma.gameTranslation.deleteMany({})
    const deletedGames = await prisma.game.deleteMany({})
    console.log(`✅ 已删除:`)
    console.log(`   - ${deletedGames.count} 个游戏`)
    console.log(`   - ${deletedGameTranslations.count} 条游戏翻译`)
    console.log(`   - ${deletedGameTags.count} 条游戏标签关联`)
    console.log(`   - ${deletedGameViews.count} 条游戏浏览记录`)

    // 清空标签数据
    console.log('\n清空标签数据...')
    const deletedTagTranslations = await prisma.tagTranslation.deleteMany({})
    const deletedTags = await prisma.tag.deleteMany({})
    console.log(`✅ 已删除:`)
    console.log(`   - ${deletedTags.count} 个标签`)
    console.log(`   - ${deletedTagTranslations.count} 条标签翻译`)

    // 清空分类数据
    console.log('\n清空分类数据...')
    const deletedCategoryTranslations = await prisma.categoryTranslation.deleteMany({})
    const deletedCategories = await prisma.category.deleteMany({})
    console.log(`✅ 已删除:`)
    console.log(`   - ${deletedCategories.count} 个分类`)
    console.log(`   - ${deletedCategoryTranslations.count} 条分类翻译`)
  } else {
    console.log('\n⏭️  跳过清空数据（RESET_DATABASE = false）')
  }

  // 4. 创建分类数据（包含英文和中文翻译）
  console.log('\n开始创建/更新分类数据...')

  // 创建或更新分类
  for (let i = 0; i < categoriesData.length; i++) {
    const categoryData = categoriesData[i]

    // 根据 RESET_DATABASE 决定使用 create 或 upsert
    const category = RESET_DATABASE
      ? await prisma.category.create({
          data: {
            slug: categoryData.slug,
            icon: categoryData.icon,
            sortOrder: i + 1,
            isEnabled: true,
          },
        })
      : await prisma.category.upsert({
          where: { slug: categoryData.slug },
          update: {
            icon: categoryData.icon,
            sortOrder: i + 1,
            isEnabled: true,
          },
          create: {
            slug: categoryData.slug,
            icon: categoryData.icon,
            sortOrder: i + 1,
            isEnabled: true,
          },
        })

    // 创建或更新英文翻译
    if (RESET_DATABASE) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          locale: 'en',
          name: categoryData.en.name,
          description: categoryData.en.description,
          metaTitle: categoryData.en.metaTitle,
          metaDescription: categoryData.en.metaDescription,
        },
      })
    } else {
      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: category.id,
            locale: 'en',
          },
        },
        update: {
          name: categoryData.en.name,
          description: categoryData.en.description,
          metaTitle: categoryData.en.metaTitle,
          metaDescription: categoryData.en.metaDescription,
        },
        create: {
          categoryId: category.id,
          locale: 'en',
          name: categoryData.en.name,
          description: categoryData.en.description,
          metaTitle: categoryData.en.metaTitle,
          metaDescription: categoryData.en.metaDescription,
        },
      })
    }

    // 创建或更新中文翻译
    if (RESET_DATABASE) {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          locale: 'zh',
          name: categoryData.zh.name,
          description: categoryData.zh.description,
          metaTitle: categoryData.zh.metaTitle,
          metaDescription: categoryData.zh.metaDescription,
        },
      })
    } else {
      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: category.id,
            locale: 'zh',
          },
        },
        update: {
          name: categoryData.zh.name,
          description: categoryData.zh.description,
          metaTitle: categoryData.zh.metaTitle,
          metaDescription: categoryData.zh.metaDescription,
        },
        create: {
          categoryId: category.id,
          locale: 'zh',
          name: categoryData.zh.name,
          description: categoryData.zh.description,
          metaTitle: categoryData.zh.metaTitle,
          metaDescription: categoryData.zh.metaDescription,
        },
      })
    }

    const action = RESET_DATABASE ? '创建' : '创建/更新'
    console.log(`✅ ${action}分类: ${categoryData.en.name} / ${categoryData.zh.name}`)
  }

  console.log(`\n✅ 成功创建 ${categoriesData.length} 个分类（英文+中文翻译）`)

  // 5. 创建游戏种子数据
  console.log('\n开始创建游戏种子数据...')

  // 游戏数据（来自GameDistribution网站）
  const gamesData = [
    {
      gameId: 'a8870b5a6a76492db5cb8ca599f64843',
      slug: 'math-runner',
      category: 'casual',
      tags: ['kidgames', 'math', 'roblox', 'runner', 'speedrun'],
      width: 800,
      height: 600,
      en: {
        title: 'Math Runner',
        description: 'Challenge your mind and reflexes in this fast-paced arithmetic adventure! Solve math problems on the run, dodge obstacles, and race against time.',
        instructions: 'Solve math problems while running, choose correct paths, collect rewards, and aim for high scores.',
      },
      zh: {
        title: '数学跑酷',
        description: '在这个快节奏的算术冒险中挑战你的思维和反应！边跑边解数学题，躲避障碍物，与时间赛跑。',
        instructions: '边跑边解决数学问题，选择正确的路径，收集奖励，争取高分。',
      },
    },
    {
      gameId: 'c11581c478694906b1246632b264dff1',
      slug: 'bubble-shooter-witch-tower-2',
      category: 'bubble-shooter',
      tags: ['bubble', 'colorful', 'halloween', 'witch'],
      width: 800,
      height: 600,
      en: {
        title: 'Bubble Shooter Witch Tower 2',
        description: 'Bubble Shooter: Witch Tower 2 brings back the magic in a fun, family-friendly way! Pop colorful bubbles, unlock cozy enchanted rooms...',
        instructions: 'Drag to aim and shoot bubbles. Match 3 or more of the same color to pop them.',
      },
      zh: {
        title: '女巫塔泡泡射击2',
        description: '泡泡射击：女巫塔2以有趣、适合全家的方式带回魔法！消除彩色泡泡，解锁舒适的魔法房间...',
        instructions: '拖动瞄准并射击泡泡。匹配3个或更多相同颜色的泡泡来消除它们。',
      },
    },
    {
      gameId: 'bb4d392023214827884f92b2a0d68c27',
      slug: 'cookie-land',
      category: 'match-3',
      tags: ['cookie', 'match3'],
      width: 800,
      height: 600,
      en: {
        title: 'Cookie Land',
        description: 'Step into Cookie Land, the ultimate sweet Match 3 adventure! Match cookies, candies, pies, donuts, cupcakes, and cotton candies...',
        instructions: 'Match three or more identical sweets to clear them from the board and reach your level goals. Use boosters and plan moves strategically.',
      },
      zh: {
        title: '饼干乐园',
        description: '进入饼干乐园，终极甜蜜三消冒险！匹配饼干、糖果、派、甜甜圈、纸杯蛋糕和棉花糖...',
        instructions: '匹配三个或更多相同的甜点，将它们从棋盘上清除并达到关卡目标。使用增强道具并策略性地计划移动。',
      },
    },
    {
      gameId: '8d034584a63642dcb89fa3d24ed6e1b1',
      slug: 'vex-9',
      category: 'agility',
      tags: ['2d', 'platformer', 'skill', 'singleplayer', 'jumping'],
      width: 800,
      height: 600,
      en: {
        title: 'Vex 9',
        description: 'Take your parkour skills to the limit as you run, jump, and slide your way through a brand-new set of Acts',
        instructions: 'Use Arrow keys or WASD to move, jump, and crouch your stickman',
      },
      zh: {
        title: 'Vex 9',
        description: '将你的跑酷技能发挥到极限，跑步、跳跃、滑行穿越全新的关卡',
        instructions: '使用方向键或WASD移动、跳跃和蹲下你的火柴人',
      },
    },
    {
      gameId: '62e8b351034b46129fedb50065e06680',
      slug: 'obby-tower',
      category: 'io',
      tags: ['math', 'tower', 'parkour', 'roblox', 'climb'],
      width: 800,
      height: 600,
      en: {
        title: 'Obby Tower',
        description: 'Climb. Think. Survive. Ascend a towering obstacle course filled with tricky jumps, moving platforms — and surprise math challenges!',
        instructions: 'Navigate through obstacles, solve math problems, and climb to the top of the tower.',
      },
      zh: {
        title: '障碍塔',
        description: '攀爬。思考。生存。登上充满狡猾跳跃、移动平台和惊喜数学挑战的高塔障碍赛！',
        instructions: '穿越障碍物，解决数学问题，爬到塔顶。',
      },
    },
    {
      gameId: '023e7fbb9c874166a76219e0c1f45af0',
      slug: 'dog-escape-1',
      category: 'adventure',
      tags: ['animal', 'dog', 'kidgames', 'pet', 'puppy'],
      width: 800,
      height: 600,
      en: {
        title: 'Dog Escape',
        description: 'Welcome to Dog Escape, the hide-and-seek puzzle where saving a dog is only the beginning.',
        instructions: 'Swipe or drag to move. Reach the green exit door without getting caught.',
      },
      zh: {
        title: '小狗逃脱',
        description: '欢迎来到小狗逃脱，这个捉迷藏益智游戏，拯救小狗只是开始。',
        instructions: '滑动或拖动移动。在不被抓住的情况下到达绿色出口门。',
      },
    },
    {
      gameId: '940c7c7f620b46f0ba61998e9a98b8fb',
      slug: 'formula-traffic-racer',
      category: 'racing-driving',
      tags: ['1player', '3d', 'car', 'endless', 'realistic'],
      width: 800,
      height: 600,
      en: {
        title: 'Formula Traffic Racer',
        description: 'Skid the wheels of 6 stunning F1 cars with modified body kits and drive them through 3 landscape highways',
        instructions: 'W, A, S, D/ Arrow Keys: Drive/Steer/Brake, F: Nitro, C: Change Camera',
      },
      zh: {
        title: '方程式赛车交通',
        description: '驾驶6辆配备改装车身套件的惊艳F1赛车，在3条景观高速公路上飞驰',
        instructions: 'W, A, S, D/方向键：驾驶/转向/刹车，F：氮气加速，C：切换相机',
      },
    },
    {
      gameId: '28f14620b6b4490b8ca14b5ebc684175',
      slug: 'merge-beasts',
      category: 'merge',
      tags: ['collect', 'halloween', 'logic', 'monster', 'solitaire'],
      width: 1280,
      height: 720,
      en: {
        title: 'Merge Beasts',
        description: 'A fun and addictive merge game where you combine cute and quirky beasts to create stronger and rarer creatures.',
        instructions: 'Just drag and drop matching beasts to merge them into a stronger one.',
      },
      zh: {
        title: '合并怪兽',
        description: '一个有趣且令人上瘾的合并游戏，你可以组合可爱而古怪的怪兽来创造更强大、更稀有的生物。',
        instructions: '只需拖放匹配的怪兽，将它们合并成更强大的怪兽。',
      },
    },
    {
      gameId: '6259b8781bfe4a1dbcd274ca61837902',
      slug: 'aliens-hunter',
      category: 'shooter',
      tags: ['alien', 'guns', 'hidden', 'sniper'],
      width: 800,
      height: 600,
      en: {
        title: 'Aliens Hunter',
        description: 'You are an alien hunter and your mission is to use your abilities to find the aliens hidden in the city...',
        instructions: 'Find and shoot the hidden aliens before time runs out.',
      },
      zh: {
        title: '外星人猎人',
        description: '你是一名外星人猎人，你的任务是使用你的能力找到隐藏在城市中的外星人...',
        instructions: '在时间用完之前找到并射击隐藏的外星人。',
      },
    },
    {
      gameId: '8b43e10dbeb84f7c90e848fb8109d489',
      slug: 'bubble-shooter-temple-jewels',
      category: 'bubble-shooter',
      tags: ['arcade', 'bubble', 'jewels', 'singleplayer', 'temple'],
      width: 800,
      height: 600,
      en: {
        title: 'Bubble Shooter Temple Jewels',
        description: 'Embark on a temple adventure in Bubble Shooter Temple Jewels! Pop colorful bubbles as you progress through ancient ruins...',
        instructions: 'Aim and shoot bubbles to match 3 or more of the same color.',
      },
      zh: {
        title: '神庙宝石泡泡射击',
        description: '在泡泡射击神庙宝石中开启神庙冒险！在穿越古代遗迹时消除彩色泡泡...',
        instructions: '瞄准并射击泡泡，匹配3个或更多相同颜色的泡泡。',
      },
    },
    {
      gameId: '91eb12a4669543ea825a9e2469143b93',
      slug: 'twilight-solitaire-tripeaks',
      category: 'cards',
      tags: ['halloween', 'klondike', 'relaxing', 'solitaire', 'tripeaks'],
      width: 1920,
      height: 1080,
      en: {
        title: 'Twilight Solitaire TriPeaks',
        description: 'Step into the shadows with Twilight Solitaire TriPeaks! Explore abandoned castles, fend off lurking vampires...',
        instructions: 'Select cards one higher or lower than the foundation card to clear the board.',
      },
      zh: {
        title: '暮光三峰纸牌',
        description: '与暮光三峰纸牌一起进入阴影！探索废弃的城堡，击退潜伏的吸血鬼...',
        instructions: '选择比底牌高一或低一的牌来清除棋盘。',
      },
    },
    {
      gameId: '9dd243c7b2a243e4b9a7f92a23120c45',
      slug: 'brawl-stars-brave-adventure',
      category: 'adventure',
      tags: ['battlefield', 'enemies', 'monster', 'survival'],
      width: 1280,
      height: 720,
      en: {
        title: 'Brawl Stars Brave Adventure',
        description: 'Brawl Stars Brave Adventure is a casual battle game designed for brave boys who love fast-paced action and nonstop adventure.',
        instructions: 'Fight enemies, survive battles, and complete your adventure.',
      },
      zh: {
        title: '荒野乱斗勇敢冒险',
        description: '荒野乱斗勇敢冒险是一款休闲战斗游戏，专为热爱快节奏动作和不停冒险的勇敢男孩设计。',
        instructions: '对抗敌人，在战斗中生存，完成你的冒险。',
      },
    },
    {
      gameId: '716f4ed14dfb4a5fabdebd48ca04d0c3',
      slug: 'ugc-math-race',
      category: 'educational',
      tags: ['challenge', 'math', 'roblox', 'runner'],
      width: 800,
      height: 600,
      en: {
        title: 'UGC Math Race',
        description: 'Run fast. Think faster! Solve math problems on the go in this competitive racing game!',
        instructions: 'Solve math problems while racing to win the competition.',
      },
      zh: {
        title: 'UGC数学竞赛',
        description: '跑得快。思考更快！在这个竞技赛车游戏中边跑边解决数学问题！',
        instructions: '边比赛边解决数学问题来赢得比赛。',
      },
    },
    {
      gameId: 'fe3c5c9d90f24f10a9e01cca22f5243f',
      slug: 'italian-brainrot-baby-clicker',
      category: 'casual',
      tags: ['1player', '2players', 'animal', 'clicker', 'idle'],
      width: 960,
      height: 600,
      en: {
        title: 'Italian Brainrot Baby Clicker',
        description: 'Get ready for the cutest twist on the viral Brainrot universe!',
        instructions: 'Click to collect items and progress through the game.',
      },
      zh: {
        title: '意大利脑洞宝宝点击器',
        description: '准备好迎接病毒式传播的Brainrot宇宙中最可爱的变化！',
        instructions: '点击收集物品并推进游戏进度。',
      },
    },
    {
      gameId: 'bb65344d29f74da1bd1f41500d8b1dc2',
      slug: 'two-stunt-racers',
      category: 'racing-driving',
      tags: ['2players', 'car', 'city', 'drift', 'stunts'],
      width: 800,
      height: 600,
      en: {
        title: 'Two Stunt Racers',
        description: 'Skid the wheel of a stunning sports car through 3 awesome game modes and showcase your driving skills.',
        instructions: 'Control your car, perform stunts, and race against opponents.',
      },
      zh: {
        title: '双人特技赛车',
        description: '驾驶一辆惊艳的跑车在3个精彩的游戏模式中漂移，展示你的驾驶技能。',
        instructions: '控制你的车，执行特技，与对手竞速。',
      },
    },
    {
      gameId: '755f3912501d454fb781db0a4c0c5764',
      slug: 'cooking-restaurant-kitchen',
      category: 'cooking',
      tags: ['food', 'restaurant'],
      width: 1280,
      height: 720,
      en: {
        title: 'Cooking Restaurant Kitchen',
        description: 'Prepare and cook delicious food from all over the world in Cooking Restaurant Kitchen...',
        instructions: 'Follow recipes, cook dishes, and serve customers in your restaurant.',
      },
      zh: {
        title: '烹饪餐厅厨房',
        description: '在烹饪餐厅厨房中准备和烹饪来自世界各地的美味食物...',
        instructions: '按照食谱，烹饪菜肴，在你的餐厅为顾客服务。',
      },
    },
    {
      gameId: '70f45225c4364584abc12fd8f7504c78',
      slug: 'jumper',
      category: 'casual',
      tags: ['obstacles', 'skill', 'timing', 'arcade', 'jumping'],
      width: 800,
      height: 600,
      en: {
        title: 'JUMPER',
        description: 'Bounce your way to record-breaking heights in JUMPER! Dodge epic traps, collect unique power-ups, and enjoy upgraded visuals',
        instructions: 'Time your jumps perfectly to avoid obstacles and reach new heights.',
      },
      zh: {
        title: '跳跃者',
        description: '在JUMPER中跳跃到破纪录的高度！躲避史诗级陷阱，收集独特的能量提升，享受升级的视觉效果',
        instructions: '完美地把握跳跃时机，避开障碍物并达到新高度。',
      },
    },
    {
      gameId: '19d86bb378c4493397397fe3b8f2f0af',
      slug: 'path-ice',
      category: 'puzzle',
      tags: ['logical'],
      width: 800,
      height: 600,
      en: {
        title: 'Path ice',
        description: 'Chill the soda, add some ice, but here\'s the problem, it\'s not so easy to get into the glass, you need to draw a path for the ice.',
        instructions: 'Draw a path to guide the ice into the glass.',
      },
      zh: {
        title: '冰块路径',
        description: '冷却苏打水，加一些冰，但这里有个问题，冰块进入玻璃杯并不容易，你需要为冰块画一条路径。',
        instructions: '画一条路径引导冰块进入玻璃杯。',
      },
    },
    {
      gameId: 'db69d7374a614188848b8834284d993f',
      slug: 'shotting-balls',
      category: 'casual',
      tags: ['1player', 'ball', 'bounce', 'skill', 'skin'],
      width: 1080,
      height: 1920,
      en: {
        title: 'Shotting Balls',
        description: 'In this fun game, you\'ll have to use your skills to destroy all the black blocks you find in each level...',
        instructions: 'Aim and shoot balls to destroy blocks.',
      },
      zh: {
        title: '射击球',
        description: '在这个有趣的游戏中，你必须使用你的技能来摧毁每个关卡中找到的所有黑色方块...',
        instructions: '瞄准并射击球来摧毁方块。',
      },
    },
    {
      gameId: '520d3a78eecd42b99e0fd689a02d3cfe',
      slug: 'red-hide-ball',
      category: 'puzzle',
      tags: ['1player', 'building', 'defence', 'hide', 'logic'],
      width: 800,
      height: 600,
      en: {
        title: 'Red Hide Ball',
        description: 'In Red Hide Ball you protect designated balls from roaming monsters by manipulating the level layout and placing shields or obstacles.',
        instructions: 'Place shields and obstacles to protect balls from monsters.',
      },
      zh: {
        title: '红球隐藏',
        description: '在红球隐藏中，你通过操纵关卡布局和放置盾牌或障碍物来保护指定的球免受游荡怪物的侵害。',
        instructions: '放置盾牌和障碍物来保护球免受怪物侵害。',
      },
    },
    {
      gameId: '9d73154af21641cd9616d94bcd284a33',
      slug: 'mr-long-hand',
      category: 'puzzle',
      tags: ['1player', 'stickman'],
      width: 600,
      height: 960,
      en: {
        title: 'Mr Long Hand',
        description: 'Immerse yourself in the quirky and delightful world of Mr Long Hand, where you take on the role of a stickman with incredibly long arms.',
        instructions: 'Use your long arms to reach objects and solve puzzles.',
      },
      zh: {
        title: '长手先生',
        description: '沉浸在长手先生这个古怪而愉快的世界中，你扮演一个拥有超长手臂的火柴人。',
        instructions: '使用你的长手臂触及物体并解决谜题。',
      },
    },
    {
      gameId: '3eccd25a86d245d28ae593793fe81e2b',
      slug: 'sort-master',
      category: 'strategy',
      tags: ['matching', 'sorting'],
      width: 800,
      height: 600,
      en: {
        title: 'Sort Master',
        description: 'Get ready to bring order to the chaos in Sort Master, a relaxing yet addictive online puzzle game.',
        instructions: 'Sort items by matching and organizing them correctly.',
      },
      zh: {
        title: '分类大师',
        description: '准备好在分类大师中为混乱带来秩序，这是一款轻松却令人上瘾的在线益智游戏。',
        instructions: '通过正确匹配和组织来分类物品。',
      },
    },
    {
      gameId: 'c6e9fe916ff54b1c8a5e17a68d1479e5',
      slug: 'jetstream-escape',
      category: 'racing-driving',
      tags: ['1player', '3d', 'escape'],
      width: 800,
      height: 600,
      en: {
        title: 'Jetstream Escape',
        description: 'Jetstream Escape — a fast-paced speedboat arcade built for quick-browser thrills...',
        instructions: 'Navigate your speedboat through obstacles and escape.',
      },
      zh: {
        title: '急流逃脱',
        description: '急流逃脱——一款为快速浏览器刺激而打造的快节奏快艇街机游戏...',
        instructions: '驾驶你的快艇穿越障碍物并逃脱。',
      },
    },
    {
      gameId: '1ac2392ea7bd4a1ca9f9b1e229287825',
      slug: 'dino-slide',
      category: 'puzzle',
      tags: ['dinosaurs', 'sliding-puzzle'],
      width: 1280,
      height: 720,
      en: {
        title: 'Dino Slide',
        description: 'A puzle slide game wher you have to feed Dino. Move Dino with the keyboard arrow or swipe.',
        instructions: 'Slide the dinosaur to collect food using arrow keys or swipe.',
      },
      zh: {
        title: '恐龙滑块',
        description: '一个滑块益智游戏，你需要喂养恐龙。用键盘方向键或滑动来移动恐龙。',
        instructions: '使用方向键或滑动来滑动恐龙收集食物。',
      },
    },
    {
      gameId: 'b3d496aa204043c7bb39a355d8c97235',
      slug: 'car-mechanic-simulator-2025',
      category: 'simulation',
      tags: ['car', 'construction', 'maker', 'repair', 'sorting'],
      width: 800,
      height: 600,
      en: {
        title: 'Car Mechanic Simulator 2025',
        description: 'In \'Car Mechanic Simulator 2025\', you are a master restorer who breathes new life into forgotten cars!',
        instructions: 'Repair and restore cars by following the on-screen instructions.',
      },
      zh: {
        title: '汽车修理模拟器2025',
        description: '在"汽车修理模拟器2025"中，你是一位大师级修复者，为被遗忘的汽车注入新生命！',
        instructions: '按照屏幕指示修理和恢复汽车。',
      },
    },
    {
      gameId: '6d07333e823c477db438cee11c426b22',
      slug: 'witch-craft-potion-sort',
      category: 'puzzle',
      tags: ['colormatch', 'halloween', 'matching'],
      width: 720,
      height: 1280,
      en: {
        title: 'Witch Craft Potion Sort',
        description: 'Step into the witch\'s lair this Halloween night and test your skills in a spooky potion puzzle!',
        instructions: 'Sort potions by color to complete each level.',
      },
      zh: {
        title: '女巫药水分类',
        description: '在这个万圣节之夜进入女巫的巢穴，在一个令人毛骨悚然的药水谜题中测试你的技能！',
        instructions: '按颜色分类药水来完成每个关卡。',
      },
    },
    {
      gameId: '084149320d0e44fc9eaa25ebeb8133af',
      slug: 'tappy-bird-avoid-the-spikes',
      category: 'casual',
      tags: ['1player', 'air', 'bird', 'birds', 'wings'],
      width: 642,
      height: 1389,
      en: {
        title: 'Tappy Bird - Avoid the Spikes',
        description: 'Tap on the screen to move bird up, avoiding the spikes as the level progresses',
        instructions: 'Tap to make the bird fly and avoid the spikes.',
      },
      zh: {
        title: '点击小鸟 - 避开尖刺',
        description: '点击屏幕让小鸟向上飞，在关卡推进时避开尖刺',
        instructions: '点击让小鸟飞行并避开尖刺。',
      },
    },
    {
      gameId: '7e943bed895146b0a6939bb7c92a8e7c',
      slug: 'bricks-balls-breaker',
      category: 'strategy',
      tags: ['ball', 'brick', 'arcade'],
      width: 800,
      height: 600,
      en: {
        title: 'Bricks Balls Breaker',
        description: 'Dive into Bricks Balls Breaker, an addictive online arcade game where precision and timing are everything.',
        instructions: 'Aim and shoot balls to break all the bricks.',
      },
      zh: {
        title: '砖块打砖',
        description: '沉浸在砖块打砖中，这是一款令人上瘾的在线街机游戏，精确度和时机就是一切。',
        instructions: '瞄准并射击球来打破所有砖块。',
      },
    },
    {
      gameId: '877356dc859c48f3b7e1922a48110439',
      slug: 'chicken-math',
      category: 'educational',
      tags: ['3d', 'chicken', 'guns', 'math', 'timekiller'],
      width: 800,
      height: 600,
      en: {
        title: 'Chicken Math',
        description: 'I am Archimedes. I\'ve been trying to solve this difficult problem for a week, and those chickens have stolen my numbers again.',
        instructions: 'Shoot chickens with the correct math answers.',
      },
      zh: {
        title: '小鸡数学',
        description: '我是阿基米德。我已经尝试解决这个难题一周了，那些鸡又偷走了我的数字。',
        instructions: '射击带有正确数学答案的小鸡。',
      },
    },
    {
      gameId: 'ab2ee8bbe1e540c9ae06719d2c4170d6',
      slug: 'destruction-simulator',
      category: 'simulation',
      tags: ['3d', 'destroy', 'explosion', 'rocket', 'sandbox'],
      width: 800,
      height: 600,
      en: {
        title: 'Destruction Simulator',
        description: 'Experience the ultimate destruction sandbox! Bend time, shift gravity, and unleash realistic debris effects.',
        instructions: 'Use various tools to destroy objects in the sandbox environment.',
      },
      zh: {
        title: '毁灭模拟器',
        description: '体验终极毁灭沙盒！扭曲时间，转移重力，释放逼真的碎片效果。',
        instructions: '使用各种工具在沙盒环境中摧毁物体。',
      },
    },
  ]

  // 获取所有分类（用于通过slug查找ID）
  const categoriesMap = new Map<string, string>()
  const allCategories = await prisma.category.findMany()
  allCategories.forEach(cat => {
    categoriesMap.set(cat.slug, cat.id)
  })

  // 创建游戏和相关数据
  for (const gameData of gamesData) {
    const categoryId = categoriesMap.get(gameData.category)
    if (!categoryId) {
      console.log(`⚠️  警告：找不到分类 "${gameData.category}"，跳过游戏 "${gameData.en.title}"`)
      continue
    }

    // 创建或更新游戏主表
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: {
        thumbnail: `https://img.gamedistribution.com/${gameData.gameId}-512x384.jpg`,
        banner: `https://img.gamedistribution.com/${gameData.gameId}-1280x720.jpg`,
        embedUrl: `https://html5.gamedistribution.com/${gameData.gameId}/`,
        gameUrl: `https://gamedistribution.com/games/${gameData.slug}/`,
        width: gameData.width,
        height: gameData.height,
        categoryId,
        isPublished: true,
      },
      create: {
        slug: gameData.slug,
        thumbnail: `https://img.gamedistribution.com/${gameData.gameId}-512x384.jpg`,
        banner: `https://img.gamedistribution.com/${gameData.gameId}-1280x720.jpg`,
        embedUrl: `https://html5.gamedistribution.com/${gameData.gameId}/`,
        gameUrl: `https://gamedistribution.com/games/${gameData.slug}/`,
        width: gameData.width,
        height: gameData.height,
        categoryId,
        isPublished: true,
      },
    })

    // 创建或更新英文翻译
    await prisma.gameTranslation.upsert({
      where: {
        gameId_locale: {
          gameId: game.id,
          locale: 'en',
        },
      },
      update: {
        title: gameData.en.title,
        description: gameData.en.description,
        instructions: gameData.en.instructions,
      },
      create: {
        gameId: game.id,
        locale: 'en',
        title: gameData.en.title,
        description: gameData.en.description,
        instructions: gameData.en.instructions,
      },
    })

    // 创建或更新中文翻译
    await prisma.gameTranslation.upsert({
      where: {
        gameId_locale: {
          gameId: game.id,
          locale: 'zh',
        },
      },
      update: {
        title: gameData.zh.title,
        description: gameData.zh.description,
        instructions: gameData.zh.instructions,
      },
      create: {
        gameId: game.id,
        locale: 'zh',
        title: gameData.zh.title,
        description: gameData.zh.description,
        instructions: gameData.zh.instructions,
      },
    })

    // 创建标签并关联到游戏
    for (const tagSlug of gameData.tags) {
      // 创建或获取标签
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: {
          slug: tagSlug,
          isEnabled: true,
        },
      })

      // 创建标签翻译（英文）
      await prisma.tagTranslation.upsert({
        where: {
          tagId_locale: {
            tagId: tag.id,
            locale: 'en',
          },
        },
        update: {
          name: tagSlug.charAt(0).toUpperCase() + tagSlug.slice(1).replace(/-/g, ' '),
        },
        create: {
          tagId: tag.id,
          locale: 'en',
          name: tagSlug.charAt(0).toUpperCase() + tagSlug.slice(1).replace(/-/g, ' '),
        },
      })

      // 关联游戏和标签
      await prisma.gameTag.upsert({
        where: {
          gameId_tagId: {
            gameId: game.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          gameId: game.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`✅ 创建/更新游戏: ${gameData.en.title} / ${gameData.zh.title}`)
  }

  console.log(`\n✅ 成功创建 ${gamesData.length} 个游戏（英文+中文翻译）`)

  // 6. 为所有标签添加中文翻译
  console.log('\n开始为标签添加中文翻译...')

  // 标签的中英文对照表
  const tagsTranslations: Record<string, { en: string; zh: string }> = {
    '1player': { en: '1 Player', zh: '单人游戏' },
    '2d': { en: '2D', zh: '2D游戏' },
    '2players': { en: '2 Players', zh: '双人游戏' },
    '3d': { en: '3D', zh: '3D游戏' },
    'air': { en: 'Air', zh: '空中' },
    'alien': { en: 'Alien', zh: '外星人' },
    'animal': { en: 'Animal', zh: '动物' },
    'arcade': { en: 'Arcade', zh: '街机' },
    'ball': { en: 'Ball', zh: '球' },
    'battlefield': { en: 'Battlefield', zh: '战场' },
    'bird': { en: 'Bird', zh: '小鸟' },
    'birds': { en: 'Birds', zh: '飞鸟' },
    'bounce': { en: 'Bounce', zh: '弹跳' },
    'brick': { en: 'Brick', zh: '砖块' },
    'bubble': { en: 'Bubble', zh: '泡泡' },
    'building': { en: 'Building', zh: '建造' },
    'car': { en: 'Car', zh: '汽车' },
    'challenge': { en: 'Challenge', zh: '挑战' },
    'chicken': { en: 'Chicken', zh: '小鸡' },
    'city': { en: 'City', zh: '城市' },
    'clicker': { en: 'Clicker', zh: '点击' },
    'climb': { en: 'Climb', zh: '攀爬' },
    'collect': { en: 'Collect', zh: '收集' },
    'colorful': { en: 'Colorful', zh: '彩色' },
    'colormatch': { en: 'Color Match', zh: '颜色匹配' },
    'construction': { en: 'Construction', zh: '建设' },
    'cookie': { en: 'Cookie', zh: '饼干' },
    'defence': { en: 'Defence', zh: '防御' },
    'destroy': { en: 'Destroy', zh: '摧毁' },
    'dinosaurs': { en: 'Dinosaurs', zh: '恐龙' },
    'dog': { en: 'Dog', zh: '小狗' },
    'drift': { en: 'Drift', zh: '漂移' },
    'endless': { en: 'Endless', zh: '无尽' },
    'enemies': { en: 'Enemies', zh: '敌人' },
    'escape': { en: 'Escape', zh: '逃脱' },
    'explosion': { en: 'Explosion', zh: '爆炸' },
    'food': { en: 'Food', zh: '食物' },
    'guns': { en: 'Guns', zh: '枪支' },
    'halloween': { en: 'Halloween', zh: '万圣节' },
    'hidden': { en: 'Hidden', zh: '隐藏' },
    'hide': { en: 'Hide', zh: '躲藏' },
    'idle': { en: 'Idle', zh: '挂机' },
    'jewels': { en: 'Jewels', zh: '宝石' },
    'jumping': { en: 'Jumping', zh: '跳跃' },
    'kidgames': { en: 'Kids Games', zh: '儿童游戏' },
    'klondike': { en: 'Klondike', zh: '克朗代克' },
    'logic': { en: 'Logic', zh: '逻辑' },
    'logical': { en: 'Logical', zh: '逻辑思维' },
    'maker': { en: 'Maker', zh: '制作' },
    'match3': { en: 'Match 3', zh: '三消' },
    'matching': { en: 'Matching', zh: '匹配' },
    'math': { en: 'Math', zh: '数学' },
    'monster': { en: 'Monster', zh: '怪物' },
    'obstacles': { en: 'Obstacles', zh: '障碍' },
    'parkour': { en: 'Parkour', zh: '跑酷' },
    'pet': { en: 'Pet', zh: '宠物' },
    'platformer': { en: 'Platformer', zh: '平台' },
    'puppy': { en: 'Puppy', zh: '小狗崽' },
    'realistic': { en: 'Realistic', zh: '真实' },
    'relaxing': { en: 'Relaxing', zh: '放松' },
    'repair': { en: 'Repair', zh: '修理' },
    'restaurant': { en: 'Restaurant', zh: '餐厅' },
    'roblox': { en: 'Roblox', zh: 'Roblox' },
    'rocket': { en: 'Rocket', zh: '火箭' },
    'runner': { en: 'Runner', zh: '跑步' },
    'sandbox': { en: 'Sandbox', zh: '沙盒' },
    'singleplayer': { en: 'Single Player', zh: '单人' },
    'skill': { en: 'Skill', zh: '技巧' },
    'skin': { en: 'Skin', zh: '皮肤' },
    'sliding-puzzle': { en: 'Sliding Puzzle', zh: '滑块拼图' },
    'sniper': { en: 'Sniper', zh: '狙击' },
    'solitaire': { en: 'Solitaire', zh: '纸牌' },
    'sorting': { en: 'Sorting', zh: '分类' },
    'speedrun': { en: 'Speedrun', zh: '速通' },
    'stickman': { en: 'Stickman', zh: '火柴人' },
    'stunts': { en: 'Stunts', zh: '特技' },
    'survival': { en: 'Survival', zh: '生存' },
    'temple': { en: 'Temple', zh: '神庙' },
    'timekiller': { en: 'Time Killer', zh: '消磨时间' },
    'timing': { en: 'Timing', zh: '时机' },
    'tower': { en: 'Tower', zh: '塔' },
    'tripeaks': { en: 'TriPeaks', zh: '三峰' },
    'wings': { en: 'Wings', zh: '翅膀' },
    'witch': { en: 'Witch', zh: '女巫' },
  }

  // 获取所有标签
  const allTags = await prisma.tag.findMany({
    include: {
      translations: true,
    },
  })

  // 为每个标签添加中文翻译
  for (const tag of allTags) {
    const translation = tagsTranslations[tag.slug]
    if (!translation) {
      console.log(`⚠️  警告：找不到标签 "${tag.slug}" 的翻译，跳过`)
      continue
    }

    // 更新或创建英文翻译
    await prisma.tagTranslation.upsert({
      where: {
        tagId_locale: {
          tagId: tag.id,
          locale: 'en',
        },
      },
      update: {
        name: translation.en,
      },
      create: {
        tagId: tag.id,
        locale: 'en',
        name: translation.en,
      },
    })

    // 创建或更新中文翻译
    await prisma.tagTranslation.upsert({
      where: {
        tagId_locale: {
          tagId: tag.id,
          locale: 'zh',
        },
      },
      update: {
        name: translation.zh,
      },
      create: {
        tagId: tag.id,
        locale: 'zh',
        name: translation.zh,
      },
    })

    console.log(`✅ 更新标签翻译: ${translation.en} / ${translation.zh}`)
  }

  console.log(`\n✅ 成功为 ${allTags.length} 个标签添加中文翻译`)
  console.log('\n🎉 种子数据完成！')
}

main()
  .then(async () => {
    console.log('\n🔌 正在关闭数据库连接...')
    await prisma.$disconnect()
    console.log('✅ 数据库连接已关闭')
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('\n❌ 种子数据失败:', e)
    console.log('\n🔌 正在关闭数据库连接...')
    await prisma.$disconnect()
    console.log('✅ 数据库连接已关闭')
    process.exit(1)
  })
