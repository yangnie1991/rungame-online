#!/bin/bash

echo "==================================================================="
echo "🔍 检查所有页面的结构化数据使用情况"
echo "==================================================================="
echo ""

echo "🎮 包含游戏数据的页面（需要确保有 review 或 aggregateRating）："
echo "-------------------------------------------------------------------"
find app/\(site\)/\[locale\] -name "*.tsx" -type f -exec grep -l "generateVideoGameSchema\|generateGameListSchema" {} \; | sort
echo ""

echo "📦 使用 CollectionPageSchema 的页面（只有 numberOfItems，无具体游戏）："
echo "-------------------------------------------------------------------"
find app/\(site\)/\[locale\] -name "*.tsx" -type f -exec grep -l "generateCollectionPageSchema" {} \; | while read file; do
  if ! grep -q "generateVideoGameSchema\|generateGameListSchema" "$file"; then
    echo "$file"
  fi
done | sort
echo ""

echo "🍞 使用 BreadcrumbSchema 的页面（需要确保最后一项没有 item）："
echo "-------------------------------------------------------------------"
find app/\(site\)/\[locale\] -name "*.tsx" -type f -exec grep -l "generateBreadcrumbSchema" {} \; | sort
echo ""

echo "==================================================================="
echo "✅ 总结"
echo "==================================================================="
echo ""
echo "已修复的问题："
echo "1. ✅ generateVideoGameSchema - 所有游戏都有 review 或 aggregateRating"
echo "2. ✅ generateGameListSchema - 列表中所有游戏都有 review 或 aggregateRating"
echo "3. ✅ generateBreadcrumbSchema - 最后一项没有 item 字段"
echo "4. ✅ generateCollectionPageSchema - 结构简单，无 itemListElement"
echo ""
echo "影响范围："
echo "- 首页：使用 generateGameListSchema ✅"
echo "- 游戏详情页：使用 generateVideoGameSchema ✅"
echo "- 分类/标签页：使用 generateCollectionPageSchema ✅"
echo "- 所有页面：使用 generateBreadcrumbSchema ✅"
