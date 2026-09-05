<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Mic2, Sparkles, FileText, WandSparkles, Hash, Languages, Heart, PenLine, Music, LayoutGrid, PenTool, Megaphone, Copy, ScanSearch, Bot, Palette, Video, Image as ImageIcon, FolderOpen, Clapperboard, Layers, ScanFace, Mic, AudioLines, UserRound, LogOut, Search, Zap, Wallet, ChevronDown, History } from 'lucide-vue-next'
import { secureFetch } from './secure-api'

// ============ 工具定义 ============
const TOOLS: any[] = [
  // 智能文案
  { key: 'koudabo', featureCode: 'spoken_copy', group: '文案', title: '口播文案', sub: '短视频口播必备神器', icon: Mic2, color: '#ff6b35', prompt: ([s, e]: any) => `请为以下主题创作一篇短视频口播文案，要求：口语化、有钩子开头、节奏感强、结尾引导互动。主题：${s}${e.duration ? `\n时长要求：${e.duration}` : ''}${e.platform ? `\n发布平台：${e.platform}` : ''}`, fields: [{ k: 'subject', label: '口播主题', type: 'textarea', ph: '如：一家新开的咖啡店' }, { k: 'duration', label: '口播时长', type: 'select', options: ['30秒', '60秒', '90秒'] }, { k: 'platform', label: '发布平台', type: 'select', options: ['抖音', 'B站', '快手'] }], withImg: true, directions: ['幽默', '正式', '煽情', '干货', '悬念'] },
  { key: 'deepseek', featureCode: 'viral_spoken_copy', group: '文案', title: 'DeepSeek口播', sub: 'DeepSeek 满血版创作', icon: Sparkles, color: '#4d7cfe', model: 'deepseek-v4-pro', prompt: ([s, e]: any) => `请为以下主题创作一篇爆款口播文案，风格${e.tone || '犀利'}有网感：${s}`, fields: [{ k: 'subject', label: '创作主题', type: 'textarea', ph: '如：职场打工人如何拒绝内耗' }, { k: 'tone', label: '风格', type: 'select', options: ['犀利吐槽', '幽默', '走心', '正式大气'] }], withImg: true, directions: ['犀利吐槽', '幽默', '走心', '正式大气'] },
  { key: 'xiaohongshu', featureCode: 'xiaohongshu_note', group: '文案', title: '小红书笔记', sub: '轻松生成热门笔记', icon: FileText, color: '#ff4757', prompt: ([s, e]: any) => `请为以下主题写一篇小红书种草笔记：标题要有吸引力，正文 300 字左右，口语化、分段清晰、带 emoji，结尾带话题标签${e.audience ? `，目标人群是${e.audience}` : ''}。主题：${s}`, fields: [{ k: 'subject', label: '笔记主题', type: 'textarea', ph: '如：新手养猫避坑指南' }, { k: 'audience', label: '目标人群', type: 'select', options: ['通用', '学生党', '上班族', '宝妈', '健身党'] }], withImg: true, directions: ['种草', '避坑', '测评', '攻略', '探店'] },
  { key: 'rewrite', group: '文案', title: '文案改写', sub: '智能改写/润色/扩写', icon: WandSparkles, color: '#8b5cf6', prompt: ([s, e]: any) => `请改写以下文案${e.len ? `，篇幅要求：${e.len}` : ''}，要求：保留原意、表达更生动流畅、风格更高级。原文：${s}`, fields: [{ k: 'subject', label: '原文内容', type: 'textarea', ph: '粘贴需要改写的文案' }, { k: 'len', label: '篇幅', type: 'select', options: ['精简（100字内）', '标准（约300字）', '扩充（800字以上）'] }], withImg: false, directions: ['更简洁', '更生动', '更高级', '更口语化'] },
  { key: 'title', group: '文案', title: '标题生成', sub: '生成爆款标题', icon: Hash, color: '#f59e0b', prompt: ([s, e]: any) => `请为以下内容生成${e.count || '10个'}爆款标题（适合${e.platform || '通用平台'}），风格包含悬念型、数字型、痛点型、对比型各若干，直接输出编号列表。主题：${s}`, fields: [{ k: 'subject', label: '内容主题', type: 'textarea', ph: '如：AI 工具推荐' }, { k: 'count', label: '数量', type: 'select', options: ['5个', '10个', '20个'] }, { k: 'platform', label: '发布平台', type: 'select', options: ['公众号', '小红书', 'B站', '抖音'] }], withImg: false, directions: ['悬念型', '数字型', '痛点型', '对比型'] },
  { key: 'translate', group: '文案', title: '翻译文案', sub: '中英互译/多语种', icon: Languages, color: '#06b6d4', prompt: ([s, e]: any) => `请将以下内容翻译成${e.lang || '英语'}，要求${e.tone || '地道自然'}，保持语气风格：${s}`, fields: [{ k: 'subject', label: '待翻译内容', type: 'textarea', ph: '粘贴需要翻译的文本' }, { k: 'lang', label: '目标语言', type: 'select', options: ['英语', '日语', '韩语', '法语', '德语', '西班牙语', '俄语', '中文'] }, { k: 'tone', label: '语气', type: 'select', options: ['地道口语', '正式书面', '商务沟通'] }], withImg: false },
  { key: 'emotion', group: '文案', title: '情感专家', sub: '走心文字，直击人心', icon: Heart, color: '#ec4899', prompt: ([s, e]: any) => `请围绕以下主题${e.to ? `，写给${e.to}` : ''}，写一段走心的情感文案（形式：${e.len || '段落'}），要有画面感、共鸣感，适合深夜发布：${s}`, fields: [{ k: 'subject', label: '主题/想说的话', type: 'textarea', ph: '如：关于异地恋' }, { k: 'to', label: '写给谁', type: 'select', options: ['爱人', '朋友', '自己', '家人', '前任'] }, { k: 'len', label: '形式', type: 'select', options: ['短句（1-3句）', '段落（100字左右）', '长文（300字左右）'] }], withImg: true, directions: ['深情', '治愈', '伤感', '励志'] },
  { key: 'poem', group: '文案', title: '打油诗生成', sub: '幽默打油诗大师', icon: PenLine, color: '#10b981', prompt: ([s, e]: any) => `请为以下主题创作一首${e.style || '幽默'}打油诗，押韵、朗朗上口、带点自嘲：${s}`, fields: [{ k: 'subject', label: '诗歌主题', type: 'textarea', ph: '如：减肥' }, { k: 'style', label: '风格', type: 'select', options: ['幽默', '古风', '励志', '打油'] }], withImg: false, directions: ['幽默', '古风', '励志', '打油'] },
  { key: 'lyrics', group: '文案', title: '写歌词', sub: '歌词创作好帮手', icon: Music, color: '#a855f7', prompt: ([s, e]: any) => `请为以下主题创作一首${e.style || '流行'}风格歌词，包含主歌、副歌结构，押韵自然、有记忆点：${s}`, fields: [{ k: 'subject', label: '歌曲主题', type: 'textarea', ph: '如：毕业季的夏天' }, { k: 'style', label: '曲风', type: 'select', options: ['流行', '民谣', '古风', 'RAP'] }], withImg: false, directions: ['流行', '民谣', '古风', 'RAP'] },
  { key: 'general', group: '文案', title: '通用文案', sub: '万能写作助手', icon: LayoutGrid, color: '#3b82f6', prompt: ([s]: any) => `请帮我完成以下写作任务：${s}`, fields: [{ k: 'subject', label: '写作任务', type: 'textarea', ph: '描述你想写的内容，如：帮我写一段店铺开业祝福语' }], withImg: false, directions: ['简洁', '详细', '正式', '口语'] },
  { key: 'writing', group: '文案', title: '智能写作', sub: '长文/短文随心写', icon: PenTool, color: '#6366f1', prompt: ([s, e]: any) => `请围绕以下主题创作一篇${e.genre || '结构完整、内容充实'}的文章（篇幅${e.len || '约500字'}）：${s}`, fields: [{ k: 'subject', label: '写作主题', type: 'textarea', ph: '如：如何坚持早起' }, { k: 'len', label: '篇幅', type: 'select', options: ['约500字', '约1000字', '约2000字'] }, { k: 'genre', label: '文体', type: 'select', options: ['议论文', '故事', '干货指南', '书信'] }], withImg: false, directions: ['议论文', '故事', '干货指南', '书信'] },
  { key: 'marketing', group: '文案', title: '营销文案', sub: '卖点提炼+转化文案', icon: Megaphone, color: '#ef4444', prompt: ([s, e]: any) => `请为以下产品/服务写一段${e.type || '营销'}文案（面向${e.audience || '目标人群'}）：突出卖点、激发购买欲、带行动号召。内容：${s}`, fields: [{ k: 'subject', label: '产品/服务', type: 'textarea', ph: '如：手工精油皂，主打天然成分' }, { k: 'audience', label: '目标人群', type: 'select', options: ['通用', '年轻女性', '宝妈', '商务人士', '健身人群'] }, { k: 'type', label: '文案类型', type: 'select', options: ['朋友圈', '商品详情页', '短视频脚本', '广告语'] }], withImg: true, directions: ['卖点突出', '限时促销', '情感共鸣', '专业背书'] },
  { key: 'imitate', group: '文案', title: '文案仿写', sub: '按风格仿写爆款', icon: Copy, color: '#14b8a6', prompt: ([s, e]: any) => `请分析以下文案的风格特点，并模仿该风格仿写一篇同主题新文案（用于${e.use || '类似场景'}）：${s}`, fields: [{ k: 'subject', label: '参考文案', type: 'textarea', ph: '粘贴想要模仿风格的文案' }, { k: 'use', label: '发布场景', type: 'select', options: ['朋友圈', '小红书', '抖音脚本', '公众号'] }], withImg: false, directions: ['保持风格', '更夸张', '更克制', '更年轻'] },
  { key: 'extract', group: '文案', title: '文案提取', sub: '视频/长文提炼要点', icon: ScanSearch, color: '#64748b', prompt: ([s]: any) => `请提取并整理以下内容中的完整文案/核心要点，去除口语杂质、保留干货：${s}`, fields: [{ k: 'subject', label: '待提取内容', type: 'textarea', ph: '粘贴视频文案/长文/采访稿' }], withImg: false, featureCode: 'extract' },
  // AIGC 工具集
  { key: 'chat', group: 'AIGC', title: 'AI对话', sub: '智能助手随时聊', icon: Bot, color: '#22d3ee' },
  { key: 'image', group: 'AIGC', title: 'AI绘画', sub: '文生图/图生图', icon: Palette, color: '#f472b6', needCap: 'draw' },
  { key: 'product_main', featureCode: 'image', group: 'AIGC', title: '商品主图', sub: '上传商品图生成电商主图', icon: ImageIcon, color: '#fb7185', needCap: 'draw' },
  { key: 'video', group: 'AIGC', title: 'AI视频', sub: '文生视频/图生视频', icon: Video, color: '#8b5cf6', needCap: 'video' },
  { key: 'tts', group: 'AIGC', title: 'AI配音', sub: '文案一键转语音（免费）', icon: AudioLines, color: '#22c55e' },
  { key: 'music', group: 'AIGC', title: 'AI音乐', sub: '歌词与描述生成完整音乐', icon: Music, color: '#84cc16', needCap: 'music' },
  // 数字人分身
  { key: 'avatar_clone', group: '数字人', title: '形象克隆', sub: '参考形象生成数字人视频', icon: UserRound, color: '#f97316', needCap: 'digital_human' },
  { key: 'voice_clone', group: '数字人', title: '声音克隆', sub: '参考音频克隆专属声音', icon: Mic, color: '#8b5cf6', needCap: 'audio' },
  { key: 'face_merge', group: '数字人', title: '人脸融合', sub: '双人脸照片自然融合', icon: ScanFace, color: '#ec4899', needCap: 'face_merge' },
  { key: 'photo_dh', group: '数字人', title: '照片数字人', sub: '静态照片生成口播视频', icon: ImageIcon, color: '#06b6d4', needCap: 'digital_human' },
  // 智能剪辑
  { key: 'works', group: '剪辑', title: '我的作品', sub: '生成历史与成果', icon: FolderOpen, color: '#3b82f6' },
  { key: 'materials', group: '剪辑', title: '我的素材', sub: '素材管理', icon: Layers, color: '#64748b' },
  { key: 'template_edit', group: '剪辑', title: '模板剪辑', sub: '图片+配音一键成片', icon: Clapperboard, color: '#a855f7' },
]
const GROUPS = ['文案', 'AIGC', '数字人', '剪辑']

// ============ 状态 ============
const query = ref('')
const selected = ref({ key: 'home', title: '首页' } as any)
const mobileNavOpen = ref(false)
const subject = ref('')
const output = ref('')
const generating = ref(false)
// 额外字段（差异化表单）
const extra = ref<Record<string, string>>({})
// 方向模板 + 结果历史(最近3次) + 修改 + 配图
const direction = ref('')
const results = ref<{ text: string, img?: string }[]>([])
const activeResult = ref(0)
const reviseInput = ref('')
const revising = ref(false)
const imgUrl = ref('')
// 素材
const materials = ref<any[]>([])
// 历史记录弹窗
const historyOpen = ref(false)
const historyDetail = ref('')
const selectedModel = ref('')
const models = ref<any[]>([])
const videoModels = ref<any[]>([])
const drawModels = ref<any[]>([])
const mediaModels = ref<any[]>([])
const featureConfigs = ref<Record<string, any>>({})
const userPermissions = ref<Set<string>>(new Set())
const balance = ref<number|null>(null)
const userName = ref(localStorage.getItem('ll_user_name') || '')
const userToken = ref(localStorage.getItem('ll_user_token') || '')
const loginOpen = ref(false); const loginMode = ref<'login'|'register'>('login')
const authUsername = ref(''); const authPassword = ref(''); const authEmail = ref(''); const authLoading = ref(false)
const emailCode = ref(''); const codeSending = ref(false); const codeCountdown = ref(0); let codeTimer: any = null
let sessionTimer: ReturnType<typeof setTimeout> | null = null
let sessionExpired = false

// 对话
const chatMessages = ref<{role:string, content:string}[]>([])
const chatInput = ref('')
const chatting = ref(false)

// 绘画
const drawPrompt = ref('')
const drawSize = ref('1024x1024')
const drawModel = ref('')
const drawUrl = ref('')
const drawUsedModel = ref('')
const drawPreviewOpen = ref(false)
type DrawResult = { url: string; prompt: string; model: string; createdAt: string }
const drawHistory = ref<DrawResult[]>([])
const productResults = ref<DrawResult[]>([])
const drawMode = ref<'text'|'product'>('text')
const productImageUrl = ref('')
const productImageUrls = ref<string[]>([])
const productName = ref(''); const productSellingPoints = ref(''); const productAudience = ref(''); const productScene = ref('日常使用场景'); const productStyle = ref('实拍干净'); const productComposition = ref('沿用主图'); const productCamera = ref('正面'); const productLighting = ref('柔光顺光'); const productBackground = ref('干净背景'); const productCopy = ref('不显示'); const productCount = ref(4)
const productUploading = ref(false)
type ProductTemplate = { id: string; name: string; type: string; category: string; ratio: string; tone: string; accent: string; prompt: string; style: string; scene: string }
const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { id:'clean', name:'白底商品居中', type:'日常主图', category:'全部', ratio:'1:1', tone:'#f8fafc', accent:'#b8c7dc', style:'实拍干净', scene:'纯白摄影棚', prompt:'纯白干净背景，商品居中占画面约70%，自然接触阴影，边缘清晰，电商平台标准主图，不添加文字和无关道具' },
  { id:'sale', name:'爆款促销留白', type:'活动主图', category:'全部', ratio:'1:1', tone:'#fff1e8', accent:'#ff5a36', style:'极简现代', scene:'促销陈列台', prompt:'高转化促销视觉，商品位于右侧，左侧保留完整卖点和价格文案区域，橙红色几何展台，画面热烈但整洁，不生成乱码文字' },
  { id:'lifestyle', name:'家居生活场景', type:'日常主图', category:'家居百货', ratio:'3:4', tone:'#eef5ed', accent:'#6d8f6a', style:'暖光生活', scene:'自然居家场景', prompt:'真实居家使用场景，保留商品外观和材质，环境简洁有生活气息，自然窗光，浅景深，高级生活方式摄影' },
  { id:'luxury', name:'黑金礼盒质感', type:'活动主图', category:'珠宝首饰', ratio:'1:1', tone:'#20242b', accent:'#d8b56a', style:'高级黑', scene:'黑色摄影棚', prompt:'深色高级摄影棚，黑金配色，商品置于哑光展台，轮廓光突出材质和边缘，奢华克制，无多余道具' },
  { id:'nature', name:'清新自然成分', type:'日常主图', category:'食品', ratio:'2:3', tone:'#edf8e8', accent:'#65a85c', style:'实拍干净', scene:'自然植物场景', prompt:'明亮清新的自然背景，少量绿叶和原料作为陪衬，商品主体清晰，阳光斑驳，健康天然视觉，保持画面干净' },
  { id:'beauty', name:'美妆柔光水台', type:'日常主图', category:'美容美妆', ratio:'3:4', tone:'#fff0f5', accent:'#e98bad', style:'极简现代', scene:'柔粉水面展台', prompt:'柔粉色水面和半透明亚克力展台，柔和漫射光，细腻反射，高端美妆广告摄影，商品居中，背景简洁' },
  { id:'tech', name:'数码科技蓝光', type:'日常主图', category:'数码家电', ratio:'1:1', tone:'#e8f2ff', accent:'#3678ef', style:'极简现代', scene:'科技摄影棚', prompt:'蓝白科技感摄影棚，简洁悬浮展台，冷色轮廓光和细微光带，突出产品结构和功能，画面锐利现代' },
  { id:'food', name:'食品暖调餐桌', type:'外卖平台主图', category:'食品', ratio:'3:4', tone:'#fff0dc', accent:'#c86a2d', style:'暖光生活', scene:'温暖餐桌', prompt:'温暖自然的餐桌场景，食欲感暖光，真实食材作为少量陪衬，主体包装和产品清晰，商业食品摄影' },
  { id:'fashion', name:'服饰轻奢陈列', type:'日常主图', category:'服饰箱包', ratio:'3:4', tone:'#f3efff', accent:'#8b6ec7', style:'极简现代', scene:'轻奢服饰展台', prompt:'轻奢服饰陈列，柔和中性色背景，商品完整展示，材质纹理清楚，杂志级电商摄影，构图高级克制' },
  { id:'fresh', name:'生鲜冰感主图', type:'活动主图', category:'生鲜', ratio:'1:1', tone:'#e9f8ff', accent:'#35a9d6', style:'实拍干净', scene:'清凉冰台', prompt:'清凉冰感背景，水珠和碎冰少量点缀，商品鲜活清晰，高亮通透，适合生鲜促销，主体突出' },
  { id:'baby', name:'母婴柔和彩云', type:'日常主图', category:'母婴亲子', ratio:'1:1', tone:'#fff5dc', accent:'#efb85d', style:'暖光生活', scene:'柔和儿童房', prompt:'温柔明亮的母婴视觉，奶油色和浅蓝色，圆润安全感构图，柔光，无尖锐复杂道具，商品居中' },
  { id:'global', name:'跨境极简英文版', type:'跨境电商主图', category:'跨境出口', ratio:'1:1', tone:'#eef2f7', accent:'#273b5a', style:'实拍干净', scene:'国际电商摄影棚', prompt:'国际电商极简风，商品清晰居中，留出英文卖点排版空间，蓝灰中性色，干净专业，不生成乱码文字' },
  { id:'global-feature', name:'跨境功能卖点图', type:'跨境电商主图', category:'跨境出口', ratio:'3:4', tone:'#eef6ff', accent:'#2563eb', style:'极简现代', scene:'海外电商功能展示', prompt:'海外电商功能卖点主图，商品完整清晰，周围留出三处英文功能标注空间，蓝白科技配色，构图专业可信，不生成任何文字或乱码' },
  { id:'badge-new', name:'新品上市角标', type:'主图图标', category:'全部', ratio:'1:1', tone:'#fff4ef', accent:'#f0523c', style:'极简现代', scene:'新品角标陈列', prompt:'标准电商白底商品主图，右上角预留醒目的新品角标区域，商品主体占画面约70%，橙红点缀，画面清楚整洁，不生成文字' },
  { id:'badge-quality', name:'品质认证角标', type:'主图图标', category:'全部', ratio:'1:1', tone:'#f3f7ff', accent:'#3158e8', style:'实拍干净', scene:'品质认证展示', prompt:'高品质电商主图，商品居中，左下角预留品质认证图标区域，蓝白配色，细节锐利，可信专业，不生成文字或徽标' },
  { id:'takeaway-drink', name:'饮品清凉爆款', type:'外卖平台主图', category:'休闲饮品', ratio:'3:4', tone:'#eafcff', accent:'#19a7b8', style:'实拍干净', scene:'清凉饮品桌面', prompt:'外卖平台饮品主图，杯装饮品清晰居中，冰块和水珠少量点缀，明亮清爽，高食欲感，留出促销信息区域，不生成文字' },
  { id:'takeaway-meal', name:'热卖套餐俯拍', type:'外卖平台主图', category:'食品', ratio:'1:1', tone:'#fff3e8', accent:'#e56b2f', style:'暖光生活', scene:'餐品俯拍桌面', prompt:'外卖平台餐品套餐主图，俯拍构图，餐品摆放丰富整齐，暖色食欲光线，主体清晰，适合缩略图浏览，不生成文字' }
]
const productTemplateOpen = ref(false)
const productTemplateType = ref('商品主图')
const productTemplateCategory = ref('全部')
const productTemplateRatio = ref('全部')
const selectedProductTemplateId = ref('clean')
const selectedProductTemplate = computed(() => PRODUCT_TEMPLATES.find(x => x.id === selectedProductTemplateId.value) || PRODUCT_TEMPLATES[0])
const filteredProductTemplates = computed(() => PRODUCT_TEMPLATES.filter(x =>
  (['商品主图','全部模板'].includes(productTemplateType.value) || x.type === productTemplateType.value) &&
  (productTemplateCategory.value === '全部' || x.category === productTemplateCategory.value) &&
  (productTemplateRatio.value === '全部' || x.ratio === productTemplateRatio.value)
))
const drawRevisePrompt = ref('')
const revisingDraw = ref(false)
const drawing = ref(false)

// 配音
const ttsText = ref('')
const ttsVoice = ref('zh-CN-XiaoxiaoNeural')
const ttsUrl = ref('')
const ttsGenerating = ref(false)
// 模板剪辑
const composeText = ref('')
const composeVoice = ref('zh-CN-XiaoxiaoNeural')
const composeImgs = ref<string[]>([])
const composeUrl = ref('')
const composing = ref(false)
const TTS_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女·甜美）' },
  { id: 'zh-CN-XiaoyiNeural', name: '晓伊（女·温柔）' },
  { id: 'zh-CN-YunxiNeural', name: '云希（男·阳光）' },
  { id: 'zh-CN-YunjianNeural', name: '云健（男·浑厚）' },
  { id: 'zh-CN-YunyangNeural', name: '云扬（男·新闻）' },
  { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北（东北女声）' },
  { id: 'zh-CN-shaanxi-XiaoniNeural', name: '晓妮（陕西女声）' },
]

// 视频
const videoPrompt = ref('')
const videoModel = ref('')
const videoImageUrl = ref('')
const videoImageUrl2 = ref('')
const videoUrl = ref('')
const videoGenerating = ref(false)
function openVideoPicker(id: string) { (document.getElementById(id) as HTMLInputElement | null)?.click() }
async function uploadVideoImage(ev: any, target: 1 | 2 = 1) {
  const file = ev.target.files && ev.target.files[0]; if (!file) return
  if (!userToken.value) { openLogin(); return }
  if (file.size > 20 * 1024 * 1024) { ElMessage.warning('文件不能超过 20MB'); return }
  const fd = new FormData(); fd.append('file', file)
  try { const r = await apiFetch('/resource/oss/upload', { method:'POST', body:fd }); const d = await r.json(); if (d.code !== 200) throw new Error(d.msg || '上传失败'); if (target === 1) videoImageUrl.value = d.data.url; else videoImageUrl2.value = d.data.url; ElMessage.success('图片上传成功') }
  catch (e: any) { ElMessage.error(e.message || '图片上传失败') } finally { ev.target.value = '' }
}

// 音乐与数字人媒体任务
const mediaPrompt = ref('')
const mediaModel = ref('')
const mediaInputUrl = ref('')
const mediaInputUrl2 = ref('')
const mediaResultUrl = ref('')
const mediaGenerating = ref(false)
const currentMediaModels = computed(() => mediaModels.value.filter((m: any) => m.capability === selected.value.needCap))
function openMediaPicker(id: string) { (document.getElementById(id) as HTMLInputElement | null)?.click() }

async function uploadMediaFile(ev: any, target: 1 | 2 = 1) {
  const file = ev.target.files && ev.target.files[0]
  if (!file) return
  if (!userToken.value) { openLogin(); return }
  if (file.size > 20 * 1024 * 1024) { ElMessage.warning('文件不能超过 20MB'); return }
  const fd = new FormData(); fd.append('file', file)
  try {
    const r = await apiFetch('/resource/oss/upload', { method: 'POST', body: fd })
    const d = await r.json(); if (d.code !== 200) throw new Error(d.msg || '上传失败')
    if (target === 1) mediaInputUrl.value = d.data.url; else mediaInputUrl2.value = d.data.url
    ElMessage.success('素材上传成功')
  } catch (e: any) { ElMessage.error(e.message || '素材上传失败') } finally { ev.target.value = '' }
}

async function doMedia() {
  if (mediaGenerating.value) return
  if (!userToken.value) { openLogin(); return }
  if (!mediaPrompt.value.trim()) { ElMessage.warning('请输入生成描述或台词'); return }
  if (selected.value.key !== 'music' && !mediaInputUrl.value) { ElMessage.warning('请先上传参考素材'); return }
  if (selected.value.key === 'face_merge' && !mediaInputUrl2.value) { ElMessage.warning('请上传第二张人脸照片'); return }
  if (!currentMediaModels.value.length) { ElMessage.warning('后台尚未配置该功能的可用模型'); return }
  mediaGenerating.value = true; mediaResultUrl.value = ''
  try {
    const r = await apiFetch('/aigc/media/generate', { method: 'POST', body: JSON.stringify({ featureCode: selected.value.key, prompt: mediaPrompt.value, inputUrl: mediaInputUrl.value || undefined, inputUrl2: mediaInputUrl2.value || undefined }) })
    const d = await r.json(); if (d.code !== 200) throw new Error(d.msg || '任务提交失败')
    balance.value = Number(d.data.balance)
    if (d.data.status === 'SUCCESS') { mediaResultUrl.value = d.data.url; mediaGenerating.value = false; loadWorks(); ElMessage.success(`生成完成，扣费 ${d.data.creditsCost}`); return }
    ElMessage.success(`任务已提交，扣费 ${d.data.creditsCost}`); pollMedia(d.data.taskNo)
  } catch (e: any) { mediaGenerating.value = false; ElMessage.error(e.message || '媒体生成失败') }
}

async function pollMedia(taskNo: string) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const r = await apiFetch(`/aigc/media/tasks/${taskNo}`); const d = await r.json()
      if (d.code !== 200) continue
      if (d.data.status === 'SUCCESS') { mediaResultUrl.value = d.data.url; balance.value = Number(d.data.balance); mediaGenerating.value = false; loadWorks(); ElMessage.success('媒体生成完成'); return }
      if (d.data.status === 'FAILED') { balance.value = Number(d.data.balance); mediaGenerating.value = false; ElMessage.error(d.data.error || '生成失败，扣费已退回'); return }
    } catch {}
  }
  mediaGenerating.value = false; ElMessage.warning('任务仍在处理中，可稍后到我的作品查看')
}

// 账户
const accountOpen = ref(false); const accountTab = ref('recharge')
const paymentType = ref<'alipay'|'wxpay'>('alipay'); const rechargeLoading = ref<number|null>(null)
const customAmount = ref(50); const customRechargeLoading = ref(false); const customRate = ref(10)
const packages = ref<any[]>([]); const orders = ref<any[]>([]); const creditFlows = ref<any[]>([])
const works = ref<any[]>([])

function clearSession(showLogin = true) {
  if (sessionTimer) { clearTimeout(sessionTimer); sessionTimer = null }
  userToken.value = ''; userName.value = ''; balance.value = null; userPermissions.value = new Set()
  localStorage.removeItem('ll_user_token'); localStorage.removeItem('ll_user_name'); localStorage.removeItem('ll_user_expires_at')
  accountOpen.value = false; historyOpen.value = false
  if (showLogin) { loginMode.value = 'login'; loginOpen.value = true }
}

function expireSession() {
  if (sessionExpired || !userToken.value) return
  sessionExpired = true
  clearSession(true)
  ElMessage.closeAll()
  ElMessage.error('登录已过期，请重新登录')
}

function scheduleSessionExpiry(expiresAt: number) {
  if (sessionTimer) clearTimeout(sessionTimer)
  localStorage.setItem('ll_user_expires_at', String(expiresAt))
  const remaining = expiresAt - Date.now()
  if (remaining <= 0) { expireSession(); return }
  sessionTimer = setTimeout(expireSession, Math.min(remaining, 2_147_000_000))
}

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const isFormData = init.body instanceof FormData
  const response = await secureFetch(input, {
    ...init,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      clientid: 'aigc-web',
      ...(userToken.value ? { Authorization: `Bearer ${userToken.value}` } : {}),
      ...(init.headers || {})
    }
  })
  if (userToken.value) {
    let payload: any = null
    try { payload = await response.clone().json() } catch {}
    const message = String(payload?.msg || payload?.message || '')
    const unauthorized = response.status === 401 || payload?.code === 401
    const expiredMessage = /(?:登录|认证|token).*(?:过期|失效)|(?:过期|失效).*(?:登录|认证|token)/i.test(message)
    if (unauthorized || expiredMessage) expireSession()
  }
  return response
}

function toolPermission(tool: any) {
  const fixed: Record<string, string> = {
    chat: 'aigc:copywriting:run',
    tts: 'aigc:tts:run',
    works: 'aigc:works:view',
    materials: 'aigc:materials:view',
    template_edit: 'aigc:templateEdit:run'
  }
  if (fixed[tool.key]) return fixed[tool.key]
  const code = tool.featureCode || tool.key
  return String(featureConfigs.value[code]?.menu_permission || '')
}

const availableTools = computed(() => TOOLS.filter((tool: any) => {
  if (userToken.value) {
    const permission = toolPermission(tool)
    return !permission || userPermissions.value.has(permission)
  }
  if (tool.key === 'product_main') return true
  if (['works', 'materials', 'template_edit'].includes(tool.key) || tool.key === 'tts') return true
  const code = tool.featureCode || (tool.key === 'chat' ? 'copywriting' : tool.key)
  const config = featureConfigs.value[code]
  if (!config || String(config.enabled) !== '1') return false
  if (tool.needCap === 'draw') return drawModels.value.length > 0
  if (tool.needCap === 'video') return videoModels.value.length > 0
  if (tool.needCap) return mediaModels.value.some((model: any) => model.capability === tool.needCap)
  return models.value.length > 0
}))
const filteredTools = computed(() => availableTools.value.filter((t: any) => !query.value || `${t.title}${t.sub}`.includes(query.value)))
function onGlow(e: MouseEvent) {
  const el = document.querySelector('.app') as HTMLElement
  if (el) { el.style.setProperty('--x', e.clientX + 'px'); el.style.setProperty('--y', e.clientY + 'px') }
}
function goHome() { selected.value = { key: 'home', title: '首页' } as any }
function toolFor(key: string) {
  return availableTools.value.find((tool: any) => tool.key === key) || availableTools.value.find((tool: any) => tool.group === '文案') || TOOLS[0]
}
function copyOutput() {
  if (!output.value) { ElMessage.info('暂无内容可复制'); return }
  navigator.clipboard.writeText(output.value).then(() => ElMessage.success('已复制到剪贴板')).catch(() => ElMessage.info('复制失败，请手动选择复制'))
}
function skillCode(tool = selected.value) { return tool.featureCode || (tool.key === 'image' ? 'image' : tool.key === 'video' ? 'video' : tool.key === 'extract' ? 'extract' : tool.key === 'chat' ? 'copywriting' : tool.key) }
const selectedCost = computed(() => Number(featureConfigs.value[skillCode()]?.credits_per_call || 1))
const selModelList = computed(() => {
  const cap = selected.value.needCap
  let list = cap === 'draw' ? drawModels.value : cap === 'video' ? videoModels.value : models.value
  const bind = selected.value.model
  if (bind && String(bind).startsWith('deepseek')) list = list.filter((x: any) => String(x.model_code).startsWith('deepseek-'))
  if (cap !== 'draw' && cap !== 'video') list = list.filter((x: any) => !String(x.model_code).toLowerCase().includes('vl'))
  return list.length ? list : models.value
})

// ============ 加载 ============
async function loadAccount() {
  if (!userToken.value) return
  try { const r = await apiFetch('/aigc/account'); const d = await r.json(); if (d.code === 200) balance.value = Number(d.data?.balance || 0) } catch {}
}
async function loadPermissions() {
  if (!userToken.value) { userPermissions.value = new Set(); return }
  try {
    const r = await apiFetch('/aigc/permissions')
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '权限读取失败')
    userPermissions.value = new Set((d.data || []).map((item: any) => String(item)))
    if (selected.value.key !== 'home' && !availableTools.value.some((tool: any) => tool.key === selected.value.key)) goHome()
  } catch (e: any) {
    userPermissions.value = new Set()
    ElMessage.error(e.message || '用户端权限读取失败')
  }
}
async function loadMeta() {
  try {
    const [chatR, drawR, videoR, mediaR, featR, packR] = await Promise.all([
      apiFetch('/aigc/models?capability=chat'), apiFetch('/aigc/models?capability=draw'),
      apiFetch('/aigc/models?capability=video'), apiFetch('/aigc/models'), apiFetch('/aigc/features'), apiFetch('/aigc/packages')])
    const chat = await chatR.json(), draw = await drawR.json(), video = await videoR.json()
    const media = await mediaR.json(), feat = await featR.json(), pack = await packR.json()
    if (chat.code === 200) models.value = chat.data || []
    if (draw.code === 200) drawModels.value = draw.data || []
    if (video.code === 200) videoModels.value = video.data || []
    if (media.code === 200) mediaModels.value = media.data || []
    if (pack.code === 200) packages.value = pack.data || []
    if (feat.code === 200) featureConfigs.value = Object.fromEntries((feat.data || []).map((x: any) => [x.feature_code, x]))
    selectedModel.value = models.value[0]?.model_code || ''
  } catch {}
}
async function loadWorks() {
  if (!userToken.value) return
  try { const r = await apiFetch('/aigc/tasks'); const d = await r.json(); if (d.code === 200) works.value = (d.data || []).slice(0, 50) } catch {}
}
async function loadMaterials() {
  if (!userToken.value) return
  try { const r = await apiFetch('/aigc/materials'); const d = await r.json(); if (d.code === 200) materials.value = d.data || [] } catch {}
}
async function saveMaterial(url: string, name = '') {
  try { await apiFetch('/aigc/material', { method: 'POST', body: JSON.stringify({ url, name }) }) } catch {}
}
async function delMaterial(id: any) {
  try {
    const r = await apiFetch(`/aigc/material/${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '删除失败')
    materials.value = materials.value.filter((m: any) => m.id !== id)
    ElMessage.success('已删除')
  } catch (e: any) { ElMessage.error(e.message || '删除失败') }
}
function useMaterial(url: string) { imgUrl.value = url; ElMessage.success('已设为当前配图') }
function featureLabel(code: string) { return ({ video:'视频', image:'绘图', tts:'配音', template_edit:'模板成片', music:'音乐', voice_clone:'声音克隆', avatar_clone:'形象克隆', face_merge:'人脸融合', photo_dh:'照片数字人' } as Record<string,string>)[code] || '文案' }
async function openHistory() {
  if (!userToken.value) { openLogin(); return }
  await loadWorks()
  historyDetail.value = ''
  historyOpen.value = true
}
function viewHistory(w: any) { historyDetail.value = w.result_body || w.error_message || '(无内容)' }
function copyHistory() {
  if (!historyDetail.value) return
  navigator.clipboard.writeText(historyDetail.value).then(() => ElMessage.success('已复制')).catch(() => ElMessage.info('复制失败，请手动选择复制'))
}
function continueFromHistory() {
  const w = works.value.find((x: any) => (x.result_body || '') === historyDetail.value)
  if (!w) { ElMessage.warning('找不到对应记录'); return }
  results.value.unshift({ text: w.result_body })
  results.value = results.value.slice(0, 3)
  activeResult.value = 0
  output.value = w.result_body
  historyOpen.value = false
  ElMessage.success('已载入，可直接输入修改要求继续优化')
}

onMounted(async () => {
  const expiresAt = Number(localStorage.getItem('ll_user_expires_at') || 0)
  if (userToken.value && expiresAt) scheduleSessionExpiry(expiresAt)
  await loadMeta(); await loadPermissions(); await loadAccount(); await loadWorks()
})
onUnmounted(() => {
  if (sessionTimer) clearTimeout(sessionTimer)
  if (codeTimer) clearInterval(codeTimer)
})

// ============ 登录/注册（邮箱验证码仅注册用） ============
async function sendEmailCode() {
  const email = authEmail.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ElMessage.warning('请输入有效邮箱'); return }
  if (codeSending.value || codeCountdown.value > 0) return
  codeSending.value = true
  try {
    const r = await secureFetch(`/resource/email/code?email=${encodeURIComponent(email)}`, { headers: { clientid: 'aigc-web' } })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '发送失败')
    ElMessage.success('验证码已发送，请查收邮箱')
    codeCountdown.value = 60
    clearInterval(codeTimer)
    codeTimer = setInterval(() => { codeCountdown.value--; if (codeCountdown.value <= 0) clearInterval(codeTimer) }, 1000)
  } catch (e: any) { ElMessage.error(e.message || '验证码发送失败') } finally { codeSending.value = false }
}
async function doAuth() {
  if (loginMode.value === 'register' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.value)) { ElMessage.warning('请输入有效邮箱'); return }
  if (loginMode.value === 'login' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authUsername.value)) { ElMessage.warning('用户端仅支持邮箱登录'); return }
  if (!authPassword.value) { ElMessage.warning('请输入密码'); return }
  if (loginMode.value === 'register' && !emailCode.value.trim()) { ElMessage.warning('请输入邮箱验证码'); return }
  authLoading.value = true
  try {
    const url = loginMode.value === 'login' ? '/auth/login' : '/auth/register'
    const body: any = { username: loginMode.value === 'register' ? authEmail.value : authUsername.value, password: authPassword.value, clientId: 'aigc-web', grantType: 'password', userType: 'app_user', ...(loginMode.value === 'register' ? { email: authEmail.value, code: emailCode.value.trim() } : {}) }
    const r = await secureFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', clientid: 'aigc-web' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '操作失败')
    if (loginMode.value === 'register') { ElMessage.success('注册成功，请登录'); loginMode.value = 'login'; return }
    sessionExpired = false
    userToken.value = d.data.access_token; userName.value = body.username
    localStorage.setItem('ll_user_token', d.data.access_token); localStorage.setItem('ll_user_name', body.username)
    if (Number(d.data.expire_in) > 0) scheduleSessionExpiry(Date.now() + Number(d.data.expire_in) * 1000)
    loginOpen.value = false; ElMessage.success('登录成功')
    await loadPermissions(); await loadAccount(); await loadWorks()
  } catch (e: any) { ElMessage.error(e.message || '操作失败') } finally { authLoading.value = false }
}
function openLogin() { loginOpen.value = true; emailCode.value = '' }
function logout() { sessionExpired = false; clearSession(false); loginOpen.value = false; ElMessage.success('已退出登录') }

// ============ 文案生成 ============
function pickTool(t: any) {
  selected.value = t; mobileNavOpen.value = false; subject.value = ''; output.value = ''; direction.value = ''; results.value = []; activeResult.value = 0; reviseInput.value = ''; imgUrl.value = ''; extra.value = {}
  if (t.key === 'product_main') drawMode.value = 'product'
  mediaPrompt.value = ''; mediaInputUrl.value = ''; mediaInputUrl2.value = ''; mediaResultUrl.value = ''
  if (t.key === 'chat') chatMessages.value = []
  if (t.key === 'materials' || t.key === 'template_edit') loadMaterials()
  const featureCode = t.featureCode || (t.key === 'image' ? 'image' : t.key === 'video' ? 'video' : t.key === 'extract' ? 'extract' : 'copywriting')
  const configured = featureConfigs.value[featureCode]?.gateway_model_id
  const pool = t.needCap === 'draw' ? drawModels.value : t.needCap === 'video' ? videoModels.value : ['music','audio','digital_human','face_merge'].includes(t.needCap) ? mediaModels.value.filter((x: any) => x.capability === t.needCap) : models.value
  const bound = configured ? pool.find((x: any) => String(x.id) === String(configured)) : null
  if (t.needCap === 'draw' && bound) drawModel.value = bound.model_code
  else if (t.needCap === 'video' && bound) videoModel.value = bound.model_code
  else if (['music','audio','digital_human','face_merge'].includes(t.needCap)) mediaModel.value = (bound || pool[0])?.model_code || ''
  else if (t.model && models.value.length) {
    const mm = models.value.find((x: any) => x.model_code === t.model)
    if (mm) selectedModel.value = t.model
  } else {
    const first = selModelList.value.find((x: any) => configured && String(x.id) === String(configured)) || selModelList.value[0]
    if (first && !t.needCap) selectedModel.value = first.model_code
  }
}
async function generate() {
  if (generating.value) return
  if (!userToken.value) { openLogin(); ElMessage.info('请先登录'); return }
  if (!subject.value.trim()) { ElMessage.warning('请输入创作主题'); return }
  const tool: any = selected.value
  let prompt = tool.prompt ? tool.prompt(subject.value.trim(), extra.value) : subject.value.trim()
  if (direction.value) prompt += `\n\n[写作方向要求：${direction.value}]`
  if (imgUrl.value) {
    try {
      const vr = await apiFetch('/aigc/vision/describe', { method: 'POST', body: JSON.stringify({ imageUrl: imgUrl.value }) })
      const vd = await vr.json()
      if (vd.code === 200) prompt += `\n\n【配图内容】${vd.data.description}\n请结合这张配图的内容撰写文案，让文案与图片匹配（图片会作为配图发布）。`
      else prompt += `\n\n（本作品配图：${imgUrl.value}）`
    } catch { prompt += `\n\n（本作品配图：${imgUrl.value}）` }
  }
  if (balance.value !== null && balance.value < selectedCost.value) { ElMessage.warning(`余额不足，本次需扣费 ${selectedCost.value}`); return }
  generating.value = true; output.value = ''
  try {
    const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt, subject: subject.value.trim(), featureCode: tool.featureCode || tool.key || 'copywriting' }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '生成失败')
    results.value.unshift({ text: d.data.content, img: imgUrl.value || undefined })
    results.value = results.value.slice(0, 3)
    activeResult.value = 0
    output.value = results.value[0].text
    balance.value = Number(d.data.balance)
    ElMessage.success(`生成完成，扣费 ${d.data.creditsCost}`)
    loadWorks()
  } catch (e: any) { output.value = ''; ElMessage.error(e.message || '后端服务连接失败') } finally { generating.value = false }
}
function selectResult(i: number) { activeResult.value = i; output.value = results.value[i].text; reviseInput.value = '' }
async function revise() {
  if (revising.value) return
  if (!userToken.value) { openLogin(); return }
  const base = output.value
  if (!base) { ElMessage.warning('请先生成一次文案'); return }
  if (!reviseInput.value.trim()) { ElMessage.warning('请输入修改要求'); return }
  const tool: any = selected.value
  revising.value = true; output.value = ''
  try {
    const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt: `以下是之前生成的一篇文案：\n${base}\n\n用户要求按下面要求修改：${reviseInput.value.trim()}\n请直接输出修改后的完整文案，不要解释。`, subject: subject.value.trim(), featureCode: tool.featureCode || tool.key || 'copywriting' }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '修改失败')
    results.value.unshift({ text: d.data.content, img: imgUrl.value || undefined })
    results.value = results.value.slice(0, 3)
    activeResult.value = 0
    output.value = results.value[0].text
    balance.value = Number(d.data.balance)
    ElMessage.success(`修改完成，扣费 ${d.data.creditsCost}`)
  } catch (e: any) { output.value = base; ElMessage.error(e.message || '修改失败') } finally { revising.value = false }
}
function openImgPicker() { (document.getElementById('img-input') as HTMLInputElement | null)?.click() }
async function onUploadImg(ev: any) {
  const file = ev.target.files && ev.target.files[0]
  if (!file) return
  if (!userToken.value) { openLogin(); return }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片不能超过 5MB'); return }
  const fd = new FormData()
  fd.append('file', file)
  try {
    const r = await secureFetch('/resource/oss/upload', { method: 'POST', headers: { clientid: 'aigc-web', Authorization: 'Bearer ' + userToken.value }, body: fd })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '上传失败')
    imgUrl.value = d.data.url
    ElMessage.success('图片已上传，将随文案展示')
    saveMaterial(d.data.url)
  } catch (e: any) { ElMessage.error(e.message || '图片上传失败') } finally { ev.target.value = '' }
}

// ============ AI 对话 ============
async function sendChat() {
  if (chatting.value) return
  if (!userToken.value) { openLogin(); return }
  const text = chatInput.value.trim()
  if (!text) return
  chatMessages.value.push({ role: 'user', content: text })
  chatInput.value = ''
  chatting.value = true
  try {
    const history = chatMessages.value.slice(-10).map((m: any) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n')
    const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt: `以下是一段多轮对话，请以 AI 助手的身份自然回复最后一条用户消息：\n${history}\nAI：`, featureCode: 'copywriting' }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '对话失败')
    chatMessages.value.push({ role: 'ai', content: d.data.content })
    balance.value = Number(d.data.balance)
  } catch (e: any) { chatMessages.value.push({ role: 'ai', content: '⚠️ ' + (e.message || '对话失败') }) } finally { chatting.value = false }
}

// ============ AI 绘画 ============
async function doDraw() {
  if (drawing.value) return
  if (!userToken.value) { openLogin(); return }
  if (!drawPrompt.value.trim()) { ElMessage.warning('请输入绘画描述'); return }
  if (drawMode.value === 'product' && !productImageUrls.value.length && !productImageUrl.value) { ElMessage.warning('请先上传产品图片'); return }
  drawing.value = true; drawUrl.value = ''; drawUsedModel.value = ''
  if (drawMode.value === 'product') productResults.value = []
  try {
    const productPrompt = drawMode.value === 'product' ? `电商商品主图/商品套图。商品名称：${productName.value || '未命名商品'}。核心卖点：${productSellingPoints.value || '突出商品材质、细节和使用价值'}。目标人群：${productAudience.value || '电商消费者'}。使用场景：${productScene.value}。视觉风格：${productStyle.value}。构图：${productComposition.value}。视角：${productCamera.value}。光线：${productLighting.value}。背景：${productBackground.value}。文字要求：${productCopy.value}。${drawPrompt.value || '画面简洁、高级、突出商品主体，符合电商平台主图规范。'}` : drawPrompt.value
    const urls = drawMode.value === 'product' ? (productImageUrls.value.length ? productImageUrls.value : [productImageUrl.value]) : [undefined]
    for (let i = 0; i < (drawMode.value === 'product' ? productCount.value : 1); i++) {
      const r = await apiFetch('/aigc/image/generate', { method: 'POST', body: JSON.stringify({ prompt: productPrompt, size: drawSize.value, imageUrl: urls[i % urls.length] }) })
      const d = await r.json(); if (d.code !== 200) throw new Error(d.msg || '绘画失败')
      const item: DrawResult = { url: d.data.url, prompt: productPrompt, model: d.data.model || drawModel.value || '后台智能路由', createdAt: new Date().toLocaleString() }
      if (drawMode.value === 'product') productResults.value.push(item)
      drawHistory.value.unshift(item)
      if (i === 0) selectDrawResult(item)
    }
    ElMessage.success(`生成完成，共 ${drawMode.value === 'product' ? productCount.value : 1} 张`)
    loadWorks()
  } catch (e: any) { ElMessage.error(e.message || '绘画失败') } finally { drawing.value = false }
}

async function uploadProductImage(ev: any) {
  const file = ev?.target?.files?.[0]
  if (!file) return
  if (!userToken.value) { openLogin(); return }
  if (!file.type.startsWith('image/')) { ElMessage.warning('请上传图片文件'); return }
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('产品图片不能超过 10MB'); return }
  productUploading.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const r = await secureFetch('/resource/oss/upload', { method: 'POST', headers: { clientid: 'aigc-web', Authorization: 'Bearer ' + userToken.value }, body: fd })
    const d = await r.json(); if (d.code !== 200) throw new Error(d.msg || '上传失败')
    productImageUrl.value = d.data.url; productImageUrls.value.push(d.data.url); ElMessage.success(`产品图片已上传（${productImageUrls.value.length}/10）`)
  } catch (e: any) { ElMessage.error(e.message || '产品图片上传失败') } finally { productUploading.value = false }
}
function openProductPicker() { document.getElementById('product-image-file')?.click() }

function chooseProductTemplate(template: ProductTemplate) {
  selectedProductTemplateId.value = template.id
  productStyle.value = template.style
  productScene.value = template.scene
  productComposition.value = template.prompt
  if (template.ratio === '3:4') drawSize.value = '768x1024'
  else if (template.ratio === '4:3') drawSize.value = '1024x768'
  else drawSize.value = '1024x1024'
  productTemplateOpen.value = false
  ElMessage.success(`已选择模板：${template.name}`)
}

function selectDrawResult(item: DrawResult) {
  drawUrl.value = item.url
  drawUsedModel.value = item.model
  drawPrompt.value = item.prompt
}

async function reviseDraw() {
  if (!drawUrl.value || revisingDraw.value) return
  if (!drawRevisePrompt.value.trim()) { ElMessage.warning('请输入修改要求'); return }
  revisingDraw.value = true
  try {
    const r = await apiFetch('/aigc/image/generate', { method: 'POST', body: JSON.stringify({ prompt: `${drawPrompt.value}\n\n请基于当前生成图片进行局部修改，只修改以下要求，保持商品主体、比例和其他未指定内容不变：${drawRevisePrompt.value}`, size: drawSize.value, imageUrl: drawUrl.value }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '图片修改失败')
    const item: DrawResult = { url: d.data.url, prompt: `${drawPrompt.value}；修改：${drawRevisePrompt.value}`, model: d.data.model || drawModel.value || '后台智能路由', createdAt: new Date().toLocaleString() }
    drawHistory.value.unshift(item)
    if (drawMode.value === 'product') productResults.value.push(item)
    selectDrawResult(item)
    balance.value = Number(d.data.balance)
    drawRevisePrompt.value = ''
    ElMessage.success(`修改完成，扣费 ${d.data.creditsCost}`)
    loadWorks()
  } catch (e: any) { ElMessage.error(e.message || '图片修改失败') } finally { revisingDraw.value = false }
}

async function downloadDraw() {
  if (!drawUrl.value) return
  try {
    const response = await fetch(drawUrl.value)
    if (!response.ok) throw new Error('download failed')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `aigc-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    window.open(drawUrl.value, '_blank', 'noopener,noreferrer')
    ElMessage.info('图片已打开，请在图片上右键保存')
  }
}
function previewDraw() { if (drawUrl.value) drawPreviewOpen.value = true }

// ============ 模板剪辑 ============
function toggleComposeImg(url: string) {
  const i = composeImgs.value.indexOf(url)
  if (i >= 0) composeImgs.value.splice(i, 1)
  else if (composeImgs.value.length < 12) composeImgs.value.push(url)
  else ElMessage.warning('最多选 12 张')
}
async function doCompose() {
  if (composing.value) return
  if (!userToken.value) { openLogin(); return }
  if (composeImgs.value.length === 0) { ElMessage.warning('请至少选择一张素材图片'); return }
  if (!composeText.value.trim()) { ElMessage.warning('请输入配音文案'); return }
  composing.value = true; composeUrl.value = ''
  try {
    const r = await apiFetch('/aigc/video/compose', { method: 'POST', body: JSON.stringify({ images: composeImgs.value, text: composeText.value, voice: composeVoice.value }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '合成失败')
    composeUrl.value = d.data.url
    ElMessage.success('视频合成完成')
    loadWorks()
  } catch (e: any) { ElMessage.error(e.message || '合成失败') } finally { composing.value = false }
}

// ============ AI 配音 ============
async function doTts() {
  if (ttsGenerating.value) return
  if (!userToken.value) { openLogin(); return }
  if (!ttsText.value.trim()) { ElMessage.warning('请输入配音文本'); return }
  ttsGenerating.value = true; ttsUrl.value = ''
  try {
    const r = await apiFetch('/aigc/tts', { method: 'POST', body: JSON.stringify({ text: ttsText.value, voice: ttsVoice.value }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '配音生成失败')
    ttsUrl.value = d.data.url
    ElMessage.success('配音生成完成')
  } catch (e: any) { ElMessage.error(e.message || '配音服务连接失败') } finally { ttsGenerating.value = false }
}

// ============ AI 视频 ============
async function doVideo() {
  if (videoGenerating.value) return
  if (!userToken.value) { openLogin(); return }
  if (!videoPrompt.value.trim()) { ElMessage.warning('请输入视频描述或文案'); return }
  videoGenerating.value = true; videoUrl.value = ''
  try {
    const r = await apiFetch('/aigc/video/generate', { method: 'POST', body: JSON.stringify({ prompt: videoPrompt.value, duration: 5, imageUrl: videoImageUrl.value || undefined, imageUrl2: videoImageUrl2.value || undefined, model: 'vidu-video-q2-turbo' }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '视频任务提交失败')
    balance.value = Number(d.data.balance)
    ElMessage.success(`视频任务已提交，扣费 ${d.data.creditsCost}`)
    pollVideo(d.data.taskNo)
  } catch (e: any) { videoGenerating.value = false; ElMessage.error(e.message || '视频生成失败') }
}
async function pollVideo(taskNo: string) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const r = await apiFetch(`/aigc/video/tasks/${taskNo}`)
      const d = await r.json()
      if (d.code !== 200) continue
      if (d.data.status === 'SUCCESS') {
        videoUrl.value = d.data.url
        videoGenerating.value = false
        ElMessage.success('视频生成完成')
        loadWorks()
        return
      }
      if (d.data.status === 'FAILED') {
        videoGenerating.value = false
        ElMessage.error(d.data.error || '视频生成失败')
        return
      }
    } catch {}
  }
  videoGenerating.value = false
  ElMessage.warning('视频仍在生成，可在任务记录中查看')
}

// ============ 充值 ============
async function loadAccountCenter() {
  try {
    const [aR, oR, fR] = await Promise.all([apiFetch('/aigc/account'), apiFetch('/aigc/orders'), apiFetch('/aigc/credit-flows')])
    const a = await aR.json(), o = await oR.json(), f = await fR.json()
    if (a.code === 200) balance.value = Number(a.data?.balance || 0)
    if (o.code === 200) orders.value = o.data || []
    if (f.code === 200) creditFlows.value = f.data || []
  } catch { ElMessage.error('账户数据加载失败') }
}
async function startRecharge(pack: any) {
  if (rechargeLoading.value !== null) return
  const payWindow = window.open('about:blank', '_blank')
  if (!payWindow) { ElMessage.warning('浏览器阻止了支付窗口，请允许弹窗后重试'); return }
  rechargeLoading.value = pack.id
  try {
    const r = await apiFetch('/aigc/payment/epay/create', { method: 'POST', body: JSON.stringify({ packageId: pack.id, paymentType: paymentType.value }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '创建支付订单失败')
    if (d.data.mock) {
      payWindow.close()
      ElMessage.success('充值成功，余额已到账')
      loadAccountCenter()
      return
    }
    payWindow.location.href = d.data.paymentUrl
    ElMessage.success('支付订单已创建，请在新窗口完成支付')
    pollPayment(d.data.orderNo)
  } catch (e: any) { payWindow.close(); ElMessage.error(e.message || '创建支付订单失败') } finally { rechargeLoading.value = null }
}
async function startCustomRecharge() {
  if (customRechargeLoading.value) return
  const amt = Number(customAmount.value)
  if (!amt || amt <= 0) { ElMessage.warning('请输入有效充值金额'); return }
  const payWindow = window.open('about:blank', '_blank')
  if (!payWindow) { ElMessage.warning('浏览器阻止了支付窗口，请允许弹窗后重试'); return }
  customRechargeLoading.value = true
  try {
    const r = await apiFetch('/aigc/payment/epay/create', { method: 'POST', body: JSON.stringify({ amount: amt, paymentType: paymentType.value }) })
    const d = await r.json()
    if (d.code !== 200) throw new Error(d.msg || '创建支付订单失败')
    if (d.data.mock) {
      payWindow.close()
      ElMessage.success('充值成功，余额已到账')
      loadAccountCenter()
      return
    }
    payWindow.location.href = d.data.paymentUrl
    ElMessage.success('支付订单已创建，请在新窗口完成支付')
    pollPayment(d.data.orderNo)
  } catch (e: any) { payWindow.close(); ElMessage.error(e.message || '创建支付订单失败') } finally { customRechargeLoading.value = false }
}
async function pollPayment(orderNo: string) {
  for (let i = 0; i < 100; i++) {
    await new Promise(r => setTimeout(r, 3000))
    if (!userToken.value) return
    try {
      const r = await apiFetch(`/aigc/payment/epay/query/${orderNo}`)
      const d = await r.json()
      if (d.code === 200 && d.data.status === 'PAID') {
        await loadAccountCenter(); accountTab.value = 'orders'
        ElMessage.success('充值成功，余额已到账')
        return
      }
    } catch {}
  }
}
</script>

<template>
<div class="app" @mousemove="onGlow">
  <!-- 光晕 -->
  <div class="glow" :style="{ '--x': '50%', '--y': '0%' }"></div>

  <!-- 顶栏 -->
  <header class="topbar">
    <button class="mobile-menu" aria-label="打开导航" @click="mobileNavOpen = !mobileNavOpen"><span></span><span></span><span></span></button>
    <div class="brand" style="cursor:pointer" @click="goHome"><div class="brand-mark"><Zap :size="19"/></div><b>ll AI 创作平台</b></div>
    <div class="top-search"><Search :size="15"/><input v-model="query" placeholder="搜索工具…"/></div>
    <div class="top-right">
      <span v-if="userName" class="balance-pill"><Wallet :size="14"/> 余额 <b>{{ balance ?? '--' }}</b></span>
      <el-button v-if="userName" class="ghost-btn" @click="accountOpen = true; loadAccountCenter()">充值</el-button>
      <template v-else><el-button class="ghost-btn" @click="loginOpen = true">登录</el-button></template>
      <span v-if="userName" class="user-chip" @click="accountOpen = true; loadAccountCenter()">{{ userName }} <ChevronDown :size="13"/></span>
    </div>
  </header>

  <div class="layout">
    <!-- 侧边栏 -->
    <div v-if="mobileNavOpen" class="mobile-backdrop" @click="mobileNavOpen = false"></div>
    <aside class="sidebar" :class="{ 'is-open': mobileNavOpen }">
      <nav>
        <template v-for="g in GROUPS" :key="g">
          <div class="nav-group"><span>{{ g }}</span></div>
          <button v-for="t in availableTools.filter((x: any) => x.group === g)" :key="t.key"
            class="nav-item" :class="{ active: selected.key === t.key }" @click="pickTool(t)">
            <component :is="t.icon" :size="16" :style="{ color: t.color }"/>
            <span>{{ t.title }}</span>
            <em v-if="t.disabled" class="soon">即将开放</em>
          </button>
        </template>
      </nav>
    </aside>

    <!-- 主区 -->
    <main class="main">
      <!-- 首页：工作台入口 -->
      <div v-if="selected.key === 'home'" class="home">
        <section class="home-hero">
          <div class="hero-copy">
            <span class="eyebrow"><Sparkles :size="13"/> CREATIVE WORKSPACE</span>
            <h1 class="hero-title">把想法，变成<br/><em>可发布的作品</em></h1>
            <p class="hero-sub">从灵感、脚本到画面和声音，在一个轻量工作台里完成完整创作流程。</p>
            <div class="hero-actions"><button class="hero-primary" @click="pickTool(toolFor('koudabo'))"><Sparkles :size="16"/> 开始创作</button><button class="hero-secondary" @click="pickTool(toolFor('chat'))"><Bot :size="16"/> 和 AI 讨论</button></div>
          </div>
          <div class="hero-orbit" aria-hidden="true"><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-core"><Zap :size="30"/></div><span class="orbit-chip chip-one"><PenLine :size="13"/> 文案</span><span class="orbit-chip chip-two"><Palette :size="13"/> 视觉</span><span class="orbit-chip chip-three"><Video :size="13"/> 视频</span></div>
        </section>
        <section class="quick-start">
          <div class="section-label"><div><span class="eyebrow">QUICK START</span><h2>今天想做什么？</h2></div><span class="section-note">选择一个方向，马上进入专属工作区</span></div>
          <div class="quick-grid">
            <button class="quick-card quick-copy" @click="pickTool(toolFor('koudabo'))"><span class="quick-icon"><Mic2 :size="20"/></span><span><b>写一段爆款文案</b><small>口播、种草、营销与标题</small></span><ChevronDown :size="16" class="quick-arrow"/></button>
            <button class="quick-card quick-chat" @click="pickTool(toolFor('chat'))"><span class="quick-icon"><Bot :size="20"/></span><span><b>和 AI 一起想</b><small>头脑风暴、问答与方案梳理</small></span><ChevronDown :size="16" class="quick-arrow"/></button>
            <button class="quick-card quick-image" @click="pickTool(toolFor('image'))"><span class="quick-icon"><Palette :size="20"/></span><span><b>生成一张视觉图</b><small>海报、封面和社交媒体配图</small></span><ChevronDown :size="16" class="quick-arrow"/></button>
            <button class="quick-card quick-video" @click="pickTool(toolFor('video'))"><span class="quick-icon"><Video :size="20"/></span><span><b>制作一条视频</b><small>从文字或图片生成动态内容</small></span><ChevronDown :size="16" class="quick-arrow"/></button>
          </div>
        </section>
        <section class="tool-library">
          <div class="section-label"><div><span class="eyebrow">ALL TOOLS</span><h2>创作工具库</h2></div><span class="section-note">{{ filteredTools.length }} 个工具 · 按场景浏览</span></div>
        <template v-for="g in GROUPS" :key="g">
          <div v-if="filteredTools.some(x => x.group === g)" class="home-group">
            <div class="group-head"><span class="group-title">{{ g }}</span><span class="group-count">{{ filteredTools.filter(x => x.group === g).length }} 个工具</span></div>
            <div class="tool-grid">
              <button v-for="t in filteredTools.filter(x => x.group === g)" :key="t.key" class="tool-card tilt" @click="pickTool(t)" :disabled="t.disabled">
                <span class="tool-icon" :style="{ background: t.color + '22', color: t.color, border: '1px solid ' + t.color + '44' }"><component :is="t.icon" :size="22"/></span>
                <b>{{ t.title }}</b><small>{{ t.sub }}</small>
              </button>
            </div>
          </div>
        </template>
        </section>
      </div>

      <!-- 文案工具 -->
      <div v-else-if="!selected.needCap && !['chat','works','tts'].includes(selected.key)" :class="['workspace', `workspace-${selected.key}`]">
        <div class="ws-head">
          <div class="ws-title"><span class="tool-icon sm" :style="{ background: selected.color + '22', color: selected.color }"><component :is="selected.icon" :size="17"/></span><b>{{ selected.title }}</b><small>{{ selected.sub }}</small></div>
          <div class="ws-actions">
            <el-button class="ghost-btn" :icon="Copy" @click="copyOutput">复制结果</el-button>
            <el-button class="ghost-btn" @click="openHistory">历史记录</el-button>
          </div>
        </div>
        <div class="ws-body">
          <div class="form-panel">
          <div class="panel-head"><span class="panel-icon" :style="{background: selected.color + '12', color: selected.color}"><component :is="selected.icon" :size="15"/></span><div><b>{{ selected.title }} · 创作设置</b><small>按提示填写，选择选项</small></div></div>
            <template v-for="f in (selected.fields || [{k:'subject',label:'创作主题 / 内容',type:'textarea',ph:'输入主题或粘贴需要处理的内容…'}])" :key="f.k">
              <template v-if="f.type === 'textarea'">
                <label><i>*</i> {{ f.label }}</label>
                <textarea v-model="subject" maxlength="3000" :placeholder="f.ph"></textarea>
                <div class="char-count">{{ subject.length }}/3000</div>
              </template>
              <template v-else-if="f.type === 'select'">
                <label>{{ f.label }}</label>
                <select v-model="extra[f.k]" class="model-select">
                  <option value="">不限</option>
                  <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
                </select>
              </template>
            </template>
            <div v-if="selected.directions && selected.directions.length" class="dir-tags">
              <label>写作方向</label>
              <div class="tag-row">
                <button v-for="d in selected.directions" :key="d" class="dir-tag" :class="{ picked: direction === d }" @click="direction = direction === d ? '' : d">{{ d }}</button>
              </div>
            </div>
            <template v-if="selected.withImg !== false">
              <label>配图（可选，小红书/口播可带图发布）</label>
              <div class="upload-row">
                <input type="file" accept="image/*" id="img-input" style="display:none" @change="onUploadImg"/>
                <button class="ghost-btn" @click="openImgPicker">{{ imgUrl ? '已配图 ✓' : '📷 上传图片' }}</button>
                <img v-if="imgUrl" :src="imgUrl" class="thumb" :title="imgUrl"/>
              </div>
            </template>
            <div class="skill-route"><Sparkles :size="15"/><span>后台智能路由</span><small>模型由后台 Skill 策略自动选择</small></div>
            <button class="gen-btn" :disabled="generating" @click="generate">
              <Sparkles :size="16"/> {{ generating ? '生成中…' : `立即生成 · 扣费 ${selectedCost}` }}
            </button>
          </div>
          <div class="result-panel">
            <template v-if="output">
              <div class="result-top">
                <b>AI 创作结果</b><span>{{ selected.title }}</span>
                <div v-if="results.length > 1" class="result-tabs">
                  <button v-for="(_, i) in results" :key="i" :class="{ picked: activeResult === i }" @click="selectResult(i)">结果{{ i + 1 }}</button>
                </div>
              </div>
              <img v-if="results[activeResult] && results[activeResult].img" :src="results[activeResult].img" class="result-img" alt="配图"/>
              <div class="result-text">{{ output }}</div>
              <div class="revise-box">
                <input v-model="reviseInput" placeholder="输入修改要求，如：语气更幽默、缩短到100字、加上价格…" @keyup.enter="revise"/>
                <button class="ghost-btn" :disabled="revising" @click="revise">{{ revising ? '修改中…' : '✏️ 按此要求修改' }}</button>
              </div>
            </template>
            <div v-else class="empty result-empty"><div class="empty-icon"><Sparkles :size="26"/></div><span>AI 创作结果会显示在这里</span><small>左侧输入主题，点击生成</small></div>
          </div>
        </div>
      </div>

      <!-- AI 对话 -->
      <div v-else-if="selected.key === 'chat'" class="workspace chat-ws workspace-chat">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#22d3ee22;color:#22d3ee"><Bot :size="17"/></span><b>AI 对话</b><small>多轮智能对话</small></div></div>
        <div class="chat-box">
          <div class="chat-msgs">
            <template v-if="chatMessages.length === 0"><div class="empty"><Bot :size="40" opacity=".3"/><span>开始和 AI 对话吧</span></div></template>
            <div v-for="(m, i) in chatMessages" :key="i" class="msg" :class="m.role">
              <div class="bubble">{{ m.content }}</div>
            </div>
            <div v-if="chatting" class="msg ai"><div class="bubble typing">正在思考…</div></div>
          </div>
          <div class="chat-input">
            <input v-model="chatInput" placeholder="输入消息，Enter 发送" @keyup.enter="sendChat"/>
            <button class="gen-btn" :disabled="chatting" @click="sendChat">发送</button>
          </div>
        </div>
      </div>

      <!-- AI 绘画 -->
      <div v-else-if="['image', 'product_main'].includes(selected.key)" class="workspace workspace-image">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#f472b622;color:#f472b6"><Palette :size="17"/></span><b>{{ selected.key === 'product_main' ? '商品主图' : 'AI 绘画' }}</b><small>{{ selected.key === 'product_main' ? '商品图 · 电商视觉生成' : '文生图 · 模型后台配置' }}</small></div></div>
        <div class="ws-body">
          <div class="form-panel">
          <div class="panel-head"><span class="panel-icon" style="background:#f472b612;color:#f472b6"><Palette :size="15"/></span><div><b>绘画设置</b><small>描述画面，选择尺寸</small></div></div>
            <div v-if="selected.key === 'image'" class="draw-mode"><button :class="{picked: drawMode === 'text'}" @click="drawMode = 'text'">文生图</button><button :class="{picked: drawMode === 'product'}" @click="drawMode = 'product'">产品套图</button></div>
            <template v-if="drawMode === 'product'"><label><i>*</i> 商品图片（最多 10 张）</label><input id="product-image-file" type="file" accept="image/*" style="display:none" @change="uploadProductImage"/><button class="media-upload compact" @click="openProductPicker"><span><ImageIcon :size="18"/></span><b>{{ productUploading ? '上传中…' : '上传商品图片' }}</b><small>建议白底、正面、清晰商品图</small></button><div class="product-thumbs"><img v-for="url in productImageUrls" :key="url" :src="url" class="product-thumb" alt="商品图片"/></div><div class="product-fields"><input v-model="productName" placeholder="商品名称"/><input v-model="productSellingPoints" placeholder="核心卖点，如：防水、耐用、轻便"/><input v-model="productAudience" placeholder="目标人群"/><input v-model="productScene" placeholder="使用场景"/><select v-model="productStyle"><option>实拍干净</option><option>极简现代</option><option>高级黑</option><option>暖光生活</option></select></div><label>生成数量</label><div class="size-row"><button v-for="n in [1,2,3,4]" :key="n" class="size-btn" :class="{picked: productCount === n}" @click="productCount = n">{{ n }} 张</button></div></template>
          <div v-if="drawMode === 'product'" class="selected-template-card" @click="productTemplateOpen = true">
            <div class="template-mini" :style="{'--tone':selectedProductTemplate.tone,'--accent':selectedProductTemplate.accent}"><span></span><i></i></div>
            <div><label>主图模板</label><b>{{ selectedProductTemplate.name }}</b><small>{{ selectedProductTemplate.category }} · {{ selectedProductTemplate.ratio }} · 点击更换</small></div>
            <button type="button">选择模板</button>
          </div>
          <label><i>*</i> 绘画描述</label>
            <textarea v-model="drawPrompt" :placeholder="selected.key === 'product_main' ? '填写商品卖点、目标人群、使用场景、价格和画面要求' : '描述你想生成的画面，如：赛博朋克风格的未来城市夜景，霓虹灯，雨夜'"></textarea>
            <div class="skill-route"><Sparkles :size="15"/><span>{{ drawUsedModel ? `绘图 Skill · ${drawUsedModel}` : '绘图 Skill · 等待调用' }}</span><small>{{ drawUsedModel ? '本次请求实际使用的模型' : '生成后显示实际模型' }}</small></div>
            <label>尺寸</label>
            <div class="size-row">
              <button v-for="s in ['1024x1024','768x1024','1024x768']" :key="s" class="size-btn" :class="{ picked: drawSize === s }" @click="drawSize = s">{{ s }}</button>
            </div>
            <button class="gen-btn" :disabled="drawing" @click="doDraw"><Palette :size="16"/> {{ drawing ? '生成中…' : (drawMode === 'product' ? `开始生成 ${productCount} 张` : '开始绘画') }}<small v-if="drawMode === 'product'" class="gen-cost">{{ selectedCost * productCount }} 点数</small></button>
          </div>
          <div class="result-panel">
            <div v-if="drawMode === 'product' && productResults.length" class="product-result-section">
              <div class="product-result-head"><div><b>生成结果</b><small>选择一张继续修改</small></div><span>{{ productResults.length }} 张</span></div>
              <div class="product-result-grid">
                <button v-for="(item, i) in productResults" :key="item.url + i" :class="{picked: item.url === drawUrl}" @click="selectDrawResult(item)">
                  <img :src="item.url" :alt="`商品主图 ${i + 1}`"/>
                  <span>{{ item.url === drawUrl ? '已选中' : `第 ${i + 1} 张` }}</span>
                </button>
              </div>
            </div>
            <button v-else-if="drawUrl" class="draw-preview-trigger" title="点击放大预览" @click="previewDraw"><img :src="drawUrl" class="draw-img" alt="AI 绘画结果"/></button>
            <div v-if="drawUrl && drawUsedModel" class="model-result">模型：{{ drawUsedModel }}</div>
            <div v-if="drawUrl" class="draw-actions"><button class="ghost-btn" @click="previewDraw">预览</button><button class="ghost-btn" @click="downloadDraw">下载图片</button></div>
            <div v-if="drawUrl" class="draw-revise">
              <div class="draw-revise-label"><b>{{ drawMode === 'product' ? '基于选中图片继续生成' : '按提示修改当前图片' }}</b><small>{{ drawMode === 'product' ? '新图片会追加到上方，原图不会被覆盖' : '保持未指定内容不变' }}</small></div>
              <div class="draw-revise-row"><input v-model="drawRevisePrompt" placeholder="输入修改要求，如：换成厨房场景，保留商品主体" @keyup.enter="reviseDraw" /><button class="ghost-btn" :disabled="revisingDraw" @click="reviseDraw">{{ revisingDraw ? '生成中…' : '生成新图' }}</button></div>
            </div>
            <div v-if="drawHistory.length" class="draw-history"><div class="draw-history-head"><b>生成记录</b><small>{{ drawHistory.length }} 条</small></div><div class="draw-history-grid"><button v-for="(item, i) in drawHistory" :key="item.createdAt + i" :class="{picked: item.url === drawUrl}" @click="selectDrawResult(item)"><img :src="item.url" alt="历史生成结果"/></button></div></div>
            <div v-else class="empty result-empty"><div class="empty-icon"><Palette :size="26"/></div><span>生成的图片会显示在这里</span><small>{{ drawModels.length ? '填写要求并开始生成' : '需要后台配置绘图模型（capability=draw）' }}</small></div>
          </div>
        </div>
      </div>

      <!-- AI 视频 -->
      <div v-else-if="selected.key === 'video'" class="workspace workspace-video">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#8b5cf622;color:#8b5cf6"><Video :size="17"/></span><b>AI 视频</b><small>文生视频 · 模型后台配置</small></div></div>
        <div class="ws-body">
          <div class="form-panel">
          <div class="panel-head"><span class="panel-icon" style="background:#8b5cf612;color:#8b5cf6"><Video :size="15"/></span><div><b>视频设置</b><small>描述画面内容</small></div></div>
          <label><i>*</i> 视频描述/文案</label>
            <textarea v-model="videoPrompt" placeholder="描述视频内容，如：一只橘猫在窗台上晒太阳，阳光洒落，温馨治愈"></textarea>
            <label>首帧图片（可选）</label>
            <input id="video-image-1" type="file" accept="image/*" style="display:none" @change="uploadVideoImage($event,1)"/>
            <button class="media-upload compact" @click="openVideoPicker('video-image-1')"><span><ImageIcon :size="18"/></span><b>{{ videoImageUrl ? '首帧已上传' : '上传首帧图片' }}</b><small>使用 Vidu 图生视频</small></button>
            <template v-if="videoImageUrl"><label>尾帧图片（可选）</label><input id="video-image-2" type="file" accept="image/*" style="display:none" @change="uploadVideoImage($event,2)"/><button class="media-upload compact" @click="openVideoPicker('video-image-2')"><span><ImageIcon :size="18"/></span><b>{{ videoImageUrl2 ? '尾帧已上传' : '上传尾帧图片' }}</b><small>上传后将按首尾帧生成</small></button></template>
            <div class="skill-route"><Sparkles :size="15"/><span>后台智能路由</span><small>根据视频 Skill 自动匹配模型</small></div>
            <button class="gen-btn" :disabled="videoGenerating" @click="doVideo"><Video :size="16"/> {{ videoGenerating ? '生成中（约1-3分钟）…' : '生成视频' }}</button>
          </div>
          <div class="result-panel">
            <video v-if="videoUrl" :src="videoUrl" controls playsinline class="draw-img"></video>
            <div v-else class="empty result-empty"><div class="empty-icon"><Video :size="26"/></div><span>生成的视频会显示在这里</span><small>需要后台配置视频模型（capability=video）</small></div>
          </div>
        </div>
      </div>

      <!-- AI 配音 -->
      <div v-else-if="selected.key === 'tts'" class="workspace workspace-tts">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#22c55e22;color:#22c55e"><AudioLines :size="17"/></span><b>AI 配音</b><small>文案一键转语音 · 免费 · 多音色</small></div></div>
        <div class="ws-body">
          <div class="form-panel">
          <div class="panel-head"><span class="panel-icon" style="background:#22c55e12;color:#22c55e"><AudioLines :size="15"/></span><div><b>配音设置</b><small>输入文本，选择音色</small></div></div>
          <label><i>*</i> 配音文本</label>
            <textarea v-model="ttsText" maxlength="3000" placeholder="输入要转语音的文案，如：大家好，今天给大家分享一个实用的小技巧…"></textarea>
            <div class="char-count">{{ ttsText.length }}/3000</div>
            <label>音色</label>
            <select v-model="ttsVoice" class="model-select">
              <option v-for="v in TTS_VOICES" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <button class="gen-btn" :disabled="ttsGenerating" @click="doTts"><AudioLines :size="16"/> {{ ttsGenerating ? '生成中…' : '生成配音' }}</button>
          </div>
          <div class="result-panel">
            <template v-if="ttsUrl">
              <div class="result-top"><b>配音结果</b><span>点击播放，可下载</span></div>
              <audio :src="ttsUrl" controls class="tts-audio"></audio>
              <a :href="ttsUrl" download class="ghost-btn" style="display:inline-block;margin-top:14px">⬇ 下载音频</a>
            </template>
            <div v-else class="empty result-empty"><div class="empty-icon"><AudioLines :size="26"/></div><span>生成的配音会显示在这里</span><small>输入文本，选择音色，点击生成</small></div>
          </div>
        </div>
      </div>

      <!-- AI 音乐与数字人媒体能力 -->
      <div v-else-if="['music','avatar_clone','voice_clone','face_merge','photo_dh'].includes(selected.key)" :class="['workspace','workspace-media',`workspace-${selected.key}`]">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" :style="{background:selected.color+'22',color:selected.color}"><component :is="selected.icon" :size="17"/></span><b>{{ selected.title }}</b><small>{{ selected.sub }}</small></div></div>
        <div class="ws-body">
          <div class="form-panel">
            <div class="panel-head"><span class="panel-icon" :style="{background:selected.color+'16',color:selected.color}"><component :is="selected.icon" :size="16"/></span><div><b>{{ selected.title }}设置</b><small>上传素材并填写生成要求</small></div></div>
            <template v-if="selected.key !== 'music'">
              <label><i>*</i> {{ selected.key === 'voice_clone' ? '参考声音' : selected.key === 'face_merge' ? '第一张人脸照片' : '参考人物照片' }}</label>
              <input id="media-file-1" type="file" :accept="selected.key === 'voice_clone' ? 'audio/*' : 'image/*'" style="display:none" @change="uploadMediaFile($event,1)"/>
              <button class="media-upload" @click="openMediaPicker('media-file-1')"><span><ImageIcon v-if="selected.key !== 'voice_clone'" :size="18"/><AudioLines v-else :size="18"/></span><b>{{ mediaInputUrl ? '素材已上传' : '点击上传参考素材' }}</b><small>{{ selected.key === 'voice_clone' ? 'MP3 / WAV，建议 10-60 秒' : 'JPG / PNG，建议正面清晰照片' }}</small></button>
              <template v-if="selected.key === 'face_merge'">
                <label><i>*</i> 第二张人脸照片</label><input id="media-file-2" type="file" accept="image/*" style="display:none" @change="uploadMediaFile($event,2)"/>
                <button class="media-upload compact" @click="openMediaPicker('media-file-2')"><span><ScanFace :size="18"/></span><b>{{ mediaInputUrl2 ? '第二张照片已上传' : '上传第二张照片' }}</b></button>
              </template>
            </template>
            <label><i>*</i> {{ selected.key === 'music' ? '歌曲主题与风格' : selected.key === 'voice_clone' ? '试听台词' : '动作与口播内容' }}</label>
            <textarea v-model="mediaPrompt" maxlength="3000" :placeholder="selected.key === 'music' ? '例如：轻快治愈的中文流行歌曲，女声，夏日旅行主题，包含主歌和副歌' : selected.key === 'voice_clone' ? '输入生成克隆声音后用于试听的台词' : '描述希望人物说的话、动作、表情和画面风格'"></textarea>
            <div class="char-count">{{ mediaPrompt.length }}/3000</div>
            <div class="skill-route"><Sparkles :size="15"/><span>后台智能路由</span><small>{{ currentMediaModels.length ? '由后台 Skill 自动选择可用模型' : '后台尚未配置可用模型' }}</small></div>
            <button class="gen-btn" :disabled="mediaGenerating || !currentMediaModels.length" @click="doMedia"><component :is="selected.icon" :size="16"/> {{ mediaGenerating ? '生成处理中…' : currentMediaModels.length ? `开始${selected.title}` : '等待后台配置模型' }}</button>
          </div>
          <div class="result-panel media-result">
            <template v-if="mediaResultUrl"><div class="result-top"><b>{{ selected.title }}结果</b><span>已保存到我的作品</span></div><audio v-if="['music','voice_clone'].includes(selected.key)" :src="mediaResultUrl" controls class="tts-audio"></audio><img v-else-if="selected.key === 'face_merge'" :src="mediaResultUrl" class="draw-img" alt="生成结果"/><video v-else :src="mediaResultUrl" controls playsinline class="draw-img"></video><a :href="mediaResultUrl" target="_blank" class="ghost-btn media-download">打开或下载结果</a></template>
            <div v-else class="empty result-empty"><div class="empty-icon"><component :is="selected.icon" :size="26"/></div><span>{{ currentMediaModels.length ? `${selected.title}结果会显示在这里` : '后台尚未配置此类模型' }}</span><small>{{ currentMediaModels.length ? '提交后可离开页面，任务会保存在我的作品' : `需要添加 capability=${selected.needCap} 的模型` }}</small></div>
          </div>
        </div>
      </div>

      <!-- 我的作品 -->
      <div v-else-if="selected.key === 'works'" class="workspace workspace-works">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#3b82f622;color:#3b82f6"><FolderOpen :size="17"/></span><b>我的作品</b><small>全部生成历史</small></div></div>
        <div class="works-grid">
          <div v-for="w in works" :key="w.task_no" class="work-card tilt">
            <span class="tag">{{ featureLabel(w.feature_code) }}</span>
            <p>{{ (w.result_body || w.request_body || '').slice(0, 80) }}</p>
            <small>{{ w.status }} · {{ w.create_time }} · 扣费 {{ w.credits_cost }}</small>
          </div>
          <div v-if="works.length === 0" class="empty" style="grid-column:1/-1"><FolderOpen :size="40" opacity=".3"/><span>还没有作品，去生成一个吧</span></div>
        </div>
      </div>

      <!-- 我的素材 -->
      <div v-else-if="selected.key === 'materials'" class="workspace workspace-materials">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#64748b22;color:#64748b"><Layers :size="17"/></span><b>我的素材</b><small>上传的配图素材，点选可作为文案配图</small></div></div>
        <div class="works-grid">
          <div v-for="m in materials" :key="m.id" class="material-card tilt">
            <img :src="m.url" alt="素材"/>
            <div class="mat-actions">
              <button class="ghost-btn" @click="useMaterial(m.url)">设为配图</button>
              <button class="ghost-btn danger" @click="delMaterial(m.id)">删除</button>
            </div>
            <small>{{ m.create_time }}</small>
          </div>
          <div v-if="materials.length === 0" class="empty" style="grid-column:1/-1"><Layers :size="40" opacity=".3"/><span>还没有素材，去文案工具上传图片自动保存到这里</span></div>
        </div>
      </div>

      <!-- 模板剪辑 -->
      <div v-else-if="selected.key === 'template_edit'" class="workspace workspace-template">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" style="background:#a855f722;color:#a855f7"><Clapperboard :size="17"/></span><b>模板剪辑</b><small>素材图片 + AI 配音一键成片</small></div></div>
        <div class="ws-body">
          <div class="form-panel">
          <div class="panel-head"><span class="panel-icon" style="background:#a855f712;color:#a855f7"><Clapperboard :size="15"/></span><div><b>剪辑设置</b><small>选择图片素材，填写配音文案</small></div></div>
          <label><i>*</i> 选择图片素材（点选，已选 {{ composeImgs.length }}/12）</label>
            <div v-if="materials.length" class="mat-picker">
              <div v-for="m in materials" :key="m.id" class="mat-pick" :class="{ picked: composeImgs.includes(m.url) }" @click="toggleComposeImg(m.url)">
                <img :src="m.url" alt="素材"/><span v-if="composeImgs.includes(m.url)" class="pick-ok">✓</span>
              </div>
            </div>
            <div v-else class="empty" style="min-height:80px;height:auto;padding:12px 0"><span>还没有素材，先去「我的素材」或文案工具上传图片</span></div>
            <label><i>*</i> 配音文案</label>
            <textarea v-model="composeText" maxlength="3000" placeholder="输入视频旁白文案，如：今天带大家看看这家宝藏咖啡店…"></textarea>
            <div class="char-count">{{ composeText.length }}/3000</div>
            <label>音色</label>
            <select v-model="composeVoice" class="model-select">
              <option v-for="v in TTS_VOICES" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <button class="gen-btn" :disabled="composing" @click="doCompose"><Clapperboard :size="16"/> {{ composing ? '合成中（约1分钟）…' : '一键成片' }}</button>
          </div>
          <div class="result-panel">
            <template v-if="composeUrl">
              <div class="result-top"><b>成片结果</b><span>点击播放，可下载</span></div>
              <video :src="composeUrl" controls playsinline class="draw-img"></video>
              <a :href="composeUrl" download class="ghost-btn" style="display:inline-block;margin-top:14px">⬇ 下载视频</a>
            </template>
            <div v-else class="empty result-empty"><div class="empty-icon"><Clapperboard :size="26"/></div><span>成片会显示在这里</span><small>选图 + 文案 → 一键合成视频</small></div>
          </div>
        </div>
      </div>

      <!-- 占位 -->
      <div v-else class="workspace">
        <div class="ws-head"><div class="ws-title"><span class="tool-icon sm" :style="{ background: selected.color + '22', color: selected.color }"><component :is="selected.icon" :size="17"/></span><b>{{ selected.title }}</b><small>{{ selected.sub }}</small></div></div>
        <div class="ws-body"><div class="empty" style="grid-column:1/-1;min-height:400px"><component :is="selected.icon" :size="50" opacity=".3"/><span>功能开发中，敬请期待</span><small>该功能需要接入对应 AI 服务，可在后台配置模型后开放</small></div></div>
      </div>

      <el-dialog v-model="drawPreviewOpen" title="图片预览" width="min(92vw, 900px)" class="draw-preview-dialog" destroy-on-close>
        <img v-if="drawUrl" :src="drawUrl" class="draw-preview-img" alt="图片预览"/>
        <template #footer><button class="ghost-btn" @click="downloadDraw">下载图片</button><button class="gen-btn" @click="drawPreviewOpen = false">关闭</button></template>
      </el-dialog>
      <el-dialog v-model="productTemplateOpen" title="选择商品主图模板" width="min(94vw, 980px)" class="product-template-dialog" destroy-on-close>
        <div class="template-filter-row"><b>类型</b><div><button v-for="x in ['商品主图','全部模板','日常主图','活动主图','主图图标','跨境电商主图','外卖平台主图']" :key="x" :class="{picked:productTemplateType===x}" @click="productTemplateType=x">{{ x }}</button></div></div>
        <div class="template-filter-row"><b>行业</b><div><button v-for="x in ['全部','服饰箱包','美容美妆','数码家电','食品','家居百货','生鲜','母婴亲子','五金工程','休闲饮品','珠宝首饰','宠物','户外运动','家具建材','跨境出口']" :key="x" :class="{picked:productTemplateCategory===x}" @click="productTemplateCategory=x">{{ x }}</button></div></div>
        <div class="template-filter-row"><b>物料</b><div><button v-for="x in ['全部','3:4','1:1','2:3']" :key="x" :class="{picked:productTemplateRatio===x}" @click="productTemplateRatio=x">{{ x === '全部' ? '全部' : `商品主图(${x})` }}</button></div></div>
        <div class="template-result-count">{{ filteredProductTemplates.length }} 个模板 <span>点击模板即可应用到商品主图</span></div>
        <div class="template-library-grid">
          <button v-for="tpl in filteredProductTemplates" :key="tpl.id" class="template-library-card" :class="{picked:selectedProductTemplateId===tpl.id}" @click="chooseProductTemplate(tpl)">
            <div class="template-art" :style="{'--tone':tpl.tone,'--accent':tpl.accent}"><span class="template-product"></span><span class="template-copy"></span><i>{{ tpl.ratio }}</i></div>
            <div class="template-meta"><b>{{ tpl.name }}</b><small>{{ tpl.category }} · {{ tpl.scene }}</small></div>
          </button>
        </div>
      </el-dialog>
    </main>
  </div>

  <!-- 登录弹窗 -->
  <el-dialog v-model="loginOpen" width="400px" class="auth-dialog">
    <div class="auth-hero"><div class="brand-mark big"><Zap :size="26"/></div><h2>欢迎使用 ll AI 创作平台</h2><p>{{ loginMode === 'login' ? '登录后使用完整 AI 创作能力' : '注册账号，开始创作' }}</p></div>
    <div class="auth-form">
      <template v-if="loginMode === 'register'"><el-input v-model="authEmail" placeholder="邮箱" size="large"/></template>
      <template v-else><el-input v-model="authUsername" placeholder="邮箱" size="large"/></template>
      <el-input v-model="authPassword" type="password" show-password placeholder="密码" size="large" @keyup.enter="doAuth"/>
      <div v-if="loginMode === 'register'" class="code-row">
        <el-input v-model="emailCode" placeholder="邮箱验证码" size="large" @keyup.enter="doAuth"/>
        <el-button class="code-btn" :loading="codeSending" :disabled="codeCountdown > 0" @click="sendEmailCode">{{ codeCountdown > 0 ? `重新获取 ${codeCountdown}s` : '获取验证码' }}</el-button>
      </div>
      <el-button type="primary" size="large" class="auth-btn" :loading="authLoading" @click="doAuth">{{ loginMode === 'login' ? '登 录' : '注 册' }}</el-button>
      <div class="auth-switch"><span>{{ loginMode === 'login' ? '还没有账号？' : '已有账号？' }}</span><button @click="loginMode = loginMode === 'login' ? 'register' : 'login'">{{ loginMode === 'login' ? '立即注册' : '去登录' }}</button></div>
    </div>
  </el-dialog>

  <!-- 历史记录弹窗 -->
  <el-dialog v-model="historyOpen" width="760px" class="history-dialog" title="历史记录">
    <div class="history-body">
      <div class="history-list">
        <div v-for="w in works" :key="w.task_no" class="history-item" :class="{ picked: (w.result_body || w.error_message || '') === historyDetail }" @click="viewHistory(w)">
          <span class="tag">{{ w.feature_code === 'video' ? '视频' : w.feature_code === 'image' ? '绘图' : '文案' }}</span>
          <p>{{ (w.result_body || w.error_message || '(无内容)').slice(0, 60) }}</p>
          <small>{{ w.status }} · {{ w.create_time }}</small>
        </div>
        <div v-if="works.length === 0" class="empty" style="grid-column:1/-1"><FolderOpen :size="36" opacity=".3"/><span>还没有历史记录</span></div>
      </div>
      <div class="history-detail">
        <template v-if="historyDetail">
          <div class="hd-top">
            <b>内容详情</b>
            <span><button class="ghost-btn" @click="copyHistory">复制</button> <button class="ghost-btn" @click="continueFromHistory">载入继续修改</button></span>
          </div>
          <div class="hd-text">{{ historyDetail }}</div>
        </template>
        <div v-else class="empty"><History :size="36" opacity=".3"/><span>点左侧记录查看详情</span></div>
      </div>
    </div>
  </el-dialog>

  <!-- 账户弹窗 -->
  <el-dialog v-model="accountOpen" width="820px" class="account-dialog" title="我的账户">
    <div class="account-summary">
      <div><span>当前余额</span><strong>{{ balance ?? 0 }}</strong></div>
      <div><span>登录账号</span><b>{{ userName }}</b></div>
      <el-button class="ghost-btn" :icon="LogOut" @click="logout(); accountOpen = false">退出登录</el-button>
    </div>
    <el-tabs v-model="accountTab" @tab-change="loadAccountCenter">
      <el-tab-pane label="余额充值" name="recharge">
        <div class="payment-types"><span>支付方式</span><el-radio-group v-model="paymentType"><el-radio-button value="alipay">支付宝</el-radio-button><el-radio-button value="wxpay">微信支付</el-radio-button></el-radio-group></div>
        <div class="package-grid">
          <button v-for="pack in packages" :key="pack.id" class="package-item" @click="startRecharge(pack)">
            <span>{{ pack.package_name }}</span><strong>¥ {{ pack.price }}</strong><small>到账 {{ pack.credits }} 余额</small>
            <em>{{ rechargeLoading === pack.id ? '创建订单中…' : '立即充值' }}</em>
          </button>
        </div>
        <div class="custom-recharge"><span>自定义金额</span><el-input-number v-model="customAmount" :min="1" :max="10000" :step="10" controls-position="right" style="width:170px"/><el-button type="primary" :loading="customRechargeLoading" @click="startCustomRecharge">立即充值</el-button><small>1 元 = {{ customRate }} 余额</small></div>
      </el-tab-pane>
      <el-tab-pane label="充值记录" name="orders"><el-table :data="orders" height="360"><el-table-column prop="order_no" label="订单号" min-width="200"/><el-table-column prop="package_name" label="套餐"/><el-table-column prop="amount" label="金额" width="90"/><el-table-column prop="credits" label="到账" width="90"/><el-table-column prop="status" label="状态" width="100"><template #default="scope"><el-tag :type="scope.row.status === 'PAID' ? 'success' : 'warning'">{{ scope.row.status === 'PAID' ? '已支付' : '待支付' }}</el-tag></template></el-table-column><el-table-column prop="create_time" label="创建时间" min-width="160"/></el-table></el-tab-pane>
      <el-tab-pane label="余额流水" name="flows"><el-table :data="creditFlows" height="360"><el-table-column prop="create_time" label="时间" min-width="160"/><el-table-column prop="remark" label="类型"/><el-table-column prop="change_amount" label="变动" width="90"><template #default="scope"><b :class="scope.row.change_amount > 0 ? 'flow-plus' : 'flow-minus'">{{ scope.row.change_amount > 0 ? '+' : '' }}{{ scope.row.change_amount }}</b></template></el-table-column><el-table-column prop="balance" label="余额" width="90"/></el-table></el-tab-pane>
    </el-tabs>
  </el-dialog>
</div>
</template>

<style scoped>
:global(*){box-sizing:border-box}
:global(body){margin:0;font-family:"Inter","Noto Sans SC",-apple-system,"Segoe UI",Arial,sans-serif;background:#f3f5f9;color:#1f2937}
.app{min-height:100vh;background:
  radial-gradient(900px 480px at 85% -10%,#ff6b3510,transparent 60%),
  radial-gradient(800px 500px at -10% 110%,#4d7cfe0a,transparent 60%),
  #f3f5f9;position:relative;overflow:hidden}
.glow{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(420px 260px at var(--x,50%) var(--y,0%),rgba(255,107,53,.05),transparent 70%)}
.topbar{position:sticky;top:0;z-index:20;height:60px;display:flex;align-items:center;gap:24px;padding:0 24px;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border-bottom:1px solid #e8ecf2;box-shadow:0 4px 18px #0f172a06}
.brand{display:flex;align-items:center;gap:10px;font-size:16px;color:#111827;font-weight:700}
.brand-mark{height:32px;width:32px;border-radius:9px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#ff6b35,#ff9a5c);box-shadow:0 4px 14px #ff6b3533}
.brand-mark.big{height:52px;width:52px;border-radius:14px;margin:0 auto}
.top-search{flex:1;max-width:340px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;color:#94a3b8;box-shadow:0 1px 2px #0f172a08}
.top-search input{flex:1;background:none;border:0;outline:none;color:#1f2937;font-size:13px}
.top-right{display:flex;align-items:center;gap:10px;margin-left:auto}
.balance-pill{display:flex;align-items:center;gap:6px;font-size:13px;color:#64748b;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:6px 14px;box-shadow:0 1px 2px #0f172a08}
.balance-pill b{color:#ff6b35}
.user-chip{display:flex;align-items:center;gap:5px;font-size:13px;color:#374151;cursor:pointer;padding:6px 10px;border-radius:8px}
.user-chip:hover{background:#f1f5f9}
.ghost-btn{background:#fff!important;border:1px solid #e2e8f0!important;color:#374151!important;border-radius:9px!important;box-shadow:0 1px 2px #0f172a08!important}
.ghost-btn:hover{border-color:#ff6b3566!important;color:#ff6b35!important;background:#fff7f4!important}
.layout{display:flex;position:relative;z-index:1}
.sidebar{width:224px;flex-shrink:0;padding:16px 12px;border-right:1px solid #e6eaf0;background:#fff;min-height:calc(100vh - 60px);box-shadow:2px 0 16px #0f172a05}
.nav-group{padding:14px 12px 6px;color:#94a3b8;font-size:11px;letter-spacing:2px;font-weight:700}
.nav-item{display:flex;align-items:center;gap:10px;width:100%;height:38px;background:transparent;border:0;border-radius:9px;padding:0 12px;cursor:pointer;color:#64748b;font-size:13px;text-align:left;transition:.2s}
.nav-item:hover{background:#f1f5f9;color:#111827}
.nav-item.active{background:linear-gradient(90deg,#ff6b3514,transparent);color:#ff6b35;font-weight:600;border-left:2px solid #ff6b35}
.nav-item .soon{font-style:normal;font-size:10px;color:#cbd5e1;margin-left:auto}
.main{flex:1;padding:28px 32px;min-height:calc(100vh - 60px)}
.home{max-width:1100px;margin:0 auto}
.home-group{margin-bottom:36px}
.group-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.group-title{font-size:15px;font-weight:700;color:#111827;white-space:nowrap}
.group-head::after{content:"";flex:1;height:1px;background:#e8ecf2}
.group-count{font-size:12px;color:#94a3b8;white-space:nowrap}
.hero-title{font-size:34px;font-weight:800;margin:10px 0 4px;background:linear-gradient(90deg,#ff6b35,#ff9a5c,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{color:#64748b;font-size:14px;margin-bottom:30px}
.tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.tool-card{background:#fff;border:1px solid #e6eaf0;border-radius:16px;padding:22px 20px;text-align:left;cursor:pointer;color:#1f2937;transition:transform .25s,box-shadow .25s,border-color .25s;display:flex;flex-direction:column;gap:8px;box-shadow:0 1px 3px #0f172a06}
.tool-card:hover{transform:translateY(-3px) rotateX(2deg) rotateY(-2deg);border-color:#ff6b354d;box-shadow:0 14px 34px #0f172a14,0 2px 8px #ff6b3522}
.tool-card:disabled{opacity:.45;cursor:not-allowed;transform:none!important}
.tool-card b{font-size:14.5px}
.tool-card small{color:#64748b;font-size:12px}
.tool-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;margin-bottom:6px}
.tool-icon.sm{width:30px;height:30px;border-radius:8px}
.workspace{max-width:1200px;margin:0 auto}
.ws-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.ws-title{display:flex;align-items:center;gap:12px}
.ws-title b{font-size:18px;color:#111827}
.ws-title small{color:#64748b;font-size:12px;margin-left:6px}
.ws-actions{display:flex;gap:10px}
.ws-body{display:grid;grid-template-columns:360px minmax(0,1fr);gap:18px;align-items:start}
.form-panel{background:#fff;border:1px solid #e6eaf0;border-radius:16px;padding:22px;box-shadow:0 1px 3px #0f172a06}
.panel-head{display:flex;align-items:center;gap:11px;margin-bottom:6px;padding-bottom:14px;border-bottom:1px solid #f0f2f6}
.panel-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
.panel-head b{display:block;font-size:14.5px;color:#111827;line-height:1.3}
.panel-head small{font-size:12px;color:#94a3b8}
.form-panel label{display:block;font-size:13px;color:#475569;margin:16px 0 8px;font-weight:600}
.form-panel label:first-of-type{margin-top:14px}
.form-panel label i{color:#ff6b35;font-style:normal}
.form-panel textarea{width:100%;height:172px;background:#fafbfd;border:1px solid #e2e8f0;border-radius:12px;color:#1f2937;padding:13px 14px;font-size:13.5px;resize:vertical;outline:none;font-family:inherit;line-height:1.7;transition:border-color .2s,box-shadow .2s}
.form-panel textarea:focus{border-color:#ff6b3580;box-shadow:0 0 0 3px #ff6b3514}
.char-count{text-align:right;color:#94a3b8;font-size:11px;margin-top:5px}
.model-select{width:100%;background:#fafbfd;border:1px solid #e2e8f0;border-radius:12px;color:#1f2937;padding:11px 13px;font-size:13.5px;outline:none;transition:border-color .2s,box-shadow .2s}
.model-select:focus{border-color:#ff6b3580;box-shadow:0 0 0 3px #ff6b3514}
.skill-route{display:flex;align-items:center;gap:8px;padding:11px 12px;border:1px solid #dbe5fb;border-radius:8px;background:#f6f8ff;color:#3158e8;font-size:13px}.skill-route small{margin-left:auto;color:#71809b;font-size:12px}.model-result{margin-top:10px;padding:8px 12px;border-radius:8px;background:#f6f8ff;color:#536887;font-size:12px;text-align:center}
.draw-revise{margin-top:14px;padding:14px;border:1px solid #dbe5fb;border-radius:10px;background:#f8faff}.draw-revise-label{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}.draw-revise-label b{font-size:13px;color:#334155}.draw-revise-label small{font-size:11px;color:#8290a7}.draw-revise-row{display:flex;gap:8px}.draw-revise input{flex:1;min-width:0;border:1px solid #dbe5fb;border-radius:8px;padding:9px 10px;color:#334155;background:#fff}.draw-revise .ghost-btn{white-space:nowrap}
.draw-download{margin-top:10px;width:100%}
.draw-preview-trigger{display:block;width:100%;border:0;background:transparent;cursor:zoom-in;padding:0}
.draw-preview-trigger .draw-img{transition:transform .18s ease}
.draw-preview-trigger:hover .draw-img{transform:scale(1.015)}
.draw-actions{display:flex;gap:8px;margin-top:10px}
.draw-actions .ghost-btn{flex:1}
.draw-history{margin-top:16px;padding-top:14px;border-top:1px solid #e8edf5}
.draw-history-head{display:flex;justify-content:space-between;align-items:center;color:#526078;margin-bottom:9px}
.draw-history-head small{color:#94a3b8}
.draw-history-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.draw-history-grid button{border:2px solid transparent;border-radius:8px;padding:0;overflow:hidden;background:#f1f5f9;cursor:pointer;aspect-ratio:1}
.draw-history-grid button.picked{border-color:#3158e8}
.draw-history-grid img{width:100%;height:100%;object-fit:cover;display:block}
.draw-preview-dialog :deep(.el-dialog__body){padding:8px 20px 20px}
.draw-preview-img{display:block;max-width:100%;max-height:68vh;margin:0 auto;object-fit:contain;border-radius:10px}
.product-result-section{width:100%}.product-result-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.product-result-head>div{display:flex;align-items:baseline;gap:10px}.product-result-head b{color:#1f2937;font-size:14px}.product-result-head small,.product-result-head>span{color:#8492a8;font-size:12px}.product-result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.product-result-grid button{position:relative;min-width:0;padding:0;border:2px solid transparent;border-radius:10px;overflow:hidden;background:#f1f5f9;cursor:pointer;aspect-ratio:1;transition:.16s}.product-result-grid button:hover{border-color:#9cb2ef;transform:translateY(-1px)}.product-result-grid button.picked{border-color:#3158e8;box-shadow:0 0 0 3px #3158e817}.product-result-grid img{display:block;width:100%;height:100%;object-fit:cover}.product-result-grid span{position:absolute;left:8px;bottom:8px;padding:4px 8px;border-radius:6px;background:#111827c9;color:#fff;font-size:11px}
.product-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.product-thumb{width:62px;height:62px;object-fit:cover;border-radius:9px;border:1px solid #dbe3ef;box-shadow:0 2px 8px #18243b12}.product-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.product-fields input,.product-fields select{display:block;width:100%;min-width:0;height:42px;box-sizing:border-box;padding:0 12px;border:1px solid #d8e1ee;border-radius:9px;background:#fff;color:#334155;font:inherit;font-size:13px;line-height:42px}.product-fields input::placeholder{color:#94a3b8}.product-fields input:focus,.product-fields select:focus{outline:0;border-color:#6f91ee;box-shadow:0 0 0 3px #3158e815}.workspace-image .form-panel{overflow:hidden}.workspace-image .result-panel{overflow:auto}.workspace-image .result-empty{min-height:440px;display:flex;align-items:center;justify-content:center}.workspace-image .result-empty span,.workspace-image .result-empty small{max-width:100%;white-space:normal;text-align:center;overflow-wrap:anywhere}
.product-presets{margin:12px 0 4px;padding:12px;border:1px solid #e1e8f3;border-radius:10px;background:#f8faff}.product-presets label{margin:0 0 8px;color:#526078;font-size:13px}.product-presets small{display:block;margin-top:8px;color:#94a3b8;line-height:1.5}.preset-row{display:flex;flex-wrap:wrap;gap:7px}.preset-row button{padding:8px 11px;border:1px solid #d5dfed;border-radius:8px;background:#fff;color:#64748b;cursor:pointer;font:inherit;font-size:12px}.preset-row button.picked{border-color:#ff7a70;background:#fff1f0;color:#e2554f;font-weight:600}
.selected-template-card{display:flex;align-items:center;gap:12px;margin:12px 0;padding:10px;border:1px solid #dbe5fb;border-radius:10px;background:#f8faff;cursor:pointer}.selected-template-card:hover{border-color:#9cb2ef}.selected-template-card>div:nth-child(2){display:flex;flex-direction:column;gap:3px;min-width:0}.selected-template-card label{margin:0;color:#8492a8;font-size:11px}.selected-template-card b{color:#334155;font-size:13px}.selected-template-card small{color:#8492a8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.selected-template-card>button{margin-left:auto;border:0;background:transparent;color:#3158e8;font-size:12px;cursor:pointer;white-space:nowrap}.template-mini{position:relative;flex:none;width:52px;height:52px;border-radius:8px;overflow:hidden;background:var(--tone);border:1px solid var(--accent)}.template-mini span{position:absolute;width:24px;height:31px;left:14px;top:11px;border-radius:5px 5px 8px 8px;background:linear-gradient(145deg,var(--accent),#fff8);box-shadow:0 4px 8px #1f293733}.template-mini i{position:absolute;width:13px;height:3px;left:6px;bottom:7px;background:var(--accent);border-radius:3px}
.template-filter-row{display:flex;align-items:flex-start;gap:12px;padding:10px 2px;border-bottom:1px solid #edf0f5}.template-filter-row>b{flex:none;width:36px;padding-top:7px;color:#8a96a8;font-size:12px}.template-filter-row>div{display:flex;flex-wrap:wrap;gap:7px}.template-filter-row button{padding:7px 11px;border:0;border-radius:999px;background:#f5f6f8;color:#596579;cursor:pointer;font-size:12px}.template-filter-row button:hover{color:#ef5a52}.template-filter-row button.picked{background:#ff5f59;color:#fff;font-weight:600}.template-result-count{display:flex;justify-content:space-between;margin:14px 2px 10px;color:#334155;font-size:13px;font-weight:600}.template-result-count span{color:#96a0af;font-size:11px;font-weight:400}.template-library-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-height:52vh;overflow:auto;padding:2px}.template-library-card{padding:0;text-align:left;border:2px solid transparent;border-radius:8px;background:#fff;overflow:hidden;cursor:pointer;box-shadow:0 2px 10px #19243a0d}.template-library-card:hover{transform:translateY(-1px);box-shadow:0 6px 18px #19243a18}.template-library-card.picked{border-color:#ff6b5d;box-shadow:0 0 0 3px #ff6b5d18}.template-art{position:relative;aspect-ratio:1;background:var(--tone);overflow:hidden}.template-product{position:absolute;left:28%;top:18%;width:44%;height:53%;border-radius:12px 12px 18px 18px;background:linear-gradient(145deg,var(--accent),#fff9);box-shadow:0 12px 14px #1f293733;transform:rotate(-4deg)}.template-art:after{content:'';position:absolute;left:21%;bottom:14%;width:58%;height:12%;border-radius:50%;background:var(--accent);opacity:.35;filter:blur(4px)}.template-copy{position:absolute;left:10%;top:12%;width:22%;height:4px;border-radius:5px;background:var(--accent);box-shadow:0 8px 0 var(--accent);opacity:.8}.template-art i{position:absolute;right:8px;bottom:7px;color:var(--accent);font-size:10px;font-style:normal;font-weight:700}.template-meta{display:flex;flex-direction:column;gap:4px;padding:10px}.template-meta b{font-size:12px;color:#334155}.template-meta small{font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gen-cost{display:inline-block;margin-left:10px;padding:3px 8px;border-radius:999px;background:#ffffff33;font-size:12px;font-weight:600}
@media(max-width:700px){.product-fields{grid-template-columns:1fr}.product-fields input,.product-fields select{height:44px;line-height:44px}.product-result-grid{grid-template-columns:1fr 1fr;gap:8px}.draw-revise-label{display:block}.draw-revise-label small{display:block;margin-top:4px}.draw-revise-row{flex-direction:column}}
@media(max-width:720px){.template-library-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.selected-template-card{padding:8px}.template-mini{width:44px;height:44px}}
.draw-mode{display:flex;gap:8px;margin-bottom:14px}.draw-mode button{border:1px solid #dbe5fb;background:#fff;color:#71809b;border-radius:8px;padding:8px 14px;cursor:pointer}.draw-mode button.picked{border-color:#6e91f5;background:#eef3ff;color:#3158e8}.product-thumb{display:block;width:72px;height:72px;object-fit:cover;border-radius:8px;margin-top:8px;border:1px solid #dbe5fb}
.gen-btn{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#ff6b35,#ff8f5c);border:0;border-radius:12px;color:#fff;font-size:14.5px;font-weight:600;padding:13px;cursor:pointer;box-shadow:0 6px 20px #ff6b3533;transition:.2s}
.gen-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 28px #ff6b354d}
.gen-btn:disabled{opacity:.6;cursor:not-allowed}
.result-panel{background:#fff;border:1px solid #e6eaf0;border-radius:16px;padding:22px;min-height:440px;box-shadow:0 1px 3px #0f172a06}
.result-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f2f6}
.result-top b{color:#111827;font-size:14px}
.result-top span{color:#94a3b8;font-size:12px}
.result-text{white-space:pre-wrap;line-height:1.9;font-size:14px;color:#374151}
.dir-tags{margin-bottom:14px}
.tag-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.dir-tag{background:#f4f6fa;border:1px solid #e3e8f0;border-radius:999px;padding:6px 14px;font-size:12.5px;color:#526078;cursor:pointer;transition:.15s}
.dir-tag:hover{border-color:#ff6b35;color:#ff6b35}
.dir-tag.picked{background:#ff6b35;border-color:#ff6b35;color:#fff}
.upload-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.thumb{width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid #e6eaf0}
.result-tabs{display:flex;gap:6px;margin-left:auto}
.result-tabs button{background:#f4f6fa;border:1px solid #e3e8f0;border-radius:8px;padding:4px 10px;font-size:12px;color:#64748b;cursor:pointer}
.result-tabs button.picked{background:#ff6b35;border-color:#ff6b35;color:#fff}
.result-img{max-width:100%;max-height:280px;border-radius:12px;margin-bottom:14px;border:1px solid #e6eaf0}
.tts-audio{width:100%;margin-top:8px}
.revise-box{display:flex;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid #f0f2f6}
.revise-box input{flex:1;background:#fafbfd;border:1px solid #e2e8f0;border-radius:10px;padding:10px 13px;font-size:13px;color:#1f2937;outline:none}
.revise-box input:focus{border-color:#ff6b3580}
.history-body{display:flex;gap:16px;min-height:380px}
.history-list{width:280px;border-right:1px solid #f0f2f6;padding-right:14px;max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.history-item{border:1px solid #e6eaf0;border-radius:10px;padding:10px 12px;cursor:pointer;transition:.15s}
.history-item:hover{border-color:#ff6b35}
.history-item.picked{border-color:#ff6b35;background:#fff7f3}
.history-item p{margin:6px 0 4px;font-size:12.5px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.history-item small{color:#94a3b8;font-size:11px}
.history-detail{flex:1;min-width:0}
.hd-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.hd-top b{font-size:14px;color:#111827}
.hd-text{white-space:pre-wrap;line-height:1.8;font-size:13px;color:#374151;background:#fafbfd;border:1px solid #eef1f5;border-radius:10px;padding:14px;max-height:340px;overflow-y:auto}
.mat-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px;margin-bottom:14px}
.mat-pick{position:relative;border:2px solid #e2e8f0;border-radius:10px;overflow:hidden;cursor:pointer;transition:.15s}
.mat-pick img{width:100%;height:88px;object-fit:cover;display:block}
.mat-pick:hover{border-color:#a855f7}
.mat-pick.picked{border-color:#a855f7}
.pick-ok{position:absolute;top:4px;right:4px;background:#a855f7;color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px}
.material-card{background:#fff;border:1px solid #e6eaf0;border-radius:14px;overflow:hidden;transition:.2s}
.material-card img{width:100%;height:150px;object-fit:cover;display:block}
.mat-actions{display:flex;gap:8px;padding:10px 12px}
.mat-actions .ghost-btn{flex:1;padding:6px 0;font-size:12px}
.material-card small{display:block;padding:0 12px 12px;color:#94a3b8;font-size:11px}
.ghost-btn.danger{border-color:#fee2e2!important;color:#ef4444!important}
.ghost-btn.danger:hover{background:#fef2f2!important}
.empty span{font-size:14px;font-weight:600;color:#7c8aa0}
.empty small{font-size:12px;color:#b6c0ce}
.empty-icon{width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#fff1eb,#f4f7fc);border:1px solid #f3ddd2;display:grid;place-items:center;color:#ff8f5c;margin-bottom:8px;box-shadow:0 8px 20px #ff6b350d}
.result-empty{border:1.5px dashed #dbe2ea;border-radius:14px;margin:4px;min-height:380px;background:radial-gradient(560px 260px at 50% 0%,#f8fafc,#fbfcfe 65%)}
.chat-box{background:#fff;border:1px solid #e6eaf0;border-radius:16px;display:flex;flex-direction:column;height:calc(100vh - 180px);box-shadow:0 1px 3px #0f172a06}
.chat-msgs{flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:14px}
.msg{display:flex}
.msg.user{justify-content:flex-end}
.bubble{max-width:75%;padding:11px 15px;border-radius:14px;font-size:13.5px;line-height:1.7;white-space:pre-wrap}
.msg.user .bubble{background:linear-gradient(135deg,#ff6b35,#ff8f5c);color:#fff;border-bottom-right-radius:4px}
.msg.ai .bubble{background:#f8fafc;border:1px solid #e2e8f0;color:#374151;border-bottom-left-radius:4px}
.typing{color:#94a3b8}
.chat-input{display:flex;gap:10px;padding:14px;border-top:1px solid #e6eaf0}
.chat-input input{flex:1;background:#fafbfd;border:1px solid #e2e8f0;border-radius:10px;color:#1f2937;padding:11px 14px;font-size:13px;outline:none}
.chat-input .gen-btn{width:auto;margin-top:0;padding:11px 26px}
.size-row{display:flex;gap:8px}
.size-btn{background:#fafbfd;border:1px solid #e2e8f0;border-radius:9px;color:#64748b;padding:8px 12px;font-size:12px;cursor:pointer}
.size-btn.picked{border-color:#ff6b35;color:#ff6b35;background:#ff6b3510;font-weight:600}
.draw-img{max-width:100%;max-height:520px;border-radius:12px;display:block;margin:0 auto;box-shadow:0 10px 40px #0f172a1a}
.works-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.work-card{background:#fff;border:1px solid #e6eaf0;border-radius:12px;padding:16px;cursor:pointer;transition:.2s;box-shadow:0 1px 3px #0f172a06}
.work-card:hover{border-color:#ff6b354d;box-shadow:0 8px 24px #0f172a12}
.work-card .tag{display:inline-block;font-size:11px;color:#ff6b35;background:#ff6b3512;border-radius:6px;padding:3px 8px;margin-bottom:8px;font-weight:600}
.work-card p{color:#374151;font-size:13px;line-height:1.6;margin:0 0 10px}
.work-card small{color:#94a3b8;font-size:11px}
.auth-hero{text-align:center;padding:8px 0 18px}
.auth-hero h2{color:#111827;font-size:18px;margin:14px 0 4px}
.auth-hero p{color:#64748b;font-size:13px;margin:0}
.auth-form{display:flex;flex-direction:column;gap:12px}
.auth-form :deep(.el-input__wrapper){background:#fafbfd;box-shadow:0 0 0 1px #e2e8f0 inset;border-radius:10px}
.auth-form :deep(.el-input__inner){color:#1f2937}
.auth-btn{background:linear-gradient(135deg,#ff6b35,#ff8f5c)!important;border:0!important;border-radius:10px!important;height:44px;box-shadow:0 8px 22px #ff6b3533!important}
.auth-switch{text-align:center;margin-top:10px;font-size:13px;color:#64748b}
.auth-switch button{border:0;background:none;color:#ff6b35;cursor:pointer;font-weight:600}
.code-row{display:flex;gap:10px}
.code-row :deep(.el-input){flex:1}
.code-btn{background:#fff7f4!important;border:1px solid #ff6b354d!important;color:#ff6b35!important;border-radius:10px!important;height:40px;font-weight:600}
.code-btn:hover{border-color:#ff6b35!important}
.account-dialog :deep(.el-dialog){background:#fff;border:1px solid #e6eaf0;border-radius:16px;box-shadow:0 24px 60px #0f172a1f}
.account-dialog :deep(.el-dialog__title){color:#111827;font-weight:700}
.account-dialog :deep(.el-tabs__item){color:#64748b}
.account-dialog :deep(.el-tabs__item.is-active){color:#ff6b35}
.account-summary{display:grid;grid-template-columns:170px 1fr auto;align-items:center;gap:18px;padding:17px 19px;margin-bottom:12px;background:#fafbfd;border:1px solid #e6eaf0;border-radius:10px}
.account-summary>div{display:flex;flex-direction:column;gap:5px}
.account-summary span{font-size:12px;color:#64748b}
.account-summary strong{font-size:28px;color:#ff6b35}
.account-summary b{font-size:14px;color:#374151;font-weight:500}
.payment-types{display:flex;align-items:center;gap:14px;margin:4px 0 16px;color:#64748b;font-size:13px}
.package-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.package-item{background:#fafbfd;border:1px solid #e6eaf0;border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:6px;cursor:pointer;color:#1f2937;transition:.2s}
.package-item:hover{border-color:#ff6b354d;transform:translateY(-2px);box-shadow:0 10px 26px #0f172a12}
.package-item span{font-size:13px;color:#64748b}
.package-item strong{font-size:22px;color:#ff6b35}
.package-item small{font-size:12px;color:#94a3b8}
.package-item em{font-style:normal;font-size:12px;color:#ff6b35;font-weight:600}
.custom-recharge{display:flex;align-items:center;gap:10px;margin-top:16px;padding-top:14px;border-top:1px dashed #e2e8f0}
.custom-recharge>span{font-size:13px;color:#64748b}
.custom-recharge small{color:#94a3b8;font-size:12px}
.flow-plus{color:#10b981}.flow-minus{color:#ef4444}
@media(max-width:900px){.ws-body{grid-template-columns:1fr}}
/* Refined international SaaS visual language */
:global(body){font-family:Inter,"SF Pro Display","Segoe UI","Noto Sans SC",sans-serif;background:#f7f8fb;color:#172033;letter-spacing:0}
.app{background:#f7f8fb}
.topbar{height:68px;padding:0 28px;background:rgba(255,255,255,.94);border-bottom:1px solid #e8ebf2;box-shadow:0 4px 18px #18243b08}
.brand{gap:11px;color:#172033;font-size:18px}.brand-mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#3158e8,#1d3bb8);box-shadow:0 8px 18px #3158e82e}
.balance-pill{border-radius:8px;background:#f2f5ff;border-color:#dfe6ff;color:#53627b}.balance-pill b{color:#3158c7}.user-chip{border-radius:8px}.ghost-btn{border-radius:8px!important}.ghost-btn:hover{border-color:#b9c9f3!important;color:#3158c7!important;background:#f5f7ff!important}
.sidebar{width:238px;background:#111827;border-right:0;padding:18px 12px;color:#fff;box-shadow:none}.nav-group{color:#7785a0;padding:16px 13px 8px}.nav-item{height:40px;border-radius:8px;color:#aeb9cc}.nav-item:hover{background:#1f2b48;color:#fff}.nav-item.active{background:#1f2b48;color:#fff;border-left:0}.nav-item.active svg{color:#7fa2ff}
.main{padding:30px 34px}.hero-title{font-size:32px;background:linear-gradient(90deg,#3158e8,#5d7ff1);-webkit-background-clip:text}.hero-sub{color:#748199}.group-title{color:#172033}.tool-grid{gap:14px}.tool-card{border-radius:10px;padding:19px 18px;border-color:#e1e6ef;box-shadow:0 2px 7px #18243b08}.tool-card:hover{border-color:#9cb5f3;box-shadow:0 12px 28px #18243b12}.tool-card small{color:#8490a5}.tool-card b{font-size:14px}
.workspace{max-width:1240px}.ws-head{margin-bottom:22px}.ws-title b{font-size:19px}.form-panel,.result-panel,.chat-box{border-radius:11px;border-color:#e1e6ef;box-shadow:0 5px 20px #18243b09}.form-panel{background:#fbfcfe}.panel-head{border-bottom-color:#e9edf4}.form-panel label{color:#526078}.form-panel textarea,.model-select,.chat-input input{background:#fff;border-color:#dce4ef;border-radius:8px}.form-panel textarea:focus,.model-select:focus{border-color:#8eaaf0;box-shadow:0 0 0 3px #3158e815}.gen-btn,.auth-btn{background:#3158e8!important;box-shadow:0 7px 16px #3158e82e!important;border-radius:8px!important}.gen-btn:hover:not(:disabled){box-shadow:0 11px 24px #3158e83d}.size-btn.picked{border-color:#7d9ff3;color:#3158e8;background:#edf2ff}.result-empty{background:#fbfcfe;border-color:#dbe3ee}.empty-icon{background:#edf2ff;border-color:#dce6ff;color:#5278de;box-shadow:none}
.auth-dialog :deep(.el-dialog),.account-dialog :deep(.el-dialog){border-radius:12px;border-color:#dfe6f0;box-shadow:0 24px 70px #172b4d2e}.auth-btn{height:42px}.code-btn{background:#f3f6ff!important;border-color:#cbd8f6!important;color:#3158c7!important;border-radius:8px!important}.account-summary{background:#f5f7ff;border-color:#dfe7fa}.account-summary strong,.package-item strong{color:#3158e8}.package-item{border-radius:9px;border-color:#dce4ef;background:#fff}.package-item:hover{border-color:#8eaaf0;box-shadow:0 8px 20px #3158e818}.package-item em{color:#3158e8}.account-dialog :deep(.el-tabs__item.is-active){color:#3158e8}
@media(max-width:700px){.topbar{padding:0 12px}.sidebar{width:64px}.main{padding:20px 12px}.top-search{display:none}.top-right{gap:4px}.sidebar .nav-item span,.sidebar .nav-group{display:none}.sidebar .nav-item{justify-content:center;padding:0}.sidebar .nav-item svg{margin:auto}.layout .sidebar{min-height:calc(100vh - 68px)}}

/* Product-style home and responsive workspaces */
.mobile-menu{display:none;border:0;background:transparent;padding:8px;cursor:pointer}.mobile-menu span{display:block;width:18px;height:2px;background:#25324a;margin:3px 0;border-radius:2px}
.mobile-backdrop{display:none}
.home{max-width:1240px}.home-hero{position:relative;min-height:300px;display:flex;align-items:center;justify-content:space-between;overflow:hidden;padding:42px 54px;margin-bottom:34px;border:1px solid #dfe6f4;border-radius:22px;background:linear-gradient(110deg,#f9fbff 0%,#eef3ff 54%,#f8faff 100%);box-shadow:0 18px 45px #233c7b0d}.home-hero:after{content:"";position:absolute;right:-130px;top:-180px;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,#cbd9ff80 0%,#e9efff00 68%);pointer-events:none}.hero-copy{position:relative;z-index:1;max-width:590px}.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.12em;font-weight:800;color:#5472c6}.hero-title{margin:14px 0 10px;font-size:44px;line-height:1.13;letter-spacing:-.02em;background:none;color:#172033;-webkit-text-fill-color:initial}.hero-title em{font-style:normal;color:#3158e8}.hero-sub{max-width:510px;font-size:15px;line-height:1.8;margin-bottom:22px}.hero-actions{display:flex;gap:10px}.hero-primary,.hero-secondary{display:inline-flex;align-items:center;gap:8px;border-radius:9px;padding:11px 16px;font-size:13px;font-weight:700;cursor:pointer}.hero-primary{border:1px solid #3158e8;background:#3158e8;color:#fff;box-shadow:0 8px 18px #3158e833}.hero-secondary{border:1px solid #d5def4;background:#fff;color:#3158c7}.hero-orbit{position:relative;z-index:1;width:300px;height:230px;flex:none}.orbit-ring{position:absolute;inset:15px 25px;border:1px solid #9eb5f466;border-radius:50%;transform:rotate(-20deg)}.ring-two{inset:34px 3px;transform:rotate(32deg);border-color:#c4d2f266}.orbit-core{position:absolute;left:50%;top:50%;width:76px;height:76px;transform:translate(-50%,-50%);display:grid;place-items:center;border-radius:24px;background:#3158e8;color:#fff;box-shadow:0 16px 36px #3158e84d}.orbit-chip{position:absolute;display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border:1px solid #d8e2f7;border-radius:8px;background:#fff;color:#556783;font-size:11px;box-shadow:0 8px 18px #2b438d12}.chip-one{top:12px;left:30px}.chip-two{right:10px;top:70px}.chip-three{bottom:15px;left:45px}.section-label{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:15px}.section-label h2{margin:5px 0 0;color:#172033;font-size:21px}.section-note{font-size:12px;color:#8a97aa;padding-bottom:3px}.quick-start{margin-bottom:38px}.quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.quick-card{position:relative;display:flex;align-items:center;gap:12px;min-height:86px;padding:15px;border:1px solid #e0e6f1;border-radius:12px;text-align:left;background:#fff;color:#172033;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s}.quick-card:hover{transform:translateY(-2px);border-color:#b7c8ec;box-shadow:0 12px 24px #263b6c12}.quick-card>span:nth-child(2){display:flex;flex-direction:column;gap:4px}.quick-card b{font-size:13px}.quick-card small{font-size:11px;color:#8995a8;line-height:1.35}.quick-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;flex:none}.quick-arrow{margin-left:auto;color:#9ba7b8;transform:rotate(-90deg)}.quick-copy .quick-icon{background:#fff0eb;color:#e7663a}.quick-chat .quick-icon{background:#eafaff;color:#1593b7}.quick-image .quick-icon{background:#fff0f7;color:#da4e94}.quick-video .quick-icon{background:#f1edff;color:#7554d7}.tool-library{padding-bottom:35px}.tool-library .home-group{margin-bottom:26px}.tool-library .group-head{margin-bottom:10px}.tool-library .tool-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.tool-library .tool-card{min-height:122px;padding:16px}.tool-library .tool-icon{width:34px;height:34px;border-radius:9px}.tool-library .tool-icon svg{width:18px}
.workspace-chat .chat-box{border-radius:18px;background:#fff}.workspace-chat .chat-msgs{padding:28px 32px}.workspace-chat .chat-input{padding:18px 22px}.workspace-image .form-panel,.workspace-video .form-panel{background:linear-gradient(150deg,#fff9fc,#fff)}.workspace-image .result-panel{background:linear-gradient(145deg,#fff,#fff7fb)}.workspace-video .result-panel{background:linear-gradient(145deg,#fff,#f7f5ff)}.workspace-tts .result-panel{display:flex;flex-direction:column;justify-content:center}.workspace-works .works-grid,.workspace-materials .works-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}.workspace-template .mat-picker{max-height:210px;overflow:auto}.workspace-koudabo .form-panel{border-top:3px solid #e7663a}.workspace-deepseek .form-panel{border-top:3px solid #4d7cfe}.workspace-xiaohongshu .form-panel{border-top:3px solid #ff4757}.workspace-rewrite .form-panel{border-top:3px solid #8b5cf6}.workspace-title .form-panel{border-top:3px solid #f59e0b}
.workspace-media .form-panel{border-top:3px solid color-mix(in srgb,var(--media-color,#7c5ce7) 80%,#fff)}.media-upload{width:100%;min-height:82px;display:flex;align-items:center;gap:11px;padding:13px;border:1px dashed #cdd8e8;border-radius:9px;background:#fafcff;color:#526078;text-align:left;cursor:pointer}.media-upload:hover{border-color:#8eabec;background:#f5f8ff}.media-upload span{width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:#edf2ff;color:#5278de;flex:none}.media-upload b{font-size:13px}.media-upload small{margin-left:auto;color:#8b98aa;font-size:11px}.media-upload.compact{min-height:58px}.media-result{background:linear-gradient(145deg,#fff,#f8f9ff)}.media-download{display:inline-block;margin-top:14px}.workspace-music .form-panel{border-top-color:#84cc16}.workspace-voice_clone .form-panel{border-top-color:#8b5cf6}.workspace-avatar_clone .form-panel{border-top-color:#f97316}.workspace-face_merge .form-panel{border-top-color:#ec4899}.workspace-photo_dh .form-panel{border-top-color:#06b6d4}
@media(max-width:980px){.home-hero{padding:34px 30px}.hero-orbit{width:230px;transform:scale(.86);transform-origin:right center}.quick-grid{grid-template-columns:repeat(2,1fr)}.ws-body{grid-template-columns:minmax(280px,340px) minmax(0,1fr)}}
@media(max-width:700px){.mobile-menu{display:block;flex:none}.topbar{height:60px}.brand{font-size:15px;gap:7px}.brand-mark{width:30px;height:30px}.top-right .balance-pill,.top-right .ghost-btn{display:none}.layout{position:relative}.mobile-backdrop{display:block;position:fixed;inset:60px 0 0;background:#0b122466;z-index:20}.sidebar{position:fixed;left:0;top:60px;bottom:0;z-index:21;width:260px!important;transform:translateX(-102%);transition:transform .22s ease;min-height:0!important;padding:18px 12px;overflow-y:auto}.sidebar.is-open{transform:translateX(0)}.sidebar .nav-item span,.sidebar .nav-group{display:block}.sidebar .nav-item{justify-content:flex-start;padding:0 12px}.sidebar .nav-item svg{margin:0}.main{width:100%;padding:18px 14px 78px}.home-hero{min-height:0;padding:27px 20px 22px;margin-bottom:25px;border-radius:16px}.hero-title{font-size:32px;margin-top:10px}.hero-sub{font-size:13px;line-height:1.65}.hero-actions{flex-wrap:wrap}.hero-primary,.hero-secondary{padding:10px 13px}.hero-orbit{display:none}.section-label{align-items:flex-start;flex-direction:column;gap:4px;margin-bottom:12px}.section-label h2{font-size:18px}.section-note{padding:0}.quick-grid{grid-template-columns:1fr;gap:9px}.quick-card{min-height:72px;padding:12px}.tool-library .tool-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tool-library .tool-card{min-height:108px;padding:14px 12px}.tool-library .tool-card b{font-size:12px}.tool-library .tool-card small{font-size:10px}.workspace{width:100%}.ws-head{align-items:flex-start;gap:12px;flex-wrap:wrap}.ws-title{min-width:0}.ws-title small{display:none}.ws-actions{width:100%;gap:7px}.ws-actions .ghost-btn{flex:1}.ws-body{display:flex;flex-direction:column;gap:12px}.form-panel,.result-panel{width:100%;padding:16px;border-radius:12px}.form-panel textarea{min-height:150px}.result-panel{min-height:330px}.chat-box{height:calc(100vh - 156px);min-height:460px}.chat-msgs{padding:16px}.chat-input{padding:12px}.chat-input .gen-btn{padding:10px 15px}.media-upload{align-items:flex-start;flex-wrap:wrap}.media-upload small{width:100%;margin-left:45px}.account-summary{grid-template-columns:1fr 1fr}.account-summary>button{grid-column:1/-1}.package-grid{grid-template-columns:1fr}.custom-recharge{align-items:flex-start;flex-wrap:wrap}.home-group{margin-bottom:20px}}
@media(max-width:700px){.skill-route{align-items:flex-start}.skill-route small{margin:2px 0 0;font-size:11px;line-height:1.45}}
</style>
