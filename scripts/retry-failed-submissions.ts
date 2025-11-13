import { PrismaClient } from '@prisma/client'
import { submitUrls as submitToIndexNow } from '../lib/seo-submissions/indexnow'

const prisma = new PrismaClient()

/**
 * 重新提交所有失败的 URL
 *
 * 用法:
 *   npx tsx scripts/retry-failed-submissions.ts               # 查看失败的提交
 *   npx tsx scripts/retry-failed-submissions.ts --confirm     # 重新提交
 */
async function retryFailedSubmissions() {
  const args = process.argv.slice(2)
  const confirmed = args.includes('--confirm')

  // 1. 获取 IndexNow 配置
  const config = await prisma.searchEngineConfig.findFirst({
    where: { type: 'indexnow' },
  })

  if (!config) {
    console.log('❌ 未找到 IndexNow 配置')
    return
  }

  // 2. 查询所有失败的提交
  const failedSubmissions = await prisma.urlSubmission.findMany({
    where: {
      bingSubmitStatus: 'FAILED',
    },
    orderBy: {
      bingSubmittedAt: 'desc',
    },
  })

  if (failedSubmissions.length === 0) {
    console.log('✅ 没有失败的提交需要重试')
    return
  }

  console.log(`\n📊 找到 ${failedSubmissions.length} 个失败的提交\n`)

  // 3. 按错误类型分组统计
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
  })

  if (!confirmed) {
    console.log('\n⚠️  预览模式')
    console.log('要重新提交这些失败的 URL，请运行:')
    console.log('  npx tsx scripts/retry-failed-submissions.ts --confirm')
    console.log('')
    console.log('⚠️  注意事项:')
    console.log('1. 确保 IndexNow 配置已正确（已移除 keyLocation）')
    console.log('2. 确保 API Key 文件已创建在 public/ 目录')
    console.log('3. 重新提交将批量推送所有失败的 URL')
    console.log('4. 推送将分批进行，每批 100 个 URL')
    await prisma.$disconnect()
    return
  }

  // 4. 开始重新提交
  console.log('\n🚀 开始重新提交...\n')

  const urls = failedSubmissions.map(s => s.url)
  const batchSize = 100

  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  // 分批提交
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchSubmissions = failedSubmissions.slice(i, i + batchSize)

    console.log(`\n📦 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} (${batch.length} 个 URL)`)

    // 先更新状态为 PENDING
    await prisma.urlSubmission.updateMany({
      where: {
        id: { in: batchSubmissions.map(s => s.id) },
      },
      data: {
        bingSubmitStatus: 'PENDING',
      },
    })

    // 调用 IndexNow API
    try {
      // 构造 IndexNow 配置（不包含 keyLocation）
      const indexNowConfig = {
        apiKey: config.apiKey!,
        keyLocation: '', // 空字符串，让 IndexNow 自动查找
        host: new URL(config.siteUrl!).hostname,
        apiEndpoint: config.apiEndpoint || undefined,
      }

      const results = await submitToIndexNow(batch, indexNowConfig, batchSize)

      // 更新每个 URL 的状态
      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        const submission = batchSubmissions[j]

        await prisma.urlSubmission.update({
          where: { id: submission.id },
          data: {
            bingSubmitStatus: result.success ? 'SUCCESS' : 'FAILED',
            bingSubmitStatusMessage: result.message,
            bingSubmitHttpStatus: result.statusCode,
            bingSubmitResponseTime: result.responseTime,
            bingSubmittedAt: new Date(),
          },
        })

        if (result.success) {
          successCount++
          console.log(`  ✅ ${submission.url}`)
        } else {
          failedCount++
          console.log(`  ❌ ${submission.url}`)
          console.log(`     错误: ${result.message}`)
          errors.push(`${submission.url}: ${result.message}`)
        }
      }
    } catch (error) {
      console.error(`  ❌ 批次提交失败:`, error)
      failedCount += batch.length

      // 更新状态为 FAILED
      await prisma.urlSubmission.updateMany({
        where: {
          id: { in: batchSubmissions.map(s => s.id) },
        },
        data: {
          bingSubmitStatus: 'FAILED',
          bingSubmitStatusMessage: error instanceof Error ? error.message : String(error),
        },
      })
    }

    // 批次之间添加延迟
    if (i + batchSize < urls.length) {
      console.log('  ⏳ 等待 2 秒...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // 5. 输出结果
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 重新提交结果\n')
  console.log(`总计: ${failedSubmissions.length} 个`)
  console.log(`✅ 成功: ${successCount} 个`)
  console.log(`❌ 失败: ${failedCount} 个`)

  if (errors.length > 0) {
    console.log('\n❌ 失败的 URL:')
    errors.slice(0, 10).forEach((err, i) => {
      console.log(`${i + 1}. ${err}`)
    })
    if (errors.length > 10) {
      console.log(`... 以及其他 ${errors.length - 10} 个`)
    }
  }

  if (successCount > 0) {
    console.log('\n✅ 推送成功！')
    console.log('建议接下来:')
    console.log('1. 等待几分钟让 Bing 处理提交')
    console.log('2. 在管理后台批量检查收录状态')
    console.log('3. 运行查询脚本查看最新状态:')
    console.log('   npx tsx scripts/check-url-submission-status.ts')
  }

  if (failedCount > 0) {
    console.log('\n⚠️ 部分推送失败')
    console.log('请检查:')
    console.log('1. IndexNow 配置是否正确')
    console.log('2. API Key 文件是否可访问')
    console.log('3. 网络连接是否正常')
    console.log('4. 查看详细错误信息并手动处理')
  }

  await prisma.$disconnect()
}

retryFailedSubmissions().catch(console.error)
