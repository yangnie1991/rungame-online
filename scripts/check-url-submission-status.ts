import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 查询 URL 提交状态
 *
 * 用法:
 *   npx tsx scripts/check-url-submission-status.ts                    # 查看所有提交记录统计
 *   npx tsx scripts/check-url-submission-status.ts <url>              # 查询特定 URL
 *   npx tsx scripts/check-url-submission-status.ts --recent           # 查看最近 10 次提交
 *   npx tsx scripts/check-url-submission-status.ts --failed           # 查看所有失败的提交
 */
async function checkSubmissionStatus() {
  const args = process.argv.slice(2)
  const url = args.find(arg => !arg.startsWith('--'))
  const showRecent = args.includes('--recent')
  const showFailed = args.includes('--failed')

  // 查询特定 URL
  if (url) {
    console.log(`\n🔍 查询 URL: ${url}\n`)

    const submission = await prisma.urlSubmission.findFirst({
      where: { url },
    })

    if (!submission) {
      console.log('❌ 未找到此 URL 的提交记录')
      return
    }

    console.log('=== 基本信息 ===')
    console.log(`URL: ${submission.url}`)
    console.log(`类型: ${submission.urlType}`)
    console.log(`语言: ${submission.locale}`)

    console.log('\n=== Bing 推送状态 ===')
    console.log(`推送状态: ${getStatusEmoji(submission.bingSubmitStatus)} ${submission.bingSubmitStatus}`)
    console.log(`推送时间: ${submission.bingSubmittedAt ? submission.bingSubmittedAt.toLocaleString('zh-CN') : '未推送'}`)
    console.log(`HTTP 状态: ${submission.bingSubmitHttpStatus || 'N/A'}`)
    console.log(`响应时间: ${submission.bingSubmitResponseTime ? submission.bingSubmitResponseTime + 'ms' : 'N/A'}`)

    if (submission.bingSubmitStatusMessage) {
      console.log(`状态消息: ${submission.bingSubmitStatusMessage}`)
    }

    console.log('\n=== Bing 收录状态 ===')
    const indexStatus = submission.indexedByBing === true ? '✅ 已收录' :
                        submission.indexedByBing === false ? '❌ 未收录' : '⭕ 未检查'
    console.log(`收录状态: ${indexStatus}`)
    console.log(`最后检查: ${submission.bingLastCheckAt ? submission.bingLastCheckAt.toLocaleString('zh-CN') : '未检查'}`)

    if (submission.bingCheckMessage) {
      console.log(`收录消息: ${submission.bingCheckMessage}`)
    }

    if (submission.bingIndexStatusRaw) {
      console.log(`详细信息: ${JSON.stringify(submission.bingIndexStatusRaw, null, 2)}`)
    }

    console.log('\n=== 时间线 ===')
    console.log(`创建时间: ${submission.createdAt.toLocaleString('zh-CN')}`)
    console.log(`更新时间: ${submission.updatedAt.toLocaleString('zh-CN')}`)

    return
  }

  // 查看最近提交
  if (showRecent) {
    console.log('\n📋 最近 10 次提交:\n')

    const recent = await prisma.urlSubmission.findMany({
      where: {
        bingSubmittedAt: { not: null },
      },
      orderBy: { bingSubmittedAt: 'desc' },
      take: 10,
    })

    if (recent.length === 0) {
      console.log('暂无提交记录')
      return
    }

    console.log('序号 | 状态 | URL | 推送时间 | HTTP状态')
    console.log('-----|------|-----|----------|----------')

    recent.forEach((s, i) => {
      const status = getStatusEmoji(s.bingSubmitStatus)
      const url = s.url.length > 50 ? s.url.substring(0, 47) + '...' : s.url
      const time = s.bingSubmittedAt?.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) || 'N/A'
      const httpStatus = s.bingSubmitHttpStatus || 'N/A'

      console.log(`${i + 1}    | ${status}    | ${url} | ${time} | ${httpStatus}`)
    })

    return
  }

  // 查看失败的提交
  if (showFailed) {
    console.log('\n❌ 失败的提交:\n')

    const failed = await prisma.urlSubmission.findMany({
      where: {
        bingSubmitStatus: 'FAILED',
      },
      orderBy: { bingSubmittedAt: 'desc' },
    })

    if (failed.length === 0) {
      console.log('✅ 没有失败的提交')
      return
    }

    console.log(`找到 ${failed.length} 个失败的提交:\n`)

    failed.forEach((s, i) => {
      console.log(`${i + 1}. ${s.url}`)
      console.log(`   推送时间: ${s.bingSubmittedAt?.toLocaleString('zh-CN') || 'N/A'}`)
      console.log(`   HTTP 状态: ${s.bingSubmitHttpStatus || 'N/A'}`)
      console.log(`   错误消息: ${s.bingSubmitStatusMessage || 'N/A'}`)
      console.log('')
    })

    return
  }

  // 默认：显示统计信息
  console.log('\n📊 URL 提交状态统计\n')

  const stats = await prisma.urlSubmission.groupBy({
    by: ['bingSubmitStatus'],
    _count: true,
  })

  console.log('=== 推送状态分布 ===')
  stats.forEach(stat => {
    const emoji = getStatusEmoji(stat.bingSubmitStatus)
    console.log(`${emoji} ${stat.bingSubmitStatus}: ${stat._count} 个`)
  })

  // 统计收录状态（使用 indexedByBing 字段）
  const totalSubmissions = await prisma.urlSubmission.count()
  const indexed = await prisma.urlSubmission.count({
    where: { indexedByBing: true },
  })
  const notIndexed = await prisma.urlSubmission.count({
    where: { indexedByBing: false },
  })
  const notChecked = totalSubmissions - indexed - notIndexed

  console.log('\n=== 收录状态分布 ===')
  if (indexed > 0) console.log(`✅ 已收录: ${indexed} 个`)
  if (notIndexed > 0) console.log(`❌ 未收录: ${notIndexed} 个`)
  if (notChecked > 0) console.log(`⭕ 未检查: ${notChecked} 个`)

  // 统计最近推送情况
  const recentSuccess = await prisma.urlSubmission.count({
    where: {
      bingSubmitStatus: 'SUCCESS',
      bingSubmittedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近 24 小时
      },
    },
  })

  const recentFailed = await prisma.urlSubmission.count({
    where: {
      bingSubmitStatus: 'FAILED',
      bingSubmittedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })

  console.log('\n=== 最近 24 小时 ===')
  console.log(`✅ 成功: ${recentSuccess} 个`)
  console.log(`❌ 失败: ${recentFailed} 个`)

  console.log('\n💡 提示:')
  console.log('  查询特定 URL:  npx tsx scripts/check-url-submission-status.ts <url>')
  console.log('  查看最近提交:  npx tsx scripts/check-url-submission-status.ts --recent')
  console.log('  查看失败记录:  npx tsx scripts/check-url-submission-status.ts --failed')

  await prisma.$disconnect()
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return '✅'
    case 'FAILED':
      return '❌'
    case 'PENDING':
      return '⏳'
    case 'NOT_SUBMITTED':
      return '⭕'
    default:
      return '❓'
  }
}

function getIndexStatusEmoji(status: string): string {
  switch (status) {
    case 'INDEXED':
      return '✅'
    case 'NOT_INDEXED':
      return '❌'
    case 'UNKNOWN':
      return '❓'
    default:
      return '⭕'
  }
}

checkSubmissionStatus().catch(console.error)
