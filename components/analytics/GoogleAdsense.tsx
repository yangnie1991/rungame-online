import Script from "next/script"

interface GoogleAdsenseProps {
  adClientId: string
}

/**
 * Google AdSense 组件
 *
 * 使用 next/script 的 afterInteractive 策略加载 AdSense
 * - 在页面可交互后立即加载
 * - 不阻塞首屏渲染
 * - 自动优化脚本加载
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
  // 如果没有配置 AdSense ID，则不渲染
  if (!adClientId) {
    return null
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
