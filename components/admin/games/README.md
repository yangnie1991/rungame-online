# Games 管理组件

这个文件夹包含了游戏管理相关的所有组件。

## 文件结构

```
components/admin/games/
├── GameForm/                      # 游戏表单组件文件夹
│   ├── GameForm.tsx              # 主表单组件
│   ├── GameBasicInfo.tsx         # 基本信息子组件
│   ├── GameTranslationContent.tsx # 多语言内容子组件
│   ├── GameMediaSection.tsx      # 媒体内容子组件
│   └── index.tsx                 # 导出文件
│
├── DeleteGameButton.tsx           # 删除游戏按钮
├── ToggleGameStatus.tsx          # 切换游戏状态按钮
│
├── GamePixBrowser.tsx            # GamePix 浏览器
├── GamePixExtractButton.tsx      # GamePix 提取按钮
├── GamePixImportForm.tsx         # GamePix 导入表单
├── GameImportConfirmDialog.tsx   # 导入确认对话框
├── SyncProgressDialog.tsx        # 同步进度对话框
│
├── index.tsx                     # 主导出文件
└── README.md                     # 说明文档
```

## 游戏表单组件 (GameForm/)

### GameForm.tsx (主组件)
游戏创建和编辑的主表单组件。

**使用方式：**
```tsx
// 创建模式
<GameForm mode="create" />

// 编辑模式
<GameForm mode="edit" game={gameData} />
```

**Props:**
- `mode`: `"create" | "edit"` - 表单模式
- `game?`: 游戏数据（编辑模式必需）

**功能：**
- 自动处理英文/翻译数据分离
- 表单验证和错误提示
- 数据加载和保存
- 成功/失败提示

### GameBasicInfo.tsx (子组件)
基本信息卡片组件，包含：
- 游戏标识符 (slug)
- 分类选择
- 尺寸设置（宽度、高度）
- 媒体链接（缩略图、横幅、嵌入URL、游戏源URL）
- 标签选择

### GameTranslationContent.tsx (子组件)
多语言内容卡片组件，包含：
- 多语言标签切换
- 文本字段（标题、描述、SEO字段、关键词）
- 富文本编辑器（控制方式、如何游玩、游戏详情、其他内容）

### GameMediaSection.tsx (子组件)
媒体内容组件，包含三个卡片：
- 游戏截图管理
- 游戏视频管理
- FAQ 管理

## 游戏列表组件

### DeleteGameButton.tsx
删除游戏按钮组件

**使用方式：**
```tsx
<DeleteGameButton gameId={game.id} />
```

### ToggleGameStatus.tsx
切换游戏状态（发布/草稿）按钮组件

**使用方式：**
```tsx
<ToggleGameStatus gameId={game.id} currentStatus={game.status} />
```

## GamePix 导入组件

### GamePixBrowser.tsx
GamePix 游戏浏览器组件

### GamePixExtractButton.tsx
从 GamePix 提取游戏数据的按钮组件

### GamePixImportForm.tsx
GamePix 游戏导入表单组件

### GameImportConfirmDialog.tsx
游戏导入确认对话框组件

### SyncProgressDialog.tsx
同步进度显示对话框组件

## 导入方式

所有组件都可以通过 `index.tsx` 统一导出：

```tsx
// 导入 GameForm（推荐方式）
import { GameForm } from '@/components/admin/games'

// 导入多个组件
import {
  GameForm,
  DeleteGameButton,
  ToggleGameStatus
} from '@/components/admin/games'

// 导入 GamePix 相关组件
import {
  GamePixBrowser,
  GameImportConfirmDialog
} from '@/components/admin/games'

// 如果需要单独使用 GameForm 的子组件
import {
  GameBasicInfo,
  GameTranslationContent,
  GameMediaSection
} from '@/components/admin/games'
```

## 数据流说明

### GameForm 数据流

**保存流程：**
```
表单数据
  ├─ 英文内容 → Game 主表字段
  │   └─ title, description, metaTitle, metaDescription, keywords
  │
  ├─ 其他语言 → GameTranslation 表
  │   ├─ 基本字段: title, description, metaTitle, metaDescription, keywords
  │   └─ translationInfo JSON: longDescription, controls, howToPlay, gameDetails, extras
  │
  ├─ 宽高 → dimensions JSON
  │   └─ width, height, aspectRatio, orientation
  │
  ├─ 媒体 → 主表数组字段
  │   ├─ screenshots[]
  │   └─ videos[]
  │
  └─ FAQ → gameInfo JSON
      └─ faq: [{question, answer}]
```

**加载流程（编辑模式）：**
```
数据库数据
  ├─ Game 主表 → 英文翻译表单
  ├─ GameTranslation 表 → 对应语言表单
  ├─ dimensions JSON → 宽高字段
  ├─ screenshots/videos → 媒体列表
  └─ gameInfo JSON → FAQ 列表
```

## 组件架构

GameForm 采用了模块化设计，将复杂的表单拆分为多个职责单一的子组件：

```
GameForm (主组件)
├── 数据管理
│   ├── 表单状态 (react-hook-form)
│   ├── 数据加载 (useEffect)
│   └── 数据提交 (onSubmit)
│
└── 渲染子组件
    ├── GameBasicInfo (基本信息)
    ├── GameTranslationContent (多语言内容)
    └── GameMediaSection (媒体内容)
```

**优势：**
- 代码更易维护
- 组件职责单一
- 可复用性强
- 便于测试

## 注意事项

1. **所有组件都是客户端组件**：使用 `"use client"` 指令
2. **英文数据处理**：英文内容保存在主表字段中，不存储在 GameTranslation 表
3. **富文本内容**：使用 TipTap 编辑器，内容存储在 `translationInfo` JSON 字段
4. **必填字段**：标识符、分类、尺寸、缩略图、嵌入URL、游戏标题（每种语言）
5. **URL 验证**：所有 URL 字段都进行格式验证
6. **Slug 格式**：只允许小写字母、数字和连字符
7. **SSR 兼容性**：TipTap 编辑器已配置 `immediatelyRender: false` 以避免水合错误

## 相关文件

- **Actions**: [/app/(admin)/admin/games/actions.ts](/app/(admin)/admin/games/actions.ts)
- **页面**:
  - 列表页: [/app/(admin)/admin/games/page.tsx](/app/(admin)/admin/games/page.tsx)
  - 新建页: [/app/(admin)/admin/games/new/page.tsx](/app/(admin)/admin/games/new/page.tsx)
  - 编辑页: [/app/(admin)/admin/games/[id]/page.tsx](/app/(admin)/admin/games/[id]/page.tsx)
- **Schema**: [/prisma/schema.prisma](/prisma/schema.prisma) (Game, GameTranslation 模型)
- **RichTextEditor**: [/components/admin/RichTextEditor.tsx](/components/admin/RichTextEditor.tsx)

## 开发指南

### 添加新的表单字段

1. 在 `GameForm.tsx` 的 schema 中添加字段定义
2. 在相应的子组件中添加表单控件
3. 在 `onSubmit` 函数中处理新字段的数据转换
4. 在 `actions.ts` 中更新 API schema

### 添加新的子组件

1. 在 `GameForm/` 文件夹中创建新组件
2. 在 `GameForm/index.tsx` 中导出
3. 在 `GameForm.tsx` 中引入并使用
4. 在主 `index.tsx` 中导出（如需外部访问）

### 调试技巧

- 使用 React DevTools 查看表单状态
- 检查浏览器 Console 的验证错误
- 使用 `console.log(watch())` 查看实时表单数据
- 检查 Network 标签查看 API 请求和响应
