# RunGame 项目文档

欢迎查阅 RunGame 项目文档。本目录包含项目的核心技术文档。

---

## 📚 核心文档

### 1. [架构文档](./ARCHITECTURE.md) ⭐

项目整体架构和技术栈说明，包括：
- 技术栈介绍
- 项目结构详解
- 双路由架构（管理后台 + 用户网站）
- 数据层设计
- 组件架构
- 缓存策略
- 开发工作流

**适合**: 全栈开发、系统架构、新成员入门

---

### 2. [数据库文档](./DATABASE.md) ⭐

完整的数据库架构说明，包括：
- 数据模型设计（Game, Category, Tag, Language, PageType, Admin）
- 翻译架构模式
- Prisma 查询模式
- 数据库操作最佳实践
- 性能优化策略

**适合**: 后端开发、数据库管理、数据迁移

---

### 3. [国际化文档](./I18N.md) ⭐

多语言支持完整指南，包括：
- next-intl 配置
- 路由规则（默认语言无前缀）
- 导航 API 使用（Link, useRouter, usePathname）
- 翻译文本管理
- 数据库翻译查询
- 语言切换实现
- 添加新语言步骤

**适合**: 前端开发、内容管理、多语言扩展

---

### 4. [页面结构文档](./PAGE-STRUCTURE.md) ⭐

PageType 系统和页面管理说明，包括：
- PageType 三种类型（GAME_LIST, STATIC_CONTENT, MIXED）
- 配置 JSON 格式详解
- 动态路由处理
- 内容块管理
- 缓存配置
- 管理后台操作指南

**适合**: 内容管理、页面创建、功能扩展

---

### 5. [SEO 文档](./SEO.md) ⭐

搜索引擎优化完整指南，包括：
- 动态 Metadata 生成
- 结构化数据 (JSON-LD)
- 多语言 SEO (hreflang)
- Sitemap 生成
- Google Analytics 集成
- Google AdSense 集成
- 内容优化策略
- 性能优化建议

**适合**: SEO 优化、流量增长、广告集成

---

### 6. [AI 功能文档](./AI-FEATURES.md) ⭐

AI 功能完整实现指南，包括：
- AI 配置系统（OpenAI、Anthropic、OpenRouter）
- 内容生成功能（单字段、批量、全量）
- API 集成与速率限制
- 批量生成对话框
- 质量控制与验证

**适合**: AI 集成、内容自动化、API 开发

---

### 7. [GamePix 导入文档](./GAMEPIX-IMPORT.md) ⭐

GamePix 游戏导入完整指南，包括：
- 浏览器插件使用
- 字段映射规则
- 图片上传到 R2
- 缓存优化
- 故障排查

**适合**: 游戏导入、第三方集成、数据迁移

---

## 🚀 快速开始

### 新开发者入门

1. **先阅读**: [架构文档](./ARCHITECTURE.md) - 了解项目整体结构
2. **然后阅读**: [数据库文档](./DATABASE.md) - 理解数据模型
3. **再阅读**: [国际化文档](./I18N.md) - 掌握多语言开发

### 特定任务指南

- **添加新功能**: 参考 [架构文档](./ARCHITECTURE.md) 的"添加新功能"章节
- **创建新页面**: 参考 [页面结构文档](./PAGE-STRUCTURE.md)
- **多语言开发**: 参考 [国际化文档](./I18N.md)
- **数据库操作**: 参考 [数据库文档](./DATABASE.md)
- **SEO 优化**: 参考 [SEO 文档](./SEO.md)

## 📋 文档索引

### 按主题分类

#### 🏗️ 架构与设计
- [项目架构](./ARCHITECTURE.md)
- [项目结构](./ARCHITECTURE.md#项目结构)
- [双路由架构](./ARCHITECTURE.md#双路由架构)
- [组件架构](./ARCHITECTURE.md#组件架构)

#### 💾 数据与数据库
- [数据库概览](./DATABASE.md)
- [数据模型](./DATABASE.md#核心数据模型)
- [查询模式](./DATABASE.md#数据库操作)
- [翻译架构](./DATABASE.md#翻译架构模式)

#### 🌍 国际化
- [国际化概览](./I18N.md)
- [路由规则](./I18N.md#路由规则)
- [导航 API](./I18N.md#导航-api)
- [翻译管理](./I18N.md#翻译文本)

#### 📄 页面管理
- [PageType 系统](./PAGE-STRUCTURE.md)
- [页面类型](./PAGE-STRUCTURE.md#页面类型详解)
- [配置说明](./PAGE-STRUCTURE.md#gamelistconfig-结构)
- [内容块](./PAGE-STRUCTURE.md#内容块类型)

#### 🔍 SEO 优化
- [SEO 概览](./SEO.md)
- [Metadata](./SEO.md#动态-metadata)
- [结构化数据](./SEO.md#结构化数据-json-ld)
- [Google 服务](./SEO.md#google-services-集成)
- [SEO 内容生成](./SEO-CONTENT-GENERATION.md) - AI 驱动的 SEO 内容生成系统
- [Google SEO 字符限制](./GOOGLE-SEO-META-LENGTH.md) - Google 搜索结果元标签显示长度
- [Google API 配置](./GOOGLE-SEARCH-API-SETUP.md) - Google Custom Search API 申请教程
- [元数据问题分析](./METADATA-ISSUES-ANALYSIS.md) - HTML head 标签元数据问题诊断与修复

#### 🤖 AI 功能
- [AI 功能概览](./AI-FEATURES.md)
- [AI 配置系统](./AI-FEATURES.md#ai-配置系统)
- [内容生成](./AI-FEATURES.md#内容生成功能)
- [批量生成](./AI-FEATURES.md#批量生成)

#### 🎮 游戏导入
- [GamePix 导入](./GAMEPIX-IMPORT.md)
- [浏览器插件](./GAMEPIX-IMPORT.md#浏览器插件使用)
- [字段映射](./GAMEPIX-IMPORT.md#字段映射规则)
- [R2 图片上传](./GAMEPIX-IMPORT.md#图片上传到-r2)

#### ⚡ 性能优化
- [查询优化](./QUERY-OPTIMIZATION.md) - 数据库查询性能优化
- [R2 CDN 配置](./R2-CDN-SETUP.md) - Cloudflare R2 存储和 CDN 配置

#### 🔧 开发工具
- [环境验证](./ENVIRONMENT-VALIDATION.md) - 环境变量验证和配置

## 🛠️ 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 数据库
npm run db:push      # 推送 schema 到数据库
npm run db:seed      # 填充初始数据
npm run db:generate  # 生成 Prisma 客户端（主数据库 + 缓存数据库）
npx prisma studio    # 数据库可视化管理

# 缓存数据库
npm run db:push:cache   # 推送缓存数据库 schema
npm run db:studio:cache # 缓存数据库可视化管理

# 代码质量
npm run lint         # ESLint 检查
```

---

## 📂 项目结构

```
rungame-nextjs/
├── app/                    # Next.js App Router
│   ├── (admin)/           # 管理后台（无国际化）
│   ├── (site)/            # 用户网站（完全国际化）
│   └── api/               # API 路由
│
├── components/            # React 组件
│   ├── admin/            # 管理后台组件
│   ├── site/             # 用户网站组件
│   └── ui/               # shadcn/ui 基础组件
│
├── lib/                   # 工具库和辅助函数
│   ├── generated/        # Prisma 生成的客户端
│   ├── data/             # 数据访问层
│   ├── helpers/          # 辅助函数
│   └── types/            # TypeScript 类型定义
│
├── prisma/               # 数据库
│   ├── schema.prisma           # 主数据库 schema
│   ├── schema-cache.prisma     # 缓存数据库 schema
│   └── seed.ts                 # 数据填充脚本
│
├── scripts/              # 维护脚本
│   ├── utils/           # 工具脚本（查询、检查、导入等）
│   ├── validation/      # 验证脚本（数据完整性检查）
│   ├── seo/             # SEO 相关脚本
│   └── assets/          # 资源生成脚本（图标、Logo等）
│
├── i18n/                 # 国际化
│   ├── routing.ts       # 路由配置
│   └── messages/        # 翻译文件
│
├── docs/                 # 📖 本文档目录
│   ├── README.md        # 文档导航（本文件）
│   ├── ARCHITECTURE.md  # 架构文档
│   ├── DATABASE.md      # 数据库文档
│   ├── I18N.md          # 国际化文档
│   ├── PAGE-STRUCTURE.md # 页面结构文档
│   └── SEO.md           # SEO 文档
│
└── public/              # 静态资源
    ├── logo/           # Logo 文件
    ├── test/           # 开发测试工具
    ├── favicon.ico     # 网站图标
    └── manifest.json   # PWA 配置
```

---

## 🧰 实用工具

### Scripts 工具脚本

项目包含多个维护脚本，位于 `scripts/` 目录：

#### 工具脚本 (`scripts/utils/`)
- `query-categories.ts` - 查询分类信息
- `check-categories.ts` - 检查分类状态
- `check-translations.ts` - 检查翻译完整性
- `import-demo-games.ts` - 导入演示游戏数据
- 更多...

#### 验证脚本 (`scripts/validation/`)
- `validate-category-data.ts` - 验证分类数据完整性
- `verify-seo-data.ts` - 验证 SEO 数据
- 更多...

#### SEO 脚本 (`scripts/seo/`)
- `populate-seo-data.ts` - 批量填充 SEO 数据

#### 资源生成 (`scripts/assets/`)
- `generate-icons.py` - 生成网站图标
- `generate-white-logo.py` - 生成白色 Logo

**使用方法**:
```bash
# 使用 tsx 运行 TypeScript 脚本
npx tsx scripts/utils/query-categories.ts

# 使用 Python 运行资源生成脚本
python3 scripts/assets/generate-icons.py
```

## 📞 获取帮助

### 常见问题

遇到问题时，先查看相关文档的"故障排查"或"常见问题"章节：
- [架构文档 - 故障排查](./ARCHITECTURE.md#故障排查)
- [数据库文档 - 故障排查](./DATABASE.md#故障排查)
- [国际化文档 - 常见问题](./I18N.md#常见问题)
- [页面结构文档 - 故障排查](./PAGE-STRUCTURE.md#故障排查)

### 文档反馈

如果发现文档有误或需要补充，请提交 Issue 或 Pull Request。

## 📝 文档更新日志

### 2025-01-30
- 🧹 第二轮大规模清理：删除 105 个临时文档
- 📚 合并相关文档：
  - 创建 AI-FEATURES.md 整合所有 AI 功能文档
  - 创建 GAMEPIX-IMPORT.md 整合游戏导入文档
- ✨ 精简到 14 个核心文档（从 117 个）
- 📖 更新文档索引和导航链接

### 2025-01-20
- 🧹 大规模清理：删除 80+ 个过时文档和脚本
- 📁 重组 scripts/ 目录为清晰的子目录结构
- ✨ 简化文档体系，只保留 6 个核心文档
- 📚 重写 README，提供更好的导航

---

## 📊 项目信息

- **项目名称**: RunGame
- **技术栈**: Next.js 15 + React 19 + TypeScript + Prisma + PostgreSQL
- **版本**: v1.0
- **文档版本**: 2025-01-30

---

**提示**: 所有文档均使用 Markdown 格式编写，支持代码高亮和目录导航。建议使用支持 Markdown 的编辑器阅读。
