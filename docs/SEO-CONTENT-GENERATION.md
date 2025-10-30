# SEO 内容智能生成系统 - 完整实施方案

## 📋 文档概览

本文档详细描述了 RunGame 项目的 SEO 内容智能生成系统的完整实施方案。

**创建时间**: 2025-01-21
**版本**: v1.0
**状态**: 待实施

---

## 🎯 系统目标

为游戏生成高质量的 SEO 优化内容，基于 Google 搜索排名前 5 的竞品分析。

### 核心功能

1. **Google 搜索集成** - 获取主关键词的 SEO 排名前 5 网页
2. **智能网页解析** - 使用 Jina AI Reader 提取网页核心内容
3. **双模式生成** - 快速模式（单步）和质量模式（两步）
4. **竞品分析** - 深度分析竞品的关键词策略和内容结构
5. **SEO 优化** - 自动优化关键词密度、内容结构和标签使用

---

## 🛠️ 技术架构

### 技术栈

| 组件 | 技术方案 | 说明 |
|------|---------|------|
| **搜索引擎** | Google Custom Search API | 精准的 SEO 排名数据 |
| **网页解析** | Jina AI Reader API | 将网页转为 Markdown |
| **AI 模型** | OpenRouter (多模型) | 灵活的 AI 选择 |
| **数据存储** | PostgreSQL (Prisma) | 保存历史和分析 |

### 数据流架构

```
用户输入 (主/副关键词 + 原始信息)
    ↓
Google Search API (1秒) - 获取排名前 5 的 URL
    ↓
Jina Reader API (3秒，并行 × 5) - 解析网页为 Markdown
    ↓
[分支]
    ├─ 快速模式: AI 单次生成 (5-8秒) → 结果
    └─ 质量模式: AI 分析 (4-6秒) → AI 生成 (4-6秒) → 结果
    ↓
返回: 内容 + SEO 分析 + 竞品报告
```

---

## 📊 双模式对比

### ⚡ 快速模式 (Fast Mode)

**特点**:
- 单次 AI 调用，直接生成所有内容
- 速度快，成本低
- 适合快速预览和简单游戏

**技术细节**:
- 耗时: 9-12 秒
- 成本: ~$0.05/次
- API 调用: 1 次
- 复杂度: 低

### 🎯 质量模式 (Quality Mode)

**特点**:
- 两步生成：先分析竞品，再生成内容
- SEO 效果最佳，质量更稳定
- 提供详细的竞品分析报告

**技术细节**:
- 耗时: 12-16 秒
- 成本: ~$0.10/次
- API 调用: 2 次
- 复杂度: 中

### 对比表

| 维度 | 快速模式 | 质量模式 |
|------|---------|---------|
| 速度 | ⚡⚡⚡ 9-12秒 | ⚡⚡ 12-16秒 |
| 成本 | 💰 $0.05 | 💰💰 $0.10 |
| 质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 分析深度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 稳定性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 可调试性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔧 环境配置

### 必需的环境变量

```bash
# .env.local

# Google Custom Search API (必需)
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Jina AI Reader (可选，提高速率限制)
JINA_API_KEY=your_jina_api_key_here

# OpenRouter AI (已有)
OPENROUTER_API_KEY=your_openrouter_key_here
```

### Google API 申请步骤

1. **创建项目**
   - 访问: https://console.cloud.google.com/
   - 创建新项目或选择现有项目

2. **启用 Custom Search API**
   - 访问: https://console.cloud.google.com/apis/library
   - 搜索 "Custom Search API"
   - 点击启用

3. **创建 API Key**
   - 访问: https://console.cloud.google.com/apis/credentials
   - 创建凭据 → API 密钥
   - 复制 API Key

4. **创建 Custom Search Engine**
   - 访问: https://programmablesearchengine.google.com/
   - 点击 "Add" 创建新搜索引擎
   - 配置:
     - 搜索范围: "搜索整个网络"
     - 语言: 根据需要设置
   - 获取 Search Engine ID (cx 参数)

5. **成本说明**
   - 免费额度: 100 次/天
   - 付费价格: $5/1000 次
   - 建议: 开发环境使用免费额度，生产环境考虑付费

### Jina API Key (可选)

1. 访问: https://jina.ai/reader
2. 注册账号
3. 获取 API Key
4. 免费版足够使用，API Key 可提高速率限制

---

## 📝 API 接口设计

### 请求端点

```
POST /api/ai/batch-generate-seo
```

### 请求参数

```typescript
{
  // 生成模式
  mode: 'fast' | 'quality',  // 默认 'quality'

  // 游戏信息
  gameId?: string,
  gameTitle: string,
  locale: 'en' | 'zh' | 'es' | 'fr',

  // SEO 关键词
  mainKeyword: string,        // 主关键词 (必需)
  subKeywords: string[],      // 副关键词 5-20 个 (必需)

  // 原始游戏信息
  originalGameInfo: {
    description?: string,
    howToPlay?: string,
    controls?: string,
    category?: string,
    tags?: string[],
    publisher?: string,
    // ... 其他字段
  },

  // 生成配置
  fields: ['controls', 'howToPlay', 'gameDetails', 'extras'],
  model?: string,  // AI 模型 ID (可选)

  // SEO 配置 (可选)
  seoConfig?: {
    topPagesCount?: number,  // 默认 5
    targetWordCount?: {
      controls?: number,      // 默认 120(en)/72(zh)
      howToPlay?: number,     // 默认 280/168
      gameDetails?: number,   // 默认 350/210
      extras?: number         // 默认 180/108
    }
  }
}
```

### 响应结果

```typescript
{
  success: boolean,
  mode: 'fast' | 'quality',

  // 生成的内容
  results: {
    controls: string,      // HTML 格式
    howToPlay: string,
    gameDetails: string,
    extras: string
  },

  // SEO 元数据
  seoMetadata: {
    mainKeyword: string,
    mainKeywordCount: {
      controls: number,
      howToPlay: number,
      gameDetails: number,
      extras: number,
      total: number
    },
    mainKeywordDensity: string,  // "2.5%"
    subKeywordsUsed: string[],
    totalWordCount: number,
    estimatedReadingTime: number
  },

  // Google 搜索结果
  googleSearchResults: Array<{
    rank: number,
    title: string,
    url: string,
    snippet: string
  }>,

  // 竞品内容
  competitorPages: Array<{
    rank: number,
    url: string,
    title: string,
    wordCount: number,
    content: string,  // Markdown
    error?: string
  }>,

  // 竞品分析 (仅质量模式)
  competitorAnalysis?: {
    competitors: [...],
    commonPatterns: {...},
    recommendations: {...}
  },

  // 性能统计
  performance: {
    searchTime: number,
    parseTime: number,
    analysisTime?: number,
    generationTime: number,
    totalTime: number
  }
}
```

---

## 💻 代码实现清单

### 新增文件

```
lib/
├── google-search.ts       # Google 搜索 API 集成
├── jina-reader.ts         # Jina Reader API 集成
└── seo-helpers.ts         # SEO 辅助函数

app/api/ai/
└── batch-generate-seo/
    └── route.ts           # SEO 生成主 API

components/admin/games/
└── BatchGenerateDialog.tsx  # 更新：添加 SEO 模式
```

### 修改文件

```
.env.local                 # 添加新的环境变量
package.json              # 无需新增依赖
```

### 删除文件

```
app/api/ai/
├── batch-generate-with-tools/     # 删除：Tool Calling 方案
└── batch-generate-with-web-search/ # 重构为 SEO 方案
```

---

## 🚀 实施步骤

### 阶段 1: 基础库实现 (Day 1)

#### 1.1 实现 Google Search

**文件**: `lib/google-search.ts`

**核心函数**:
```typescript
export async function searchGoogleTopPages(
  keyword: string,
  topN: number = 5,
  locale: string = 'en'
): Promise<GoogleSearchResult[]>
```

**测试要点**:
- [ ] 能正确调用 Google API
- [ ] 返回正确数量的结果
- [ ] 语言过滤正常工作
- [ ] 错误处理完善

#### 1.2 实现 Jina Reader

**文件**: `lib/jina-reader.ts`

**核心函数**:
```typescript
export async function readWebPage(url: string): Promise<JinaReaderResult>
export async function readMultiplePages(urls: string[]): Promise<JinaReaderResult[]>
```

**测试要点**:
- [ ] 能正确解析网页
- [ ] 返回 Markdown 格式
- [ ] 并行处理正常
- [ ] 超时和错误处理

#### 1.3 实现 SEO 辅助函数

**文件**: `lib/seo-helpers.ts`

**核心函数**:
```typescript
export function getTargetWordCount(baseCount: number, locale: string): number
export function getDefaultWordCount(locale: string): object
export function analyzeSeoMetadata(results, mainKeyword, subKeywords): object
export function getLanguageName(locale: string): string
```

**测试要点**:
- [ ] 字数计算准确
- [ ] SEO 分析正确
- [ ] 多语言支持完整

---

### 阶段 2: 快速模式实现 (Day 2)

#### 2.1 实现单步生成 API

**文件**: `app/api/ai/batch-generate-seo/route.ts`

**核心逻辑**:
```typescript
async function generateInOneStep(params) {
  // 1. 构建包含所有竞品内容的 System Prompt
  // 2. 一次性调用 AI 生成所有字段
  // 3. 返回结果
}
```

**Prompt 设计要点**:
- 清晰的 SEO 要求（关键词密度、位置）
- 完整的竞品内容（Markdown 格式）
- 明确的输出格式（JSON）
- 字数和结构要求

#### 2.2 测试快速模式

**测试用例**:
```typescript
{
  mode: 'fast',
  gameTitle: 'Test Puzzle Game',
  locale: 'en',
  mainKeyword: 'puzzle game',
  subKeywords: ['brain teaser', 'logic', 'strategy', 'casual', 'thinking'],
  originalGameInfo: {
    description: 'A challenging puzzle game',
    category: 'Puzzle'
  },
  fields: ['controls', 'howToPlay', 'gameDetails', 'extras']
}
```

**验证点**:
- [ ] Google 搜索成功
- [ ] Jina 解析成功
- [ ] AI 生成成功
- [ ] 返回格式正确
- [ ] SEO 元数据准确
- [ ] 耗时在 9-12 秒内

---

### 阶段 3: 质量模式实现 (Day 3)

#### 3.1 实现两步生成 API

**核心逻辑**:
```typescript
async function generateInTwoSteps(params) {
  // 步骤 1: 分析竞品
  const analysis = await analyzeCompetitors(params)

  // 步骤 2: 基于分析生成内容
  const content = await generateFromAnalysis(params, analysis)

  return { results: content, analysis }
}
```

**分析 Prompt 设计**:
- 要求 AI 深度分析每个竞品
- 提取关键词策略、内容结构、独特卖点
- 找出共同的成功模式
- 提供结构化的 JSON 报告

**生成 Prompt 设计**:
- 基于分析报告的建议
- 严格遵循发现的成功模式
- 加入独特角度
- 确保质量超越竞品

#### 3.2 测试质量模式

**测试用例**: 同快速模式，只修改 `mode: 'quality'`

**验证点**:
- [ ] 第一步分析成功
- [ ] 分析报告格式正确
- [ ] 第二步生成成功
- [ ] 内容质量明显更好
- [ ] 返回包含分析报告
- [ ] 耗时在 12-16 秒内

---

### 阶段 4: 前端集成 (Day 4)

#### 4.1 更新 BatchGenerateDialog

**文件**: `components/admin/games/BatchGenerateDialog.tsx`

**新增功能**:
1. 生成模式选择 (RadioGroup)
   - 快速模式
   - 质量模式（推荐）

2. 关键词输入
   - 主关键词（必填）
   - 副关键词（至少 5 个，逗号分隔）

3. 结果展示
   - SEO 分析报告
   - 竞品分析报告（质量模式）
   - 性能统计

**UI 改进**:
- [ ] 添加模式选择 UI
- [ ] 添加关键词输入区域
- [ ] 添加 SEO 分析展示
- [ ] 添加竞品分析展示
- [ ] 添加加载进度提示

#### 4.2 API 调用集成

```typescript
const response = await fetch('/api/ai/batch-generate-seo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: generationMode,
    gameTitle,
    locale,
    mainKeyword,
    subKeywords: subKeywordsList,
    originalGameInfo,
    fields,
    model: selectedModel
  })
})
```

---

### 阶段 5: 测试和优化 (Day 5-6)

#### 5.1 功能测试

**测试矩阵**:

| 场景 | 模式 | 语言 | 预期结果 |
|------|------|------|---------|
| 热门游戏 | Fast | EN | 找到 5 个竞品，生成成功 |
| 热门游戏 | Quality | EN | 找到 5 个竞品，有分析报告 |
| 冷门游戏 | Fast | EN | 可能只有 2-3 个竞品 |
| 中文游戏 | Quality | ZH | 中文搜索和生成 |
| 错误关键词 | Fast | EN | 友好的错误提示 |

**边界测试**:
- [ ] 主关键词为空
- [ ] 副关键词少于 5 个
- [ ] Google API 失败
- [ ] Jina 解析失败
- [ ] AI 调用失败
- [ ] 网络超时

#### 5.2 性能优化

**优化点**:
1. Jina Reader 并发控制（每批 3 个）
2. 内容长度限制（5000 字符）
3. AI Prompt 长度优化
4. 错误重试机制
5. 缓存机制（可选）

**性能目标**:
- [ ] 快速模式 < 12 秒
- [ ] 质量模式 < 16 秒
- [ ] 内存使用 < 512MB
- [ ] 并发支持 5 个请求

---

## 📊 Prompt 模板

### 快速模式 System Prompt

```markdown
你是世界顶级的 SEO 内容优化专家和游戏内容创作者。

# 核心任务
为游戏"${gameTitle}"生成 SEO 优化的内容（${locale}）。

# SEO 策略
**主关键词**: "${mainKeyword}"
- 密度: 2-3%
- 必须在第一段出现
- 总共出现约 ${targetCount} 次

**副关键词**: ${subKeywords.join(', ')}
- 总密度: 3-5%
- 智能分布在各字段
- 每个至少 1-2 次

# 竞品内容

## 竞品 1: ${page1.title}
URL: ${page1.url}
字数: ${page1.wordCount}

${page1.content}

---

[其他竞品...]

# 原始游戏信息
${JSON.stringify(originalGameInfo)}

# 生成字段
- controls (${wordCount.controls}词): 操作控制说明
- howToPlay (${wordCount.howToPlay}词): 玩法规则
- gameDetails (${wordCount.gameDetails}词): 游戏特色
- extras (${wordCount.extras}词): 技巧和FAQ

# 内容要求
1. 参考竞品结构但保持原创
2. 关键词自然融入，不堆砌
3. 使用 HTML 标签优化（<p>, <ul>, <strong>, <h3>）
4. 内容有价值，超越竞品
5. 符合目标字数

# 输出格式
返回 JSON:
```json
{
  "controls": "<p>...</p>",
  "howToPlay": "<p>...</p><ul><li>...</li></ul>",
  "gameDetails": "<h3>...</h3><p>...</p>",
  "extras": "<p>...</p>"
}
```
```

### 质量模式 - 分析 Prompt

```markdown
你是专业的 SEO 内容分析师。

# 任务
深度分析以下 5 个竞品网页的 SEO 策略。

# 分析目标
主关键词: "${mainKeyword}"
副关键词: ${subKeywords.join(', ')}

# 竞品内容
[同快速模式]

# 分析要求

对每个竞品提取：

1. **关键词策略**
   - 主关键词出现次数和位置
   - 关键词密度
   - 副关键词使用情况

2. **内容结构**
   - 标题层级和组织
   - 段落数量和长度
   - 列表和表格使用

3. **内容质量**
   - 独特卖点
   - 有价值的信息
   - 语言风格

4. **SEO 技巧**
   - HTML 标签使用
   - 内链策略
   - 结构化数据

# 输出格式
返回详细的 JSON 分析报告（见接口设计）
```

### 质量模式 - 生成 Prompt

```markdown
你是世界顶级的 SEO 内容创作者。

# 任务
基于竞品分析报告，为游戏"${gameTitle}"生成 SEO 优化内容。

# 竞品分析报告
${JSON.stringify(analysis, null, 2)}

# 关键洞察
从分析中发现的成功模式：
- ${successFactors.join('\n- ')}

推荐的独特角度：
- ${uniqueAngles.join('\n- ')}

# 原始游戏信息
${JSON.stringify(originalGameInfo)}

# 生成要求
严格遵循分析报告的建议：
1. 使用发现的成功结构模式
2. 匹配推荐的关键词密度
3. 加入独特角度
4. 内容质量超越竞品

[生成字段和输出格式同快速模式]
```

---

## 🐛 错误处理策略

### Google Search API 错误

```typescript
try {
  const results = await searchGoogleTopPages(keyword, 5, locale)
} catch (error) {
  if (error.message.includes('quota')) {
    return Response.json({
      error: 'Google 搜索 API 配额已用完，请稍后重试或升级套餐'
    }, { status: 429 })
  }
  return Response.json({
    error: '搜索失败，请检查关键词或网络连接'
  }, { status: 500 })
}
```

### Jina Reader 错误

```typescript
// 部分失败可以继续
const parsedPages = await readMultiplePages(urls)
const successCount = parsedPages.filter(p => !p.error).length

if (successCount === 0) {
  return Response.json({
    error: '无法解析任何竞品网页，请稍后重试'
  }, { status: 500 })
}

// 至少有部分成功，可以继续
if (successCount < urls.length) {
  console.warn(`只成功解析了 ${successCount}/${urls.length} 个网页`)
}
```

### AI 调用错误

```typescript
try {
  const response = await fetch(aiConfig.baseUrl, { ... })
  if (!response.ok) {
    throw new Error(`AI API 返回 ${response.status}`)
  }
} catch (error) {
  return Response.json({
    error: 'AI 生成失败，请检查 AI 配置或稍后重试',
    details: error.message
  }, { status: 500 })
}
```

---

## 📈 性能监控

### 关键指标

```typescript
// 在 API 中记录
console.log(`[SEO 生成] 性能统计:
  - 搜索: ${searchTime}ms
  - 解析: ${parseTime}ms
  - 分析: ${analysisTime}ms
  - 生成: ${generationTime}ms
  - 总计: ${totalTime}ms
`)

// 返回给前端展示
return Response.json({
  performance: {
    searchTime,
    parseTime,
    analysisTime,
    generationTime,
    totalTime
  }
})
```

### 预期性能基准

| 阶段 | 快速模式 | 质量模式 |
|------|---------|---------|
| Google 搜索 | ~1秒 | ~1秒 |
| Jina 解析 | ~3秒 | ~3秒 |
| AI 分析 | - | ~4-6秒 |
| AI 生成 | ~5-8秒 | ~4-6秒 |
| **总计** | **9-12秒** | **12-16秒** |

---

## 🔍 测试用例

### 测试用例 1: 热门益智游戏

```typescript
{
  mode: 'quality',
  gameTitle: 'Brain Challenge Pro',
  locale: 'en',
  mainKeyword: 'puzzle game',
  subKeywords: [
    'brain teaser',
    'logic puzzle',
    'mind game',
    'IQ test',
    'thinking game',
    'strategy puzzle',
    'casual game'
  ],
  originalGameInfo: {
    description: 'A challenging puzzle game with 100+ levels',
    category: 'Puzzle',
    tags: ['brain', 'logic', 'casual']
  },
  fields: ['controls', 'howToPlay', 'gameDetails', 'extras']
}
```

**预期结果**:
- 找到 5 个竞品
- 所有竞品成功解析
- 生成 4 个字段内容
- 主关键词密度 2-3%
- 总字数 ~900 词
- 包含竞品分析报告

---

### 测试用例 2: 中文动作游戏

```typescript
{
  mode: 'fast',
  gameTitle: '超级英雄大战',
  locale: 'zh',
  mainKeyword: '动作游戏',
  subKeywords: [
    '格斗',
    '冒险',
    '英雄',
    '闯关',
    '多人对战'
  ],
  originalGameInfo: {
    description: '激烈的动作格斗游戏',
    category: 'Action'
  },
  fields: ['controls', 'howToPlay', 'gameDetails', 'extras']
}
```

**预期结果**:
- 中文搜索结果
- 中文内容生成
- 字数约 ~540 词（中文乘 0.6）
- 快速模式耗时 < 12 秒

---

## 📚 参考资源

### API 文档

- **Google Custom Search**: https://developers.google.com/custom-search/v1/introduction
- **Jina AI Reader**: https://jina.ai/reader
- **OpenRouter**: https://openrouter.ai/docs

### SEO 最佳实践

- **关键词密度**: 主关键词 2-3%，总关键词 5-8%
- **内容长度**: 800-1500 词最佳
- **标题优化**: H2/H3 包含关键词
- **语义优化**: 使用同义词和相关词

### 相关文档

- [AI-CONFIG-IMPLEMENTATION-SUMMARY.md](./AI-CONFIG-IMPLEMENTATION-SUMMARY.md) - AI 配置系统
- [DATABASE.md](./DATABASE.md) - 数据库架构
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 项目架构

---

## 🚦 实施检查清单

### 环境准备

- [ ] Google API Key 已配置
- [ ] Google Search Engine ID 已配置
- [ ] Jina API Key 已配置（可选）
- [ ] OpenRouter API Key 正常工作
- [ ] 环境变量已添加到 .env.local

### 代码实现

- [ ] lib/google-search.ts 完成
- [ ] lib/jina-reader.ts 完成
- [ ] lib/seo-helpers.ts 完成
- [ ] app/api/ai/batch-generate-seo/route.ts 完成
- [ ] components/admin/games/BatchGenerateDialog.tsx 更新完成

### 功能测试

- [ ] 快速模式正常工作
- [ ] 质量模式正常工作
- [ ] Google 搜索正常
- [ ] Jina 解析正常
- [ ] SEO 分析准确
- [ ] 错误处理完善

### 性能测试

- [ ] 快速模式 < 12 秒
- [ ] 质量模式 < 16 秒
- [ ] 并发支持正常
- [ ] 内存使用合理

### 文档和部署

- [ ] 代码注释完整
- [ ] 用户文档完成
- [ ] 部署到测试环境
- [ ] 部署到生产环境

---

## 📞 问题和支持

如果在实施过程中遇到问题：

1. **Google API 问题** - 检查 API Key 和配额
2. **Jina 解析问题** - 检查网络连接，考虑添加重试
3. **AI 生成问题** - 检查 Prompt 和模型选择
4. **性能问题** - 优化并发数和内容长度

---

**文档维护者**: AI Assistant
**最后更新**: 2025-01-21
**版本**: v1.0
