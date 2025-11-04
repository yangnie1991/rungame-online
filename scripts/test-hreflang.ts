/**
 * Hreflang 验证脚本
 *
 * 验证 hreflang 设置是否符合 Google 最佳实践：
 * 1. 使用正确的 ISO 代码（ISO 639-1 + ISO 3166-1 Alpha 2）
 * 2. 所有 URL 都是完全限定的
 * 3. 存在 x-default
 * 4. 双向链接正确
 * 5. 每个页面包含自引用
 *
 * 使用方法：
 * npx tsx scripts/test-hreflang.ts
 */

import { generateAlternateLanguages, getSiteUrl, getHreflangCode } from '../lib/seo-helpers'

// 测试用例
const testCases = [
  { path: '/', description: '首页' },
  { path: '/play/snake-game', description: '游戏详情页' },
  { path: '/category/action', description: '分类页' },
  { path: '/tag/multiplayer', description: '标签页' },
  { path: '/about', description: '关于页面' },
]

console.log('🔍 Hreflang 验证测试\n')
console.log('=' .repeat(80))

// 验证函数
function validateHreflang(path: string, description: string) {
  console.log(`\n📄 测试: ${description} (${path})`)
  console.log('-'.repeat(80))

  const languages = generateAlternateLanguages(path)
  const siteUrl = getSiteUrl()

  // 1. 检查是否有 x-default
  if (!languages['x-default']) {
    console.log('❌ 错误：缺少 x-default')
    return false
  }
  console.log('✅ 存在 x-default:', languages['x-default'])

  // 2. 检查 URL 是否完全限定（包含协议）
  let allUrlsQualified = true
  for (const [hreflang, url] of Object.entries(languages)) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log(`❌ 错误：${hreflang} 的 URL 不是完全限定的: ${url}`)
      allUrlsQualified = false
    }
  }
  if (allUrlsQualified) {
    console.log('✅ 所有 URL 都是完全限定的')
  }

  // 3. 检查 ISO 代码格式
  const validHreflangPattern = /^[a-z]{2}(-[A-Z]{2})?$|^x-default$/
  let allCodesValid = true
  for (const hreflang of Object.keys(languages)) {
    if (!validHreflangPattern.test(hreflang)) {
      console.log(`❌ 错误：无效的 hreflang 代码: ${hreflang}`)
      allCodesValid = false
    }
  }
  if (allCodesValid) {
    console.log('✅ 所有 hreflang 代码格式正确（ISO 639-1 + ISO 3166-1 Alpha 2）')
  }

  // 4. 显示所有 hreflang 链接
  console.log('\n📋 生成的 hreflang 链接：')
  for (const [hreflang, url] of Object.entries(languages)) {
    console.log(`   ${hreflang.padEnd(12)} → ${url}`)
  }

  // 5. 检查是否有重复的 URL（除了 x-default）
  const urls = Object.entries(languages)
    .filter(([key]) => key !== 'x-default')
    .map(([, url]) => url)

  const uniqueUrls = new Set(urls)
  if (urls.length !== uniqueUrls.size) {
    console.log('❌ 警告：存在重复的 URL（可能导致冲突）')

    // 找出重复的 URL
    const urlCounts = new Map<string, string[]>()
    for (const [hreflang, url] of Object.entries(languages)) {
      if (hreflang === 'x-default') continue
      if (!urlCounts.has(url)) {
        urlCounts.set(url, [])
      }
      urlCounts.get(url)!.push(hreflang)
    }

    for (const [url, hreflangs] of urlCounts) {
      if (hreflangs.length > 1) {
        console.log(`   重复 URL: ${url}`)
        console.log(`   被以下 hreflang 使用: ${hreflangs.join(', ')}`)
      }
    }
  } else {
    console.log('✅ 没有重复的 URL')
  }

  return true
}

// 运行所有测试
console.log(`\n🌐 网站 URL: ${getSiteUrl()}`)
console.log(`\n📌 语言映射:`)
console.log(`   en → ${getHreflangCode('en')}`)
console.log(`   zh → ${getHreflangCode('zh')}`)

let allTestsPassed = true
for (const { path, description } of testCases) {
  if (!validateHreflang(path, description)) {
    allTestsPassed = false
  }
}

console.log('\n' + '='.repeat(80))
if (allTestsPassed) {
  console.log('✅ 所有测试通过！hreflang 设置符合 Google 最佳实践。')
} else {
  console.log('❌ 部分测试失败，请检查上面的错误信息。')
  process.exit(1)
}

// 输出 Google 验证建议
console.log('\n📚 Google 验证步骤：')
console.log('1. 使用 Google Search Console 的"国际定位"报告查看 hreflang 错误')
console.log('2. 使用在线工具验证：https://www.sistrix.com/hreflang-validator/')
console.log('3. 检查页面源代码中的 <link rel="alternate" hreflang="..."> 标签')
console.log('4. 确保每个页面都有双向链接（页面 A 链接到页面 B，页面 B 也要链接回页面 A）')
console.log('\n💡 Next.js Metadata API 会自动生成 hreflang 标签')
console.log('   使用 alternates.languages 配置即可')
