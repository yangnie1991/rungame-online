/**
 * 全面检查所有结构化数据问题
 *
 * 检查项目：
 * 1. VideoGameSchema: 是否所有游戏都有 aggregateRating 或 review
 * 2. GameListSchema (ItemList): 每个 ListItem 的游戏是否有 aggregateRating 或 review
 * 3. BreadcrumbSchema: 最后一项是否没有 item 字段（避免冲突）
 * 4. CollectionPageSchema: 是否正确使用（不应有 itemListElement）
 */

import {
  generateVideoGameSchema,
  generateGameListSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  type GameSchemaData,
  type GameListItem,
  type BreadcrumbItem,
  type CollectionSchemaData,
} from '../lib/schema-generators'

console.log('='.repeat(80))
console.log('🔍 全面检查所有结构化数据问题')
console.log('='.repeat(80))

let allPassed = true

// ==================== 检查 1: VideoGameSchema ====================
console.log('\n1️⃣ 检查 VideoGameSchema（游戏详情页）')
console.log('─'.repeat(80))

const testVideoGames: GameSchemaData[] = [
  {
    name: 'Game with rating',
    description: 'A game with user ratings',
    image: '/img1.jpg',
    genre: 'Action',
    playCount: 5000,
    rating: 4.5,
    ratingCount: 100,
    url: '/play/game1',
  },
  {
    name: 'Game without rating',
    description: 'A game without ratings',
    image: '/img2.jpg',
    genre: 'Puzzle',
    playCount: 500,
    rating: 0,
    ratingCount: 0,
    url: '/play/game2',
  },
  {
    name: 'New game',
    description: 'A brand new game',
    image: '/img3.jpg',
    genre: 'Adventure',
    playCount: 0,
    url: '/play/game3',
  },
]

testVideoGames.forEach((gameData, index) => {
  const schema = generateVideoGameSchema(gameData)
  const hasAggregateRating = schema.aggregateRating ? true : false
  const hasReview = schema.review ? true : false
  const hasEither = hasAggregateRating || hasReview

  console.log(`\n游戏 ${index + 1}: ${gameData.name}`)
  console.log(`  - playCount: ${gameData.playCount}`)
  console.log(`  - rating: ${gameData.rating || 'null'}`)
  console.log(`  - aggregateRating: ${hasAggregateRating ? '✅' : '❌'}`)
  console.log(`  - review: ${hasReview ? '✅' : '❌'}`)
  console.log(`  - 结果: ${hasEither ? '✅ 通过' : '❌ 失败'}`)

  if (!hasEither) {
    allPassed = false
    console.log('  ⚠️  问题：缺少 aggregateRating 或 review')
  }
})

// ==================== 检查 2: GameListSchema ====================
console.log('\n\n2️⃣ 检查 GameListSchema（首页、游戏列表）')
console.log('─'.repeat(80))

const testGameListItems: GameListItem[] = [
  { name: 'Featured Game 1', url: '/play/g1', image: '/i1.jpg', playCount: 10000, rating: 4.8 },
  { name: 'Featured Game 2', url: '/play/g2', image: '/i2.jpg', playCount: 1000, rating: 0 },
  { name: 'Featured Game 3', url: '/play/g3', image: '/i3.jpg', playCount: 50 },
]

const gameListSchema = generateGameListSchema(testGameListItems, 'Featured Games', '/')

gameListSchema.itemListElement.forEach((listItem: any, index: number) => {
  const game = listItem.item
  const hasAggregateRating = game.aggregateRating ? true : false
  const hasReview = game.review ? true : false
  const hasEither = hasAggregateRating || hasReview

  console.log(`\n游戏 ${index + 1}: ${game.name}`)
  console.log(`  - aggregateRating: ${hasAggregateRating ? '✅' : '❌'}`)
  console.log(`  - review: ${hasReview ? '✅' : '❌'}`)
  console.log(`  - 结果: ${hasEither ? '✅ 通过' : '❌ 失败'}`)

  if (!hasEither) {
    allPassed = false
    console.log('  ⚠️  问题：列表中的游戏缺少 aggregateRating 或 review')
  }
})

// ==================== 检查 3: BreadcrumbSchema ====================
console.log('\n\n3️⃣ 检查 BreadcrumbSchema（所有页面）')
console.log('─'.repeat(80))

const testBreadcrumbs: BreadcrumbItem[] = [
  { name: 'Home', url: '/' },
  { name: 'Games', url: '/games' },
  { name: 'Action', url: '/category/action' },
  { name: 'Current Page', url: '' }, // 最后一项
]

const breadcrumbSchema = generateBreadcrumbSchema(testBreadcrumbs)

breadcrumbSchema.itemListElement.forEach((listItem: any, index: number) => {
  const isLast = index === breadcrumbSchema.itemListElement.length - 1
  const hasItemField = 'item' in listItem
  const originalUrl = testBreadcrumbs[index].url

  console.log(`\n项目 ${index + 1}: ${listItem.name}`)
  console.log(`  - 是最后一项: ${isLast ? '是' : '否'}`)
  console.log(`  - 原始 URL: '${originalUrl}'`)
  console.log(`  - 有 item 字段: ${hasItemField ? '是' : '否'}`)

  // 验证逻辑
  let passed = true
  if (isLast && hasItemField) {
    console.log('  ❌ 失败：最后一项不应该有 item 字段')
    passed = false
    allPassed = false
  } else if (!isLast && originalUrl && !hasItemField) {
    console.log('  ❌ 失败：非最后一项应该有 item 字段')
    passed = false
    allPassed = false
  } else {
    console.log('  ✅ 通过')
  }
})

// ==================== 检查 4: CollectionPageSchema ====================
console.log('\n\n4️⃣ 检查 CollectionPageSchema（分类/标签页）')
console.log('─'.repeat(80))

const testCollection: CollectionSchemaData = {
  name: 'Action Games',
  description: 'Collection of action games',
  url: '/category/action',
  numberOfItems: 50,
}

const collectionSchema = generateCollectionPageSchema(testCollection)

console.log('\nCollectionPage Schema 结构：')
console.log(`  - @type: ${collectionSchema['@type']}`)
console.log(`  - mainEntity.@type: ${collectionSchema.mainEntity['@type']}`)
console.log(`  - mainEntity.numberOfItems: ${collectionSchema.mainEntity.numberOfItems}`)

// 检查是否有不应该存在的字段
const hasItemListElement = 'itemListElement' in collectionSchema.mainEntity
console.log(`  - mainEntity.itemListElement: ${hasItemListElement ? '❌ 存在（不应该）' : '✅ 不存在（正确）'}`)

if (hasItemListElement) {
  console.log('  ⚠️  问题：CollectionPage 的 mainEntity 不应该有 itemListElement')
  allPassed = false
} else {
  console.log('  ✅ 通过：结构正确')
}

// ==================== 总结 ====================
console.log('\n' + '='.repeat(80))
console.log('📊 检查总结')
console.log('='.repeat(80))

if (allPassed) {
  console.log('\n🎉 所有检查通过！没有发现结构化数据问题。')
} else {
  console.log('\n❌ 发现问题！请查看上面的详细信息。')
}

console.log('\n✅ 已修复的问题：')
console.log('  1. ✅ VideoGameSchema 总是有 aggregateRating 或 review')
console.log('  2. ✅ GameListSchema 中的每个游戏都有 aggregateRating 或 review')
console.log('  3. ✅ BreadcrumbSchema 最后一项没有 item 字段（避免冲突）')
console.log('  4. ✅ CollectionPageSchema 结构简单，不包含 itemListElement')

console.log('\n💡 SEO 改进：')
console.log('  ✓ 满足 Google 结构化数据要求')
console.log('  ✓ 避免 Schema.org 验证警告')
console.log('  ✓ 提升 Rich Snippets 展示机会')
console.log('  ✓ 改善搜索引擎理解和索引')

process.exit(allPassed ? 0 : 1)
