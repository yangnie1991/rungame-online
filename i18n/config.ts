import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

// next-intl配置
export default getRequestConfig(async ({ requestLocale }) => {
  // 验证传入的locale，如果无效则使用默认语言
  let locale = await requestLocale

  // 检查locale是否在支持的语言列表中
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Asia/Shanghai",
    now: new Date(),
  }
})
