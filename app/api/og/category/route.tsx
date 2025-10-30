import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 获取参数
    const name = searchParams.get('name') || 'Category'
    const description = searchParams.get('description') || ''
    const gameCount = searchParams.get('gameCount') || '0'
    const icon = searchParams.get('icon') || '🎮' // 分类图标

    // 获取当前域名，用于 Logo 图片 URL（使用白色 PNG，因为 Satori 不支持 SVG）
    const protocol = request.url.startsWith('https') ? 'https' : 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const logoUrl = `${protocol}://${host}/logo/logo-rungame-white-512.png`

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            background: 'linear-gradient(135deg, #6B21A8 0%, #BE123C 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 背景光晕效果 */}
          <div
            style={{
              position: 'absolute',
              top: '-200px',
              right: '-200px',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-200px',
              left: '-200px',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(190,18,60,0.35) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* 主容器 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '60px 80px',
              justifyContent: 'space-between',
            }}
          >
            {/* 顶部：Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={logoUrl}
                alt="RunGame"
                width={48}
                height={48}
                style={{
                  borderRadius: '12px',
                }}
              />
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                }}
              >
                RUNGAME
              </span>
            </div>

            {/* 中间：主要内容 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '-60px' }}>
              {/* 类型标签 */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                CATEGORY
              </div>

              {/* 分类名称和图标 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {icon && (
                  <div
                    style={{
                      fontSize: '90px',
                      lineHeight: 1,
                    }}
                  >
                    {icon}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    textShadow: '0 4px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  {name}
                </div>
              </div>

              {/* 描述 */}
              {description && (
                <div
                  style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '400',
                    lineHeight: 1.4,
                    maxWidth: '700px',
                  }}
                >
                  {description}
                </div>
              )}
            </div>

            {/* 底部：游戏数量和按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              {/* 游戏数量 */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 1,
                  }}
                >
                  {Number(gameCount).toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  GAMES
                </div>
              </div>

              {/* 行动号召按钮 */}
              <div
                style={{
                  display: 'flex',
                  background: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
                  padding: '18px 40px',
                  borderRadius: '12px',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(236,72,153,0.4)',
                }}
              >
                EXPLORE GAMES →
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('生成分类 OG 图片失败:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
