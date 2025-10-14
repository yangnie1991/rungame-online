# 数据库种子文件使用说明

## 概述

本项目的种子文件 (`seed.ts`) 用于初始化数据库的基础数据，包括：
- 管理员用户
- 语言配置（英文、中文）
- 游戏分类及翻译（26个分类）

## 使用方法

### 运行种子文件

```bash
npm run db:seed
```

### 配置选项

在 `seed.ts` 文件中，有一个重要的配置项：

```typescript
const RESET_DATABASE = false
```

#### 选项说明

**`RESET_DATABASE = false`（默认，推荐）**
- ✅ 保留现有的游戏、标签数据
- ✅ 仅创建或更新分类数据
- ✅ 安全模式，不会删除任何数据
- 使用场景：日常开发、更新分类翻译

**`RESET_DATABASE = true`（⚠️ 危险操作！）**
- ⚠️ 清空所有游戏数据
- ⚠️ 清空所有标签数据
- ⚠️ 清空所有分类数据
- ✅ 然后重新创建26个分类
- 使用场景：首次初始化数据库、完全重置数据

## 种子数据内容

### 1. 管理员用户

- **邮箱**: `admin@rungame.online`
- **密码**: `admin123`
- **角色**: `SUPER_ADMIN`

> ⚠️ **安全提醒**：生产环境部署前必须修改默认密码！

### 2. 语言配置

| 代码 | 名称 | 本地名称 | 旗帜 | 默认 |
|------|------|----------|------|------|
| en   | English | English | 🇬🇧 | ✅ |
| zh   | Chinese | 中文 | 🇨🇳 | ❌ |

### 3. 游戏分类（26个）

每个分类包含：
- **slug**: URL友好的标识符
- **icon**: Emoji图标
- **sortOrder**: 排序顺序（1-26）
- **英文翻译**: name, description, metaTitle, metaDescription
- **中文翻译**: name, description, metaTitle, metaDescription

#### 分类列表

1. Puzzle / 益智游戏 🧩
2. Casual / 休闲游戏 🎮
3. Match-3 / 三消游戏 💎
4. Dress-up / 换装游戏 👗
5. Mahjong & Connect / 麻将连连看 🀄
6. Agility / 敏捷游戏 ⚡
7. Racing & Driving / 赛车游戏 🏎️
8. Adventure / 冒险游戏 🗺️
9. Cards / 纸牌游戏 🃏
10. Simulation / 模拟游戏 🎭
11. Shooter / 射击游戏 🎯
12. Strategy / 策略游戏 ♟️
13. Bubble Shooter / 泡泡射击 🫧
14. Boardgames / 棋盘游戏 🎲
15. Battle / 战斗游戏 ⚔️
16. Sports / 体育游戏 ⚽
17. Football / 足球游戏 🏈
18. Merge / 合并游戏 🔀
19. .IO / .IO游戏 🌐
20. Art / 艺术游戏 🎨
21. Educational / 教育游戏 📚
22. Basketball / 篮球游戏 🏀
23. Cooking / 烹饪游戏 🍳
24. Care / 照顾游戏 💝
25. Quiz / 问答游戏 ❓
26. Jigsaw / 拼图游戏 🧩

## 常见使用场景

### 场景1: 首次初始化数据库

```bash
# 1. 确保数据库已创建
npm run db:push

# 2. 修改 seed.ts 中的配置
# const RESET_DATABASE = true

# 3. 运行种子文件
npm run db:seed

# 4. 改回安全模式（可选）
# const RESET_DATABASE = false
```

### 场景2: 更新分类翻译

```bash
# 1. 保持 RESET_DATABASE = false（默认）

# 2. 修改 seed.ts 中的分类翻译内容

# 3. 运行种子文件（不会删除现有游戏数据）
npm run db:seed
```

### 场景3: 添加新分类

```bash
# 1. 在 categoriesData 数组中添加新分类数据

# 2. 确保包含英文和中文翻译

# 3. 运行种子文件
npm run db:seed
```

### 场景4: 完全重置数据库

```bash
# ⚠️ 警告：这将删除所有数据！

# 1. 修改配置
# const RESET_DATABASE = true

# 2. 运行种子文件
npm run db:seed

# 3. 所有游戏、标签、分类数据将被清空并重建
```

## 数据验证

运行种子文件后，可以使用以下命令验证数据：

```bash
# 启动 Prisma Studio 查看数据
npx prisma studio

# 或者使用 SQL 查询
npm run db:studio
```

预期结果：
- ✅ 1个管理员用户
- ✅ 2种语言配置
- ✅ 26个分类
- ✅ 52条分类翻译（26英文 + 26中文）

## 注意事项

1. **生产环境部署前**：
   - 修改管理员默认密码
   - 检查 `RESET_DATABASE` 设置为 `false`
   - 备份现有数据

2. **开发环境**：
   - 首次初始化可以使用 `RESET_DATABASE = true`
   - 日常开发建议使用 `RESET_DATABASE = false`

3. **数据一致性**：
   - 种子文件使用 `upsert` 操作，可以安全地多次运行
   - 在 `RESET_DATABASE = false` 模式下不会产生重复数据

4. **外键约束**：
   - 如果有游戏数据引用分类，无法删除分类
   - 必须先清空游戏数据才能清空分类数据
   - 种子文件已处理这个顺序

## 问题排查

### 问题1: 外键约束错误

```
Foreign key constraint violated on the constraint: `games_category_id_fkey`
```

**解决方案**：设置 `RESET_DATABASE = true`，让种子文件按正确顺序清空数据。

### 问题2: 分类数据重复

**原因**：多次运行种子文件且 `RESET_DATABASE = false`

**解决方案**：使用 `upsert` 操作已经避免了这个问题，不会产生重复。

### 问题3: 翻译数据缺失

**检查**：
```sql
SELECT locale, COUNT(*) FROM category_translations GROUP BY locale;
```

**预期结果**：
- en: 26
- zh: 26

## 更新日志

- **2025-01-XX**: 初始版本，包含26个分类的双语翻译
- **2025-01-XX**: 添加 `RESET_DATABASE` 配置选项
- **2025-01-XX**: 添加标签数据清理功能
