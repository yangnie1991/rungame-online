import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get('title') || 'Game'
    const category = searchParams.get('category') || ''
    const categoryIcon = searchParams.get('categoryIcon') || '🎮' // 分类图标
    const thumbnail = searchParams.get('thumbnail') || '' // 游戏缩略图
    const tags = searchParams.get('tags') || '' // 标签，用逗号分隔

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
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 网格背景 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* 背景光晕 - 霓虹电竞风格 */}
          <div
            style={{
              position: 'absolute',
              top: '-200px',
              right: '-200px',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
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
              background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
              filter: 'blur(80px)',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* 主容器 - 左右布局 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
              padding: '60px 70px',
              gap: '50px',
            }}
          >
            {/* 左侧：游戏信息 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '650px',
              }}
            >
              {/* 顶部：Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={logoUrl}
                  alt="RunGame Logo"
                  width={56}
                  height={56}
                  style={{
                    borderRadius: '14px',
                    boxShadow: '0 6px 20px rgba(59,130,246,0.4), 0 0 30px rgba(124,58,237,0.3)',
                  }}
                />
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  RUNGAME
                </span>
              </div>

              {/* 中间：游戏标题和分类 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center' }}>
                {/* 分类徽章 */}
                {category && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      alignSelf: 'flex-start',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(59,130,246,0.3)',
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{categoryIcon}</span>
                    <span>{category}</span>
                  </div>
                )}

                {/* 游戏标题 */}
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    letterSpacing: '-0.04em',
                    textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.3)',
                  }}
                >
                  {title}
                </div>

                {/* PLAY NOW 按钮 */}
                <div
                  style={{
                    display: 'flex',
                    alignSelf: 'flex-start',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                    padding: '22px 56px',
                    borderRadius: '16px',
                    fontSize: '28px',
                    fontWeight: '900',
                    color: 'white',
                    letterSpacing: '0.05em',
                    boxShadow: '0 8px 32px rgba(6,182,212,0.5), 0 0 40px rgba(59,130,246,0.4)',
                    marginTop: '8px',
                  }}
                >
                  PLAY NOW →
                </div>
              </div>

              {/* 底部：标签或品牌标语 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {tags ? (
                  // 显示标签
                  tags.split(',').slice(0, 3).map((tag, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        borderRadius: '8px',
                        padding: '6px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#E0E7FF',
                        letterSpacing: '0.03em',
                      }}
                    >
                      #{tag.trim()}
                    </div>
                  ))
                ) : (
                  // 无标签时显示品牌标语
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>🎮</div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#E0E7FF',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Play Free Games Online
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：游戏缩略图 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title}
                  width={400}
                  height={400}
                  style={{
                    borderRadius: '32px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 4px rgba(255,255,255,0.25), 0 0 60px rgba(59,130,246,0.4)',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '400px',
                    height: '400px',
                    borderRadius: '32px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(168,85,247,0.3) 100%)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 6px rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    border: '2px solid rgba(255,255,255,0.15)',
                  }}
                >
                  🎮
                </div>
              )}
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
    console.error('生成游戏 OG 图片失败:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
