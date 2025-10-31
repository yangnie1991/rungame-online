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
      // 带语言前缀的重定向
      {
        source: '/:locale(zh|es|fr)/category/main-:slug',
        destination: '/:locale/category/:slug-games',
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
