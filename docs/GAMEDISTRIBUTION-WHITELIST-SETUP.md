# GameDistribution 域名白名单配置指南

本文档详细说明如何在 GameDistribution 开发者后台配置域名白名单。

## 为什么需要域名白名单？

GameDistribution 为了保护游戏内容和防止未授权使用，要求所有嵌入游戏的网站都必须在其后台注册域名白名单。未在白名单中的域名会显示错误提示：

```
Game is not available here.
If you want to play [Game Name], Click here to Play
```

## 配置步骤

### 1. 访问 GameDistribution 开发者平台

访问：**[https://gamedistribution.com/](https://gamedistribution.com/)**

### 2. 登录开发者账户

- 如果已有账户，使用邮箱和密码登录
- 如果是新用户，点击 **Sign Up** 注册账户

### 3. 进入开发者控制台

登录后，在导航栏中找到：
- **Dashboard** (仪表板)
- **Developer** (开发者)
- **Settings** (设置)

### 4. 找到域名白名单设置

在开发者控制台中，查找以下选项之一：

**路径 A: SDK 设置**
```
Developer Console → SDK Settings → Allowed Domains
```

**路径 B: 网站设置**
```
Settings → Websites → Add Website
```

**路径 C: 游戏设置**
```
Games → [Your Game] → Settings → Allowed Domains
```

### 5. 添加域名到白名单

在域名输入框中添加您的网站域名：

#### 生产环境域名

```
https://rungame.online
https://www.rungame.online
```

#### Vercel 预览域名（可选）

如果您使用 Vercel 部署，可以添加预览域名用于测试：

```
https://your-project.vercel.app
https://your-project-git-dev.vercel.app
https://your-project-git-main.vercel.app
```

#### 自定义域名

如果您有自己的域名：

```
https://yourdomain.com
https://www.yourdomain.com
```

### 6. 保存设置

点击 **Save** 或 **Add Domain** 保存配置。

### 7. 验证配置

通常需要等待 5-15 分钟让配置生效。之后访问您的网站测试游戏是否能正常加载。

## 域名格式要求

### ✅ 正确格式

```
https://rungame.online
https://www.rungame.online
https://subdomain.yourdomain.com
https://your-project.vercel.app
```

### ❌ 错误格式

```
❌ http://rungame.online              # 必须使用 HTTPS
❌ rungame.online                      # 缺少协议
❌ https://rungame.online:3000         # 不需要端口号
❌ https://rungame.online/games        # 不需要路径
❌ localhost:3000                      # 不支持 localhost
❌ 127.0.0.1                           # 不支持 IP 地址
```

### 关键要点

1. **必须使用 HTTPS**：HTTP 协议不被接受
2. **只需域名**：不包含路径、端口号或查询参数
3. **包含协议**：必须以 `https://` 开头
4. **www 和非 www**：建议同时添加两个版本
5. **不支持通配符**：每个域名都需要单独添加

## 本地开发解决方案

GameDistribution **不支持** localhost 和本地 IP 地址。本地开发时可以使用以下方法：

### 方法 1: 使用 ngrok（推荐）

ngrok 可以创建一个公网 HTTPS URL，映射到本地开发服务器。

#### 安装 ngrok

```bash
# macOS (使用 Homebrew)
brew install ngrok

# 或下载: https://ngrok.com/download
```

#### 使用 ngrok

```bash
# 终端 1: 启动开发服务器
npm run dev

# 终端 2: 启动 ngrok
ngrok http 3000
```

ngrok 会提供一个 HTTPS URL，例如：
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

#### 添加 ngrok URL 到白名单

将 ngrok 提供的 HTTPS URL 添加到 GameDistribution 白名单：
```
https://abc123.ngrok.io
```

**注意**：
- 免费版 ngrok URL 每次重启都会改变
- 需要在 GameDistribution 后台更新白名单
- 或者使用 ngrok 付费版获得固定域名

### 方法 2: 使用本地域名映射

编辑系统 hosts 文件，将本地域名映射到 127.0.0.1：

#### macOS/Linux

```bash
sudo nano /etc/hosts
```

添加：
```
127.0.0.1 dev.rungame.local
```

保存后，访问 `http://dev.rungame.local:3000`

**限制**：
- 仍然使用 HTTP，GameDistribution 可能不接受
- 需要配置本地 SSL 证书才能使用 HTTPS

### 方法 3: 使用 Vercel 预览部署（最推荐）

每次推送代码到 GitHub，Vercel 会自动创建预览部署。

#### 步骤

1. 推送代码到 GitHub
   ```bash
   git push origin dev
   ```

2. Vercel 自动部署后，获取预览 URL
   ```
   https://your-project-git-dev.vercel.app
   ```

3. 将预览 URL 添加到 GameDistribution 白名单

4. 使用预览 URL 进行开发和测试

**优点**：
- ✅ 自动 HTTPS
- ✅ 固定的 URL（分支级别）
- ✅ 接近生产环境
- ✅ 无需额外工具

## 多域名管理

如果您有多个域名或环境，建议添加所有可能使用的域名：

```
生产环境:
https://rungame.online
https://www.rungame.online

预发布环境:
https://staging.rungame.online

Vercel 部署:
https://rungame-nextjs.vercel.app
https://rungame-nextjs-git-dev.vercel.app
https://rungame-nextjs-git-main.vercel.app

开发测试:
https://your-ngrok-url.ngrok.io (临时)
```

## 常见问题

### Q: 添加域名后游戏仍然无法加载？

A: 检查以下几点：
1. 等待 5-15 分钟让配置生效
2. 确认域名格式正确（包含 https://）
3. 清除浏览器缓存
4. 检查浏览器控制台是否有其他错误
5. 确认 iframe sandbox 权限正确配置

### Q: 需要为每个游戏单独配置吗？

A: 这取决于 GameDistribution 的账户类型：
- **开发者账户**：通常在账户级别配置，对所有游戏生效
- **发布商账户**：可能需要为每个游戏单独配置

### Q: 可以使用通配符吗？

A: 大多数情况下不支持通配符（如 `*.rungame.online`）。需要逐个添加子域名。

### Q: 需要同时添加 www 和非 www 版本吗？

A: 是的，建议同时添加：
```
https://rungame.online
https://www.rungame.online
```

### Q: localhost 为什么不能用？

A: GameDistribution 出于安全和版权保护考虑，不允许在本地环境加载游戏。必须使用：
- 公网域名
- ngrok 等内网穿透工具
- Vercel 预览部署

## 验证白名单配置

配置完成后，可以通过以下方式验证：

### 1. 访问游戏页面

访问您网站上的游戏页面，例如：
```
https://rungame.online/games/play/red-hide-ball
```

### 2. 检查游戏加载

- ✅ **成功**：游戏正常显示并可以玩
- ❌ **失败**：显示 "not available here" 错误

### 3. 查看浏览器控制台

打开开发者工具（F12），查看 Console 标签：
- 检查是否有跨域错误（CORS）
- 检查是否有加载失败的资源

### 4. 测试不同页面

测试多个游戏页面，确保配置对所有游戏生效。

## 安全注意事项

### iframe sandbox 配置

确保您的 iframe 配置了适当的 sandbox 权限：

```tsx
<iframe
  src={gameUrl}
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-orientation-lock allow-modals allow-presentation allow-storage-access-by-user-activation"
  allow="accelerometer; gyroscope; fullscreen"
  referrerPolicy="strict-origin-when-cross-origin"
/>
```

详见：[docs/GAMEDISTRIBUTION-EMBED-ISSUE.md](./GAMEDISTRIBUTION-EMBED-ISSUE.md)

### CSP (Content Security Policy)

如果网站使用了 CSP，需要允许 GameDistribution 域名：

```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://html5.gamedistribution.com;
  frame-src 'self' https://html5.gamedistribution.com;
  img-src 'self' blob: data: https://html5.gamedistribution.com;
  connect-src 'self' https://html5.gamedistribution.com;
`
```

## 相关资源

- [GameDistribution 官方网站](https://gamedistribution.com/)
- [GameDistribution SDK 文档](https://docs.gamedistribution.com/)
- [GameDistribution 开发者论坛](https://forum.gamedistribution.com/)
- [本项目 iframe 配置文档](./GAMEDISTRIBUTION-EMBED-ISSUE.md)

## 联系支持

如果配置后仍有问题，可以联系 GameDistribution 支持：

- **Email**: support@gamedistribution.com
- **开发者论坛**: https://forum.gamedistribution.com/
- **Discord**: [GameDistribution Community](https://discord.gg/gamedistribution)

---

**最后更新**: 2025-10-15
**文档版本**: 1.0
