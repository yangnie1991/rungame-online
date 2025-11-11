/**
 * Google OAuth 2.0 回调处理端点
 *
 * 处理 Google 返回的授权码，交换 Access Token 和 Refresh Token，
 * 并自动保存到数据库
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // 处理用户拒绝授权的情况
    if (error) {
      console.error('[Google OAuth] 用户拒绝授权:', error)
      return NextResponse.redirect(
        new URL(
          `/admin/seo-submissions/google?error=${encodeURIComponent('用户取消授权')}`,
          request.url
        )
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/admin/seo-submissions/google?error=${encodeURIComponent('未收到授权码')}`,
          request.url
        )
      )
    }

    // 从数据库获取配置
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    })

    if (!config || !config.extraConfig || typeof config.extraConfig !== 'object') {
      return NextResponse.redirect(
        new URL(
          `/admin/seo-submissions/google?error=${encodeURIComponent('配置不存在')}`,
          request.url
        )
      )
    }

    const extraConfig = config.extraConfig as any
    const clientId = extraConfig.clientId
    const clientSecret = extraConfig.clientSecret

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          `/admin/seo-submissions/google?error=${encodeURIComponent('未配置 Client ID 或 Secret')}`,
          request.url
        )
      )
    }

    // 获取回调 URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`

    // 创建 OAuth2 客户端
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    )

    // 使用授权码交换 Access Token 和 Refresh Token
    console.log('[Google OAuth] 使用授权码交换 Token...')
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('[Google OAuth] Token 交换失败，未获得完整 Token')
      return NextResponse.redirect(
        new URL(
          `/admin/seo-submissions/google?error=${encodeURIComponent('Token 交换失败')}`,
          request.url
        )
      )
    }

    console.log('[Google OAuth] Token 交换成功')
    console.log('[Google OAuth] Access Token:', tokens.access_token.substring(0, 20) + '...')
    console.log('[Google OAuth] Refresh Token:', tokens.refresh_token?.substring(0, 20) + '...')
    console.log('[Google OAuth] Token 过期时间:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '未知')

    // 保存 Token 到数据库
    const updatedExtraConfig = {
      ...extraConfig,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenUpdatedAt: new Date().toISOString(),
      tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      lastAuthorizedAt: new Date().toISOString(),
    }

    await prisma.searchEngineConfig.update({
      where: { id: config.id },
      data: {
        extraConfig: updatedExtraConfig,
        isEnabled: true, // 自动启用配置
      },
    })

    console.log('[Google OAuth] Token 已保存到数据库')

    // 重定向回配置页面，显示成功消息
    return NextResponse.redirect(
      new URL(
        `/admin/seo-submissions/google?success=${encodeURIComponent('Google 授权成功！')}`,
        request.url
      )
    )
  } catch (error) {
    console.error('[Google OAuth] 回调处理错误:', error)
    return NextResponse.redirect(
      new URL(
        `/admin/seo-submissions/google?error=${encodeURIComponent(
          error instanceof Error ? error.message : '授权失败'
        )}`,
        request.url
      )
    )
  }
}
