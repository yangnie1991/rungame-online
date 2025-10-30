"use server"

import { getDefaultLanguageCached, getEnabledLanguagesCached } from "./cache"

/**
 * ============================================
 * 语言业务函数层（从缓存派生）
 * ============================================
 *
 * 所有函数都从 cache.ts 的统一数据源派生，不直接查询数据库
 */

/**
 * 获取默认语言
 * 缓存策略：24小时重新验证
 *
 * @example
 * const defaultLang = await getDefaultLanguage()
 * // { code: "en", name: "English", flag: "🇺🇸" }
 */
export async function getDefaultLanguage() {
  return getDefaultLanguageCached()
}

/**
 * 获取所有启用的语言
 * 缓存策略：24小时重新验证
 *
 * @example
 * const languages = await getEnabledLanguages()
 * // [{ code: "en", name: "English", nativeName: "English", flag: "🇺🇸" }, ...]
 */
export async function getEnabledLanguages() {
  return getEnabledLanguagesCached()
}
