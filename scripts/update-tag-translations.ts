import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 标签中文翻译映射表
const tagChineseMapping: Record<string, string> = {
  // 玩家类型
  "multiplayer": "多人游戏",
  "single-player": "单人游戏",
  "2-player": "双人游戏",
  "cooperative": "合作游戏",

  // 游戏类型
  "3d": "3D游戏",
  "2d": "2D游戏",
  "pixel": "像素游戏",
  "retro": "复古游戏",
  "arcade": "街机游戏",

  // 难度/挑战
  "hard": "困难",
  "easy": "简单",
  "challenging": "挑战性",
  "casual": "休闲",

  // 速度
  "fast-paced": "快节奏",
  "slow": "慢节奏",
  "quick": "快速",
  "time-attack": "限时挑战",

  // 游戏元素
  "puzzle": "益智",
  "strategy": "策略",
  "adventure": "冒险",
  "action": "动作",
  "shooting": "射击",
  "racing": "竞速",
  "sports": "体育",
  "fighting": "格斗",
  "simulation": "模拟",
  "rpg": "角色扮演",
  "platformer": "平台",
  "tower-defense": "塔防",
  "card": "卡牌",
  "board": "棋盘",
  "trivia": "问答",
  "quiz": "测验",
  "word": "文字",
  "math": "数学",
  "physics": "物理",
  "music": "音乐",
  "rhythm": "节奏",
  "dance": "舞蹈",

  // 主题
  "zombie": "僵尸",
  "horror": "恐怖",
  "scary": "惊悚",
  "monster": "怪物",
  "fantasy": "奇幻",
  "medieval": "中世纪",
  "space": "太空",
  "alien": "外星人",
  "robot": "机器人",
  "ninja": "忍者",
  "pirate": "海盗",
  "western": "西部",
  "war": "战争",
  "military": "军事",
  "superhero": "超级英雄",
  "anime": "动漫",
  "cartoon": "卡通",
  "cute": "可爱",
  "funny": "搞笑",
  "educational": "教育",
  "kids": "儿童",
  "christmas": "圣诞节",
  "halloween": "万圣节",
  "easter": "复活节",
  "valentine": "情人节",

  // 游戏机制
  "clicker": "点击",
  "idle": "放置",
  "incremental": "增量",
  "sandbox": "沙盒",
  "open-world": "开放世界",
  "survival": "生存",
  "crafting": "制作",
  "building": "建造",
  "management": "管理",
  "tycoon": "大亨",
  "city-building": "城市建设",
  "farming": "农场",
  "cooking": "烹饪",
  "driving": "驾驶",
  "parking": "停车",
  "flying": "飞行",
  "swimming": "游泳",
  "running": "跑酷",
  "jumping": "跳跃",
  "climbing": "攀爬",

  // 武器/工具
  "gun": "枪械",
  "sword": "剑",
  "bow": "弓箭",
  "magic": "魔法",
  "bomb": "炸弹",
  "tank": "坦克",
  "car": "汽车",
  "bike": "自行车",
  "truck": "卡车",
  "plane": "飞机",
  "helicopter": "直升机",
  "boat": "船",

  // 动物
  "cat": "猫",
  "dog": "狗",
  "bird": "鸟",
  "fish": "鱼",
  "dragon": "龙",
  "dinosaur": "恐龙",
  "animal": "动物",
  "pet": "宠物",

  // 环境
  "snow": "雪",
  "ice": "冰",
  "water": "水",
  "fire": "火",
  "nature": "自然",
  "forest": "森林",
  "desert": "沙漠",
  "ocean": "海洋",
  "mountain": "山",
  "island": "岛屿",
  "city": "城市",
  "school": "学校",
  "hospital": "医院",
  "restaurant": "餐厅",

  // 食物
  "food": "食物",
  "pizza": "披萨",
  "cake": "蛋糕",
  "candy": "糖果",
  "fruit": "水果",

  // 球类运动
  "football": "足球",
  "basketball": "篮球",
  "baseball": "棒球",
  "tennis": "网球",
  "golf": "高尔夫",
  "bowling": "保龄球",
  "pool": "台球",
  "soccer": "足球",

  // 其他
  "stickman": "火柴人",
  "match-3": "三消",
  "bubble": "泡泡",
  "ball": "球",
  "block": "方块",
  "color": "颜色",
  "drawing": "绘画",
  "dress-up": "换装",
  "makeover": "化妆",
  "beauty": "美容",
  "fashion": "时尚",
  "wedding": "婚礼",
  "baby": "婴儿",
  "doctor": "医生",
  "dentist": "牙医",
  "surgery": "手术",
  "escape": "逃脱",
  "hidden-object": "隐藏物品",
  "point-and-click": "点击",
  "stealth": "潜行",
  "sniper": "狙击",
  "maze": "迷宫",
  "reflex": "反应",
  "memory": "记忆",
  "logic": "逻辑",
  "cool": "酷",
  "skill": "技巧",
  "battle": "战斗",
  "crazy": "疯狂",
  "shooter": "射击游戏",
  "first-person-shooter": "第一人称射击",
  "addictive": "上瘾",
  "runner": "跑酷",
  "hyper-casual": "超休闲",
  "mining": "挖矿",
  "minecraft": "我的世界",
  "brain": "脑力",
  "tetris": "俄罗斯方块",
  "mobile": "手机",
  "fun": "有趣",
  "boxing": "拳击",
  "robots": "机器人",
  "tap": "点击",
  "games-for-girls": "女生游戏",
  "drifting": "漂移",
  "gdevelop": "GDevelop",
  "flight": "飞行",
}

async function updateTagTranslations() {
  console.log("🌐 开始更新标签中文翻译...")

  // 获取所有标签
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
    },
  })

  console.log(`📊 找到 ${tags.length} 个标签`)

  let updatedCount = 0
  let notFoundCount = 0

  for (const tag of tags) {
    const chineseName = tagChineseMapping[tag.slug.toLowerCase()]

    if (chineseName) {
      // 检查是否已有中文翻译
      const existingTranslation = await prisma.tagTranslation.findUnique({
        where: {
          tagId_locale: {
            tagId: tag.id,
            locale: "zh",
          },
        },
      })

      if (existingTranslation) {
        // 更新现有翻译
        await prisma.tagTranslation.update({
          where: {
            tagId_locale: {
              tagId: tag.id,
              locale: "zh",
            },
          },
          data: {
            name: chineseName,
          },
        })
        console.log(`✅ 更新 ${tag.slug} → ${chineseName}`)
      } else {
        // 创建新翻译
        await prisma.tagTranslation.create({
          data: {
            tagId: tag.id,
            locale: "zh",
            name: chineseName,
          },
        })
        console.log(`➕ 创建 ${tag.slug} → ${chineseName}`)
      }
      updatedCount++
    } else {
      console.log(`❌ 未找到中文翻译: ${tag.slug} (${tag.name})`)
      notFoundCount++
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`✅ 更新完成: ${updatedCount} 个标签`)
  console.log(`❌ 未找到中文翻译: ${notFoundCount} 个标签`)
  console.log("=".repeat(50))
}

updateTagTranslations()
  .catch((error) => {
    console.error("❌ 错误:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
