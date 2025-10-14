# 游戏嵌入跳转问题修复报告

## 问题描述

在游戏详情页，当用户点击 Play 按钮后，整个页面会跳转到其他网站，而不是在当前页面内嵌播放游戏。

## 问题分析

### 原因1: 错误的 Link 导入

游戏详情页面使用了错误的 Link 组件：

```typescript
// ❌ 错误 - 使用了 next/link
import Link from "next/link"

// ✅ 正确 - 应该使用国际化的 Link
import { Link } from "@/i18n/routing"
```

### 原因2: iframe 缺少安全限制

原始的 iframe 配置：

```tsx
<iframe
  src={game.embedUrl}
  className="w-full h-full border-0"
  allowFullScreen
  title={game.title}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
/>
```

**问题**:
- 没有 `sandbox` 属性
- iframe 内的 JavaScript 可以执行 `window.top.location = "..."` 跳转整个页面
- 游戏内的广告或链接可以劫持父页面

### 游戏 URL 结构

```
embedUrl: https://html5.gamedistribution.com/{game-id}/
gameUrl: https://gamedistribution.com/games/{game-name}/
```

## 解决方案

### 1. 修复 Link 导入

```typescript
// app/(site)/[locale]/game/[slug]/page.tsx
import { Link } from "@/i18n/routing"  // ✅ 正确的国际化 Link
```

### 2. 添加 iframe sandbox 属性

```tsx
<iframe
  src={game.embedUrl}
  className="w-full h-full border-0"
  allowFullScreen
  title={game.title}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock"
  loading="lazy"
/>
```

### Sandbox 权限说明

| 权限 | 说明 | 为什么需要 |
|------|------|-----------|
| `allow-scripts` | 允许执行 JavaScript | 游戏需要运行 JS 代码 |
| `allow-same-origin` | 允许同源访问 | 游戏需要访问自己的资源 |
| `allow-popups` | 允许弹出窗口 | 某些游戏功能需要 |
| `allow-forms` | 允许表单提交 | 游戏内可能有表单 |
| `allow-pointer-lock` | 允许指针锁定 | FPS/3D 游戏需要 |
| `allow-orientation-lock` | 允许屏幕方向锁定 | 移动游戏需要 |

**不包含的权限（重要）**:
- ❌ `allow-top-navigation` - **阻止跳转父页面**
- ❌ `allow-top-navigation-by-user-activation` - **阻止用户点击跳转**

## 效果对比

### 修复前
```
用户点击游戏 Play 按钮
  ↓
游戏内执行: window.top.location.href = "https://other-site.com"
  ↓
整个页面跳转 ❌
```

### 修复后
```
用户点击游戏 Play 按钮
  ↓
游戏内执行: window.top.location.href = "https://other-site.com"
  ↓
被 sandbox 阻止，游戏继续在 iframe 内运行 ✅
```

## 测试方法

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 访问游戏详情页
http://localhost:3000/game/math-runner
或
http://localhost:3000/zh/game/math-runner
```

### 2. 测试步骤

1. 打开游戏详情页
2. 点击游戏中的 Play 按钮
3. 验证页面**不会**跳转到其他网站
4. 验证游戏可以正常运行
5. 测试全屏功能
6. 测试游戏内的交互功能

### 3. 浏览器控制台检查

如果游戏尝试跳转，浏览器控制台会显示：

```
Blocked top-level navigation to 'https://example.com' because it's cross-origin and the iframe has the sandbox attribute without allow-top-navigation.
```

这说明 sandbox 配置生效了！

## 兼容性考虑

### 可能受影响的游戏功能

某些游戏可能需要额外的 sandbox 权限：

1. **需要访问摄像头/麦克风** - 添加 `allow-media-capture`
2. **需要全屏API** - 已包含在 `allow` 属性中
3. **需要下载文件** - 添加 `allow-downloads`

如果发现某个游戏功能不正常，可以逐步添加权限：

```tsx
sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock allow-downloads"
```

### 注意事项

⚠️ **永远不要添加这两个权限**（除非绝对必要）:
- `allow-top-navigation`
- `allow-top-navigation-by-user-activation`

这两个权限会允许 iframe 跳转父页面，破坏用户体验。

## 部署

修复已提交到 Git，推送后 Vercel 会自动部署：

```bash
git push origin main
```

## 相关文档

- [MDN: iframe sandbox 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
- [HTML5 游戏嵌入最佳实践](https://developers.google.com/web/fundamentals/security/sandboxed-iframes)
- [CSP 和 iframe 安全](https://content-security-policy.com/frame-src/)

## 总结

通过添加 `sandbox` 属性并配置适当的权限，我们成功：

✅ **阻止了页面跳转** - 游戏无法劫持父页面
✅ **保持游戏功能** - 所有必要的游戏功能正常工作  
✅ **提升用户体验** - 用户可以在当前页面内玩游戏
✅ **增强安全性** - 限制了 iframe 的权限范围

---

**最后更新**: 2025-01-14
**修复版本**: v1.2
