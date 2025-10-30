# Cloudflare R2 存储配置指南

本文档提供 Cloudflare R2 对象存储服务的完整配置指南，用于存储游戏缩略图、分类图标、横幅等静态资源。

---

## 📋 目录

1. [为什么使用 R2](#为什么使用-r2)
2. [前置要求](#前置要求)
3. [创建 R2 Bucket](#创建-r2-bucket)
4. [生成 API Token](#生成-api-token)
5. [配置环境变量](#配置环境变量)
6. [测试上传功能](#测试上传功能)
7. [自定义域名配置](#自定义域名配置-可选)
8. [故障排除](#故障排除)

---

## 为什么使用 R2

### 优势

- ✅ **零出口费用** - 从 R2 获取数据完全免费
- ✅ **S3 兼容 API** - 无缝兼容 AWS S3 SDK
- ✅ **全球 CDN** - 自动通过 Cloudflare CDN 加速
- ✅ **价格优势** - 存储费用 $0.015/GB/月（远低于 S3）
- ✅ **简单易用** - 无需配置复杂的 bucket 策略

### 使用场景

本项目中，R2 用于存储：
- 🎮 游戏缩略图 (`images/misc/`)
- 🎨 分类图标 (`images/categories/`)
- 🖼️ 横幅图片 (`images/banners/`)
- 👤 用户头像 (`images/avatars/`)

---

## 前置要求

- Cloudflare 账户（免费注册：https://dash.cloudflare.com/sign-up）
- 已验证的支付方式（R2 需要绑定支付方式，但有免费额度）

### R2 免费额度

- **存储空间**: 10 GB/月
- **A 类操作** (写入): 100 万次/月
- **B 类操作** (读取): 1000 万次/月

对于中小型项目，免费额度通常足够使用。

---

## 创建 R2 Bucket

### 步骤 1: 进入 R2 控制台

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单中，点击 **R2**
3. 如果是第一次使用，点击 **Purchase R2 Plan**（不用担心，有免费额度）

### 步骤 2: 创建 Bucket

1. 点击 **Create bucket**
2. 填写 Bucket 配置：
   - **Bucket name**: `game-onilne` （您的 bucket 名称）
   - **Location**: 选择 **Automatic**（自动选择最佳位置）
3. 点击 **Create bucket**

### 步骤 3: 配置公开访问

R2 默认是私有的，需要配置公开访问：

1. 进入刚创建的 bucket
2. 点击 **Settings** 标签
3. 在 **Public access** 部分：
   - 启用 **Allow Access**
   - 会生成一个公开域名，格式为：`pub-{RANDOM_ID}.r2.dev`
   - 记录这个域名，稍后配置环境变量时会用到

---

## 生成 API Token

### 步骤 1: 创建 API Token

1. 在 R2 控制台，点击右上角的 **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 配置 Token：
   - **Token name**: `rungame-upload`（自定义名称）
   - **Permissions**:
     - ✅ **Object Read & Write** （读写权限）
   - **Bucket**: 选择 `game-onilne`（或你的 bucket 名称）
   - **TTL**: 选择 **Forever**（永不过期）或自定义过期时间
4. 点击 **Create API Token**

### 步骤 2: 保存凭据

创建成功后，会显示以下信息（**只显示一次，请妥善保存**）：

```
Access Key ID: abc123def456...
Secret Access Key: xyz789uvw012...
```

⚠️ **重要**: Secret Access Key 只会显示一次，请立即复制保存！

### 步骤 3: 获取 Account ID

1. 在 Cloudflare Dashboard 右侧，找到 **Account ID**
2. 或者从 S3 API 端点中提取（格式: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`）

示例：
- S3 端点: `https://850a4ffd2f94c4d6840b62b3aa0219ce.r2.cloudflarestorage.com`
- Account ID: `850a4ffd2f94c4d6840b62b3aa0219ce`

---

## 配置环境变量

### 步骤 1: 创建 .env 文件

如果还没有 `.env` 文件，从示例文件复制：

```bash
cp .env.example .env
```

### 步骤 2: 填写 R2 配置

在 `.env` 文件中，找到 R2 配置部分并填写：

```env
# Cloudflare R2 配置
R2_ACCOUNT_ID="850a4ffd2f94c4d6840b62b3aa0219ce"  # 你的 Account ID
R2_ACCESS_KEY_ID="abc123def456..."  # 从 API Token 获取
R2_SECRET_ACCESS_KEY="xyz789uvw012..."  # 从 API Token 获取
R2_BUCKET_NAME="game-onilne"  # 你的 bucket 名称
# R2_PUBLIC_URL 留空将自动使用 pub-{ACCOUNT_ID}.r2.dev 域名
# 如果配置了自定义域名，请填写: R2_PUBLIC_URL="https://cdn.yourdomain.com"
```

### 步骤 3: 重启应用

```bash
npm run dev
```

---

## 测试上传功能

### 方式 1: 通过管理后台测试

1. 启动开发服务器: `npm run dev`
2. 访问 http://localhost:3000/login
3. 使用管理员账号登录（默认: admin@rungame.online / admin123）
4. 进入任意管理页面：
   - **分类管理** → 创建/编辑分类 → 上传图标
   - **标签管理** → 创建/编辑标签 → 上传图标
   - **游戏管理** → 创建/编辑游戏 → 上传缩略图

### 方式 2: 使用 API 测试

创建测试文件 `scripts/test-r2-upload.ts`:

```typescript
import { uploadToR2 } from '@/lib/r2-upload'
import fs from 'fs'

async function testUpload() {
  try {
    // 读取测试图片
    const testImage = fs.readFileSync('public/logo.png')

    // 上传到 R2
    const result = await uploadToR2({
      key: 'test/test-image.png',
      body: testImage,
      contentType: 'image/png',
    })

    console.log('✅ 上传成功!')
    console.log('URL:', result.url)
    console.log('Key:', result.key)
    console.log('Size:', result.size)
  } catch (error) {
    console.error('❌ 上传失败:', error)
  }
}

testUpload()
```

运行测试:

```bash
npx tsx scripts/test-r2-upload.ts
```

---

## 自定义域名配置 (可选)

使用自定义域名替代默认的 `pub-*.r2.dev` 域名。

### 优势

- ✅ 品牌化 URL (如 `cdn.yourdomain.com`)
- ✅ 更好的 SEO
- ✅ 灵活的缓存控制

### 步骤 1: 在 Cloudflare 添加域名

1. 确保你的域名已在 Cloudflare 管理（如果不是，需要先将 DNS 转移到 Cloudflare）
2. 进入 R2 bucket 的 **Settings** 页面
3. 在 **Custom Domains** 部分，点击 **Connect Domain**
4. 输入子域名（如 `cdn.yourdomain.com`）
5. Cloudflare 会自动创建 CNAME 记录

### 步骤 2: 更新环境变量

```env
R2_PUBLIC_URL="https://cdn.yourdomain.com"
```

### 步骤 3: 重启应用

```bash
npm run dev
```

### 步骤 4: 验证

访问任意上传的文件，URL 应该变为：
```
https://cdn.yourdomain.com/images/categories/xxx.png
```

---

## 故障排除

### 问题 1: 上传时报错 "R2 未配置"

**原因**: 环境变量未正确设置

**解决方案**:
1. 检查 `.env` 文件中的 R2 配置
2. 确保所有必需变量都已填写（Account ID、Access Key、Secret Key、Bucket Name）
3. 重启开发服务器

### 问题 2: 上传成功但无法访问图片

**原因**: Bucket 未启用公开访问

**解决方案**:
1. 进入 R2 Dashboard → 选择 bucket → Settings
2. 在 **Public access** 部分，启用 **Allow Access**
3. 确认生成了公开域名

### 问题 3: 图片上传后显示 403 Forbidden

**原因**: API Token 权限不足

**解决方案**:
1. 重新生成 API Token
2. 确保权限设置为 **Object Read & Write**
3. 更新 `.env` 中的 Access Key 和 Secret Key

### 问题 4: 上传时报错 "InvalidAccessKeyId"

**原因**: Access Key ID 或 Secret Access Key 不正确

**解决方案**:
1. 检查 `.env` 文件中的密钥是否正确
2. 注意不要包含多余的空格或引号
3. 如果密钥丢失，需要重新创建 API Token

### 问题 5: 图片在 Next.js Image 中无法显示

**原因**: 域名未添加到 `next.config.ts` 的 `remotePatterns`

**解决方案**:

编辑 `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    // 已有的配置...
    {
      protocol: "https",
      hostname: "pub-*.r2.dev",  // R2 默认域名
    },
    // 如果使用自定义域名，添加：
    // {
    //   protocol: "https",
    //   hostname: "cdn.yourdomain.com",
    // },
  ],
}
```

### 问题 6: CORS 错误

**原因**: R2 bucket 的 CORS 配置不正确

**解决方案**:

1. 进入 R2 Dashboard → 选择 bucket → Settings
2. 在 **CORS Policy** 部分，添加以下配置：

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 安全最佳实践

### 1. 保护 API 凭据

❌ **不要**:
- 在前端代码中暴露 R2 凭据
- 将 `.env` 文件提交到 Git
- 在公开的地方分享 Secret Access Key

✅ **应该**:
- 仅在服务器端使用 R2 凭据
- 将 `.env` 添加到 `.gitignore`
- 定期轮换 API Token

### 2. 最小权限原则

- 为不同用途创建不同的 API Token
- 只授予必要的权限（读或写）
- 设置合理的过期时间

### 3. 监控使用情况

- 定期检查 R2 Dashboard 的使用统计
- 设置费用警报（如果超过免费额度）
- 监控异常的上传活动

---

## 性能优化

### 1. 图片优化

建议在上传前优化图片：

```typescript
// 可以集成 sharp 库进行图片压缩
import sharp from 'sharp'

const optimizedImage = await sharp(buffer)
  .resize(800, 600, { fit: 'inside' })
  .webp({ quality: 80 })
  .toBuffer()
```

### 2. 缓存策略

R2 默认使用长期缓存（1年）：

```typescript
cacheControl: 'public, max-age=31536000, immutable'
```

如果需要更新图片，建议使用新的文件名（已自动添加时间戳）。

### 3. CDN 配置

- 使用自定义域名可以更好地控制缓存
- Cloudflare 会自动通过全球 CDN 分发
- 可以在 Cloudflare Dashboard 中调整缓存规则

---

## 成本估算

### 免费额度

- 存储: 10 GB
- 写操作: 100 万次/月
- 读操作: 1000 万次/月

### 超出免费额度的费用

- **存储**: $0.015/GB/月
- **A 类操作** (PUT/POST/LIST): $4.50/百万次
- **B 类操作** (GET/HEAD): $0.36/百万次

### 示例计算

假设：
- 1000 个游戏，每个 3 张图片
- 平均图片大小: 200 KB
- 月访问量: 10 万次

**存储成本**:
- 总大小: 3000 × 200 KB = 600 MB = 0.6 GB
- 费用: 免费（未超过 10 GB）

**流量成本**:
- R2 出口流量完全免费
- **总成本: $0**

---

## 相关资源

- [Cloudflare R2 官方文档](https://developers.cloudflare.com/r2/)
- [R2 定价说明](https://developers.cloudflare.com/r2/platform/pricing/)
- [AWS S3 SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 API 兼容性](https://developers.cloudflare.com/r2/api/s3/api/)

---

## 常见问题 (FAQ)

### Q: R2 和 S3 有什么区别？

A: R2 完全兼容 S3 API，但主要区别是：
- R2 出口流量免费，S3 收费
- R2 定价更简单，没有复杂的定价层级
- R2 自动集成 Cloudflare CDN

### Q: 可以从 S3 迁移到 R2 吗？

A: 可以，由于 API 兼容，只需要：
1. 将数据从 S3 复制到 R2
2. 更新环境变量中的端点和凭据
3. 代码无需修改

### Q: R2 支持哪些区域？

A: R2 会自动选择最佳区域，无需手动配置。数据会自动复制到多个位置以确保可用性。

### Q: 如何删除旧的未使用图片？

A: 可以通过 R2 Dashboard 或使用 `deleteFromR2()` 函数：

```typescript
import { deleteFromR2 } from '@/lib/r2-upload'

await deleteFromR2('images/categories/old-icon.png')
```

---

**最后更新**: 2025-01-20
**适用版本**: RunGame v1.0+
