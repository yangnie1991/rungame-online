/**
 * PageType 内容获取辅助函数
 * 从 pageInfo.content 中安全地提取内容
 */

import type { PageTypeContent, PageInfo } from "@/lib/types/page-type"

/**
 * 从 pageInfo JSON 中安全获取页面内容
 *
 * @param pageInfo - PageType 的 pageInfo JSON 字段
 * @param translationPageInfo - PageTypeTranslation 的 pageInfo JSON 字段（可选）
 * @param locale - 当前语言
 * @returns 页面内容对象，如果不存在返回 null
 *
 * @example
 * const content = getPageTypeContent(pageType.pageInfo, translation?.pageInfo, 'zh')
 * if (content) {
 *   console.log(content.detailedDescription)
 *   console.log(content.features)
 *   console.log(content.summary)
 * }
 */
export function getPageTypeContent(
  pageInfo: any,
  translationPageInfo: any = null,
  locale: string = 'en'
): PageTypeContent | null {
  // 优先使用翻译版本的 content
  const targetPageInfo = (locale !== 'en' && translationPageInfo)
    ? translationPageInfo
    : pageInfo

  const content = targetPageInfo?.content

  if (!content || typeof content !== 'object') {
    return null
  }

  // 安全提取并验证数据
  return {
    detailedDescription: typeof content.detailedDescription === 'string'
      ? content.detailedDescription
      : '',
    features: Array.isArray(content.features)
      ? content.features.filter((f: any) =>
          typeof f === 'object' &&
          typeof f.icon === 'string' &&
          typeof f.text === 'string'
        )
      : [],
    summary: typeof content.summary === 'string'
      ? content.summary
      : ''
  }
}

/**
 * 检查 PageType 是否有配置内容
 *
 * @param pageInfo - PageType 的 pageInfo JSON 字段
 * @param translationPageInfo - PageTypeTranslation 的 pageInfo JSON 字段（可选）
 * @param locale - 当前语言
 * @returns 是否有内容配置
 */
export function hasPageTypeContent(
  pageInfo: any,
  translationPageInfo: any = null,
  locale: string = 'en'
): boolean {
  const content = getPageTypeContent(pageInfo, translationPageInfo, locale)
  return content !== null && (
    !!content.detailedDescription ||
    content.features.length > 0 ||
    !!content.summary
  )
}
