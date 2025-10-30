/**
 * 游戏内容获取辅助函数
 * 处理英文主表和翻译表的统一查询逻辑
 */

import { GameInfo } from '@/lib/types/game-info'

/**
 * 获取游戏标题
 * 英文直接返回主表，其他语言尝试翻译表，回退到主表
 */
export function getGameTitle(
  locale: string,
  gameTitle: string,
  translations: Array<{ locale: string; title: string }>
): string {
  if (locale === 'en') {
    return gameTitle
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.title || gameTitle
}

/**
 * 获取游戏描述
 */
export function getGameDescription(
  locale: string,
  gameDescription: string | null,
  translations: Array<{ locale: string; description: string | null }>
): string | null {
  if (locale === 'en') {
    return gameDescription
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.description !== undefined ? translation.description : gameDescription
}

/**
 * 获取游戏 SEO 关键词
 */
export function getGameKeywords(
  locale: string,
  gameKeywords: string | null,
  translations: Array<{ locale: string; keywords: string | null }>
): string | null {
  if (locale === 'en') {
    return gameKeywords
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.keywords !== undefined ? translation.keywords : gameKeywords
}

/**
 * 获取游戏 SEO 标题
 */
export function getGameMetaTitle(
  locale: string,
  gameMetaTitle: string | null,
  translations: Array<{ locale: string; metaTitle: string | null }>
): string | null {
  if (locale === 'en') {
    return gameMetaTitle
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.metaTitle !== undefined ? translation.metaTitle : gameMetaTitle
}

/**
 * 获取游戏 SEO 描述
 */
export function getGameMetaDescription(
  locale: string,
  gameMetaDescription: string | null,
  translations: Array<{ locale: string; metaDescription: string | null }>
): string | null {
  if (locale === 'en') {
    return gameMetaDescription
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.metaDescription !== undefined ? translation.metaDescription : gameMetaDescription
}

/**
 * 获取游戏详细内容 (GameInfo)
 * 英文返回主表 gameInfo，其他语言返回 translationInfo，回退到主表
 */
export function getGameContent(
  locale: string,
  gameInfo: GameInfo | null,
  translations: Array<{ locale: string; translationInfo: GameInfo | null }>
): GameInfo | null {
  if (locale === 'en') {
    return gameInfo
  }

  const translation = translations.find(t => t.locale === locale)
  return translation?.translationInfo || gameInfo
}

/**
 * 获取游戏的所有翻译内容
 * 返回统一的对象结构
 */
export function getGameTranslatedContent(
  locale: string,
  game: {
    title: string
    description: string | null
    keywords: string | null
    metaTitle: string | null
    metaDescription: string | null
    gameInfo: GameInfo | null
  },
  translations: Array<{
    locale: string
    title: string
    description: string | null
    keywords: string | null
    metaTitle: string | null
    metaDescription: string | null
    translationInfo: GameInfo | null
  }>
) {
  return {
    title: getGameTitle(locale, game.title, translations),
    description: getGameDescription(locale, game.description, translations),
    keywords: getGameKeywords(locale, game.keywords, translations),
    metaTitle: getGameMetaTitle(locale, game.metaTitle, translations),
    metaDescription: getGameMetaDescription(locale, game.metaDescription, translations),
    gameInfo: getGameContent(locale, game.gameInfo, translations),
  }
}
