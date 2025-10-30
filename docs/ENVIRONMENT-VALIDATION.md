# 环境变量验证系统

**创建时间**: 2025-01-20
**目的**: 在应用启动时验证必需的环境变量，避免运行时错误

## 📋 概述

环境变量验证系统会在应用启动时自动检查所有必需的环境变量是否已配置，如果缺少任何必需的变量，应用将立即退出并显示清晰的错误信息。

## ✨ 为什么需要这个系统？

### 问题

之前的实现在每次使用环境变量时都进行检查：

```typescript
// ❌ 旧方式：运行时检查
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('未配置 ENCRYPTION_KEY 环境变量')
  }

  return crypto.scryptSync(key, 'salt', KEY_LENGTH)
}
```

**缺点**：
1. 重复代码 - 每个使用环境变量的地方都要检查
2. 延迟发现 - 只有在使用时才发现问题
3. 用户体验差 - 应用启动后才报错

### 解决方案

在应用启动时统一验证：

```typescript
// ✅ 新方式：启动时检查
// lib/env.ts 在 next.config.ts 导入时自动执行
initEnv() // 验证所有必需的环境变量

// 使用时不需要检查
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY! // 使用非空断言
  return crypto.scryptSync(key, 'salt', KEY_LENGTH)
}
```

**优点**：
1. 快速失败 - 启动时立即发现问题
2. 清晰错误 - 显示所有缺失的环境变量
3. 简化代码 - 使用时不需要重复检查

## 🔧 实现细节

### 1. 环境变量验证模块

**文件**: [lib/env.ts](../lib/env.ts)

```typescript
/**
 * 验证必需的环境变量
 */
export function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'ENCRYPTION_KEY',
  ]

  const missing: string[] = []

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    // 显示友好的错误信息
    throw new Error(`缺少环境变量: ${missing.join(', ')}`)
  }
}
```

### 2. 自动执行验证

**文件**: [next.config.ts](../next.config.ts)

```typescript
import './lib/env' // 导入时自动执行验证
```

这样在 Next.js 启动时就会立即验证环境变量。

### 3. 加密密钥强度验证

除了检查环境变量是否存在，还验证 `ENCRYPTION_KEY` 的强度：

```typescript
export function validateEncryptionKeyStrength() {
  const key = process.env.ENCRYPTION_KEY!

  // 生产环境严格检查
  if (process.env.NODE_ENV === 'production') {
    if (key.length < 32) {
      throw new Error('生产环境的 ENCRYPTION_KEY 必须至少 32 个字符')
    }

    // 检查密钥复杂度
    const hasUpperCase = /[A-Z]/.test(key)
    const hasLowerCase = /[a-z]/.test(key)
    const hasNumber = /[0-9]/.test(key)
    const hasSpecial = /[^A-Za-z0-9]/.test(key)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      console.warn('⚠️ ENCRYPTION_KEY 复杂度不足')
    }
  }
}
```

## 📝 必需的环境变量

### 数据库

- **DATABASE_URL**: PostgreSQL 数据库连接字符串
  ```bash
  DATABASE_URL="postgresql://user:password@host:5432/database"
  ```

### 身份验证

- **NEXTAUTH_SECRET**: NextAuth.js 会话加密密钥
  ```bash
  # 生成命令
  openssl rand -base64 32

  # 示例
  NEXTAUTH_SECRET="26XPfetqHwepjgVNSq+InkShpXNJnhM8vT04SOmr/+I="
  ```

- **NEXTAUTH_URL**: 应用的基础 URL
  ```bash
  # 开发环境
  NEXTAUTH_URL="http://localhost:3000"

  # 生产环境
  NEXTAUTH_URL="https://rungame.online"
  ```

### AI 配置加密

- **ENCRYPTION_KEY**: 用于加密 AI API Key 的密钥
  ```bash
  # 生成命令（推荐使用 48 字节以获得更高强度）
  openssl rand -base64 48

  # 示例
  ENCRYPTION_KEY="0HBxK6X6RFFl2svVNInDj908GBj/EmYCek87fzh45Q4oJDU4xyj67xS5+wEU6Mfe"
  ```

  **要求**：
  - 至少 32 个字符
  - 包含大小写字母、数字和特殊字符（生产环境）
  - 不要与他人共享
  - 不要提交到 Git 仓库

## 🚨 错误信息示例

当缺少环境变量时，应用会显示清晰的错误信息：

```
========================================
❌ 缺少必需的环境变量
========================================

缺少以下环境变量：
  • ENCRYPTION_KEY
  • NEXTAUTH_SECRET

请在 .env.local 文件中配置这些变量。

参考 .env.example 文件获取配置示例。

生成 ENCRYPTION_KEY:
  openssl rand -base64 48

生成 NEXTAUTH_SECRET:
  openssl rand -base64 32

========================================
```

## 📂 相关文件

### 修改的文件

1. **[lib/env.ts](../lib/env.ts)** (新增)
   - 环境变量验证逻辑
   - 加密密钥强度检查
   - 自动执行初始化

2. **[lib/crypto.ts](../lib/crypto.ts)**
   - 简化了 `getEncryptionKey()` 函数
   - 移除了运行时检查（使用非空断言）
   - 依赖启动时验证

3. **[lib/ai-config.ts](../lib/ai-config.ts)**
   - 简化了 `decryptApiKey()` 函数
   - 直接使用 `decrypt()` 而不是包装
   - 移除了不必要的 async

4. **[next.config.ts](../next.config.ts)**
   - 导入 `lib/env` 以触发验证
   - 在配置加载时自动验证环境变量

## 🔒 安全最佳实践

### 1. 不同环境使用不同密钥

```bash
# 开发环境 (.env.local)
ENCRYPTION_KEY="dev-key-do-not-use-in-production"

# 生产环境 (Vercel/服务器环境变量)
ENCRYPTION_KEY="strong-production-key-with-64-chars-minimum"
```

### 2. 密钥轮换

定期更换加密密钥以提高安全性：

```bash
# 1. 生成新密钥
openssl rand -base64 48

# 2. 在数据库中使用新密钥重新加密所有 API Key
# 3. 更新环境变量
# 4. 重启应用
```

### 3. 备份加密密钥

将加密密钥安全地存储在：
- 密码管理器（如 1Password, LastPass）
- 密钥管理服务（如 AWS Secrets Manager, HashiCorp Vault）
- 加密的备份文件

### 4. 权限控制

- 只有需要的团队成员才能访问加密密钥
- 使用环境变量管理工具（如 Doppler, Infisical）
- 定期审计密钥访问记录

## 🛠️ 故障排查

### 问题：应用启动失败，提示缺少环境变量

**解决方案**：

1. 检查 `.env.local` 文件是否存在
   ```bash
   ls -la .env.local
   ```

2. 检查环境变量是否配置
   ```bash
   grep ENCRYPTION_KEY .env.local
   ```

3. 如果缺少，从 `.env.example` 复制并填写
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local，填写实际的值
   ```

4. 生成缺失的密钥
   ```bash
   # ENCRYPTION_KEY
   openssl rand -base64 48

   # NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

### 问题：ENCRYPTION_KEY 复杂度警告

**解决方案**：

使用 `openssl` 生成的密钥通常符合要求。如果收到警告：

```bash
# 生成更强的密钥（推荐）
openssl rand -base64 64

# 或手动创建包含所有类型字符的密钥
# 至少包含：大写字母、小写字母、数字、特殊字符
```

## 📚 相关文档

- [AI 配置文档](./AI-CONFIGURATION.md)
- [AI 批量生成优化](./AI-BATCH-GENERATE-IMPROVEMENTS.md)
- [架构文档](./ARCHITECTURE.md)

---

**维护者**: Claude Code
**版本**: v1.0
**最后更新**: 2025-01-20
