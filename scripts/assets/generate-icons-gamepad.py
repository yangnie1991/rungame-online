#!/usr/bin/env python3
"""
生成 RunGame 网站的游戏手柄融合设计图标
方案1: 游戏手柄 + RG 字母融合设计
需要安装: pip3 install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# 配置
OUTPUT_DIR = "public/assets/icons"
BRAND_COLORS = {
    "primary": "#FF6B35",      # 橙红色 - 充满活力
    "secondary": "#004E89",    # 深蓝色 - 专业稳重
    "accent": "#F7B801",       # 金黄色 - 高亮强调
    "light": "#FFFFFF",        # 白色
    "dark": "#1A1A2E",         # 深色背景
}

def hex_to_rgb(hex_color):
    """将十六进制颜色转换为 RGB 元组"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gamepad_favicon(size=512):
    """创建游戏手柄融合设计的 favicon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 背景 - 圆角矩形
    padding = size // 16
    bg_rect = [padding, padding, size - padding, size - padding]
    radius = size // 6
    draw.rounded_rectangle(bg_rect, radius=radius, fill=hex_to_rgb(BRAND_COLORS["primary"]))

    # === 游戏手柄元素设计 ===
    center_x = size // 2
    center_y = size // 2

    # 1. 绘制游戏手柄轮廓（简化版）
    # 手柄主体
    gamepad_width = size * 0.7
    gamepad_height = size * 0.45
    gamepad_x = center_x - gamepad_width / 2
    gamepad_y = center_y - gamepad_height / 2 + size * 0.15

    # 手柄背景（半透明白色）
    draw.rounded_rectangle(
        [gamepad_x, gamepad_y, gamepad_x + gamepad_width, gamepad_y + gamepad_height],
        radius=size // 12,
        fill=(255, 255, 255, 40)
    )

    # 2. 左侧 - 方向键（D-Pad）设计融入 "R" 字母
    dpad_x = gamepad_x + gamepad_width * 0.2
    dpad_y = gamepad_y + gamepad_height * 0.35
    dpad_size = size // 6

    # 绘制十字方向键
    # 横向
    draw.rectangle(
        [dpad_x, dpad_y + dpad_size // 3,
         dpad_x + dpad_size, dpad_y + 2 * dpad_size // 3],
        fill=hex_to_rgb(BRAND_COLORS["accent"])
    )
    # 纵向
    draw.rectangle(
        [dpad_x + dpad_size // 3, dpad_y,
         dpad_x + 2 * dpad_size // 3, dpad_y + dpad_size],
        fill=hex_to_rgb(BRAND_COLORS["accent"])
    )

    # 3. 右侧 - 按钮组设计融入 "G" 字母
    button_base_x = gamepad_x + gamepad_width * 0.68
    button_base_y = gamepad_y + gamepad_height * 0.35
    button_radius = size // 20

    # ABXY 按钮布局
    button_positions = [
        (button_base_x + button_radius, button_base_y),                    # 上 (Y)
        (button_base_x + 2 * button_radius, button_base_y + button_radius), # 右 (B)
        (button_base_x + button_radius, button_base_y + 2 * button_radius), # 下 (A)
        (button_base_x, button_base_y + button_radius),                     # 左 (X)
    ]

    button_colors = [
        hex_to_rgb(BRAND_COLORS["accent"]),   # Y - 金色
        hex_to_rgb(BRAND_COLORS["light"]),    # B - 白色
        hex_to_rgb(BRAND_COLORS["accent"]),   # A - 金色
        hex_to_rgb(BRAND_COLORS["light"]),    # X - 白色
    ]

    for pos, color in zip(button_positions, button_colors):
        draw.ellipse(
            [pos[0], pos[1], pos[0] + button_radius * 1.5, pos[1] + button_radius * 1.5],
            fill=color,
            outline=hex_to_rgb(BRAND_COLORS["dark"]),
            width=max(1, size // 200)
        )

    # 4. 绘制 "RG" 文字（大而醒目）
    try:
        font_size = int(size * 0.35)
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/SFNSDisplay.ttf",
            "/Library/Fonts/Arial Bold.ttf",
            "/Library/Fonts/Arial.ttf",
        ]

        font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    font = ImageFont.truetype(path, font_size)
                    break
                except Exception as e:
                    continue

        if not font:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # 文字位置（上方居中）
    text = "RG"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (size - text_width) // 2
    text_y = size * 0.2  # 放在上方

    # 绘制文字阴影
    shadow_offset = max(2, size // 80)
    draw.text(
        (text_x + shadow_offset, text_y + shadow_offset),
        text,
        fill=hex_to_rgb(BRAND_COLORS["dark"]),
        font=font
    )

    # 绘制主文字
    draw.text((text_x, text_y), text, fill=hex_to_rgb(BRAND_COLORS["light"]), font=font)

    return img

def create_gamepad_og_image():
    """创建游戏手柄主题的 OG 社交媒体图片 (1200x630)"""
    width, height = 1200, 630
    img = Image.new('RGB', (width, height), hex_to_rgb(BRAND_COLORS["dark"]))
    draw = ImageDraw.Draw(img)

    # 背景装饰 - 渐变圆形
    circle_size = 900
    circle_x = width - circle_size // 2 + 100
    circle_y = height // 2 - circle_size // 2
    draw.ellipse(
        [circle_x, circle_y, circle_x + circle_size, circle_y + circle_size],
        fill=hex_to_rgb(BRAND_COLORS["secondary"])
    )

    # 左侧内容区域
    content_x = 80

    try:
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/SFNSDisplay.ttf",
            "/Library/Fonts/Arial.ttf",
        ]

        title_font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    title_font = ImageFont.truetype(path, 100)
                    subtitle_font = ImageFont.truetype(path, 40)
                    small_font = ImageFont.truetype(path, 32)
                    break
                except:
                    continue

        if not title_font:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # 标题 - RunGame
    draw.text((content_x, 150), "RunGame", fill=hex_to_rgb(BRAND_COLORS["primary"]), font=title_font)

    # 副标题
    draw.text((content_x, 280), "Free Online Games", fill=hex_to_rgb(BRAND_COLORS["light"]), font=subtitle_font)

    # 特性说明
    features_y = 360
    draw.text((content_x, features_y), "🎮 Thousands of games", fill=hex_to_rgb(BRAND_COLORS["accent"]), font=small_font)
    draw.text((content_x, features_y + 50), "⚡ Play instantly", fill=hex_to_rgb(BRAND_COLORS["light"]), font=small_font)
    draw.text((content_x, features_y + 100), "📱 No downloads needed", fill=hex_to_rgb(BRAND_COLORS["light"]), font=small_font)

    # 右侧 - 大型游戏手柄图标
    gamepad_icon = create_gamepad_favicon(400)
    gamepad_x = width - 450
    gamepad_y = height // 2 - 200
    img.paste(gamepad_icon, (gamepad_x, gamepad_y), gamepad_icon)

    return img

def create_simple_app_icon():
    """创建简洁的应用图标（用于 PWA）"""
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 背景 - 纯色圆角矩形
    draw.rounded_rectangle(
        [0, 0, size, size],
        radius=size // 6,
        fill=hex_to_rgb(BRAND_COLORS["primary"])
    )

    # 中心 - 简化的游戏手柄图标
    center = size // 2

    # 绘制游戏手柄主体
    pad_width = size * 0.6
    pad_height = size * 0.35
    pad_x = center - pad_width / 2
    pad_y = center - pad_height / 2

    draw.rounded_rectangle(
        [pad_x, pad_y, pad_x + pad_width, pad_y + pad_height],
        radius=size // 15,
        fill=hex_to_rgb(BRAND_COLORS["light"])
    )

    # 左侧方向键
    dpad_size = size // 8
    dpad_x = pad_x + pad_width * 0.25
    dpad_y = pad_y + pad_height / 2 - dpad_size / 2

    # 横
    draw.rectangle(
        [dpad_x, dpad_y + dpad_size // 3,
         dpad_x + dpad_size, dpad_y + 2 * dpad_size // 3],
        fill=hex_to_rgb(BRAND_COLORS["primary"])
    )
    # 竖
    draw.rectangle(
        [dpad_x + dpad_size // 3, dpad_y,
         dpad_x + 2 * dpad_size // 3, dpad_y + dpad_size],
        fill=hex_to_rgb(BRAND_COLORS["primary"])
    )

    # 右侧按钮
    button_r = size // 25
    button_x = pad_x + pad_width * 0.7
    button_y = pad_y + pad_height / 2

    buttons = [
        (button_x, button_y - button_r * 2),
        (button_x + button_r * 2, button_y),
        (button_x, button_y + button_r * 2),
        (button_x - button_r * 2, button_y),
    ]

    for bx, by in buttons:
        draw.ellipse(
            [bx - button_r, by - button_r, bx + button_r, by + button_r],
            fill=hex_to_rgb(BRAND_COLORS["accent"])
        )

    return img

def main():
    """生成所有图标"""
    print("🎮 开始生成 RunGame 游戏手柄融合设计图标...")
    print("=" * 60)

    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 生成主 favicon（多种尺寸）
    print("\n📱 生成 Favicon（游戏手柄融合设计）...")
    base_icon = create_gamepad_favicon(512)

    favicon_sizes = [16, 32, 48, 64, 128, 256, 512]
    for size in favicon_sizes:
        resized = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        filename = f"{OUTPUT_DIR}/favicon-{size}x{size}.png"
        resized.save(filename, 'PNG', optimize=True)
        print(f"  ✓ {filename}")

    # 生成 .ico 文件（包含多个尺寸）
    print("\n🖼️  生成 favicon.ico...")
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    ico_images = [base_icon.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]

    # 保存到 public 根目录
    ico_path = "public/favicon.ico"
    ico_images[0].save(ico_path, format='ICO', sizes=ico_sizes)
    print(f"  ✓ {ico_path}")

    # 2. 生成 Apple Touch Icon
    print("\n🍎 生成 Apple Touch Icon...")
    apple_icon = base_icon.resize((180, 180), Image.Resampling.LANCZOS)
    apple_path = f"{OUTPUT_DIR}/apple-touch-icon.png"
    apple_icon.save(apple_path, 'PNG', optimize=True)
    print(f"  ✓ {apple_path}")

    # 3. 生成 Web App Manifest Icons（简洁版）
    print("\n📲 生成 PWA App Icons...")
    app_icon_base = create_simple_app_icon()

    manifest_sizes = [192, 512]
    for size in manifest_sizes:
        resized = app_icon_base.resize((size, size), Image.Resampling.LANCZOS)
        filename = f"{OUTPUT_DIR}/icon-{size}x{size}.png"
        resized.save(filename, 'PNG', optimize=True)
        print(f"  ✓ {filename}")

    # 4. 生成 Open Graph 社交媒体图片
    print("\n🌐 生成 Open Graph 图片...")
    og_image = create_gamepad_og_image()

    og_path = "public/og-image.png"
    og_image.save(og_path, 'PNG', optimize=True)
    print(f"  ✓ {og_path}")

    twitter_path = "public/twitter-image.png"
    og_image.save(twitter_path, 'PNG', optimize=True)
    print(f"  ✓ {twitter_path}")

    print("\n" + "=" * 60)
    print("✅ 所有游戏手柄融合设计图标生成完成！")
    print("\n📋 生成的文件清单:")
    print("  • favicon.ico - 多尺寸合一 (16, 32, 48, 64)")
    print("  • favicon-*.png - 从 16x16 到 512x512")
    print("  • apple-touch-icon.png - 180x180")
    print("  • icon-*.png - PWA 应用图标 (192, 512)")
    print("  • og-image.png - 社交媒体分享 (1200x630)")
    print("  • twitter-image.png - Twitter 卡片 (1200x630)")

    print("\n🎨 设计特点:")
    print("  ✓ 游戏手柄元素融入品牌设计")
    print("  ✓ RG 字母醒目显示")
    print("  ✓ 方向键和按钮作为视觉装饰")
    print("  ✓ 品牌配色统一协调")

    print("\n💡 下一步:")
    print("  1. 在浏览器中查看新图标效果")
    print("  2. 清除浏览器缓存以查看更新")
    print("  3. 检查移动设备上的显示效果")

if __name__ == "__main__":
    main()
