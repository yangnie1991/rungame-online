# Cloudflare R2 + CDN 部署总结

本文档总结了 Cloudflare R2 对象存储 + CDN 加速的完整配置方案。

## 方案概述

### 为什么选择 R2 + CDN

- ✅ **零出口流量费用** - 不像 AWS S3 按流量收费
- ✅ **全球 CDN 加速** - Cloudflare 全球网络
- ✅ **慷慨免费额度** - 10GB 存储 + 1000万次读取/月
- ✅ **自定义域名** - 专业的 CDN 地址
- ✅ **简单配置** - 直接启用 Public Access,无需 Workers

### 成本预估

**免费额度** (完全够用):
- 存储: 10 GB/月
- 读取: 1000万次/月
- 出口流量: **完全免费**

**预估**: 对于中小型游戏平台,免费额度可支持数千日活用户。

---

## 已完成的配置

### 1. 项目文件结构

```
rungame-nextjs/
├── lib/
│   └── r2-upload.ts                 # R2 上传工具函数
├── app/
│   └── api/
│       └── upload/
│           └── route.ts             # 图片上传 API
├── docs/
│   ├── R2-CDN-SETUP.md             # Cloudflare 配置步骤
│   ├── R2-USAGE-EXAMPLE.md         # 使用示例和代码
│   ├── R2-DEPLOYMENT-SUMMARY.md    # 本文档
│   └── ENVIRONMENT.md              # 已更新环境变量说明
├── next.config.ts                  # 已添加 R2 域名配置
└── .env.example                    # 环境变量模板
```

### 2. 核心功能

**已实现**:
- ✅ R2 上传工具函数 ([lib/r2-upload.ts](../lib/r2-upload.ts))
- ✅ 图片上传 API ([app/api/upload/route.ts](../app/api/upload/route.ts))
- ✅ 文件类型验证 (JPEG, PNG, WebP, GIF)
- ✅ 文件大小验证 (最大 5MB)
- ✅ 唯一文件名生成
- ✅ 管理员权限验证
- ✅ 自动 CDN 加速

**功能特性**:
- 支持多种上传类型: `category`, `banner`, `avatar`, `misc`
- 自动文件夹组织: `images/categories/`, `images/banners/` 等
- 自动缓存控制: 1年缓存 (immutable)
- 上传元数据: 原始文件名、上传者、时间戳

### 3. 依赖包

已安装:
```json
{
  "@aws-sdk/client-s3": "^3.x" // R2 兼容 S3 API
}
```

---

## 部署步骤

### 第一步: 配置 Cloudflare R2

详细步骤见 [R2-CDN-SETUP.md](./R2-CDN-SETUP.md)

**快速步骤**:
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 启用 R2 → 创建 Bucket: `rungame-assets`
3. 启用 Public Access (获得 `pub-xxx.r2.dev` 域名)
4. **可选**: 绑定自定义域名 `cdn.yourdomain.com`
5. 创建 API Token (Read & Write 权限)

### 第二步: 配置环境变量

在 `.env` 文件中添加:

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID="你的 Account ID"
R2_ACCESS_KEY_ID="你的 Access Key ID"
R2_SECRET_ACCESS_KEY="你的 Secret Access Key"
R2_BUCKET_NAME="rungame-assets"
R2_PUBLIC_URL="https://pub-xxxxxxxxxxxxx.r2.dev"  # 或自定义域名
```

**获取方式**:
- Account ID: Cloudflare Dashboard 右侧边栏
- Access Key ID & Secret: R2 → Manage R2 API Tokens → Create API Token

### 第三步: 部署到 Vercel

1. **推送代码到 Git**:
   ```bash
   git add .
   git commit -m "feat: 添加 Cloudflare R2 图片上传功能"
   git push
   ```

2. **在 Vercel 配置环境变量**:
   - 进入 Vercel 项目 Settings → Environment Variables
   - 添加所有 R2 环境变量 (复制自 `.env`)
   - 标记 `R2_SECRET_ACCESS_KEY` 为 Sensitive

3. **重新部署**:
   - Vercel 自动部署,或手动触发

### 第四步: 更新 Next.js 配置 (如使用自定义域名)

编辑 [next.config.ts](../next.config.ts):

```typescript
images: {
  remotePatterns: [
    // ... 其他配置
    {
      protocol: "https",
      hostname: "cdn.yourdomain.com", // 取消注释并替换域名
    },
  ],
}
```

重新部署:
```bash
git commit -am "chore: 更新 R2 自定义域名配置"
git push
```

---

## 使用指南

### API 使用

**上传图片**:
```typescript
const formData = new FormData()
formData.append("file", fileInput.files[0])
formData.append("type", "category") // category | banner | avatar | misc

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
})

const result = await response.json()
console.log("图片 URL:", result.data.url)
```

**在表单中使用**:
```typescript
import { ImageUploaderWithPreview } from "@/components/admin/ImageUploaderWithPreview"

<ImageUploaderWithPreview
  uploadType="category"
  onUploadSuccess={(url) => {
    // 将 URL 保存到数据库
    form.setValue("iconUrl", url)
  }}
/>
```

详细示例见 [R2-USAGE-EXAMPLE.md](./R2-USAGE-EXAMPLE.md)

---

## CDN 加速方案

### 方案 A: r2.dev 公共域名 (已配置)

**特点**:
- ✅ 零配置,自动 CDN
- ✅ 完全免费
- ❌ 域名不可自定义

**访问方式**:
```
https://pub-xxxxxxxxxxxxx.r2.dev/images/categories/icon.png
```

### 方案 B: 自定义域名 (推荐)

**特点**:
- ✅ 专业域名 (如 `cdn.yourdomain.com`)
- ✅ 全球 CDN 加速
- ✅ 完全免费

**配置步骤**:
1. Cloudflare R2 → Bucket Settings → Custom Domains → Connect Domain
2. 输入: `cdn.yourdomain.com`
3. 在您的 DNS 服务商添加 CNAME 记录:
   ```
   类型: CNAME
   名称: cdn
   目标: xxxxx.r2.cloudflarestorage.com (Cloudflare 提供)
   ```
4. 等待验证完成 (5-30分钟)

**访问方式**:
```
https://cdn.yourdomain.com/images/categories/icon.png
```

---

## 文件组织规范

### 推荐结构

```
rungame-assets/  (Bucket)
├── images/
│   ├── categories/          # 分类图标
│   │   ├── 1705234567890-abc123-action.png
│   │   └── 1705234567890-def456-puzzle.webp
│   ├── banners/            # 横幅/活动图
│   │   ├── 1705234567890-home-hero.jpg
│   │   └── 1705234567890-summer-event.png
│   ├── avatars/            # 用户头像 (未来扩展)
│   └── misc/               # 其他图片
└── assets/                  # 其他资源 (字体、视频等)
```

### 文件命名规则

格式: `{timestamp}-{random}-{safe-name}.{ext}`

示例:
- `1705234567890-abc123-icon.png`
- `1705234567890-def456-banner.jpg`

**优点**:
- 避免文件名冲突
- 可排序 (按时间)
- URL 友好

---

## 性能优化

### 1. 图片格式建议

- **分类图标**: WebP (最优), PNG (透明背景)
- **横幅**: WebP (最优), JPEG (照片)
- **大小**: 尽量 < 100KB

### 2. 缓存策略

已配置 1年缓存:
```typescript
cacheControl: 'public, max-age=31536000, immutable'
```

**效果**:
- 首次访问后,浏览器缓存1年
- 减少 R2 读取次数
- 加快页面加载速度

### 3. Next.js Image 优化

使用 Next.js Image 组件自动优化:
```typescript
import Image from "next/image"

<Image
  src="https://cdn.yourdomain.com/images/categories/icon.png"
  alt="分类图标"
  width={100}
  height={100}
/>
```

**自动优化**:
- WebP 转换
- 响应式图片
- 懒加载

---

## 安全建议

### 1. 访问控制

- ✅ 上传需要管理员身份验证
- ✅ API Token 仅授予必要权限 (Read & Write)
- ✅ 限制文件类型和大小

### 2. 密钥管理

- ❌ 不要提交 `.env` 到 Git
- ✅ 使用 `.env.example` 作为模板
- ✅ 在 Vercel 中标记 Secret 为 Sensitive
- ✅ 定期轮换 API Token (建议90天)

### 3. 内容安全

- ⚠️ R2 Public Bucket 是完全公开的
- ❌ 不要上传敏感文件
- ✅ 只上传可公开访问的图片

---

## 监控和维护

### 1. 查看使用量

Cloudflare Dashboard → R2 → Bucket → Metrics

可查看:
- 存储容量
- 请求次数
- 流量统计

### 2. 设置告警

R2 Overview → Usage Alerts

建议设置:
- 存储使用 > 8GB (80% 免费额度)
- 读取次数 > 800万次/月 (80% 免费额度)

### 3. 日志

上传日志自动记录在服务器:
```bash
# 查看 Vercel 日志
vercel logs your-app-name
```

---

## 故障排查

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| "R2 未配置" | 环境变量未设置 | 检查 `.env` 和 Vercel 环境变量 |
| "未授权" | 未登录或权限不足 | 使用管理员账户登录 |
| 图片无法显示 | Public Access 未启用 | R2 Settings → 启用 Public Access |
| CORS 错误 | 跨域配置问题 | 在 R2 中配置 CORS 规则 |
| 上传失败 403 | API Token 权限不足 | 确保 Token 有 Write 权限 |

详细故障排查见 [R2-CDN-SETUP.md](./R2-CDN-SETUP.md#故障排查)

---

## 扩展建议

### 未来可添加的功能

1. **图片编辑**:
   - 使用 Cloudflare Image Resizing
   - 自动生成缩略图
   - 水印功能

2. **批量上传**:
   - 支持拖拽多文件上传
   - 进度条显示

3. **图片管理**:
   - 图片库管理页面
   - 删除已上传图片
   - 图片搜索和筛选

4. **CDN 优化**:
   - 使用 Cloudflare Workers 添加图片变换
   - 自动 WebP 转换
   - 响应式图片

---

## 相关文档

- [Cloudflare R2 配置步骤](./R2-CDN-SETUP.md) - 详细的 Cloudflare 操作指南
- [使用示例和代码](./R2-USAGE-EXAMPLE.md) - 前端和后端代码示例
- [环境变量配置](./ENVIRONMENT.md) - 完整环境变量说明
- [部署指南](./DEPLOYMENT.md) - Vercel 部署流程

---

## 技术支持

遇到问题?

1. 查看 [故障排查](#故障排查) 章节
2. 阅读 [Cloudflare R2 官方文档](https://developers.cloudflare.com/r2/)
3. 提交 GitHub Issue
4. 联系开发团队

---

**最后更新**: 2025-01-14
**配置状态**: ✅ 已完成,可立即部署
