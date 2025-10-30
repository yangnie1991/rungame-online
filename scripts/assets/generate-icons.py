#!/usr/bin/env python3
"""
生成 RunGame 网站的各种图标和社交媒体图片
需要安装: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 配置
OUTPUT_DIR = "public"
BRAND_COLORS = {
    "primary": "#FF6B35",      # 橙红色 - 充满活力
    "secondary": "#004E89",    # 深蓝色 - 专业稳重
    "accent": "#F7B801",       # 金黄色 - 高亮强调
    "light": "#FFFFFF",        # 白色
    "dark": "#1A1A2E",         # 深色背景
}

def create_rounded_rectangle(draw, xy, radius, fill):
    """绘制圆角矩形"""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)

def create_favicon(size=512):
    """创建主图标 - 游戏手柄风格的 RG 标识"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 背景 - 渐变效果的圆角矩形
    padding = size // 16
    bg_rect = [padding, padding, size - padding, size - padding]
    radius = size // 8

    # 主背景色
    draw.rounded_rectangle(bg_rect, radius=radius, fill=BRAND_COLORS["primary"])

    # 添加装饰性图形 - 游戏手柄按钮风格
    button_size = size // 8
    button_margin = size // 4

    # 左上角按钮组 (ABXY风格)
    positions = [
        (button_margin, button_margin + button_size),  # 上
        (button_margin + button_size, button_margin),  # 右
        (button_margin, button_margin),                # 左上
    ]

    for x, y in positions:
        draw.ellipse([x, y, x + button_size//1.5, y + button_size//1.5],
                     fill=BRAND_COLORS["accent"],
                     outline=BRAND_COLORS["light"],
                     width=size//100)

    # 绘制 "RG" 文字
    try:
        # 尝试使用系统字体
        font_size = size // 2
        # macOS 常见字体
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/SFNSDisplay.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
        font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    font = ImageFont.truetype(path, font_size)
                    break
                except:
                    continue

        if not font:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    # 文字位置居中
    text = "RG"

    # 使用 textbbox 获取文字边界
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2
    y = (size - text_height) // 2 + size // 10  # 稍微向下偏移

    # 绘制文字阴影
    shadow_offset = size // 50
    draw.text((x + shadow_offset, y + shadow_offset), text,
              fill=BRAND_COLORS["dark"], font=font)

    # 绘制主文字
    draw.text((x, y), text, fill=BRAND_COLORS["light"], font=font)

    return img

def create_og_image():
    """创建 Open Graph 社交媒体分享图片 (1200x630)"""
    width, height = 1200, 630
    img = Image.new('RGB', (width, height), BRAND_COLORS["dark"])
    draw = ImageDraw.Draw(img)

    # 背景装饰 - 大圆形
    circle_size = 800
    circle_x = width - circle_size // 2
    circle_y = height // 2 - circle_size // 2
    draw.ellipse([circle_x, circle_y, circle_x + circle_size, circle_y + circle_size],
                 fill=BRAND_COLORS["secondary"], outline=None)

    # 左侧区域 - 主要内容
    content_x = 80

    # 绘制标题
    try:
        title_font = None
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/SFNSDisplay.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
        for path in font_paths:
            if os.path.exists(path):
                try:
                    title_font = ImageFont.truetype(path, 100)
                    subtitle_font = ImageFont.truetype(path, 40)
                    break
                except:
                    continue

        if not title_font:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()

    # 标题
    draw.text((content_x, 180), "RunGame",
              fill=BRAND_COLORS["primary"], font=title_font)

    # 副标题
    draw.text((content_x, 310), "Free Online Games",
              fill=BRAND_COLORS["light"], font=subtitle_font)

    # 描述文字
    draw.text((content_x, 380), "Play thousands of games instantly",
              fill=BRAND_COLORS["accent"], font=subtitle_font)
    draw.text((content_x, 430), "No downloads • No registration",
              fill=BRAND_COLORS["light"], font=subtitle_font)

    # 添加游戏图标装饰
    icon_size = 200
    icon_x = width - 280
    icon_y = height // 2 - icon_size // 2

    # 绘制简化的游戏控制器
    controller_width = 220
    controller_height = 140
    controller_x = icon_x - 10
    controller_y = icon_y + 30

    draw.rounded_rectangle(
        [controller_x, controller_y,
         controller_x + controller_width, controller_y + controller_height],
        radius=40,
        fill=BRAND_COLORS["primary"]
    )

    # 十字方向键
    dpad_x = controller_x + 40
    dpad_y = controller_y + 50
    dpad_size = 35
    draw.rectangle([dpad_x + dpad_size//3, dpad_y,
                   dpad_x + 2*dpad_size//3, dpad_y + dpad_size],
                  fill=BRAND_COLORS["dark"])
    draw.rectangle([dpad_x, dpad_y + dpad_size//3,
                   dpad_x + dpad_size, dpad_y + 2*dpad_size//3],
                  fill=BRAND_COLORS["dark"])

    # 按钮组
    button_x = controller_x + controller_width - 70
    button_y = controller_y + 50
    button_r = 12
    button_positions = [
        (button_x, button_y + button_r),      # 左
        (button_x + 2*button_r, button_y),    # 上
        (button_x + 4*button_r, button_y + button_r),  # 右
        (button_x + 2*button_r, button_y + 2*button_r), # 下
    ]

    colors = [BRAND_COLORS["accent"], BRAND_COLORS["light"],
              BRAND_COLORS["accent"], BRAND_COLORS["light"]]

    for (bx, by), color in zip(button_positions, colors):
        draw.ellipse([bx, by, bx + 2*button_r, by + 2*button_r],
                     fill=color, outline=BRAND_COLORS["dark"], width=2)

    return img

def create_app_icon():
    """创建应用图标 - 更简洁的版本"""
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 简单的渐变背景
    padding = 0
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=size // 8,
        fill=BRAND_COLORS["primary"]
    )

    # 中心圆形
    center = size // 2
    circle_radius = size // 3
    draw.ellipse(
        [center - circle_radius, center - circle_radius,
         center + circle_radius, center + circle_radius],
        fill=BRAND_COLORS["light"]
    )

    # 播放三角形
    triangle_size = circle_radius // 1.5
    triangle_offset = triangle_size // 6
    triangle = [
        (center - triangle_size//2 + triangle_offset, center - triangle_size//2),
        (center - triangle_size//2 + triangle_offset, center + triangle_size//2),
        (center + triangle_size//2 + triangle_offset, center),
    ]
    draw.polygon(triangle, fill=BRAND_COLORS["primary"])

    return img

def main():
    """生成所有图标"""
    print("🎮 开始生成 RunGame 图标...")

    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. 生成主 favicon (多种尺寸)
    print("\n📱 生成 Favicon...")
    base_icon = create_favicon(512)

    favicon_sizes = [16, 32, 48, 64, 128, 256, 512]
    for size in favicon_sizes:
        resized = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        filename = f"{OUTPUT_DIR}/favicon-{size}x{size}.png"
        resized.save(filename, 'PNG')
        print(f"  ✓ {filename}")

    # 生成 .ico 文件 (包含多个尺寸)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    ico_images = [base_icon.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]
    ico_images[0].save(
        f"{OUTPUT_DIR}/favicon.ico",
        format='ICO',
        sizes=ico_sizes
    )
    print(f"  ✓ {OUTPUT_DIR}/favicon.ico")

    # 2. 生成 Apple Touch Icon
    print("\n🍎 生成 Apple Touch Icon...")
    apple_icon = base_icon.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(f"{OUTPUT_DIR}/apple-touch-icon.png", 'PNG')
    print(f"  ✓ {OUTPUT_DIR}/apple-touch-icon.png")

    # 3. 生成 Web App Manifest Icons
    print("\n📲 生成 Web App Manifest Icons...")
    manifest_sizes = [192, 512]
    app_icon_base = create_app_icon()

    for size in manifest_sizes:
        resized = app_icon_base.resize((size, size), Image.Resampling.LANCZOS)
        filename = f"{OUTPUT_DIR}/icon-{size}x{size}.png"
        resized.save(filename, 'PNG')
        print(f"  ✓ {filename}")

    # 4. 生成 Open Graph 图片
    print("\n🌐 生成 Open Graph 社交媒体图片...")
    og_image = create_og_image()
    og_image.save(f"{OUTPUT_DIR}/og-image.png", 'PNG')
    print(f"  ✓ {OUTPUT_DIR}/og-image.png")

    # 生成 Twitter Card 图片 (与 OG 相同)
    og_image.save(f"{OUTPUT_DIR}/twitter-image.png", 'PNG')
    print(f"  ✓ {OUTPUT_DIR}/twitter-image.png")

    print("\n✅ 所有图标生成完成！")
    print("\n📋 生成的文件列表:")
    print("  • favicon.ico (16, 32, 48, 64)")
    print("  • favicon-*.png (16x16 到 512x512)")
    print("  • apple-touch-icon.png (180x180)")
    print("  • icon-*.png (192x192, 512x512)")
    print("  • og-image.png (1200x630)")
    print("  • twitter-image.png (1200x630)")

    print("\n💡 下一步:")
    print("  1. 检查生成的图标")
    print("  2. 在网站 metadata 中引用这些图标")
    print("  3. 创建 manifest.json 文件 (如需 PWA 支持)")

if __name__ == "__main__":
    main()
