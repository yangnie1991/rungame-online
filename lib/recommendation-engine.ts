/**
 * ============================================
 * 智能推荐引擎
 * ============================================
 *
 * 多维度加权推荐算法，提供更智能的游戏推荐
 */

/**
 * 推荐配置
 */
export interface RecommendationConfig {
  // 相似度权重（分类 + 标签）
  similarityWeight: number // 默认 0.4 (40%)
  // 质量权重（评分 + 质量分）
  qualityWeight: number // 默认 0.3 (30%)
  // 热度权重（播放次数）
  popularityWeight: number // 默认 0.2 (20%)
  // 新鲜度权重（发布时间）
  freshnessWeight: number // 默认 0.1 (10%)
}

/**
 * 游戏推荐数据
 */
export interface GameForRecommendation {
  id: string
  slug: string
  categoryId: string
  tagIds: string[]
  playCount: number
  viewCount: number
  rating: number // 0-5
  ratingCount: number
  qualityScore: number | null // 0-10
  releaseDate: Date | null
  createdAt: Date
}

/**
 * 推荐结果（包含得分）
 */
export interface RecommendationResult {
  gameId: string
  totalScore: number
  scores: {
    similarity: number
    quality: number
    popularity: number
    freshness: number
  }
}

/**
 * 默认推荐配置
 */
export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  similarityWeight: 0.4, // 40%
  qualityWeight: 0.3,    // 30%
  popularityWeight: 0.2, // 20%
  freshnessWeight: 0.1,  // 10%
}

/**
 * 计算相似度得分 (0-100)
 * 基于分类和标签的相似度
 */
function calculateSimilarityScore(
  currentGame: GameForRecommendation,
  candidateGame: GameForRecommendation
): number {
  let score = 0

  // 1. 同分类奖励 (0-40分)
  if (currentGame.categoryId === candidateGame.categoryId) {
    score += 40
  }

  // 2. 共享标签奖励 (0-60分)
  const currentTags = new Set(currentGame.tagIds)
  const sharedTags = candidateGame.tagIds.filter(tagId => currentTags.has(tagId))

  // 每个共享标签 +10 分，最多 60 分
  score += Math.min(sharedTags.length * 10, 60)

  return score
}

/**
 * 计算质量得分 (0-100)
 * 基于用户评分和平台质量分
 */
function calculateQualityScore(game: GameForRecommendation): number {
  let score = 0

  // 1. 用户评分 (0-50分)
  // rating 是 0-5，映射到 0-50
  if (game.rating > 0) {
    score += (game.rating / 5) * 50
  }

  // 2. 平台质量分 (0-50分)
  // qualityScore 是 0-10，映射到 0-50
  if (game.qualityScore !== null && game.qualityScore > 0) {
    score += (game.qualityScore / 10) * 50
  }

  // 3. 评分人数奖励（有更多评分的游戏更可信）
  if (game.ratingCount > 0) {
    // 对数缩放，避免极端值
    const ratingBonus = Math.log10(game.ratingCount + 1) * 5 // 最多 +15 分左右
    score += Math.min(ratingBonus, 15)
  }

  return Math.min(score, 100)
}

/**
 * 计算热度得分 (0-100)
 * 基于播放次数和浏览次数
 */
function calculatePopularityScore(game: GameForRecommendation): number {
  let score = 0

  // 1. 播放次数（使用对数缩放避免极端值）
  if (game.playCount > 0) {
    // log10(playCount + 1) 映射到 0-70
    // 例如: 10 次 → 7分, 100 次 → 14分, 1000 次 → 21分, 10000 次 → 28分
    score += Math.min(Math.log10(game.playCount + 1) * 7, 70)
  }

  // 2. 浏览次数（次要因素）
  if (game.viewCount > 0) {
    // log10(viewCount + 1) 映射到 0-30
    score += Math.min(Math.log10(game.viewCount + 1) * 3, 30)
  }

  return Math.min(score, 100)
}

/**
 * 计算新鲜度得分 (0-100)
 * 鼓励推荐新游戏，避免总是推荐老游戏
 */
function calculateFreshnessScore(game: GameForRecommendation): number {
  const now = Date.now()
  const releaseTime = game.releaseDate ? game.releaseDate.getTime() : game.createdAt.getTime()

  // 计算游戏发布了多少天
  const daysSinceRelease = (now - releaseTime) / (1000 * 60 * 60 * 24)

  // 新鲜度衰减函数
  // 0-7天: 100分
  // 8-30天: 80-60分
  // 31-90天: 60-40分
  // 91-180天: 40-20分
  // 180天+: 20-0分

  if (daysSinceRelease <= 7) {
    return 100
  } else if (daysSinceRelease <= 30) {
    return 100 - ((daysSinceRelease - 7) / 23) * 20 // 80-60
  } else if (daysSinceRelease <= 90) {
    return 60 - ((daysSinceRelease - 30) / 60) * 20 // 60-40
  } else if (daysSinceRelease <= 180) {
    return 40 - ((daysSinceRelease - 90) / 90) * 20 // 40-20
  } else if (daysSinceRelease <= 365) {
    return 20 - ((daysSinceRelease - 180) / 185) * 20 // 20-0
  } else {
    return 0
  }
}

/**
 * 计算推荐分数
 * 返回 0-100 的综合得分
 */
export function calculateRecommendationScore(
  currentGame: GameForRecommendation,
  candidateGame: GameForRecommendation,
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG
): RecommendationResult {
  // 计算各维度得分（0-100）
  const similarityScore = calculateSimilarityScore(currentGame, candidateGame)
  const qualityScore = calculateQualityScore(candidateGame)
  const popularityScore = calculatePopularityScore(candidateGame)
  const freshnessScore = calculateFreshnessScore(candidateGame)

  // 加权计算总分
  const totalScore =
    similarityScore * config.similarityWeight +
    qualityScore * config.qualityWeight +
    popularityScore * config.popularityWeight +
    freshnessScore * config.freshnessWeight

  return {
    gameId: candidateGame.id,
    totalScore,
    scores: {
      similarity: similarityScore,
      quality: qualityScore,
      popularity: popularityScore,
      freshness: freshnessScore,
    },
  }
}

/**
 * 对候选游戏进行排序推荐
 * 返回按推荐分数排序的游戏 ID 列表
 */
export function rankGamesForRecommendation(
  currentGame: GameForRecommendation,
  candidateGames: GameForRecommendation[],
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG
): RecommendationResult[] {
  // 计算每个候选游戏的推荐分数
  const results = candidateGames.map(candidate =>
    calculateRecommendationScore(currentGame, candidate, config)
  )

  // 按总分降序排序
  results.sort((a, b) => b.totalScore - a.totalScore)

  return results
}

/**
 * 获取推荐游戏 ID（包含随机性，避免总是推荐相同的游戏）
 */
export function getRecommendedGameIds(
  currentGame: GameForRecommendation,
  candidateGames: GameForRecommendation[],
  limit: number = 6,
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG,
  options: {
    // 是否在前 N 个结果中随机选择（增加多样性）
    randomizeTopN?: number
  } = {}
): string[] {
  const ranked = rankGamesForRecommendation(currentGame, candidateGames, config)

  // 如果启用了随机化
  if (options.randomizeTopN && options.randomizeTopN > limit) {
    // 从前 N 个结果中随机选择 limit 个
    const topN = ranked.slice(0, options.randomizeTopN)

    // Fisher-Yates 洗牌算法
    for (let i = topN.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[topN[i], topN[j]] = [topN[j], topN[i]]
    }

    return topN.slice(0, limit).map(r => r.gameId)
  }

  // 直接返回前 N 个
  return ranked.slice(0, limit).map(r => r.gameId)
}
