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
