import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RunGame - Free Online Games",
  description: "Play free online games instantly. No download required.",
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // (site) layout不应该包含html和body标签
  // 这些由[locale]/layout.tsx处理
  return children
}
