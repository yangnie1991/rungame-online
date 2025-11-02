/**
 * SEO 模板生成器
 *
 * 统一管理所有分类、标签、游戏的SEO元数据生成规则
 * 避免在数据库中存储重复的固定内容
 */

// ==================== 辅助函数 ====================

/**
 * 根据游戏数量返回合适的范围文本（英文）
 */
function getGameCountRangeEn(count: number): string {
  if (count === 0) return 'Explore'
  if (count < 10) return 'Play'
  if (count < 50) return 'Play 10+'
  if (count < 100) return 'Play 50+'
  if (count < 500) return 'Play 100+'
  if (count < 1000) return 'Play 500+'
  return 'Play 1000+'
}

/**
 * 根据游戏数量返回合适的范围文本（中文）
 */
function getGameCountRangeZh(count: number): string {
  if (count === 0) return '探索'
  if (count < 10) return '畅玩'
  if (count < 50) return '畅玩10+'
  if (count < 100) return '畅玩50+'
  if (count < 500) return '畅玩100+'
  if (count < 1000) return '畅玩500+'
  return '畅玩1000+'
}

// ==================== 分类 SEO 模板 ====================

interface CategorySEOInput {
  name: string
  zhName?: string
  gameCount: number
  isMainCategory: boolean
  description?: string
}

/**
 * 生成分类标题
 */
export function generateCategoryTitle(
  category: CategorySEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    const zhName = category.zhName || category.name
    return `${zhName}游戏 - 免费在线畅玩网页游戏`
  }

  // 英文
  if (category.isMainCategory) {
    const range = getGameCountRangeEn(category.gameCount)
    return `${category.name} Browser Games - ${range} Free Online`
  } else {
    return `${category.name} Games - Free Browser Games`
  }
}

/**
 * 生成分类描述
 */
export function generateCategoryDescription(
  category: CategorySEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    const zhName = category.zhName || category.name
    const range = getGameCountRangeZh(category.gameCount)
    const countText = category.gameCount >= 10
      ? range.replace('畅玩', '').trim() + '款'
      : ''

    if (category.isMainCategory) {
      return `${range}${countText}免费${zhName}游戏！快节奏动作、精彩玩法、网页浏览器即玩。无需下载，每周新增游戏！`
    } else {
      return `在线畅玩免费${zhName}游戏！精彩的${zhName}玩法，网页浏览器即玩。无需下载，立即开始！`
    }
  }

  // 英文
  const range = getGameCountRangeEn(category.gameCount)
  const countText = category.gameCount >= 10
    ? range.replace('Play', '').replace('Explore', '').trim() + ' '
    : ''

  if (category.isMainCategory) {
    return `${range} ${countText}free ${category.name.toLowerCase()} browser games online! Fast-paced action, exciting gameplay, and instant fun. No downloads required, play instantly in your browser. New games added weekly!`
  } else {
    return `Play free ${category.name.toLowerCase()} games online! Exciting ${category.name.toLowerCase()} action in your browser. No downloads required, instant play. Start playing now!`
  }
}

/**
 * 生成分类的固定关键词（基础SEO关键词）
 */
export function generateCategoryBaseKeywords(
  category: CategorySEOInput,
  locale: string
): string[] {
  if (locale === 'zh') {
    const zhName = category.zhName || category.name
    return [
      `${zhName}游戏`,
      `免费${zhName}游戏`,
      `在线${zhName}游戏`,
      `${zhName}网页游戏`,
      `${zhName}浏览器游戏`,
    ]
  }

  // 英文
  const name = category.name.toLowerCase()
  if (category.isMainCategory) {
    return [
      `${name} games`,
      `free ${name} games`,
      `${name} browser games`,
      `online ${name} games`,
      `free browser games`,
    ]
  } else {
    return [
      `${name} games`,
      `free ${name}`,
      `online ${name} games`,
      `browser games`,
    ]
  }
}

/**
 * 合并固定关键词和个性关键词
 * @param baseKeywords - 固定关键词（数组）
 * @param customKeywords - 个性关键词（字符串，逗号分隔，可选）
 * @returns 完整的关键词字符串
 */
export function combineKeywords(
  baseKeywords: string[],
  customKeywords?: string | null
): string {
  // 固定关键词
  const keywords = [...baseKeywords]

  // 添加个性关键词（如果有）
  if (customKeywords) {
    const customList = customKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
    keywords.push(...customList)
  }

  // 总是在最后添加品牌名
  keywords.push('RunGame')

  // 去重并返回
  const uniqueKeywords = [...new Set(keywords)]
  return uniqueKeywords.join(', ')
}

/**
 * 生成分类关键词（固定关键词 + 个性关键词）
 */
export function generateCategoryKeywords(
  category: CategorySEOInput & { customKeywords?: string | null },
  locale: string
): string {
  const baseKeywords = generateCategoryBaseKeywords(category, locale)
  return combineKeywords(baseKeywords, category.customKeywords)
}

/**
 * 生成完整的分类SEO数据
 */
export function generateCategorySEO(
  category: CategorySEOInput & { customKeywords?: string | null },
  locale: string
) {
  return {
    title: generateCategoryTitle(category, locale),
    description: generateCategoryDescription(category, locale),
    keywords: generateCategoryKeywords(category, locale),
  }
}

// ==================== 标签 SEO 模板 ====================

interface TagSEOInput {
  name: string
  zhName?: string
  gameCount: number
}

/**
 * 生成标签标题
 */
export function generateTagTitle(
  tag: TagSEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    const zhName = tag.zhName || tag.name
    return `${zhName}游戏 - 免费在线畅玩网页游戏`
  }

  // 英文
  return `${tag.name} Games - Play Free in Browser`
}

/**
 * 生成标签描述
 */
export function generateTagDescription(
  tag: TagSEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    const zhName = tag.zhName || tag.name
    const range = getGameCountRangeZh(tag.gameCount)
    const countText = tag.gameCount >= 10
      ? range.replace('畅玩', '').trim() + '款'
      : ''

    return `${range}${countText}免费${zhName}游戏！精彩的${zhName}玩法，网页浏览器即玩。无需下载，立即开始！`
  }

  // 英文
  const range = getGameCountRangeEn(tag.gameCount)
  const countText = tag.gameCount >= 10
    ? range.replace('Play', '').replace('Explore', '').trim() + ' '
    : ''

  return `${range} ${countText}free ${tag.name.toLowerCase()} games online! Exciting ${tag.name.toLowerCase()} gameplay in your browser. No downloads required, instant play. Start playing now!`
}

/**
 * 生成标签的固定关键词（基础SEO关键词）
 */
export function generateTagBaseKeywords(
  tag: TagSEOInput,
  locale: string
): string[] {
  if (locale === 'zh') {
    const zhName = tag.zhName || tag.name
    return [
      `${zhName}游戏`,
      `${zhName}在线游戏`,
      `免费${zhName}游戏`,
      `${zhName}网页游戏`,
    ]
  }

  // 英文
  const name = tag.name.toLowerCase()
  return [
    `${name} games`,
    `${name} browser games`,
    `free ${name} games`,
    `online ${name} games`,
  ]
}

/**
 * 生成标签关键词（固定关键词 + 个性关键词）
 */
export function generateTagKeywords(
  tag: TagSEOInput & { customKeywords?: string | null },
  locale: string
): string {
  const baseKeywords = generateTagBaseKeywords(tag, locale)
  return combineKeywords(baseKeywords, tag.customKeywords)
}

/**
 * 生成完整的标签SEO数据
 */
export function generateTagSEO(
  tag: TagSEOInput & { customKeywords?: string | null },
  locale: string
) {
  return {
    title: generateTagTitle(tag, locale),
    description: generateTagDescription(tag, locale),
    keywords: generateTagKeywords(tag, locale),
  }
}

// ==================== 游戏 SEO 模板 ====================

interface GameSEOInput {
  title: string
  categoryName: string
  description?: string
}

/**
 * 生成游戏标题
 */
export function generateGameTitle(
  game: GameSEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    return `${game.title} - 免费在线玩网页游戏`
  }

  // 英文
  return `${game.title} - Play Free Online`
}

/**
 * 生成游戏描述
 */
export function generateGameDescription(
  game: GameSEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    return game.description || `在线免费玩${game.title}！精彩的${game.categoryName}游戏，网页浏览器即玩，无需下载。立即开始游戏！`
  }

  // 英文
  return game.description || `Play ${game.title} free online! Exciting ${game.categoryName.toLowerCase()} game in your browser. No downloads required, instant play. Start playing now!`
}

/**
 * 生成游戏关键词
 */
export function generateGameKeywords(
  game: GameSEOInput,
  locale: string
): string {
  if (locale === 'zh') {
    return `${game.title}, ${game.title}在线玩, 免费${game.categoryName}游戏, 网页游戏, RunGame`
  }

  // 英文
  return `${game.title}, ${game.title.toLowerCase()} online, free ${game.categoryName.toLowerCase()} games, browser games, RunGame`
}

/**
 * 生成完整的游戏SEO数据
 */
export function generateGameSEO(
  game: GameSEOInput,
  locale: string
) {
  return {
    title: generateGameTitle(game, locale),
    description: generateGameDescription(game, locale),
    keywords: generateGameKeywords(game, locale),
  }
}
