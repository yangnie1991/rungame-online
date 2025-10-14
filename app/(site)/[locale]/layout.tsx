import { getTranslations, setRequestLocale } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Inter } from "next/font/google"
import { SiteHeader } from "@/components/site/Header"
import { Sidebar } from "@/components/site/Sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { getEnabledLanguages, getAllCategories, getAllTags, getAllPageTypes } from "../actions"
import { routing } from "@/i18n/routing"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

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

  // 获取分类列表（用于侧边栏）
  const categoriesData = await getAllCategories(locale)

  // 获取标签列表（用于侧边栏）
  const tagsData = await getAllTags(locale)

  // 获取页面类型列表（用于侧边栏）
  const pageTypesData = await getAllPageTypes(locale)

  // 准备主导航数据（首页）
  const mainNavItems = [
    { href: "/", icon: "🏠", text: locale === "zh" ? "首页" : "Home" },
  ]

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <div className="flex h-screen flex-col overflow-hidden">
              {/* Top Banner - 固定高度顶部导航栏 */}
              <SiteHeader languages={languages} currentLocale={locale} />

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

// 生成静态参数（用于静态生成所有语言版本）
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }))
}

// 生成metadata
export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
  }
}
