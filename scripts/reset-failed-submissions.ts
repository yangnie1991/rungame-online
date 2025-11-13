import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 重置所有失败的 URL 提交状态
 *
 * 将失败的提交状态重置为 null（未提交），
 * 然后可以在管理后台重新批量推送
 *
 * 用法:
 *   npx tsx scripts/reset-failed-submissions.ts               # 查看失败的提交
 *   npx tsx scripts/reset-failed-submissions.ts --confirm     # 重置状态
 */
async function resetFailedSubmissions() {
  const args = process.argv.slice(2)
  const confirmed = args.includes('--confirm')

  // 查询所有失败的提交
  const failedSubmissions = await prisma.urlSubmission.findMany({
    where: {
      bingSubmitStatus: 'FAILED',
    },
    orderBy: {
      bingSubmittedAt: 'desc',
    },
  })

  if (failedSubmissions.length === 0) {
    console.log('✅ 没有失败的提交需要重置')
    await prisma.$disconnect()
    return
  }

  console.log(`\n📊 找到 ${failedSubmissions.length} 个失败的提交\n`)

  // 按错误类型分组统计
  const errorGroups = new Map<string, number>()
  failedSubmissions.forEach(s => {
    const error = s.bingSubmitStatusMessage || 'Unknown'
    errorGroups.set(error, (errorGroups.get(error) || 0) + 1)
  })

  console.log('=== 错误类型统计 ===')
  errorGroups.forEach((count, error) => {
    const shortError = error.length > 100 ? error.substring(0, 97) + '...' : error
    console.log(`${count} 个: ${shortError}`)
  })

  console.log('\n=== 示例 URL（前 5 个）===')
  failedSubmissions.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.url}`)
    console.log(`   推送时间: ${s.bingSubmittedAt?.toLocaleString('zh-CN') || 'N/A'}`)
    console.log(`   HTTP 状态: ${s.bingSubmitHttpStatus || 'N/A'}`)
    console.log(`   错误: ${s.bingSubmitStatusMessage}`)
  })

  if (!confirmed) {
    console.log('\n⚠️  预览模式')
    console.log('要重置这些失败的 URL 状态，请运行:')
    console.log('  npx tsx scripts/reset-failed-submissions.ts --confirm')
    console.log('')
    console.log('ℹ️  重置后的状态:')
    console.log('  bingSubmitStatus: null (未提交)')
    console.log('  bingSubmitStatusMessage: null')
    console.log('  bingSubmitHttpStatus: null')
    console.log('  bingSubmitResponseBody: null')
    console.log('  bingSubmitResponseTime: null')
    console.log('  bingSubmittedAt: null')
    console.log('')
    console.log('✅ 重置后，您可以:')
    console.log('  1. 在管理后台 /admin/seo-submissions/bing 页面')
    console.log('  2. 选中需要推送的 URL')
    console.log('  3. 点击"批量推送"按钮')
    console.log('  4. 系统会使用修复后的配置重新推送')
    await prisma.$disconnect()
    return
  }

  // 开始重置
  console.log('\n🔄 开始重置状态...\n')

  const result = await prisma.urlSubmission.updateMany({
    where: {
      bingSubmitStatus: 'FAILED',
    },
    data: {
      bingSubmitStatus: null,
      bingSubmitStatusMessage: null,
      bingSubmitHttpStatus: null,
      bingSubmitResponseBody: null,
      bingSubmitResponseTime: null,
      bingSubmittedAt: null,
    },
  })

  console.log(`✅ 成功重置 ${result.count} 个 URL 的提交状态\n`)

  console.log('='.repeat(50))
  console.log('\n📋 下一步操作:\n')
  console.log('1. 访问管理后台: http://localhost:3000/admin/seo-submissions/bing')
  console.log('2. 在"URL 推送列表"标签页，筛选"未提交"状态')
  console.log('3. 全选或选中需要的 URL')
  console.log('4. 点击"批量推送"按钮')
  console.log('5. 系统会使用修复后的 IndexNow 配置进行推送')
  console.log('')
  console.log('💡 提示:')
  console.log('- 修复后的配置已移除 keyLocation 参数')
  console.log('- API Key 文件位于: public/e47fc345ed8842d1bcea8be9991aab82.txt')
  console.log('- 推送应该能成功，状态会更新为 SUCCESS')
  console.log('')
  console.log('📊 查看推送结果:')
  console.log('  npx tsx scripts/check-url-submission-status.ts')

  await prisma.$disconnect()
}

resetFailedSubmissions().catch(console.error)
