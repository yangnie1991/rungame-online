/**
 * GamePix RSS Feed 游戏导入工具
 * 用于从 GamePix RSS Feed 获取和解析游戏数据
 */

// GamePix RSS Feed JSON 响应类型定义
export interface GamePixFeedResponse {
  version: string // jsonfeed 版本
  title: string // 文档标题
  home_page_url: string // gamepix.com 主页 URL
  feed_url: string // 当前 RSS Feed 的 URL
  next_url?: string // 下一页的 URL
  previous_url?: string // 上一页的 URL
  first_page_url?: string // 第一页的 URL
  last_page_url?: string // 最后一页的 URL
  modified?: string // 最后修改日期
  items: GamePixGameItem[] // 游戏列表
}

// 游戏项类型定义
export interface GamePixGameItem {
  id: string // 游戏的唯一标识符
  title: string // 游戏标题
  namespace: string // 游戏的唯一标识符(可用作slug)
  description: string // 游戏描述
  category: string // 游戏分类
  orientation: 'landscape' | 'portrait' // 游戏方向
  quality_score: number // 质量评分 0-1
  width: number // 游戏框架宽度
  height: number // 游戏框架高度
  date_modified: string // 修改日期
  date_published: string // 发布日期
  banner_image: string // 游戏封面 URL
  image: string // 游戏图标 URL
  url: string // 游戏游玩 URL
}

// 导入选项
export interface ImportOptions {
  format?: 'json' | 'xml' // 输出格式
  orderBy?: 'quality' | 'published' // 排序方式
  perPage?: 12 | 24 | 48 | 96 // 每页游戏数
  category?: string // 分类过滤
  page?: number // 页码
}

/**
 * 从 GamePix RSS Feed 获取游戏列表
 * @param siteId - 你的 GamePix Site ID (必需,用于统计跟踪)
 * @param options - 导入选项
 * @returns 游戏列表响应
 */
export async function fetchGamePixFeed(
  siteId: string,
  options: ImportOptions = {}
): Promise<GamePixFeedResponse> {
  const {
    format = 'json',
    orderBy = 'quality',
    perPage = 48,
    category,
    page = 1,
  } = options

  // 构建 RSS Feed URL (使用官方 API v2 端点)
  const params = new URLSearchParams({
    sid: siteId,
    pagination: perPage.toString(),
    page: page.toString(),
  })

  // 添加排序参数 (根据官方文档: quality 或 pubdate)
  if (orderBy === 'published') {
    params.append('order', 'pubdate') // 按发布日期排序
  } else {
    params.append('order', 'quality') // 按质量排序 (默认)
  }

  // 添加分类筛选
  if (category) {
    params.append('category', category)
  }

  // 使用官方 Feed API v2
  const url = `https://feeds.gamepix.com/v2/${format}?${params.toString()}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 缓存1小时
    })

    if (!response.ok) {
      throw new Error(`GamePix API 请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as GamePixFeedResponse
  } catch (error) {
    console.error('获取 GamePix Feed 失败:', error)
    throw error
  }
}

/**
 * 获取 GamePix 分类列表
 * @returns 分类列表
 */
export async function fetchGamePixCategories(): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await fetch('https://games.gamepix.com/categories', {
      next: { revalidate: 86400 }, // 缓存24小时
    })

    if (!response.ok) {
      throw new Error(`获取分类失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取 GamePix 分类失败:', error)
    throw error
  }
}

/**
 * 获取单个游戏详情
 * @param siteId - 你的 GamePix Site ID
 * @param gameId - 游戏 ID
 * @returns 游戏详情
 */
export async function fetchGamePixGameDetail(
  siteId: string,
  gameId: string
): Promise<GamePixGameItem> {
  try {
    const url = `https://games.gamepix.com/game?sid=${siteId}&gid=${gameId}`
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`获取游戏详情失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取游戏详情失败:', error)
    throw error
  }
}

/**
 * 获取所有游戏(分页获取)
 * @param siteId - 你的 GamePix Site ID
 * @param options - 导入选项
 * @param maxGames - 最大游戏数(可选,用于限制导入数量)
 * @returns 所有游戏列表
 */
export async function fetchAllGamePixGames(
  siteId: string,
  options: Omit<ImportOptions, 'page'> = {},
  maxGames?: number
): Promise<GamePixGameItem[]> {
  const allGames: GamePixGameItem[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const feed = await fetchGamePixFeed(siteId, { ...options, page })
    allGames.push(...feed.items)

    // 检查是否达到最大数量
    if (maxGames && allGames.length >= maxGames) {
      return allGames.slice(0, maxGames)
    }

    // 检查是否有下一页
    hasMore = !!feed.next_url
    page++

    // 添加延迟避免请求过快
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return allGames
}

/**
 * 将 GamePix 游戏数据转换为数据库格式
 * @param game - GamePix 游戏数据
 * @param categoryId - 数据库中的分类 ID
 * @returns 数据库格式的游戏数据
 */
export function transformGamePixGameToDbFormat(game: GamePixGameItem, categoryId: string) {
  return {
    // 使用 namespace 作为 slug(确保唯一性)
    slug: game.namespace || `gamepix-${game.id}`,
    // 嵌入 URL 就是游戏的游玩 URL
    embedUrl: game.url,
    // 缩略图使用 banner_image
    thumbnailUrl: game.banner_image || game.image,
    // 游戏尺寸
    width: game.width,
    height: game.height,
    // 分类
    categoryId,
    // 默认启用和发布
    isPublished: true,
    isFeatured: game.quality_score > 0.7, // 高质量游戏标记为精选
    // 播放次数默认为0,后续可以更新
    playCount: 0,
    // 翻译数据(默认英文)
    translations: {
      en: {
        title: game.title,
        description: game.description,
        instructions: `Play ${game.title} online for free. ${game.orientation === 'landscape' ? 'Best played in landscape mode.' : 'Best played in portrait mode.'}`,
      },
    },
  }
}
