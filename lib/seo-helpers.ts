import { routing } from '@/i18n/routing'

/**
 * SEO 元数据工具函数
 * 提供核心的 URL 和多语言支持
 */

/**
 * 获取网站基础 URL
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
}

/**
 * 生成多语言 alternate 链接
 *
 * @param path - 页面路径（不带语言前缀，如 "/play/snake-game"）
 * @returns 包含所有语言和 x-default 的 hreflang 对象
 *
 * @example
 * generateAlternateLanguages('/play/snake-game')
 * // 返回: {
 * //   'en': 'https://rungame.online/play/snake-game',
 * //   'zh': 'https://rungame.online/zh/play/snake-game',
 * //   'x-default': 'https://rungame.online/play/snake-game'
 * // }
 */
export function generateAlternateLanguages(path: string): Record<string, string> {
  const siteUrl = getSiteUrl()
  const supportedLocales = routing.locales
  const defaultLocale = routing.defaultLocale

  // 移除路径中的语言前缀（如果有）
  let cleanPath = path
  for (const locale of supportedLocales) {
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      cleanPath = path.replace(`/${locale}`, '')
      break
    }
  }

  // 确保路径以 / 开头
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath
  }

  const languages: Record<string, string> = {}

  // 默认语言不带前缀
  languages[defaultLocale] = `${siteUrl}${cleanPath}`

  // 其他语言带前缀
  for (const locale of supportedLocales) {
    if (locale !== defaultLocale) {
      languages[locale] = `${siteUrl}/${locale}${cleanPath}`
    }
  }

  // x-default 指向默认语言
  languages['x-default'] = `${siteUrl}${cleanPath}`

  return languages
}
