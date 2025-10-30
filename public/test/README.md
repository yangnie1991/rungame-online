# 测试工具目录

这个目录包含开发和测试用的工具页面。

## 文件列表

### OG 图片预览工具

- **文件**: [og-preview.html](og-preview.html)
- **访问**: http://localhost:3000/test/og-preview.html
- **用途**: 预览和测试 Open Graph 图片生成

## 为什么在 /test/ 目录？

根据项目的静态文件组织规范（[lib/static-files.ts](../../lib/static-files.ts)），测试相关的 HTML 文件应该放在 `/test/` 目录下，这样可以：

1. ✅ **自动排除国际化处理**: `/test/` 路径在中间件中被配置为跳过 next-intl 处理
2. ✅ **清晰的文件组织**: 测试工具与生产静态资源分离
3. ✅ **便于管理**: 所有开发工具集中在一个目录

## 静态文件组织规范

```
/public/
├── test/                    # 测试和开发工具（自动排除国际化）
│   └── og-preview.html     # OG 图片预览工具
├── assets/                  # 生产静态资源（自动排除国际化）
│   ├── icons/              # 图标文件
│   ├── images/             # 图片文件
│   └── preview/            # 预览相关资源
├── logo/                    # Logo 文件
├── favicon.ico             # 浏览器图标
├── manifest.json           # PWA manifest
├── robots.txt              # 搜索引擎规则
├── sitemap.xml             # 网站地图
└── ads.txt                 # Google AdSense 验证
```

## 中间件配置

在 [lib/static-files.ts](../../lib/static-files.ts) 中，`/test/` 目录被定义为静态目录：

```typescript
export const STATIC_DIRECTORIES = [
  '/assets',        // 所有静态资源
  '/test',          // 测试页面（OG 预览等开发工具）
  '/_next',         // Next.js 内部文件
]
```

这意味着：

- ✅ 直接访问 `/test/og-preview.html` 不会被重定向到 `/en/test/og-preview.html`
- ✅ 不会被 next-intl 中间件处理
- ✅ 可以直接作为静态文件提供

## 添加新的测试工具

如果需要添加新的测试页面：

1. 创建 HTML 文件到 `/public/test/` 目录
2. 文件会自动排除在国际化之外
3. 通过 `/test/{filename}.html` 访问

**示例**:

```bash
# 创建新的测试页面
cat > /public/test/icons-preview.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Icons Preview</title>
</head>
<body>
  <h1>Icons Preview</h1>
  <!-- 你的测试内容 -->
</body>
</html>
EOF

# 访问测试页面
# http://localhost:3000/test/icons-preview.html
```

## 相关文档

- [docs/STATIC-FILES-ORGANIZATION.md](../../docs/STATIC-FILES-ORGANIZATION.md) - 静态文件组织说明
- [lib/static-files.ts](../../lib/static-files.ts) - 静态文件配置
- [middleware.ts](../../middleware.ts) - Next.js 中间件
- [docs/OG-IMAGE-LOGO-FIX.md](../../docs/OG-IMAGE-LOGO-FIX.md) - OG 图片 Logo 修复说明

---

**最后更新**: 2025-10-20
**维护者**: Claude Code
