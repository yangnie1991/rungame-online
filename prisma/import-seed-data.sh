#!/bin/bash

# RunGame 数据库初始化脚本
# 用途：快速导入初始数据到 Supabase 数据库

echo "🌱 开始导入初始化数据..."
echo ""

# 数据库连接信息
DB_HOST="aws-1-us-east-1.pooler.supabase.com"
DB_PORT="5432"
DB_USER="postgres.kmwfklazjqxffjakpomg"
DB_NAME="postgres"
DB_PASSWORD="GzhKVeHrAVyZnu33"

# 导入 SQL 文件
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < prisma/seed-data.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据导入成功！"
    echo ""
    echo "📊 已导入数据："
    echo "   - 语言: 2 个 (en, zh)"
    echo "   - 管理员: 1 个"
    echo "   - 导入平台: 1 个 (GamePix)"
    echo "   - 分类: 152 个"
    echo "   - 页面类型: 4 个 (最多人游玩、最新游戏、精选游戏、趋势游戏)"
    echo ""
    echo "🔑 管理员登录信息："
    echo "   邮箱: admin@rungame.online"
    echo "   密码: admin123"
else
    echo ""
    echo "❌ 数据导入失败，请检查错误信息"
    exit 1
fi
