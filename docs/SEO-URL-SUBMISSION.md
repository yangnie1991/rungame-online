# 搜索引擎主动推送功能设计方案

## 一、功能需求分析

### 1.1 核心功能

搜索引擎主动推送功能是一个SEO优化工具，用于主动向各大搜索引擎提交网站URL，加快页面被收录的速度。

**主要功能模块**：

1. **多搜索引擎支持**
   - Google (IndexNow 协议)
   - Bing (IndexNow 协议)
   - 百度 (主动推送API)
   - Yandex (IndexNow 协议)

2. **URL提交方式**
   - 单个URL手动提交
   - 批量URL提交
   - 自动触发提交（内容发布/更新时）
   - 定时批量提交

3. **提交管理**
   - 查看提交历史
   - 提交状态跟踪（成功/失败/待处理）
   - 失败重试机制
   - 提交统计报表

4. **配置管理**
   - 搜索引擎API配置（API Key、验证码等）
   - 自动提交开关配置
   - 提交频率限制设置

### 1.2 用户场景

1. **新游戏发布**：游戏发布后自动提交URL到所有启用的搜索引擎
2. **内容更新**：游戏信息更新后重新提交URL
3. **批量提交**：一次性提交所有已发布游戏的URL
4. **手动提交**：管理员手动提交特定URL
5. **失败重试**：自动重试提交失败的URL

### 1.3 业务价值

- **加快收录速度**：主动推送比被动等待爬虫更快
- **提升SEO效果**：及时告知搜索引擎内容更新
- **监控收录情况**：通过提交记录了解收录进度
- **优化运营效率**：自动化减少人工操作

---

## 二、技术方案选择

### 2.1 支持的搜索引擎协议

#### 1. IndexNow 协议（推荐 - Bing/Yandex）

**支持的搜索引擎**：
- ✅ Bing（微软）
- ✅ Yandex（俄罗斯）
- ✅ Seznam.cz（捷克）
- ✅ Naver（韩国）
- ❌ Google（不支持）

**优势**：
- 一次提交，多个搜索引擎同步索引
- 简单易用，只需一个API Key
- 完全免费
- 即时通知搜索引擎

**API端点**：
```
https://api.indexnow.org/indexnow
或
https://www.bing.com/indexnow
```

**请求示例**：
```json
POST https://api.indexnow.org/indexnow
Content-Type: application/json

{
  "host": "rungame.online",
  "key": "YOUR_API_KEY",
  "keyLocation": "https://rungame.online/YOUR_API_KEY.txt",
  "urlList": [
    "https://rungame.online/games/play/puzzle-game",
    "https://rungame.online/zh/games/play/puzzle-game"
  ]
}
```

**响应**：
- `200 OK`：成功接收
- `202 Accepted`：URL已在队列中
- `400 Bad Request`：请求格式错误
- `403 Forbidden`：Key验证失败
- `422 Unprocessable Entity`：URL格式错误
- `429 Too Many Requests`：请求过于频繁

**API Key 验证文件**：
在网站根目录放置验证文件，例如：
```
https://rungame.online/{YOUR_API_KEY}.txt
```
文件内容就是API Key本身。

**批量提交限制**：
- 单次请求最多 10,000 个URL
- 建议每次不超过 100-500 个URL

**官方文档**：
- https://www.indexnow.org/documentation
- https://www.bing.com/indexnow

---

#### 2. 百度链接提交API

**支持的搜索引擎**：百度（中国最大搜索引擎）

**API类型**：
1. **主动推送（推荐）**：最快，实时推送
2. **自动推送**：在页面中嵌入JavaScript代码
3. **Sitemap提交**：最简单，但较慢

**主动推送API端点**：
```
http://data.zz.baidu.com/urls?site=YOUR_SITE&token=YOUR_TOKEN
```

**请求示例**：
```http
POST http://data.zz.baidu.com/urls?site=rungame.online&token=YOUR_TOKEN
Content-Type: text/plain

https://rungame.online/games/play/puzzle-game
https://rungame.online/zh/games/play/puzzle-game
https://rungame.online/games/play/action-game
```

**响应示例**：
```json
{
  "remain": 497,        // 当天剩余配额
  "success": 3,         // 成功推送的URL数量
  "not_same_site": [],  // 不是本站的URL
  "not_valid": []       // 格式错误的URL
}
```

**配额限制**：
- **普通站点**：每天 500 条
- **优质站点**：每天 3,000 条
- **配额重置**：每天凌晨重置

**错误处理**：
- 配额用完：等待次日
- Token错误：检查百度站长平台配置
- Site不匹配：确保URL和site参数一致

**官方文档**：
- 站长平台：https://ziyuan.baidu.com/
- 链接提交：https://ziyuan.baidu.com/linksubmit/index
- API文档：https://ziyuan.baidu.com/college/courseinfo?id=267

---

#### 3. Google Sitemap 提交（推荐 - Google）

**重要说明**：
- ❌ Google **不支持** IndexNow 协议
- ❌ Google Indexing API 仅支持 **Job Posting** 和 **Livestream** 内容
- ✅ 对于普通网站（如游戏网站），Google 推荐使用 **Sitemap**

**实现方式**：

##### 方式一：自动生成 Sitemap（已实现）

项目已经实现了动态 Sitemap：
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 自动生成所有游戏、分类、标签的URL
}
```

访问地址：
```
https://rungame.online/sitemap.xml
```

##### 方式二：提交到 Google Search Console

1. **首次提交**（手动）：
   - 登录 Google Search Console
   - 选择网站资源
   - 进入"站点地图"页面
   - 输入 `sitemap.xml` 并提交

2. **自动更新**：
   - Google 会定期重新爬取 sitemap
   - 内容更新后，sitemap自动更新
   - 可以使用 `<lastmod>` 标签提示更新时间

##### 方式三：使用 Google Search Console API（可选）

虽然不能直接提交URL，但可以：
- 使用 URL Inspection API 检查收录状态
- 请求重新索引（每天配额有限）
- 获取索引覆盖率报告

**API配置步骤**：
```typescript
// 1. 创建 Google Cloud 项目
// 2. 启用 Search Console API
// 3. 创建 Service Account
// 4. 下载密钥文件
// 5. 在 Search Console 中添加 Service Account 为用户
```

**示例代码**：
```typescript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

const searchconsole = google.searchconsole({
  version: 'v1',
  auth,
});

// 查询URL检查状态
const response = await searchconsole.urlInspection.index.inspect({
  requestBody: {
    inspectionUrl: 'https://rungame.online/games/play/puzzle-game',
    siteUrl: 'https://rungame.online',
  },
});
```

**最佳实践**：
1. ✅ 保持 Sitemap 更新（自动生成）
2. ✅ 提交 Sitemap 到 Google Search Console
3. ✅ 使用结构化数据（JSON-LD）
4. ✅ 优化内部链接结构
5. ✅ 确保 robots.txt 允许爬取
6. ⚠️ 不要过度依赖手动提交

**Google 官方文档**：
- Search Console：https://search.google.com/search-console
- Sitemap 协议：https://www.sitemaps.org/
- Search Console API：https://developers.google.com/webmaster-tools

---

#### 4. Yandex Webmaster API（可选）

**支持的搜索引擎**：Yandex（俄罗斯最大搜索引擎）

虽然 Yandex 支持 IndexNow，但也提供了原生 API：

**Webmaster API**：
```
https://api.webmaster.yandex.net/v4/
```

**功能**：
- 添加/删除站点
- 提交 Sitemap
- 查询索引状态
- 管理主机设置

**认证方式**：OAuth 2.0

**官方文档**：
- https://yandex.com/dev/webmaster/

---

#### 5. 其他搜索引擎（扩展）

##### 360搜索（中国）
- 提交方式：Sitemap
- 站长平台：http://zhanzhang.so.com/

##### 搜狗搜索（中国）
- 提交方式：Sitemap
- 站长平台：http://zhanzhang.sogou.com/

##### DuckDuckGo
- 提交方式：无需主动提交
- 自动从 Bing 获取索引

---

### 2.2 技术架构选型

#### 后端架构
- **API路由**：Next.js API Routes (`app/api/`)
- **Server Actions**：用于管理后台操作
- **数据库**：PostgreSQL + Prisma ORM
- **队列系统**：使用数据库表模拟队列（简单场景）或引入 BullMQ（复杂场景）

#### 前端架构
- **UI框架**：React + shadcn/ui
- **表单处理**：react-hook-form + zod
- **状态管理**：React State + Server Actions
- **实时更新**：使用 SWR 或 React Query

---

## 三、数据库设计

### 3.1 搜索引擎配置表 (SearchEngineConfig)

```prisma
model SearchEngineConfig {
  id       String  @id @default(cuid())

  // 基本信息
  name     String  // 搜索引擎名称：Google, Bing, Baidu, Yandex
  slug     String  @unique // 标识符：google, bing, baidu, yandex
  type     String  // 类型：indexnow, baidu, google
  icon     String? // 图标URL或emoji

  // API配置
  apiEndpoint String  @map("api_endpoint") // API端点URL
  apiKey      String? @map("api_key")      // API密钥（加密存储）
  apiToken    String? @map("api_token")    // API令牌（百度用）
  siteUrl     String? @map("site_url")     // 网站URL（百度用）

  // 额外配置（JSON）
  extraConfig Json? @default("{}") @map("extra_config")
  // 示例：
  // {
  //   "keyLocation": "https://rungame.online/api-key.txt", // IndexNow
  //   "dailyQuota": 500,  // 百度每日配额
  //   "batchSize": 100    // 批量提交大小
  // }

  // 状态配置
  isEnabled    Boolean @default(true) @map("is_enabled")     // 是否启用
  autoSubmit   Boolean @default(false) @map("auto_submit")   // 是否自动提交
  sortOrder    Int     @default(0) @map("sort_order")

  // 统计数据
  totalSubmitted Int @default(0) @map("total_submitted") // 总提交数
  totalSuccess   Int @default(0) @map("total_success")   // 总成功数
  totalFailed    Int @default(0) @map("total_failed")    // 总失败数
  lastSubmitAt   DateTime? @map("last_submit_at")        // 最后提交时间

  // 时间戳
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 关联关系
  submissions UrlSubmission[]

  @@index([slug])
  @@index([isEnabled])
  @@index([type])
  @@map("search_engine_configs")
}
```

### 3.2 URL提交记录表 (UrlSubmission)

```prisma
// URL提交状态枚举
enum SubmissionStatus {
  PENDING    // 待提交
  SUBMITTED  // 已提交
  SUCCESS    // 成功
  FAILED     // 失败
  RETRYING   // 重试中
}

model UrlSubmission {
  id       String @id @default(cuid())

  // 提交信息
  url        String // 提交的URL
  urlType    String @map("url_type") // URL类型：game, category, tag, pagetype, other
  entityId   String? @map("entity_id") // 关联实体ID（游戏ID、分类ID等）
  locale     String? // 语言代码：en, zh

  // 搜索引擎信息
  searchEngineConfigId String @map("search_engine_config_id")
  searchEngineName     String @map("search_engine_name") // 冗余字段，便于查询

  // 提交状态
  status        SubmissionStatus @default(PENDING)
  statusMessage String?          @map("status_message") // 状态描述/错误信息

  // HTTP响应信息
  httpStatus    Int?    @map("http_status")     // HTTP状态码
  responseBody  String? @map("response_body")   // 响应内容
  responseTime  Int?    @map("response_time")   // 响应时间（ms）

  // 重试信息
  retryCount    Int      @default(0) @map("retry_count")    // 重试次数
  maxRetries    Int      @default(3) @map("max_retries")    // 最大重试次数
  nextRetryAt   DateTime? @map("next_retry_at")             // 下次重试时间

  // 提交方式
  submitMethod  String   @default("manual") @map("submit_method") // manual, auto, batch
  submittedBy   String?  @map("submitted_by") // 提交人（管理员ID或 "system"）

  // 时间戳
  createdAt   DateTime  @default(now()) @map("created_at")  // 创建时间
  submittedAt DateTime? @map("submitted_at")                // 实际提交时间
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // 关联关系
  searchEngineConfig SearchEngineConfig @relation(fields: [searchEngineConfigId], references: [id], onDelete: Cascade)

  @@index([url])
  @@index([status])
  @@index([urlType])
  @@index([entityId])
  @@index([searchEngineConfigId])
  @@index([createdAt])
  @@index([submittedAt])
  @@index([nextRetryAt])
  @@unique([url, searchEngineConfigId, locale]) // 防止重复提交
  @@map("url_submissions")
}
```

### 3.3 批量提交任务表 (SubmissionBatch)（可选）

```prisma
enum BatchStatus {
  PENDING    // 待处理
  PROCESSING // 处理中
  COMPLETED  // 已完成
  FAILED     // 失败
  CANCELLED  // 已取消
}

model SubmissionBatch {
  id String @id @default(cuid())

  // 批次信息
  name        String       // 批次名称
  description String?      // 批次描述
  status      BatchStatus  @default(PENDING)

  // 统计信息
  totalUrls     Int @default(0) @map("total_urls")     // 总URL数
  processedUrls Int @default(0) @map("processed_urls") // 已处理数
  successUrls   Int @default(0) @map("success_urls")   // 成功数
  failedUrls    Int @default(0) @map("failed_urls")    // 失败数

  // 配置信息
  searchEngineConfigIds String[] @default([]) @map("search_engine_config_ids") // 目标搜索引擎ID列表
  urlFilters            Json?    @default("{}") @map("url_filters") // URL筛选条件
  // 示例：
  // {
  //   "urlTypes": ["game", "category"],
  //   "locales": ["en", "zh"],
  //   "publishedOnly": true
  // }

  // 执行信息
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  createdBy   String    @map("created_by") // 创建人（管理员ID）

  // 时间戳
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([status])
  @@index([createdAt])
  @@map("submission_batches")
}
```

---

## 四、系统架构设计

### 4.1 目录结构

```
app/
├── (admin)/admin/
│   └── seo-submissions/           # SEO提交管理
│       ├── page.tsx               # 提交记录列表
│       ├── config/
│       │   └── page.tsx           # 搜索引擎配置
│       ├── submit/
│       │   └── page.tsx           # 手动提交URL
│       └── batch/
│           └── page.tsx           # 批量提交
│
├── api/
│   └── seo-submissions/
│       ├── submit/route.ts        # 提交URL API
│       ├── batch/route.ts         # 批量提交API
│       ├── retry/route.ts         # 重试失败的提交
│       └── stats/route.ts         # 统计数据API
│
└── cron/                          # 定时任务（可选）
    └── retry-failed-submissions/
        └── route.ts               # 自动重试失败的提交

components/
└── admin/
    └── seo-submissions/
        ├── SubmissionList.tsx     # 提交记录列表
        ├── SubmissionStats.tsx    # 统计图表
        ├── EngineConfigForm.tsx   # 搜索引擎配置表单
        └── UrlSubmitForm.tsx      # URL提交表单

lib/
└── seo-submissions/
    ├── indexnow.ts                # IndexNow API客户端
    ├── baidu.ts                   # 百度推送API客户端
    ├── url-generator.ts           # URL生成工具
    └── submission-queue.ts        # 提交队列管理
```

### 4.2 核心功能模块

#### 1. URL生成模块 (`lib/seo-submissions/url-generator.ts`)

**功能**：根据实体类型和ID生成完整的URL列表

```typescript
interface UrlGenerationOptions {
  entityType: 'game' | 'category' | 'tag' | 'pagetype' | 'all'
  entityId?: string
  locales?: string[]  // 生成多语言URL
  includeAlternates?: boolean  // 包含所有语言版本
}

async function generateUrls(options: UrlGenerationOptions): Promise<string[]>
```

**示例**：
```typescript
// 生成单个游戏的所有语言URL
const urls = await generateUrls({
  entityType: 'game',
  entityId: 'cuid123',
  includeAlternates: true
})
// 返回：
// [
//   'https://rungame.online/games/play/puzzle-game',
//   'https://rungame.online/zh/games/play/puzzle-game'
// ]
```

---

#### 2. IndexNow客户端 (`lib/seo-submissions/indexnow.ts`)

**功能**：封装IndexNow协议的API调用

```typescript
interface IndexNowConfig {
  apiKey: string
  host: string
  keyLocation: string
}

class IndexNowClient {
  constructor(config: IndexNowConfig)

  // 提交单个URL
  async submitUrl(url: string): Promise<SubmissionResult>

  // 批量提交URL（最多10000个）
  async submitUrls(urls: string[]): Promise<SubmissionResult>
}

interface SubmissionResult {
  success: boolean
  statusCode: number
  message: string
  submittedUrls: string[]
  failedUrls?: string[]
}
```

---

#### 3. 百度推送客户端 (`lib/seo-submissions/baidu.ts`)

**功能**：封装百度链接提交API

```typescript
interface BaiduConfig {
  site: string
  token: string
}

class BaiduClient {
  constructor(config: BaiduConfig)

  // 主动推送
  async submitUrls(urls: string[]): Promise<SubmissionResult>

  // 查询剩余配额
  async getQuota(): Promise<{ remain: number, success: number }>
}
```

---

#### 4. 提交队列管理 (`lib/seo-submissions/submission-queue.ts`)

**功能**：管理URL提交队列，处理批量提交和重试逻辑

```typescript
class SubmissionQueue {
  // 添加URL到提交队列
  async addToQueue(params: {
    urls: string[]
    urlType: string
    entityId?: string
    locale?: string
    searchEngineIds: string[]
    submitMethod: 'manual' | 'auto' | 'batch'
    submittedBy?: string
  }): Promise<void>

  // 处理队列中的待处理任务
  async processQueue(): Promise<void>

  // 重试失败的提交
  async retryFailed(maxRetries?: number): Promise<void>
}
```

---

### 4.3 API设计

#### 1. 提交单个/批量URL

```typescript
// POST /api/seo-submissions/submit
{
  "urls": ["https://rungame.online/games/play/puzzle-game"],
  "urlType": "game",
  "entityId": "cuid123",
  "locale": "en",
  "searchEngineIds": ["bing-indexnow", "baidu"],  // 提交到哪些搜索引擎
  "submitMethod": "manual"
}

// Response
{
  "success": true,
  "message": "已成功添加 2 条提交任务",
  "submissions": [
    {
      "id": "sub_123",
      "url": "https://rungame.online/games/play/puzzle-game",
      "searchEngine": "bing-indexnow",
      "status": "PENDING"
    },
    {
      "id": "sub_124",
      "url": "https://rungame.online/games/play/puzzle-game",
      "searchEngine": "baidu",
      "status": "PENDING"
    }
  ]
}
```

#### 2. 批量生成并提交

```typescript
// POST /api/seo-submissions/batch
{
  "entityType": "game",  // 或 "all"
  "filters": {
    "status": "PUBLISHED",
    "locales": ["en", "zh"]
  },
  "searchEngineIds": ["bing-indexnow", "baidu"]
}

// Response
{
  "success": true,
  "batchId": "batch_456",
  "totalUrls": 500,
  "message": "批量提交任务已创建，正在处理中"
}
```

#### 3. 重试失败的提交

```typescript
// POST /api/seo-submissions/retry
{
  "submissionIds": ["sub_123", "sub_124"]  // 可选，不传则重试所有符合条件的
}

// Response
{
  "success": true,
  "retriedCount": 15,
  "message": "已重新提交 15 条失败记录"
}
```

#### 4. 获取统计数据

```typescript
// GET /api/seo-submissions/stats?period=7d
{
  "totalSubmissions": 1500,
  "successRate": 95.2,
  "bySearchEngine": [
    {
      "name": "Bing (IndexNow)",
      "total": 800,
      "success": 780,
      "failed": 20,
      "successRate": 97.5
    },
    {
      "name": "百度",
      "total": 700,
      "success": 650,
      "failed": 50,
      "successRate": 92.9
    }
  ],
  "recentSubmissions": [...],  // 最近的提交记录
  "dailyStats": [...]  // 每日统计（用于图表）
}
```

---

## 五、功能实现流程

### 5.1 自动提交流程（游戏发布时）

```
1. 用户在管理后台发布游戏
   ↓
2. Game update/create Server Action
   ↓
3. 检查是否启用了自动提交
   ↓
4. 生成游戏的所有语言版本URL
   ↓
5. 获取所有启用了自动提交的搜索引擎配置
   ↓
6. 为每个搜索引擎创建 UrlSubmission 记录（状态：PENDING）
   ↓
7. 异步处理队列（或立即处理）
   ↓
8. 调用相应的搜索引擎API
   ↓
9. 更新提交记录状态（SUCCESS/FAILED）
   ↓
10. 失败的任务等待重试
```

### 5.2 手动提交流程

```
1. 管理员访问 /admin/seo-submissions/submit
   ↓
2. 选择URL类型（游戏、分类、标签等）或直接输入URL
   ↓
3. 选择要提交的搜索引擎
   ↓
4. 点击提交按钮
   ↓
5. Server Action 创建提交记录
   ↓
6. 立即调用API提交
   ↓
7. 显示提交结果
```

### 5.3 批量提交流程

```
1. 管理员访问 /admin/seo-submissions/batch
   ↓
2. 选择批量提交范围（所有游戏、已发布游戏等）
   ↓
3. 选择语言和搜索引擎
   ↓
4. 点击开始批量提交
   ↓
5. 创建 SubmissionBatch 记录
   ↓
6. 生成所有符合条件的URL列表
   ↓
7. 为每个URL和搜索引擎创建 UrlSubmission
   ↓
8. 启动后台任务处理队列（分批处理，避免API限流）
   ↓
9. 实时更新批次进度
   ↓
10. 完成后发送通知
```

### 5.4 失败重试流程

```
1. 定时任务每小时运行一次（或手动触发）
   ↓
2. 查询状态为FAILED且retryCount < maxRetries的记录
   ↓
3. 检查nextRetryAt是否已到
   ↓
4. 重新调用API提交
   ↓
5. 成功：更新状态为SUCCESS
   失败：retryCount++，计算下次重试时间（指数退避）
   ↓
6. retryCount >= maxRetries：标记为永久失败
```

---

## 六、管理后台UI设计

### 6.1 导航菜单

在侧边栏添加新菜单项：

```tsx
{
  name: "SEO推送",
  href: "/admin/seo-submissions",
  icon: Share2,  // lucide-react 图标
  children: [
    { name: "提交记录", href: "/admin/seo-submissions" },
    { name: "搜索引擎配置", href: "/admin/seo-submissions/config" },
    { name: "手动提交", href: "/admin/seo-submissions/submit" },
    { name: "批量提交", href: "/admin/seo-submissions/batch" },
  ]
}
```

### 6.2 页面布局

#### 1. 提交记录列表页 (`/admin/seo-submissions`)

**布局**：
- **顶部卡片**：统计数据展示
  - 总提交数、成功率、失败数、今日提交数
  - 按搜索引擎分组的成功率图表（饼图或柱状图）

- **筛选器**：
  - 搜索引擎选择
  - 状态筛选（全部、成功、失败、待处理）
  - URL类型筛选
  - 时间范围选择

- **数据表格**：
  | URL | 搜索引擎 | 状态 | 提交方式 | 提交时间 | 操作 |
  |-----|---------|------|---------|---------|------|
  | ... | Bing | 成功 | 自动 | 2025-01-30 | 查看/重试 |

- **操作按钮**：
  - 批量重试失败项
  - 导出记录（CSV/Excel）

#### 2. 搜索引擎配置页 (`/admin/seo-submissions/config`)

**布局**：
- **配置卡片列表**：每个搜索引擎一个卡片
  - 搜索引擎名称和图标
  - 启用/禁用开关
  - 自动提交开关
  - API配置状态（已配置/未配置）
  - 统计数据（总提交、成功率）
  - 编辑/测试按钮

- **添加新配置按钮**

**配置表单字段**：
```
- 搜索引擎类型（下拉选择）
- API端点（自动填充，可编辑）
- API Key / Token
- 网站URL（百度用）
- 每日配额限制
- 批量提交大小
- 是否启用
- 是否自动提交
```

#### 3. 手动提交页 (`/admin/seo-submissions/submit`)

**布局**：
- **选择提交方式**：Tab切换
  - **Tab 1: 选择实体**
    - 下拉选择：游戏、分类、标签、PageType
    - 搜索框：搜索实体
    - 语言选择：生成哪些语言的URL
    - 预览：显示将要提交的URL列表

  - **Tab 2: 直接输入URL**
    - Textarea：每行一个URL
    - URL验证提示

- **选择搜索引擎**：多选框
  - Bing (IndexNow)
  - 百度
  - Yandex
  - 全选/取消全选

- **提交按钮**：提交到选定的搜索引擎

- **结果显示**：提交后显示结果表格

#### 4. 批量提交页 (`/admin/seo-submissions/batch`)

**布局**：
- **选择范围**：
  - URL类型：游戏、分类、标签、全部
  - 游戏状态：仅已发布、全部
  - 语言：选择要生成的语言版本
  - 时间范围：最近发布的、最近更新的

- **预览**：
  - 预计生成URL数量
  - 预计耗时估算

- **选择搜索引擎**：同手动提交

- **开始批量提交按钮**

- **进度条**：
  - 总进度百分比
  - 当前处理的URL
  - 成功/失败计数
  - 预计剩余时间

---

## 七、安全性考虑

### 7.1 API密钥保护

- **加密存储**：API Key和Token使用加密算法存储到数据库
- **环境变量**：敏感配置通过环境变量管理
- **权限控制**：只有超级管理员可以查看和编辑API密钥

### 7.2 请求频率限制

- **搜索引擎API限流**：遵守各搜索引擎的API调用频率限制
  - IndexNow：无明确限制，但建议不超过1万URL/次
  - 百度：普通站点500条/天，优质站点3000条/天

- **内部限流**：防止过度提交
  - 同一URL在24小时内对同一搜索引擎只能提交一次
  - 批量提交限制每次最多10000个URL

### 7.3 错误处理

- **API错误**：记录详细的错误信息，便于调试
- **重试机制**：使用指数退避算法，避免频繁重试导致封禁
- **日志记录**：记录所有API调用和响应，便于审计

---

## 八、实施计划

### 阶段一：数据库和基础设施（1-2天）

1. 添加Prisma schema定义
2. 生成并运行数据库迁移
3. 创建种子数据（预配置搜索引擎）
4. 创建API客户端类（IndexNow、百度）

### 阶段二：核心功能实现（2-3天）

1. 实现URL生成工具
2. 实现提交队列管理
3. 创建Server Actions
4. 创建API路由

### 阶段三：管理后台UI（2-3天）

1. 创建页面组件
2. 实现表单和表格
3. 添加图表展示
4. 实现实时进度更新

### 阶段四：集成和测试（1-2天）

1. 集成自动提交到游戏发布流程
2. 测试各个搜索引擎的API
3. 测试批量提交和重试机制
4. 性能优化

### 阶段五：文档和部署（1天）

1. 编写使用文档
2. 部署到生产环境
3. 配置定时任务

**总计：7-11天**

---

## 九、参考资料

### 官方文档

1. **IndexNow**
   - 官网：https://www.indexnow.org/
   - 文档：https://www.indexnow.org/documentation
   - API参考：https://www.indexnow.org/documentation

2. **百度链接提交**
   - 站长平台：https://ziyuan.baidu.com/
   - 链接提交：https://ziyuan.baidu.com/linksubmit/index
   - API文档：https://ziyuan.baidu.com/college/courseinfo?id=267

3. **Bing Webmaster Tools**
   - 官网：https://www.bing.com/webmasters/
   - API文档：https://www.bing.com/webmasters/url-submission-api

### 技术栈文档

- Next.js API Routes：https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Prisma：https://www.prisma.io/docs
- react-hook-form：https://react-hook-form.com/
- shadcn/ui：https://ui.shadcn.com/

---

## 十、后续优化方向

### 短期优化（1-3个月）

1. **集成Google Search Console API**（如果适用）
2. **添加更多搜索引擎**：360搜索、搜狗等
3. **提交报告**：生成PDF/Excel报告
4. **邮件通知**：批量提交完成时发送邮件
5. **Webhook集成**：提交完成后调用外部webhook

### 长期优化（3-6个月）

1. **智能提交策略**：
   - 根据页面重要性优先提交
   - 根据更新频率自动重新提交
   - 分析收录情况，优化提交策略

2. **收录监控**：
   - 集成Google Search Console API监控收录状态
   - 集成百度站长API查询收录情况
   - 可视化收录趋势

3. **A/B测试**：
   - 测试不同提交策略的效果
   - 对比不同搜索引擎的收录速度

4. **性能优化**：
   - 引入Redis缓存
   - 使用消息队列（BullMQ）处理大批量提交
   - 分布式部署

---

## 总结

搜索引擎主动推送功能是一个强大的SEO工具，可以显著提升网站页面的收录速度和SEO效果。通过支持IndexNow、百度等主流搜索引擎，结合自动提交、批量提交和智能重试机制，可以大大减少人工运营成本，提升网站在搜索引擎中的可见性。

**核心优势**：
- 🚀 加快收录速度：主动推送比被动等待快数倍
- 🤖 自动化运营：新内容发布后自动提交
- 📊 数据可视化：清晰了解提交情况和成功率
- 🔄 智能重试：失败自动重试，确保最终成功
- 🌍 多语言支持：一键提交所有语言版本

**技术亮点**：
- 使用 IndexNow 协议，一次提交多个搜索引擎
- 完善的错误处理和重试机制
- 灵活的批量提交和筛选功能
- 详细的统计数据和可视化报表
