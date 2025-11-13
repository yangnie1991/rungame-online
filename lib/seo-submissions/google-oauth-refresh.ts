/**
 * Google OAuth 2.0 客户端管理（使用 Google 官方 SDK）
 *
 * 使用 googleapis npm 包自动处理 OAuth 2.0 认证和 Token 刷新
 */

import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'

/**
 * 从数据库配置创建 OAuth2 客户端
 *
 * Google SDK 会自动处理 Token 刷新
 */
export async function createGoogleOAuth2Client(): Promise<OAuth2Client | null> {
  try {
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    })

    if (!config || !config.extraConfig || typeof config.extraConfig !== 'object') {
      console.warn('[Google OAuth] 配置不存在或格式错误')
      return null
    }

    const extraConfig = config.extraConfig as any
    const clientId = extraConfig.clientId
    const clientSecret = extraConfig.clientSecret
    const accessToken = extraConfig.accessToken
    const refreshToken = extraConfig.refreshToken

    if (!clientId || !clientSecret) {
      console.warn('[Google OAuth] 未配置 Client ID 或 Client Secret')
      return null
    }

    // 创建 OAuth2 客户端
    // 注意：这里不需要 redirect URI，因为这个客户端只用于刷新 Token
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    )

    // 设置凭据
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    // 监听 Token 刷新事件，自动更新到数据库
    oauth2Client.on('tokens', async (tokens) => {
      console.log('[Google OAuth] Token 已刷新，更新到数据库')

      if (tokens.access_token) {
        await prisma.searchEngineConfig.update({
          where: { id: config.id },
          data: {
            extraConfig: {
              ...extraConfig,
              accessToken: tokens.access_token,
              tokenUpdatedAt: new Date().toISOString(),
              lastRefreshedAt: new Date().toISOString(),
              // 如果返回了新的 refresh token，也更新它
              ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
            },
          },
        })
      }
    })

    return oauth2Client
  } catch (error) {
    console.error('[Google OAuth] 创建 OAuth2 客户端错误:', error)
    return null
  }
}

/**
 * 手动刷新 Access Token（使用 Google SDK）
 *
 * @returns 新的 Access Token，如果刷新失败返回 null
 */
export async function refreshGoogleAccessToken(): Promise<string | null> {
  try {
    const oauth2Client = await createGoogleOAuth2Client()

    if (!oauth2Client) {
      console.warn('[Google OAuth] 无法创建 OAuth2 客户端')
      return null
    }

    // Google SDK 会自动刷新 Token
    const { credentials } = await oauth2Client.refreshAccessToken()

    console.log('[Google OAuth] Access Token 刷新成功')

    return credentials.access_token || null
  } catch (error) {
    console.error('[Google OAuth] 刷新 Access Token 错误:', error)
    return null
  }
}

/**
 * 获取有效的 Access Token（Google SDK 会自动处理刷新）
 *
 * @returns 有效的 Access Token，如果获取失败返回 null
 */
export async function getValidGoogleAccessToken(): Promise<string | null> {
  try {
    const oauth2Client = await createGoogleOAuth2Client()

    if (!oauth2Client) {
      return null
    }

    // 获取当前 Token，如果过期 Google SDK 会自动刷新
    const accessToken = await oauth2Client.getAccessToken()

    return accessToken.token
  } catch (error) {
    console.error('[Google OAuth] 获取有效 Access Token 错误:', error)
    return null
  }
}
