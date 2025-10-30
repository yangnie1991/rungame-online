import { prisma } from './prisma'

/**
 * AI 可调用的工具定义
 */

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
}

// ===== 工具定义 =====

export const AVAILABLE_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'search_similar_games',
      description: '搜索数据库中类似的游戏，用于参考游戏描述、特点、玩法等',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '游戏分类（如 puzzle, action, strategy）'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: '游戏标签列表'
          },
          limit: {
            type: 'number',
            description: '返回结果数量，默认 3',
            default: 3
          }
        },
        required: ['category']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_category_stats',
      description: '获取指定分类的统计信息，包括游戏数量、热门标签、平均播放量等',
      parameters: {
        type: 'object',
        properties: {
          categoryId: {
            type: 'string',
            description: '分类 ID'
          }
        },
        required: ['categoryId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_popular_tags',
      description: '获取热门游戏标签列表，用于 SEO 优化',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '可选：限定在某个分类下'
          },
          limit: {
            type: 'number',
            description: '返回结果数量，默认 10',
            default: 10
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_game_keywords',
      description: '分析游戏标题和描述，提取关键词并给出 SEO 建议',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '游戏标题'
          },
          description: {
            type: 'string',
            description: '游戏描述'
          },
          locale: {
            type: 'string',
            description: '语言代码（en, zh, es, fr）',
            default: 'en'
          }
        },
        required: ['title']
      }
    }
  }
]

// ===== 工具执行函数 =====

export async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  switch (name) {
    case 'search_similar_games':
      return await searchSimilarGames(args)

    case 'get_category_stats':
      return await getCategoryStats(args)

    case 'get_popular_tags':
      return await getPopularTags(args)

    case 'analyze_game_keywords':
      return await analyzeGameKeywords(args)

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ===== 工具实现 =====

async function searchSimilarGames(args: {
  category: string
  tags?: string[]
  limit?: number
}): Promise<any> {
  const { category, tags = [], limit = 3 } = args

  try {
    // 查找分类
    const categoryRecord = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: category },
          { translations: { some: { name: { contains: category, mode: 'insensitive' } } } }
        ]
      }
    })

    if (!categoryRecord) {
      return { error: `分类 "${category}" 未找到` }
    }

    // 查询游戏
    const games = await prisma.game.findMany({
      where: {
        categoryId: categoryRecord.id,
        isPublished: true,
        ...(tags.length > 0 && {
          tags: {
            some: {
              tag: {
                translations: {
                  some: {
                    name: { in: tags, mode: 'insensitive' }
                  }
                }
              }
            }
          }
        })
      },
      include: {
        translations: {
          where: { locale: 'en' },
          select: { title: true, description: true }
        }
      },
      orderBy: { playCount: 'desc' },
      take: limit
    })

    return games.map(game => ({
      title: game.title,
      description: game.description,
      playCount: game.playCount,
      slug: game.slug
    }))
  } catch (error: any) {
    console.error('search_similar_games 错误:', error)
    return { error: error.message }
  }
}

async function getCategoryStats(args: {
  categoryId: string
}): Promise<any> {
  const { categoryId } = args

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        games: {
          where: { isPublished: true },
          select: {
            playCount: true,
            tags: {
              include: {
                tag: {
                  include: {
                    translations: {
                      where: { locale: 'en' }
                    }
                  }
                }
              }
            }
          }
        },
        translations: {
          where: { locale: 'en' }
        }
      }
    })

    if (!category) {
      return { error: `分类 ID "${categoryId}" 未找到` }
    }

    // 统计
    const totalGames = category.games.length
    const totalPlays = category.games.reduce((sum, g) => sum + g.playCount, 0)
    const avgPlays = totalGames > 0 ? Math.round(totalPlays / totalGames) : 0

    // 热门标签
    const tagCounts = new Map<string, number>()
    category.games.forEach(game => {
      game.tags.forEach(({ tag }) => {
        const tagName = tag.translations[0]?.name || tag.slug
        tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1)
      })
    })

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      categoryName: category.translations[0]?.name || category.slug,
      totalGames,
      totalPlays,
      avgPlays,
      topTags
    }
  } catch (error: any) {
    console.error('get_category_stats 错误:', error)
    return { error: error.message }
  }
}

async function getPopularTags(args: {
  category?: string
  limit?: number
}): Promise<any> {
  const { category, limit = 10 } = args

  try {
    const tags = await prisma.tag.findMany({
      where: {
        isEnabled: true,
        games: {
          some: {
            game: {
              isPublished: true,
              ...(category && {
                category: {
                  slug: category
                }
              })
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale: 'en' }
        },
        _count: {
          select: { games: true }
        }
      },
      orderBy: {
        games: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return tags.map(tag => ({
      name: tag.translations[0]?.name || tag.slug,
      slug: tag.slug,
      gamesCount: tag._count.games
    }))
  } catch (error: any) {
    console.error('get_popular_tags 错误:', error)
    return { error: error.message }
  }
}

async function analyzeGameKeywords(args: {
  title: string
  description?: string
  locale?: string
}): Promise<any> {
  const { title, description = '', locale = 'en' } = args

  // 简单的关键词提取（实际项目中可以使用 NLP 库）
  const text = `${title} ${description}`.toLowerCase()

  // 常见游戏类型关键词
  const gameTypes = ['puzzle', 'action', 'strategy', 'rpg', 'shooter', 'racing', 'sports', 'adventure']
  const foundTypes = gameTypes.filter(type => text.includes(type))

  // 常见游戏特征关键词
  const features = ['multiplayer', 'singleplayer', '3d', '2d', 'online', 'offline', 'casual', 'hardcore']
  const foundFeatures = features.filter(feature => text.includes(feature))

  return {
    suggestedKeywords: [
      ...foundTypes,
      ...foundFeatures,
      ...(locale === 'en' ? ['game', 'play', 'free'] : [])
    ],
    seoTips: [
      '在标题中包含游戏类型关键词',
      '描述中突出游戏的独特功能',
      '使用热门搜索词汇',
      '保持标题简洁（50-60字符）',
      '元描述控制在150-160字符'
    ]
  }
}
