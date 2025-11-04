import { MetadataRoute } from 'next'

/**
 * Robots.txt - 搜索引擎爬虫指令
 *
 * Next.js 15 官方推荐使用动态 robots.ts 文件
 * 文档: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 *
 * 配置说明：
 * - 允许所有主流搜索引擎爬取公开内容
 * - 禁止爬取后台管理、API 路由、登录页、搜索页等路径
 * - 为不同搜索引擎设置适当的爬取延迟
 * - 引导爬虫访问 sitemap.xml 获取完整页面列表
 *
 * ⚠️ 重要：Google SEO 最佳实践（2025）
 * - 绝对不要阻止 CSS、JavaScript、图片文件
 * - Google 需要这些资源来正确渲染和理解页面
 * - 阻止这些资源会导致：
 *   1. 页面渲染失败
 *   2. 移动端友好性测试失败
 *   3. Core Web Vitals 评分下降
 *   4. 搜索排名大幅下降
 * - 来源: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
 *
 * 搜索页 (/search) 被禁止的原因：
 * - 搜索结果页容易产生无限数量的URL变体
 * - 与分类页、标签页内容重复
 * - 节省爬取预算，让爬虫专注于sitemap中的重要内容
 * - 符合行业最佳实践（Steam、Poki等都不允许爬取搜索页）
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    rules: [
      {
        // 默认规则 - 适用于所有爬虫
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',      // 管理后台
          '/api/',        // API 接口
          '/login',       // 登录页
          '/search',      // 搜索页（避免重复内容和无限URL）
          // 注意：不要阻止 /_next/（CSS/JS/图片）和 /static/（静态资源）
          // Google 需要这些资源来正确渲染页面
        ],
      },
      {
        // Google 搜索引擎
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 0, // Google 不需要延迟
      },
      {
        // Google 图片搜索 - 允许访问所有图片
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login'],
        crawlDelay: 0,
      },
      {
        // Bing 搜索引擎
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 0,
      },
      {
        // Baidu 百度搜索
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 1, // 百度爬虫稍作限制
      },
      {
        // Yandex 俄罗斯搜索
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 1,
      },
      {
        // DuckDuckGo 搜索
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 0,
      },
      {
        // Sogou 搜狗搜索
        userAgent: 'Sogou',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/search'],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl, // 指定首选域名
  }
}
