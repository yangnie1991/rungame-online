# shadcn/ui 使用说明

## 🎨 什么是 shadcn/ui？

shadcn/ui **不是传统的 npm 组件库**，而是一套**可复制、可定制的组件代码集合**。

### 与传统组件库的区别

| 特性 | 传统组件库（Ant Design） | shadcn/ui |
|------|------------------------|-----------|
| **安装方式** | `npm install antd` | `npx shadcn@latest add button` |
| **代码位置** | `node_modules/` | `你的项目/components/ui/` |
| **所有权** | ❌ 组件库拥有 | ✅ **你拥有代码** |
| **可定制性** | 🟡 有限（通过主题配置） | ✅ **完全可定制**（直接修改代码） |
| **更新影响** | ⚠️ 可能破坏现有代码 | ✅ 不受影响（代码在你的项目中） |
| **导入方式** | `import { Button } from 'antd'` | `import { Button } from '@/components/ui/button'` |

## 🏗️ shadcn/ui 的架构

```
shadcn/ui 组件 = 你的样式（Tailwind CSS）+ Radix UI 交互逻辑
```

### 核心组成

1. **Tailwind CSS** - 样式层（你完全控制）
2. **Radix UI Primitives** - 交互逻辑层（无样式的 headless UI）
3. **class-variance-authority (CVA)** - 样式变体管理
4. **clsx + tailwind-merge** - 类名合并

## 📦 依赖关系解释

### 为什么需要 Radix UI？

Radix UI 提供了：
- ✅ **可访问性**（WAI-ARIA 标准）
- ✅ **键盘导航**（Tab、Arrow Keys、Escape 等）
- ✅ **焦点管理**（Focus trap、Focus return）
- ✅ **复杂交互**（下拉菜单、对话框、选择器等）

### 示例：Dialog（对话框）组件

当你运行 `npx shadcn@latest add dialog` 时：

#### 1. 自动安装依赖
```bash
npm install @radix-ui/react-dialog
```

#### 2. 创建组件文件
```typescript
// components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ← Radix UI 提供交互逻辑
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// 你添加的样式（Tailwind CSS）
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80", // ← 你的样式
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))

// ... 更多组件
```

#### 3. 使用组件

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger>打开对话框</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>标题</DialogTitle>
          <DialogDescription>描述</DialogDescription>
        </DialogHeader>
        {/* 你的内容 */}
      </DialogContent>
    </Dialog>
  )
}
```

#### 4. Radix UI 自动处理

- ✅ 按 `Escape` 关闭对话框
- ✅ 点击遮罩层关闭
- ✅ 焦点锁定在对话框内
- ✅ 关闭后焦点返回触发按钮
- ✅ 屏幕阅读器支持

**你只需关注样式和内容，交互逻辑 Radix UI 已经处理好了！**

## 🎯 shadcn/ui 的优势

### 1. 完全的代码控制

```typescript
// 你可以直接修改 components/ui/button.tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

// 想改按钮圆角？直接改！
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md", // ← 改成 rounded-xl
  // ...
)
```

### 2. 按需添加

```bash
# 只添加你需要的组件
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form

# 不像传统库，你不会安装一堆用不到的组件
```

### 3. 无版本锁定

```bash
# 传统库：升级可能破坏代码
npm install antd@latest  # ⚠️ 可能有 breaking changes

# shadcn/ui：代码已经在你的项目中，永远不会变
# 想更新？手动复制新代码到你的项目（可选）
```

### 4. TypeScript 友好

```typescript
// 完整的类型推导
import { Button } from "@/components/ui/button"

<Button variant="destructive" size="lg">  // ← 自动补全和类型检查
  删除
</Button>
```

## 🔧 安装和使用流程

### 标准流程

```bash
# 1. 初始化 shadcn/ui（只需一次）
npx shadcn@latest init

# 回答配置问题：
# ✔ TypeScript? yes
# ✔ Style? Default
# ✔ Base color? Slate
# ✔ CSS file? app/globals.css
# ✔ CSS variables? yes
# ✔ Tailwind config? tailwind.config.ts
# ✔ Components alias? @/components
# ✔ Utils alias? @/lib/utils

# 2. 添加需要的组件
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add table

# 每个命令会：
# - 创建组件文件到 components/ui/
# - 自动安装需要的 @radix-ui/* 依赖
# - 更新 components.json 配置
```

### 一次性安装多个组件

```bash
npx shadcn@latest add button input label textarea select form card dialog dropdown-menu table toast tabs badge avatar separator alert
```

## 📚 shadcn/ui 组件列表

### 常用组件

| 组件 | 依赖 | 用途 |
|------|------|------|
| **Button** | `@radix-ui/react-slot` | 按钮 |
| **Input** | - | 输入框 |
| **Form** | `react-hook-form`, `@hookform/resolvers`, `zod` | 表单 |
| **Dialog** | `@radix-ui/react-dialog` | 对话框 |
| **Dropdown Menu** | `@radix-ui/react-dropdown-menu` | 下拉菜单 |
| **Select** | `@radix-ui/react-select` | 选择器 |
| **Table** | - | 表格 |
| **Toast** | `@radix-ui/react-toast` | 通知 |
| **Tabs** | `@radix-ui/react-tabs` | 标签页 |
| **Card** | - | 卡片 |
| **Badge** | - | 徽章 |
| **Avatar** | `@radix-ui/react-avatar` | 头像 |

### 查看所有可用组件

访问：https://ui.shadcn.com/docs/components

## 🎨 自定义主题

shadcn/ui 使用 CSS 变量实现主题：

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

修改这些变量即可改变整体主题！

## 🆚 vs 其他方案

### shadcn/ui vs Ant Design

**选择 Ant Design 如果**：
- 需要企业级成熟组件库
- 不想花时间自定义样式
- 需要中文生态支持

**选择 shadcn/ui 如果**：
- 需要完全的设计控制权
- 想要轻量级方案
- 喜欢 Tailwind CSS
- 需要代码级别的可定制性

### shadcn/ui vs Headless UI

**shadcn/ui** = **Headless UI**（Radix UI）+ **预设样式**（Tailwind）

如果你选择 Headless UI，你需要自己写所有样式。
如果你选择 shadcn/ui，你获得漂亮的默认样式，还能随时修改。

## 💡 最佳实践

### 1. 先使用默认样式

```typescript
// 先用默认的
import { Button } from "@/components/ui/button"

<Button>点击我</Button>
```

### 2. 需要时再定制

```typescript
// 直接修改 components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md", // ← 改成你想要的
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white", // ← 改成你的品牌色
        // ...
      },
    },
  }
)
```

### 3. 创建自己的变体

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        // ✨ 添加你自己的变体
        success: "bg-green-600 text-white hover:bg-green-700",
      },
    },
  }
)

// 使用
<Button variant="success">成功</Button>
```

### 4. 组合使用

```typescript
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"

// 组合多个 shadcn/ui 组件构建复杂 UI
```

## 🚀 RunGame 项目中的使用

在我们的项目中，shadcn/ui 用于：

### 管理后台
- ✅ 表单（分类、标签、游戏管理）
- ✅ 表格（数据列表）
- ✅ 对话框（确认删除）
- ✅ 下拉菜单（用户菜单）
- ✅ 通知（操作反馈）

### 用户端
- ✅ 卡片（游戏卡片）
- ✅ 按钮（CTA）
- ✅ 标签页（分类切换）
- ✅ 徽章（热门标签）

所有这些组件的代码都在你的项目中，完全可定制！

## 📖 更多资源

- **官方文档**: https://ui.shadcn.com/
- **组件浏览**: https://ui.shadcn.com/docs/components
- **主题定制**: https://ui.shadcn.com/themes
- **示例项目**: https://github.com/shadcn-ui/taxonomy

---

**总结**：shadcn/ui 让你拥有组件代码，给你完全的控制权，同时提供了漂亮的默认样式和强大的交互逻辑（Radix UI）。这是最灵活的组件方案！🎨
