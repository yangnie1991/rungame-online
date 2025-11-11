/**
 * 手动 URL 提交页面
 * 允许管理员手动选择游戏/分类/标签并提交到搜索引擎
 */

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, Gamepad2, FolderTree, Tags, FileType } from 'lucide-react'
import { SubmitForm, SubmitButton } from './SubmitForm'
import { UrlPreviewWrapper } from './UrlPreviewWrapper'

async function getSearchEngineConfigs() {
  return prisma.searchEngineConfig.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      icon: true,
      type: true,
    },
  })
}

async function getGames() {
  return prisma.game.findMany({
    where: { status: 'PUBLISHED' },
    take: 50,
    orderBy: { playCount: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnail: true,
    },
  })
}

async function getCategories() {
  return prisma.category.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      parentId: true,
    },
  })
}

async function getTags() {
  return prisma.tag.findMany({
    where: { isEnabled: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
    },
  })
}

async function getPageTypes() {
  return prisma.pageType.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      icon: true,
    },
  })
}

function SearchEngineSelector({ engines }: { engines: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>选择搜索引擎</CardTitle>
        <CardDescription>选择要提交 URL 的目标搜索引擎</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {engines.map((engine) => (
            <label
              key={engine.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                name="engines"
                value={engine.id}
                className="h-4 w-4"
                defaultChecked={engine.type === 'indexnow'}
              />
              {engine.icon && <span className="text-xl">{engine.icon}</span>}
              <span className="font-medium">{engine.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {engine.type}
              </Badge>
            </label>
          ))}
        </div>

        {engines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            没有可用的搜索引擎配置。请先在{' '}
            <a href="/admin/seo-submissions/config" className="text-blue-600 hover:underline">
              配置页面
            </a>{' '}
            启用搜索引擎。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

async function GamesTab() {
  const games = await getGames()

  return (
    <div className="grid gap-3">
      {games.map((game) => (
        <label
          key={game.id}
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <input type="checkbox" name="games" value={game.id} className="h-4 w-4" />
          {game.thumbnail && (
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div className="flex-1">
            <div className="font-medium">{game.title}</div>
            <div className="text-sm text-muted-foreground">/{game.slug}</div>
          </div>
        </label>
      ))}
    </div>
  )
}

async function CategoriesTab() {
  const categories = await getCategories()

  // 分离主分类和子分类
  const mainCategories = categories.filter((c) => !c.parentId)
  const subCategories = categories.filter((c) => c.parentId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">主分类</h3>
        <div className="grid gap-3">
          {mainCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                name="categories"
                value={category.id}
                className="h-4 w-4"
              />
              {category.icon && <span className="text-xl">{category.icon}</span>}
              <div className="flex-1">
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-muted-foreground">/category/{category.slug}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {subCategories.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">子分类</h3>
          <div className="grid gap-3">
            {subCategories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={category.id}
                  className="h-4 w-4"
                />
                {category.icon && <span className="text-xl">{category.icon}</span>}
                <div className="flex-1">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">/category/.../  {category.slug}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

async function TagsTab() {
  const tags = await getTags()

  return (
    <div className="grid gap-3">
      {tags.map((tag) => (
        <label
          key={tag.id}
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <input type="checkbox" name="tags" value={tag.id} className="h-4 w-4" />
          {tag.icon && <span className="text-xl">{tag.icon}</span>}
          <div className="flex-1">
            <div className="font-medium">{tag.name}</div>
            <div className="text-sm text-muted-foreground">/tag/{tag.slug}</div>
          </div>
        </label>
      ))}
    </div>
  )
}

async function PageTypesTab() {
  const pageTypes = await getPageTypes()

  return (
    <div className="grid gap-3">
      {pageTypes.map((pageType) => (
        <label
          key={pageType.id}
          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <input type="checkbox" name="pageTypes" value={pageType.id} className="h-4 w-4" />
          {pageType.icon && <span className="text-xl">{pageType.icon}</span>}
          <div className="flex-1">
            <div className="font-medium">{pageType.title}</div>
            <div className="text-sm text-muted-foreground">/collection/{pageType.slug}</div>
          </div>
        </label>
      ))}
    </div>
  )
}

export default async function SubmitUrlPage() {
  const engines = await getSearchEngineConfigs()

  return (
    <SubmitForm>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">手动提交 URL</h1>
          <p className="text-muted-foreground mt-2">
            选择游戏、分类、标签或页面类型，将其 URL 提交到搜索引擎
          </p>
        </div>

        {/* 使用说明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>提交说明</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>选择要提交的内容（游戏、分类等）和目标搜索引擎</li>
              <li>系统会自动生成所有语言版本的 URL（en, zh）</li>
              <li>IndexNow 提交后会同步到 Bing、Yandex 等多个搜索引擎</li>
              <li>Google 不支持主动推送，请在 Search Console 查看 Sitemap</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左侧：选择内容 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>选择要提交的内容</CardTitle>
                <CardDescription>支持批量选择，最多 50 项</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="games" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="games" className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      游戏
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4" />
                      分类
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      标签
                    </TabsTrigger>
                    <TabsTrigger value="pagetypes" className="flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      页面
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 max-h-[500px] overflow-y-auto">
                    <TabsContent value="games">
                      <Suspense fallback={<div className="py-8 text-center text-muted-foreground">加载中...</div>}>
                        <GamesTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="categories">
                      <Suspense fallback={<div className="py-8 text-center text-muted-foreground">加载中...</div>}>
                        <CategoriesTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="tags">
                      <Suspense fallback={<div className="py-8 text-center text-muted-foreground">加载中...</div>}>
                        <TagsTab />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="pagetypes">
                      <Suspense fallback={<div className="py-8 text-center text-muted-foreground">加载中...</div>}>
                        <PageTypesTab />
                      </Suspense>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* URL 预览 */}
            <UrlPreviewWrapper />
          </div>

          {/* 右侧：选择搜索引擎和提交 */}
          <div className="space-y-6">
            <SearchEngineSelector engines={engines} />

            <Card>
              <CardHeader>
                <CardTitle>提交操作</CardTitle>
              </CardHeader>
              <CardContent>
                <SubmitButton />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SubmitForm>
  )
}
