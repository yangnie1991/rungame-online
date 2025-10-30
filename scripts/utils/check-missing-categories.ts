import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 从 analyze-existing-categories.ts 复制的完整分类列表
const EXPECTED_CATEGORIES = [
  '2048', 'simulation', 'arcade', 'shooter', 'drawing', 'stickman', 'ball',
  'adventure', 'block', 'kids', 'sports', 'fighting', 'educational',
  'basketball', 'memory', 'puzzle', 'racing', 'animal', 'fun', 'retro',
  'trivia', 'christmas', 'runner', 'action', 'idle', 'parkour', 'robots',
  'golf', 'board', 'match-3', 'snake', 'platformer', 'monster', 'strategy',
  'tanks', 'mobile', 'math', 'addictive', 'clicker', 'casual', 'io',
  'halloween', 'hyper-casual', 'war', 'scary', 'skill', 'dinosaur',
  'first-person-shooter', 'car', 'two-player', 'driving', 'dirt-bike',
  'flight', 'survival', 'skibidi-toilet', 'brain', 'jigsaw-puzzles', 'money',
  'sniper', 'building', 'skateboard', 'music', 'battle', 'cats', 'archery',
  'chess', 'horror', 'granny', 'tap', 'card', 'fashion', 'management',
  'gangster', 'zombie', 'escape', 'tetris', 'airplane', 'hidden-object',
  'jewel', 'pixel', 'soccer', 'coloring', 'surgery', 'spinner', 'baseball',
  'fishing', 'bowling', 'hunting', 'classics', 'dress-up', 'minecraft', 'cooking',
  'ninja', 'farming', 'bike', 'mermaid', 'games-for-girls', 'multiplayer',
  'crazy', 'baby', 'hair-salon', 'jumping', 'boxing', 'gun', 'pirates',
  'tycoon', 'naval', 'rpg', 'bejeweled', 'word', 'parking', 'wrestling',
  'worm', 'mining', 'battle-royale', 'offroad', 'ninja-turtle', 'truck',
  'flash', 'princess', 'world-cup', 'cricket', 'drifting', 'bubble-shooter',
  'solitaire', 'pool', 'mahjong', 'anime', 'dragons', 'mario', 'mmorpg',
  'police', 'makeup', 'sword', 'checkers', 'restaurant', 'junior',
  'fire-and-water', 'knight', 'coding', 'gdevelop', 'cool', 'horse',
  'scrabble', 'hockey', 'piano', 'city-building', 'barbie', 'sharks',
  'open-world', 'family', 'helicopter'
]

async function main() {
  console.log('🔍 检查缺失的分类...\n')
  console.log(`期望的分类数量: ${EXPECTED_CATEGORIES.length}`)

  // 查询数据库中所有分类
  const existingCategories = await prisma.category.findMany({
    select: { slug: true },
  })

  const existingSlugs = new Set(existingCategories.map(c => c.slug))
  console.log(`数据库中的分类数量: ${existingSlugs.size}\n`)

  // 找出缺失的分类
  const missingCategories = EXPECTED_CATEGORIES.filter(slug => !existingSlugs.has(slug))

  if (missingCategories.length > 0) {
    console.log(`❌ 缺失 ${missingCategories.length} 个分类:\n`)
    missingCategories.forEach((slug, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${slug}`)
    })
  } else {
    console.log('✅ 所有期望的分类都存在')
  }

  // 找出多余的分类（数据库中有但期望列表中没有的）
  const expectedSet = new Set(EXPECTED_CATEGORIES)
  const extraCategories = existingCategories.filter(c => !expectedSet.has(c.slug))

  if (extraCategories.length > 0) {
    console.log(`\n⚠️  数据库中有 ${extraCategories.length} 个意外的分类:\n`)
    extraCategories.forEach((cat, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${cat.slug}`)
    })
  }

  await prisma.$disconnect()
}

main()
