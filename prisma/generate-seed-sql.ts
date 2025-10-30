import bcrypt from 'bcryptjs'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function generateSeedSQL() {
  const sql: string[] = []

  sql.push('-- RunGame 初始化数据 SQL')
  sql.push('-- 生成时间: ' + new Date().toISOString())
  sql.push('')

  // ==================== 1. 语言数据 ====================
  sql.push('-- 1. 语言数据')
  sql.push("INSERT INTO languages (id, code, name, native_name, flag, locale_code, direction, is_default, is_enabled, sort_order, created_at, updated_at) VALUES")
  sql.push("  ('lang_en', 'en', 'English', 'English', '🇬🇧', 'en-US', 'LTR', true, true, 1, NOW(), NOW()),")
  sql.push("  ('lang_zh', 'zh', 'Chinese', '中文', '🇨🇳', 'zh-CN', 'LTR', false, true, 2, NOW(), NOW());")
  sql.push('')

  sql.push("INSERT INTO language_translations (id, language_id, locale, name, description, created_at, updated_at) VALUES")
  sql.push("  (gen_random_uuid(), 'lang_en', 'zh', '英语', '美式英语', NOW(), NOW()),")
  sql.push("  (gen_random_uuid(), 'lang_zh', 'en', 'Chinese', 'Simplified Chinese', NOW(), NOW()),")
  sql.push("  (gen_random_uuid(), 'lang_zh', 'zh', '中文', '简体中文', NOW(), NOW());")
  sql.push('')

  // ==================== 2. 管理员数据 ====================
  const hashedPassword = await bcrypt.hash('admin123', 10)
  sql.push('-- 2. 管理员数据 (密码: admin123)')
  sql.push("INSERT INTO admins (id, email, password, name, role, is_active, created_at, updated_at) VALUES")
  sql.push(`  (gen_random_uuid(), 'admin@rungame.online', '${hashedPassword}', 'Super Admin', 'SUPER_ADMIN', true, NOW(), NOW());`)
  sql.push('')

  // ==================== 3. 导入平台数据 ====================
  sql.push('-- 3. 导入平台数据')
  sql.push("INSERT INTO import_platforms (id, name, slug, type, icon, api_config, default_config, is_enabled, sort_order, total_imported, created_at, updated_at) VALUES")
  sql.push(`  (gen_random_uuid(), 'GamePix', 'gamepix', 'gamepix', '🎯', '{"siteId":"8RI7HLK9GV8W","feedUrl":"https://public.gamepix.com/json/feeds/v2/games.json","categoryUrl":"https://public.gamepix.com/json/feeds/v2/games/category/list.json"}'::json, '{"autoPublish":false,"setFeatured":false,"importImages":true,"importTranslations":true}'::json, true, 1, 0, NOW(), NOW());`)
  sql.push('')

  // ==================== 4. 分类数据 ====================
  sql.push('-- 4. 分类数据 (152个分类)')

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

  sql.push('INSERT INTO categories (id, slug, name, description, meta_title, meta_description, keywords, sort_order, is_enabled, created_at, updated_at) VALUES')

  const categoryInserts: string[] = []
  categories.forEach((cat, i) => {
    const id = `cat_${cat.slug.replace(/-/g, '_')}`
    const name = cat.name.replace(/'/g, "''")
    const desc = `Play ${name} games online`
    const metaTitle = `${name} Games - Play Free Online`
    const metaDesc = `Play the best ${name} games online for free. No downloads required!`
    const keywords = `${cat.slug}, ${name.toLowerCase()}, ${name.toLowerCase()} games`

    categoryInserts.push(`  ('${id}', '${cat.slug}', '${name}', '${desc}', '${metaTitle}', '${metaDesc}', '${keywords}', ${i + 1}, true, NOW(), NOW())`)
  })
  sql.push(categoryInserts.join(',\n') + ';')
  sql.push('')

  // 分类翻译
  sql.push('INSERT INTO category_translations (id, category_id, locale, name, description, meta_title, meta_description, keywords, created_at, updated_at) VALUES')

  const categoryTransInserts: string[] = []
  categories.forEach((cat) => {
    const id = `cat_${cat.slug.replace(/-/g, '_')}`
    const nameCn = cat.nameCn.replace(/'/g, "''")
    const desc = `在线玩${nameCn}游戏`
    const metaTitle = `${nameCn}游戏 - 免费在线玩`
    const metaDesc = `在线免费玩最好的${nameCn}游戏。无需下载！`
    const keywords = `${cat.slug}, ${nameCn}, ${nameCn}游戏`

    categoryTransInserts.push(`  (gen_random_uuid(), '${id}', 'zh', '${nameCn}', '${desc}', '${metaTitle}', '${metaDesc}', '${keywords}', NOW(), NOW())`)
  })
  sql.push(categoryTransInserts.join(',\n') + ';')
  sql.push('')

  // ==================== 5. 页面类型数据 ====================
  sql.push('-- 5. 页面类型数据 (4个页面)')
  sql.push("INSERT INTO page_types (id, slug, type, icon, is_enabled, sort_order, title, description, meta_title, meta_description, keywords, page_info, created_at, updated_at) VALUES")
  sql.push("  ('page_most_played', 'most-played', 'GAME_LIST', '🔥', true, 1, 'Most Played Games', 'The most popular games played by our community', 'Most Played Games - Popular Online Games', 'Play the most popular games loved by millions of players worldwide!', 'most played games, popular games, trending games', '{\"gameList\":{\"filters\":{},\"orderBy\":\"playCount\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  ('page_new_games', 'new-games', 'GAME_LIST', '🆕', true, 2, 'New Games', 'Latest games added to our collection', 'New Games - Latest Online Games', 'Check out the newest games added to our platform. Fresh content updated daily!', 'new games, latest games, recent games', '{\"gameList\":{\"filters\":{},\"orderBy\":\"createdAt\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  ('page_featured', 'featured', 'GAME_LIST', '⭐', true, 3, 'Featured Games', 'Hand-picked games selected by our editors', 'Featured Games - Editor''s Choice', 'Play our featured games - carefully selected by our team for the best gaming experience.', 'featured games, editor''s choice, best games', '{\"gameList\":{\"filters\":{\"isFeatured\":true},\"orderBy\":\"rating\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  ('page_trending', 'trending', 'GAME_LIST', '📈', true, 4, 'Trending Games', 'Games that are trending right now', 'Trending Games - What''s Hot Now', 'Discover the hottest trending games that everyone is playing right now!', 'trending games, hot games, popular now', '{\"gameList\":{\"filters\":{},\"orderBy\":\"rating\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW());")
  sql.push('')

  sql.push("INSERT INTO page_type_translations (id, page_type_id, locale, title, description, meta_title, meta_description, keywords, page_info, created_at, updated_at) VALUES")
  sql.push("  (gen_random_uuid(), 'page_most_played', 'zh', '最多人游玩', '我们社区中最受欢迎的游戏', '最多人游玩的游戏 - 热门在线游戏', '玩全球数百万玩家喜爱的最热门游戏！', '最多人玩,热门游戏,流行游戏', '{\"gameList\":{\"filters\":{},\"orderBy\":\"playCount\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  (gen_random_uuid(), 'page_new_games', 'zh', '最新游戏', '最新添加到我们收藏的游戏', '最新游戏 - 最新在线游戏', '查看我们平台上最新添加的游戏。每天更新新内容！', '新游戏,最新游戏,最近游戏', '{\"gameList\":{\"filters\":{},\"orderBy\":\"createdAt\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  (gen_random_uuid(), 'page_featured', 'zh', '精选游戏', '由我们编辑精心挑选的游戏', '精选游戏 - 编辑推荐', '玩我们的精选游戏 - 由我们的团队精心挑选，提供最佳游戏体验。', '精选游戏,编辑推荐,最佳游戏', '{\"gameList\":{\"filters\":{\"isFeatured\":true},\"orderBy\":\"rating\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW()),")
  sql.push("  (gen_random_uuid(), 'page_trending', 'zh', '趋势游戏', '当前正在流行的游戏', '趋势游戏 - 当前热门', '发现当前每个人都在玩的最热门趋势游戏！', '趋势游戏,热门游戏,当前流行', '{\"gameList\":{\"filters\":{},\"orderBy\":\"rating\",\"orderDirection\":\"desc\",\"pageSize\":24}}'::json, NOW(), NOW());")
  sql.push('')

  sql.push('-- 初始化完成')
  sql.push('-- 数据统计:')
  sql.push('--   语言: 2 个')
  sql.push('--   管理员: 1 个 (admin@rungame.online / admin123)')
  sql.push('--   导入平台: 1 个')
  sql.push('--   分类: 152 个')
  sql.push('--   页面类型: 4 个')

  const sqlContent = sql.join('\n')
  const outputPath = join(__dirname, 'seed-data.sql')
  writeFileSync(outputPath, sqlContent, 'utf-8')

  console.log('✅ SQL 文件已生成：', outputPath)
  console.log('\n执行方式：')
  console.log('psql -h aws-1-us-east-1.pooler.supabase.com -p 5432 -U postgres.kmwfklazjqxffjakpomg -d postgres < prisma/seed-data.sql')
}

generateSeedSQL().catch(console.error)
