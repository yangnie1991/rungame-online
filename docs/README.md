# 文档中心

欢迎查阅 RunGame 项目文档。本目录包含所有技术文档、指南和参考资料。

## 📚 文档索引

### 🚀 快速开始

| 文档 | 描述 |
|------|------|
| [项目 README](../README.md) | 项目概览和快速开始指南 |
| [CLAUDE.md](../CLAUDE.md) | 给 AI 助手的完整架构文档 |
| [部署指南](DEPLOYMENT.md) | 完整的部署指南（Vercel、Docker、PM2） |
| [环境变量配置](ENVIRONMENT.md) | 环境变量详细说明和最佳实践 |

### 📖 核心概念

| 文档 | 描述 |
|------|------|
| [PageType 详解](PAGETYPE-EXPLANATION.md) | PageType 系统的三种模式详解 |
| [国际化最佳实践](I18N-BEST-PRACTICES.md) | next-intl 使用指南和最佳实践 |
| [实现指南](IMPLEMENTATION-GUIDE.md) | 详细的功能实现指南 |
| [shadcn/ui 说明](SHADCN-UI-EXPLAINED.md) | UI 组件库使用说明 |

### 🔧 问题排查

| 文档 | 描述 |
|------|------|
| [数据库连接问题](DATABASE-CONNECTION-ISSUE.md) | 连接池配置和故障排查 |
| [国际化回退修复](I18N-FALLBACK-FIX-REPORT.md) | 翻译回退问题分析和解决 |
| [表字段重排序](REORDER-TABLE-COLUMNS.md) | 数据库表字段调整指南 |
| [Languages 表重建](LANGUAGES-TABLE-REBUILD-SUMMARY.md) | Languages 表重建操作记录 |

## 🗂️ 按主题分类

### 部署和运维
- [部署指南](DEPLOYMENT.md) - Vercel、Docker、PM2 部署方案
- [环境变量配置](ENVIRONMENT.md) - 环境变量完整说明
- [数据库连接问题](DATABASE-CONNECTION-ISSUE.md) - 数据库连接池配置

### 国际化 (i18n)
- [国际化最佳实践](I18N-BEST-PRACTICES.md) - next-intl 使用指南
- [国际化回退修复](I18N-FALLBACK-FIX-REPORT.md) - 翻译回退问题

### 功能实现
- [PageType 详解](PAGETYPE-EXPLANATION.md) - 动态页面系统
- [实现指南](IMPLEMENTATION-GUIDE.md) - 功能实现详解
- [shadcn/ui 说明](SHADCN-UI-EXPLAINED.md) - UI 组件使用

### 数据库
- [数据库连接问题](DATABASE-CONNECTION-ISSUE.md) - 连接故障排查
- [表字段重排序](REORDER-TABLE-COLUMNS.md) - 表结构调整
- [Languages 表重建](LANGUAGES-TABLE-REBUILD-SUMMARY.md) - 表重建记录

## 📋 文档状态

### ✅ 完整文档
所有文档都已完成并保持更新。

### 🔄 定期更新
以下文档会随项目演进定期更新：
- [CLAUDE.md](../CLAUDE.md)
- [README.md](../README.md)
- [部署指南](DEPLOYMENT.md)

### 📝 历史记录
以下文档记录了历史操作和问题解决：
- [国际化回退修复](I18N-FALLBACK-FIX-REPORT.md)
- [表字段重排序](REORDER-TABLE-COLUMNS.md)
- [Languages 表重建](LANGUAGES-TABLE-REBUILD-SUMMARY.md)

## 🎯 文档使用建议

### 新开发者
1. 阅读 [README.md](../README.md) 快速了解项目
2. 查看 [CLAUDE.md](../CLAUDE.md) 理解完整架构
3. 参考 [环境变量配置](ENVIRONMENT.md) 设置开发环境
4. 查阅 [国际化最佳实践](I18N-BEST-PRACTICES.md) 学习 i18n

### 部署人员
1. 阅读 [部署指南](DEPLOYMENT.md)
2. 配置 [环境变量](ENVIRONMENT.md)
3. 参考 [数据库连接问题](DATABASE-CONNECTION-ISSUE.md) 优化连接池

### 维护人员
1. 查看 [问题排查](#-问题排查) 部分的文档
2. 参考历史问题解决方案
3. 更新文档以记录新问题和解决方案

## 🔗 外部资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js 文档](https://next-auth.js.org/)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

### 参考资料
- [Next.js App Router 最佳实践](https://nextjs.org/docs/app/building-your-application)
- [Prisma 最佳实践](https://www.prisma.io/docs/guides/performance-and-optimization)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

## 📮 反馈和改进

发现文档问题或有改进建议？

1. 提交 [GitHub Issue](https://github.com/yourusername/rungame-nextjs/issues)
2. 发送 Pull Request
3. 联系项目维护者

## 📜 文档维护

### 更新原则
- 保持文档与代码同步
- 使用清晰的标题和结构
- 提供实际代码示例
- 包含故障排查指南

### 文档模板
创建新文档时，请遵循以下结构：

```markdown
# 文档标题

简短的文档描述。

## 目录
- [章节1](#章节1)
- [章节2](#章节2)

## 章节1
内容...

## 相关文档
- [相关文档1](link1)
- [相关文档2](link2)

---
**最后更新**: YYYY-MM-DD
```

---

**最后更新**: 2025-01-14

**文档总数**: 10 个主要文档
