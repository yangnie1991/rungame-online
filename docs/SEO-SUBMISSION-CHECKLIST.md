# SEO URL提交功能 - 实施检查清单

> 快速参考：实施过程中的关键步骤和注意事项

## 📋 前期准备

### 第三方平台配置

#### IndexNow（Bing + Yandex）

- [ ] **生成 IndexNow API Key**
  ```bash
  # 使用 Node.js 生成
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - 要求：64个字符的十六进制字符串
  - 保存到：环境变量 `INDEXNOW_API_KEY`

- [ ] **创建验证文件**
  - 位置：`public/{YOUR_API_KEY}.txt`
  - 内容：API Key 本身（纯文本，UTF-8）
  - 测试访问：`https://rungame.online/{YOUR_API_KEY}.txt`

#### 百度主动推送

- [ ] **验证网站所有权**
  - 登录：https://ziyuan.baidu.com/
  - 添加网站：`rungame.online` 和 `www.rungame.online`
  - 验证方式：文件验证或HTML标签验证

- [ ] **获取推送Token**
  - 进入：网站抓取 → 链接提交 → 普通收录
  - 复制Token（主动推送栏目）
  - 保存到：环境变量 `BAIDU_PUSH_TOKEN`

- [ ] **确认配额**
  - 查看当前配额：500 或 3000 URLs/天
  - 记录站点类型：普通站点 / 优质站点

#### Google Search Console

- [ ] **验证网站所有权**
  - 登录：https://search.google.com/search-console
  - 添加资源：`https://rungame.online`
  - 验证方式：DNS、HTML文件或HTML标签

- [ ] **提交 Sitemap**
  - 进入：站点地图页面
  - 提交：`sitemap.xml`
  - 确认状态：成功

- [ ] **检查 robots.txt**
  ```
  Sitemap: https://rungame.online/sitemap.xml
  ```

---

## 🗄️ 数据库设置

### Schema 修改

- [ ] **复制 Schema 定义**
  - 源文件：`prisma/schema-seo-submission.prisma`
  - 目标文件：`prisma/schema.prisma`
  - 添加三个模型：
    - `SearchEngineConfig`
    - `UrlSubmission`
    - `SubmissionBatch`
  - 添加两个枚举：
    - `SubmissionStatus`
    - `BatchStatus`

- [ ] **运行数据库迁移**
  ```bash
  npx prisma format
  npx prisma db push
  npx prisma generate
  ```

- [ ] **创建初始配置**（Seed数据）
  ```typescript
  // 创建 IndexNow 配置
  await prisma.searchEngineConfig.create({
    data: {
      name: 'Bing (IndexNow)',
      slug: 'bing-indexnow',
      type: 'indexnow',
      apiEndpoint: 'https://api.indexnow.org/indexnow',
      apiKey: process.env.INDEXNOW_API_KEY,
      extraConfig: {
        keyLocation: `https://rungame.online/${process.env.INDEXNOW_API_KEY}.txt`,
        batchSize: 100
      },
      isEnabled: true,
      autoSubmit: false
    }
  })

  // 创建百度配置
  await prisma.searchEngineConfig.create({
    data: {
      name: '百度主动推送',
      slug: 'baidu-push',
      type: 'baidu',
      apiEndpoint: 'http://data.zz.baidu.com/urls',
      apiToken: process.env.BAIDU_PUSH_TOKEN,
      siteUrl: 'rungame.online',
      extraConfig: {
        dailyQuota: 500,
        batchSize: 20
      },
      isEnabled: true,
      autoSubmit: false
    }
  })
  ```

---

## 🔧 环境变量

### .env 配置

```env
# IndexNow API Key（64字符十六进制）
INDEXNOW_API_KEY=a1b2c3d4e5f6...

# 百度推送 Token
BAIDU_PUSH_TOKEN=xxx

# API Key 加密密钥（32字节）
ENCRYPTION_KEY=xxx

# 网站基础URL
NEXT_PUBLIC_SITE_URL=https://rungame.online
```

- [ ] 添加所有必需的环境变量
- [ ] 在生产环境配置相同变量
- [ ] 确认 `.env` 在 `.gitignore` 中

---

## 💻 代码实施

### 第一阶段：基础架构（Day 1）

#### API 客户端

- [ ] **IndexNow 客户端** (`lib/seo-submissions/indexnow.ts`)
  - `submitUrl(url: string)`
  - `submitUrls(urls: string[])`
  - 错误处理（403, 429等）
  - 响应日志

- [ ] **百度推送客户端** (`lib/seo-submissions/baidu.ts`)
  - `submitUrls(urls: string[])`
  - `getQuota()` - 查询剩余配额
  - 错误处理（401, 403等）

- [ ] **URL 生成工具** (`lib/seo-submissions/url-generator.ts`)
  - `generateGameUrls(gameId, locales)`
  - `generateCategoryUrls(categoryId, locales)`
  - `generateAllUrls(filters)`

#### 工具函数

- [ ] **API Key 加密/解密** (`lib/seo-submissions/encryption.ts`)
  ```typescript
  export function encryptApiKey(key: string): string
  export function decryptApiKey(encrypted: string): string
  export function maskApiKey(key: string): string
  ```

### 第二阶段：管理后台（Day 2）

#### 页面组件

- [ ] **搜索引擎配置页** (`app/(admin)/admin/seo-submissions/config/page.tsx`)
  - 配置列表卡片
  - 编辑表单（Dialog）
  - 测试连接按钮

- [ ] **手动提交页** (`app/(admin)/admin/seo-submissions/submit/page.tsx`)
  - Tab 1：选择实体（游戏、分类等）
  - Tab 2：直接输入URL
  - 搜索引擎多选
  - 提交按钮和结果显示

- [ ] **提交记录页** (`app/(admin)/admin/seo-submissions/page.tsx`)
  - 统计卡片（总数、成功率等）
  - 筛选器（搜索引擎、状态、时间）
  - 数据表格
  - 批量重试按钮

#### Server Actions

- [ ] **配置管理** (`app/(admin)/admin/seo-submissions/config/actions.ts`)
  - `createConfig(data)`
  - `updateConfig(id, data)`
  - `testConnection(id)` - 测试API连接

- [ ] **URL提交** (`app/(admin)/admin/seo-submissions/actions.ts`)
  - `submitUrls({ urls, engineIds })`
  - `retryFailed(submissionIds)`
  - `getStats(filters)`

#### 侧边栏菜单

- [ ] **更新导航配置** (`components/admin/Sidebar.tsx`)
  ```typescript
  {
    name: "SEO推送",
    href: "/admin/seo-submissions",
    icon: Share2,
    children: [
      { name: "提交记录", href: "/admin/seo-submissions" },
      { name: "搜索引擎配置", href: "/admin/seo-submissions/config" },
      { name: "手动提交", href: "/admin/seo-submissions/submit" },
    ]
  }
  ```

### 第三阶段：核心功能（Day 3）

#### API 路由

- [ ] **提交URL** (`app/api/seo-submissions/submit/route.ts`)
  ```typescript
  POST /api/seo-submissions/submit
  Body: { urls, urlType, entityId, searchEngineIds }
  ```

- [ ] **批量提交** (`app/api/seo-submissions/batch/route.ts`)
  ```typescript
  POST /api/seo-submissions/batch
  Body: { entityType, filters, searchEngineIds }
  ```

- [ ] **统计数据** (`app/api/seo-submissions/stats/route.ts`)
  ```typescript
  GET /api/seo-submissions/stats?period=7d
  ```

#### 队列处理

- [ ] **提交队列** (`lib/seo-submissions/queue.ts`)
  - `addToQueue(urls, engines)`
  - `processQueue()` - 处理待提交任务
  - `retryFailed()` - 重试失败任务

---

## ✅ 测试检查

### 单元测试

- [ ] **IndexNow 客户端测试**
  - 测试成功响应（200）
  - 测试错误响应（403, 429）
  - 测试URL格式验证

- [ ] **百度推送测试**
  - 测试成功响应
  - 测试配额耗尽（403）
  - 测试Token错误（401）

- [ ] **URL生成测试**
  - 单语言URL生成
  - 多语言URL生成
  - 边界情况（未发布游戏等）

### 集成测试

- [ ] **IndexNow 实际提交**
  ```bash
  # 提交测试URL
  curl -X POST https://api.indexnow.org/indexnow \
    -H "Content-Type: application/json" \
    -d '{
      "host": "rungame.online",
      "key": "YOUR_KEY",
      "keyLocation": "https://rungame.online/YOUR_KEY.txt",
      "urlList": ["https://rungame.online/test"]
    }'
  ```
  - 期望：200 或 202 响应

- [ ] **百度推送实际提交**
  ```bash
  curl -X POST "http://data.zz.baidu.com/urls?site=rungame.online&token=YOUR_TOKEN" \
    -H "Content-Type: text/plain" \
    -d "https://rungame.online/test"
  ```
  - 期望：`{"remain": xxx, "success": 1}`

- [ ] **验证文件访问**
  - 访问：`https://rungame.online/{API_KEY}.txt`
  - 确认返回API Key

### UI 测试

- [ ] **配置页面**
  - 创建新配置
  - 编辑现有配置
  - 测试连接
  - API Key 显示脱敏

- [ ] **手动提交页**
  - 选择游戏并生成URL
  - 直接输入URL
  - 提交到IndexNow（成功）
  - 提交到百度（成功）

- [ ] **记录页面**
  - 查看提交记录
  - 筛选功能正常
  - 批量重试功能

---

## 🚀 部署检查

### 生产环境准备

- [ ] **环境变量配置**
  - Vercel/服务器设置所有环境变量
  - 确认 `INDEXNOW_API_KEY` 正确
  - 确认 `BAIDU_PUSH_TOKEN` 正确

- [ ] **静态文件部署**
  - 部署 `{API_KEY}.txt` 到 `public/`
  - 确认可公开访问

- [ ] **数据库迁移**
  - 在生产数据库运行 `prisma db push`
  - 创建初始搜索引擎配置

- [ ] **功能验证**
  - 提交1个测试URL到IndexNow
  - 提交1个测试URL到百度
  - 检查数据库记录

### Google Sitemap 优化

- [ ] **优化 `<lastmod>`** (`app/sitemap.ts`)
  ```typescript
  lastModified: game.updatedAt.toISOString()
  ```

- [ ] **添加多语言支持**
  ```typescript
  alternates: {
    languages: {
      'en': `/games/play/${game.slug}`,
      'zh': `/zh/games/play/${game.slug}`,
      'x-default': `/games/play/${game.slug}`
    }
  }
  ```

- [ ] **重新提交到 Google Search Console**
  - 检查sitemap错误
  - 确认覆盖率正常

---

## 📊 监控设置

### 日志记录

- [ ] **API调用日志**
  ```typescript
  console.log('[IndexNow] Submitted', {
    urls: urlList.length,
    status: response.status,
    time: Date.now() - startTime
  })
  ```

- [ ] **错误日志**
  ```typescript
  console.error('[IndexNow] Failed', {
    error: error.message,
    urls: urlList
  })
  ```

### 数据库监控

- [ ] **成功率查询**
  ```sql
  SELECT
    search_engine_name,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*) as rate
  FROM url_submissions
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY search_engine_name;
  ```

- [ ] **配额使用（百度）**
  ```sql
  SELECT COUNT(*)
  FROM url_submissions
  WHERE search_engine_name = '百度主动推送'
    AND DATE(created_at) = CURRENT_DATE
    AND status = 'SUCCESS';
  ```

---

## 🎯 后续优化

### 短期（1-2周）

- [ ] 自动提交集成（游戏发布时）
- [ ] 批量提交功能
- [ ] 提交统计图表
- [ ] 失败自动重试

### 中期（1个月）

- [ ] 定时任务（每小时重试失败项）
- [ ] 邮件通知（批量提交完成）
- [ ] 导出功能（CSV/Excel）
- [ ] API使用报告

### 长期（3个月）

- [ ] 智能提交策略（根据页面重要性）
- [ ] 收录监控（集成Search Console API）
- [ ] A/B测试（对比不同策略效果）
- [ ] 性能优化（引入Redis、消息队列）

---

## 📚 参考清单

### 快速链接

- **IndexNow 文档**：https://www.indexnow.org/documentation
- **百度站长平台**：https://ziyuan.baidu.com/
- **Google Search Console**：https://search.google.com/search-console
- **Bing Webmaster Tools**：https://www.bing.com/webmasters/

### 关键文件

- 设计文档：[docs/SEO-URL-SUBMISSION.md](SEO-URL-SUBMISSION.md)
- 实施方案：[docs/SEO-SUBMISSION-IMPLEMENTATION.md](SEO-SUBMISSION-IMPLEMENTATION.md)
- Schema定义：[prisma/schema-seo-submission.prisma](../prisma/schema-seo-submission.prisma)

### 命令速查

```bash
# 生成API Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 数据库迁移
npx prisma db push && npx prisma generate

# 测试IndexNow
curl -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json" \
  -d '{"host":"rungame.online","key":"YOUR_KEY","urlList":["https://rungame.online/test"]}'

# 测试百度
curl -X POST "http://data.zz.baidu.com/urls?site=rungame.online&token=YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  -d "https://rungame.online/test"
```

---

**检查清单版本**：v1.0
**最后更新**：2025-01-30
