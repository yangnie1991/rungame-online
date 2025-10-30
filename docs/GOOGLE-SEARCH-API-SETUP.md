# Google Custom Search API 申请和配置教程

## 📋 概述

本教程将指导你完成 Google Custom Search API 的申请和配置，用于 SEO 内容生成系统。

**预计时间**: 15-20 分钟
**成本**: 免费额度 100 次/天，付费 $5/1000 次

---

## 🎯 第一步：创建 Google Cloud 项目

### 1.1 访问 Google Cloud Console

打开浏览器，访问: https://console.cloud.google.com/

**登录**: 使用你的 Google 账号登录

### 1.2 创建新项目

1. 点击顶部的项目选择器（项目名称旁边的下拉菜单）
2. 点击 "新建项目" (New Project)
3. 填写项目信息：
   - **项目名称**: `RunGame SEO`（或任何你喜欢的名称）
   - **位置**: 选择 "无组织" 或你的组织
4. 点击 "创建" (Create)

**等待**: 项目创建需要几秒钟

### 1.3 选择项目

项目创建完成后，确保你已选择该项目（在顶部工具栏可以看到项目名称）

---

## 🔑 第二步：启用 Custom Search API

### 2.1 访问 API 库

1. 在 Google Cloud Console 中
2. 点击左侧菜单 ☰
3. 选择 "API 和服务" → "库" (APIs & Services → Library)

或直接访问: https://console.cloud.google.com/apis/library

### 2.2 搜索并启用 API

1. 在搜索框中输入: `Custom Search API`
2. 点击搜索结果中的 "Custom Search API"
3. 点击 "启用" (Enable) 按钮

**等待**: API 启用需要几秒钟

### 2.3 启用计费（可选，但推荐）

**注意**:
- 免费额度：100 次/天
- 如果需要更多配额，需要启用计费

启用计费步骤：
1. 点击左侧菜单 "结算" (Billing)
2. 点击 "关联结算账号" (Link a billing account)
3. 按照提示创建结算账号或选择现有账号

**成本估算**:
- 前 100 次/天: 免费
- 超出部分: $5/1000 次
- 每天使用 20 次: 完全免费
- 每天使用 200 次: 约 $0.50/天

---

## 🔐 第三步：创建 API 密钥

### 3.1 访问凭据页面

1. 点击左侧菜单 "API 和服务" → "凭据" (Credentials)

或直接访问: https://console.cloud.google.com/apis/credentials

### 3.2 创建 API 密钥

1. 点击顶部 "+ 创建凭据" (Create Credentials)
2. 选择 "API 密钥" (API Key)
3. **复制 API 密钥**: 在弹出窗口中显示的密钥

**重要**: 立即保存这个密钥！它看起来像这样：
```
AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3.3 限制 API 密钥（推荐）

为了安全，建议限制 API 密钥的使用范围：

1. 点击刚创建的 API 密钥
2. 在 "API 限制" 部分：
   - 选择 "限制密钥"
   - 勾选 "Custom Search API"
3. 在 "应用限制" 部分（可选）：
   - 选择 "HTTP 引用站点"
   - 添加你的域名，如：`rungame.online/*`, `*.vercel.app/*`
4. 点击 "保存" (Save)

---

## 🔍 第四步：创建自定义搜索引擎

### 4.1 访问 Programmable Search Engine

打开新标签页，访问: https://programmablesearchengine.google.com/

**登录**: 使用同一个 Google 账号

### 4.2 创建搜索引擎

1. 点击 "Add" 或 "开始使用" (Get Started)
2. 填写搜索引擎信息：

#### 基本信息
- **搜索引擎名称**: `RunGame SEO Search`
- **您要搜索什么？**: 选择 "搜索整个网络" (Search the entire web)

#### 高级设置（点击展开）
- **搜索引擎语言**: 选择 "英语" 或 "多语言"
- **图片搜索**: 关闭（不需要）
- **SafeSearch**: 关闭（根据需要）

3. 点击 "创建" (Create)

### 4.3 启用网络搜索

**重要步骤**（必须执行）：

1. 在创建完成页面，找到 "搜索整个网络" 选项
2. 确保开关已打开（蓝色）
3. 如果关闭，点击开启

### 4.4 获取搜索引擎 ID

1. 在左侧菜单，点击 "概览" (Overview)
2. 找到 "搜索引擎 ID" (Search engine ID) 或 "CX"
3. **复制这个 ID**，它看起来像这样：
```
a1b2c3d4e5f6g7h8i
```

或者：
1. 点击 "设置" (Setup)
2. 在 "基本信息" 部分找到 "搜索引擎 ID"

---

## ⚙️ 第五步：配置到项目

### 5.1 添加到环境变量

打开你的项目根目录下的 `.env.local` 文件（如果不存在则创建）

添加以下两行：

```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i
```

**替换**:
- `AIzaSyBXXXXXXXX` → 替换为你在第三步获取的 API 密钥
- `a1b2c3d4e5f6g7h8i` → 替换为你在第四步获取的搜索引擎 ID

### 5.2 重启开发服务器

```bash
# 停止当前运行的服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

---

## ✅ 第六步：测试配置

### 6.1 创建测试脚本

创建文件 `scripts/test-google-search.ts`:

```typescript
import { searchGoogleTopPages } from '@/lib/google-search'

async function testGoogleSearch() {
  console.log('🔍 测试 Google Search API...\n')

  try {
    // 测试搜索
    const results = await searchGoogleTopPages('puzzle game', 5, 'en')

    console.log(`✅ 成功找到 ${results.length} 个结果:\n`)

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      console.log(`   URL: ${result.url}`)
      console.log(`   摘要: ${result.snippet.substring(0, 100)}...\n`)
    })

    console.log('✅ Google Search API 配置成功！')
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    console.error('\n请检查:')
    console.error('1. GOOGLE_SEARCH_API_KEY 是否正确')
    console.error('2. GOOGLE_SEARCH_ENGINE_ID 是否正确')
    console.error('3. Custom Search API 是否已启用')
    console.error('4. 搜索引擎是否设置为"搜索整个网络"')
  }
}

testGoogleSearch()
```

### 6.2 运行测试

```bash
npx tsx scripts/test-google-search.ts
```

**预期输出**:
```
🔍 测试 Google Search API...

✅ 成功找到 5 个结果:

1. Best Puzzle Games - Top 10 Brain Teasers
   URL: https://example.com/puzzle-games
   摘要: Discover the best puzzle games...

2. ...

✅ Google Search API 配置成功！
```

---

## 🐛 常见问题排查

### 问题 1: "API key not valid"

**原因**: API 密钥错误或未启用

**解决方案**:
1. 检查 `.env.local` 中的 `GOOGLE_SEARCH_API_KEY` 是否正确
2. 确认 Custom Search API 已启用
3. 如果设置了 API 限制，确认 Custom Search API 在允许列表中

### 问题 2: "Invalid Value for SearchEngineId"

**原因**: 搜索引擎 ID 错误

**解决方案**:
1. 检查 `.env.local` 中的 `GOOGLE_SEARCH_ENGINE_ID` 是否正确
2. 访问 https://programmablesearchengine.google.com/
3. 确认搜索引擎 ID（CX）是否复制正确

### 问题 3: "Quota exceeded"

**原因**: 超过免费配额（100 次/天）

**解决方案**:
1. 等待第二天（配额每天重置）
2. 或启用计费账号

### 问题 4: "搜索整个网络未启用"

**原因**: 搜索引擎设置错误

**解决方案**:
1. 访问 https://programmablesearchengine.google.com/
2. 选择你的搜索引擎
3. 在 "设置" → "基本信息" 中
4. 确保 "搜索整个网络" 选项已启用

### 问题 5: 返回结果为空

**原因**: 关键词太冷门或语言设置问题

**解决方案**:
1. 尝试更常见的关键词（如 "game"）
2. 检查语言设置是否正确

---

## 💰 配额和成本管理

### 免费配额

- **每天**: 100 次免费搜索
- **重置时间**: 太平洋时间每天 00:00

### 付费定价

启用计费后：
- **前 100 次/天**: 免费
- **101-10000 次**: $5/1000 次（$0.005/次）
- **10000+ 次**: 联系 Google 获取企业定价

### 成本估算工具

| 每天使用量 | 每月成本 | 说明 |
|-----------|---------|------|
| 50 次 | $0 | 完全免费 |
| 100 次 | $0 | 免费上限 |
| 200 次 | $15 | 100 次免费 + 100 次付费 |
| 500 次 | $60 | 100 次免费 + 400 次付费 |
| 1000 次 | $135 | 100 次免费 + 900 次付费 |

**建议**:
- 开发环境：使用免费配额
- 生产环境：根据实际需求决定
- 设置预算警报：在 Google Cloud Console 设置每月预算上限

### 设置预算警报

1. 访问: https://console.cloud.google.com/billing
2. 选择 "预算和提醒" (Budgets & alerts)
3. 点击 "创建预算" (Create budget)
4. 设置每月预算金额（如 $10）
5. 设置警报阈值（如 50%, 90%, 100%）
6. 添加邮箱接收通知

---

## 📊 监控使用情况

### 查看 API 使用量

1. 访问: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/metrics
2. 选择时间范围
3. 查看请求数、错误率等指标

### 设置配额限制（可选）

如果担心超支，可以设置每日配额上限：

1. 访问: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas
2. 找到 "Queries per day"
3. 点击编辑（铅笔图标）
4. 设置每日上限（如 200）
5. 保存

---

## 🔐 安全建议

### 1. 保护 API 密钥

- ✅ 添加到 `.env.local`（已在 .gitignore 中）
- ✅ 不要提交到 Git
- ✅ 不要在客户端代码中使用
- ✅ 定期轮换密钥

### 2. 限制 API 密钥使用

在 Google Cloud Console 中：
- 限制到特定 API（Custom Search API）
- 限制到特定域名或 IP
- 设置每日配额上限

### 3. 监控异常使用

- 设置预算警报
- 定期检查使用日志
- 发现异常立即禁用密钥

---

## 🚀 下一步

配置完成后，你可以：

1. ✅ 运行测试脚本验证配置
2. ✅ 继续实施 SEO 内容生成 API
3. ✅ 集成到前端界面

参考文档:
- [SEO-CONTENT-GENERATION.md](./SEO-CONTENT-GENERATION.md) - 完整实施方案
- [lib/google-search.ts](../lib/google-search.ts) - API 封装代码

---

## 📚 官方文档

- **Custom Search JSON API**: https://developers.google.com/custom-search/v1/introduction
- **API 参考**: https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list
- **定价**: https://developers.google.com/custom-search/v1/overview#pricing
- **配额**: https://developers.google.com/custom-search/v1/overview#quota

---

## ❓ 需要帮助？

如果遇到问题：

1. 查看本文档的 "常见问题排查" 部分
2. 检查 [Google 官方文档](https://developers.google.com/custom-search)
3. 运行测试脚本获取详细错误信息

---

**文档创建时间**: 2025-01-21
**最后更新**: 2025-01-21
