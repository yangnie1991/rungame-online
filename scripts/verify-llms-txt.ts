/**
 * 验证 llms.txt 文件格式
 *
 * 根据 llmstxt.org 规范检查文件结构
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🤖 验证 llms.txt 文件格式\n')
console.log('=' .repeat(80))

const llmsTxtPath = join(process.cwd(), 'public', 'llms.txt')

// 检查文件是否存在
if (!existsSync(llmsTxtPath)) {
  console.log('❌ 错误：找不到 public/llms.txt 文件')
  process.exit(1)
}

const content = readFileSync(llmsTxtPath, 'utf-8')
const lines = content.split('\n')

console.log(`\n✅ 文件存在: ${llmsTxtPath}`)
console.log(`📝 文件大小: ${(content.length / 1024).toFixed(2)} KB`)
console.log(`📄 总行数: ${lines.length}\n`)

console.log('=' .repeat(80))
console.log('📋 规范检查')
console.log('=' .repeat(80))

let hasH1 = false
let hasBlockquote = false
let hasSections = 0
let hasLinks = 0
let hasOptionalSection = false
let errors: string[] = []
let warnings: string[] = []

// 检查第一行是否是 H1
if (lines[0].startsWith('# ')) {
  hasH1 = true
  console.log(`✅ H1 标题（必需）: ${lines[0].substring(2)}`)
} else {
  errors.push('缺少 H1 标题（第一行必须以 # 开头）')
  console.log('❌ 缺少 H1 标题')
}

// 检查内容
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()

  // 检查 blockquote
  if (line.startsWith('> ')) {
    hasBlockquote = true
  }

  // 检查 H2 section
  if (line.startsWith('## ')) {
    hasSections++
    const sectionTitle = line.substring(3)
    if (sectionTitle === 'Optional') {
      hasOptionalSection = true
    }
  }

  // 检查 markdown links
  if (line.match(/^\s*-\s*\[.*\]\(.*\)/)) {
    hasLinks++
  }
}

if (hasBlockquote) {
  console.log('✅ Blockquote 描述（推荐）: 已包含')
} else {
  warnings.push('建议添加 blockquote (>) 描述项目')
  console.log('⚠️  Blockquote 描述（推荐）: 未包含')
}

console.log(`✅ H2 章节数量: ${hasSections}`)
console.log(`✅ Markdown 链接数量: ${hasLinks}`)

if (hasOptionalSection) {
  console.log('✅ Optional 章节: 已包含（推荐）')
} else {
  warnings.push('建议添加 Optional 章节用于次要资源')
  console.log('⚠️  Optional 章节: 未包含（推荐）')
}

console.log('\n' + '=' .repeat(80))
console.log('📊 内容分析')
console.log('=' .repeat(80))

// 统计各个章节
const sections = content.match(/^## .+$/gm)
if (sections) {
  console.log(`\n发现 ${sections.length} 个章节：`)
  sections.forEach((section, index) => {
    console.log(`  ${index + 1}. ${section.substring(3)}`)
  })
}

// 检查链接格式
console.log('\n链接格式验证：')
const linkPattern = /\[([^\]]+)\]\(([^)]+)\)(?:: (.+))?/g
let match
let linkCount = 0
let linksWithDescription = 0

while ((match = linkPattern.exec(content)) !== null) {
  linkCount++
  if (match[3]) {
    linksWithDescription++
  }
}

console.log(`  总链接数: ${linkCount}`)
console.log(`  带描述的链接: ${linksWithDescription}`)
console.log(`  描述率: ${((linksWithDescription / linkCount) * 100).toFixed(1)}%`)

if (linksWithDescription / linkCount < 0.5) {
  warnings.push('建议为更多链接添加描述（: 后面跟描述文字）')
}

console.log('\n' + '=' .repeat(80))
console.log('🔍 llmstxt.org 规范对照')
console.log('=' .repeat(80))

const requirements = [
  {
    rule: '必需：H1 标题（项目名称）',
    status: hasH1,
    description: '第一行必须是 H1 (#) 标题'
  },
  {
    rule: '推荐：Blockquote 描述',
    status: hasBlockquote,
    description: '使用 > 提供项目简短摘要'
  },
  {
    rule: '推荐：H2 章节组织',
    status: hasSections > 0,
    description: '使用 ## 组织内容为多个章节'
  },
  {
    rule: '必需：Markdown 链接列表',
    status: hasLinks > 0,
    description: '每个章节包含 [标题](URL) 格式的链接'
  },
  {
    rule: '推荐：链接描述',
    status: linksWithDescription > 0,
    description: '链接后使用 : 添加描述文字'
  },
  {
    rule: '推荐：Optional 章节',
    status: hasOptionalSection,
    description: '用于次要资源，在上下文受限时可跳过'
  }
]

console.log()
requirements.forEach(req => {
  const icon = req.status ? '✅' : (req.rule.includes('必需') ? '❌' : '⚠️ ')
  console.log(`${icon} ${req.rule}`)
  console.log(`   ${req.description}`)
})

console.log('\n' + '=' .repeat(80))
console.log('📈 最终评估')
console.log('=' .repeat(80))

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n🎉 完美！llms.txt 文件完全符合规范！')
} else {
  if (errors.length > 0) {
    console.log('\n❌ 发现错误：')
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  改进建议：')
    warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`)
    })
  }
}

console.log('\n' + '=' .repeat(80))
console.log('🔗 访问方式')
console.log('=' .repeat(80))

console.log(`
开发环境:
  http://localhost:3000/llms.txt

生产环境:
  https://rungame.online/llms.txt

测试建议:
  1. 在浏览器中访问 /llms.txt 确认可访问
  2. 使用 curl 或 wget 下载并检查格式
  3. 向 Claude 或其他 LLM 提供 URL 测试可读性
  4. 确保所有链接指向正确的文档位置
`)

console.log('=' .repeat(80))
console.log('💡 llms.txt 的作用')
console.log('=' .repeat(80))

console.log(`
llms.txt 文件的设计目的：

1. 📚 为 AI 助手提供项目概览
   - 快速了解项目结构和核心功能
   - 找到相关文档和 API 参考
   - 无需解析复杂的 HTML 页面

2. 🎯 优化上下文窗口使用
   - 提供简洁的导航和链接
   - AI 可以根据需要获取详细文档
   - 避免一次性加载所有内容

3. 🔍 改善开发者体验
   - Claude Code、Cursor 等工具可以利用此文件
   - 快速定位需要的文档和代码
   - 提高协作效率

4. 📖 标准化文档发现
   - 类似 robots.txt 和 sitemap.xml
   - 为 AI 时代设计的文档标准
   - 越来越多的项目开始采用
`)

console.log('=' .repeat(80))
console.log('参考资源')
console.log('=' .repeat(80))

console.log(`
- llmstxt.org 官网: https://llmstxt.org/
- GitHub 仓库: https://github.com/AnswerDotAI/llms-txt
- 详细指南: https://akramhossain.com/ultimate-guide-to-llms-txt/
`)

if (errors.length > 0) {
  process.exit(1)
}
