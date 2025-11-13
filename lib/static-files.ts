/**
 * 静态文件配置
 *
 * 用于中间件判断哪些路径应该跳过国际化处理
 *
 * 目录结构说明：
 * - /public/                    - 根目录（只保留必须在根的文件）
 * - /public/assets/             - 静态资源目录（自动排除）
 * - /public/assets/icons/       - 图标文件
 * - /public/assets/images/      - 图片文件
 * - /public/assets/preview/     - 预览页面
 * - /public/test/               - 测试页面（开发用，自动排除）
 */

/**
 * 静态资源目录列表
 *
 * 这些目录下的所有文件都会跳过国际化处理
 * 这是最推荐的方式，避免逐个文件配置
 */
export const STATIC_DIRECTORIES = [
  '/assets',        // 所有静态资源
  '/test',          // 测试页面（OG 预览等开发工具）
  '/_next',         // Next.js 内部文件
]

/**
 * 根目录必需的静态文件
 *
 * 这些文件因为 SEO、PWA 或浏览器标准必须放在根目录
 */
export const ROOT_STATIC_FILES = [
  // ============================================
  // SEO 必需文件（搜索引擎要求在根目录）
  // ============================================
  /^\/robots\.txt$/,           // 搜索引擎爬虫规则
  /^\/sitemap\.xml$/,          // 网站地图
  /^\/ads\.txt$/,              // Google AdSense 验证
  /^\/llms\.txt$/,             // LLM 爬虫规则（Claude、ChatGPT 等）
  /^\/[a-f0-9]{8,128}\.txt$/,  // IndexNow API Key 文件（8-128位十六进制）

  // ============================================
  // PWA 必需文件
  // ============================================
  /^\/manifest\.json$/,        // PWA manifest（建议在根目录）
  /^\/service-worker\.js$/,    // Service Worker
  /^\/sw\.js$/,                // Service Worker 简写

  // ============================================
  // 浏览器默认查找的文件
  // ============================================
  /^\/favicon\.ico$/,          // 浏览器默认在根目录查找
]

/**
 * 排除的路径前缀列表
 *
 * 这些路径不需要国际化处理
 */
export const EXCLUDED_PATH_PREFIXES = [
  '/api',      // API 路由
  '/admin',    // 管理后台（包含登录页面）
]

/**
 * 检查给定的路径是否为静态目录下的文件
 *
 * @param pathname - 要检查的路径
 * @returns 如果是静态目录下的文件返回 true，否则返回 false
 *
 * @example
 * isStaticDirectory('/assets/icons/logo.png') // true
 * isStaticDirectory('/test/page.html') // true
 * isStaticDirectory('/test.txt') // false (文件，不是目录)
 * isStaticDirectory('/zh/games') // false
 */
export function isStaticDirectory(pathname: string): boolean {
  return STATIC_DIRECTORIES.some(dir => {
    // 确保路径以目录开头，且下一个字符是 '/' 或者路径完全匹配
    if (pathname === dir) return true // 完全匹配目录本身
    return pathname.startsWith(dir + '/') // 匹配目录下的文件
  })
}

/**
 * 检查给定的路径是否为根目录静态文件
 *
 * @param pathname - 要检查的路径
 * @returns 如果是根目录静态文件返回 true，否则返回 false
 *
 * @example
 * isRootStaticFile('/favicon.ico') // true
 * isRootStaticFile('/manifest.json') // true
 * isRootStaticFile('/zh/games') // false
 */
export function isRootStaticFile(pathname: string): boolean {
  return ROOT_STATIC_FILES.some(pattern => pattern.test(pathname))
}

/**
 * 检查给定的路径是否应该被排除在国际化之外
 *
 * @param pathname - 要检查的路径
 * @returns 如果应该排除返回 true，否则返回 false
 *
 * @example
 * shouldExcludeFromI18n('/api/games') // true
 * shouldExcludeFromI18n('/assets/icons/logo.png') // true
 * shouldExcludeFromI18n('/favicon.ico') // true
 * shouldExcludeFromI18n('/zh/games') // false
 */
export function shouldExcludeFromI18n(pathname: string): boolean {
  // 1. 检查路径前缀（API、管理后台等）
  if (EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true
  }

  // 2. 检查静态资源目录
  if (isStaticDirectory(pathname)) {
    return true
  }

  // 3. 检查根目录静态文件
  if (isRootStaticFile(pathname)) {
    return true
  }

  return false
}
