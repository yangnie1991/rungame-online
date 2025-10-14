# RunGame - 多语言在线游戏平台

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

</div>

RunGame 是一个现代化的多语言在线游戏平台，提供游戏门户网站和完整的内容管理系统。

## ✨ 核心功能

### 用户端
- 🌍 **多语言支持** - 支持英文、中文、西班牙语、法语等多种语言
- 🎮 **游戏浏览** - 按分类、标签浏览数千款在线游戏
- 🔍 **智能搜索** - 快速找到你喜欢的游戏
- 📱 **响应式设计** - 完美支持桌面和移动设备
- 🎨 **深色模式** - 支持深色/浅色主题切换
- ⚡ **即时游玩** - 无需下载，即开即玩

### 管理后台
- 🎯 **游戏管理** - 完整的游戏 CRUD 操作
- 📂 **分类管理** - 灵活的分类系统
- 🏷️ **标签管理** - 多维度标签体系
- 🌐 **语言管理** - 动态管理支持的语言
- 📄 **页面类型** - 动态页面配置系统
- 🔐 **安全认证** - 基于角色的访问控制

## 🚀 快速开始

### 环境要求

- **Node.js** 20.x 或更高版本
- **PostgreSQL** 14+ 数据库
- **npm** 或其他包管理器

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/rungame-nextjs.git
cd rungame-nextjs
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/game?schema=public&connection_limit=5&pool_timeout=10"

# NextAuth 配置
NEXTAUTH_SECRET="your-random-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

生成 `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

> 📝 详细配置请参考 [环境变量文档](docs/ENVIRONMENT.md)

4. **初始化数据库**

```bash
# 推送数据库架构
npm run db:push

# 填充初始数据
npm run db:seed
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000 查看网站

### 管理后台

- **URL**: http://localhost:3000/login
- **邮箱**: admin@rungame.online
- **密码**: admin123

> ⚠️ **重要**: 部署到生产环境后，请立即修改默认密码！

## 📖 文档

### 核心文档
- [**CLAUDE.md**](CLAUDE.md) - 开发者指南（给 AI 助手的完整架构文档）
- [**部署指南**](docs/DEPLOYMENT.md) - 完整的部署指南
- [**环境变量**](docs/ENVIRONMENT.md) - 环境变量配置说明

### 技术参考
- [**国际化最佳实践**](docs/I18N-BEST-PRACTICES.md) - next-intl 使用指南
- [**PageType 详解**](docs/PAGETYPE-EXPLANATION.md) - 动态页面系统
- [**shadcn/ui 说明**](docs/SHADCN-UI-EXPLAINED.md) - UI 组件使用
- [**实现指南**](docs/IMPLEMENTATION-GUIDE.md) - 详细实现文档

### 问题排查
- [**数据库连接**](docs/DATABASE-CONNECTION-ISSUE.md) - 数据库连接问题解决
- [**国际化回退**](docs/I18N-FALLBACK-FIX-REPORT.md) - 翻译回退问题

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript 5
- **样式**: TailwindCSS 4, shadcn/ui
- **国际化**: next-intl
- **表单**: react-hook-form + zod
- **主题**: next-themes

### 后端
- **数据库**: PostgreSQL
- **ORM**: Prisma 6
- **认证**: NextAuth.js v5
- **密码加密**: bcryptjs

### 开发工具
- **构建工具**: Turbopack
- **代码规范**: ESLint
- **包管理器**: npm

## 📁 项目结构

```
rungame-nextjs/
├── app/
│   ├── (admin)/          # 管理后台（无国际化）
│   │   └── admin/        # 管理面板路由
│   ├── (site)/           # 用户端（完全国际化）
│   │   └── [locale]/     # 多语言路由
│   ├── api/              # API 路由
│   └── login/            # 登录页面
│
├── components/
│   ├── admin/            # 管理后台组件
│   ├── site/             # 用户端组件
│   └── ui/               # shadcn/ui 组件
│
├── lib/
│   ├── auth.ts           # NextAuth 配置
│   ├── prisma.ts         # Prisma 客户端
│   └── i18n-helpers.ts   # 国际化辅助函数
│
├── prisma/
│   ├── schema.prisma     # 数据库模型
│   └── seed.ts           # 数据填充脚本
│
├── i18n/
│   ├── routing.ts        # 路由配置
│   ├── config.ts         # i18n 配置
│   └── messages/         # 翻译文件
│
├── docs/                 # 项目文档
├── .env                  # 环境变量
└── README.md             # 本文件
```

## 🎯 核心概念

### 双界面架构

RunGame 使用 Next.js 路由组实现完全独立的双界面：

1. **用户端** (`/` 路由)
   - 完全国际化
   - 支持 4 种语言
   - SEO 优化
   - 响应式设计

2. **管理后台** (`/admin` 路由)
   - 仅英文
   - 需要认证
   - 基于角色的访问控制
   - 完整的内容管理功能

### 翻译系统

采用主表 + 翻译表的分离架构：

- **主表**: 存储不可翻译的数据（ID、slug、配置等）
- **翻译表**: 存储多语言内容（名称、描述、元数据等）
- **智能回退**: 自动回退到默认语言（英文）

### PageType 系统

强大的动态页面配置系统，支持三种模式：

1. **GAME_LIST** - 动态游戏列表（如"最受欢迎"、"新游戏"）
2. **STATIC_CONTENT** - 静态内容页（如"关于我们"、"隐私政策"）
3. **MIXED** - 混合模式（静态内容 + 游戏列表）

详见 [PageType 详解](docs/PAGETYPE-EXPLANATION.md)

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器（端口 3000）

# 数据库
npm run db:push          # 推送 schema 到数据库
npm run db:seed          # 填充初始数据

# 生产
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 代码质量
npm run lint             # 运行 ESLint
```

## 🚢 部署

### Vercel（推荐）

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 点击 Deploy

详细步骤见 [部署指南](docs/DEPLOYMENT.md#部署到-vercel)

### Docker

```bash
# 构建镜像
docker build -t rungame:latest .

# 运行容器
docker run -d -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  rungame:latest
```

详细配置见 [部署指南](docs/DEPLOYMENT.md#使用-docker推荐)

### 传统服务器

使用 PM2 + Nginx，详见 [部署指南](docs/DEPLOYMENT.md#使用-pm2传统方式)

## 🔐 安全

- ✅ NextAuth.js v5 认证
- ✅ 基于角色的访问控制（RBAC）
- ✅ bcrypt 密码加密
- ✅ HTTPS 强制（生产环境）
- ✅ CSRF 保护
- ✅ SQL 注入防护（Prisma）

## 🌍 国际化

当前支持的语言：

- 🇬🇧 English (默认)
- 🇨🇳 简体中文
- 🇪🇸 Español
- 🇫🇷 Français

添加新语言：

1. 更新 `i18n/routing.ts`
2. 创建翻译文件 `i18n/messages/{locale}.json`
3. 在 Language 表中添加记录
4. 为内容添加翻译

详见 [国际化最佳实践](docs/I18N-BEST-PRACTICES.md)

## 📊 性能

- ⚡ Turbopack 极速构建
- 🚀 Next.js App Router（RSC）
- 💾 智能数据缓存
- 🖼️ 自动图片优化
- 📦 代码分割
- 🌐 CDN 友好

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写有意义的提交信息
- 添加必要的注释和文档

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [NextAuth.js](https://next-auth.js.org/) - 认证解决方案
- [next-intl](https://next-intl-docs.vercel.app/) - 国际化库
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架

## 📧 联系方式

- **项目主页**: https://github.com/yourusername/rungame-nextjs
- **问题反馈**: https://github.com/yourusername/rungame-nextjs/issues
- **邮箱**: your.email@example.com

## 🗺️ 路线图

- [ ] 用户系统（注册、登录、个人中心）
- [ ] 游戏评分和评论
- [ ] 收藏夹功能
- [ ] 游戏推荐算法
- [ ] 社交分享
- [ ] 游戏统计分析
- [ ] API 接口文档
- [ ] 移动端 APP

---

**Made with ❤️ using Next.js**

**最后更新**: 2025-01-14
