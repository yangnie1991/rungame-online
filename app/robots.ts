import { MetadataRoute } from 'next'

/**
 * Robots.txt - 搜索引擎爬虫指令
 *
 * Next.js 15 官方推荐使用动态 robots.ts 文件
 * 文档: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',      // 禁止爬取管理后台
          '/api/',        // 禁止爬取 API 路由
          '/login',       // 禁止爬取登录页
        ],
      },
      {
        // Google 专用规则
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login'],
        crawlDelay: 0,
      },
      {
        // Bing 专用规则
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login'],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
