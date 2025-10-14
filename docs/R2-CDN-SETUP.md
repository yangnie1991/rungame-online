# Cloudflare R2 + CDN 配置指南

本文档详细说明如何配置 Cloudflare R2 对象存储和 CDN 加速,用于存储游戏分类图标、横幅等自定义图片。

## 为什么选择 R2 + CDN

- ✅ **零出口流量费用** - 不像 S3 按流量收费
- ✅ **全球 CDN 加速** - Cloudflare 全球网络
- ✅ **慷慨免费额度** - 10GB 存储 + 1000万次读取/月
- ✅ **自定义域名** - 专业的 CDN 地址
- ✅ **简单配置** - 无需 Workers,直接启用

## 费用说明

**免费额度** (每月):
- 存储: 10 GB
- Class A 操作 (写入): 100万次
- Class B 操作 (读取): 1000万次
- 出口流量: **完全免费**

**超出免费额度后**:
- 存储: $0.015/GB/月
- Class A: $4.50/百万次请求
- Class B: $0.36/百万次请求

**预估**: 对于中小型游戏平台,免费额度完全够用!

---

## 配置步骤

### 第一步: 创建 Cloudflare 账号

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 注册/登录账号 (免费)
3. 无需添加网站,直接使用 R2

### 第二步: 启用 R2

1. 进入 Cloudflare Dashboard
2. 左侧菜单选择 **R2 Object Storage**
3. 点击 **Purchase R2 Plan** (选择免费计划)
4. 确认并启用

### 第三步: 创建 R2 Bucket

1. 在 R2 页面点击 **Create bucket**
2. 填写 Bucket 名称: `rungame-assets`
3. 选择区域: **Automatic** (推荐,自动选择最优位置)
4. 点击 **Create bucket**

### 第四步: 启用公共访问 + CDN

#### 方式 A: 使用 r2.dev 域名 (最快)

1. 进入创建的 bucket: `rungame-assets`
2. 点击 **Settings** 标签
3. 找到 **Public Access** 区域
4. 点击 **Allow Access** 按钮
5. 确认启用

**完成!** 您会获得一个公共 CDN 地址:
```
https://pub-xxxxxxxxxxxxx.r2.dev
```

所有上传的文件自动通过 Cloudflare CDN 加速。

#### 方式 B: 使用自定义域名 (需要域名托管在 Cloudflare)

**⚠️ 重要限制**:
- 自定义域名功能**仅支持通过 Cloudflare DNS 管理的域名**
- 如果您的域名在其他服务商 (如阿里云、腾讯云),需要先将 DNS 迁移到 Cloudflare
- 或者使用方式 C (Cloudflare Workers 方案)

**前提条件**:
1. 域名的 Nameservers 必须指向 Cloudflare
2. 域名已添加到您的 Cloudflare 账户

**配置步骤**:

1. **将域名添加到 Cloudflare** (如果还未添加):
   - 访问 Cloudflare Dashboard
   - 点击 "Add a Site"
   - 输入您的域名 `yourdomain.com`
   - 选择免费计划
   - 按照指引将域名的 Nameservers 改为 Cloudflare 提供的地址

2. **等待 DNS 生效** (通常 24-48 小时)

3. **在 R2 中绑定自定义域名**:
   - 进入 R2 bucket 设置
   - 找到 **Custom Domains**
   - 点击 **Connect Domain**
   - 输入子域名: `cdn.yourdomain.com`
   - Cloudflare 会自动创建 DNS 记录

4. **验证完成** (通常立即生效)

**完成!** 您的 CDN 地址为:
```
https://cdn.yourdomain.com
```

**访问方式**:
```
https://cdn.yourdomain.com/images/category/action.png
https://cdn.yourdomain.com/images/banners/summer-2024.jpg
```

#### 方式 C: 使用 Cloudflare Workers + 任意域名 (推荐,域名不需迁移)

**适用场景**:
- ✅ 域名在其他服务商 (如阿里云、腾讯云、GoDaddy)
- ✅ 不想迁移 DNS 到 Cloudflare
- ✅ 需要自定义域名
- ✅ 需要额外功能 (图片变换、防盗链等)

**优点**:
- 完全免费 (Workers 免费额度: 10万次请求/天)
- 全球边缘加速
- 可扩展 (图片处理、缓存控制)

**配置步骤**:

1. **创建 Cloudflare Workers**:

访问 Cloudflare Dashboard → Workers & Pages → Create Application → Create Worker

使用以下代码:

```javascript
// R2 CDN Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // 移除开头的 /

    try {
      // 从 R2 获取对象
      const object = await env.R2_BUCKET.get(key);

      if (!object) {
        return new Response('File not found', { status: 404 });
      }

      // 返回文件,带正确的 headers
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('cache-control', 'public, max-age=31536000, immutable');

      // CORS 支持
      headers.set('access-control-allow-origin', '*');

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
```

点击 **Save and Deploy**

2. **绑定 R2 Bucket**:

在 Worker 设置中:
- Settings → Variables
- R2 Bucket Bindings
- Variable name: `R2_BUCKET`
- R2 bucket: 选择 `rungame-assets`
- 保存

3. **配置自定义域名**:

Workers → Triggers → Add Custom Domain
- 输入: `cdn.yourdomain.com`
- Cloudflare 会提供一个 CNAME 目标

4. **在您的 DNS 服务商添加 CNAME 记录**:

```
类型: CNAME
名称: cdn
目标: <worker-name>.<subdomain>.workers.dev (Cloudflare 提供)
TTL: 自动或 3600
```

例如:
```
类型: CNAME
名称: cdn
目标: rungame-cdn.abc123.workers.dev
```

5. **等待 DNS 传播** (5-30 分钟)

**完成!** 您的 CDN 地址为:
```
https://cdn.yourdomain.com
```

**访问测试**:
```bash
# 上传一张测试图片后
curl https://cdn.yourdomain.com/images/test.png
```

**扩展功能** (可选):

添加图片尺寸调整:
```javascript
// 支持 ?width=300 参数
const width = url.searchParams.get('width');
if (width && object.httpMetadata.contentType.startsWith('image/')) {
  // 使用 Cloudflare Image Resizing
  return fetch(request, {
    cf: { image: { width: parseInt(width) } }
  });
}
```

添加防盗链:
```javascript
const referer = request.headers.get('referer');
const allowedDomains = ['yourdomain.com', 'www.yourdomain.com'];
if (referer && !allowedDomains.some(d => referer.includes(d))) {
  return new Response('Forbidden', { status: 403 });
}
```

---

### 第五步: 创建 API 密钥

用于从 Next.js 应用上传文件到 R2。

1. 在 R2 页面,点击右上角 **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 配置权限:
   - **Token name**: `rungame-nextjs-upload`
   - **Permissions**:
     - ✅ Object Read & Write
   - **TTL**: 永不过期 (或根据需求设置)
   - **Specify bucket**: 选择 `rungame-assets` (限制只能访问此 bucket)
4. 点击 **Create API Token**

5. **保存以下信息** (只显示一次!):
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxx
   Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   Endpoint: https://<account_id>.r2.cloudflarestorage.com
   ```

6. 复制 **Account ID**:
   - 在 Cloudflare Dashboard 右侧边栏可以看到
   - 或者从 Endpoint URL 中提取

---

## 环境变量配置

### 1. 添加到 `.env` 文件

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID="你的 Account ID"
R2_ACCESS_KEY_ID="你的 Access Key ID"
R2_SECRET_ACCESS_KEY="你的 Secret Access Key"
R2_BUCKET_NAME="rungame-assets"

# R2 公共 CDN 地址 (根据您的选择填写其一)
# 方式 A: 使用 r2.dev 域名
R2_PUBLIC_URL="https://pub-xxxxxxxxxxxxx.r2.dev"

# 方式 B: 使用自定义域名 (推荐)
# R2_PUBLIC_URL="https://cdn.yourdomain.com"
```

### 2. 添加到 Vercel 环境变量

部署到 Vercel 时:

1. 进入 Vercel 项目 Settings
2. 选择 **Environment Variables**
3. 添加以下变量:
   ```
   R2_ACCOUNT_ID = xxx
   R2_ACCESS_KEY_ID = xxx
   R2_SECRET_ACCESS_KEY = xxx (标记为 Sensitive)
   R2_BUCKET_NAME = rungame-assets
   R2_PUBLIC_URL = https://cdn.yourdomain.com
   ```

---

## 文件组织结构建议

```
rungame-assets/
├── images/
│   ├── categories/          # 分类图标
│   │   ├── action.png
│   │   ├── puzzle.png
│   │   └── sports.webp
│   ├── banners/            # 横幅/活动图
│   │   ├── home-hero.jpg
│   │   └── summer-event.png
│   ├── avatars/            # 用户头像 (未来扩展)
│   └── misc/               # 其他图片
└── assets/                  # 其他静态资源
    ├── fonts/
    └── videos/
```

**访问示例**:
```
https://cdn.yourdomain.com/images/categories/action.png
https://cdn.yourdomain.com/images/banners/home-hero.jpg
```

---

## 使用限制和优化建议

### 文件大小限制

- **单文件最大**: 5TB
- **推荐图片大小**:
  - 分类图标: < 100KB
  - 横幅图: < 500KB
  - 使用 WebP 格式可减少 30-50% 体积

### 缓存策略

Cloudflare CDN 自动缓存所有公共文件,默认:
- 静态资源缓存时间: 4小时
- 可通过上传时设置 `Cache-Control` 头部自定义

### 安全建议

1. **不要上传敏感文件** - R2 Public Bucket 是完全公开的
2. **使用只读 Token** - 如果只需要读取,创建只读权限的 API Token
3. **定期轮换密钥** - 每 90 天更换 API Token
4. **限制 CORS** - 在生产环境配置 CORS 规则

---

## 下一步

配置完成后,继续:

1. **安装依赖**: 查看项目 `package.json`,确保已安装 `@aws-sdk/client-s3`
2. **实现上传功能**: 使用 [lib/r2-upload.ts](../lib/r2-upload.ts) 工具函数
3. **创建 API 路由**: [app/api/upload/route.ts](../app/api/upload/route.ts)
4. **更新 Next.js 配置**: 在 [next.config.ts](../next.config.ts) 添加 R2 CDN 域名

---

## 故障排查

### 问题 1: 无法访问 r2.dev 域名

**症状**: `ERR_NAME_NOT_RESOLVED` 或 `403 Forbidden`

**解决方案**:
- 确认已启用 Public Access
- 检查文件路径是否正确
- 等待 DNS 传播 (最多 24 小时)

### 问题 2: 自定义域名无法验证

**症状**: Cloudflare 显示 "Domain verification failed"

**解决方案**:
- 确认 CNAME 记录已添加
- 使用 `dig cdn.yourdomain.com` 检查 DNS
- 等待 DNS 传播完成
- 确保 CNAME 目标地址正确

### 问题 3: 上传失败 (403 Forbidden)

**症状**: `AccessDenied: Access Denied`

**解决方案**:
- 检查 API Token 权限是否包含 Write
- 确认 Token 是否指定了正确的 Bucket
- 验证 Access Key ID 和 Secret Access Key 是否正确

### 问题 4: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 在 R2 Bucket Settings 中配置 CORS:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

---

## 监控和分析

### 查看使用量

1. 进入 R2 Dashboard
2. 选择 bucket
3. 查看 **Metrics** 标签

可以看到:
- 存储容量使用
- 请求次数统计
- 流量统计

### 设置使用警报

1. R2 Overview 页面
2. 点击 **Usage Alerts**
3. 设置阈值 (如存储超过 8GB 时提醒)

---

## 成本优化建议

1. **使用 WebP 格式** - 减少存储和传输成本
2. **启用压缩** - 上传前压缩图片
3. **删除未使用文件** - 定期清理
4. **设置生命周期策略** - 自动删除过期文件 (R2 即将支持)

---

## 相关文档

- [Cloudflare R2 官方文档](https://developers.cloudflare.com/r2/)
- [R2 定价说明](https://developers.cloudflare.com/r2/pricing/)
- [项目环境变量配置](./ENVIRONMENT.md)
- [部署指南](./DEPLOYMENT.md)

---

**最后更新**: 2025-01-14
