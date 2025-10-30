/**
 * 动态 OG 图片生成辅助函数
 * 用于生成指向 OG 图片 API 的 URL
 */

import { getSiteUrl } from './seo-helpers'

/**
 * 生成游戏 OG 图片 URL
 */
export function generateGameOGImageUrl(params: {
  title: string
  category?: string
  categoryIcon?: string
  thumbnail?: string
  tags?: string
}): string {
  const baseUrl = getSiteUrl()
  const url = new URL('/api/og/game', baseUrl)

  url.searchParams.set('title', params.title)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.categoryIcon) url.searchParams.set('categoryIcon', params.categoryIcon)
  if (params.thumbnail) url.searchParams.set('thumbnail', params.thumbnail)
  if (params.tags) url.searchParams.set('tags', params.tags)

  return url.toString()
}

/**
 * 生成分类 OG 图片 URL
 */
export function generateCategoryOGImageUrl(params: {
  name: string
  description?: string
  gameCount?: number
  icon?: string
}): string {
  const baseUrl = getSiteUrl()
  const url = new URL('/api/og/category', baseUrl)

  url.searchParams.set('name', params.name)
  if (params.description) url.searchParams.set('description', params.description)
  if (params.gameCount) url.searchParams.set('gameCount', params.gameCount.toString())
  if (params.icon) url.searchParams.set('icon', params.icon)

  return url.toString()
}

/**
 * 生成标签 OG 图片 URL
 */
export function generateTagOGImageUrl(params: {
  name: string
  description?: string
  gameCount?: number
  icon?: string
}): string {
  const baseUrl = getSiteUrl()
  const url = new URL('/api/og/tag', baseUrl)

  url.searchParams.set('name', params.name)
  if (params.description) url.searchParams.set('description', params.description)
  if (params.gameCount) url.searchParams.set('gameCount', params.gameCount.toString())
  if (params.icon) url.searchParams.set('icon', params.icon)

  return url.toString()
}

/**
 * 生成 PageType OG 图片 URL
 */
export function generatePageTypeOGImageUrl(params: {
  title: string
  description?: string
  gameCount?: number
  icon?: string
  type?: 'GAME_LIST' | 'DISPLAY_PAGE' | 'OTHER_PAGE'
}): string {
  const baseUrl = getSiteUrl()
  const url = new URL('/api/og/pagetype', baseUrl)

  url.searchParams.set('title', params.title)
  if (params.description) url.searchParams.set('description', params.description)
  if (params.gameCount) url.searchParams.set('gameCount', params.gameCount.toString())
  if (params.icon) url.searchParams.set('icon', params.icon)
  if (params.type) url.searchParams.set('type', params.type)

  return url.toString()
}
