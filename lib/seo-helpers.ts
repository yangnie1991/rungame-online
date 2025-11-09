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
 * 语言到 hreflang 代码的映射
 * 使用 ISO 639-1 语言代码（纯语言，不含地区）
 * 符合 Google hreflang 最佳实践
 *
 * Google 建议：
 * - 内容无地区差异时 → 使用纯语言代码（en, zh）
 * - 内容有地区差异时 → 使用语言+地区代码（en-us, zh-cn）
 *
 * 我们的网站内容无地区差异（无价格、货币、法律差异），因此使用纯语言代码
 */
const LOCALE_TO_HREFLANG: Record<string, string> = {
  'en': 'en',  // 英文
  'zh': 'zh',  // 中文（简体）
  // 未来如有地区差异，可改用：
  // 'en': 'en-us',  // 英文（美国）
  // 'zh': 'zh-cn',  // 简体中文（中国大陆）
  // 'zh-tw': 'zh-tw',  // 繁体中文（台湾）
  // 'en-gb': 'en-gb',  // 英文（英国）
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
 *
 * **重要说明：**
 * - 使用 ISO 639-1 纯语言代码（en, zh）- 因内容无地区差异
 * - x-default 指向默认语言版本
 * - 每个 URL 都是完全限定的（包含协议和域名）
 * - 符合 Google hreflang 最佳实践
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

  // 为每种语言生成完整的 URL
  for (const locale of supportedLocales) {
    const hreflangCode = LOCALE_TO_HREFLANG[locale] || locale

    if (locale === defaultLocale) {
      // 默认语言不带前缀
      languages[hreflangCode] = `${siteUrl}${cleanPath}`
    } else {
      // 其他语言带前缀
      // 特殊处理：非默认语言的首页不需要尾部斜杠（/zh 而不是 /zh/）
      const localizedPath = cleanPath === '/' ? '' : cleanPath
      languages[hreflangCode] = `${siteUrl}/${locale}${localizedPath}`
    }
  }

  // x-default 指向默认语言（作为未匹配语言的后备）
  languages['x-default'] = `${siteUrl}${cleanPath}`

  return languages
}

/**
 * 根据 locale 获取 hreflang 代码
 */
export function getHreflangCode(locale: string): string {
  return LOCALE_TO_HREFLANG[locale] || locale
}

/**
 * Open Graph locale 映射
 * OG 使用下划线格式（zh_CN），不同于 hreflang 的连字符格式（zh-cn）
 */
const LOCALE_TO_OG: Record<string, string> = {
  'en': 'en_US',
  'zh': 'zh_CN',
  // 未来可以添加更多地区：
  // 'zh-tw': 'zh_TW',
  // 'zh-hk': 'zh_HK',
  // 'en-gb': 'en_GB',
}

/**
 * 根据 locale 获取 Open Graph locale 代码
 *
 * @param locale - 应用的 locale 代码（如 'en', 'zh'）
 * @returns Open Graph locale 代码（如 'en_US', 'zh_CN'）
 *
 * @example
 * getOgLocale('en')  // 返回: 'en_US'
 * getOgLocale('zh')  // 返回: 'zh_CN'
 */
export function getOgLocale(locale: string): string {
  return LOCALE_TO_OG[locale] || 'en_US'
}
