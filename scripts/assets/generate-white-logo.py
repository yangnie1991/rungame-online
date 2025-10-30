#!/usr/bin/env python3
"""
生成白色版本的 Logo

将现有的彩色 logo PNG 转换为白色版本，用于在深色背景上显示。
保留透明度通道，只修改 RGB 值为白色。
"""

from PIL import Image
import os

# 输入和输出文件路径
INPUT_FILE = 'public/logo/logo-rungame-512.png'
OUTPUT_FILE = 'public/logo/logo-rungame-white-512.png'

def generate_white_logo():
    """生成白色版本的 logo"""

    # 检查输入文件是否存在
    if not os.path.exists(INPUT_FILE):
        print(f"❌ 错误: 输入文件不存在: {INPUT_FILE}")
        return False

    print(f"📖 读取原始 logo: {INPUT_FILE}")

    # 打开原始图片
    img = Image.open(INPUT_FILE).convert('RGBA')

    # 获取图片数据
    width, height = img.size
    pixels = img.load()

    print(f"📐 图片尺寸: {width}×{height}")
    print(f"🎨 转换颜色为白色...")

    # 创建新图片
    white_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    white_pixels = white_img.load()

    # 遍历每个像素
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # 如果像素不是完全透明的，将其 RGB 改为白色，保留透明度
            if a > 0:
                white_pixels[x, y] = (255, 255, 255, a)
            else:
                white_pixels[x, y] = (0, 0, 0, 0)

    # 保存白色版本
    print(f"💾 保存白色 logo: {OUTPUT_FILE}")
    white_img.save(OUTPUT_FILE, 'PNG', optimize=True)

    # 获取文件大小
    file_size = os.path.getsize(OUTPUT_FILE)
    file_size_kb = file_size / 1024

    print(f"✅ 成功生成白色 logo!")
    print(f"📦 文件大小: {file_size_kb:.1f}KB")
    print(f"📂 文件位置: {OUTPUT_FILE}")

    return True

if __name__ == '__main__':
    print("=" * 60)
    print("🎨 生成白色版本 Logo")
    print("=" * 60)

    success = generate_white_logo()

    if success:
        print("\n" + "=" * 60)
        print("✨ 完成！")
        print("=" * 60)
        print("\n使用方法:")
        print("1. 在 OG 图片路由中使用:")
        print("   const logoUrl = `${protocol}://${host}/logo/logo-rungame-white-512.png`")
        print("\n2. 查看效果:")
        print("   打开 public/logo/logo-rungame-white-512.png")
    else:
        print("\n❌ 生成失败！")
        exit(1)
