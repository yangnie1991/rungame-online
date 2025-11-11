/**
 * Google OAuth 2.0 授权初始化端点
 *
 * 生成 OAuth 授权 URL 并重定向用户到 Google 登录页面
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 从数据库获取 Google 配置
    const config = await prisma.searchEngineConfig.findFirst({
      where: { type: 'google' },
    })

    if (!config || !config.extraConfig || typeof config.extraConfig !== 'object') {
      return NextResponse.json(
        { error: 'Google 配置不存在，请先初始化配置' },
        { status: 400 }
      )
    }

    const extraConfig = config.extraConfig as any
    const clientId = extraConfig.clientId
    const clientSecret = extraConfig.clientSecret

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '未配置 OAuth Client ID 或 Client Secret' },
        { status: 400 }
      )
    }

    // 获取回调 URL（从请求头中获取当前域名）
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`

    // 创建 OAuth2 客户端
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    )

    // 生成授权 URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // 获取 refresh token
      scope: [
        'https://www.googleapis.com/auth/webmasters.readonly', // Search Console 读取权限
      ],
      prompt: 'consent', // 强制显示同意屏幕以获取 refresh token
    })

    console.log('[Google OAuth] 生成授权 URL:', authUrl)
    console.log('[Google OAuth] 回调 URL:', redirectUri)

    // 重定向到 Google 授权页面
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Google OAuth] 生成授权 URL 错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成授权 URL 失败' },
      { status: 500 }
    )
  }
}
