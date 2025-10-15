# SEO 优化应用指南

## ✅ 已优化的页面

### 1. PageType 页面
- 文件：`app/(site)/[locale]/[pageType]/page.tsx`
- 状态：✅ 已完成
- 包含：Open Graph, Twitter Card, Canonical, 多语言链接，搜索引擎指令

### 2. 游戏详情页
- 文件：`app/(site)/[locale]/games/[slug]/page.tsx`
- 状态：✅ 已完成
- 使用：`generateGameSEOMetadata()`
- 特点：包含游戏缩略图、分类、标签、发布时间

### 3. 分类页面
- 文件：`app/(site)/[locale]/games/category/[category]/page.tsx`
- 状态：✅ 已完成
- 使用：`generateCategorySEOMetadata()`
- 特点：显示游戏数量、分类描述

## 📝 待优化的页面

### 4. 标签页面
文件：`app/(site)/[locale]/games/tags/[tag]/page.tsx`

```typescript
// 添加导入
import { generateTagSEOMetadata } from "@/lib/seo-helpers"

// 修改 generateMetadata
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params
  const data = await getGamesByTagWithPagination(tag, locale, 1, 24)

  if (!data) {
    return { title: "Tag Not Found" }
  }

  return generateTagSEOMetadata({
    tagName: data.tag.name,
    locale,
    slug: tag,
    gameCount: data.pagination.totalGames,
  })
}
```

### 5. 首页
文件：`app/(site)/[locale]/page.tsx`

```typescript
// 添加导入
import { generateHomeSEOMetadata } from "@/lib/seo-helpers"

// 修改 generateMetadata
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params

  // 可选：获取游戏总数
  const totalGames = await prisma.game.count({ where: { isPublished: true } })

  return generateHomeSEOMetadata(locale, totalGames)
}
```

### 6. 游戏列表页
文件：`app/(site)/[locale]/games/page.tsx`

```typescript
import { generateSEOMetadata } from "@/lib/seo-helpers"

export async function generateMetadata({ params }: GamesPageProps): Promise<Metadata> {
  const { locale } = await params

  const titles = {
    en: 'All Games - Browse Free Online Games | RunGame',
    zh: '所有游戏 - 浏览免费在线游戏 | RunGame',
    es: 'Todos los Juegos - Juegos Gratis en Línea | RunGame',
    fr: 'Tous les Jeux - Jeux Gratuits en Ligne | RunGame',
  }

  const descriptions = {
    en: 'Browse all free online games on RunGame. Action, puzzle, racing, sports and more. Instant play, no downloads!',
    zh: '浏览 RunGame 上的所有免费在线游戏。动作、益智、赛车、体育等更多游戏。即刻畅玩，无需下载！',
    es: 'Explora todos los juegos gratis en RunGame. Acción, puzzles, carreras, deportes y más. ¡Juega al instante!',
    fr: 'Parcourez tous les jeux gratuits sur RunGame. Action, puzzle, course, sport et plus. Jouez instantanément!',
  }

  return generateSEOMetadata({
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    locale,
    path: `/${locale}/games`,
  })
}
```

## 🔧 SEO 工具函数

所有 SEO 工具函数位于：`lib/seo-helpers.ts`

### 可用函数：

1. **generateSEOMetadata()** - 通用 SEO 元数据生成
2. **generateGameSEOMetadata()** - 游戏详情页专用
3. **generateCategorySEOMetadata()** - 分类页面专用
4. **generateTagSEOMetadata()** - 标签页面专用
5. **generateHomeSEOMetadata()** - 首页专用
6. **getSiteUrl()** - 获取网站基础 URL

### 统一特性：

- ✅ Open Graph 标签（Facebook, LinkedIn）
- ✅ Twitter Card 标签
- ✅ Canonical 链接
- ✅ 多语言 alternate 链接（hreflang）
- ✅ 搜索引擎爬虫指令
- ✅ 移动端优化标签
- ✅ 关键词优化
- ✅ 描述长度控制

## 📊 SEO 最佳实践

### 标题结构
```
主关键词 - 修饰词 | 品牌名
例：Most Played Games - Free Online Games | RunGame
```

### 描述结构
```
行动号召 + 价值主张 + 特点
例：Play 1000+ free online games on RunGame! Action, puzzle, racing, sports and more. Browser games, no downloads, instant fun!
```

### 关键词策略
- 主关键词（游戏名、分类名、标签名）
- 通用关键词（free online games, browser games）
- 本地化关键词（根据语言添加）

## 🌐 多语言支持

所有页面自动生成：
- `hreflang` 标签（en, zh, es, fr）
- `x-default` 标签（默认英文）
- Open Graph `locale` 属性

## 🚀 部署检查清单

部署前确保：
- [ ] 所有页面都有 `generateMetadata` 函数
- [ ] 使用统一的 SEO 工具函数
- [ ] `NEXT_PUBLIC_SITE_URL` 环境变量已设置
- [ ] OG 图片路径正确
- [ ] 测试所有语言版本
- [ ] 使用 Lighthouse 检查 SEO 分数

## 🔍 验证工具

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Lighthouse SEO Audit](chrome://lighthouse)

---

**最后更新**: 2025-01-14
**负责人**: Claude Code
