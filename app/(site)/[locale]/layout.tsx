import { getTranslations, setRequestLocale } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { SiteHeader } from "@/components/site/Header"
import { Sidebar } from "@/components/site/Sidebar"
import { SiteFooter } from "@/components/site/Footer"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"
import { GoogleAdsense } from "@/components/analytics/GoogleAdsense"
import { getEnabledLanguages, getMainCategories, getAllTags, getAllPageTypes } from "@/lib/data"
import { routing } from "@/i18n/routing"
import { generateOrganizationSchema, renderJsonLd } from "@/lib/schema-generators"
import "@/app/globals.css"

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

/**
 * 用户端国际化布局
 * 包含html和body标签，动态设置lang属性
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  // 设置当前locale（next-intl要求）
  setRequestLocale(locale)

  // 获取翻译消息（用于客户端组件）
  const messages = await getMessages()

  // 获取启用的语言列表
  const languages = await getEnabledLanguages()

  // 获取主分类列表（用于侧边栏，只显示父分类）
  const categoriesData = await getMainCategories(locale)

  // 获取标签列表（用于侧边栏）
  const tagsData = await getAllTags(locale)

  // 获取页面类型列表（用于侧边栏）
  const pageTypesData = await getAllPageTypes(locale)

  // 准备主导航数据（首页）
  const mainNavItems = [
    { href: "/", icon: "🏠", text: locale === "zh" ? "首页" : "Home" },
  ]

  // 生成Organization Schema（全局）
  const organizationSchema = generateOrganizationSchema()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans">
        {/* Organization Schema - 全局网站组织信息 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema) }}
        />

        {/* Google Analytics - 使用 afterInteractive 策略，不阻塞首屏渲染 */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />

        {/* Google AdSense - 使用 afterInteractive 策略，不阻塞首屏渲染 */}
        <GoogleAdsense adClientId={process.env.NEXT_PUBLIC_ADSENSE_ID || ""} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <div className="flex h-screen flex-col overflow-hidden">
              {/* Top Banner - 固定高度顶部导航栏 */}
              <SiteHeader
                languages={languages}
                currentLocale={locale}
                mainNavItems={mainNavItems}
                categories={categoriesData.map((cat) => ({
                  slug: cat.slug,
                  name: cat.name,
                  icon: cat.icon,
                  count: cat.gameCount,
                }))}
                pageTypes={pageTypesData.map((pt) => ({
                  slug: pt.slug,
                  type: pt.type,
                  icon: pt.icon,
                  title: pt.title,
                  description: pt.description,
                }))}
              />

              {/* Main Layout: Sidebar + Content 填充剩余空间 */}
              <div className="flex w-full flex-1 overflow-hidden">
                {/* Left Sidebar - 左侧分类导航栏 */}
                <Sidebar
                  mainNavItems={mainNavItems}
                  pageTypes={pageTypesData.map((pt) => ({
                    slug: pt.slug,
                    type: pt.type,
                    icon: pt.icon,
                    title: pt.title,
                    description: pt.description,
                  }))}
                  categories={categoriesData.map((cat) => ({
                    slug: cat.slug,
                    name: cat.name,
                    icon: cat.icon,
                    count: cat.gameCount,
                  }))}
                  tags={tagsData.map((tag) => ({
                    slug: tag.slug,
                    name: tag.name,
                    icon: tag.icon,
                    count: tag.gameCount,
                  }))}
                />

                {/* Main Content - 填充剩余空间，支持滚动 */}
                <main className="flex-1 bg-background overflow-y-auto">
                  <div className="p-4 md:p-6">{children}</div>
                  <SiteFooter locale={locale} />
                </main>
              </div>
            </div>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// 生成metadata
export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'
  const title = t("siteTitle")
  const description = t("siteDescription")

  return {
    title: {
      default: title,
      template: '%s | RunGame',  // 使用 | 分隔符更简洁
    },
    description,

    // Favicon 和图标
    icons: {
      icon: [
        { url: '/logo/logo-rungame-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/logo/logo-rungame-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/logo/logo-rungame-64.png', sizes: '64x64', type: 'image/png' },
        { url: '/logo/logo-rungame-128.png', sizes: '128x128', type: 'image/png' },
        { url: '/logo/logo-rungame.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },

    // Web App Manifest
    manifest: '/manifest.json',

    // Open Graph (Facebook, LinkedIn)
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : `${locale}_US`,
      url: siteUrl,
      siteName: 'RunGame',
      title,
      description,
      images: [
        {
          url: `${siteUrl}/assets/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/assets/images/twitter-image.png`],
      creator: '@rungame',
    },

    // 其他 meta 标签
    other: {
      'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_ID || '',
      // 注意：theme-color 已在 viewport 中定义，这里不再重复
    },

    // 应用相关
    applicationName: 'RunGame',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'RunGame',
    },
  }
}

// 导出 viewport 配置
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',  // 使用primary颜色（蓝色），与品牌一致
}
