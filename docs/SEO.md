# SEO 文档

## 概述

RunGame 实现了全面的 SEO 优化策略，包括元标签、结构化数据、站点地图、多语言支持等。

## 核心 SEO 功能

### 1. 动态 Metadata

每个页面都生成独立的 metadata，使用 Next.js 15 的 `generateMetadata` API。

#### 游戏详情页

```typescript
// app/(site)/[locale]/games/play/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  if (!game) {
    return { title: 'Game Not Found' }
  }

  return {
    title: game.metaTitle || `${game.title} - Play Free Online`,
    description: game.metaDescription || game.description,
    keywords: game.keywords,

    openGraph: {
      title: game.metaTitle || game.title,
      description: game.metaDescription || game.description,
      images: [
        {
          url: game.banner || game.thumbnail,
          width: 1200,
          height: 630,
          alt: game.title,
        },
      ],
      type: 'website',
      locale: locale,
      siteName: 'RunGame',
    },

    twitter: {
      card: 'summary_large_image',
      title: game.metaTitle || game.title,
      description: game.metaDescription || game.description,
      images: [game.banner || game.thumbnail],
    },

    alternates: {
      canonical: `/${locale === 'en' ? '' : locale + '/'}games/play/${slug}`,
      languages: {
        'en': `/games/play/${slug}`,
        'zh': `/zh/games/play/${slug}`,
      },
    },
  }
}
```

#### 分类页

```typescript
// app/(site)/[locale]/games/category/[category]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params
  const categoryData = await getCategoryBySlug(category, locale)

  return {
    title: categoryData.metaTitle || `${categoryData.name} Games - RunGame`,
    description: categoryData.metaDescription || categoryData.description,
    keywords: categoryData.keywords,

    openGraph: {
      title: categoryData.metaTitle || `${categoryData.name} Games`,
      description: categoryData.metaDescription || categoryData.description,
      type: 'website',
      locale: locale,
    },

    alternates: {
      canonical: `/${locale === 'en' ? '' : locale + '/'}games/category/${category}`,
      languages: {
        'en': `/games/category/${category}`,
        'zh': `/zh/games/category/${category}`,
      },
    },
  }
}
```

### 2. SEO 辅助函数

`lib/seo-helpers.ts` 提供统一的 SEO metadata 生成。

```typescript
export function generateGameSEOMetadata(params: {
  title: string
  description: string
  locale: string
  slug: string
  categoryName?: string
  tags?: string[]
  thumbnail?: string
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  const {
    title,
    description,
    locale,
    slug,
    categoryName,
    tags = [],
    thumbnail,
    publishedTime,
    modifiedTime,
  } = params

  const keywords = [title, categoryName, ...tags, 'free online game', 'HTML5 game']
    .filter(Boolean)
    .join(', ')

  const url = `/${locale === 'en' ? '' : locale + '/'}games/play/${slug}`

  return {
    title: `${title} - Play Free Online | RunGame`,
    description,
    keywords,

    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale,
      siteName: 'RunGame',
      images: thumbnail
        ? [
            {
              url: thumbnail,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thumbnail ? [thumbnail] : [],
    },

    alternates: {
      canonical: url,
      languages: {
        'en': `/games/play/${slug}`,
        'zh': `/zh/games/play/${slug}`,
      },
    },
  }
}
```

### 3. 结构化数据 (JSON-LD)

为游戏页面添加结构化数据，提升搜索引擎理解。

```typescript
// 游戏详情页添加 JSON-LD
export default async function GamePage({ params }: Props) {
  const { locale, slug } = await params
  const game = await getGameBySlug(slug, locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    image: game.banner || game.thumbnail,
    genre: game.category.name,
    keywords: game.tags.map(t => t.name).join(', '),
    aggregateRating: game.rating > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: game.rating,
          ratingCount: game.ratingCount,
          bestRating: 5,
        }
      : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/PlayAction',
      userInteractionCount: game.playCount,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RunGame',
      url: 'https://rungame.online',
    },
    datePublished: game.publishedAt?.toISOString(),
    inLanguage: locale,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 页面内容 */}
    </>
  )
}
```

#### 面包屑导航 JSON-LD

```typescript
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://rungame.online',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Games',
      item: 'https://rungame.online/games',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: game.category.name,
      item: `https://rungame.online/games/category/${game.category.slug}`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: game.title,
      item: `https://rungame.online/games/play/${game.slug}`,
    },
  ],
}
```

### 4. 语言替代标签

自动生成 hreflang 标签，告诉搜索引擎多语言版本。

```typescript
// Next.js 自动处理
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    alternates: {
      canonical: currentUrl,
      languages: {
        'en': englishUrl,
        'zh': chineseUrl,
        'x-default': englishUrl,  // 默认语言
      },
    },
  }
}
```

渲染为:
```html
<link rel="canonical" href="https://rungame.online/games" />
<link rel="alternate" hreflang="en" href="https://rungame.online/games" />
<link rel="alternate" hreflang="zh" href="https://rungame.online/zh/games" />
<link rel="alternate" hreflang="x-default" href="https://rungame.online/games" />
```

### 5. Robots.txt

```
# public/robots.txt
User-agent: *
Allow: /

# 禁止爬取管理后台
Disallow: /admin/
Disallow: /login

# 禁止爬取 API
Disallow: /api/

# Sitemap
Sitemap: https://rungame.online/sitemap.xml
```

### 6. Sitemap

动态生成站点地图。

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rungame.online'

  // 静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // 游戏页面
  const games = await prisma.game.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
  })

  const gamePages = games.flatMap((game) => [
    {
      url: `${baseUrl}/games/play/${game.slug}`,
      lastModified: game.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/zh/games/play/${game.slug}`,
      lastModified: game.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    // es, fr...
  ])

  // 分类页面
  const categories = await prisma.category.findMany({
    where: { isEnabled: true },
    select: { slug: true, updatedAt: true },
  })

  const categoryPages = categories.flatMap((cat) => [
    {
      url: `${baseUrl}/games/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    // 其他语言版本...
  ])

  return [...staticPages, ...gamePages, ...categoryPages]
}
```

## Google Services 集成

### 1. Google Analytics

#### 配置

```env
# .env
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

#### 集成代码

```typescript
// app/(site)/[locale]/layout.tsx
import Script from 'next/script'

export default function SiteLayout({ children }: Props) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html>
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### 事件跟踪

```typescript
// 游戏播放事件
export function trackGamePlay(gameTitle: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'game_play', {
      game_title: gameTitle,
    })
  }
}

// 在组件中使用
useEffect(() => {
  trackGamePlay(game.title)
}, [game.title])
```

### 2. Google AdSense

#### 配置

```env
NEXT_PUBLIC_ADSENSE_ID="ca-pub-XXXXXXXXXXXXXXXX"
```

#### ads.txt

```
# public/ads.txt
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

#### 集成代码

```typescript
// app/(site)/[locale]/layout.tsx
<Script
  async
  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

#### 广告组件

```typescript
// components/ads/AdUnit.tsx
'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle'
  style?: React.CSSProperties
}

export function AdUnit({ slot, format = 'auto', style }: AdUnitProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={style || { display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
```

#### 使用广告

```typescript
// 在页面中使用
<AdUnit slot="1234567890" format="auto" />
```

### 3. Google Search Console

#### 验证方法

**方法 1: HTML 文件验证**

```
public/googleXXXXXXXXXXXXXXXX.html
```

**方法 2: Meta 标签验证**

```typescript
// app/(site)/[locale]/layout.tsx
export const metadata = {
  verification: {
    google: 'your-verification-code',
  },
}
```

#### 提交 Sitemap

在 Google Search Console 中提交:
```
https://rungame.online/sitemap.xml
```

## URL 结构优化

### 1. URL 命名规则

✅ **推荐**:
```
/games/play/puzzle-adventure
/games/category/action
/games/tags/multiplayer
/most-played
```

❌ **避免**:
```
/games/play?id=123
/games/category?cat=action
/page?type=most-played
```

使用描述性的 slug 而非 ID 或查询参数。

### 2. 多语言 URL

✅ **推荐**:
```
/games                   (英文)
/zh/games               (中文)
/es/games               (西班牙语)
```

每个语言都有独立的 URL，利于 SEO。

### 3. 规范化 URL

使用 canonical 标签避免重复内容：

```typescript
export const metadata = {
  alternates: {
    canonical: '/games/play/puzzle-game',  // 规范 URL
  },
}
```

## 性能优化（SEO相关）

### 1. Core Web Vitals

Next.js 15 自动优化：
- **LCP** (Largest Contentful Paint): 图片优化
- **FID** (First Input Delay): 代码分割
- **CLS** (Cumulative Layout Shift): 布局稳定

### 2. 图片优化

使用 Next.js Image 组件：

```typescript
import Image from 'next/image'

<Image
  src={game.thumbnail}
  alt={game.title}
  width={300}
  height={200}
  loading="lazy"  // 懒加载
  placeholder="blur"  // 模糊占位
/>
```

### 3. 字体优化

使用 Next.js 字体优化：

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // 避免 FOIT
})
```

### 4. 预加载关键资源

```typescript
// app/(site)/[locale]/layout.tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
</head>
```

## 内容优化

### 1. 标题优化

**格式**: `{游戏名} - {辅助描述} | {网站名}`

示例:
```
Puzzle Adventure - Play Free Online | RunGame
```

**长度**: 50-60 字符（含中文）

### 2. 描述优化

**格式**: 简短吸引人的描述 + 独特卖点 + 行动召唤

示例:
```
Play Puzzle Adventure online for free. Solve challenging puzzles and explore mysterious worlds. No download required. Start playing now!
```

**长度**: 150-160 字符

### 3. 关键词策略

**主关键词**:
- 游戏名称
- 游戏类型
- "free online game"
- "play online"

**长尾关键词**:
- "{游戏名} online free"
- "play {游戏名} no download"
- "{类型} games online"

### 4. 内容结构

使用语义化 HTML：

```tsx
<article>
  <header>
    <h1>{game.title}</h1>
    <p>{game.description}</p>
  </header>

  <section>
    <h2>How to Play</h2>
    <p>{game.instructions}</p>
  </section>

  <section>
    <h2>Game Controls</h2>
    <p>{game.controls}</p>
  </section>

  <footer>
    <p>Category: <Link href={...}>{category}</Link></p>
    <p>Tags: {tags.map(...)}</p>
  </footer>
</article>
```

## 链接策略

### 1. 内部链接

**在游戏详情页添加**:
- 返回游戏列表
- 同分类游戏
- 相关标签游戏
- 推荐游戏

**在首页添加**:
- 热门分类链接
- 精选游戏链接
- 标签云
- 热门标签

### 2. 面包屑导航

```typescript
<nav aria-label="Breadcrumb">
  <ol>
    <li><Link href="/">Home</Link></li>
    <li><Link href="/games">Games</Link></li>
    <li><Link href={`/games/category/${category}`}>{categoryName}</Link></li>
    <li aria-current="page">{game.title}</li>
  </ol>
</nav>
```

### 3. 相关内容

在每个游戏页面底部显示：
- 同分类的其他游戏 (6-12个)
- 相似标签的游戏
- 最新游戏
- 热门游戏

## 监控与分析

### 1. 关键指标

在 Google Analytics 中监控：
- **页面浏览量** (Pageviews)
- **用户数** (Users)
- **跳出率** (Bounce Rate)
- **平均停留时间** (Avg. Session Duration)
- **页面加载速度** (Page Load Time)

### 2. 搜索性能

在 Google Search Console 中监控：
- **点击次数** (Clicks)
- **展示次数** (Impressions)
- **点击率** (CTR)
- **平均排名** (Average Position)

### 3. Core Web Vitals

定期检查：
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## 最佳实践清单

### ✅ 技术 SEO

- [x] 响应式设计（移动友好）
- [x] HTTPS 加密
- [x] 快速加载速度
- [x] 规范化 URL
- [x] XML Sitemap
- [x] Robots.txt
- [x] 结构化数据
- [x] 语言替代标签

### ✅ 内容 SEO

- [x] 独特的页面标题
- [x] 吸引人的描述
- [x] 相关关键词
- [x] 高质量内容
- [x] 语义化 HTML
- [x] 图片 alt 文本
- [x] 内部链接
- [x] 面包屑导航

### ✅ 国际化 SEO

- [x] hreflang 标签
- [x] 独立的语言 URL
- [x] 本地化内容
- [x] 多语言 sitemap

### ✅ 性能优化

- [x] 图片优化
- [x] 代码分割
- [x] 懒加载
- [x] 缓存策略
- [x] CDN 加速

## 工具推荐

### SEO 检查工具

- **Google PageSpeed Insights**: 性能和 SEO 分析
- **Google Mobile-Friendly Test**: 移动友好性测试
- **Google Rich Results Test**: 结构化数据测试
- **Ahrefs**: 综合 SEO 分析
- **Screaming Frog**: 网站爬取和分析

### 监控工具

- **Google Analytics**: 流量分析
- **Google Search Console**: 搜索性能
- **Google Tag Manager**: 标签管理
- **Hotjar**: 用户行为分析

## 相关文件

- SEO 辅助函数: [lib/seo-helpers.ts](../lib/seo-helpers.ts)
- Sitemap: [app/sitemap.ts](../app/sitemap.ts)
- Robots: [public/robots.txt](../public/robots.txt)
- Ads.txt: [public/ads.txt](../public/ads.txt)
