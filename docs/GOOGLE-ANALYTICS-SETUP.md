# Google Analytics 集成文档

## 概述

本文档描述了如何在 RunGame 项目中集成 Google Analytics (GA4)。

## 实施详情

### 1. Google Analytics 组件

**文件位置**: [components/analytics/GoogleAnalytics.tsx](components/analytics/GoogleAnalytics.tsx)

```tsx
import Script from "next/script"

interface GoogleAnalyticsProps {
  gaId: string
}

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
```

**关键特性**:
- 使用 Next.js `Script` 组件进行优化加载
- `strategy="afterInteractive"` - 在页面交互后加载，不阻塞首屏渲染
- 支持动态传入 GA Measurement ID

### 2. 集成到根布局

**文件位置**: [app/(site)/[locale]/layout.tsx](app/(site)/[locale]/layout.tsx#L54)

```tsx
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // ... 省略其他代码

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics gaId="G-DXC4W78DF6" />
        {/* ... 省略其他内容 */}
      </body>
    </html>
  )
}
```

## 配置说明

### Google Analytics ID

当前使用的 Measurement ID: **G-DXC4W78DF6**

### 作用范围

Google Analytics 已集成到**用户端网站**的所有页面：
- ✅ 首页
- ✅ 游戏列表页
- ✅ 游戏详情页
- ✅ 分类页面
- ✅ 标签页面
- ✅ 动态 PageType 页面
- ❌ 管理后台（未集成，通常管理后台不需要统计）

## 性能优化

### Script 加载策略

使用 `afterInteractive` 策略确保：
1. **不阻塞首屏渲染** - GA 脚本在页面可交互后才加载
2. **不影响 Core Web Vitals** - 不会降低 LCP、FID、CLS 指标
3. **自动优化** - Next.js 自动进行脚本优化和缓存

### 对比其他策略

| 策略 | 加载时机 | 适用场景 | 对性能的影响 |
|------|----------|----------|--------------|
| `beforeInteractive` | 在页面可交互前 | 关键脚本（如 polyfills） | ⚠️ 可能影响首屏 |
| `afterInteractive` | 在页面可交互后 | 分析脚本、广告 | ✅ 不影响首屏 |
| `lazyOnload` | 在所有资源加载后 | 非关键脚本 | ✅ 最小影响 |
| `worker` | 在 Web Worker 中 | 实验性功能 | ✅ 零影响 |

**选择 `afterInteractive` 的原因**：
- Google Analytics 需要尽早开始收集数据
- 但不能阻塞页面渲染
- `afterInteractive` 是分析工具的最佳实践

## 验证方法

### 1. 开发环境验证

**步骤**:
1. 启动开发服务器:
   ```bash
   npm run dev
   ```

2. 打开浏览器访问: `http://localhost:3001`

3. 打开浏览器开发者工具 (F12)

4. 检查以下内容:

**Network 面板**:
- 查找 `gtag/js?id=G-DXC4W78DF6` 请求
- 状态应为 `200 OK`

**Console 面板**:
- 运行以下命令检查 GA 是否加载:
  ```javascript
  window.dataLayer
  ```
- 应返回一个数组，包含 GA 事件

**Elements 面板**:
- 查找 `<script>` 标签，src 为 `https://www.googletagmanager.com/gtag/js?id=G-DXC4W78DF6`

### 2. 使用 Google Analytics DebugView

**步骤**:
1. 在 Chrome 安装 [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) 扩展

2. 启用扩展后访问网站

3. 打开 Google Analytics 后台 → 配置 → DebugView

4. 在 DebugView 中实时查看事件

### 3. 生产环境验证

**步骤**:
1. 部署到生产环境

2. 访问 [Google Analytics 后台](https://analytics.google.com/)

3. 导航到: 报告 → 实时 → 概览

4. 访问网站的不同页面

5. 在实时报告中应该能看到:
   - 活跃用户数增加
   - 浏览的页面路径
   - 事件触发记录

## 自动收集的数据

Google Analytics 4 会自动收集以下数据（无需额外配置）：

### 基础事件
- `page_view` - 页面浏览
- `first_visit` - 首次访问
- `session_start` - 会话开始

### 用户参与度
- `user_engagement` - 用户参与时长
- `scroll` - 页面滚动深度

### 增强测量事件（需在 GA 后台启用）
- `click` - 外部链接点击
- `file_download` - 文件下载
- `video_start` / `video_complete` - 视频播放
- `form_start` / `form_submit` - 表单交互

### 自动收集的用户属性
- 地理位置（国家、城市）
- 设备类型（桌面、移动、平板）
- 浏览器和操作系统
- 屏幕分辨率
- 语言偏好

## 自定义事件（未来扩展）

如果需要跟踪特定用户行为，可以添加自定义事件：

### 游戏相关事件示例

```tsx
// 游戏开始播放
gtag('event', 'game_play', {
  game_name: 'Red Hide Ball',
  game_category: 'Puzzle',
  game_id: 'red-hide-ball'
})

// 游戏完成
gtag('event', 'game_complete', {
  game_name: 'Red Hide Ball',
  play_time: 120, // 秒
  score: 1500
})

// 游戏分享
gtag('event', 'share', {
  method: 'Twitter',
  content_type: 'game',
  content_id: 'red-hide-ball'
})
```

### 实现自定义事件跟踪

**1. 创建事件跟踪 Hook**:

```tsx
// hooks/useAnalytics.ts
export function useAnalytics() {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams)
    }
  }

  return { trackEvent }
}
```

**2. 在组件中使用**:

```tsx
import { useAnalytics } from '@/hooks/useAnalytics'

export function GameCard({ game }) {
  const { trackEvent } = useAnalytics()

  const handleClick = () => {
    trackEvent('game_click', {
      game_name: game.title,
      game_category: game.category
    })
  }

  return <div onClick={handleClick}>...</div>
}
```

## 环境变量配置（可选）

为了更好的灵活性，可以将 GA ID 移到环境变量：

### 1. 添加到 .env.local

```env
NEXT_PUBLIC_GA_ID=G-DXC4W78DF6
```

### 2. 更新布局文件

```tsx
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
```

### 3. 添加类型声明

```tsx
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GA_ID: string
  }
}
```

**注意**: `NEXT_PUBLIC_` 前缀使变量在客户端可用。

## 隐私和 GDPR 合规

### Cookie 同意（未来考虑）

根据 GDPR 和其他隐私法规，可能需要实现 Cookie 同意机制：

**推荐方案**:
- [CookieYes](https://www.cookieyes.com/)
- [OneTrust](https://www.onetrust.com/)
- [Osano](https://www.osano.com/)

**或自建方案**:

```tsx
// components/analytics/CookieConsent.tsx
export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null)

  useEffect(() => {
    const savedConsent = localStorage.getItem('ga-consent')
    setConsent(savedConsent === 'true')
  }, [])

  const handleAccept = () => {
    setConsent(true)
    localStorage.setItem('ga-consent', 'true')
    // 初始化 GA
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    })
  }

  if (consent !== null) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card p-4 shadow-lg">
      <p>我们使用 cookies 来改善您的体验...</p>
      <button onClick={handleAccept}>接受</button>
    </div>
  )
}
```

### IP 匿名化

Google Analytics 4 默认启用 IP 匿名化，无需额外配置。

## 故障排查

### 问题：无法在 GA 后台看到数据

**可能原因**:
1. **GA ID 错误** - 检查 Measurement ID 是否正确
2. **网络阻止** - 检查是否有广告拦截器
3. **数据延迟** - GA 数据可能有 24-48 小时延迟（使用实时报告测试）
4. **过滤器** - 检查 GA 后台是否设置了 IP 过滤器

**解决方法**:
```bash
# 检查 Network 面板
# 确保看到这些请求成功:
# - https://www.googletagmanager.com/gtag/js?id=G-DXC4W78DF6
# - https://www.google-analytics.com/g/collect?...
```

### 问题：控制台出现 CSP 错误

**症状**: Content Security Policy 阻止了 GA 脚本

**解决方法**: 在 `next.config.ts` 中添加 CSP 头:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com"
          }
        ]
      }
    ]
  }
}
```

### 问题：开发环境数据污染生产环境

**解决方法**: 根据环境条件加载 GA:

```tsx
export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const isProd = process.env.NODE_ENV === 'production'

  return (
    <html lang={locale}>
      <body>
        {isProd && <GoogleAnalytics gaId="G-DXC4W78DF6" />}
        {/* ... */}
      </body>
    </html>
  )
}
```

## 相关资源

### 官方文档
- [Google Analytics 4 文档](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Script 组件文档](https://nextjs.org/docs/app/api-reference/components/script)
- [gtag.js 参考](https://developers.google.com/tag-platform/gtagjs/reference)

### 相关文件
- [components/analytics/GoogleAnalytics.tsx](components/analytics/GoogleAnalytics.tsx) - GA 组件
- [app/(site)/[locale]/layout.tsx](app/(site)/[locale]/layout.tsx) - 根布局

### 最佳实践
- [Next.js + Google Analytics 集成指南](https://nextjs.org/learn/seo/monitoring/google-analytics)
- [GA4 事件跟踪最佳实践](https://support.google.com/analytics/answer/9267735)

---

**最后更新**: 2025-10-14
**当前状态**: ✅ 已集成并测试
**GA Measurement ID**: G-DXC4W78DF6
