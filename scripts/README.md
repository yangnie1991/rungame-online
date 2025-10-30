# Scripts 工具脚本目录

本目录包含项目的维护和管理脚本，按功能分类为不同的子目录。

---

## 📂 目录结构

```
scripts/
├── utils/          # 工具脚本（查询、检查、导入等）
├── validation/     # 验证脚本（数据完整性检查）
├── seo/            # SEO 相关脚本
└── assets/         # 资源生成脚本（图标、Logo等）
```

---

## 🛠️ 工具脚本 (`utils/`)

日常维护和数据管理工具。

| 脚本 | 功能 | 用法 |
|------|------|------|
| **分类管理** |||
| `query-categories.ts` | 查询分类信息和统计 | `npx tsx scripts/utils/query-categories.ts` |
| `check-categories.ts` | 检查分类状态和完整性 | `npx tsx scripts/utils/check-categories.ts` |
| `check-missing-categories.ts` | 检查缺失的分类 | `npx tsx scripts/utils/check-missing-categories.ts` |
| `show-category-stats.ts` | 显示分类统计信息 | `npx tsx scripts/utils/show-category-stats.ts` |
| **翻译和数据** |||
| `check-translations.ts` | 检查翻译完整性 | `npx tsx scripts/utils/check-translations.ts` |
| `import-demo-games.ts` | 从缓存数据库导入演示游戏 | `npx tsx scripts/utils/import-demo-games.ts` |
| `clear-and-import.ts` | 清除并重新导入数据 | `npx tsx scripts/utils/clear-and-import.ts` |
| **AI 和游戏** |||
| `check-ai-config-db.ts` | 检查 AI 配置数据库状态 | `npx tsx scripts/utils/check-ai-config-db.ts` |
| `clean-ai-configs.ts` | 清理无效的 AI 配置 | `npx tsx scripts/utils/clean-ai-configs.ts` |
| `check-game-status.ts` | 检查游戏发布状态 | `npx tsx scripts/utils/check-game-status.ts` |
| `check-video-data.ts` | 检查游戏视频数据 | `npx tsx scripts/utils/check-video-data.ts` |
| **站点配置** |||
| `create-site-config-tables.ts` | 创建站点配置表 | `npx tsx scripts/utils/create-site-config-tables.ts` |
| `verify-site-config.ts` | 验证站点配置 | `npx tsx scripts/utils/verify-site-config.ts` |

---

## ✅ 验证脚本 (`validation/`)

用于验证数据完整性和正确性的脚本。

| 脚本 | 功能 | 用法 |
|------|------|------|
| `validate-category-data.ts` | 全面验证分类数据完整性 | `npx tsx scripts/validation/validate-category-data.ts` |
| `verify-seo-data.ts` | 验证 SEO 元数据 | `npx tsx scripts/validation/verify-seo-data.ts` |
| `test-seo-metadata.ts` | 测试 SEO 元数据生成 | `npx tsx scripts/validation/test-seo-metadata.ts` |
| `direct-seo-verification.ts` | 直接验证 SEO 配置 | `npx tsx scripts/validation/direct-seo-verification.ts` |

---

## 🔍 SEO 脚本 (`seo/`)

SEO 优化和元数据管理脚本。

| 脚本 | 功能 | 用法 |
|------|------|------|
| `populate-seo-data.ts` | 批量填充 SEO 元数据 | `npx tsx scripts/seo/populate-seo-data.ts` |

---

## 🎨 资源生成脚本 (`assets/`)

用于生成图标、Logo 等品牌资源的脚本（Python）。

| 脚本 | 功能 | 用法 |
|------|------|------|
| `generate-icons.py` | 生成网站图标（多种尺寸） | `python3 scripts/assets/generate-icons.py` |
| `generate-icons-gamepad.py` | 生成游戏手柄风格图标 | `python3 scripts/assets/generate-icons-gamepad.py` |
| `generate-white-logo.py` | 生成白色 Logo | `python3 scripts/assets/generate-white-logo.py` |

**Python 环境要求**:
```bash
pip3 install Pillow  # 图像处理库
```

---

## 📝 使用指南

### TypeScript 脚本

所有 `.ts` 脚本使用 `tsx` 运行：

```bash
# 基本用法
npx tsx scripts/utils/query-categories.ts

# 带参数
npx tsx scripts/utils/import-demo-games.ts --limit 10
```

### Python 脚本

所有 `.py` 脚本使用 Python 3 运行：

```bash
# 基本用法
python3 scripts/assets/generate-icons.py

# 确保已安装依赖
pip3 install -r requirements.txt
```

---

## ⚠️ 注意事项

### 数据安全

- ⚠️ **慎用清除脚本**: `clear-and-import.ts` 会删除现有数据
- ✅ **生产环境**: 运行脚本前先备份数据库
- ✅ **测试环境**: 建议先在测试环境验证

### 环境变量

脚本需要正确配置环境变量：

```bash
# 主数据库
DATABASE_URL="postgresql://..."

# 缓存数据库（部分脚本需要）
CACHE_DATABASE_URL="postgresql://..."
```

---

## 🔧 开发新脚本

### 添加新的工具脚本

1. 在适当的子目录创建脚本文件
2. 遵循现有脚本的结构
3. 更新本 README 文档

### 脚本模板 (TypeScript)

```typescript
// scripts/utils/my-script.ts
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('🚀 开始执行脚本...')

  try {
    // 你的脚本逻辑

    console.log('✅ 脚本执行成功')
  } catch (error) {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

### 脚本模板 (Python)

```python
# scripts/assets/my-script.py
from PIL import Image
import os

def main():
    print('🚀 开始执行脚本...')

    try:
        # 你的脚本逻辑

        print('✅ 脚本执行成功')
    except Exception as e:
        print(f'❌ 脚本执行失败: {e}')
        exit(1)

if __name__ == '__main__':
    main()
```

---

## 📚 相关文档

- [项目架构文档](../docs/ARCHITECTURE.md) - 了解项目整体结构
- [数据库文档](../docs/DATABASE.md) - 数据库 schema 和查询
- [SEO 文档](../docs/SEO.md) - SEO 优化指南

---

## 📝 更新日志

### 2025-01-30
- 🧹 清理临时脚本：删除 12 个测试和分析脚本
- 📦 整理脚本：移动 4 个检查脚本到 utils/ 目录
- 📚 更新 README：添加新增的脚本说明
- 📊 最终统计：23 个有用的脚本

### 2025-01-20
- 🎉 重组 scripts 目录为清晰的子目录结构
- 📁 创建 utils、validation、seo、assets 子目录
- 📚 创建本 README 文档

---

**最后更新**: 2025-01-30
