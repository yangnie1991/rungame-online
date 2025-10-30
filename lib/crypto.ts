/**
 * 加密工具函数
 * 用于加密/解密敏感数据（如 API Key）
 */

import crypto from 'crypto'

// 加密算法
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16  // 128 bits
const TAG_LENGTH = 16 // 128 bits

/**
 * 获取加密密钥
 * 从环境变量获取并转换为 Buffer
 * 注意：ENCRYPTION_KEY 必须在应用启动时就存在，这里不做检查
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY!

  // 使用 scrypt 从密钥字符串生成固定长度的密钥
  return crypto.scryptSync(key, 'salt', KEY_LENGTH)
}

/**
 * 加密字符串
 * @param text 要加密的明文
 * @returns 加密后的字符串（格式：iv:tag:encrypted）
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // 将 iv、tag 和加密数据组合在一起
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('加密失败:', error)
    throw new Error('加密失败')
  }
}

/**
 * 解密字符串
 * @param encryptedText 加密的字符串（格式：iv:tag:encrypted）
 * @returns 解密后的明文
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 3) {
      throw new Error('加密数据格式错误')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('解密失败:', error)
    throw new Error('解密失败')
  }
}

/**
 * 检查字符串是否已加密
 * @param text 要检查的字符串
 * @returns 是否已加密
 */
export function isEncrypted(text: string): boolean {
  // 检查格式是否为 hex:hex:hex
  const parts = text.split(':')
  if (parts.length !== 3) return false

  // 检查每部分是否为有效的十六进制字符串
  return parts.every(part => /^[0-9a-f]+$/i.test(part))
}

/**
 * 掩码显示敏感信息
 * @param text 敏感文本
 * @param visibleChars 显示的字符数（默认前4后4）
 * @returns 掩码后的字符串
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
  if (text.length <= visibleChars * 2) {
    return '*'.repeat(text.length)
  }

  const start = text.slice(0, visibleChars)
  const end = text.slice(-visibleChars)
  const middle = '*'.repeat(Math.max(8, text.length - visibleChars * 2))

  return `${start}${middle}${end}`
}

/**
 * 验证加密密钥强度
 * @param key 加密密钥
 * @returns 是否符合强度要求
 */
export function validateEncryptionKey(key: string): boolean {
  // 至少 32 个字符
  if (key.length < 32) return false

  // 包含大小写字母、数字和特殊字符
  const hasUpperCase = /[A-Z]/.test(key)
  const hasLowerCase = /[a-z]/.test(key)
  const hasNumber = /[0-9]/.test(key)
  const hasSpecial = /[^A-Za-z0-9]/.test(key)

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecial
}
