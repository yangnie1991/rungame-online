/**
 * SEO 内容生成辅助函数
 *
 * 包含字数计算、关键词分析、多语言支持等工具函数
 * 专门用于 AI 内容生成的 SEO 优化
 */

/**
 * 根据语言调整目标字数
 *
 * 不同语言的字符密度不同：
 * - 中文: 字符密度高，字数乘以 0.6
 * - 英文: 基准，字数乘以 1.0
 * - 西班牙语/法语: 略多，字数乘以 1.1
 *
 * @param baseCount - 基础字数（英文标准）
 * @param locale - 语言代码
 * @returns 调整后的字数
 *
 * @example
 * getTargetWordCount(100, 'zh') // 60
 * getTargetWordCount(100, 'en') // 100
 */
export function getTargetWordCount(
  baseCount: number,
  locale: string
): number {
  const multipliers: Record<string, number> = {
    'zh': 0.6,   // 中文
    'en': 1.0,   // 英文（基准）
    'es': 1.1,   // 西班牙语
    'fr': 1.1    // 法语
  }

  const multiplier = multipliers[locale] || 1.0
  return Math.round(baseCount * multiplier)
}

/**
 * 获取默认的字段字数配置
 *
 * SEO 最佳实践的字数/字符范围：
 * - description: 20-30 词（简短描述）
 * - longDescription: 80-120 词（详细描述）
 * - metaTitle: 50-60 字符（SEO 标题）
 * - metaDescription: 150-160 字符（SEO 描述）
 * - keywords: 5-10 个关键词
 * - controls: 120 词（操作说明）
 * - howToPlay: 280 词（玩法介绍）
 * - gameDetails: 350 词（详细信息）
 * - extras: 180 词（补充内容）
 * - 总计: ~1100 词（符合 SEO 最佳实践 800-1500 词）
 *
 * @param locale - 语言代码
 * @returns 字段字数/字符配置对象
 *
 * @example
 * const wordCount = getDefaultWordCount('zh')
 * console.log(wordCount.controls) // 72 (120 * 0.6)
 */
export function getDefaultWordCount(locale: string) {
  return {
    // SEO 和元数据字段（字符数，不受语言影响）
    description: getTargetWordCount(25, locale),        // 20-30 词（简短描述）
    longDescription: getTargetWordCount(100, locale),   // 80-120 词（详细描述）
    metaTitle: 60,                                      // 50-60 字符（SEO 标题）
    metaDescription: 155,                               // 150-160 字符（SEO 描述）
    keywords: 8,                                        // 5-10 个关键词

    // 富文本内容字段（受语言影响）
    controls: getTargetWordCount(120, locale),          // 120 词（操作说明）
    howToPlay: getTargetWordCount(280, locale),         // 280 词（玩法介绍）
    gameDetails: getTargetWordCount(350, locale),       // 350 词（详细信息）
    extras: getTargetWordCount(180, locale)             // 180 词（补充内容）
  }
}

/**
 * 分析生成内容的 SEO 元数据
 *
 * 统计：
 * - 主关键词出现次数和密度
 * - 副关键词使用情况
 * - 总字数
 * - 预计阅读时间
 *
 * @param results - 生成的内容对象
 * @param mainKeyword - 主关键词
 * @param subKeywords - 副关键词数组
 * @returns SEO 元数据对象
 */
export function analyzeSeoMetadata(
  results: Record<string, string>,
  mainKeyword: string,
  subKeywords: string[]
) {
  const mainKeywordCount: Record<string, number> = { total: 0 }
  let totalWords = 0
  const subKeywordsUsed: Set<string> = new Set()

  // 分析每个字段
  Object.entries(results).forEach(([field, content]) => {
    // 移除 HTML 标签，得到纯文本
    const text = content.replace(/<[^>]+>/g, ' ')

    // 统计字数
    const words = text.split(/\s+/).filter(w => w.length > 0)
    totalWords += words.length

    // 统计主关键词出现次数（不区分大小写）
    const mainRegex = new RegExp(mainKeyword, 'gi')
    const mainMatches = text.match(mainRegex) || []
    mainKeywordCount[field] = mainMatches.length
    mainKeywordCount.total += mainMatches.length

    // 统计使用了哪些副关键词
    subKeywords.forEach(subKeyword => {
      const subRegex = new RegExp(subKeyword, 'i')
      if (subRegex.test(text)) {
        subKeywordsUsed.add(subKeyword)
      }
    })
  })

  // 计算主关键词密度
  const density = totalWords > 0
    ? ((mainKeywordCount.total / totalWords) * 100).toFixed(2) + '%'
    : '0%'

  // 预计阅读时间（假设每分钟 200 词）
  const readingTime = Math.ceil(totalWords / 200)

  return {
    mainKeyword,
    mainKeywordCount,
    mainKeywordDensity: density,
    subKeywordsUsed: Array.from(subKeywordsUsed),
    totalWordCount: totalWords,
    estimatedReadingTime: readingTime
  }
}

/**
 * 获取语言的本地化名称
 *
 * @param locale - 语言代码
 * @returns 语言名称（中文）
 */
export function getLanguageName(locale: string): string {
  const names: Record<string, string> = {
    'en': '英语',
    'zh': '中文',
    'es': '西班牙语',
    'fr': '法语'
  }
  return names[locale] || locale.toUpperCase()
}

/**
 * 字段标签映射（中文）
 */
export const FIELD_LABELS: Record<string, string> = {
  // SEO 和元数据字段
  description: '简短描述',
  longDescription: '详细描述',
  metaTitle: 'SEO 标题',
  metaDescription: 'SEO 描述',
  keywords: '关键词',

  // 富文本内容字段
  controls: '控制方式',
  howToPlay: '如何游玩',
  gameDetails: '详细游戏信息',
  extras: '其他内容'
}

/**
 * 验证关键词密度是否符合 SEO 最佳实践
 *
 * 最佳密度范围：
 * - 主关键词: 2-3%
 * - 所有关键词总计: 5-8%
 *
 * @param density - 关键词密度字符串 (如 "2.5%")
 * @param type - 关键词类型 ('main' | 'all')
 * @returns 是否在最佳范围内
 */
export function isOptimalKeywordDensity(
  density: string,
  type: 'main' | 'all' = 'main'
): boolean {
  const value = parseFloat(density)

  if (type === 'main') {
    return value >= 2.0 && value <= 3.0
  } else {
    return value >= 5.0 && value <= 8.0
  }
}

/**
 * 根据字段类型推荐相关的副关键词
 *
 * 不同字段适合不同类型的关键词：
 * - controls: 操作相关关键词
 * - howToPlay: 玩法相关关键词
 * - gameDetails: 特色相关关键词
 * - extras: 技巧相关关键词
 *
 * @param field - 字段名
 * @param allSubKeywords - 所有副关键词
 * @returns 推荐的副关键词数组（最多 5 个）
 */
export function getRelevantSubKeywords(
  field: string,
  allSubKeywords: string[]
): string[] {
  // 关键词分类规则
  const keywordCategories: Record<string, string[]> = {
    controls: [
      'keyboard', 'mouse', 'touch', 'control', 'button',
      'click', 'drag', 'swipe', 'tap', 'press',
      '键盘', '鼠标', '触摸', '控制', '按键'
    ],
    howToPlay: [
      'play', 'game', 'rule', 'objective', 'goal',
      'level', 'score', 'win', 'challenge', 'gameplay',
      '玩法', '规则', '目标', '关卡', '得分'
    ],
    gameDetails: [
      'feature', 'graphics', 'sound', 'multiplayer', 'single-player',
      'difficulty', 'achievement', 'unlock', 'character', 'weapon',
      '特色', '画面', '音效', '多人', '难度'
    ],
    extras: [
      'tip', 'trick', 'strategy', 'guide', 'tutorial',
      'beginner', 'advanced', 'secret', 'hint', 'FAQ',
      '技巧', '攻略', '指南', '秘密', '提示'
    ]
  }

  const categoryKeywords = keywordCategories[field] || []

  // 筛选匹配的副关键词
  const relevant = allSubKeywords.filter(subKeyword => {
    const lowerKeyword = subKeyword.toLowerCase()
    return categoryKeywords.some(cat =>
      lowerKeyword.includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(lowerKeyword)
    )
  })

  // 如果匹配的少于 3 个，随机补充其他副关键词
  if (relevant.length < 3) {
    const remaining = allSubKeywords.filter(k => !relevant.includes(k))
    const needed = 3 - relevant.length
    relevant.push(...remaining.slice(0, needed))
  }

  // 最多返回 5 个
  return relevant.slice(0, 5)
}

/**
 * 获取字段的内容指南
 *
 * 为每个字段提供明确的内容创作指导
 *
 * @param field - 字段名
 * @returns 内容指南文本
 */
export function getFieldGuidelines(field: string): string {
  const guidelines: Record<string, string> = {
    // SEO 和元数据字段
    description: `
- 1-2句话概括游戏核心
- 突出最吸引人的特点
- 包含主关键词
- 激发玩家兴趣
    `.trim(),

    longDescription: `
- 2-3段详细介绍
- 第一段：游戏背景和主题
- 第二段：核心玩法和特色
- 第三段：目标受众和推荐理由
- 自然融入关键词
    `.trim(),

    metaTitle: `
- 50-60字符以内
- 包含主关键词（最好在前面）
- 突出游戏独特性
- 吸引点击
- 格式: "游戏名 - 特色 | 品牌名"
    `.trim(),

    metaDescription: `
- 150-160字符以内
- 第一句概括游戏
- 包含主关键词和副关键词
- 包含行动号召（如"立即游玩"）
- 吸引搜索用户点击
    `.trim(),

    keywords: `
- 5-10个相关关键词
- 包含游戏名称
- 包含游戏类型
- 包含核心玩法关键词
- 逗号分隔，由高到低重要性排序
    `.trim(),

    // 富文本内容字段
    controls: `
- 明确说明键盘/鼠标/触摸操作
- 列出主要按键功能
- 提供操作技巧
- 适合新手快速上手
    `.trim(),

    howToPlay: `
- 解释游戏目标
- 描述基本规则
- 说明游戏流程
- 提供新手建议
- 包含获胜条件
    `.trim(),

    gameDetails: `
- 突出游戏独特特色
- 描述关卡/模式
- 介绍角色/道具
- 说明难度系统
- 提及视觉和音效
- 包含社交功能（如有）
    `.trim(),

    extras: `
- 提供实用游戏技巧
- 回答常见问题
- 分享高级策略
- 推荐相似游戏
- 包含更新信息
    `.trim()
  }

  return guidelines[field] || ''
}

/**
 * 计算内容的可读性分数（Flesch Reading Ease）
 *
 * 分数范围 0-100：
 * - 90-100: 非常容易
 * - 80-90: 容易
 * - 70-80: 较容易
 * - 60-70: 标准
 * - 50-60: 较难
 * - 30-50: 难
 * - 0-30: 非常难
 *
 * @param content - 内容文本（HTML）
 * @returns 可读性分数
 */
export function calculateReadabilityScore(content: string): number {
  // 移除 HTML 标签
  const text = content.replace(/<[^>]+>/g, ' ')

  // 统计句子数
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length

  if (sentenceCount === 0) return 0

  // 统计单词数
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) return 0

  // 统计音节数（简化版：假设每个单词平均 1.5 个音节）
  const syllableCount = wordCount * 1.5

  // Flesch Reading Ease 公式
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)

  // 限制在 0-100 范围内
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * 生成 SEO 优化建议
 *
 * 基于分析结果提供具体的优化建议
 *
 * @param metadata - SEO 元数据
 * @param targetWordCount - 目标字数配置
 * @returns 建议数组
 */
export function generateSeoRecommendations(
  metadata: ReturnType<typeof analyzeSeoMetadata>,
  targetWordCount: Record<string, number>
): string[] {
  const recommendations: string[] = []

  // 检查主关键词密度
  const density = parseFloat(metadata.mainKeywordDensity)
  if (density < 2.0) {
    recommendations.push(`主关键词密度偏低（${metadata.mainKeywordDensity}），建议增加到 2-3%`)
  } else if (density > 3.0) {
    recommendations.push(`主关键词密度偏高（${metadata.mainKeywordDensity}），可能被视为关键词堆砌`)
  }

  // 检查副关键词使用
  const subKeywordUsageRate = metadata.subKeywordsUsed.length
  if (subKeywordUsageRate < 3) {
    recommendations.push(`副关键词使用较少（${subKeywordUsageRate} 个），建议增加副关键词覆盖`)
  }

  // 检查总字数
  const targetTotal = Object.values(targetWordCount).reduce((a, b) => a + b, 0)
  const diff = Math.abs(metadata.totalWordCount - targetTotal)
  if (diff > targetTotal * 0.2) {
    recommendations.push(`总字数（${metadata.totalWordCount}）与目标（${targetTotal}）相差较大`)
  }

  // 如果没有问题，给予肯定
  if (recommendations.length === 0) {
    recommendations.push('✓ SEO 优化良好，关键词密度和内容长度都在最佳范围')
  }

  return recommendations
}
