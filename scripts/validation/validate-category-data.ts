/**
 * 分类数据验证脚本
 *
 * 验证内容：
 * 1. 所有游戏都有至少一个分类
 * 2. 所有 mainCategoryId 都正确指向主分类
 * 3. 没有孤立的 GameCategory 记录
 * 4. 分类层级关系正确
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

async function main() {
  console.log('🔍 开始验证分类数据...\n')

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  }

  try {
    // 1. 检查是否有游戏没有分类
    console.log('📝 检查 1: 验证所有游戏都有分类...')
    const gamesWithoutCategories = await prisma.game.findMany({
      where: {
        gameCategories: {
          none: {},
        },
        status: {
          not: 'DRAFT', // 草稿状态的游戏可以没有分类
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
      },
    })

    if (gamesWithoutCategories.length > 0) {
      result.errors.push(`发现 ${gamesWithoutCategories.length} 个非草稿游戏没有分类`)
      result.passed = false
      console.error(`   ❌ 失败: ${gamesWithoutCategories.length} 个游戏没有分类`)
      gamesWithoutCategories.slice(0, 5).forEach(game => {
        console.error(`      - ${game.slug} (${game.title}) - 状态: ${game.status}`)
      })
      if (gamesWithoutCategories.length > 5) {
        console.error(`      ... 还有 ${gamesWithoutCategories.length - 5} 个`)
      }
    } else {
      console.log('   ✅ 通过: 所有已发布的游戏都有分类')
    }

    // 2. 检查 mainCategoryId 是否正确
    console.log('\n📝 检查 2: 验证 mainCategoryId 正确性...')

    const allGameCategories = await prisma.gameCategory.findMany({
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
            parentId: true,
          },
        },
        mainCategory: {
          select: {
            id: true,
            slug: true,
            name: true,
            parentId: true,
          },
        },
      },
    })

    let incorrectMainCategoryCount = 0

    for (const gc of allGameCategories) {
      // mainCategory 必须是主分类（parentId 为 null）
      if (gc.mainCategory.parentId !== null) {
        result.errors.push(`GameCategory ${gc.id}: mainCategory ${gc.mainCategory.slug} 不是主分类`)
        incorrectMainCategoryCount++
        result.passed = false
      }

      // 如果 category 有 parentId，mainCategoryId 应该等于 category.parentId
      if (gc.category.parentId && gc.mainCategoryId !== gc.category.parentId) {
        result.errors.push(
          `GameCategory ${gc.id}: mainCategoryId ${gc.mainCategoryId} 应该是 ${gc.category.parentId} (${gc.category.name} 的父分类)`
        )
        incorrectMainCategoryCount++
        result.passed = false
      }

      // 如果 category 没有 parentId，说明它本身是主分类，mainCategoryId 应该等于 categoryId
      if (!gc.category.parentId && gc.mainCategoryId !== gc.categoryId) {
        result.errors.push(
          `GameCategory ${gc.id}: category ${gc.category.slug} 是主分类，mainCategoryId 应该等于 categoryId`
        )
        incorrectMainCategoryCount++
        result.passed = false
      }
    }

    if (incorrectMainCategoryCount > 0) {
      console.error(`   ❌ 失败: ${incorrectMainCategoryCount} 个 mainCategoryId 不正确`)
      result.errors.slice(0, 5).forEach(err => console.error(`      - ${err}`))
      if (result.errors.length > 5) {
        console.error(`      ... 还有 ${result.errors.length - 5} 个错误`)
      }
    } else {
      console.log('   ✅ 通过: 所有 mainCategoryId 都正确')
    }

    // 3. 检查孤立记录（使用原始 SQL 查询）
    console.log('\n📝 检查 3: 验证没有孤立的 GameCategory 记录...')

    const orphanedRecords = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM game_categories gc
      WHERE NOT EXISTS (SELECT 1 FROM games WHERE id = gc.game_id)
         OR NOT EXISTS (SELECT 1 FROM categories WHERE id = gc.category_id)
         OR NOT EXISTS (SELECT 1 FROM categories WHERE id = gc.main_category_id)
    `

    const orphanedCount = Number(orphanedRecords[0].count)

    if (orphanedCount > 0) {
      result.errors.push(`发现 ${orphanedCount} 个孤立的 GameCategory 记录`)
      result.passed = false
      console.error(`   ❌ 失败: ${orphanedCount} 个孤立记录`)
    } else {
      console.log('   ✅ 通过: 没有孤立的 GameCategory 记录')
    }

    // 4. 检查分类层级
    console.log('\n📝 检查 4: 验证分类层级结构...')

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        subCategories: true,
      },
    })

    let hierarchyErrors = 0

    for (const category of categories) {
      // 检查是否有超过两层的层级
      if (category.parent?.parentId) {
        result.errors.push(`分类 ${category.slug} 有三层或更多层级`)
        hierarchyErrors++
        result.passed = false
      }

      // 检查子分类是否启用了但父分类未启用
      if (!category.isEnabled && category.parentId) {
        const parentEnabled = categories.find(c => c.id === category.parentId)?.isEnabled
        if (parentEnabled) {
          result.warnings.push(`子分类 ${category.slug} 已禁用，但父分类已启用`)
        }
      }
    }

    if (hierarchyErrors > 0) {
      console.error(`   ❌ 失败: ${hierarchyErrors} 个层级错误`)
    } else {
      console.log('   ✅ 通过: 分类层级结构正确（最多两层）')
    }

    // 5. 统计信息
    console.log('\n📊 统计信息:')

    const stats = {
      totalGames: await prisma.game.count(),
      publishedGames: await prisma.game.count({ where: { status: 'PUBLISHED' } }),
      totalCategories: await prisma.category.count(),
      mainCategories: await prisma.category.count({ where: { parentId: null } }),
      subCategories: await prisma.category.count({ where: { parentId: { not: null } } }),
      totalGameCategories: await prisma.gameCategory.count(),
      gamesWithMultipleCategories: await prisma.game.count({
        where: {
          gameCategories: {
            some: {
              id: { not: '' },
            },
          },
        },
      }),
    }

    console.table(stats)

    // 6. 最终结果
    console.log('\n' + '='.repeat(50))

    if (result.passed) {
      console.log('✅ 验证通过！所有检查都成功。')
    } else {
      console.error('❌ 验证失败！请检查以上错误。')
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  ${result.warnings.length} 个警告:`)
      result.warnings.forEach(warning => console.warn(`   - ${warning}`))
    }

    console.log('='.repeat(50) + '\n')

    // 返回退出码
    process.exit(result.passed ? 0 : 1)

  } catch (error) {
    console.error('\n❌ 验证过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
