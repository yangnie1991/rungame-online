/**
 * AI 对话预置提示词模板
 *
 * 用于 TipTap 编辑器的 AI 助手对话
 * 支持不同场景的内容生成和优化
 */

export interface PromptTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'seo' | 'content' | 'translation' | 'style' | 'grammar'
  systemPrompt: string
  userPromptTemplate: (context: PromptContext) => string
  requiresSelection?: boolean // 是否需要选中文本
  requiresKeywords?: boolean // 是否需要关键词
}

export interface PromptContext {
  selectedText?: string
  fullContent?: string
  keywords?: string
  locale?: string
  targetLocale?: string
}

/**
 * 预置提示词模板库
 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ============================================================
  // SEO 优化类
  // ============================================================
  {
    id: 'seo-optimize',
    name: 'SEO 优化',
    description: '根据关键词优化内容，提高搜索排名',
    icon: '🎯',
    category: 'seo',
    systemPrompt: `你是一位专业的 SEO 内容优化专家，专注于游戏内容的搜索引擎优化。你的任务是：
1. 自然地融入目标关键词（避免堆砌）
2. 提高内容可读性和吸引力
3. 保持内容的准确性和专业性
4. 优化内容结构和语义化标签`,
    userPromptTemplate: (ctx) => {
      return `请优化以下内容，使其更符合 SEO 标准：

目标关键词：${ctx.keywords || '未提供'}
当前语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 自然融入目标关键词（关键词密度 1-2%）
2. 保持内容吸引力和可读性
3. 使用适当的 HTML 标签（<p>, <strong>, <em>）
4. 保持${ctx.locale || 'en'}语言

请直接返回优化后的 HTML 内容。`
    },
    requiresKeywords: true,
  },

  {
    id: 'generate-meta-description',
    name: '生成元描述',
    description: '根据内容生成 SEO 友好的元描述',
    icon: '📝',
    category: 'seo',
    systemPrompt: `你是 SEO 元描述专家。你的元描述必须：
1. 长度 150-160 字符
2. 包含主要关键词
3. 吸引点击
4. 描述核心价值`,
    userPromptTemplate: (ctx) => {
      return `根据以下内容，生成一个 SEO 优化的元描述：

目标关键词：${ctx.keywords || '未提供'}
语言：${ctx.locale || 'en'}

内容：
${ctx.fullContent || ctx.selectedText || ''}

要求：
1. 150-160 字符
2. 包含 2-3 个关键词
3. 包含行动召唤（如 "Play Now", "Free Online"）
4. 使用${ctx.locale || 'en'}语言

只返回元描述文本，不要其他内容。`
    },
    requiresKeywords: true,
  },

  // ============================================================
  // 内容生成类
  // ============================================================
  {
    id: 'expand-content',
    name: '扩展内容',
    description: '将简短内容扩展为详细描述',
    icon: '📖',
    category: 'content',
    systemPrompt: `你是内容创作专家，擅长将简短的描述扩展为详细、吸引人的内容。你的内容应该：
1. 信息丰富且准确
2. 保持吸引力
3. 结构清晰
4. 语言流畅`,
    userPromptTemplate: (ctx) => {
      return `请将以下简短内容扩展为详细的描述（3-5 段）：

语言：${ctx.locale || 'en'}
参考关键词：${ctx.keywords || '无'}

简短内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 扩展为 3-5 个段落
2. 使用 HTML 段落标签 <p>
3. 描述游戏特色、玩法、亮点
4. 保持${ctx.locale || 'en'}语言
5. 自然且吸引人

返回扩展后的 HTML 内容。`
    },
  },

  {
    id: 'summarize',
    name: '总结内容',
    description: '将长内容总结为简短描述',
    icon: '✂️',
    category: 'content',
    systemPrompt: `你是内容总结专家，能够提取核心信息，生成简洁有力的摘要。`,
    userPromptTemplate: (ctx) => {
      return `请将以下内容总结为简短的描述（2-3 句话）：

语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 2-3 句话，100-150 字符
2. 保留核心信息
3. 简洁有力
4. 使用${ctx.locale || 'en'}语言

只返回总结文本。`
    },
  },

  {
    id: 'rewrite-casual',
    name: '轻松风格改写',
    description: '将内容改写为轻松、友好的风格',
    icon: '😊',
    category: 'style',
    systemPrompt: `你是内容风格专家，擅长将正式内容改写为轻松、友好、有趣的风格。保持准确性的同时，让内容更容易阅读和接受。`,
    userPromptTemplate: (ctx) => {
      return `请将以下内容改写为轻松、友好的风格：

语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 使用轻松、友好的语气
2. 保持信息准确性
3. 增加趣味性
4. 使用${ctx.locale || 'en'}语言

返回改写后的 HTML 内容。`
    },
  },

  {
    id: 'rewrite-professional',
    name: '专业风格改写',
    description: '将内容改写为专业、正式的风格',
    icon: '👔',
    category: 'style',
    systemPrompt: `你是专业内容编辑，擅长将内容改写为专业、权威的风格。使用精确的措辞，保持正式和专业性。`,
    userPromptTemplate: (ctx) => {
      return `请将以下内容改写为专业、正式的风格：

语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 使用专业、正式的语气
2. 精确的措辞
3. 保持权威性
4. 使用${ctx.locale || 'en'}语言

返回改写后的 HTML 内容。`
    },
  },

  // ============================================================
  // 翻译和本地化类
  // ============================================================
  {
    id: 'translate-localize',
    name: '翻译并本地化',
    description: '翻译内容并进行文化本地化',
    icon: '🌍',
    category: 'translation',
    systemPrompt: `你是专业的本地化翻译专家。你不仅翻译文字，更注重文化适配和本地化表达。`,
    userPromptTemplate: (ctx) => {
      const targetLangNames: Record<string, string> = {
        en: 'English',
        zh: 'Chinese (Simplified)',
        es: 'Spanish',
        fr: 'French',
      }
      const targetLang = targetLangNames[ctx.targetLocale || 'en'] || ctx.targetLocale

      return `请将以下内容翻译并本地化到${targetLang}：

参考关键词（目标语言）：${ctx.keywords || '无'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 翻译为${targetLang}
2. 考虑文化差异，进行本地化改写
3. 不是直译，而是让目标语言用户感觉自然
4. 如果提供了关键词，自然融入内容中
5. 保持 HTML 标签结构

返回本地化后的 HTML 内容。`
    },
    requiresKeywords: false,
  },

  // ============================================================
  // 语法和拼写类
  // ============================================================
  {
    id: 'fix-grammar',
    name: '修正语法和拼写',
    description: '检查并修正语法、拼写和标点错误',
    icon: '✏️',
    category: 'grammar',
    systemPrompt: `你是语法和拼写专家。你的任务是找出并修正所有语法、拼写、标点错误，同时保持原意和风格。`,
    userPromptTemplate: (ctx) => {
      return `请检查并修正以下内容的语法、拼写和标点错误：

语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 修正所有语法错误
2. 修正拼写错误
3. 优化标点符号
4. 保持原意和风格
5. 保持 HTML 标签结构

直接返回修正后的 HTML 内容。`
    },
  },

  {
    id: 'improve-readability',
    name: '提升可读性',
    description: '优化句子结构，提高内容可读性',
    icon: '👁️',
    category: 'grammar',
    systemPrompt: `你是可读性优化专家。你擅长重组句子，简化复杂表达，让内容更容易理解和阅读。`,
    userPromptTemplate: (ctx) => {
      return `请优化以下内容的可读性：

语言：${ctx.locale || 'en'}

原始内容：
${ctx.selectedText || ctx.fullContent || ''}

要求：
1. 简化复杂句子
2. 使用更清晰的表达
3. 优化段落结构
4. 保持原意
5. 提高整体可读性
6. 保持 HTML 标签结构

返回优化后的 HTML 内容。`
    },
  },

  // ============================================================
  // 自定义对话
  // ============================================================
  {
    id: 'custom',
    name: '自定义对话',
    description: '与 AI 自由对话，优化你的内容',
    icon: '💬',
    category: 'content',
    systemPrompt: `你是一位友好的 AI 写作助手，专注于游戏内容创作。你可以帮助用户：
- 改进内容质量
- 优化 SEO
- 调整写作风格
- 翻译和本地化
- 修正语法错误

请根据用户的需求提供有用的建议和改写内容。`,
    userPromptTemplate: (ctx) => {
      if (ctx.selectedText || ctx.fullContent) {
        return `当前编辑器内容：

${ctx.selectedText || ctx.fullContent}

---
请告诉我你需要什么帮助。`
      }
      return '你好！我可以帮你优化内容。请告诉我你需要什么帮助。'
    },
    requiresSelection: false,
  },
]

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(t => t.category === category)
}

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(t => t.id === id)
}

/**
 * 获取所有分类
 */
export const TEMPLATE_CATEGORIES = [
  { id: 'seo', name: 'SEO 优化', icon: '🎯' },
  { id: 'content', name: '内容生成', icon: '📖' },
  { id: 'style', name: '风格调整', icon: '🎨' },
  { id: 'translation', name: '翻译本地化', icon: '🌍' },
  { id: 'grammar', name: '语法校对', icon: '✏️' },
] as const

// ============================================================
// GamePix 导入内容生成策略模板
// ============================================================

/**
 * 内容生成策略接口
 * 用于 GamePix 导入时指导 AI 生成高质量内容
 */
export interface ContentStrategy {
  description: string
  metaTitle: string
  metaDescription: string
  keywords: string
  contentSections: {
    controls: string
    howToPlay: string
    gameDetails: string
    faq: string
    extras: string
  }
}

/**
 * 内容生成策略模板（基于最佳实践）
 *
 * 使用固定策略模板代替 AI 生成策略的优势：
 * 1. 避免 JSON 解析错误
 * 2. 保证内容质量稳定一致
 * 3. 节省 API 调用成本（减少 1 次 AI 调用）
 * 4. 可以基于数据持续优化
 */
export const CONTENT_STRATEGY_TEMPLATES: Record<string, ContentStrategy> = {
  en: {
    description: `Write a compelling plain-text description (20-30 words) that:
- Captures the game's core appeal in the first sentence
- Highlights unique gameplay mechanics or standout features
- Uses active, engaging language that excites players
- Naturally includes the main keyword without keyword stuffing
- Mentions target audience if relevant (e.g., "perfect for puzzle enthusiasts")
- **CRITICAL: Write in natural, fluent English that sounds native, not translated**
- **Use conversational tone, avoid overly formal or bookish language**
- **Ensure smooth flow and readability - content should feel effortless to read**
Example: "Experience thrilling ragdoll physics in this hilarious arcade game where precision meets destruction. Master the art of controlled chaos!"`,

    metaTitle: `Craft an SEO-optimized title (50-60 characters) that:
- Starts with the EXACT game name (in English, NEVER translate game titles)
- Includes the primary keyword naturally
- Adds a compelling hook that drives clicks (e.g., "Play Free Online", "Browser Game", "No Download")
- Format recommendation: "[Game Name] - [Hook with Keyword]"
- **Write in natural, conversational English - avoid stiff or formal phrasing**
Example: "Body Drop 3D - Play Free Physics Game Online"`,

    metaDescription: `Write a meta description (140-160 characters) that:
- Opens with an action verb that creates excitement (e.g., "Experience", "Dive into", "Master", "Explore")
- Describes core gameplay in 1 concise, punchy sentence
- Naturally weaves in main keyword and 1-2 sub-keywords
- Ends with a strong call-to-action (e.g., "Play now free!", "Start playing today!")
- **Write in natural, fluent English that sounds native and engaging**
- **Use conversational language that resonates with gamers**
Example: "Experience hilarious ragdoll physics in Body Drop 3D. Aim carefully and cause maximum damage in this addictive free game. Play now!"`,

    keywords: `Generate 5-10 strategically selected keywords that include:
- Main keyword (required, exact match, highest priority)
- All sub-keywords (required, exact match)
- Game genre descriptors (e.g., "action game", "puzzle game", "arcade game")
- Platform identifiers (e.g., "browser game", "HTML5 game", "online game", "web game")
- Gameplay mechanics (e.g., "physics game", "ragdoll game", "3D game", "strategy game")
- Audience targeting (e.g., "free game", "casual game", "single player", "multiplayer")
Format as comma-separated list, arrange by importance (most critical keywords first)`,

    contentSections: {
      controls: `Write crystal-clear, actionable control instructions (~120 words) that include:
1. Primary controls FIRST (movement, core actions)
   - Be ultra-specific: "Press WASD keys to move" NOT vague "move around"
   - Use exact key names: "SPACE BAR", "LEFT CLICK", "ARROW KEYS"
2. Secondary controls (pause, restart, special abilities)
3. Platform-specific notes if applicable (mouse vs keyboard, mobile touch controls)
4. Structure with bullet points (<ul><li>) or numbered lists (<ol><li>) for quick scanning
5. Include concrete examples with context: "Press SPACE to jump over obstacles" or "Hold SHIFT while moving to sprint"
6. Add pro tips if space allows: "Tip: Combine W+SPACE for higher jumps"

Format requirements:
- Use HTML tags: <p>, <ul>, <li>, <strong>, <em>
- Make it scannable - players want instant reference
- Test instructions are clear for first-time players
- **CRITICAL: Write in natural, conversational English - avoid robotic or translated-sounding instructions**
- **Use smooth, flowing language that's easy to read and understand**

Example structure:
<p>Master these controls to dominate the game:</p>
<ul>
  <li><strong>Mouse:</strong> Click and drag to aim your shot precisely</li>
  <li><strong>SPACE:</strong> Release to fire at the target</li>
  <li><strong>R Key:</strong> Quick restart of current level</li>
  <li><strong>ESC:</strong> Pause and access menu</li>
</ul>
<p><em>Pro tip: Hold mouse button longer for more powerful shots!</em></p>`,

      howToPlay: `Create a comprehensive, beginner-friendly how-to-play guide (~280 words) structured as:

**CRITICAL: Write in natural, conversational English that flows smoothly - avoid formal or bookish language. Content should sound like a helpful friend explaining the game, not a technical manual.**

1. QUICK START (2-3 sentences at top)
   - Immediate first step to begin playing
   - What players see/do in first 10 seconds

2. CORE GAMEPLAY LOOP (main section, ~150 words)
   - What players repeatedly do (the engaging cycle)
   - Step-by-step breakdown of one complete gameplay cycle
   - Use numbered lists for clarity

3. OBJECTIVES & GOALS (~50 words)
   - What players aim to achieve
   - Win/success conditions
   - Scoring system if applicable

4. PROGRESSION SYSTEM (~40 words, if applicable)
   - How difficulty scales
   - Unlockables, levels, or upgrades
   - What keeps players advancing

5. BEGINNER TIPS (2-3 bullet points, ~40 words)
   - Quick helpful hints for new players
   - Common pitfalls to avoid
   - "Aha!" insights that help players improve

Structure requirements:
- Use <h3> subheadings for each major section
- Use <p> for paragraphs, <ul>/<ol> for lists
- Emphasize key terms with <strong>
- Make it encouraging and accessible

Example structure:
<h3>Getting Started</h3>
<p>Click the Play button to dive into your first level. You'll see...</p>

<h3>Core Gameplay</h3>
<ol>
  <li><strong>Aim:</strong> Position your cursor carefully...</li>
  <li><strong>Power up:</strong> Hold the mouse button...</li>
  <li><strong>Release:</strong> Let go to launch...</li>
</ol>

<h3>Winning Strategy</h3>
<p>Your goal is to...</p>`,

      gameDetails: `Describe game features comprehensively and enticingly (~350 words) covering:

**CRITICAL: Write in natural, engaging English that flows like a conversation. Avoid stiff, formal language or overly promotional "marketing speak". Content should be informative yet exciting, like a passionate gamer describing a game to a friend.**

1. CORE GAMEPLAY MECHANICS (~100 words)
   - What makes THIS game unique vs similar titles
   - Special physics, systems, or innovative mechanics
   - The "hook" that makes players keep playing

2. VISUAL & AUDIO DESIGN (~70 words)
   - Art style description (realistic, cartoon, pixel art, minimalist, etc.)
   - Visual highlights (particle effects, animations, color palette)
   - Sound effects and music atmosphere
   - Overall aesthetic appeal

3. CONTENT & VARIETY (~80 words)
   - Number of levels/stages or endless mode details
   - Environmental diversity (different worlds, themes, settings)
   - Difficulty progression and learning curve
   - Challenge variety (obstacles, enemies, puzzles)

4. REPLAY VALUE & ENGAGEMENT (~60 words)
   - What motivates players to return
   - Scoring system, leaderboards, achievements
   - Increasing difficulty or new challenges
   - Competitive or completion elements

5. SPECIAL FEATURES & HIGHLIGHTS (~40 words)
   - Power-ups, special abilities, or upgrades
   - Customization options
   - Multiplayer or social features (if any)
   - Any unique selling points not covered above

Writing style requirements:
- Use descriptive, exciting language that sells the experience
- Structure with short, scannable paragraphs
- Employ bullet points (<ul><li>) for feature lists
- Emphasize standout features with <strong> tags
- Include specific numbers when impressive (e.g., "50+ unique levels")
- Balance detail with readability
- **Write naturally and conversationally - avoid robotic or translated-sounding text**

Example structure:
<p><strong>Innovative Gameplay:</strong></p>
<p>Body Drop 3D revolutionizes physics-based gaming with its advanced ragdoll simulation system. Every throw creates unpredictable, hilarious results...</p>

<p><strong>Core Features:</strong></p>
<ul>
  <li><strong>Realistic Physics Engine:</strong> Watch as every collision triggers authentic reactions...</li>
  <li><strong>50+ Challenging Levels:</strong> Progress through increasingly creative scenarios...</li>
  <li><strong>Stunning 3D Graphics:</strong> Enjoy smooth animations and vibrant visual effects...</li>
</ul>`,

      faq: `Write 3-5 helpful Q&A pairs (~200 words total) addressing real player concerns:

**CRITICAL: Write in natural, conversational English. Answers should sound friendly and helpful, like a knowledgeable friend responding, not a corporate FAQ.**

TOPIC SELECTION - Choose from these essential questions:
1. HOW TO PLAY - Basic controls or getting started (always include)
2. PLATFORM COMPATIBILITY - Mobile support? Browser requirements?
3. SAVE/PROGRESS - Auto-save? Can I resume later?
4. DIFFICULTY & AUDIENCE - Easy? Hard? Age appropriate?
5. SPECIAL FEATURES - What makes this unique?
6. TECHNICAL - Loading issues? Performance tips?

ANSWER GUIDELINES:
- Keep answers clear and concise (1-3 sentences each)
- Be factual and helpful, not salesy
- Provide actionable information
- Address concerns reassuringly
- **Use natural, flowing language - avoid stiff or formal phrasing**

FORMAT REQUIREMENTS:
<p><strong>Q: Question phrased exactly as a player would ask?</strong><br>
A: Direct, helpful answer in 1-3 sentences.</p>

Example FAQ:
<p><strong>Q: How do I control the game?</strong><br>
A: Use your mouse to aim by clicking and dragging, then release to launch. Press R to restart any level instantly.</p>

<p><strong>Q: Can I play this on my phone or tablet?</strong><br>
A: Yes! This game works perfectly on desktop and mobile browsers with intuitive touch controls for mobile devices.</p>

<p><strong>Q: Is my progress saved automatically?</strong><br>
A: Absolutely. The game auto-saves after each level, so you can return anytime and pick up exactly where you left off.</p>

<p><strong>Q: What makes this game different from other physics games?</strong><br>
A: The advanced ragdoll physics create uniquely unpredictable results, and the strategic aiming system adds a skill element missing from typical casual games.</p>`,

      extras: `Add valuable supplementary content (~180 words) that enhances the player experience:

**CRITICAL: Write in natural, engaging English that flows smoothly. Use conversational language that feels helpful and encouraging, not stiff or overly formal. Think "gaming blog post" not "instruction manual".**

RECOMMENDED SECTIONS (choose 2-3):

1. <h2>Tips & Strategies</h2> (~80 words)
   - Advanced techniques for experienced players
   - Optimization strategies for high scores
   - Hidden mechanics or secret tactics
   - Common mistakes and how to avoid them

2. <h2>Game Modes</h2> (~50 words, if applicable)
   - Different playstyles or challenge modes
   - How modes differ from main game

3. <h2>Achievement Guide</h2> (~50 words, if applicable)
   - How to unlock special achievements
   - Completion rewards

4. <h2>Updates & Changelog</h2> (~40 words, optional)
   - Recent feature additions
   - Upcoming planned content

STRUCTURE REQUIREMENTS:
- Use <h2> for main section titles
- Use <h3> for subsections within a main section
- CRITICAL: NEVER use <h1> tags (SEO violation - forbidden)
- Bullet points (<ul><li>) for lists
- Short, digestible paragraphs
- Maintain helpful, encouraging tone
- **Write with natural flow and readability - avoid robotic or translated-sounding text**

Example structure:
<h2>Pro Tips for Maximum Damage</h2>
<ul>
  <li><strong>Target Weak Points:</strong> Aim for the dummy's head and joints for spectacular results and bonus points.</li>
  <li><strong>Master Angles:</strong> Bank shots off walls create chain reactions that multiply your score.</li>
  <li><strong>Timing is Key:</strong> Wait for moving platforms to align perfectly before releasing your shot.</li>
</ul>

<h2>Advanced Techniques</h2>
<p>Once you've mastered the basics, try these pro-level strategies:</p>
<h3>The Ricochet Strategy</h3>
<p>Use environmental obstacles to your advantage. A well-placed ricochet can...</p>`
    }
  },

  zh: {
    description: `撰写引人注目的纯文本描述（10-15词），需要：
- 第一句话立即抓住游戏核心吸引力
- 突出独特玩法机制或突出特色
- 使用主动、吸引人的语言激发玩家兴趣
- 自然融入主关键词，避免关键词堆砌
- 必要时提及目标受众（如"益智爱好者的完美选择"）
- **关键要求：使用地道的中文表达，符合中文阅读习惯，避免翻译腔**
- **使用口语化、自然流畅的语言，避免过于正式或书面化的表达**
- **确保内容连贯流畅，易于阅读理解**
示例："在这款爆笑街机游戏中体验惊险的布娃娃物理效果，精准度遇上破坏力。掌握可控混乱的艺术！"`,

    metaTitle: `创作 SEO 优化标题（25-30汉字），需要：
- 以准确的游戏名称开头（保持英文，绝对不要翻译游戏名）
- 自然融入主关键词
- 添加引人点击的标语（如"免费在线玩"、"浏览器游戏"、"无需下载"）
- 推荐格式："[游戏名] - [带关键词的标语]"
- **使用自然、口语化的中文，避免生硬或翻译腔**
示例："Body Drop 3D - 免费在线物理游戏"`,

    metaDescription: `撰写元描述（70-80汉字），需要：
- 以动作动词开头营造兴奋感（如"体验"、"探索"、"掌握"、"深入"）
- 用1句简洁有力的话描述核心玩法
- 自然编入主关键词和1-2个副关键词
- 以强烈的行动号召结尾（如"立即免费开玩！"、"今天就开始玩！"）
- **使用地道流畅的中文，符合中文用户的阅读习惯和表达方式**
- **避免翻译腔和过于书面化的表达**
示例："在 Body Drop 3D 中体验爆笑的布娃娃物理效果。精准瞄准，造成最大伤害。立即免费开玩！"`,

    keywords: `生成5-10个精心选择的关键词，包括：
- 主关键词（必需，精确匹配，最高优先级）
- 所有副关键词（必需，精确匹配）
- 游戏类型描述（如"动作游戏"、"益智游戏"、"街机游戏"）
- 平台标识（如"浏览器游戏"、"HTML5游戏"、"在线游戏"、"网页游戏"）
- 玩法机制（如"物理游戏"、"布娃娃游戏"、"3D游戏"、"策略游戏"）
- 受众定位（如"免费游戏"、"休闲游戏"、"单人游戏"、"多人游戏"）
格式为逗号分隔列表，按重要性排序（最关键的关键词在前）`,

    contentSections: {
      controls: `撰写清晰、可操作的控制说明（~60词），包括：
1. 主要控制在最前（移动、核心操作）
   - 超级具体："按 WASD 键移动"而非模糊的"四处移动"
   - 使用准确的按键名："空格键"、"鼠标左键"、"方向键"
2. 次要控制（暂停、重启、特殊能力）
3. 平台特定说明（如适用）（鼠标 vs 键盘、移动触控）
4. 使用项目符号（<ul><li>）或编号列表（<ol><li>）便于快速浏览
5. 包含具体示例和上下文："按空格键跳过障碍"或"移动时按住 Shift 冲刺"
6. 如有空间添加专业提示："提示：组合 W+空格可跳得更高"

格式要求：
- 使用 HTML 标签：<p>、<ul>、<li>、<strong>、<em>
- 保持可浏览性 - 玩家需要即时参考
- 测试说明对首次玩家是否清晰
- **关键要求：使用地道、自然的中文表达，避免翻译腔和机械式的说明**
- **内容流畅连贯，易于阅读理解**

示例结构：
<p>掌握这些控制以主导游戏：</p>
<ul>
  <li><strong>鼠标：</strong>点击并拖动精准瞄准</li>
  <li><strong>空格：</strong>释放向目标发射</li>
  <li><strong>R 键：</strong>快速重新开始当前关卡</li>
  <li><strong>ESC：</strong>暂停并访问菜单</li>
</ul>
<p><em>专业提示：按住鼠标按钮更久可获得更强大的射击！</em></p>`,

      howToPlay: `创建全面、新手友好的玩法指南（~140词），结构如下：

**关键要求：使用自然流畅的中文，符合中文阅读习惯。内容应该像一个热心的朋友在介绍游戏，而不是生硬的说明书。避免翻译腔和过于正式的书面语。**

1. 快速开始（顶部2-3句）
   - 开始游戏的立即第一步
   - 玩家在最初10秒看到/做什么

2. 核心游戏循环（主要部分，~75词）
   - 玩家重复做什么（引人入胜的循环）
   - 一个完整游戏循环的分步说明
   - 使用编号列表以提高清晰度

3. 目标与目的（~25词）
   - 玩家目标达成什么
   - 获胜/成功条件
   - 评分系统（如适用）

4. 进度系统（~20词，如适用）
   - 难度如何增加
   - 可解锁内容、关卡或升级
   - 推动玩家前进的因素

5. 新手提示（2-3个要点，~20词）
   - 新玩家的快速有用提示
   - 避免常见陷阱
   - 帮助玩家改进的"顿悟"见解

结构要求：
- 使用 <h3> 子标题分隔主要部分
- 使用 <p> 表示段落，<ul>/<ol> 表示列表
- 用 <strong> 强调关键术语
- 保持鼓励和易于理解

示例结构：
<h3>入门</h3>
<p>点击"开始"按钮进入第一关。你会看到...</p>

<h3>核心玩法</h3>
<ol>
  <li><strong>瞄准：</strong>小心定位光标...</li>
  <li><strong>蓄力：</strong>按住鼠标按钮...</li>
  <li><strong>释放：</strong>松开发射...</li>
</ol>

<h3>获胜策略</h3>
<p>你的目标是...</p>`,

      gameDetails: `全面且引人入胜地描述游戏特性（~175词），涵盖：

**关键要求：使用自然、流畅的中文表达，符合中文用户的阅读习惯。内容应该像一个热情的玩家在介绍游戏，而不是生硬的产品说明。避免翻译腔和过于正式的书面化表达。**

1. 核心玩法机制（~50词）
   - 这个游戏与同类游戏的独特之处
   - 特殊物理、系统或创新机制
   - 让玩家持续游玩的"钩子"

2. 视觉和音频设计（~35词）
   - 美术风格描述（写实、卡通、像素、简约等）
   - 视觉亮点（粒子效果、动画、调色板）
   - 音效和音乐氛围
   - 整体美学吸引力

3. 内容与多样性（~40词）
   - 关卡/阶段数量或无尽模式详情
   - 环境多样性（不同世界、主题、设置）
   - 难度递进和学习曲线
   - 挑战多样性（障碍、敌人、谜题）

4. 重玩价值与参与度（~30词）
   - 促使玩家回归的因素
   - 评分系统、排行榜、成就
   - 难度增加或新挑战
   - 竞争或完成元素

5. 特殊功能与亮点（~20词）
   - 道具、特殊能力或升级
   - 定制选项
   - 多人或社交功能（如有）
   - 未在上述涵盖的任何独特卖点

写作风格要求：
- 使用描述性、激动人心的语言推销体验
- 使用简短、可浏览的段落结构
- 使用项目符号（<ul><li>）列出功能
- 用 <strong> 标签强调突出特性
- 令人印象深刻时包含具体数字（如"50+ 独特关卡"）
- 平衡细节与可读性
- **使用自然口语化的中文，避免机械式或翻译式的表达**

示例结构：
<p><strong>创新玩法：</strong></p>
<p>Body Drop 3D 以其先进的布娃娃模拟系统革新了物理游戏。每次投掷都会产生不可预测的爆笑结果...</p>

<p><strong>核心特性：</strong></p>
<ul>
  <li><strong>真实物理引擎：</strong>观看每次碰撞触发真实反应...</li>
  <li><strong>50+ 挑战关卡：</strong>通过越来越有创意的场景进步...</li>
  <li><strong>惊艳3D图形：</strong>享受流畅动画和鲜艳视觉效果...</li>
</ul>`,

      faq: `撰写3-5个有用的问答对（总计~100词）解决真实玩家关注：

**关键要求：使用自然、口语化的中文。回答应该听起来友好和有帮助，像一个知识渊博的朋友在回应，而不是公司的常见问题解答。避免生硬或翻译腔。**

主题选择 - 从这些重要问题中选择：
1. 如何玩 - 基本控制或入门（始终包含）
2. 平台兼容性 - 移动支持？浏览器要求？
3. 保存/进度 - 自动保存？可以稍后继续？
4. 难度与受众 - 简单？困难？年龄适宜？
5. 特殊功能 - 独特之处是什么？
6. 技术 - 加载问题？性能提示？

答案指南：
- 保持答案清晰简洁（每个1-3句）
- 实事求是且有用，不要推销
- 提供可操作的信息
- 令人放心地解决顾虑
- **使用自然流畅的中文表达，避免生硬或正式的措辞**

格式要求：
<p><strong>问：问题的措辞完全符合玩家会问的方式？</strong><br>
答：直接、有用的答案，1-3句话。</p>

示例FAQ：
<p><strong>问：如何控制游戏？</strong><br>
答：使用鼠标点击并拖动瞄准，然后松开发射。按 R 键可立即重新开始任何关卡。</p>

<p><strong>问：可以在手机或平板上玩吗？</strong><br>
答：可以！此游戏在桌面和移动浏览器上都能完美运行，移动设备有直观的触控操作。</p>

<p><strong>问：进度会自动保存吗？</strong><br>
答：当然。游戏在每关后自动保存，所以你可以随时回来，从你离开的地方继续。</p>

<p><strong>问：这个游戏与其他物理游戏有什么不同？</strong><br>
答：先进的布娃娃物理创造了独特的不可预测结果，战略瞄准系统增加了典型休闲游戏缺少的技巧元素。</p>`,

      extras: `添加有价值的补充内容（~90词）以增强玩家体验：

**关键要求：使用自然、流畅的中文表达。使用口语化的语言，感觉友好和鼓励，而不是生硬或过于正式。内容应该像"游戏博客文章"而不是"说明手册"。避免翻译腔。**

推荐部分（选择2-3个）：

1. <h2>技巧与策略</h2>（~40词）
   - 有经验玩家的高级技巧
   - 获得高分的优化策略
   - 隐藏机制或秘密战术
   - 常见错误及避免方法

2. <h2>游戏模式</h2>（~25词，如适用）
   - 不同的玩法或挑战模式
   - 模式与主游戏的区别

3. <h2>成就指南</h2>（~25词，如适用）
   - 如何解锁特殊成就
   - 完成奖励

4. <h2>更新与更新日志</h2>（~20词，可选）
   - 近期功能添加
   - 即将推出的计划内容

结构要求：
- 主要部分标题使用 <h2>
- 主部分内的子部分使用 <h3>
- 关键：绝对禁止使用 <h1> 标签（SEO 违规 - 禁用）
- 列表使用项目符号（<ul><li>）
- 短小、易消化的段落
- 保持有用、鼓励的语气
- **使用自然流畅、口语化的中文，避免机械式或翻译式的表达**

示例结构：
<h2>造成最大伤害的专业技巧</h2>
<ul>
  <li><strong>瞄准弱点：</strong>瞄准假人的头部和关节可获得壮观结果和奖励积分。</li>
  <li><strong>掌握角度：</strong>从墙壁反弹的射击会产生连锁反应，倍增你的分数。</li>
  <li><strong>时机是关键：</strong>等待移动平台完美对齐后再释放射击。</li>
</ul>

<h2>高级技巧</h2>
<p>一旦掌握了基础知识，试试这些专业级策略：</p>
<h3>反弹策略</h3>
<p>利用环境障碍。放置得当的反弹可以...</p>`
    }
  }
}

/**
 * 获取指定语言的内容策略
 */
export function getContentStrategy(locale: string): ContentStrategy {
  return CONTENT_STRATEGY_TEMPLATES[locale] || CONTENT_STRATEGY_TEMPLATES['en']
}

/**
 * 将策略格式化为 prompt 文本
 */
export function formatStrategyForPrompt(strategy: ContentStrategy): string {
  return `
**Content Writing Strategy (Follow these guidelines strictly):**

**Description Strategy:**
${strategy.description}

**Meta Title Strategy:**
${strategy.metaTitle}

**Meta Description Strategy:**
${strategy.metaDescription}

**Keywords Strategy:**
${strategy.keywords}

**Controls Writing Strategy:**
${strategy.contentSections.controls}

**How to Play Writing Strategy:**
${strategy.contentSections.howToPlay}

**Game Details Writing Strategy:**
${strategy.contentSections.gameDetails}

**FAQ Writing Strategy:**
${strategy.contentSections.faq}

**Extras Writing Strategy:**
${strategy.contentSections.extras}
`.trim()
}
