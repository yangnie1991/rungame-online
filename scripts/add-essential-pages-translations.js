const fs = require('fs')
const path = require('path')

const messagesDir = path.join(__dirname, '../i18n/messages')

// 当前日期
const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const currentDateZh = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

// 英文翻译
const enTranslations = {
  about: {
    title: "About Us",
    subtitle: "Learn more about RunGame",
    metaTitle: "About Us - RunGame Free Online Games",
    metaDescription: "Learn about RunGame, your premier destination for free online games. Discover our mission, values, and commitment to providing quality gaming experiences.",
    content: `
<h2>Who We Are</h2>
<p>RunGame is your premier destination for free online games. We are passionate gamers who believe that everyone deserves access to quality entertainment without barriers. Founded with the mission to make gaming accessible to all, we've built a platform where you can instantly play thousands of games without downloads, registrations, or paywalls.</p>

<h2>Our Mission</h2>
<p>Our mission is simple: to bring joy and entertainment to people around the world through accessible, high-quality gaming experiences. We carefully curate our game collection to ensure every title meets our standards for fun, engagement, and quality.</p>

<h2>What We Offer</h2>
<ul>
  <li><strong>Instant Play:</strong> No downloads, no installations - just click and play</li>
  <li><strong>Free Forever:</strong> All our games are completely free to play</li>
  <li><strong>Diverse Collection:</strong> From puzzles to action games, we have something for everyone</li>
  <li><strong>Mobile Friendly:</strong> Play on any device, anywhere, anytime</li>
  <li><strong>Regular Updates:</strong> New games added weekly to keep the experience fresh</li>
  <li><strong>Family Safe:</strong> All content is carefully reviewed for appropriate audiences</li>
</ul>

<h2>Our Values</h2>
<p><strong>Accessibility:</strong> Gaming should be available to everyone, regardless of their device or location.</p>
<p><strong>Quality:</strong> We believe in quality over quantity, carefully selecting each game in our catalog.</p>
<p><strong>Community:</strong> Our players are at the heart of everything we do.</p>
<p><strong>Innovation:</strong> We continuously improve our platform to provide the best gaming experience.</p>
<p><strong>Safety:</strong> We prioritize user safety and privacy in all our operations.</p>

<h2>Why Choose RunGame?</h2>
<p>Unlike other gaming platforms, RunGame focuses on simplicity and accessibility. We don't believe in complicated sign-up processes or intrusive ads. Our platform is designed to get you playing as quickly as possible. Whether you're looking for a quick break during work, entertaining kids at home, or spending a relaxing evening, RunGame has the perfect game for you.</p>

<h2>Join Our Community</h2>
<p>Join millions of players worldwide who trust RunGame for their daily gaming fix. Whether you're a casual player or a dedicated gamer, you'll find something to love in our ever-growing collection.</p>

<p>Thank you for choosing RunGame. Let's play!</p>
    `.trim()
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we protect your privacy",
    metaTitle: "Privacy Policy - RunGame",
    metaDescription: "Read our privacy policy to understand how we collect, use, and protect your information when you use RunGame.",
    content: `
<p><em>Last updated: ${currentDate}</em></p>

<h2>Introduction</h2>
<p>Welcome to RunGame ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website rungame.online.</p>

<h2>Information We Collect</h2>
<h3>Automatically Collected Information</h3>
<p>When you visit RunGame, we automatically collect certain information about your device and browsing actions, including IP address, browser type, operating system, pages viewed, and game play statistics.</p>

<h3>Cookies and Tracking Technologies</h3>
<p>We use cookies and similar tracking technologies to track activity on our website and enhance user experience.</p>

<h2>Google AdSense and Third-Party Advertising</h2>
<p>We use Google AdSense to display advertisements on RunGame. Google AdSense uses cookies and web beacons to serve ads based on your visits to our site and other sites on the Internet.</p>

<p><strong>Google's Use of Information:</strong></p>
<ul>
  <li>Google uses cookies to serve ads based on your prior visits to our website or other websites</li>
  <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
  <li>You can also opt out of third-party vendors' use of cookies by visiting <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info</a></li>
</ul>

<h2>Google Analytics</h2>
<p>We use Google Analytics to analyze website traffic and usage patterns. You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</p>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to provide, operate, and maintain our website, improve user experience, analyze site usage, and display relevant advertisements.</p>

<h2>Children's Privacy</h2>
<p>Our website is intended for general audiences and is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

<h2>Your Privacy Rights</h2>
<p>Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, delete your information, and object to processing.</p>

<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at privacy@rungame.online</p>
    `.trim()
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Rules and guidelines for using RunGame",
    metaTitle: "Terms of Service - RunGame",
    metaDescription: "Read the terms and conditions that govern your use of RunGame and our services.",
    content: `
<p><em>Last updated: ${currentDate}</em></p>

<h2>Agreement to Terms</h2>
<p>Welcome to RunGame. By accessing or using our website at rungame.online, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you do not have permission to access the Service.</p>

<h2>Use License</h2>
<p>We grant you a limited, non-exclusive, non-transferable, revocable license to access and use RunGame for personal, non-commercial entertainment purposes.</p>

<h2>Acceptable Use</h2>
<p>You agree to use RunGame only for lawful purposes. You agree not to violate any applicable laws or regulations, infringe upon the rights of others, transmit any harmful or malicious code, or attempt to gain unauthorized access to our systems.</p>

<h2>Third-Party Games</h2>
<p>RunGame hosts games from third-party developers and publishers. These games are subject to their own terms and conditions. We are not responsible for the content, functionality, or availability of third-party games.</p>

<h2>Intellectual Property</h2>
<p>The Service and its original content, features, and functionality are owned by RunGame and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

<h2>Disclaimer of Warranties</h2>
<p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>

<h2>Limitation of Liability</h2>
<p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RUNGAME SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>

<h2>Advertising</h2>
<p>RunGame displays advertisements to support the free availability of games. By using the Service, you agree that we may display advertisements within the Service.</p>

<h2>Changes to Terms</h2>
<p>We reserve the right to modify these Terms at any time. Your continued use of the Service after changes constitutes acceptance of the modified Terms.</p>

<h2>Contact Us</h2>
<p>If you have any questions about these Terms, please contact us at legal@rungame.online</p>
    `.trim()
  },
  contact: {
    title: "Contact Us",
    subtitle: "Get in touch with us",
    metaTitle: "Contact Us - RunGame",
    metaDescription: "Get in touch with the RunGame team. We're here to help with questions, feedback, or support.",
    content: `
<h2>We'd Love to Hear From You</h2>
<p>At RunGame, we value your feedback, questions, and suggestions. Whether you're experiencing technical issues, have ideas for new games, or simply want to say hello, we're here to help.</p>

<h2>How to Reach Us</h2>

<h3>📧 Email</h3>
<p><strong>General inquiries:</strong> <a href="mailto:hello@rungame.online">hello@rungame.online</a></p>
<p><strong>Business inquiries:</strong> <a href="mailto:business@rungame.online">business@rungame.online</a></p>
<p><strong>Technical support:</strong> <a href="mailto:support@rungame.online">support@rungame.online</a></p>
<p><strong>Privacy concerns:</strong> <a href="mailto:privacy@rungame.online">privacy@rungame.online</a></p>

<h3>🎮 Game Submissions</h3>
<p>Are you a game developer interested in having your games featured on RunGame? Email us at <a href="mailto:games@rungame.online">games@rungame.online</a></p>

<h3>💼 Partnership Opportunities</h3>
<p>Interested in advertising, sponsorships, or business collaborations? Email us at <a href="mailto:partnerships@rungame.online">partnerships@rungame.online</a></p>

<h3>🌐 Social Media</h3>
<p>Follow us and stay updated:</p>
<ul>
  <li><strong>Twitter:</strong> <a href="https://twitter.com/rungame" target="_blank" rel="noopener noreferrer">@rungame</a></li>
  <li><strong>Facebook:</strong> <a href="https://facebook.com/rungame" target="_blank" rel="noopener noreferrer">facebook.com/rungame</a></li>
</ul>

<h2>Response Time</h2>
<p>We strive to respond to all inquiries within 24-48 hours during business days.</p>

<h2>Feedback & Suggestions</h2>
<p>Your input helps us improve RunGame! Share your thoughts at <a href="mailto:feedback@rungame.online">feedback@rungame.online</a>.</p>
    `.trim()
  }
}

// 中文翻译
const zhTranslations = {
  about: {
    title: "关于我们",
    subtitle: "了解更多关于 RunGame 的信息",
    metaTitle: "关于我们 - RunGame 免费在线游戏",
    metaDescription: "了解 RunGame，您的免费在线游戏首选目的地。探索我们的使命、价值观以及提供优质游戏体验的承诺。",
    content: `
<h2>我们是谁</h2>
<p>RunGame 是您免费在线游戏的首选目的地。我们是充满热情的游戏玩家，相信每个人都应该无障碍地获得优质娱乐。我们的成立使命是让游戏对所有人都触手可及，我们建立了一个平台，让您可以立即玩数千款游戏，无需下载、注册或付费。</p>

<h2>我们的使命</h2>
<p>我们的使命很简单：通过便捷、高质量的游戏体验，为全世界的人们带来欢乐和娱乐。我们精心策划游戏合集，确保每款游戏都符合我们对趣味性、参与度和质量的标准。</p>

<h2>我们提供什么</h2>
<ul>
  <li><strong>即时游玩：</strong>无需下载、无需安装 - 点击即玩</li>
  <li><strong>永久免费：</strong>我们所有的游戏完全免费游玩</li>
  <li><strong>多样化收藏：</strong>从益智游戏到动作游戏，我们为每个人都准备了合适的内容</li>
  <li><strong>移动设备友好：</strong>在任何设备上随时随地游玩</li>
  <li><strong>定期更新：</strong>每周新增游戏，保持体验新鲜</li>
  <li><strong>家庭安全：</strong>所有内容都经过仔细审查，适合各年龄段</li>
</ul>

<h2>我们的价值观</h2>
<p><strong>可及性：</strong>游戏应该对每个人开放，无论他们的设备或位置如何。</p>
<p><strong>质量：</strong>我们相信质量胜于数量，精心挑选目录中的每款游戏。</p>
<p><strong>社区：</strong>我们的玩家是我们所做一切的核心。</p>
<p><strong>创新：</strong>我们不断改进平台，以提供最佳的游戏体验。</p>
<p><strong>安全：</strong>我们在所有运营中优先考虑用户安全和隐私。</p>

<h2>为什么选择 RunGame？</h2>
<p>与其他游戏平台不同，RunGame 专注于简单性和可访问性。我们不相信复杂的注册流程或侵扰性广告。我们的平台旨在让您尽快开始游戏。无论您是在工作中寻找快速休息、在家娱乐孩子，还是度过轻松的夜晚，RunGame 都有适合您的完美游戏。</p>

<h2>加入我们的社区</h2>
<p>加入全球数百万信任 RunGame 满足日常游戏需求的玩家。无论您是休闲玩家还是专业游戏玩家，您都会在我们不断增长的合集中找到喜欢的内容。</p>

<p>感谢您选择 RunGame。让我们一起玩吧！</p>
    `.trim()
  },
  privacy: {
    title: "隐私政策",
    subtitle: "我们如何保护您的隐私",
    metaTitle: "隐私政策 - RunGame",
    metaDescription: "阅读我们的隐私政策，了解我们在您使用 RunGame 时如何收集、使用和保护您的信息。",
    content: `
<p><em>最后更新：${currentDateZh}</em></p>

<h2>简介</h2>
<p>欢迎来到 RunGame（"我们"、"我们的"）。我们致力于保护您的隐私并确保您在我们网站上拥有积极的体验。本隐私政策解释了当您访问我们的网站 rungame.online 时，我们如何收集、使用、披露和保护您的信息。</p>

<h2>我们收集的信息</h2>
<h3>自动收集的信息</h3>
<p>当您访问 RunGame 时，我们会自动收集有关您的设备和浏览操作的某些信息，包括 IP 地址、浏览器类型、操作系统、查看的页面和游戏游玩统计信息。</p>

<h3>Cookie 和跟踪技术</h3>
<p>我们使用 Cookie 和类似的跟踪技术来跟踪我们网站上的活动并增强用户体验。</p>

<h2>Google AdSense 和第三方广告</h2>
<p>我们使用 Google AdSense 在 RunGame 上展示广告。Google AdSense 使用 Cookie 和网络信标根据您访问我们网站和互联网上其他网站的情况投放广告。</p>

<p><strong>Google 对信息的使用：</strong></p>
<ul>
  <li>Google 使用 Cookie 根据您之前访问我们网站或其他网站的情况投放广告</li>
  <li>您可以通过访问 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google 广告设置</a>来选择退出个性化广告</li>
  <li>您还可以通过访问 <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info</a> 来选择退出第三方供应商对 Cookie 的使用</li>
</ul>

<h2>Google Analytics</h2>
<p>我们使用 Google Analytics 分析网站流量和使用模式。您可以通过安装 <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics 选择退出浏览器插件</a>来选择退出 Google Analytics。</p>

<h2>我们如何使用您的信息</h2>
<p>我们使用收集的信息来提供、运营和维护我们的网站，改善用户体验，分析网站使用情况，并展示相关广告。</p>

<h2>儿童隐私</h2>
<p>我们的网站面向普通受众，不针对 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。</p>

<h2>您的隐私权</h2>
<p>根据您所在的位置，您可能对您的个人信息拥有某些权利，包括访问、更正、删除您的信息和反对处理的权利。</p>

<h2>联系我们</h2>
<p>如果您对本隐私政策有任何疑问，请通过 privacy@rungame.online 联系我们</p>
    `.trim()
  },
  terms: {
    title: "使用条款",
    subtitle: "使用 RunGame 的规则和指南",
    metaTitle: "使用条款 - RunGame",
    metaDescription: "阅读管理您使用 RunGame 及我们服务的条款和条件。",
    content: `
<p><em>最后更新：${currentDateZh}</em></p>

<h2>同意条款</h2>
<p>欢迎来到 RunGame。通过访问或使用我们位于 rungame.online 的网站，您同意受这些使用条款的约束。如果您不同意这些条款的任何部分，您无权访问本服务。</p>

<h2>使用许可</h2>
<p>我们授予您有限的、非独占的、不可转让的、可撤销的许可，以访问和使用 RunGame 进行个人、非商业娱乐目的。</p>

<h2>可接受的使用</h2>
<p>您同意仅将 RunGame 用于合法目的。您同意不违反任何适用的法律或法规，不侵犯他人的权利，不传输任何有害或恶意代码，不尝试未经授权访问我们的系统。</p>

<h2>第三方游戏</h2>
<p>RunGame 托管来自第三方开发者和发行商的游戏。这些游戏受其自身条款和条件的约束。我们不对第三方游戏的内容、功能或可用性负责。</p>

<h2>知识产权</h2>
<p>本服务及其原创内容、特性和功能由 RunGame 拥有，受国际版权、商标、专利、商业秘密和其他知识产权法律保护。</p>

<h2>免责声明</h2>
<p>本服务按"原样"和"可用"提供，不提供任何形式的明示或暗示保证。</p>

<h2>责任限制</h2>
<p>在法律允许的最大范围内，RUNGAME 不对任何间接、附带、特殊、后果性或惩罚性损害赔偿承担责任。</p>

<h2>广告</h2>
<p>RunGame 展示广告以支持游戏的免费可用性。使用本服务即表示您同意我们可能在服务中展示广告。</p>

<h2>条款变更</h2>
<p>我们保留随时修改这些条款的权利。在更改后继续使用服务即表示接受修改后的条款。</p>

<h2>联系我们</h2>
<p>如果您对这些条款有任何疑问，请通过 legal@rungame.online 联系我们</p>
    `.trim()
  },
  contact: {
    title: "联系我们",
    subtitle: "与我们取得联系",
    metaTitle: "联系我们 - RunGame",
    metaDescription: "与 RunGame 团队取得联系。我们随时为您解答问题、接收反馈或提供支持。",
    content: `
<h2>我们很乐意听到您的声音</h2>
<p>在 RunGame，我们重视您的反馈、问题和建议。无论您遇到技术问题、对新游戏有想法，还是只是想打个招呼，我们都随时为您提供帮助。</p>

<h2>如何联系我们</h2>

<h3>📧 电子邮件</h3>
<p><strong>一般咨询：</strong> <a href="mailto:hello@rungame.online">hello@rungame.online</a></p>
<p><strong>商务咨询：</strong> <a href="mailto:business@rungame.online">business@rungame.online</a></p>
<p><strong>技术支持：</strong> <a href="mailto:support@rungame.online">support@rungame.online</a></p>
<p><strong>隐私问题：</strong> <a href="mailto:privacy@rungame.online">privacy@rungame.online</a></p>

<h3>🎮 游戏提交</h3>
<p>您是游戏开发者，有兴趣将您的游戏展示在 RunGame 上吗？请发送电子邮件至 <a href="mailto:games@rungame.online">games@rungame.online</a></p>

<h3>💼 合作机会</h3>
<p>对广告、赞助或商业合作感兴趣？请发送电子邮件至 <a href="mailto:partnerships@rungame.online">partnerships@rungame.online</a></p>

<h3>🌐 社交媒体</h3>
<p>关注我们并了解最新动态：</p>
<ul>
  <li><strong>Twitter：</strong> <a href="https://twitter.com/rungame" target="_blank" rel="noopener noreferrer">@rungame</a></li>
  <li><strong>Facebook：</strong> <a href="https://facebook.com/rungame" target="_blank" rel="noopener noreferrer">facebook.com/rungame</a></li>
</ul>

<h2>响应时间</h2>
<p>我们力求在工作日的 24-48 小时内回复所有咨询。</p>

<h2>反馈和建议</h2>
<p>您的意见帮助我们改进 RunGame！请在 <a href="mailto:feedback@rungame.online">feedback@rungame.online</a> 分享您的想法。</p>
    `.trim()
  }
}

// 读取现有的翻译文件并添加新内容
function updateTranslationFile(locale, translations) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const updatedContent = {
    ...existingContent,
    ...translations
  }

  fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2) + '\n', 'utf8')
  console.log(`✅ Updated ${locale}.json`)
}

// 更新英文和中文翻译
updateTranslationFile('en', enTranslations)
updateTranslationFile('zh', zhTranslations)

console.log('\n🎉 Essential pages translations added successfully!')
