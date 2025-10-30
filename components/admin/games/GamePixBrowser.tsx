'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Download, RefreshCw, Settings, ChevronLeft, ChevronRight, Database, CloudDownload, Search, X } from 'lucide-react'
import { importSingleGamePixGame, deleteGameByGamePixId } from '@/app/(admin)/admin/games/import-actions'
import { updateGamePixSiteId, getCategoriesAndTags } from '@/app/(admin)/admin/import-games/platform-actions'
import {
  getGamePixGamesFromCache,
  getCacheStats,
  getGamePixApiTotal,
  markGameAsImported,
  unmarkGameAsImported,
} from '@/app/(admin)/admin/import-games/cache-actions'
import type { GamePixGameItem } from '@/lib/gamepix-importer'
import { removeWidthParameter } from '@/lib/gamepix-image-upload'
import { SyncProgressDialog } from './SyncProgressDialog'
import { GameImportConfirmDialog, type ImportFormData } from './GameImportConfirmDialog'
import { UnimportConfirmDialog } from './UnimportConfirmDialog'

interface GamePixBrowserProps {
  initialSiteId?: string
  defaultConfig?: {
    orderBy?: 'quality' | 'published'
    perPage?: '12' | '24' | '48' | '96'
  }
}

export function GamePixBrowser({
  initialSiteId = '',
  defaultConfig = {}
}: GamePixBrowserProps) {
  // Site ID 配置
  const [siteId, setSiteId] = useState(initialSiteId)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  // ✅ 分类和标签（按需加载）
  const [categories, setCategories] = useState<Array<{
    id: string
    name: string
    nameEn: string
    displayName: string
    displayNameEn: string
    parentId: string | null
    parentName: string
    parentNameEn: string
  }>>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingCategoriesAndTags, setIsLoadingCategoriesAndTags] = useState(false)

  // ✅ 移除 API 数据源选项，统一使用缓存数据库
  // const [dataSource, setDataSource] = useState<'api' | 'cache'>('cache')

  // 筛选选项（使用默认配置或固定默认值）
  const [orderBy, setOrderBy] = useState<'quality' | 'published'>(
    defaultConfig.orderBy || 'quality'
  )
  const [perPage, setPerPage] = useState<'12' | '24' | '48' | '96'>(
    defaultConfig.perPage || '12' // ✅ 修改默认值为12
  )

  // 高级筛选（仅缓存模式）
  const [searchQuery, setSearchQuery] = useState('')
  const [minQuality, setMinQuality] = useState(0)
  const [importStatusFilter, setImportStatusFilter] = useState<'all' | 'imported' | 'not_imported'>('all')

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 游戏列表（使用更宽松的类型以兼容缓存数据库和 API 数据）
  const [games, setGames] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(false)

  // 同步状态
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [apiTotal, setApiTotal] = useState<number | null>(null)
  const [showSyncDialog, setShowSyncDialog] = useState(false)

  // 导入配置
  const [isImporting, setIsImporting] = useState(false)

  // 单个游戏导入确认弹窗
  const [showSingleImportDialog, setShowSingleImportDialog] = useState(false)
  const [currentGameToImport, setCurrentGameToImport] = useState<GamePixGameItem | null>(null)

  // 取消导入确认弹窗
  const [showUnimportDialog, setShowUnimportDialog] = useState(false)
  const [currentGameToUnimport, setCurrentGameToUnimport] = useState<GamePixGameItem | null>(null)
  const [isUnimporting, setIsUnimporting] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // 页面加载时只加载缓存统计信息
  useEffect(() => {
    loadCacheStats()
  }, [])

  // ✅ 按需加载分类和标签（仅在用户点击导入时）
  const loadCategoriesAndTags = async () => {
    // 如果已经加载过，直接返回
    if (categories.length > 0 && tags.length > 0) {
      return true
    }

    setIsLoadingCategoriesAndTags(true)
    try {
      const result = await getCategoriesAndTags()
      if (result.success && result.data) {
        setCategories(result.data.categories)
        setTags(result.data.tags)
        return true
      } else {
        alert(result.error || '加载分类和标签失败')
        return false
      }
    } catch (error) {
      console.error('加载分类和标签失败:', error)
      alert('加载分类和标签失败，请重试')
      return false
    } finally {
      setIsLoadingCategoriesAndTags(false)
    }
  }

  // 加载缓存统计信息
  const loadCacheStats = async () => {
    const result = await getCacheStats()
    if (result.success) {
      setCacheStats(result.data)

      // 如果有 Site ID，同时获取 API 总游戏数
      if (siteId && siteId.trim()) {
        const apiResult = await getGamePixApiTotal({ siteId })
        if (apiResult.success && apiResult.data) {
          setApiTotal(apiResult.data.estimatedTotal)
        }
      }

      // ✅ 返回统计数据，供调用方判断
      return result.data
    }

    return null
  }

  // 保存 Site ID 到数据库并同步数据
  const handleSaveSiteId = async () => {
    if (!siteId.trim()) {
      alert('请输入 Site ID')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. 保存 Site ID
      const saveResult = await updateGamePixSiteId(siteId.trim())

      if (!saveResult.success) {
        setError(saveResult.error || '保存失败')
        return
      }

      setShowConfigDialog(false)

      // 2. 自动同步数据到缓存（如果缓存为空）
      if (!cacheStats || cacheStats.total === 0) {
        const confirm = window.confirm(
          '检测到缓存数据库为空。\n\n是否立即从 GamePix 同步游戏数据到缓存？\n（建议选择"确定"，这样可以快速筛选和浏览游戏）'
        )

        if (confirm) {
          setShowSyncDialog(true)
        }
      } else {
        // 缓存已有数据，直接加载
        await handleFetchGames()
      }
    } catch (error) {
      console.error('保存 Site ID 失败:', error)
      setError('保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取游戏列表（仅从缓存数据库）
  const handleFetchGames = async (page: number = currentPage) => {
    setIsLoading(true)
    setError(null)
    setShowConfigDialog(false)

    try {
      // ✅ 统一从缓存数据库获取
      const result = await getGamePixGamesFromCache({
        minQuality,
        search: searchQuery || undefined,
        isImported: importStatusFilter === 'all' ? undefined : importStatusFilter === 'imported',
        page,
        perPage: parseInt(perPage),
        orderBy: orderBy === 'published' ? 'published' : 'quality',
      })

      if (result.success && result.data) {
        setGames(result.data.games)
        setCurrentPage(result.data.page)
        setTotalPages(result.data.totalPages)
      } else {
        setError(result.error || '从缓存获取游戏失败')
      }
    } catch (error) {
      console.error('获取游戏失败:', error)
      setError('获取游戏失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 打开同步弹窗
  const handleOpenSyncDialog = () => {
    if (!siteId.trim()) {
      alert('请先配置 Site ID')
      setShowConfigDialog(true)
      return
    }
    setShowSyncDialog(true)
  }

  // 同步完成回调
  const handleSyncComplete = async () => {
    // 重新加载缓存统计和游戏列表
    await loadCacheStats()
    // ✅ 统一使用缓存，直接刷新游戏列表
    await handleFetchGames(1)
  }

  // 打开单个游戏导入确认弹窗
  const handleSingleGameImport = async (game: GamePixGameItem) => {
    // ✅ 先打开弹窗，然后在后台加载分类和标签（懒加载）
    setCurrentGameToImport(game)
    setShowSingleImportDialog(true)

    // 在后台加载分类和标签
    loadCategoriesAndTags()
  }

  // 确认单个游戏导入（已改为由子组件直接处理，父组件不再需要此回调）
  // 但为了保持向后兼容，保留空实现
  const handleConfirmSingleImport = async (_gameId: string, data: ImportFormData) => {
    console.log('⚠️ handleConfirmSingleImport 被调用（已废弃），导入逻辑已转移到 GameImportConfirmDialog 内部')
    // 导入逻辑现在完全在 GameImportConfirmDialog 的 handleSubmit 中处理
    // 包括：自动上传图片、SSE 进度反馈、数据库写入、缓存标记
  }

  // 打开单个游戏取消导入确认弹窗
  const handleSingleGameUnimport = (game: GamePixGameItem) => {
    setCurrentGameToUnimport(game)
    setShowUnimportDialog(true)
  }

  // 确认取消导入
  const handleConfirmUnimport = async (deleteGame: boolean) => {
    if (!currentGameToUnimport) return

    const gameId = currentGameToUnimport.id

    setIsUnimporting(true)

    try {
      // 并行执行删除和取消标记（如果需要删除）
      const promises = [
        unmarkGameAsImported(gameId)
      ]

      if (deleteGame) {
        promises.push(deleteGameByGamePixId(gameId))
      }

      const [unmarkResult, deleteResult] = await Promise.all(promises)

      if (!unmarkResult.success) {
        alert(unmarkResult.error || '取消导入失败')
        return
      }

      if (deleteGame && deleteResult && !deleteResult.success) {
        alert(deleteResult.error || '删除游戏失败，但已取消导入标记')
        return
      }

      // 🎯 成功后再更新 UI 和关闭对话框
      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId
            ? { ...game, isImported: false }
            : game
        )
      )

      // 更新缓存统计
      if (cacheStats) {
        setCacheStats({
          ...cacheStats,
          imported: Math.max(0, cacheStats.imported - 1),
          notImported: cacheStats.notImported + 1,
        })
      }

      // 关闭对话框
      setShowUnimportDialog(false)
      setCurrentGameToUnimport(null)

    } catch (error) {
      console.error('取消导入失败:', error)
      alert('取消导入失败，请重试')
    } finally {
      setIsUnimporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 配置 Site ID 弹窗 */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>GamePix 配置</DialogTitle>
            <DialogDescription>
              配置你的 GamePix Site ID 以访问游戏库
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="siteId">GamePix Site ID *</Label>
              <Input
                id="siteId"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="输入你的 Site ID"
              />
              <p className="text-xs text-muted-foreground">
                在 <a href="https://partners.gamepix.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GamePix Partners</a> 获取你的 Site ID
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfigDialog(false)}
              disabled={isLoading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveSiteId}
              disabled={isLoading || !siteId.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>保存并获取游戏</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 缓存统计和同步面板 */}
      {siteId && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">缓存数据库</p>
                    {cacheStats ? (
                      <p className="text-xs text-muted-foreground">
                        缓存: {cacheStats.total} | 已导入: {cacheStats.imported} | 未导入: {cacheStats.notImported}
                        {apiTotal !== null && (
                          <span className="ml-2 text-primary font-medium">
                            | API总数: {apiTotal}
                            {apiTotal > cacheStats.total && (
                              <span className="text-orange-600"> (+{apiTotal - cacheStats.total} 新游戏)</span>
                            )}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">加载中...</p>
                    )}
                  </div>
                </div>

                {cacheStats?.lastSyncAt && (
                  <div className="text-xs text-muted-foreground">
                    最后同步: {new Date(cacheStats.lastSyncAt).toLocaleString('zh-CN')}
                  </div>
                )}
              </div>

              <Button
                onClick={handleOpenSyncDialog}
                variant="default"
              >
                <CloudDownload className="mr-2 h-4 w-4" />
                从 GamePix 同步数据
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选和搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 第一行：Site ID 和数据源切换 */}
            <div className="flex items-center gap-4">
              {/* Site ID 状态 */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Site ID:</Label>
                {siteId ? (
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{siteId}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfigDialog(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfigDialog(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    配置 Site ID
                  </Button>
                )}
              </div>

            </div>

            {/* 筛选选项 */}
            {siteId && (
              <div className="flex items-center gap-4">
                {/* 搜索框 */}
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索游戏标题..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                {/* 质量筛选 */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">质量:</Label>
                  <Select value={minQuality.toString()} onValueChange={(v) => setMinQuality(parseFloat(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">全部</SelectItem>
                      <SelectItem value="0.7">≥ 7分</SelectItem>
                      <SelectItem value="0.8">≥ 8分</SelectItem>
                      <SelectItem value="0.9">≥ 9分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 导入状态筛选 */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">状态:</Label>
                  <Select value={importStatusFilter} onValueChange={(v) => setImportStatusFilter(v as any)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="imported">已导入</SelectItem>
                      <SelectItem value="not_imported">未导入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">排序:</Label>
                  <Select value={orderBy} onValueChange={(v) => setOrderBy(v as 'quality' | 'published')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">按质量</SelectItem>
                      <SelectItem value="published">按发布日期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">数量:</Label>
                  <Select value={perPage} onValueChange={(v) => setPerPage(v as '12' | '24' | '48' | '96')}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="96">96</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => handleFetchGames(1)}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      加载中
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      查询
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* 空状态提示 */}
      {!isLoading && games.length === 0 && siteId && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎮</div>
            {cacheStats && cacheStats.total === 0 ? (
              <>
                <h3 className="text-lg font-medium">缓存数据库为空</h3>
                <p className="text-muted-foreground">
                  请先从 GamePix 同步游戏数据到缓存
                </p>
                <Button onClick={handleOpenSyncDialog}>
                  <CloudDownload className="mr-2 h-4 w-4" />
                  立即同步数据
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium">暂无游戏数据</h3>
                <p className="text-muted-foreground">
                  点击上方的"查询"按钮获取游戏列表
                </p>
                <Button onClick={() => handleFetchGames(1)}>
                  <Search className="mr-2 h-4 w-4" />
                  立即查询
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* 游戏列表 */}
      {games && games.length > 0 && (
        <>
          {/* 游戏列表 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50">
              <div className="grid grid-cols-[120px_1fr_120px_100px_80px_120px] gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
                <div>缩略图</div>
                <div>游戏标题</div>
                <div>分类</div>
                <div>质量评分</div>
                <div className="text-center">状态</div>
                <div className="text-center">操作</div>
              </div>
            </div>
            <div className="divide-y">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="grid grid-cols-[120px_1fr_120px_100px_80px_120px] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                >

                  {/* 缩略图 */}
                  <div className="relative aspect-square w-full rounded overflow-hidden">
                    <Image
                      src={removeWidthParameter(game.image || game.banner_image)}
                      alt={game.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* 游戏标题 */}
                  <div className="flex items-center">
                    <div className="min-w-0">
                      <h3 className="font-medium truncate" title={game.title}>
                        {game.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {game.namespace || game.id}
                      </p>
                    </div>
                  </div>

                  {/* 分类 */}
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      {game.category}
                    </Badge>
                  </div>

                  {/* 质量评分 */}
                  <div className="flex items-center">
                    <span className="text-sm">
                      ⭐ {(game.quality_score * 10).toFixed(1)}
                    </span>
                  </div>

                  {/* 状态 */}
                  <div className="flex items-center justify-center">
                    {game.isImported ? (
                      <Badge variant="secondary" className="text-xs">已导入</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">未导入</Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-center gap-2">
                    {!game.isImported ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSingleGameImport(game)
                        }}
                        disabled={isImporting || isUnimporting}
                        className="h-8"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        导入
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSingleGameUnimport(game)
                        }}
                        disabled={isImporting || isUnimporting}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        取消导入
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFetchGames(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一页
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // 显示当前页附近的页码
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFetchGames(pageNum)}
                      disabled={isLoading}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFetchGames(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                下一页
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <span className="text-sm text-muted-foreground ml-2">
                第 {currentPage} / {totalPages} 页
              </span>
            </div>
          )}
        </>
      )}

      {/* 同步进度弹窗 */}
      <SyncProgressDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        config={{
          siteId,
          orderBy,
        }}
        onComplete={handleSyncComplete}
      />

      {/* 单个游戏导入确认弹窗 */}
      <GameImportConfirmDialog
        open={showSingleImportDialog}
        onOpenChange={async (open) => {
          setShowSingleImportDialog(open)
          // 🎯 弹窗关闭时清理当前游戏数据并刷新列表
          if (!open) {
            setTimeout(() => setCurrentGameToImport(null), 300)

            // 🔄 刷新游戏列表（获取最新的导入状态）
            await handleFetchGames()
          }
        }}
        game={currentGameToImport}
        categories={categories}
        tags={tags}
        onConfirm={handleConfirmSingleImport}
        onLoadCategories={loadCategoriesAndTags}
        isImporting={isImporting}
        isLoadingCategories={isLoadingCategoriesAndTags}
      />

      {/* 取消导入确认弹窗 */}
      <UnimportConfirmDialog
        open={showUnimportDialog}
        onOpenChange={setShowUnimportDialog}
        gameTitle={currentGameToUnimport?.title}
        gameCount={1}
        onConfirm={handleConfirmUnimport}
        isLoading={isUnimporting}
      />
    </div>
  )
}
