/**
 * 国际化辅助工具 - 处理翻译回退逻辑
 */

// 默认语言配置
export const DEFAULT_LOCALE = "en"

/**
 * 构建Prisma翻译查询条件
 * 如果当前语言是默认语言，只查询当前语言；否则同时查询当前语言和默认语言
 * @param locale - 当前语言
 * @param defaultLocale - 默认语言
 * @returns Prisma where条件
 */
export function buildLocaleCondition(locale: string, defaultLocale: string = DEFAULT_LOCALE) {
  return locale === defaultLocale
    ? { locale }
    : { OR: [{ locale }, { locale: defaultLocale }] }
}

/**
 * 翻译对象接口
 */
interface Translation {
  locale: string
  [key: string]: any
}

/**
 * 从翻译数组中获取翻译，如果当前语言不存在则回退到默认语言
 * @param translations - 翻译数组
 * @param locale - 当前语言
 * @param defaultLocale - 默认语言（回退语言）
 * @returns 翻译对象或undefined
 */
export function getTranslationWithFallback<T extends Translation>(
  translations: T[],
  locale: string,
  defaultLocale: string = DEFAULT_LOCALE
): T | undefined {
  // 优先返回当前语言的翻译
  const currentTranslation = translations.find((t) => t.locale === locale)
  if (currentTranslation) {
    return currentTranslation
  }

  // 如果当前语言不存在，回退到默认语言
  const fallbackTranslation = translations.find((t) => t.locale === defaultLocale)
  if (fallbackTranslation) {
    return fallbackTranslation
  }

  // 如果默认语言也不存在，返回第一个可用的翻译
  return translations[0]
}

/**
 * 从翻译数组中安全获取字段值，带回退机制
 * @param translations - 翻译数组
 * @param locale - 当前语言
 * @param field - 字段名
 * @param defaultValue - 默认值
 * @param defaultLocale - 默认语言（回退语言）
 * @returns 字段值或默认值
 */
export function getTranslatedField<T extends Translation>(
  translations: T[],
  locale: string,
  field: keyof T,
  defaultValue: string = "",
  defaultLocale: string = DEFAULT_LOCALE
): string {
  const translation = getTranslationWithFallback(translations, locale, defaultLocale)
  return (translation?.[field] as string) || defaultValue
}

/**
 * 批量处理翻译字段，返回翻译对象
 * @param translations - 翻译数组
 * @param locale - 当前语言
 * @param fields - 需要提取的字段名数组
 * @param defaultLocale - 默认语言（回退语言）
 * @returns 包含所有字段的翻译对象
 */
export function getTranslatedFields<T extends Translation>(
  translations: T[],
  locale: string,
  fields: (keyof T)[],
  defaultLocale: string = DEFAULT_LOCALE
): Partial<T> {
  const translation = getTranslationWithFallback(translations, locale, defaultLocale)

  if (!translation) {
    return {} as Partial<T>
  }

  const result: Partial<T> = {}
  for (const field of fields) {
    result[field] = translation[field]
  }

  return result
}
