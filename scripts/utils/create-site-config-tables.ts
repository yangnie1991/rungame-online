import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始创建网站配置表...')

  try {
    // 使用原始 SQL 创建表
    await prisma.$executeRawUnsafe(`
      -- 创建网站配置表
      CREATE TABLE IF NOT EXISTS "site_configs" (
          "id" TEXT NOT NULL,
          "site_name" TEXT NOT NULL,
          "site_description" TEXT,
          "site_url" TEXT NOT NULL,
          "logo_url" TEXT,
          "favicon_url" TEXT,
          "og_image_url" TEXT,
          "contact_email" TEXT,
          "support_email" TEXT,
          "social_links" JSONB DEFAULT '{}',
          "default_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "twitter_handle" TEXT,
          "google_analytics_id" TEXT,
          "google_adsense_id" TEXT,
          "custom_scripts" JSONB DEFAULT '{}',
          "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
          "enable_comments" BOOLEAN NOT NULL DEFAULT false,
          "enable_ratings" BOOLEAN NOT NULL DEFAULT true,
          "extra_config" JSONB DEFAULT '{}',
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "site_configs_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('✅ site_configs 表创建成功')

    await prisma.$executeRawUnsafe(`
      -- 创建网站配置翻译表
      CREATE TABLE IF NOT EXISTS "site_config_translations" (
          "id" TEXT NOT NULL,
          "site_config_id" TEXT NOT NULL,
          "locale" TEXT NOT NULL,
          "siteName" TEXT NOT NULL,
          "siteDescription" TEXT,
          "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "site_config_translations_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('✅ site_config_translations 表创建成功')

    // 创建唯一索引
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "site_config_translations_site_config_id_locale_key"
      ON "site_config_translations"("site_config_id", "locale");
    `)

    console.log('✅ 唯一索引创建成功')

    // 创建索引
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "site_config_translations_locale_idx"
      ON "site_config_translations"("locale");
    `)

    console.log('✅ 索引创建成功')

    // 添加外键（如果不存在）
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'site_config_translations_site_config_id_fkey'
        ) THEN
          ALTER TABLE "site_config_translations"
          ADD CONSTRAINT "site_config_translations_site_config_id_fkey"
          FOREIGN KEY ("site_config_id") REFERENCES "site_configs"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    console.log('✅ 外键约束创建成功')

    // 检查是否已有配置
    const existing = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "site_configs"
    `

    if (Number(existing[0].count) === 0) {
      console.log('📝 插入默认配置...')

      // 生成 ID
      const configId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // 插入默认配置
      await prisma.$executeRawUnsafe(`
        INSERT INTO "site_configs" (
          "id",
          "site_name",
          "site_description",
          "site_url",
          "logo_url",
          "favicon_url",
          "og_image_url",
          "contact_email",
          "support_email",
          "social_links",
          "default_keywords",
          "twitter_handle",
          "google_analytics_id",
          "google_adsense_id",
          "custom_scripts",
          "maintenance_mode",
          "enable_comments",
          "enable_ratings",
          "extra_config",
          "created_at",
          "updated_at"
        ) VALUES (
          $1,
          'RunGame',
          'Play thousands of free online games - action, puzzle, sports and more! No downloads required.',
          'https://rungame.online',
          '/assets/images/logo.png',
          '/favicon.ico',
          '/assets/images/og-image.png',
          'contact@rungame.online',
          'support@rungame.online',
          '{"twitter": "https://twitter.com/rungame", "facebook": "https://facebook.com/rungame"}',
          ARRAY['free online games', 'browser games', 'no download games', 'play games online', 'RunGame'],
          '@rungame',
          'G-DXC4W78DF6',
          'ca-pub-1239281249435423',
          '{}',
          false,
          false,
          true,
          '{}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `, configId)

      console.log('✅ 默认配置插入成功')

      // 插入中文翻译
      const translationId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      await prisma.$executeRawUnsafe(`
        INSERT INTO "site_config_translations" (
          "id",
          "site_config_id",
          "locale",
          "siteName",
          "siteDescription",
          "keywords",
          "created_at",
          "updated_at"
        ) VALUES (
          $1,
          $2,
          'zh',
          'RunGame - 免费在线游戏',
          '畅玩数千款免费在线游戏 - 动作、益智、体育等！无需下载。',
          ARRAY['免费在线游戏', '网页游戏', '无需下载游戏', '在线玩游戏', 'RunGame'],
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `, translationId, configId)

      console.log('✅ 中文翻译插入成功')
    } else {
      console.log('ℹ️  配置已存在，跳过插入')
    }

    console.log('\n🎉 网站配置表迁移完成！')
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
