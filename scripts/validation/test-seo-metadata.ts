import { getAllCategoriesFullData } from "@/lib/data"

async function testSEOMetadata() {
  console.log("测试 SEO 元数据生成...\n")

  // 测试英文分类
  console.log("=== 测试英文分类 (Action) ===")
  const enCategories = await getAllCategoriesFullData("en")
  const actionEn = enCategories.find(cat => cat.slug === "main-action")

  if (actionEn) {
    console.log("✓ 找到分类:", actionEn.name)
    console.log("✓ metaTitle:", actionEn.metaTitle || "(未设置)")
    console.log("✓ metaDescription:", actionEn.metaDescription ?
      `${actionEn.metaDescription.substring(0, 80)}...` : "(未设置)")
    console.log("✓ keywords:", actionEn.keywords ?
      `${actionEn.keywords.substring(0, 60)}...` : "(未设置)")
  } else {
    console.log("✗ 未找到 main-action 分类")
  }

  console.log("\n=== 测试中文分类 (Action) ===")
  const zhCategories = await getAllCategoriesFullData("zh")
  const actionZh = zhCategories.find(cat => cat.slug === "main-action")

  if (actionZh) {
    console.log("✓ 找到分类:", actionZh.name)
    console.log("✓ metaTitle:", actionZh.metaTitle || "(未设置)")
    console.log("✓ metaDescription:", actionZh.metaDescription ?
      `${actionZh.metaDescription.substring(0, 80)}...` : "(未设置)")
    console.log("✓ keywords:", actionZh.keywords ?
      `${actionZh.keywords.substring(0, 60)}...` : "(未设置)")
  } else {
    console.log("✗ 未找到 main-action 分类")
  }

  console.log("\n=== 验证结果 ===")

  // 验证英文标题
  if (actionEn?.metaTitle === "Action Games - Free Online Action Games Collection | RunGame") {
    console.log("✓ 英文标题正确")
  } else {
    console.log("✗ 英文标题不正确")
  }

  // 验证中文标题
  if (actionZh?.metaTitle === "动作游戏 - 免费在线动作游戏大全 | RunGame") {
    console.log("✓ 中文标题正确")
  } else {
    console.log("✗ 中文标题不正确")
  }

  // 验证描述长度
  if (actionEn?.metaDescription && actionEn.metaDescription.length > 150) {
    console.log(`✓ 英文描述长度合适 (${actionEn.metaDescription.length} 字符)`)
  } else {
    console.log("✗ 英文描述长度不足")
  }

  if (actionZh?.metaDescription && actionZh.metaDescription.length > 100) {
    console.log(`✓ 中文描述长度合适 (${actionZh.metaDescription.length} 字符)`)
  } else {
    console.log("✗ 中文描述长度不足")
  }

  // 验证无语言混合
  if (actionZh?.metaTitle && !actionZh.metaTitle.match(/[a-zA-Z]{3,}/)) {
    console.log("✓ 中文标题无英文混合")
  } else {
    console.log("✗ 中文标题存在英文混合")
  }

  // 验证无重复 RunGame
  const runGameCount = (actionEn?.metaTitle?.match(/RunGame/g) || []).length
  if (runGameCount === 1) {
    console.log("✓ 英文标题无 RunGame 重复")
  } else {
    console.log(`✗ 英文标题有 ${runGameCount} 个 RunGame`)
  }
}

testSEOMetadata()
  .then(() => {
    console.log("\n测试完成!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("测试失败:", error)
    process.exit(1)
  })
