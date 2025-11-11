# Google Search Console API 故障排查指南

## 问题：检查链接失败

如果你在管理后台检查 URL 收录状态时失败，请按照以下步骤进行排查。

---

## 1. 检查 siteUrl 配置

### 问题描述
`siteUrl` 必须与 Google Search Console 中验证的属性**完全匹配**，包括：
- 协议（http/https）
- 子域名（www/非www）
- 结尾斜杠

### 解决方法

#### 步骤 1：查看你在 Search Console 中的属性

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 查看左上角的属性选择器
3. 记录准确的属性格式

**两种常见属性类型**：

**A. URL 前缀属性** (推荐用于 API)
```
✅ 正确格式示例：
https://www.rungame.online/
https://rungame.online/

⚠️ 注意：
- 必须包含协议（https://）
- 必须包含结尾斜杠（/）
- 必须与 Search Console 中完全一致
```

**B. 域名属性**
```
✅ 正确格式：
sc-domain:rungame.online

⚠️ 注意：
- 必须以 sc-domain: 开头
- 不能有 www 或协议
```

#### 步骤 2：在管理后台更新 siteUrl

1. 访问：http://localhost:3000/admin/seo-submissions/google
2. 找到 "Site URL (Search Console 属性)" 配置
3. 填写**完全匹配**的 URL（复制粘贴从 Search Console 中）
4. 点击"保存配置"

**示例配置**：
```
如果 Search Console 中显示：
  https://www.rungame.online/

则填写：
  https://www.rungame.online/  （注意结尾的 /）
```

---

## 2. 检查 Access Token 是否有效

### 问题描述
OAuth Access Token 可能已过期或无效。

### 解决方法

#### 步骤 1：重新授权

1. 访问：http://localhost:3000/admin/seo-submissions/google
2. 点击 "一键授权 Google" 按钮
3. 在弹出的 Google 授权页面中登录
4. **重要**：使用有 Search Console 访问权限的 Google 账号
5. 授权完成后会自动跳转回管理后台

#### 步骤 2：确认授权账号权限

确保授权的 Google 账号：
- 是网站在 Search Console 中的**所有者**或**完全权限用户**
- 不能只是"受限访问"用户

查看权限：
1. 访问 [Search Console](https://search.google.com/search-console)
2. 选择你的属性
3. 左侧菜单 → 设置 → 用户和权限
4. 确认你的账号是"所有者"

---

## 3. 确认 Search Console API 已启用

### 问题描述
Google Cloud Console 项目中可能未启用 Search Console API。

### 解决方法

1. 访问 [Google Cloud Console - API 库](https://console.cloud.google.com/apis/library)
2. 搜索 "Google Search Console API"
3. 点击进入，确认显示"已启用"（而不是"启用"按钮）
4. 如果未启用，点击"启用"按钮

---

## 4. 检查 OAuth 作用域（Scope）

### 问题描述
OAuth 授权时没有请求正确的权限范围。

### 当前配置

OAuth 授权请求的 scope：
```
https://www.googleapis.com/auth/webmasters.readonly
```

这是正确的 scope，提供 Search Console 的只读访问权限。

### 验证方法

查看服务器日志中的授权 URL，应该包含：
```
scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters.readonly
```

---

## 5. 查看详细错误日志

### 获取错误详情

代码已经添加了详细的日志输出。当检查收录失败时：

1. 打开终端（运行 `npm run dev` 的窗口）
2. 点击"检查收录"按钮
3. 查看日志输出，寻找以下信息：

```bash
# 请求日志
[Google Search Console API] 发送请求: {
  apiUrl: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
  inspectionUrl: 'https://www.rungame.online/...',
  siteUrl: 'https://www.rungame.online/',
  tokenPrefix: 'ya29.a0ARW5m...'
}

# 响应日志
[Google Search Console API] 响应状态: 403 Forbidden

# 错误日志（如果失败）
[Google Search Console API] 认证错误: {
  error: {
    code: 403,
    message: '...',
    status: 'PERMISSION_DENIED'
  }
}
```

### 常见错误码

#### 401 Unauthorized
- **原因**：Access Token 无效或已过期
- **解决**：重新授权（点击"一键授权 Google"）

#### 403 Forbidden
- **原因 1**：siteUrl 不匹配
  - **解决**：确认 siteUrl 与 Search Console 中完全一致
- **原因 2**：授权账号没有权限
  - **解决**：使用网站所有者账号重新授权
- **原因 3**：Search Console API 未启用
  - **解决**：在 Google Cloud Console 中启用 API

#### 404 Not Found
- **原因**：siteUrl 格式错误或该属性不存在
- **解决**：检查 Search Console 中是否存在该属性

#### 429 Too Many Requests
- **原因**：API 配额已用尽（每天 2000 次）
- **解决**：等待第二天，或系统会自动降级到简单搜索检查

---

## 6. 使用 API 测试功能

### 测试 Google API 配置

管理后台提供了 API 测试功能：

1. 访问：http://localhost:3000/admin/seo-submissions/google
2. 点击 "测试 Google API" 按钮
3. 查看测试结果

测试会验证：
- Access Token 是否有效
- siteUrl 是否正确
- 是否有权限访问 Search Console API

---

## 7. 完整检查清单

使用以下清单确认所有配置都正确：

- [ ] Google Cloud Console 中已创建 OAuth 2.0 Client ID
- [ ] 已添加回调 URL：
  - `http://localhost:3000/api/auth/google/callback`
  - `http://127.0.0.1:3000/api/auth/google/callback`
- [ ] 已在 Google Cloud Console 中启用 "Search Console API"
- [ ] 已在管理后台填写 Client ID 和 Client Secret
- [ ] 已点击"一键授权 Google"并完成授权
- [ ] 授权的 Google 账号是网站在 Search Console 中的所有者
- [ ] siteUrl 与 Search Console 中的属性**完全匹配**（包括协议和斜杠）
- [ ] 已在 Search Console 中验证网站所有权

---

## 8. 常见配置错误

### 错误 1：siteUrl 结尾少了斜杠

```bash
❌ 错误：https://www.rungame.online
✅ 正确：https://www.rungame.online/
```

### 错误 2：协议不匹配

```bash
❌ 错误：http://www.rungame.online/  （Search Console 中是 https）
✅ 正确：https://www.rungame.online/
```

### 错误 3：www 不匹配

```bash
❌ 错误：https://rungame.online/  （Search Console 中是 www.rungame.online）
✅ 正确：https://www.rungame.online/
```

### 错误 4：使用了错误的属性类型

```bash
# 如果 Search Console 中是域名属性
❌ 错误：https://www.rungame.online/
✅ 正确：sc-domain:rungame.online
```

---

## 9. 获取帮助

如果按照以上步骤仍然无法解决：

1. 查看服务器终端日志，复制完整的错误信息
2. 截图 Google Search Console 的属性设置页面
3. 检查你的 siteUrl 配置

---

## 附录：Search Console API 文档

官方文档：
- [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- [Search Console API 概览](https://developers.google.com/webmaster-tools/search-console-api-original/v3/)
- [OAuth 2.0 设置](https://developers.google.com/identity/protocols/oauth2)
