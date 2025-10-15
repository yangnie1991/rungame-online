# Google AdSense 配置指南

本文档介绍如何在 RunGame 项目中配置 Google AdSense 广告。

## 配置步骤

### 1. 获取 AdSense 发布商 ID

1. 登录 [Google AdSense](https://www.google.com/adsense)
2. 在设置中找到您的发布商 ID（格式：`ca-pub-xxxxxxxxxxxxxx`）
3. 复制该 ID

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```env
# Google AdSense
NEXT_PUBLIC_ADSENSE_ID="ca-pub-1239281249435423"
```

**注意**：
- 将 `ca-pub-1239281249435423` 替换为您自己的发布商 ID
- 该环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端使用

### 3. 验证配置

AdSense 组件已集成到网站布局中（`app/(site)/[locale]/layout.tsx`），会自动加载 AdSense 脚本。

```tsx
<GoogleAdsense adClientId={process.env.NEXT_PUBLIC_ADSENSE_ID || ""} />
```

### 4. 技术实现

#### GoogleAdsense 组件

位置：`components/analytics/GoogleAdsense.tsx`

特点：
- 使用 `next/script` 的 `afterInteractive` 策略
- 不阻塞首屏渲染
- 自动优化脚本加载
- 如果未配置 ID，组件不会渲染

#### 加载脚本

AdSense 脚本会在页面可交互后自动加载：

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxx"
  crossorigin="anonymous">
</script>
```

## 使用广告单元

### 自动广告

配置完成后，AdSense 会自动在网站上展示广告。您可以在 AdSense 控制台中启用自动广告功能。

### 手动广告单元

如果您想在特定位置放置广告，可以创建广告单元组件：

```tsx
// components/ads/AdUnit.tsx
"use client"

import { useEffect } from "react"

interface AdUnitProps {
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
}

export function AdUnit({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true
}: AdUnitProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error("AdSense error:", err)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  )
}
```

使用示例：

```tsx
import { AdUnit } from "@/components/ads/AdUnit"

// 在游戏页面中
<AdUnit adSlot="1234567890" />
```

## 常见广告位置

### 1. 游戏详情页顶部
在游戏标题和游戏 iframe 之间放置横幅广告

### 2. 游戏详情页底部
在推荐游戏区域之前放置广告

### 3. 游戏列表页侧边栏
在侧边栏底部放置竖向广告

### 4. 首页各游戏板块之间
在精选、最多人玩等板块之间插入广告

## 性能优化

### 延迟加载

AdSense 组件使用 `afterInteractive` 策略，确保：
- ✅ 不阻塞首屏渲染
- ✅ 在页面可交互后加载
- ✅ 不影响 Core Web Vitals 指标

### 响应式广告

使用 `data-full-width-responsive="true"` 确保广告在不同设备上正确显示。

## 验证和调试

### 1. 检查脚本加载

打开浏览器开发者工具 → Network 标签，搜索 `adsbygoogle.js`，确认脚本已加载。

### 2. 查看控制台

检查浏览器控制台是否有 AdSense 相关错误。

### 3. AdSense 审核

- 新网站需要通过 AdSense 审核才能展示真实广告
- 审核期间可能显示空白广告位或测试广告
- 审核通过后会自动展示真实广告

## 注意事项

1. **不要点击自己的广告**：违反 AdSense 政策，可能导致账户被封
2. **广告密度**：不要在页面上放置过多广告，影响用户体验
3. **广告位置**：遵循 AdSense 政策，不要放置在误导性位置
4. **内容政策**：确保网站内容符合 AdSense 内容政策

## 生产环境部署

部署到 Vercel 时，确保在 Vercel 项目设置中添加环境变量：

1. 进入 Vercel 项目设置 → Environment Variables
2. 添加：`NEXT_PUBLIC_ADSENSE_ID` = `ca-pub-xxxxxxxxxxxxxx`
3. 重新部署项目

## 相关文档

- [Google AdSense 官方文档](https://support.google.com/adsense)
- [Next.js Script 组件](https://nextjs.org/docs/app/api-reference/components/script)
- [AdSense 政策中心](https://support.google.com/adsense/answer/48182)

---

**最后更新**：2025-10-15
