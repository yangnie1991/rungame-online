"use client"

import { useEffect } from "react"

interface GoogleAdsenseProps {
  adClientId: string
}

/**
 * Google AdSense 组件
 *
 * 使用原生 script 标签加载 AdSense，避免 data-nscript 警告
 * - 在客户端动态注入脚本
 * - 不阻塞首屏渲染
 * - 避免 Next.js Script 组件的兼容性问题
 *
 * 配置方法：
 * 1. 在 .env 中配置 NEXT_PUBLIC_ADSENSE_ID
 * 2. 在 layout.tsx 中导入并使用此组件（加载脚本）
 * 3. 在 layout.tsx 的 metadata.other 中添加 meta 标签（账户验证）
 *
 * @example
 * // 在 body 中加载脚本
 * <GoogleAdsense adClientId={process.env.NEXT_PUBLIC_ADSENSE_ID || ""} />
 *
 * // 在 metadata 中添加验证 meta 标签
 * metadata: {
 *   other: {
 *     'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_ID || ''
 *   }
 * }
 */
export function GoogleAdsense({ adClientId }: GoogleAdsenseProps) {
  useEffect(() => {
    // 如果没有配置 AdSense ID，则不加载
    if (!adClientId) {
      return
    }

    // 检查脚本是否已经加载
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js"]`
    )

    if (existingScript) {
      return
    }

    // 动态创建并注入 AdSense 脚本
    const script = document.createElement("script")
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`
    script.async = true
    script.crossOrigin = "anonymous"

    document.head.appendChild(script)

    // 清理函数（可选）
    return () => {
      // AdSense 脚本通常不需要清理，因为它会在整个应用生命周期中使用
    }
  }, [adClientId])

  return null
}
