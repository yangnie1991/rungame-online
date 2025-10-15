import Script from "next/script"

interface GoogleAnalyticsProps {
  gaId: string
}

/**
 * Google Analytics 组件
 *
 * 使用 next/script 的 afterInteractive 策略（推荐）
 * - 在页面可交互后立即加载
 * - 不阻塞首屏渲染
 * - 自动优化脚本加载
 *
 * 注意：也可以使用 beforeInteractive 策略将脚本注入到 <head>，
 * 但会增加首屏加载时间，不推荐用于 GA
 */
export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  )
}
