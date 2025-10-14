import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
  // 支持的所有语言
  locales: ["en", "zh", "es", "fr"],

  // 默认语言
  defaultLocale: "en",

  // 使用"as-needed"模式：默认语言不显示前缀
  localePrefix: "as-needed",
})

// 导出类型安全的导航工具
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
