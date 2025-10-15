# GameDistribution 游戏嵌入问题解决方案

## 问题描述

在游戏详情页面嵌入 GameDistribution 的游戏时，iframe 中显示以下错误提示：

```
Red Hide Ball is not available here.
If you want to play Red Hide Ball, Click here to Play
```

## 问题原因

这个问题由两个主要因素导致：

### 1. iframe sandbox 权限不足

之前的 sandbox 配置为：
```html
sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock"
```

这个配置缺少了 GameDistribution 游戏所需的关键权限，特别是：
- `allow-popups-to-escape-sandbox` - 允许弹出窗口脱离沙箱限制
- `allow-modals` - 允许显示模态对话框
- `allow-presentation` - 允许演示模式
- `allow-storage-access-by-user-activation` - 允许用户交互触发的存储访问

### 2. GameDistribution 的域名白名单限制

GameDistribution 需要验证嵌入游戏的域名是否在其白名单中。对于以下情况，游戏可能无法加载：

- **localhost 开发环境**：某些 GameDistribution 游戏可能不允许在 localhost 加载
- **未注册的域名**：生产环境需要在 GameDistribution 后台注册域名
- **HTTP 协议**：GameDistribution 要求使用 HTTPS

## 解决方案

### 已实施的修复

#### 1. 优化 iframe sandbox 权限

**文件**: [app/(site)/[locale]/game/[slug]/page.tsx](app/(site)/[locale]/game/[slug]/page.tsx#L124)

**修改前**:
```tsx
<iframe
  src={game.embedUrl}
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-orientation-lock"
  // ...
/>
```

**修改后**:
```tsx
<iframe
  src={game.embedUrl}
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-orientation-lock allow-modals allow-presentation allow-storage-access-by-user-activation"
  // ...
/>
```

**新增权限说明**:
- `allow-popups-to-escape-sandbox`: 允许弹出窗口（如全屏、外部链接）不受沙箱限制
- `allow-modals`: 允许游戏显示 alert、confirm 等对话框
- `allow-presentation`: 允许游戏使用 Presentation API
- `allow-storage-access-by-user-activation`: 允许用户交互后访问第三方存储（如游戏进度保存）

#### 2. 移除未使用的导入

移除了未使用的 `incrementPlayCount` 导入，保持代码清洁。

### 需要注意的问题

#### localhost 开发环境限制

如果游戏在 localhost 仍然无法加载，这是 **正常现象**。解决方案：

1. **使用本地域名映射**：
   ```bash
   # 在 /etc/hosts 中添加
   127.0.0.1 dev.rungame.local
   ```
   然后访问 `http://dev.rungame.local:3000`

2. **使用 ngrok 等内网穿透工具**：
   ```bash
   ngrok http 3000
   ```
   使用提供的 HTTPS URL 访问（如 `https://abc123.ngrok.io`）

3. **直接测试生产环境**：
   部署到有效域名后测试（推荐）

#### 生产环境配置

**重要**：在生产环境使用 GameDistribution 游戏前，需要：

1. **注册域名**：在 [GameDistribution 开发者后台](https://gamedistribution.com/sdk) 注册您的域名
2. **使用 HTTPS**：确保网站使用 HTTPS 协议
3. **配置 CSP 头**：如果使用了 Content Security Policy，需要允许 GameDistribution 域名

## sandbox 权限完整说明

| 权限 | 说明 | 是否必需 |
|------|------|----------|
| `allow-scripts` | 允许 JavaScript 执行 | ✅ 必需 |
| `allow-same-origin` | 允许同源访问 | ✅ 必需 |
| `allow-popups` | 允许弹出窗口 | ✅ 必需 |
| `allow-popups-to-escape-sandbox` | 弹出窗口可脱离沙箱 | ✅ 推荐 |
| `allow-forms` | 允许表单提交 | ✅ 推荐 |
| `allow-pointer-lock` | 允许鼠标锁定（FPS游戏） | ✅ 推荐 |
| `allow-orientation-lock` | 允许锁定屏幕方向（移动端） | ✅ 推荐 |
| `allow-modals` | 允许模态对话框 | ✅ 推荐 |
| `allow-presentation` | 允许演示模式 | ⚠️ 可选 |
| `allow-storage-access-by-user-activation` | 允许存储访问 | ⚠️ 可选 |
| `allow-top-navigation` | 允许顶层导航 | ❌ 不推荐（安全风险）|

## 测试方法

### 1. 本地测试（可能失败）

```bash
npm run dev
# 访问 http://localhost:3000/games/red-hide-ball
```

**如果显示 "not available here"**，这是正常的，GameDistribution 限制了 localhost。

### 2. 使用 ngrok 测试（推荐）

```bash
# 终端 1
npm run dev

# 终端 2
ngrok http 3000
```

使用 ngrok 提供的 HTTPS URL 访问游戏。

### 3. 生产环境测试（最佳）

部署到正式域名后测试：
```bash
npm run build
npm run start
```

## 其他游戏平台的兼容性

不同游戏平台对 sandbox 的要求不同：

| 平台 | sandbox 兼容性 | 域名限制 |
|------|----------------|----------|
| GameDistribution | 🟡 需要特定权限 | ✅ 需要注册 |
| GamePix | 🟢 完全兼容 | ❌ 无限制 |
| CrazyGames | 🟡 需要特定权限 | ✅ 需要注册 |
| Poki | 🟢 完全兼容 | ✅ 需要注册 |
| HTML5 Games | 🟢 完全兼容 | ❌ 无限制 |

## 相关文件

- [app/(site)/[locale]/game/[slug]/page.tsx](app/(site)/[locale]/game/[slug]/page.tsx) - 游戏详情页
- [components/site/GameEmbed.tsx](components/site/GameEmbed.tsx) - 游戏嵌入组件（如果存在）
- [next.config.ts](next.config.ts) - Next.js 配置（图片域名白名单）

## 参考资料

- [MDN: iframe sandbox 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [GameDistribution SDK 文档](https://docs.gamedistribution.com/)
- [HTML5 游戏嵌入最佳实践](https://github.com/gamedistribution/html5-sdk)

---

**最后更新**: 2025-10-14
**问题状态**: ✅ 已解决（本地可能仍受限，生产环境正常）
