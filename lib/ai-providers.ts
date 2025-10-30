/**
 * AI 提供商预设配置
 *
 * 定义四个固定的 AI 供应商及其详细配置
 */

import type { AiProviderTemplate } from "@/types/ai-config"

/**
 * 四个固定的 AI 提供商配置
 */
export const AI_PROVIDERS: AiProviderTemplate[] = [
  {
    provider: "openrouter",
    name: "openrouter",
    displayName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    description: "聚合多个 AI 提供商，支持免费和付费模型，性价比高",
    docUrl: "https://openrouter.ai/docs",
    defaultModels: [
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Free)",
        description: "Google 最新免费模型，速度快，适合日常使用",
        isDefault: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 8000,
          stream: true,
        },
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B (Free)",
        description: "Meta 开源模型，免费使用，性能优秀",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "OpenAI 的小型模型，通过 OpenRouter 调用",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
    ],
  },
  {
    provider: "openai",
    name: "openai",
    displayName: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    description: "OpenAI 官方 API，包含 GPT-4、GPT-4o、GPT-4o-mini 系列模型",
    docUrl: "https://platform.openai.com/docs",
    defaultModels: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "高性价比模型，速度快，成本低",
        isDefault: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "多模态旗舰模型，支持文本和图像",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "更强大的 GPT-4 版本，支持更长上下文",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
    ],
  },
  {
    provider: "anthropic",
    name: "anthropic",
    displayName: "Anthropic Claude",
    baseUrl: "https://api.anthropic.com/v1/messages",
    description: "Anthropic Claude 系列，强大的推理和对话能力，擅长长文本处理",
    docUrl: "https://docs.anthropic.com",
    defaultModels: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "最新旗舰模型，平衡性能和成本",
        isDefault: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "轻量快速模型，适合简单任务",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "最强大的模型，适合复杂任务",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 4000,
          stream: true,
        },
      },
    ],
  },
  {
    provider: "gemini",
    name: "gemini",
    displayName: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/chat/completions",
    description: "Google 最新的多模态 AI 模型，支持文本、图像、视频、音频",
    docUrl: "https://ai.google.dev/docs",
    defaultModels: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        description: "最新实验版本，速度极快",
        isDefault: true,
        parameters: {
          temperature: 0.7,
          max_tokens: 8000,
          stream: true,
        },
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "专业版本，支持超长上下文（200万 tokens）",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 8000,
          stream: true,
        },
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "快速版本，适合日常使用",
        isDefault: false,
        parameters: {
          temperature: 0.7,
          max_tokens: 8000,
          stream: true,
        },
      },
    ],
  },
]

/**
 * 根据提供商名称获取配置
 */
export function getProviderConfig(
  provider: "openrouter" | "openai" | "anthropic" | "gemini"
): AiProviderTemplate | undefined {
  return AI_PROVIDERS.find(p => p.provider === provider)
}

/**
 * 获取提供商显示信息（用于 UI 展示）
 */
export const PROVIDER_DISPLAY_INFO: Record<
  string,
  {
    displayName: string
    color: string
    textColor: string
    badge: string
    icon?: string
  }
> = {
  openrouter: {
    displayName: "OpenRouter",
    color: "bg-purple-100",
    textColor: "text-purple-800",
    badge: "聚合平台",
  },
  openai: {
    displayName: "OpenAI",
    color: "bg-green-100",
    textColor: "text-green-800",
    badge: "GPT系列",
  },
  anthropic: {
    displayName: "Anthropic",
    color: "bg-orange-100",
    textColor: "text-orange-800",
    badge: "Claude系列",
  },
  gemini: {
    displayName: "Google Gemini",
    color: "bg-blue-100",
    textColor: "text-blue-800",
    badge: "Gemini系列",
  },
}

/**
 * 获取提供商显示信息
 */
export function getProviderDisplayInfo(provider: string) {
  return (
    PROVIDER_DISPLAY_INFO[provider] || {
      displayName: provider,
      color: "bg-gray-100",
      textColor: "text-gray-800",
      badge: "自定义",
    }
  )
}

/**
 * 验证提供商是否支持
 */
export function isProviderSupported(
  provider: string
): provider is "openrouter" | "openai" | "anthropic" | "gemini" {
  return ["openrouter", "openai", "anthropic", "gemini"].includes(provider)
}

/**
 * 获取所有支持的提供商列表
 */
export function getSupportedProviders(): Array<"openrouter" | "openai" | "anthropic" | "gemini"> {
  return ["openrouter", "openai", "anthropic", "gemini"]
}
