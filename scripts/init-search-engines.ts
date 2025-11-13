/**
 * 初始化搜索引擎配置
 *
 * 此脚本用于创建初始的搜索引擎配置（IndexNow 和百度）
 * 运行: npx tsx scripts/init-search-engines.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IndexNow API Key (已创建验证文件)
const INDEXNOW_API_KEY = '94bf74fb7885547d58984302f4dff43d7e7a550ed48248865af8b2f566846223'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rungame.online'

async function main() {
  console.log('🚀 开始初始化搜索引擎配置...\n')

  // 1. 创建 IndexNow 配置 (Bing + Yandex)
  console.log('📝 创建 IndexNow 配置...')
  const indexNowConfig = await prisma.searchEngineConfig.upsert({
    where: { slug: 'bing-indexnow' },
    update: {},
    create: {
      name: 'Bing (IndexNow)',
      slug: 'bing-indexnow',
      type: 'indexnow',
      icon: '🔍',
      description: '通过 IndexNow 协议提交到 Bing、Yandex 等搜索引擎',
      apiEndpoint: 'https://api.indexnow.org/indexnow',
      apiKey: INDEXNOW_API_KEY,
      siteUrl: SITE_URL,
      extraConfig: {
        keyLocation: `${SITE_URL}/${INDEXNOW_API_KEY}.txt`,
        batchSize: 100,
        supportedEngines: ['Bing', 'Yandex', 'Seznam.cz', 'Naver']
      },
      isEnabled: true,
      autoSubmit: false,
      sortOrder: 1,
    },
  })
  console.log(`✅ IndexNow 配置已创建: ${indexNowConfig.name}`)

  // 2. 创建百度主动推送配置
  console.log('\n📝 创建百度主动推送配置...')
  const baiduToken = process.env.BAIDU_PUSH_TOKEN || 'YOUR_BAIDU_TOKEN_HERE'
  const baiduConfig = await prisma.searchEngineConfig.upsert({
    where: { slug: 'baidu-push' },
    update: {},
    create: {
      name: '百度主动推送',
      slug: 'baidu-push',
      type: 'baidu',
      icon: '🌐',
      description: '百度站长平台主动推送 API',
      apiEndpoint: 'http://data.zz.baidu.com/urls',
      apiToken: baiduToken,
      siteUrl: 'rungame.online',
      extraConfig: {
        dailyQuota: 500,
        batchSize: 20,
        resetTime: '00:00',
      },
      isEnabled: baiduToken !== 'YOUR_BAIDU_TOKEN_HERE',
      autoSubmit: false,
      sortOrder: 2,
    },
  })
  console.log(`✅ 百度配置已创建: ${baiduConfig.name}`)

  if (baiduToken === 'YOUR_BAIDU_TOKEN_HERE') {
    console.log('⚠️  百度 Token 未配置，请在管理后台更新')
  }

  // 3. 创建 Google Sitemap 配置（仅作记录，无需 API）
  console.log('\n📝 创建 Google Sitemap 配置...')
  const googleConfig = await prisma.searchEngineConfig.upsert({
    where: { slug: 'google-sitemap' },
    update: {},
    create: {
      name: 'Google (Sitemap)',
      slug: 'google-sitemap',
      type: 'google',
      icon: '🔎',
      description: 'Google Search Console Sitemap 提交（自动更新）',
      apiEndpoint: `${SITE_URL}/sitemap.xml`,
      extraConfig: {
        sitemapUrl: `${SITE_URL}/sitemap.xml`,
        searchConsoleUrl: 'https://search.google.com/search-console',
        note: 'Google 不支持 API 主动推送，请手动在 Search Console 提交 Sitemap'
      },
      isEnabled: true,
      autoSubmit: false,
      sortOrder: 3,
    },
  })
  console.log(`✅ Google 配置已创建: ${googleConfig.name}`)

  console.log('\n✨ 搜索引擎配置初始化完成！\n')
  console.log('📌 下一步操作：')
  console.log('1. 如果需要使用百度推送，请在 .env 中配置 BAIDU_PUSH_TOKEN')
  console.log('2. 访问管理后台 /admin/seo-submissions/config 查看配置')
  console.log('3. IndexNow 验证文件已创建: public/' + INDEXNOW_API_KEY + '.txt')
  console.log(`4. Google Sitemap 已自动生成: ${SITE_URL}/sitemap.xml\n`)
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
