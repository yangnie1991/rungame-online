import {
  shouldExcludeFromI18n,
  ROOT_STATIC_FILES,
  isRootStaticFile,
  isStaticDirectory,
  EXCLUDED_PATH_PREFIXES,
} from '../lib/static-files'

const testCases = [
  // IndexNow API Key 文件
  { path: '/e47fc345ed8842d1bcea8be9991aab82.txt', expected: true, description: 'IndexNow API Key 文件（32位）' },
  { path: '/94bf74fb7885547d58984302f4dff43d7e7a550ed48248865af8b2f566846223.txt', expected: true, description: 'IndexNow API Key 文件（64位）' },

  // 其他根目录文件
  { path: '/robots.txt', expected: true, description: 'robots.txt' },
  { path: '/sitemap.xml', expected: true, description: 'sitemap.xml' },
  { path: '/favicon.ico', expected: true, description: 'favicon.ico' },

  // 不应该排除的路径
  { path: '/zh/games', expected: false, description: '用户路由' },
  { path: '/en/play/game', expected: false, description: '用户路由' },
  { path: '/test.txt', expected: false, description: '非十六进制的txt文件' },

  // 应该排除的路径
  { path: '/api/games', expected: true, description: 'API 路由' },
  { path: '/admin/games', expected: true, description: '管理后台' },
  { path: '/assets/icons/logo.png', expected: true, description: '静态资源' },
]

console.log('\n=== 静态文件排除规则测试 ===\n')

let passCount = 0
let failCount = 0

for (const testCase of testCases) {
  const result = shouldExcludeFromI18n(testCase.path)
  const passed = result === testCase.expected

  if (passed) {
    passCount++
    console.log(`✅ ${testCase.description}`)
    console.log(`   路径: ${testCase.path}`)
    console.log(`   结果: ${result ? '排除' : '不排除'} (预期: ${testCase.expected ? '排除' : '不排除'})`)
  } else {
    failCount++
    console.log(`❌ ${testCase.description}`)
    console.log(`   路径: ${testCase.path}`)
    console.log(`   结果: ${result ? '排除' : '不排除'} (预期: ${testCase.expected ? '排除' : '不排除'})`)

    // 添加调试信息
    console.log(`\n   🔍 调试信息:`)

    // 检查路径前缀
    const matchesPrefix = EXCLUDED_PATH_PREFIXES.some(prefix => testCase.path.startsWith(prefix))
    console.log(`   路径前缀匹配: ${matchesPrefix}`)
    if (matchesPrefix) {
      console.log(`     匹配的前缀: ${EXCLUDED_PATH_PREFIXES.filter(p => testCase.path.startsWith(p)).join(', ')}`)
    }

    // 检查静态目录
    const matchesStaticDir = isStaticDirectory(testCase.path)
    console.log(`   静态目录匹配: ${matchesStaticDir}`)

    // 检查根目录静态文件
    const matchesRootStatic = isRootStaticFile(testCase.path)
    console.log(`   根目录静态文件匹配: ${matchesRootStatic}`)
    if (matchesRootStatic) {
      console.log(`   匹配的规则:`)
      for (let i = 0; i < ROOT_STATIC_FILES.length; i++) {
        const pattern = ROOT_STATIC_FILES[i]
        if (pattern.test(testCase.path)) {
          console.log(`     [${i}] ${pattern}`)
        }
      }
    }
  }
  console.log('')
}

console.log(`\n=== 测试结果 ===`)
console.log(`✅ 通过: ${passCount}`)
console.log(`❌ 失败: ${failCount}`)
console.log(`📊 总计: ${testCases.length}`)

if (failCount > 0) {
  process.exit(1)
}
