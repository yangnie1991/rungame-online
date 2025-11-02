import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// 验证必需的环境变量
import './lib/env'

const withNextIntl = createNextIntlPlugin("./i18n/config.ts")

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 强制清除缓存
  generateBuildId: async () => {
    // 使用时间戳作为 build ID，确保每次构建都是新的
    return `build-${Date.now()}`
  },
  // URL 重定向: 旧的主分类 slug → 新的复数后缀格式
  async redirects() {
    return [
      // 主分类 slug 重定向 (301 永久重定向)
      {
        source: '/category/main-action',
        destination: '/category/action-games',
        permanent: true,
      },
      {
        source: '/category/main-adventure',
        destination: '/category/adventure-games',
        permanent: true,
      },
      {
        source: '/category/main-puzzle',
        destination: '/category/puzzle-games',
        permanent: true,
      },
      {
        source: '/category/main-sports',
        destination: '/category/sports-games',
        permanent: true,
      },
      {
        source: '/category/main-racing',
        destination: '/category/racing-games',
        permanent: true,
      },
      {
        source: '/category/main-shooter',
        destination: '/category/shooter-games',
        permanent: true,
      },
      {
        source: '/category/main-fighting',
        destination: '/category/fighting-games',
        permanent: true,
      },
      {
        source: '/category/main-strategy',
        destination: '/category/strategy-games',
        permanent: true,
      },
      {
        source: '/category/main-rpg',
        destination: '/category/rpg-games',
        permanent: true,
      },
      {
        source: '/category/main-simulation',
        destination: '/category/simulation-games',
        permanent: true,
      },
      {
        source: '/category/main-horror',
        destination: '/category/horror-games',
        permanent: true,
      },
      {
        source: '/category/main-building',
        destination: '/category/building-games',
        permanent: true,
      },
      {
        source: '/category/main-multiplayer',
        destination: '/category/multiplayer-games',
        permanent: true,
      },
      {
        source: '/category/main-classics',
        destination: '/category/classic-games',
        permanent: true,
      },
      {
        source: '/category/main-casual',
        destination: '/category/casual-games',
        permanent: true,
      },
      {
        source: '/category/main-board',
        destination: '/category/board-games',
        permanent: true,
      },
      {
        source: '/category/main-kids',
        destination: '/category/kids-games',
        permanent: true,
      },
      {
        source: '/category/main-girls',
        destination: '/category/girls-games',
        permanent: true,
      },
      {
        source: '/category/main-animal',
        destination: '/category/animal-games',
        permanent: true,
      },
      {
        source: '/category/main-themed',
        destination: '/category/themed-games',
        permanent: true,
      },
      // 带语言前缀的重定向 - 具体规则
      {
        source: '/:locale(zh|es|fr)/category/main-action',
        destination: '/:locale/category/action-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-adventure',
        destination: '/:locale/category/adventure-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-puzzle',
        destination: '/:locale/category/puzzle-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-sports',
        destination: '/:locale/category/sports-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-racing',
        destination: '/:locale/category/racing-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-shooter',
        destination: '/:locale/category/shooter-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-fighting',
        destination: '/:locale/category/fighting-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-strategy',
        destination: '/:locale/category/strategy-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-rpg',
        destination: '/:locale/category/rpg-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-simulation',
        destination: '/:locale/category/simulation-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-horror',
        destination: '/:locale/category/horror-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-building',
        destination: '/:locale/category/building-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-multiplayer',
        destination: '/:locale/category/multiplayer-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-classics',
        destination: '/:locale/category/classic-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-casual',
        destination: '/:locale/category/casual-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-board',
        destination: '/:locale/category/board-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-kids',
        destination: '/:locale/category/kids-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-girls',
        destination: '/:locale/category/girls-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-animal',
        destination: '/:locale/category/animal-games',
        permanent: true,
      },
      {
        source: '/:locale(zh|es|fr)/category/main-themed',
        destination: '/:locale/category/themed-games',
        permanent: true,
      },
    ]
  },
  // 开发环境启用数据缓存
  // experimental: {
  //   staleTimes: {
  //     dynamic: 30, // 动态页面缓存30秒
  //     static: 180, // 静态页面缓存180秒
  //   },
  // },
  images: {
    remotePatterns: [
      // 游戏平台图片
      {
        protocol: "https",
        hostname: "img.gamepix.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "img.gamedistribution.com",
      },
      {
        protocol: "https",
        hostname: "html5.gamedistribution.com",
      },
      // Cloudflare R2 CDN (自定义域名)
      // 部署时取消注释并替换为您的域名
      // {
      //   protocol: "https",
      //   hostname: "cdn.yourdomain.com",
      // },
      // Cloudflare R2 公共域名 (r2.dev)
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
  },
}

export default withNextIntl(nextConfig)
