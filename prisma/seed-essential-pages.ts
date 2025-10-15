import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 创建 Google AdSense 审核所需的必备页面
 * - About Us (关于我们)
 * - Privacy Policy (隐私政策)
 * - Terms of Service (使用条款)
 * - Contact Us (联系我们)
 */

async function main() {
  console.log('🚀 开始创建必备页面...\n')

  // 1. 创建 About Us 页面
  console.log('📄 创建 About Us 页面...')
  const aboutPage = await prisma.pageType.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      slug: 'about',
      type: 'STATIC_CONTENT',
      icon: 'ℹ️',
      isEnabled: true,
      sortOrder: 100,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'About Us',
            subtitle: 'Learn more about RunGame',
            description: 'Discover the story behind RunGame and our mission to bring joy through gaming.',
            metaTitle: 'About Us - RunGame Free Online Games',
            metaDescription: 'Learn about RunGame, your premier destination for free online games. Discover our mission, values, and commitment to providing quality gaming experiences.',
          },
          {
            locale: 'zh',
            title: '关于我们',
            subtitle: '了解更多关于 RunGame 的信息',
            description: '探索 RunGame 背后的故事以及我们通过游戏带来欢乐的使命。',
            metaTitle: '关于我们 - RunGame 免费在线游戏',
            metaDescription: '了解 RunGame，您的免费在线游戏首选目的地。探索我们的使命、价值观以及提供优质游戏体验的承诺。',
          },
        ],
      },
    },
  })

  // 为 About Us 页面创建内容块
  await prisma.pageContentBlock.create({
    data: {
      pageTypeId: aboutPage.id,
      blockType: 'TEXT',
      blockKey: 'about-content',
      sortOrder: 1,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Welcome to RunGame',
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
            `.trim(),
          },
          {
            locale: 'zh',
            title: '欢迎来到 RunGame',
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
            `.trim(),
          },
        ],
      },
    },
  })

  console.log('✅ About Us 页面创建成功\n')

  // 2. 创建 Privacy Policy 页面
  console.log('📄 创建 Privacy Policy 页面...')
  const privacyPage = await prisma.pageType.upsert({
    where: { slug: 'privacy' },
    update: {},
    create: {
      slug: 'privacy',
      type: 'STATIC_CONTENT',
      icon: '🔒',
      isEnabled: true,
      sortOrder: 101,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Privacy Policy',
            subtitle: 'How we protect your privacy',
            description: 'Learn about how RunGame collects, uses, and protects your personal information.',
            metaTitle: 'Privacy Policy - RunGame',
            metaDescription: 'Read our privacy policy to understand how we collect, use, and protect your information when you use RunGame.',
          },
          {
            locale: 'zh',
            title: '隐私政策',
            subtitle: '我们如何保护您的隐私',
            description: '了解 RunGame 如何收集、使用和保护您的个人信息。',
            metaTitle: '隐私政策 - RunGame',
            metaDescription: '阅读我们的隐私政策，了解我们在您使用 RunGame 时如何收集、使用和保护您的信息。',
          },
        ],
      },
    },
  })

  // 为 Privacy Policy 创建内容块
  await prisma.pageContentBlock.create({
    data: {
      pageTypeId: privacyPage.id,
      blockType: 'TEXT',
      blockKey: 'privacy-content',
      sortOrder: 1,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Privacy Policy',
            content: `
<p><em>Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

<h2>Introduction</h2>
<p>Welcome to RunGame ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website rungame.online.</p>

<p>By using RunGame, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this privacy policy, please do not access the site.</p>

<h2>Information We Collect</h2>

<h3>Automatically Collected Information</h3>
<p>When you visit RunGame, we automatically collect certain information about your device and browsing actions, including:</p>
<ul>
  <li>IP address</li>
  <li>Browser type and version</li>
  <li>Operating system</li>
  <li>Referring URLs</li>
  <li>Pages viewed and time spent on pages</li>
  <li>Game play statistics</li>
</ul>

<h3>Cookies and Tracking Technologies</h3>
<p>We use cookies and similar tracking technologies to track activity on our website and enhance user experience. Cookies are small data files stored on your device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

<p><strong>Types of cookies we use:</strong></p>
<ul>
  <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
  <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
</ul>

<h2>Google AdSense and Third-Party Advertising</h2>
<p>We use Google AdSense to display advertisements on RunGame. Google AdSense uses cookies and web beacons to serve ads based on your visits to our site and other sites on the Internet.</p>

<p><strong>Google's Use of Information:</strong></p>
<ul>
  <li>Google uses cookies to serve ads based on your prior visits to our website or other websites</li>
  <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to RunGame and/or other sites</li>
  <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
  <li>You can also opt out of third-party vendors' use of cookies by visiting <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info</a></li>
</ul>

<p>For more information about how Google uses data when you use our site, please visit <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</p>

<h2>Google Analytics</h2>
<p>We use Google Analytics to analyze website traffic and usage patterns. Google Analytics uses cookies to collect information such as how often users visit the site, what pages they visit, and what other sites they used prior to coming to this site.</p>

<p>Google Analytics collects only the IP address assigned to you on the date you visit the site, not your name or other identifying information. We do not combine the information collected through Google Analytics with personally identifiable information.</p>

<p>You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</p>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, operate, and maintain our website</li>
  <li>Improve user experience and website functionality</li>
  <li>Analyze site usage and trends</li>
  <li>Detect, prevent, and address technical issues</li>
  <li>Display relevant advertisements</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>Information Sharing and Disclosure</h2>
<p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
<ul>
  <li><strong>Service Providers:</strong> Third-party companies that help us operate our website (e.g., Google Analytics, Google AdSense)</li>
  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
  <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
</ul>

<h2>Third-Party Games and Content</h2>
<p>RunGame hosts games from third-party providers. When you play these games, you may be subject to the privacy policies of those third-party providers. We are not responsible for the privacy practices of these third parties.</p>

<h2>Children's Privacy</h2>
<p>Our website is intended for general audiences and is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>

<h2>Data Security</h2>
<p>We implement reasonable security measures to protect your information from unauthorized access, alteration, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>

<h2>Your Privacy Rights</h2>
<p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
<ul>
  <li>The right to access your personal information</li>
  <li>The right to correct inaccurate information</li>
  <li>The right to delete your information</li>
  <li>The right to object to processing</li>
  <li>The right to opt out of marketing communications</li>
</ul>

<h2>Do Not Track Signals</h2>
<p>Some browsers include a "Do Not Track" (DNT) feature. Our website does not currently respond to DNT signals.</p>

<h2>International Data Transfers</h2>
<p>Your information may be transferred to and maintained on servers located outside of your jurisdiction where privacy laws may differ. By using RunGame, you consent to the transfer of your information to these locations.</p>

<h2>Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

<p>We encourage you to review this Privacy Policy periodically for any changes. Your continued use of RunGame after changes are posted constitutes your acceptance of the revised policy.</p>

<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us:</p>
<ul>
  <li>Email: privacy@rungame.online</li>
  <li>Website: <a href="https://rungame.online/contact">https://rungame.online/contact</a></li>
</ul>

<h2>Cookie Consent</h2>
<p>By using RunGame, you consent to our use of cookies and tracking technologies as described in this Privacy Policy. You can manage your cookie preferences through your browser settings.</p>
            `.trim(),
          },
          {
            locale: 'zh',
            title: '隐私政策',
            content: `
<p><em>最后更新：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

<h2>简介</h2>
<p>欢迎来到 RunGame（"我们"、"我们的"）。我们致力于保护您的隐私并确保您在我们网站上拥有积极的体验。本隐私政策解释了当您访问我们的网站 rungame.online 时，我们如何收集、使用、披露和保护您的信息。</p>

<p>使用 RunGame 即表示您同意根据本政策收集和使用信息。如果您不同意本隐私政策的条款，请勿访问本网站。</p>

<h2>我们收集的信息</h2>

<h3>自动收集的信息</h3>
<p>当您访问 RunGame 时，我们会自动收集有关您的设备和浏览操作的某些信息，包括：</p>
<ul>
  <li>IP 地址</li>
  <li>浏览器类型和版本</li>
  <li>操作系统</li>
  <li>引荐 URL</li>
  <li>查看的页面和在页面上花费的时间</li>
  <li>游戏游玩统计信息</li>
</ul>

<h3>Cookie 和跟踪技术</h3>
<p>我们使用 Cookie 和类似的跟踪技术来跟踪我们网站上的活动并增强用户体验。Cookie 是存储在您设备上的小型数据文件。您可以指示浏览器拒绝所有 Cookie 或在发送 Cookie 时发出指示。</p>

<p><strong>我们使用的 Cookie 类型：</strong></p>
<ul>
  <li><strong>必要 Cookie：</strong>网站正常运行所必需</li>
  <li><strong>分析 Cookie：</strong>帮助我们了解访问者如何使用我们的网站</li>
  <li><strong>广告 Cookie：</strong>用于投放相关广告</li>
</ul>

<h2>Google AdSense 和第三方广告</h2>
<p>我们使用 Google AdSense 在 RunGame 上展示广告。Google AdSense 使用 Cookie 和网络信标根据您访问我们网站和互联网上其他网站的情况投放广告。</p>

<p><strong>Google 对信息的使用：</strong></p>
<ul>
  <li>Google 使用 Cookie 根据您之前访问我们网站或其他网站的情况投放广告</li>
  <li>Google 使用广告 Cookie 使其及其合作伙伴能够根据您访问 RunGame 和/或其他网站的情况投放广告</li>
  <li>您可以通过访问 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google 广告设置</a>来选择退出个性化广告</li>
  <li>您还可以通过访问 <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info</a> 来选择退出第三方供应商对 Cookie 的使用</li>
</ul>

<p>有关 Google 在您使用我们网站时如何使用数据的更多信息，请访问 <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google 隐私政策</a>。</p>

<h2>Google Analytics</h2>
<p>我们使用 Google Analytics 分析网站流量和使用模式。Google Analytics 使用 Cookie 收集信息，例如用户访问网站的频率、他们访问的页面以及在访问本网站之前使用的其他网站。</p>

<p>Google Analytics 仅收集您访问网站当天分配给您的 IP 地址，而不是您的姓名或其他识别信息。我们不会将通过 Google Analytics 收集的信息与个人身份信息相结合。</p>

<p>您可以通过安装 <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics 选择退出浏览器插件</a>来选择退出 Google Analytics。</p>

<h2>我们如何使用您的信息</h2>
<p>我们使用收集的信息来：</p>
<ul>
  <li>提供、运营和维护我们的网站</li>
  <li>改善用户体验和网站功能</li>
  <li>分析网站使用情况和趋势</li>
  <li>检测、预防和解决技术问题</li>
  <li>展示相关广告</li>
  <li>遵守法律义务</li>
</ul>

<h2>信息共享和披露</h2>
<p>我们不会向第三方出售、交易或出租您的个人信息。我们可能与以下方共享您的信息：</p>
<ul>
  <li><strong>服务提供商：</strong>帮助我们运营网站的第三方公司（例如 Google Analytics、Google AdSense）</li>
  <li><strong>法律要求：</strong>法律要求或保护我们的权利时</li>
  <li><strong>业务转让：</strong>与任何合并、出售或收购相关</li>
</ul>

<h2>第三方游戏和内容</h2>
<p>RunGame 托管来自第三方提供商的游戏。当您玩这些游戏时，您可能需要遵守这些第三方提供商的隐私政策。我们对这些第三方的隐私做法不承担责任。</p>

<h2>儿童隐私</h2>
<p>我们的网站面向普通受众，不针对 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。如果您认为我们收集了 13 岁以下儿童的信息，请立即联系我们。</p>

<h2>数据安全</h2>
<p>我们实施合理的安全措施来保护您的信息免遭未经授权的访问、更改或破坏。但是，通过互联网传输的方法没有 100% 安全，我们无法保证绝对安全。</p>

<h2>您的隐私权</h2>
<p>根据您所在的位置，您可能对您的个人信息拥有某些权利，包括：</p>
<ul>
  <li>访问您的个人信息的权利</li>
  <li>更正不准确信息的权利</li>
  <li>删除您的信息的权利</li>
  <li>反对处理的权利</li>
  <li>选择退出营销通信的权利</li>
</ul>

<h2>请勿跟踪信号</h2>
<p>某些浏览器包含"请勿跟踪"(DNT) 功能。我们的网站目前不响应 DNT 信号。</p>

<h2>国际数据传输</h2>
<p>您的信息可能会传输到您所在司法管辖区以外的服务器并在这些服务器上维护，那里的隐私法可能有所不同。使用 RunGame 即表示您同意将您的信息传输到这些位置。</p>

<h2>本隐私政策的变更</h2>
<p>我们可能会不时更新本隐私政策。我们将通过在本页面上发布新的隐私政策并更新"最后更新"日期来通知您任何更改。</p>

<p>我们鼓励您定期查看本隐私政策以了解任何更改。在发布更改后继续使用 RunGame 即表示您接受修订后的政策。</p>

<h2>联系我们</h2>
<p>如果您对本隐私政策有任何疑问，请联系我们：</p>
<ul>
  <li>电子邮件：privacy@rungame.online</li>
  <li>网站：<a href="https://rungame.online/contact">https://rungame.online/contact</a></li>
</ul>

<h2>Cookie 同意</h2>
<p>使用 RunGame 即表示您同意我们按照本隐私政策中所述使用 Cookie 和跟踪技术。您可以通过浏览器设置管理您的 Cookie 偏好。</p>
            `.trim(),
          },
        ],
      },
    },
  })

  console.log('✅ Privacy Policy 页面创建成功\n')

  // 3. 创建 Terms of Service 页面
  console.log('📄 创建 Terms of Service 页面...')
  const termsPage = await prisma.pageType.upsert({
    where: { slug: 'terms' },
    update: {},
    create: {
      slug: 'terms',
      type: 'STATIC_CONTENT',
      icon: '📜',
      isEnabled: true,
      sortOrder: 102,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Terms of Service',
            subtitle: 'Rules and guidelines for using RunGame',
            description: 'Read our terms of service to understand the rules and guidelines for using RunGame.',
            metaTitle: 'Terms of Service - RunGame',
            metaDescription: 'Read the terms and conditions that govern your use of RunGame and our services.',
          },
          {
            locale: 'zh',
            title: '使用条款',
            subtitle: '使用 RunGame 的规则和指南',
            description: '阅读我们的使用条款以了解使用 RunGame 的规则和指南。',
            metaTitle: '使用条款 - RunGame',
            metaDescription: '阅读管理您使用 RunGame 及我们服务的条款和条件。',
          },
        ],
      },
    },
  })

  // 为 Terms 创建内容块
  await prisma.pageContentBlock.create({
    data: {
      pageTypeId: termsPage.id,
      blockType: 'TEXT',
      blockKey: 'terms-content',
      sortOrder: 1,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Terms of Service',
            content: `
<p><em>Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

<h2>Agreement to Terms</h2>
<p>Welcome to RunGame. By accessing or using our website at rungame.online ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.</p>

<h2>Use License</h2>
<p>We grant you a limited, non-exclusive, non-transferable, revocable license to access and use RunGame for personal, non-commercial entertainment purposes. This license does not include:</p>
<ul>
  <li>Modifying or copying the materials</li>
  <li>Using the materials for any commercial purpose or public display</li>
  <li>Attempting to decompile or reverse engineer any software on RunGame</li>
  <li>Removing any copyright or proprietary notations from the materials</li>
  <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
</ul>

<h2>Acceptable Use</h2>
<p>You agree to use RunGame only for lawful purposes. You agree not to:</p>
<ul>
  <li>Violate any applicable laws or regulations</li>
  <li>Infringe upon the rights of others</li>
  <li>Transmit any harmful or malicious code</li>
  <li>Attempt to gain unauthorized access to our systems</li>
  <li>Interfere with or disrupt the Service</li>
  <li>Use automated systems or bots to access the Service</li>
  <li>Collect or harvest information about other users</li>
  <li>Impersonate any person or entity</li>
</ul>

<h2>Third-Party Games</h2>
<p>RunGame hosts games from third-party developers and publishers. These games are subject to their own terms and conditions. We are not responsible for:</p>
<ul>
  <li>The content, functionality, or availability of third-party games</li>
  <li>Any issues arising from your use of third-party games</li>
  <li>The privacy practices of third-party game providers</li>
  <li>Any in-game purchases or transactions within third-party games</li>
</ul>

<h2>Intellectual Property</h2>
<p>The Service and its original content, features, and functionality are owned by RunGame and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

<p>Game content belongs to their respective owners and developers. All trademarks, service marks, and trade names are proprietary to their respective owners.</p>

<h2>User Content</h2>
<p>While RunGame currently does not allow user-generated content, if this feature is added in the future:</p>
<ul>
  <li>You retain ownership of content you submit</li>
  <li>You grant us a license to use, display, and distribute your content</li>
  <li>You are responsible for the content you submit</li>
  <li>We reserve the right to remove any content that violates these Terms</li>
</ul>

<h2>Disclaimer of Warranties</h2>
<p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
<ul>
  <li>Warranties of merchantability</li>
  <li>Fitness for a particular purpose</li>
  <li>Non-infringement</li>
  <li>Uninterrupted or error-free operation</li>
</ul>

<p>We do not warrant that:</p>
<ul>
  <li>The Service will be available at all times</li>
  <li>Games will function without errors</li>
  <li>Defects will be corrected</li>
  <li>The Service is free of viruses or harmful components</li>
</ul>

<h2>Limitation of Liability</h2>
<p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RUNGAME SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>

<p>IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE PAST SIX MONTHS, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS LESS.</p>

<h2>Indemnification</h2>
<p>You agree to indemnify, defend, and hold harmless RunGame, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with:</p>
<ul>
  <li>Your access to or use of the Service</li>
  <li>Your violation of these Terms</li>
  <li>Your violation of any rights of another party</li>
</ul>

<h2>Advertising</h2>
<p>RunGame displays advertisements to support the free availability of games. By using the Service, you agree that:</p>
<ul>
  <li>We may display advertisements within the Service</li>
  <li>These advertisements may be targeted based on your usage</li>
  <li>We use third-party advertising partners (such as Google AdSense)</li>
  <li>You will not block, interfere with, or manipulate advertisements</li>
</ul>

<h2>Termination</h2>
<p>We reserve the right to terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including:</p>
<ul>
  <li>Violation of these Terms</li>
  <li>Fraudulent, abusive, or illegal activity</li>
  <li>At our sole discretion for any reason</li>
</ul>

<h2>Links to Other Websites</h2>
<p>Our Service may contain links to third-party websites that are not owned or controlled by RunGame. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites.</p>

<h2>Changes to Terms</h2>
<p>We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.</p>

<p>Your continued use of the Service after changes constitutes acceptance of the modified Terms. If you do not agree to the new Terms, you must stop using the Service.</p>

<h2>Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>

<h2>Dispute Resolution</h2>
<p>Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration, except that either party may seek injunctive relief in court.</p>

<h2>Severability</h2>
<p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>

<h2>Entire Agreement</h2>
<p>These Terms constitute the entire agreement between you and RunGame regarding the use of the Service and supersede all prior agreements and understandings.</p>

<h2>Contact Us</h2>
<p>If you have any questions about these Terms, please contact us:</p>
<ul>
  <li>Email: legal@rungame.online</li>
  <li>Website: <a href="https://rungame.online/contact">https://rungame.online/contact</a></li>
</ul>

<h2>Acknowledgment</h2>
<p>BY USING RUNGAME, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.</p>
            `.trim(),
          },
          {
            locale: 'zh',
            title: '使用条款',
            content: `
<p><em>最后更新：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

<h2>同意条款</h2>
<p>欢迎来到 RunGame。通过访问或使用我们位于 rungame.online 的网站（"服务"），您同意受这些使用条款（"条款"）的约束。如果您不同意这些条款的任何部分，您无权访问本服务。</p>

<h2>使用许可</h2>
<p>我们授予您有限的、非独占的、不可转让的、可撤销的许可，以访问和使用 RunGame 进行个人、非商业娱乐目的。此许可不包括：</p>
<ul>
  <li>修改或复制材料</li>
  <li>将材料用于任何商业目的或公开展示</li>
  <li>尝试反编译或逆向工程 RunGame 上的任何软件</li>
  <li>从材料中删除任何版权或所有权标记</li>
  <li>将材料转让给他人或在任何其他服务器上"镜像"材料</li>
</ul>

<h2>可接受的使用</h2>
<p>您同意仅将 RunGame 用于合法目的。您同意不：</p>
<ul>
  <li>违反任何适用的法律或法规</li>
  <li>侵犯他人的权利</li>
  <li>传输任何有害或恶意代码</li>
  <li>尝试未经授权访问我们的系统</li>
  <li>干扰或中断服务</li>
  <li>使用自动化系统或机器人访问服务</li>
  <li>收集或获取有关其他用户的信息</li>
  <li>冒充任何个人或实体</li>
</ul>

<h2>第三方游戏</h2>
<p>RunGame 托管来自第三方开发者和发行商的游戏。这些游戏受其自身条款和条件的约束。我们不对以下内容负责：</p>
<ul>
  <li>第三方游戏的内容、功能或可用性</li>
  <li>您使用第三方游戏而引起的任何问题</li>
  <li>第三方游戏提供商的隐私做法</li>
  <li>第三方游戏中的任何游戏内购买或交易</li>
</ul>

<h2>知识产权</h2>
<p>本服务及其原创内容、特性和功能由 RunGame 拥有，受国际版权、商标、专利、商业秘密和其他知识产权法律保护。</p>

<p>游戏内容属于其各自的所有者和开发者。所有商标、服务标志和商号均为其各自所有者的专有财产。</p>

<h2>用户内容</h2>
<p>虽然 RunGame 目前不允许用户生成内容，但如果将来添加此功能：</p>
<ul>
  <li>您保留所提交内容的所有权</li>
  <li>您授予我们使用、展示和分发您内容的许可</li>
  <li>您对所提交的内容负责</li>
  <li>我们保留删除任何违反这些条款的内容的权利</li>
</ul>

<h2>免责声明</h2>
<p>本服务按"原样"和"可用"提供，不提供任何形式的明示或暗示保证，包括但不限于：</p>
<ul>
  <li>适销性保证</li>
  <li>特定用途的适用性</li>
  <li>非侵权</li>
  <li>不间断或无错误运行</li>
</ul>

<p>我们不保证：</p>
<ul>
  <li>服务将始终可用</li>
  <li>游戏将无错误运行</li>
  <li>缺陷将被纠正</li>
  <li>服务不含病毒或有害组件</li>
</ul>

<h2>责任限制</h2>
<p>在法律允许的最大范围内，RUNGAME 不对任何间接、附带、特殊、后果性或惩罚性损害赔偿，或任何利润或收入损失（无论是直接还是间接产生），或任何数据、使用、商誉或其他无形损失承担责任。</p>

<p>在任何情况下，我们的总责任不超过您在过去六个月内向我们支付的金额，或一百美元（$100），以较少者为准。</p>

<h2>赔偿</h2>
<p>您同意赔偿、辩护并使 RunGame、其高级管理人员、董事、员工和代理人免受因以下原因引起的或与以下原因相关的任何索赔、责任、损害、损失和费用（包括合理的律师费）的损害：</p>
<ul>
  <li>您访问或使用服务</li>
  <li>您违反这些条款</li>
  <li>您侵犯任何其他方的权利</li>
</ul>

<h2>广告</h2>
<p>RunGame 展示广告以支持游戏的免费可用性。使用本服务即表示您同意：</p>
<ul>
  <li>我们可能在服务中展示广告</li>
  <li>这些广告可能根据您的使用情况进行定向投放</li>
  <li>我们使用第三方广告合作伙伴（如 Google AdSense）</li>
  <li>您不会阻止、干扰或操纵广告</li>
</ul>

<h2>终止</h2>
<p>我们保留立即终止或暂停您访问服务的权利，无需事先通知或承担责任，原因包括：</p>
<ul>
  <li>违反这些条款</li>
  <li>欺诈、滥用或非法活动</li>
  <li>出于任何原因，由我们自行决定</li>
</ul>

<h2>其他网站的链接</h2>
<p>我们的服务可能包含指向不属于或不受 RunGame 控制的第三方网站的链接。我们对任何第三方网站的内容、隐私政策或做法不承担任何控制和责任。</p>

<h2>条款变更</h2>
<p>我们保留随时修改这些条款的权利。我们将通过在本页面上发布新条款并更新"最后更新"日期来通知用户任何重大更改。</p>

<p>在更改后继续使用服务即表示接受修改后的条款。如果您不同意新条款，您必须停止使用服务。</p>

<h2>管辖法律</h2>
<p>这些条款应根据适用法律进行管辖和解释，不考虑法律冲突原则。</p>

<h2>争议解决</h2>
<p>因这些条款或服务引起的或与之相关的任何争议应通过具有约束力的仲裁解决，但任何一方均可在法院寻求禁令救济。</p>

<h2>可分割性</h2>
<p>如果这些条款的任何条款被认为不可执行或无效，该条款应限制或消除到最小必要程度，其余条款应继续完全有效。</p>

<h2>完整协议</h2>
<p>这些条款构成您与 RunGame 之间关于使用服务的完整协议，并取代所有先前的协议和理解。</p>

<h2>联系我们</h2>
<p>如果您对这些条款有任何疑问，请联系我们：</p>
<ul>
  <li>电子邮件：legal@rungame.online</li>
  <li>网站：<a href="https://rungame.online/contact">https://rungame.online/contact</a></li>
</ul>

<h2>确认</h2>
<p>使用 RUNGAME 即表示您确认已阅读这些使用条款并同意受其约束。</p>
            `.trim(),
          },
        ],
      },
    },
  })

  console.log('✅ Terms of Service 页面创建成功\n')

  // 4. 创建 Contact Us 页面
  console.log('📄 创建 Contact Us 页面...')
  const contactPage = await prisma.pageType.upsert({
    where: { slug: 'contact' },
    update: {},
    create: {
      slug: 'contact',
      type: 'STATIC_CONTENT',
      icon: '📧',
      isEnabled: true,
      sortOrder: 103,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Contact Us',
            subtitle: 'Get in touch with us',
            description: 'Have questions or feedback? Contact the RunGame team.',
            metaTitle: 'Contact Us - RunGame',
            metaDescription: 'Get in touch with the RunGame team. We\'re here to help with questions, feedback, or support.',
          },
          {
            locale: 'zh',
            title: '联系我们',
            subtitle: '与我们取得联系',
            description: '有问题或反馈？联系 RunGame 团队。',
            metaTitle: '联系我们 - RunGame',
            metaDescription: '与 RunGame 团队取得联系。我们随时为您解答问题、接收反馈或提供支持。',
          },
        ],
      },
    },
  })

  // 为 Contact 创建内容块
  await prisma.pageContentBlock.create({
    data: {
      pageTypeId: contactPage.id,
      blockType: 'TEXT',
      blockKey: 'contact-content',
      sortOrder: 1,
      translations: {
        create: [
          {
            locale: 'en',
            title: 'Contact Us',
            content: `
<h2>We'd Love to Hear From You</h2>
<p>At RunGame, we value your feedback, questions, and suggestions. Whether you're experiencing technical issues, have ideas for new games, or simply want to say hello, we're here to help.</p>

<h2>How to Reach Us</h2>

<h3>📧 Email</h3>
<p>For general inquiries, feedback, or support:</p>
<p><strong>Email:</strong> <a href="mailto:hello@rungame.online">hello@rungame.online</a></p>

<p>For business inquiries and partnerships:</p>
<p><strong>Email:</strong> <a href="mailto:business@rungame.online">business@rungame.online</a></p>

<p>For legal and privacy concerns:</p>
<p><strong>Email:</strong> <a href="mailto:legal@rungame.online">legal@rungame.online</a></p>

<h3>🐛 Report Technical Issues</h3>
<p>If you encounter any bugs or technical problems while using RunGame:</p>
<p><strong>Email:</strong> <a href="mailto:support@rungame.online">support@rungame.online</a></p>
<p>Please include:</p>
<ul>
  <li>A description of the issue</li>
  <li>The game you were playing (if applicable)</li>
  <li>Your browser and operating system</li>
  <li>Screenshots if possible</li>
</ul>

<h3>🎮 Game Submissions</h3>
<p>Are you a game developer interested in having your games featured on RunGame?</p>
<p><strong>Email:</strong> <a href="mailto:games@rungame.online">games@rungame.online</a></p>

<h3>💼 Partnership Opportunities</h3>
<p>Interested in advertising, sponsorships, or business collaborations?</p>
<p><strong>Email:</strong> <a href="mailto:partnerships@rungame.online">partnerships@rungame.online</a></p>

<h3>🌐 Social Media</h3>
<p>Follow us and stay updated with the latest games and news:</p>
<ul>
  <li><strong>Twitter:</strong> <a href="https://twitter.com/rungame" target="_blank" rel="noopener noreferrer">@rungame</a></li>
  <li><strong>Facebook:</strong> <a href="https://facebook.com/rungame" target="_blank" rel="noopener noreferrer">facebook.com/rungame</a></li>
  <li><strong>Discord:</strong> <a href="https://discord.gg/rungame" target="_blank" rel="noopener noreferrer">Join our community</a></li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>How do I report inappropriate content?</h3>
<p>Please email us at <a href="mailto:report@rungame.online">report@rungame.online</a> with details about the content, including the game name and a description of the issue.</p>

<h3>Can I request a specific game to be added?</h3>
<p>Yes! We love hearing suggestions from our community. Email your game requests to <a href="mailto:suggestions@rungame.online">suggestions@rungame.online</a>.</p>

<h3>How do I delete my data?</h3>
<p>For data deletion requests, please contact <a href="mailto:privacy@rungame.online">privacy@rungame.online</a> with your request details.</p>

<h3>Are you hiring?</h3>
<p>Check our <a href="/careers">careers page</a> for current opportunities, or send your resume to <a href="mailto:careers@rungame.online">careers@rungame.online</a>.</p>

<h2>Response Time</h2>
<p>We strive to respond to all inquiries within 24-48 hours during business days. Complex technical issues may require additional time to investigate.</p>

<h2>Office Hours</h2>
<p>Our support team is available:</p>
<p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM (UTC)</p>
<p><strong>Weekends:</strong> Limited support available</p>

<h2>Mailing Address</h2>
<p>For formal correspondence:</p>
<p>
RunGame<br>
Online Gaming Platform<br>
[Address Line 1]<br>
[Address Line 2]<br>
[City, State, ZIP]<br>
[Country]
</p>

<p><em>Note: This is a mailbox address. We do not accept walk-in visits. Please use email for all inquiries.</em></p>

<h2>Feedback & Suggestions</h2>
<p>Your input helps us improve RunGame! Share your thoughts, ideas, and suggestions at <a href="mailto:feedback@rungame.online">feedback@rungame.online</a>.</p>

<p>We read every message and appreciate your support in making RunGame the best free online gaming platform!</p>
            `.trim(),
          },
          {
            locale: 'zh',
            title: '联系我们',
            content: `
<h2>我们很乐意听到您的声音</h2>
<p>在 RunGame，我们重视您的反馈、问题和建议。无论您遇到技术问题、对新游戏有想法，还是只是想打个招呼，我们都随时为您提供帮助。</p>

<h2>如何联系我们</h2>

<h3>📧 电子邮件</h3>
<p>一般咨询、反馈或支持：</p>
<p><strong>电子邮件：</strong> <a href="mailto:hello@rungame.online">hello@rungame.online</a></p>

<p>商务咨询和合作伙伴关系：</p>
<p><strong>电子邮件：</strong> <a href="mailto:business@rungame.online">business@rungame.online</a></p>

<p>法律和隐私问题：</p>
<p><strong>电子邮件：</strong> <a href="mailto:legal@rungame.online">legal@rungame.online</a></p>

<h3>🐛 报告技术问题</h3>
<p>如果您在使用 RunGame 时遇到任何错误或技术问题：</p>
<p><strong>电子邮件：</strong> <a href="mailto:support@rungame.online">support@rungame.online</a></p>
<p>请包含：</p>
<ul>
  <li>问题描述</li>
  <li>您正在玩的游戏（如适用）</li>
  <li>您的浏览器和操作系统</li>
  <li>如果可能，请提供截图</li>
</ul>

<h3>🎮 游戏提交</h3>
<p>您是游戏开发者，有兴趣将您的游戏展示在 RunGame 上吗？</p>
<p><strong>电子邮件：</strong> <a href="mailto:games@rungame.online">games@rungame.online</a></p>

<h3>💼 合作机会</h3>
<p>对广告、赞助或商业合作感兴趣？</p>
<p><strong>电子邮件：</strong> <a href="mailto:partnerships@rungame.online">partnerships@rungame.online</a></p>

<h3>🌐 社交媒体</h3>
<p>关注我们并了解最新游戏和新闻：</p>
<ul>
  <li><strong>Twitter：</strong> <a href="https://twitter.com/rungame" target="_blank" rel="noopener noreferrer">@rungame</a></li>
  <li><strong>Facebook：</strong> <a href="https://facebook.com/rungame" target="_blank" rel="noopener noreferrer">facebook.com/rungame</a></li>
  <li><strong>Discord：</strong> <a href="https://discord.gg/rungame" target="_blank" rel="noopener noreferrer">加入我们的社区</a></li>
</ul>

<h2>常见问题</h2>

<h3>如何报告不当内容？</h3>
<p>请发送电子邮件至 <a href="mailto:report@rungame.online">report@rungame.online</a>，并提供有关内容的详细信息，包括游戏名称和问题描述。</p>

<h3>我可以请求添加特定游戏吗？</h3>
<p>可以！我们很乐意听取社区的建议。将您的游戏请求发送至 <a href="mailto:suggestions@rungame.online">suggestions@rungame.online</a>。</p>

<h3>如何删除我的数据？</h3>
<p>有关数据删除请求，请联系 <a href="mailto:privacy@rungame.online">privacy@rungame.online</a> 并提供您的请求详情。</p>

<h3>你们在招聘吗？</h3>
<p>查看我们的<a href="/careers">职业页面</a>了解当前机会，或将您的简历发送至 <a href="mailto:careers@rungame.online">careers@rungame.online</a>。</p>

<h2>响应时间</h2>
<p>我们力求在工作日的 24-48 小时内回复所有咨询。复杂的技术问题可能需要额外时间进行调查。</p>

<h2>办公时间</h2>
<p>我们的支持团队工作时间：</p>
<p><strong>周一至周五：</strong>上午 9:00 - 下午 6:00（UTC）</p>
<p><strong>周末：</strong>提供有限支持</p>

<h2>邮寄地址</h2>
<p>正式通信：</p>
<p>
RunGame<br>
在线游戏平台<br>
[地址行 1]<br>
[地址行 2]<br>
[城市、州、邮编]<br>
[国家]
</p>

<p><em>注意：这是一个邮箱地址。我们不接受上门访问。请使用电子邮件进行所有咨询。</em></p>

<h2>反馈和建议</h2>
<p>您的意见帮助我们改进 RunGame！在 <a href="mailto:feedback@rungame.online">feedback@rungame.online</a> 分享您的想法、创意和建议。</p>

<p>我们阅读每一条消息，并感谢您支持我们让 RunGame 成为最好的免费在线游戏平台！</p>
            `.trim(),
          },
        ],
      },
    },
  })

  console.log('✅ Contact Us 页面创建成功\n')

  console.log('🎉 所有必备页面创建完成！\n')
  console.log('页面列表：')
  console.log('  - /about - 关于我们')
  console.log('  - /privacy - 隐私政策')
  console.log('  - /terms - 使用条款')
  console.log('  - /contact - 联系我们\n')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
