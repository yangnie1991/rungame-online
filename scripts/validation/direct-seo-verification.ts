import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function verifyDatabaseSEO() {
  console.log("📊 直接验证数据库中的 SEO 内容\n")

  // 查询 Action 分类的 SEO 数据
  const actionCategory = await prisma.category.findFirst({
    where: { slug: "main-action" },
    include: {
      translations: {
        where: {
          OR: [{ locale: "en" }, { locale: "zh" }]
        }
      }
    }
  })

  if (!actionCategory) {
    console.log("❌ 未找到 main-action 分类")
    return
  }

  const enTranslation = actionCategory.translations.find(t => t.locale === "en")
  const zhTranslation = actionCategory.translations.find(t => t.locale === "zh")

  console.log("=== 分类信息 ===")
  console.log("ID:", actionCategory.id)
  console.log("Slug:", actionCategory.slug)
  console.log("基础名称:", actionCategory.name)

  console.log("\n=== 英文 SEO 数据 ===")
  if (enTranslation) {
    console.log("✓ 找到英文翻译")
    console.log("标题:", enTranslation.metaTitle || "(未设置)")
    console.log("描述:", enTranslation.metaDescription ?
      `${enTranslation.metaDescription.substring(0, 100)}...` : "(未设置)")
    console.log("关键词:", enTranslation.keywords ?
      enTranslation.keywords.substring(0, 80) + "..." : "(未设置)")
    console.log("描述长度:", enTranslation.metaDescription?.length || 0, "字符")
  } else {
    console.log("❌ 未找到英文翻译")
  }

  console.log("\n=== 中文 SEO 数据 ===")
  if (zhTranslation) {
    console.log("✓ 找到中文翻译")
    console.log("标题:", zhTranslation.metaTitle || "(未设置)")
    console.log("描述:", zhTranslation.metaDescription ?
      `${zhTranslation.metaDescription.substring(0, 100)}...` : "(未设置)")
    console.log("关键词:", zhTranslation.keywords ?
      zhTranslation.keywords.substring(0, 80) + "..." : "(未设置)")
    console.log("描述长度:", zhTranslation.metaDescription?.length || 0, "字符")
  } else {
    console.log("❌ 未找到中文翻译")
  }

  console.log("\n=== SEO 质量检查 ===")

  // 检查英文
  let passedChecks = 0
  let totalChecks = 0

  totalChecks++
  if (enTranslation?.metaTitle === "Action Games - Free Online Action Games Collection | RunGame") {
    console.log("✓ 英文标题格式正确")
    passedChecks++
  } else {
    console.log("✗ 英文标题格式不正确")
    console.log("  期望: Action Games - Free Online Action Games Collection | RunGame")
    console.log("  实际:", enTranslation?.metaTitle)
  }

  totalChecks++
  if (enTranslation?.metaDescription && enTranslation.metaDescription.length >= 150) {
    console.log(`✓ 英文描述长度合适 (${enTranslation.metaDescription.length} 字符)`)
    passedChecks++
  } else {
    console.log(`✗ 英文描述长度不足 (${enTranslation?.metaDescription?.length || 0} 字符，应 >= 150)`)
  }

  totalChecks++
  const enRunGameCount = (enTranslation?.metaTitle?.match(/RunGame/g) || []).length
  if (enRunGameCount === 1) {
    console.log("✓ 英文标题无 RunGame 重复")
    passedChecks++
  } else {
    console.log(`✗ 英文标题有 ${enRunGameCount} 个 RunGame (应该只有 1 个)`)
  }

  // 检查中文
  totalChecks++
  if (zhTranslation?.metaTitle === "动作游戏 - 免费在线动作游戏大全 | RunGame") {
    console.log("✓ 中文标题格式正确")
    passedChecks++
  } else {
    console.log("✗ 中文标题格式不正确")
    console.log("  期望: 动作游戏 - 免费在线动作游戏大全 | RunGame")
    console.log("  实际:", zhTranslation?.metaTitle)
  }

  totalChecks++
  if (zhTranslation?.metaDescription && zhTranslation.metaDescription.length >= 100) {
    console.log(`✓ 中文描述长度合适 (${zhTranslation.metaDescription.length} 字符)`)
    passedChecks++
  } else {
    console.log(`✗ 中文描述长度不足 (${zhTranslation?.metaDescription?.length || 0} 字符，应 >= 100)`)
  }

  totalChecks++
  const hasEnglishInZh = zhTranslation?.metaTitle?.match(/[a-zA-Z]{3,}/)
  if (zhTranslation?.metaTitle && !hasEnglishInZh) {
    console.log("✓ 中文标题无英文混合 (RunGame品牌名除外)")
    passedChecks++
  } else {
    console.log("✗ 中文标题存在英文混合")
  }

  console.log(`\n=== 总结 ===`)
  console.log(`通过检查: ${passedChecks}/${totalChecks}`)
  console.log(`通过率: ${(passedChecks / totalChecks * 100).toFixed(1)}%`)

  if (passedChecks === totalChecks) {
    console.log("\n🎉 所有 SEO 检查通过!")
  } else {
    console.log(`\n⚠️  还有 ${totalChecks - passedChecks} 项检查未通过`)
  }

  await prisma.$disconnect()
}

verifyDatabaseSEO()
  .catch((error) => {
    console.error("❌ 验证失败:", error)
    process.exit(1)
  })
