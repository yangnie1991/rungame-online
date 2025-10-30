/**
 * 字符统计工具函数
 * 提供不同的字符统计方式，用于 Tiptap 编辑器和内容验证
 */

/**
 * 自定义字符统计：中文字符=2字节，英文字符=1字节
 *
 * 符合用户习惯和 SEO 元标签的实际需求：
 * - 中日韩汉字算2个字符
 * - ASCII 字符算1个字符
 * - 其他多字节字符（全角符号等）算2个字符
 *
 * 适用场景：
 * - SEO 元数据字段（metaTitle, metaDescription）
 * - 需要严格字节控制的场景
 * - 用户期望"中文=2字符"的场景
 *
 * @param text - 要统计的文本内容
 * @returns 字符数（中文=2，英文=1）
 *
 * @example
 * customTextCounter('Hello World')      // 11
 * customTextCounter('你好世界')          // 8 (4个汉字 × 2)
 * customTextCounter('Hello 世界')       // 10 (6个英文 + 2个汉字×2)
 */
export function customTextCounter(text: string): number {
  let byteLength = 0

  for (const char of text) {
    const code = char.charCodeAt(0)

    // CJK 统一表意文字 (中日韩汉字)
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 基本区（最常用）
      (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 扩展A
      (code >= 0x20000 && code <= 0x2A6DF) || // CJK 扩展B
      (code >= 0x2A700 && code <= 0x2B73F) || // CJK 扩展C
      (code >= 0x2B740 && code <= 0x2B81F) || // CJK 扩展D
      (code >= 0x2B820 && code <= 0x2CEAF) || // CJK 扩展E
      (code >= 0xF900 && code <= 0xFAFF) ||   // CJK 兼容汉字
      (code >= 0x2F800 && code <= 0x2FA1F)    // CJK 兼容补充
    ) {
      byteLength += 2 // 中文字符算2字节
    } else if (code > 0x7F) {
      // 其他多字节字符（如全角符号、日韩文等）
      byteLength += 2
    } else {
      // ASCII 字符（英文字母、数字、标点等）
      byteLength += 1
    }
  }

  return byteLength
}

/**
 * 精确字符统计：使用 Intl.Segmenter
 *
 * 基于 Unicode 字素簇（grapheme clusters）统计，
 * 正确处理复杂字符（如 emoji 组合字符）。
 *
 * 适用场景：
 * - 富文本内容字段
 * - 需要统计用户实际看到的字符数
 * - 需要正确处理 emoji 的场景
 *
 * @param text - 要统计的文本内容
 * @returns 用户可见的字符数
 *
 * @example
 * preciseTextCounter('Hello World')          // 11
 * preciseTextCounter('你好世界')              // 4
 * preciseTextCounter('👨‍👩‍👧‍👦家庭')        // 3 (1个家庭emoji + 2个汉字)
 */
export function preciseTextCounter(text: string): number {
  // 使用 Intl.Segmenter 进行精确的字素簇统计
  return [...new Intl.Segmenter().segment(text)].length
}

/**
 * 默认字符统计：使用 String.length
 *
 * JavaScript 默认的字符串长度统计方式，
 * 基于 UTF-16 编码单元。
 *
 * 适用场景：
 * - 简单文本字段
 * - 不需要特殊处理的场景
 * - 与旧代码兼容
 *
 * @param text - 要统计的文本内容
 * @returns 字符串长度
 *
 * @example
 * defaultTextCounter('Hello World')      // 11
 * defaultTextCounter('你好世界')          // 4
 */
export function defaultTextCounter(text: string): number {
  return text.length
}

/**
 * 从 HTML 中提取纯文本
 *
 * 用于从富文本编辑器的 HTML 内容中提取纯文本，
 * 以便进行字符统计或其他文本处理。
 *
 * @param html - HTML 字符串
 * @returns 纯文本内容
 *
 * @example
 * extractTextFromHtml('<p>Hello <strong>World</strong></p>')  // 'Hello World'
 * extractTextFromHtml('<h1>你好</h1><p>世界</p>')             // '你好世界'
 */
export function extractTextFromHtml(html: string): string {
  // 移除 HTML 标签
  let text = html.replace(/<[^>]*>/g, '')

  // 解码常见的 HTML 实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return text.trim()
}

/**
 * 获取文本的实际 UTF-8 字节长度
 *
 * 计算文本在 UTF-8 编码下的实际字节数。
 *
 * 适用场景：
 * - 数据库存储大小计算
 * - 网络传输大小估算
 * - 需要真实字节数的场景
 *
 * @param text - 要统计的文本内容
 * @returns UTF-8 字节数
 *
 * @example
 * getUtf8ByteLength('Hello World')      // 11
 * getUtf8ByteLength('你好世界')          // 12 (中文在UTF-8中每个字=3字节)
 */
export function getUtf8ByteLength(text: string): number {
  if (typeof Buffer !== 'undefined') {
    // Node.js 环境
    return Buffer.byteLength(text, 'utf8')
  } else {
    // 浏览器环境
    return new TextEncoder().encode(text).length
  }
}

/**
 * 验证文本是否超过指定的字符限制
 *
 * @param text - 要验证的文本
 * @param limit - 字符限制
 * @param mode - 统计模式
 * @returns 是否超过限制
 *
 * @example
 * isTextOverLimit('Hello', 10, 'custom')           // false
 * isTextOverLimit('你好世界你好世界', 10, 'custom') // true (16字符 > 10)
 */
export function isTextOverLimit(
  text: string,
  limit: number,
  mode: 'custom' | 'precise' | 'default' = 'custom'
): boolean {
  const counter = mode === 'custom'
    ? customTextCounter
    : mode === 'precise'
    ? preciseTextCounter
    : defaultTextCounter

  return counter(text) > limit
}

/**
 * 获取字符统计的详细信息
 *
 * @param text - 要统计的文本
 * @returns 包含多种统计方式的对象
 *
 * @example
 * getCharacterStats('你好世界')
 * // {
 * //   custom: 8,
 * //   precise: 4,
 * //   default: 4,
 * //   utf8Bytes: 12
 * // }
 */
export function getCharacterStats(text: string) {
  return {
    custom: customTextCounter(text),
    precise: preciseTextCounter(text),
    default: defaultTextCounter(text),
    utf8Bytes: getUtf8ByteLength(text),
  }
}
