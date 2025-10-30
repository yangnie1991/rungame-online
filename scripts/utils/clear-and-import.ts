/**
 * 清除现有游戏数据并重新导入
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearGames() {
  console.log('🗑️  正在清除现有游戏数据...\n')

  // 按依赖顺序删除
  await prisma.gameTranslation.deleteMany({})
  console.log('✅ 已清除游戏翻译')

  await prisma.gameCategory.deleteMany({})
  console.log('✅ 已清除游戏分类关联')

  await prisma.gameTag.deleteMany({})
  console.log('✅ 已清除游戏标签关联')

  await prisma.game.deleteMany({})
  console.log('✅ 已清除游戏数据')

  console.log('\n✨ 清除完成！\n')
}

clearGames()
  .then(() => {
    prisma.$disconnect()
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 清除失败:', error)
    prisma.$disconnect()
    process.exit(1)
  })
