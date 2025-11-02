import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 标签图标映射表
const tagIconMapping: Record<string, string> = {
  // 玩家类型
  "multiplayer": "👥",
  "single-player": "👤",
  "2-player": "🤝",
  "cooperative": "🤝",

  // 游戏类型
  "3d": "🎮",
  "2d": "🕹️",
  "pixel": "🎨",
  "retro": "👾",
  "arcade": "🕹️",

  // 难度/挑战
  "hard": "💪",
  "easy": "😊",
  "challenging": "🏆",
  "casual": "☕",

  // 速度
  "fast-paced": "⚡",
  "slow": "🐌",
  "quick": "⏱️",
  "time-attack": "⏰",

  // 游戏元素
  "puzzle": "🧩",
  "strategy": "♟️",
  "adventure": "🗺️",
  "action": "⚔️",
  "shooting": "🎯",
  "first-person-shooter": "🎯",
  "racing": "🏁",
  "sports": "⚽",
  "fighting": "🥊",
  "simulation": "🎮",
  "rpg": "🐉",
  "platformer": "🪜",
  "tower-defense": "🏰",
  "card": "🃏",
  "board": "🎲",
  "trivia": "❓",
  "quiz": "❓",
  "word": "📝",
  "math": "🔢",
  "physics": "⚗️",
  "music": "🎵",
  "rhythm": "🎶",
  "dance": "💃",

  // 主题
  "zombie": "🧟",
  "horror": "👻",
  "scary": "😱",
  "monster": "👹",
  "fantasy": "🧙",
  "medieval": "⚔️",
  "space": "🚀",
  "alien": "👽",
  "robot": "🤖",
  "ninja": "🥷",
  "pirate": "🏴‍☠️",
  "western": "🤠",
  "war": "💣",
  "military": "🎖️",
  "superhero": "🦸",
  "anime": "🎌",
  "cartoon": "🎨",
  "cute": "🐱",
  "funny": "😄",
  "educational": "📚",
  "kids": "👶",
  "christmas": "🎄",
  "halloween": "🎃",
  "easter": "🐰",
  "valentine": "💝",

  // 游戏机制
  "clicker": "👆",
  "idle": "😴",
  "incremental": "📈",
  "sandbox": "🏖️",
  "open-world": "🌍",
  "survival": "🔥",
  "crafting": "🔨",
  "building": "🏗️",
  "management": "📊",
  "tycoon": "💰",
  "city-building": "🏙️",
  "farming": "🌾",
  "cooking": "👨‍🍳",
  "driving": "🚗",
  "parking": "🅿️",
  "flying": "✈️",
  "swimming": "🏊",
  "running": "🏃",
  "jumping": "🦘",
  "climbing": "🧗",

  // 武器/工具
  "gun": "🔫",
  "sword": "⚔️",
  "bow": "🏹",
  "magic": "✨",
  "bomb": "💣",
  "tank": "🪖",
  "car": "🚗",
  "bike": "🚲",
  "truck": "🚚",
  "plane": "✈️",
  "helicopter": "🚁",
  "boat": "⛵",

  // 动物
  "cat": "🐱",
  "dog": "🐕",
  "bird": "🐦",
  "fish": "🐠",
  "dragon": "🐉",
  "dinosaur": "🦕",
  "animal": "🦁",
  "pet": "🐾",

  // 环境
  "snow": "❄️",
  "ice": "🧊",
  "water": "💧",
  "fire": "🔥",
  "nature": "🌳",
  "forest": "🌲",
  "desert": "🏜️",
  "ocean": "🌊",
  "mountain": "⛰️",
  "island": "🏝️",
  "city": "🏙️",
  "school": "🏫",
  "hospital": "🏥",
  "restaurant": "🍽️",

  // 食物
  "food": "🍔",
  "pizza": "🍕",
  "cake": "🎂",
  "candy": "🍬",
  "fruit": "🍎",

  // 球类运动
  "football": "⚽",
  "basketball": "🏀",
  "baseball": "⚾",
  "tennis": "🎾",
  "golf": "⛳",
  "bowling": "🎳",
  "pool": "🎱",
  "soccer": "⚽",

  // 其他
  "stickman": "🚶",
  "match-3": "💎",
  "bubble": "🫧",
  "ball": "⚽",
  "block": "🧱",
  "color": "🎨",
  "drawing": "✏️",
  "cool": "😎",
  "skill": "🎯",
  "battle": "⚔️",
  "crazy": "🤪",
  "shooter": "🔫",
  "addictive": "🎮",
  "runner": "🏃",
  "hyper-casual": "🎮",
  "mining": "⛏️",
  "minecraft": "🟫",
  "brain": "🧠",
  "tetris": "🟦",
  "mobile": "📱",
  "fun": "🎉",
  "boxing": "🥊",
  "robots": "🤖",
  "tap": "👆",
  "games-for-girls": "👧",
  "drifting": "💨",
  "gdevelop": "🎮",
  "flight": "✈️",
  "dress-up": "👗",
  "makeover": "💄",
  "beauty": "💅",
  "fashion": "👠",
  "wedding": "💒",
  "baby": "👶",
  "doctor": "👨‍⚕️",
  "dentist": "🦷",
  "surgery": "💉",
  "escape": "🚪",
  "hidden-object": "🔍",
  "point-and-click": "👆",
  "stealth": "🕵️",
  "sniper": "🎯",
  "maze": "🌀",
  "reflex": "⚡",
  "memory": "🧠",
  "logic": "🧩",
}

async function updateTagIcons() {
  console.log("🏷️  开始更新标签图标...")

  // 获取所有标签
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
    },
  })

  console.log(`📊 找到 ${tags.length} 个标签`)

  let updatedCount = 0
  let skippedCount = 0
  let notFoundCount = 0

  for (const tag of tags) {
    // 如果已有图标，跳过
    if (tag.icon) {
      console.log(`⏭️  跳过 ${tag.slug} (已有图标: ${tag.icon})`)
      skippedCount++
      continue
    }

    // 尝试从映射表中找到图标
    const icon = tagIconMapping[tag.slug.toLowerCase()]

    if (icon) {
      await prisma.tag.update({
        where: { id: tag.id },
        data: { icon },
      })
      console.log(`✅ 更新 ${tag.slug} → ${icon}`)
      updatedCount++
    } else {
      console.log(`❌ 未找到图标: ${tag.slug} (${tag.name})`)
      notFoundCount++
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log(`✅ 更新完成: ${updatedCount} 个标签`)
  console.log(`⏭️  跳过: ${skippedCount} 个标签 (已有图标)`)
  console.log(`❌ 未找到图标: ${notFoundCount} 个标签`)
  console.log("=".repeat(50))
}

updateTagIcons()
  .catch((error) => {
    console.error("❌ 错误:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
