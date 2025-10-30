/**
 * AI 配置相关类型定义
 *
 * 用于 AiConfig 数据库模型的 TypeScript 类型
 */

/**
 * 模型参数接口
 */
export interface AiModelParameters {
  // ========== 必需参数 ==========
  temperature: number    // 温度参数（0-2，控制输出随机性，默认 0.7）
  max_tokens: number     // 最大 token 数（默认 2000）
  stream: boolean        // 是否使用流式输出（默认 true）

  // ========== 可选参数 ==========
  top_p?: number                        // Top-p 采样（0-1，与 temperature 配合使用）
  frequency_penalty?: number            // 频率惩罚（-2 到 2，减少重复内容）
  presence_penalty?: number             // 存在惩罚（-2 到 2，鼓励新话题）
  stop?: string[]                      // 停止序列（遇到这些词时停止生成）
  n?: number                           // 生成的回复数量（默认 1）
  logit_bias?: Record<string, number>  // Token 偏差设置

  // 允许其他自定义参数（不同模型可能有特殊参数）
  [key: string]: any
}

/**
 * 单个 AI 模型配置
 */
export interface AiModel {
  // ========== 必需字段 ==========
  id: string              // 模型 ID（如：google/gemini-2.0-flash-exp:free）
  name: string            // 显示名称（如：Gemini 2.0 Flash）
  isDefault: boolean      // 是否为默认模型
  isEnabled: boolean      // 是否启用此模型
  parameters: AiModelParameters  // 模型参数

  // ========== 可选字段 ==========
  description?: string               // 模型描述
  tags?: string[]                   // 标签（如：["free", "fast"]）
  headers?: Record<string, string>  // 额外的 HTTP 请求头
}

/**
 * modelConfig JSON 结构
 */
export interface AiModelConfig {
  models: AiModel[]
}

/**
 * AiConfig 数据库模型接口
 */
export interface AiConfig {
  id: string
  name: string                                          // 配置名称
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini'  // 提供商（固定四个）
  apiKey: string                                        // API 密钥
  baseUrl: string                                       // API 端点地址
  modelConfig: AiModelConfig                            // 模型配置
  isActive: boolean                                     // 是否为当前激活配置
  isEnabled: boolean                                    // 是否启用
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建/更新 AI 配置的表单数据
 */
export interface AiConfigFormData {
  name: string
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini'
  apiKey: string
  baseUrl: string
  modelConfig: AiModelConfig
  isActive?: boolean
  isEnabled?: boolean
}

/**
 * 预设的提供商配置模板
 */
export interface AiProviderTemplate {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini'
  name: string
  displayName: string  // 显示名称
  baseUrl: string
  icon?: string
  description: string
  defaultModels: Omit<AiModel, 'isEnabled'>[]  // 预设模型列表
  docUrl?: string  // 文档链接
}

/**
 * AI 请求配置（用于发送 API 请求）
 */
export interface AiRequestConfig {
  apiKey: string
  baseUrl: string
  model: string
  headers?: Record<string, string>
  parameters: AiModelParameters
}
