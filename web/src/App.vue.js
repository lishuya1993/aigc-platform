import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Mic2, Sparkles, FileText, WandSparkles, Hash, Languages, Heart, PenLine, Music, LayoutGrid, PenTool, Megaphone, Copy, ScanSearch, Bot, Palette, Video, Image as ImageIcon, FolderOpen, Clapperboard, Layers, ScanFace, Mic, AudioLines, UserRound, LogOut, Search, Zap, Wallet, ChevronDown, History, ArrowUp, Download, X } from 'lucide-vue-next';
import { secureFetch } from './secure-api';
// ============ 工具定义 ============
const TOOLS = [
    // 智能文案
    { key: 'koudabo', featureCode: 'spoken_copy', group: '文案', title: '口播文案', sub: '短视频口播必备神器', icon: Mic2, color: '#ff6b35', prompt: ([s, e]) => `请为以下主题创作一篇短视频口播文案，要求：口语化、有钩子开头、节奏感强、结尾引导互动。主题：${s}${e.duration ? `\n时长要求：${e.duration}` : ''}${e.platform ? `\n发布平台：${e.platform}` : ''}`, fields: [{ k: 'subject', label: '口播主题', type: 'textarea', ph: '如：一家新开的咖啡店' }, { k: 'duration', label: '口播时长', type: 'select', options: ['30秒', '60秒', '90秒'] }, { k: 'platform', label: '发布平台', type: 'select', options: ['抖音', 'B站', '快手'] }], withImg: true, directions: ['幽默', '正式', '煽情', '干货', '悬念'] },
    { key: 'deepseek', featureCode: 'viral_spoken_copy', group: '文案', title: 'DeepSeek口播', sub: 'DeepSeek 满血版创作', icon: Sparkles, color: '#4d7cfe', model: 'deepseek-v4-pro', prompt: ([s, e]) => `请为以下主题创作一篇爆款口播文案，风格${e.tone || '犀利'}有网感：${s}`, fields: [{ k: 'subject', label: '创作主题', type: 'textarea', ph: '如：职场打工人如何拒绝内耗' }, { k: 'tone', label: '风格', type: 'select', options: ['犀利吐槽', '幽默', '走心', '正式大气'] }], withImg: true, directions: ['犀利吐槽', '幽默', '走心', '正式大气'] },
    { key: 'xiaohongshu', featureCode: 'xiaohongshu_note', group: '文案', title: '小红书笔记', sub: '轻松生成热门笔记', icon: FileText, color: '#ff4757', prompt: ([s, e]) => `请为以下主题写一篇小红书种草笔记：标题要有吸引力，正文 300 字左右，口语化、分段清晰、带 emoji，结尾带话题标签${e.audience ? `，目标人群是${e.audience}` : ''}。主题：${s}`, fields: [{ k: 'subject', label: '笔记主题', type: 'textarea', ph: '如：新手养猫避坑指南' }, { k: 'audience', label: '目标人群', type: 'select', options: ['通用', '学生党', '上班族', '宝妈', '健身党'] }], withImg: true, directions: ['种草', '避坑', '测评', '攻略', '探店'] },
    { key: 'rewrite', group: '文案', title: '文案改写', sub: '智能改写/润色/扩写', icon: WandSparkles, color: '#8b5cf6', prompt: ([s, e]) => `请改写以下文案${e.len ? `，篇幅要求：${e.len}` : ''}，要求：保留原意、表达更生动流畅、风格更高级。原文：${s}`, fields: [{ k: 'subject', label: '原文内容', type: 'textarea', ph: '粘贴需要改写的文案' }, { k: 'len', label: '篇幅', type: 'select', options: ['精简（100字内）', '标准（约300字）', '扩充（800字以上）'] }], withImg: false, directions: ['更简洁', '更生动', '更高级', '更口语化'] },
    { key: 'title', group: '文案', title: '标题生成', sub: '生成爆款标题', icon: Hash, color: '#f59e0b', prompt: ([s, e]) => `请为以下内容生成${e.count || '10个'}爆款标题（适合${e.platform || '通用平台'}），风格包含悬念型、数字型、痛点型、对比型各若干，直接输出编号列表。主题：${s}`, fields: [{ k: 'subject', label: '内容主题', type: 'textarea', ph: '如：AI 工具推荐' }, { k: 'count', label: '数量', type: 'select', options: ['5个', '10个', '20个'] }, { k: 'platform', label: '发布平台', type: 'select', options: ['公众号', '小红书', 'B站', '抖音'] }], withImg: false, directions: ['悬念型', '数字型', '痛点型', '对比型'] },
    { key: 'translate', group: '文案', title: '翻译文案', sub: '中英互译/多语种', icon: Languages, color: '#06b6d4', prompt: ([s, e]) => `请将以下内容翻译成${e.lang || '英语'}，要求${e.tone || '地道自然'}，保持语气风格：${s}`, fields: [{ k: 'subject', label: '待翻译内容', type: 'textarea', ph: '粘贴需要翻译的文本' }, { k: 'lang', label: '目标语言', type: 'select', options: ['英语', '日语', '韩语', '法语', '德语', '西班牙语', '俄语', '中文'] }, { k: 'tone', label: '语气', type: 'select', options: ['地道口语', '正式书面', '商务沟通'] }], withImg: false },
    { key: 'emotion', group: '文案', title: '情感专家', sub: '走心文字，直击人心', icon: Heart, color: '#ec4899', prompt: ([s, e]) => `请围绕以下主题${e.to ? `，写给${e.to}` : ''}，写一段走心的情感文案（形式：${e.len || '段落'}），要有画面感、共鸣感，适合深夜发布：${s}`, fields: [{ k: 'subject', label: '主题/想说的话', type: 'textarea', ph: '如：关于异地恋' }, { k: 'to', label: '写给谁', type: 'select', options: ['爱人', '朋友', '自己', '家人', '前任'] }, { k: 'len', label: '形式', type: 'select', options: ['短句（1-3句）', '段落（100字左右）', '长文（300字左右）'] }], withImg: true, directions: ['深情', '治愈', '伤感', '励志'] },
    { key: 'poem', group: '文案', title: '打油诗生成', sub: '幽默打油诗大师', icon: PenLine, color: '#10b981', prompt: ([s, e]) => `请为以下主题创作一首${e.style || '幽默'}打油诗，押韵、朗朗上口、带点自嘲：${s}`, fields: [{ k: 'subject', label: '诗歌主题', type: 'textarea', ph: '如：减肥' }, { k: 'style', label: '风格', type: 'select', options: ['幽默', '古风', '励志', '打油'] }], withImg: false, directions: ['幽默', '古风', '励志', '打油'] },
    { key: 'lyrics', group: '文案', title: '写歌词', sub: '歌词创作好帮手', icon: Music, color: '#a855f7', prompt: ([s, e]) => `请为以下主题创作一首${e.style || '流行'}风格歌词，包含主歌、副歌结构，押韵自然、有记忆点：${s}`, fields: [{ k: 'subject', label: '歌曲主题', type: 'textarea', ph: '如：毕业季的夏天' }, { k: 'style', label: '曲风', type: 'select', options: ['流行', '民谣', '古风', 'RAP'] }], withImg: false, directions: ['流行', '民谣', '古风', 'RAP'] },
    { key: 'general', group: '文案', title: '通用文案', sub: '万能写作助手', icon: LayoutGrid, color: '#3b82f6', prompt: ([s]) => `请帮我完成以下写作任务：${s}`, fields: [{ k: 'subject', label: '写作任务', type: 'textarea', ph: '描述你想写的内容，如：帮我写一段店铺开业祝福语' }], withImg: false, directions: ['简洁', '详细', '正式', '口语'] },
    { key: 'writing', group: '文案', title: '智能写作', sub: '长文/短文随心写', icon: PenTool, color: '#6366f1', prompt: ([s, e]) => `请围绕以下主题创作一篇${e.genre || '结构完整、内容充实'}的文章（篇幅${e.len || '约500字'}）：${s}`, fields: [{ k: 'subject', label: '写作主题', type: 'textarea', ph: '如：如何坚持早起' }, { k: 'len', label: '篇幅', type: 'select', options: ['约500字', '约1000字', '约2000字'] }, { k: 'genre', label: '文体', type: 'select', options: ['议论文', '故事', '干货指南', '书信'] }], withImg: false, directions: ['议论文', '故事', '干货指南', '书信'] },
    { key: 'marketing', group: '文案', title: '营销文案', sub: '卖点提炼+转化文案', icon: Megaphone, color: '#ef4444', prompt: ([s, e]) => `请为以下产品/服务写一段${e.type || '营销'}文案（面向${e.audience || '目标人群'}）：突出卖点、激发购买欲、带行动号召。内容：${s}`, fields: [{ k: 'subject', label: '产品/服务', type: 'textarea', ph: '如：手工精油皂，主打天然成分' }, { k: 'audience', label: '目标人群', type: 'select', options: ['通用', '年轻女性', '宝妈', '商务人士', '健身人群'] }, { k: 'type', label: '文案类型', type: 'select', options: ['朋友圈', '商品详情页', '短视频脚本', '广告语'] }], withImg: true, directions: ['卖点突出', '限时促销', '情感共鸣', '专业背书'] },
    { key: 'imitate', group: '文案', title: '文案仿写', sub: '按风格仿写爆款', icon: Copy, color: '#14b8a6', prompt: ([s, e]) => `请分析以下文案的风格特点，并模仿该风格仿写一篇同主题新文案（用于${e.use || '类似场景'}）：${s}`, fields: [{ k: 'subject', label: '参考文案', type: 'textarea', ph: '粘贴想要模仿风格的文案' }, { k: 'use', label: '发布场景', type: 'select', options: ['朋友圈', '小红书', '抖音脚本', '公众号'] }], withImg: false, directions: ['保持风格', '更夸张', '更克制', '更年轻'] },
    { key: 'extract', group: '文案', title: '文案提取', sub: '视频/长文提炼要点', icon: ScanSearch, color: '#64748b', prompt: ([s]) => `请提取并整理以下内容中的完整文案/核心要点，去除口语杂质、保留干货：${s}`, fields: [{ k: 'subject', label: '待提取内容', type: 'textarea', ph: '粘贴视频文案/长文/采访稿' }], withImg: false, featureCode: 'extract' },
    // AIGC 工具集
    { key: 'chat', group: 'AIGC', title: 'AI对话', sub: '智能助手随时聊', icon: Bot, color: '#22d3ee' },
    { key: 'image', group: 'AIGC', title: 'AI绘画', sub: '文生图/图生图', icon: Palette, color: '#f472b6', needCap: 'draw' },
    { key: 'gpt_image', group: 'AIGC', title: 'GPT 图片生成', sub: '提示词生图/选图修改/模型切换', icon: Sparkles, color: '#10b981', needCap: 'draw' },
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
];
const GROUPS = ['文案', 'AIGC', '数字人', '剪辑'];
// ============ 状态 ============
const query = ref('');
const selected = ref({ key: 'home', title: '首页' });
const mobileNavOpen = ref(false);
const subject = ref('');
const output = ref('');
const generating = ref(false);
// 额外字段（差异化表单）
const extra = ref({});
// 方向模板 + 结果历史(最近3次) + 修改 + 配图
const direction = ref('');
const results = ref([]);
const activeResult = ref(0);
const reviseInput = ref('');
const revising = ref(false);
const imgUrl = ref('');
// 素材
const materials = ref([]);
// 历史记录弹窗
const historyOpen = ref(false);
const historyDetail = ref('');
const selectedModel = ref('');
const models = ref([]);
const videoModels = ref([]);
const drawModels = ref([]);
const mediaModels = ref([]);
const featureConfigs = ref({});
const userPermissions = ref(new Set());
const balance = ref(null);
const userName = ref(localStorage.getItem('ll_user_name') || '');
const userToken = ref(localStorage.getItem('ll_user_token') || '');
const loginOpen = ref(false);
const loginMode = ref('login');
const authUsername = ref('');
const authPassword = ref('');
const authEmail = ref('');
const authLoading = ref(false);
const emailCode = ref('');
const codeSending = ref(false);
const codeCountdown = ref(0);
let codeTimer = null;
let sessionTimer = null;
let sessionExpired = false;
// 对话
const chatMessages = ref([]);
const chatInput = ref('');
const chatting = ref(false);
// 绘画
const drawPrompt = ref('');
const drawSize = ref('1024x1024');
const drawModel = ref('');
const drawUrl = ref('');
const drawUsedModel = ref('');
const drawPreviewOpen = ref(false);
const gptImageInput = ref('');
const drawHistory = ref([]);
const productResults = ref([]);
const drawMode = ref('text');
const productImageUrl = ref('');
const productImageUrls = ref([]);
const productName = ref('');
const productSellingPoints = ref('');
const productAudience = ref('');
const productScene = ref('日常使用场景');
const productStyle = ref('实拍干净');
const productComposition = ref('沿用主图');
const productCamera = ref('正面');
const productLighting = ref('柔光顺光');
const productBackground = ref('干净背景');
const productCopy = ref('不显示');
const productCount = ref(4);
const productUploading = ref(false);
const PRODUCT_TEMPLATES = [
    { id: 'clean', name: '白底商品居中', type: '日常主图', category: '全部', ratio: '1:1', tone: '#f8fafc', accent: '#b8c7dc', style: '实拍干净', scene: '纯白摄影棚', prompt: '纯白干净背景，商品居中占画面约70%，自然接触阴影，边缘清晰，电商平台标准主图，不添加文字和无关道具' },
    { id: 'sale', name: '爆款促销留白', type: '活动主图', category: '全部', ratio: '1:1', tone: '#fff1e8', accent: '#ff5a36', style: '极简现代', scene: '促销陈列台', prompt: '高转化促销视觉，商品位于右侧，左侧保留完整卖点和价格文案区域，橙红色几何展台，画面热烈但整洁，不生成乱码文字' },
    { id: 'lifestyle', name: '家居生活场景', type: '日常主图', category: '家居百货', ratio: '3:4', tone: '#eef5ed', accent: '#6d8f6a', style: '暖光生活', scene: '自然居家场景', prompt: '真实居家使用场景，保留商品外观和材质，环境简洁有生活气息，自然窗光，浅景深，高级生活方式摄影' },
    { id: 'luxury', name: '黑金礼盒质感', type: '活动主图', category: '珠宝首饰', ratio: '1:1', tone: '#20242b', accent: '#d8b56a', style: '高级黑', scene: '黑色摄影棚', prompt: '深色高级摄影棚，黑金配色，商品置于哑光展台，轮廓光突出材质和边缘，奢华克制，无多余道具' },
    { id: 'nature', name: '清新自然成分', type: '日常主图', category: '食品', ratio: '2:3', tone: '#edf8e8', accent: '#65a85c', style: '实拍干净', scene: '自然植物场景', prompt: '明亮清新的自然背景，少量绿叶和原料作为陪衬，商品主体清晰，阳光斑驳，健康天然视觉，保持画面干净' },
    { id: 'beauty', name: '美妆柔光水台', type: '日常主图', category: '美容美妆', ratio: '3:4', tone: '#fff0f5', accent: '#e98bad', style: '极简现代', scene: '柔粉水面展台', prompt: '柔粉色水面和半透明亚克力展台，柔和漫射光，细腻反射，高端美妆广告摄影，商品居中，背景简洁' },
    { id: 'tech', name: '数码科技蓝光', type: '日常主图', category: '数码家电', ratio: '1:1', tone: '#e8f2ff', accent: '#3678ef', style: '极简现代', scene: '科技摄影棚', prompt: '蓝白科技感摄影棚，简洁悬浮展台，冷色轮廓光和细微光带，突出产品结构和功能，画面锐利现代' },
    { id: 'food', name: '食品暖调餐桌', type: '外卖平台主图', category: '食品', ratio: '3:4', tone: '#fff0dc', accent: '#c86a2d', style: '暖光生活', scene: '温暖餐桌', prompt: '温暖自然的餐桌场景，食欲感暖光，真实食材作为少量陪衬，主体包装和产品清晰，商业食品摄影' },
    { id: 'fashion', name: '服饰轻奢陈列', type: '日常主图', category: '服饰箱包', ratio: '3:4', tone: '#f3efff', accent: '#8b6ec7', style: '极简现代', scene: '轻奢服饰展台', prompt: '轻奢服饰陈列，柔和中性色背景，商品完整展示，材质纹理清楚，杂志级电商摄影，构图高级克制' },
    { id: 'fresh', name: '生鲜冰感主图', type: '活动主图', category: '生鲜', ratio: '1:1', tone: '#e9f8ff', accent: '#35a9d6', style: '实拍干净', scene: '清凉冰台', prompt: '清凉冰感背景，水珠和碎冰少量点缀，商品鲜活清晰，高亮通透，适合生鲜促销，主体突出' },
    { id: 'baby', name: '母婴柔和彩云', type: '日常主图', category: '母婴亲子', ratio: '1:1', tone: '#fff5dc', accent: '#efb85d', style: '暖光生活', scene: '柔和儿童房', prompt: '温柔明亮的母婴视觉，奶油色和浅蓝色，圆润安全感构图，柔光，无尖锐复杂道具，商品居中' },
    { id: 'global', name: '跨境极简英文版', type: '跨境电商主图', category: '跨境出口', ratio: '1:1', tone: '#eef2f7', accent: '#273b5a', style: '实拍干净', scene: '国际电商摄影棚', prompt: '国际电商极简风，商品清晰居中，留出英文卖点排版空间，蓝灰中性色，干净专业，不生成乱码文字' },
    { id: 'global-feature', name: '跨境功能卖点图', type: '跨境电商主图', category: '跨境出口', ratio: '3:4', tone: '#eef6ff', accent: '#2563eb', style: '极简现代', scene: '海外电商功能展示', prompt: '海外电商功能卖点主图，商品完整清晰，周围留出三处英文功能标注空间，蓝白科技配色，构图专业可信，不生成任何文字或乱码' },
    { id: 'badge-new', name: '新品上市角标', type: '主图图标', category: '全部', ratio: '1:1', tone: '#fff4ef', accent: '#f0523c', style: '极简现代', scene: '新品角标陈列', prompt: '标准电商白底商品主图，右上角预留醒目的新品角标区域，商品主体占画面约70%，橙红点缀，画面清楚整洁，不生成文字' },
    { id: 'badge-quality', name: '品质认证角标', type: '主图图标', category: '全部', ratio: '1:1', tone: '#f3f7ff', accent: '#3158e8', style: '实拍干净', scene: '品质认证展示', prompt: '高品质电商主图，商品居中，左下角预留品质认证图标区域，蓝白配色，细节锐利，可信专业，不生成文字或徽标' },
    { id: 'takeaway-drink', name: '饮品清凉爆款', type: '外卖平台主图', category: '休闲饮品', ratio: '3:4', tone: '#eafcff', accent: '#19a7b8', style: '实拍干净', scene: '清凉饮品桌面', prompt: '外卖平台饮品主图，杯装饮品清晰居中，冰块和水珠少量点缀，明亮清爽，高食欲感，留出促销信息区域，不生成文字' },
    { id: 'takeaway-meal', name: '热卖套餐俯拍', type: '外卖平台主图', category: '食品', ratio: '1:1', tone: '#fff3e8', accent: '#e56b2f', style: '暖光生活', scene: '餐品俯拍桌面', prompt: '外卖平台餐品套餐主图，俯拍构图，餐品摆放丰富整齐，暖色食欲光线，主体清晰，适合缩略图浏览，不生成文字' }
];
const productTemplateOpen = ref(false);
const productTemplateType = ref('商品主图');
const productTemplateCategory = ref('全部');
const productTemplateRatio = ref('全部');
const selectedProductTemplateId = ref('clean');
const selectedProductTemplate = computed(() => PRODUCT_TEMPLATES.find(x => x.id === selectedProductTemplateId.value) || PRODUCT_TEMPLATES[0]);
const filteredProductTemplates = computed(() => PRODUCT_TEMPLATES.filter(x => (['商品主图', '全部模板'].includes(productTemplateType.value) || x.type === productTemplateType.value) &&
    (productTemplateCategory.value === '全部' || x.category === productTemplateCategory.value) &&
    (productTemplateRatio.value === '全部' || x.ratio === productTemplateRatio.value)));
const drawRevisePrompt = ref('');
const revisingDraw = ref(false);
const drawing = ref(false);
// 配音
const ttsText = ref('');
const ttsVoice = ref('zh-CN-XiaoxiaoNeural');
const ttsUrl = ref('');
const ttsGenerating = ref(false);
// 模板剪辑
const composeText = ref('');
const composeVoice = ref('zh-CN-XiaoxiaoNeural');
const composeImgs = ref([]);
const composeUrl = ref('');
const composing = ref(false);
const TTS_VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女·甜美）' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊（女·温柔）' },
    { id: 'zh-CN-YunxiNeural', name: '云希（男·阳光）' },
    { id: 'zh-CN-YunjianNeural', name: '云健（男·浑厚）' },
    { id: 'zh-CN-YunyangNeural', name: '云扬（男·新闻）' },
    { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北（东北女声）' },
    { id: 'zh-CN-shaanxi-XiaoniNeural', name: '晓妮（陕西女声）' },
];
// 视频
const videoPrompt = ref('');
const videoModel = ref('');
const videoImageUrl = ref('');
const videoImageUrl2 = ref('');
const videoUrl = ref('');
const videoGenerating = ref(false);
function openVideoPicker(id) { document.getElementById(id)?.click(); }
async function uploadVideoImage(ev, target = 1) {
    const file = ev.target.files && ev.target.files[0];
    if (!file)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        ElMessage.warning('文件不能超过 20MB');
        return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
        const r = await apiFetch('/resource/oss/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '上传失败');
        if (target === 1)
            videoImageUrl.value = d.data.url;
        else
            videoImageUrl2.value = d.data.url;
        ElMessage.success('图片上传成功');
    }
    catch (e) {
        ElMessage.error(e.message || '图片上传失败');
    }
    finally {
        ev.target.value = '';
    }
}
// 音乐与数字人媒体任务
const mediaPrompt = ref('');
const mediaModel = ref('');
const mediaInputUrl = ref('');
const mediaInputUrl2 = ref('');
const mediaResultUrl = ref('');
const mediaGenerating = ref(false);
const currentMediaModels = computed(() => mediaModels.value.filter((m) => m.capability === selected.value.needCap));
function openMediaPicker(id) { document.getElementById(id)?.click(); }
async function uploadMediaFile(ev, target = 1) {
    const file = ev.target.files && ev.target.files[0];
    if (!file)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        ElMessage.warning('文件不能超过 20MB');
        return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
        const r = await apiFetch('/resource/oss/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '上传失败');
        if (target === 1)
            mediaInputUrl.value = d.data.url;
        else
            mediaInputUrl2.value = d.data.url;
        ElMessage.success('素材上传成功');
    }
    catch (e) {
        ElMessage.error(e.message || '素材上传失败');
    }
    finally {
        ev.target.value = '';
    }
}
async function doMedia() {
    if (mediaGenerating.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!mediaPrompt.value.trim()) {
        ElMessage.warning('请输入生成描述或台词');
        return;
    }
    if (selected.value.key !== 'music' && !mediaInputUrl.value) {
        ElMessage.warning('请先上传参考素材');
        return;
    }
    if (selected.value.key === 'face_merge' && !mediaInputUrl2.value) {
        ElMessage.warning('请上传第二张人脸照片');
        return;
    }
    if (!currentMediaModels.value.length) {
        ElMessage.warning('后台尚未配置该功能的可用模型');
        return;
    }
    mediaGenerating.value = true;
    mediaResultUrl.value = '';
    try {
        const r = await apiFetch('/aigc/media/generate', { method: 'POST', body: JSON.stringify({ featureCode: selected.value.key, prompt: mediaPrompt.value, inputUrl: mediaInputUrl.value || undefined, inputUrl2: mediaInputUrl2.value || undefined }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '任务提交失败');
        balance.value = Number(d.data.balance);
        if (d.data.status === 'SUCCESS') {
            mediaResultUrl.value = d.data.url;
            mediaGenerating.value = false;
            loadWorks();
            ElMessage.success(`生成完成，扣费 ${d.data.creditsCost}`);
            return;
        }
        ElMessage.success(`任务已提交，扣费 ${d.data.creditsCost}`);
        pollMedia(d.data.taskNo);
    }
    catch (e) {
        mediaGenerating.value = false;
        ElMessage.error(e.message || '媒体生成失败');
    }
}
async function pollMedia(taskNo) {
    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
            const r = await apiFetch(`/aigc/media/tasks/${taskNo}`);
            const d = await r.json();
            if (d.code !== 200)
                continue;
            if (d.data.status === 'SUCCESS') {
                mediaResultUrl.value = d.data.url;
                balance.value = Number(d.data.balance);
                mediaGenerating.value = false;
                loadWorks();
                ElMessage.success('媒体生成完成');
                return;
            }
            if (d.data.status === 'FAILED') {
                balance.value = Number(d.data.balance);
                mediaGenerating.value = false;
                ElMessage.error(d.data.error || '生成失败，扣费已退回');
                return;
            }
        }
        catch { }
    }
    mediaGenerating.value = false;
    ElMessage.warning('任务仍在处理中，可稍后到我的作品查看');
}
// 账户
const accountOpen = ref(false);
const accountTab = ref('recharge');
const paymentType = ref('alipay');
const rechargeLoading = ref(null);
const customAmount = ref(50);
const customRechargeLoading = ref(false);
const customRate = ref(10);
const packages = ref([]);
const orders = ref([]);
const creditFlows = ref([]);
const works = ref([]);
function clearSession(showLogin = true) {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }
    userToken.value = '';
    userName.value = '';
    balance.value = null;
    userPermissions.value = new Set();
    localStorage.removeItem('ll_user_token');
    localStorage.removeItem('ll_user_name');
    localStorage.removeItem('ll_user_expires_at');
    accountOpen.value = false;
    historyOpen.value = false;
    if (showLogin) {
        loginMode.value = 'login';
        loginOpen.value = true;
    }
}
function expireSession() {
    if (sessionExpired || !userToken.value)
        return;
    sessionExpired = true;
    clearSession(true);
    ElMessage.closeAll();
    ElMessage.error('登录已过期，请重新登录');
}
function scheduleSessionExpiry(expiresAt) {
    if (sessionTimer)
        clearTimeout(sessionTimer);
    localStorage.setItem('ll_user_expires_at', String(expiresAt));
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
        expireSession();
        return;
    }
    sessionTimer = setTimeout(expireSession, Math.min(remaining, 2_147_000_000));
}
async function apiFetch(input, init = {}) {
    const isFormData = init.body instanceof FormData;
    const response = await secureFetch(input, {
        ...init,
        headers: {
            ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
            clientid: 'aigc-web',
            ...(userToken.value ? { Authorization: `Bearer ${userToken.value}` } : {}),
            ...(init.headers || {})
        }
    });
    if (userToken.value) {
        let payload = null;
        try {
            payload = await response.clone().json();
        }
        catch { }
        const message = String(payload?.msg || payload?.message || '');
        const unauthorized = response.status === 401 || payload?.code === 401;
        const expiredMessage = /(?:登录|认证|token).*(?:过期|失效)|(?:过期|失效).*(?:登录|认证|token)/i.test(message);
        if (unauthorized || expiredMessage)
            expireSession();
    }
    return response;
}
function toolPermission(tool) {
    const fixed = {
        chat: 'aigc:copywriting:run',
        tts: 'aigc:tts:run',
        works: 'aigc:works:view',
        materials: 'aigc:materials:view',
        template_edit: 'aigc:templateEdit:run'
    };
    if (fixed[tool.key])
        return fixed[tool.key];
    const code = tool.featureCode || tool.key;
    return String(featureConfigs.value[code]?.menu_permission || '');
}
const availableTools = computed(() => TOOLS.filter((tool) => {
    if (userToken.value) {
        const permission = toolPermission(tool);
        return !permission || userPermissions.value.has(permission);
    }
    if (tool.key === 'product_main')
        return true;
    if (['works', 'materials', 'template_edit'].includes(tool.key) || tool.key === 'tts')
        return true;
    const code = tool.featureCode || (tool.key === 'chat' ? 'copywriting' : tool.key);
    const config = featureConfigs.value[code];
    if (!config || String(config.enabled) !== '1')
        return false;
    if (tool.needCap === 'draw')
        return drawModels.value.length > 0;
    if (tool.needCap === 'video')
        return videoModels.value.length > 0;
    if (tool.needCap)
        return mediaModels.value.some((model) => model.capability === tool.needCap);
    return models.value.length > 0;
}));
const filteredTools = computed(() => availableTools.value.filter((t) => !query.value || `${t.title}${t.sub}`.includes(query.value)));
function onGlow(e) {
    const el = document.querySelector('.app');
    if (el) {
        el.style.setProperty('--x', e.clientX + 'px');
        el.style.setProperty('--y', e.clientY + 'px');
    }
}
function goHome() { selected.value = { key: 'home', title: '首页' }; }
function toolFor(key) {
    return availableTools.value.find((tool) => tool.key === key) || availableTools.value.find((tool) => tool.group === '文案') || TOOLS[0];
}
function copyOutput() {
    if (!output.value) {
        ElMessage.info('暂无内容可复制');
        return;
    }
    navigator.clipboard.writeText(output.value).then(() => ElMessage.success('已复制到剪贴板')).catch(() => ElMessage.info('复制失败，请手动选择复制'));
}
function skillCode(tool = selected.value) { return tool.featureCode || (['image', 'gpt_image'].includes(tool.key) ? tool.key : tool.key === 'video' ? 'video' : tool.key === 'extract' ? 'extract' : tool.key === 'chat' ? 'copywriting' : tool.key); }
const selectedCost = computed(() => Number(featureConfigs.value[skillCode()]?.credits_per_call || 1));
const selModelList = computed(() => {
    const cap = selected.value.needCap;
    let list = cap === 'draw' ? drawModels.value : cap === 'video' ? videoModels.value : models.value;
    const bind = selected.value.model;
    if (bind && String(bind).startsWith('deepseek'))
        list = list.filter((x) => String(x.model_code).startsWith('deepseek-'));
    if (cap !== 'draw' && cap !== 'video')
        list = list.filter((x) => !String(x.model_code).toLowerCase().includes('vl'));
    return list.length ? list : models.value;
});
// ============ 加载 ============
async function loadAccount() {
    if (!userToken.value)
        return;
    try {
        const r = await apiFetch('/aigc/account');
        const d = await r.json();
        if (d.code === 200)
            balance.value = Number(d.data?.balance || 0);
    }
    catch { }
}
async function loadPermissions() {
    if (!userToken.value) {
        userPermissions.value = new Set();
        return;
    }
    try {
        const r = await apiFetch('/aigc/permissions');
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '权限读取失败');
        userPermissions.value = new Set((d.data || []).map((item) => String(item)));
        if (selected.value.key !== 'home' && !availableTools.value.some((tool) => tool.key === selected.value.key))
            goHome();
    }
    catch (e) {
        userPermissions.value = new Set();
        ElMessage.error(e.message || '用户端权限读取失败');
    }
}
async function loadMeta() {
    try {
        const [chatR, drawR, videoR, mediaR, featR, packR] = await Promise.all([
            apiFetch('/aigc/models?capability=chat'), apiFetch('/aigc/models?capability=draw'),
            apiFetch('/aigc/models?capability=video'), apiFetch('/aigc/models'), apiFetch('/aigc/features'), apiFetch('/aigc/packages')
        ]);
        const chat = await chatR.json(), draw = await drawR.json(), video = await videoR.json();
        const media = await mediaR.json(), feat = await featR.json(), pack = await packR.json();
        if (chat.code === 200)
            models.value = chat.data || [];
        if (draw.code === 200)
            drawModels.value = draw.data || [];
        if (video.code === 200)
            videoModels.value = video.data || [];
        if (media.code === 200)
            mediaModels.value = media.data || [];
        if (pack.code === 200)
            packages.value = pack.data || [];
        if (feat.code === 200)
            featureConfigs.value = Object.fromEntries((feat.data || []).map((x) => [x.feature_code, x]));
        selectedModel.value = models.value[0]?.model_code || '';
        if (!drawModel.value || !drawModels.value.some((model) => model.model_code === drawModel.value))
            drawModel.value = drawModels.value[0]?.model_code || '';
    }
    catch { }
}
async function loadWorks() {
    if (!userToken.value)
        return;
    try {
        const r = await apiFetch('/aigc/tasks');
        const d = await r.json();
        if (d.code === 200)
            works.value = (d.data || []).slice(0, 50);
    }
    catch { }
}
async function loadMaterials() {
    if (!userToken.value)
        return;
    try {
        const r = await apiFetch('/aigc/materials');
        const d = await r.json();
        if (d.code === 200)
            materials.value = d.data || [];
    }
    catch { }
}
async function saveMaterial(url, name = '') {
    try {
        await apiFetch('/aigc/material', { method: 'POST', body: JSON.stringify({ url, name }) });
    }
    catch { }
}
async function delMaterial(id) {
    try {
        const r = await apiFetch(`/aigc/material/${id}`, { method: 'DELETE' });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '删除失败');
        materials.value = materials.value.filter((m) => m.id !== id);
        ElMessage.success('已删除');
    }
    catch (e) {
        ElMessage.error(e.message || '删除失败');
    }
}
function useMaterial(url) { imgUrl.value = url; ElMessage.success('已设为当前配图'); }
function featureLabel(code) { return { video: '视频', image: '绘图', tts: '配音', template_edit: '模板成片', music: '音乐', voice_clone: '声音克隆', avatar_clone: '形象克隆', face_merge: '人脸融合', photo_dh: '照片数字人' }[code] || '文案'; }
async function openHistory() {
    if (!userToken.value) {
        openLogin();
        return;
    }
    await loadWorks();
    historyDetail.value = '';
    historyOpen.value = true;
}
function viewHistory(w) { historyDetail.value = w.result_body || w.error_message || '(无内容)'; }
function copyHistory() {
    if (!historyDetail.value)
        return;
    navigator.clipboard.writeText(historyDetail.value).then(() => ElMessage.success('已复制')).catch(() => ElMessage.info('复制失败，请手动选择复制'));
}
function continueFromHistory() {
    const w = works.value.find((x) => (x.result_body || '') === historyDetail.value);
    if (!w) {
        ElMessage.warning('找不到对应记录');
        return;
    }
    results.value.unshift({ text: w.result_body });
    results.value = results.value.slice(0, 3);
    activeResult.value = 0;
    output.value = w.result_body;
    historyOpen.value = false;
    ElMessage.success('已载入，可直接输入修改要求继续优化');
}
onMounted(async () => {
    const expiresAt = Number(localStorage.getItem('ll_user_expires_at') || 0);
    if (userToken.value && expiresAt)
        scheduleSessionExpiry(expiresAt);
    await loadMeta();
    await loadPermissions();
    await loadAccount();
    await loadWorks();
});
onUnmounted(() => {
    if (sessionTimer)
        clearTimeout(sessionTimer);
    if (codeTimer)
        clearInterval(codeTimer);
});
// ============ 登录/注册（邮箱验证码仅注册用） ============
async function sendEmailCode() {
    const email = authEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        ElMessage.warning('请输入有效邮箱');
        return;
    }
    if (codeSending.value || codeCountdown.value > 0)
        return;
    codeSending.value = true;
    try {
        const r = await secureFetch(`/resource/email/code?email=${encodeURIComponent(email)}`, { headers: { clientid: 'aigc-web' } });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '发送失败');
        ElMessage.success('验证码已发送，请查收邮箱');
        codeCountdown.value = 60;
        clearInterval(codeTimer);
        codeTimer = setInterval(() => { codeCountdown.value--; if (codeCountdown.value <= 0)
            clearInterval(codeTimer); }, 1000);
    }
    catch (e) {
        ElMessage.error(e.message || '验证码发送失败');
    }
    finally {
        codeSending.value = false;
    }
}
async function doAuth() {
    if (loginMode.value === 'register' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.value)) {
        ElMessage.warning('请输入有效邮箱');
        return;
    }
    if (loginMode.value === 'login' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authUsername.value)) {
        ElMessage.warning('用户端仅支持邮箱登录');
        return;
    }
    if (!authPassword.value) {
        ElMessage.warning('请输入密码');
        return;
    }
    if (loginMode.value === 'register' && !emailCode.value.trim()) {
        ElMessage.warning('请输入邮箱验证码');
        return;
    }
    authLoading.value = true;
    try {
        const url = loginMode.value === 'login' ? '/auth/login' : '/auth/register';
        const body = { username: loginMode.value === 'register' ? authEmail.value : authUsername.value, password: authPassword.value, clientId: 'aigc-web', grantType: 'password', userType: 'app_user', ...(loginMode.value === 'register' ? { email: authEmail.value, code: emailCode.value.trim() } : {}) };
        const r = await secureFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', clientid: 'aigc-web' }, body: JSON.stringify(body) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '操作失败');
        if (loginMode.value === 'register') {
            ElMessage.success('注册成功，请登录');
            loginMode.value = 'login';
            return;
        }
        sessionExpired = false;
        userToken.value = d.data.access_token;
        userName.value = body.username;
        localStorage.setItem('ll_user_token', d.data.access_token);
        localStorage.setItem('ll_user_name', body.username);
        if (Number(d.data.expire_in) > 0)
            scheduleSessionExpiry(Date.now() + Number(d.data.expire_in) * 1000);
        loginOpen.value = false;
        ElMessage.success('登录成功');
        await loadPermissions();
        await loadAccount();
        await loadWorks();
    }
    catch (e) {
        ElMessage.error(e.message || '操作失败');
    }
    finally {
        authLoading.value = false;
    }
}
function openLogin() { loginOpen.value = true; emailCode.value = ''; }
function logout() { sessionExpired = false; clearSession(false); loginOpen.value = false; ElMessage.success('已退出登录'); }
// ============ 文案生成 ============
function pickTool(t) {
    selected.value = t;
    mobileNavOpen.value = false;
    subject.value = '';
    output.value = '';
    direction.value = '';
    results.value = [];
    activeResult.value = 0;
    reviseInput.value = '';
    imgUrl.value = '';
    extra.value = {};
    if (t.key === 'product_main')
        drawMode.value = 'product';
    mediaPrompt.value = '';
    mediaInputUrl.value = '';
    mediaInputUrl2.value = '';
    mediaResultUrl.value = '';
    if (t.key === 'chat')
        chatMessages.value = [];
    if (t.key === 'materials' || t.key === 'template_edit')
        loadMaterials();
    const featureCode = t.featureCode || (['image', 'gpt_image'].includes(t.key) ? t.key : t.key === 'video' ? 'video' : t.key === 'extract' ? 'extract' : 'copywriting');
    const configured = featureConfigs.value[featureCode]?.gateway_model_id;
    const pool = t.needCap === 'draw' ? drawModels.value : t.needCap === 'video' ? videoModels.value : ['music', 'audio', 'digital_human', 'face_merge'].includes(t.needCap) ? mediaModels.value.filter((x) => x.capability === t.needCap) : models.value;
    const bound = configured ? pool.find((x) => String(x.id) === String(configured)) : null;
    if (t.needCap === 'draw')
        drawModel.value = (bound || pool.find((model) => model.model_code === drawModel.value) || pool[0])?.model_code || '';
    else if (t.needCap === 'video' && bound)
        videoModel.value = bound.model_code;
    else if (['music', 'audio', 'digital_human', 'face_merge'].includes(t.needCap))
        mediaModel.value = (bound || pool[0])?.model_code || '';
    else if (t.model && models.value.length) {
        const mm = models.value.find((x) => x.model_code === t.model);
        if (mm)
            selectedModel.value = t.model;
    }
    else {
        const first = selModelList.value.find((x) => configured && String(x.id) === String(configured)) || selModelList.value[0];
        if (first && !t.needCap)
            selectedModel.value = first.model_code;
    }
}
async function generate() {
    if (generating.value)
        return;
    if (!userToken.value) {
        openLogin();
        ElMessage.info('请先登录');
        return;
    }
    if (!subject.value.trim()) {
        ElMessage.warning('请输入创作主题');
        return;
    }
    const tool = selected.value;
    let prompt = tool.prompt ? tool.prompt(subject.value.trim(), extra.value) : subject.value.trim();
    if (direction.value)
        prompt += `\n\n[写作方向要求：${direction.value}]`;
    if (imgUrl.value) {
        try {
            const vr = await apiFetch('/aigc/vision/describe', { method: 'POST', body: JSON.stringify({ imageUrl: imgUrl.value }) });
            const vd = await vr.json();
            if (vd.code === 200)
                prompt += `\n\n【配图内容】${vd.data.description}\n请结合这张配图的内容撰写文案，让文案与图片匹配（图片会作为配图发布）。`;
            else
                prompt += `\n\n（本作品配图：${imgUrl.value}）`;
        }
        catch {
            prompt += `\n\n（本作品配图：${imgUrl.value}）`;
        }
    }
    if (balance.value !== null && balance.value < selectedCost.value) {
        ElMessage.warning(`余额不足，本次需扣费 ${selectedCost.value}`);
        return;
    }
    generating.value = true;
    output.value = '';
    try {
        const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt, subject: subject.value.trim(), featureCode: tool.featureCode || tool.key || 'copywriting' }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '生成失败');
        results.value.unshift({ text: d.data.content, img: imgUrl.value || undefined });
        results.value = results.value.slice(0, 3);
        activeResult.value = 0;
        output.value = results.value[0].text;
        balance.value = Number(d.data.balance);
        ElMessage.success(`生成完成，扣费 ${d.data.creditsCost}`);
        loadWorks();
    }
    catch (e) {
        output.value = '';
        ElMessage.error(e.message || '后端服务连接失败');
    }
    finally {
        generating.value = false;
    }
}
function selectResult(i) { activeResult.value = i; output.value = results.value[i].text; reviseInput.value = ''; }
async function revise() {
    if (revising.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    const base = output.value;
    if (!base) {
        ElMessage.warning('请先生成一次文案');
        return;
    }
    if (!reviseInput.value.trim()) {
        ElMessage.warning('请输入修改要求');
        return;
    }
    const tool = selected.value;
    revising.value = true;
    output.value = '';
    try {
        const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt: `以下是之前生成的一篇文案：\n${base}\n\n用户要求按下面要求修改：${reviseInput.value.trim()}\n请直接输出修改后的完整文案，不要解释。`, subject: subject.value.trim(), featureCode: tool.featureCode || tool.key || 'copywriting' }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '修改失败');
        results.value.unshift({ text: d.data.content, img: imgUrl.value || undefined });
        results.value = results.value.slice(0, 3);
        activeResult.value = 0;
        output.value = results.value[0].text;
        balance.value = Number(d.data.balance);
        ElMessage.success(`修改完成，扣费 ${d.data.creditsCost}`);
    }
    catch (e) {
        output.value = base;
        ElMessage.error(e.message || '修改失败');
    }
    finally {
        revising.value = false;
    }
}
function openImgPicker() { document.getElementById('img-input')?.click(); }
async function onUploadImg(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片不能超过 5MB');
        return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
        const r = await secureFetch('/resource/oss/upload', { method: 'POST', headers: { clientid: 'aigc-web', Authorization: 'Bearer ' + userToken.value }, body: fd });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '上传失败');
        imgUrl.value = d.data.url;
        ElMessage.success('图片已上传，将随文案展示');
        saveMaterial(d.data.url);
    }
    catch (e) {
        ElMessage.error(e.message || '图片上传失败');
    }
    finally {
        ev.target.value = '';
    }
}
// ============ AI 对话 ============
async function sendChat() {
    if (chatting.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    const text = chatInput.value.trim();
    if (!text)
        return;
    chatMessages.value.push({ role: 'user', content: text });
    chatInput.value = '';
    chatting.value = true;
    try {
        const history = chatMessages.value.slice(-10).map((m) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n');
        const r = await apiFetch('/aigc/generate', { method: 'POST', body: JSON.stringify({ prompt: `以下是一段多轮对话，请以 AI 助手的身份自然回复最后一条用户消息：\n${history}\nAI：`, featureCode: 'copywriting' }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '对话失败');
        chatMessages.value.push({ role: 'ai', content: d.data.content });
        balance.value = Number(d.data.balance);
    }
    catch (e) {
        chatMessages.value.push({ role: 'ai', content: '⚠️ ' + (e.message || '对话失败') });
    }
    finally {
        chatting.value = false;
    }
}
// ============ AI 绘画 ============
async function doDraw() {
    if (drawing.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!drawPrompt.value.trim()) {
        ElMessage.warning('请输入绘画描述');
        return;
    }
    if (drawMode.value === 'product' && !productImageUrls.value.length && !productImageUrl.value) {
        ElMessage.warning('请先上传产品图片');
        return;
    }
    drawing.value = true;
    drawUrl.value = '';
    drawUsedModel.value = '';
    if (drawMode.value === 'product')
        productResults.value = [];
    try {
        const productPrompt = drawMode.value === 'product' ? `电商商品主图/商品套图。商品名称：${productName.value || '未命名商品'}。核心卖点：${productSellingPoints.value || '突出商品材质、细节和使用价值'}。目标人群：${productAudience.value || '电商消费者'}。使用场景：${productScene.value}。视觉风格：${productStyle.value}。构图：${productComposition.value}。视角：${productCamera.value}。光线：${productLighting.value}。背景：${productBackground.value}。文字要求：${productCopy.value}。${drawPrompt.value || '画面简洁、高级、突出商品主体，符合电商平台主图规范。'}` : drawPrompt.value;
        const urls = drawMode.value === 'product' ? (productImageUrls.value.length ? productImageUrls.value : [productImageUrl.value]) : [undefined];
        for (let i = 0; i < (drawMode.value === 'product' ? productCount.value : 1); i++) {
            const r = await apiFetch('/aigc/image/generate', { method: 'POST', body: JSON.stringify({ featureCode: skillCode(), model: drawModel.value || undefined, prompt: productPrompt, size: drawSize.value, imageUrl: urls[i % urls.length] }) });
            const d = await r.json();
            if (d.code !== 200)
                throw new Error(d.msg || '绘画失败');
            const item = { url: d.data.url, prompt: productPrompt, model: d.data.model || drawModel.value || '后台智能路由', createdAt: new Date().toLocaleString() };
            if (drawMode.value === 'product')
                productResults.value.push(item);
            drawHistory.value.unshift(item);
            if (i === 0)
                selectDrawResult(item);
        }
        ElMessage.success(`生成完成，共 ${drawMode.value === 'product' ? productCount.value : 1} 张`);
        loadWorks();
    }
    catch (e) {
        ElMessage.error(e.message || '绘画失败');
    }
    finally {
        drawing.value = false;
    }
}
async function uploadProductImage(ev) {
    const file = ev?.target?.files?.[0];
    if (!file)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!file.type.startsWith('image/')) {
        ElMessage.warning('请上传图片文件');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        ElMessage.warning('产品图片不能超过 10MB');
        return;
    }
    productUploading.value = true;
    try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await secureFetch('/resource/oss/upload', { method: 'POST', headers: { clientid: 'aigc-web', Authorization: 'Bearer ' + userToken.value }, body: fd });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '上传失败');
        productImageUrl.value = d.data.url;
        productImageUrls.value.push(d.data.url);
        ElMessage.success(`产品图片已上传（${productImageUrls.value.length}/10）`);
    }
    catch (e) {
        ElMessage.error(e.message || '产品图片上传失败');
    }
    finally {
        productUploading.value = false;
    }
}
function openProductPicker() { document.getElementById('product-image-file')?.click(); }
function chooseProductTemplate(template) {
    selectedProductTemplateId.value = template.id;
    productStyle.value = template.style;
    productScene.value = template.scene;
    productComposition.value = template.prompt;
    if (template.ratio === '3:4')
        drawSize.value = '768x1024';
    else if (template.ratio === '4:3')
        drawSize.value = '1024x768';
    else
        drawSize.value = '1024x1024';
    productTemplateOpen.value = false;
    ElMessage.success(`已选择模板：${template.name}`);
}
function selectDrawResult(item) {
    drawUrl.value = item.url;
    drawUsedModel.value = item.model;
    drawPrompt.value = item.prompt;
}
async function reviseDraw() {
    if (!drawUrl.value || revisingDraw.value)
        return;
    if (!drawRevisePrompt.value.trim()) {
        ElMessage.warning('请输入修改要求');
        return;
    }
    revisingDraw.value = true;
    try {
        const r = await apiFetch('/aigc/image/generate', { method: 'POST', body: JSON.stringify({ featureCode: skillCode(), model: drawModel.value || undefined, prompt: `${drawPrompt.value}\n\n请基于当前生成图片进行局部修改，只修改以下要求，保持商品主体、比例和其他未指定内容不变：${drawRevisePrompt.value}`, size: drawSize.value, imageUrl: drawUrl.value }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '图片修改失败');
        const item = { url: d.data.url, prompt: `${drawPrompt.value}；修改：${drawRevisePrompt.value}`, model: d.data.model || drawModel.value || '后台智能路由', createdAt: new Date().toLocaleString() };
        drawHistory.value.unshift(item);
        if (drawMode.value === 'product')
            productResults.value.push(item);
        selectDrawResult(item);
        balance.value = Number(d.data.balance);
        drawRevisePrompt.value = '';
        ElMessage.success(`修改完成，扣费 ${d.data.creditsCost}`);
        loadWorks();
    }
    catch (e) {
        ElMessage.error(e.message || '图片修改失败');
    }
    finally {
        revisingDraw.value = false;
    }
}
async function submitGptImage() {
    const instruction = gptImageInput.value.trim();
    if (drawing.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!instruction) {
        ElMessage.warning('请输入你想生成或修改的图片');
        return;
    }
    if (!drawModel.value) {
        ElMessage.warning('后台尚未启用图片生成模型');
        return;
    }
    const sourceUrl = drawUrl.value || undefined;
    const prompt = sourceUrl
        ? `请基于当前图片进行修改。保持没有明确要求修改的主体、构图和细节不变，只执行以下要求：${instruction}`
        : instruction;
    drawing.value = true;
    try {
        const r = await apiFetch('/aigc/image/generate', {
            method: 'POST',
            body: JSON.stringify({ featureCode: 'gpt_image', model: drawModel.value, prompt, size: '1024x1024', imageUrl: sourceUrl })
        });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '图片生成失败');
        const item = { url: d.data.url, prompt: instruction, model: d.data.model || drawModel.value, createdAt: new Date().toLocaleString() };
        drawHistory.value.unshift(item);
        selectDrawResult(item);
        balance.value = Number(d.data.balance);
        gptImageInput.value = '';
        ElMessage.success(sourceUrl ? '已根据选中图片生成新版本' : '图片生成完成');
        loadWorks();
    }
    catch (e) {
        ElMessage.error(e.message || '图片生成失败');
    }
    finally {
        drawing.value = false;
    }
}
function startNewGptImage() {
    drawUrl.value = '';
    drawUsedModel.value = '';
    gptImageInput.value = '';
}
async function downloadDraw() {
    if (!drawUrl.value)
        return;
    try {
        const response = await fetch(drawUrl.value);
        if (!response.ok)
            throw new Error('download failed');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aigc-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    catch {
        window.open(drawUrl.value, '_blank', 'noopener,noreferrer');
        ElMessage.info('图片已打开，请在图片上右键保存');
    }
}
function previewDraw() { if (drawUrl.value)
    drawPreviewOpen.value = true; }
// ============ 模板剪辑 ============
function toggleComposeImg(url) {
    const i = composeImgs.value.indexOf(url);
    if (i >= 0)
        composeImgs.value.splice(i, 1);
    else if (composeImgs.value.length < 12)
        composeImgs.value.push(url);
    else
        ElMessage.warning('最多选 12 张');
}
async function doCompose() {
    if (composing.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (composeImgs.value.length === 0) {
        ElMessage.warning('请至少选择一张素材图片');
        return;
    }
    if (!composeText.value.trim()) {
        ElMessage.warning('请输入配音文案');
        return;
    }
    composing.value = true;
    composeUrl.value = '';
    try {
        const r = await apiFetch('/aigc/video/compose', { method: 'POST', body: JSON.stringify({ images: composeImgs.value, text: composeText.value, voice: composeVoice.value }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '合成失败');
        composeUrl.value = d.data.url;
        ElMessage.success('视频合成完成');
        loadWorks();
    }
    catch (e) {
        ElMessage.error(e.message || '合成失败');
    }
    finally {
        composing.value = false;
    }
}
// ============ AI 配音 ============
async function doTts() {
    if (ttsGenerating.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!ttsText.value.trim()) {
        ElMessage.warning('请输入配音文本');
        return;
    }
    ttsGenerating.value = true;
    ttsUrl.value = '';
    try {
        const r = await apiFetch('/aigc/tts', { method: 'POST', body: JSON.stringify({ text: ttsText.value, voice: ttsVoice.value }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '配音生成失败');
        ttsUrl.value = d.data.url;
        ElMessage.success('配音生成完成');
    }
    catch (e) {
        ElMessage.error(e.message || '配音服务连接失败');
    }
    finally {
        ttsGenerating.value = false;
    }
}
// ============ AI 视频 ============
async function doVideo() {
    if (videoGenerating.value)
        return;
    if (!userToken.value) {
        openLogin();
        return;
    }
    if (!videoPrompt.value.trim()) {
        ElMessage.warning('请输入视频描述或文案');
        return;
    }
    videoGenerating.value = true;
    videoUrl.value = '';
    try {
        const r = await apiFetch('/aigc/video/generate', { method: 'POST', body: JSON.stringify({ prompt: videoPrompt.value, duration: 5, imageUrl: videoImageUrl.value || undefined, imageUrl2: videoImageUrl2.value || undefined, model: 'vidu-video-q2-turbo' }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '视频任务提交失败');
        balance.value = Number(d.data.balance);
        ElMessage.success(`视频任务已提交，扣费 ${d.data.creditsCost}`);
        pollVideo(d.data.taskNo);
    }
    catch (e) {
        videoGenerating.value = false;
        ElMessage.error(e.message || '视频生成失败');
    }
}
async function pollVideo(taskNo) {
    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
            const r = await apiFetch(`/aigc/video/tasks/${taskNo}`);
            const d = await r.json();
            if (d.code !== 200)
                continue;
            if (d.data.status === 'SUCCESS') {
                videoUrl.value = d.data.url;
                videoGenerating.value = false;
                ElMessage.success('视频生成完成');
                loadWorks();
                return;
            }
            if (d.data.status === 'FAILED') {
                videoGenerating.value = false;
                ElMessage.error(d.data.error || '视频生成失败');
                return;
            }
        }
        catch { }
    }
    videoGenerating.value = false;
    ElMessage.warning('视频仍在生成，可在任务记录中查看');
}
// ============ 充值 ============
async function loadAccountCenter() {
    try {
        const [aR, oR, fR] = await Promise.all([apiFetch('/aigc/account'), apiFetch('/aigc/orders'), apiFetch('/aigc/credit-flows')]);
        const a = await aR.json(), o = await oR.json(), f = await fR.json();
        if (a.code === 200)
            balance.value = Number(a.data?.balance || 0);
        if (o.code === 200)
            orders.value = o.data || [];
        if (f.code === 200)
            creditFlows.value = f.data || [];
    }
    catch {
        ElMessage.error('账户数据加载失败');
    }
}
async function startRecharge(pack) {
    if (rechargeLoading.value !== null)
        return;
    const payWindow = window.open('about:blank', '_blank');
    if (!payWindow) {
        ElMessage.warning('浏览器阻止了支付窗口，请允许弹窗后重试');
        return;
    }
    rechargeLoading.value = pack.id;
    try {
        const r = await apiFetch('/aigc/payment/epay/create', { method: 'POST', body: JSON.stringify({ packageId: pack.id, paymentType: paymentType.value }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '创建支付订单失败');
        if (d.data.mock) {
            payWindow.close();
            ElMessage.success('充值成功，余额已到账');
            loadAccountCenter();
            return;
        }
        payWindow.location.href = d.data.paymentUrl;
        ElMessage.success('支付订单已创建，请在新窗口完成支付');
        pollPayment(d.data.orderNo);
    }
    catch (e) {
        payWindow.close();
        ElMessage.error(e.message || '创建支付订单失败');
    }
    finally {
        rechargeLoading.value = null;
    }
}
async function startCustomRecharge() {
    if (customRechargeLoading.value)
        return;
    const amt = Number(customAmount.value);
    if (!amt || amt <= 0) {
        ElMessage.warning('请输入有效充值金额');
        return;
    }
    const payWindow = window.open('about:blank', '_blank');
    if (!payWindow) {
        ElMessage.warning('浏览器阻止了支付窗口，请允许弹窗后重试');
        return;
    }
    customRechargeLoading.value = true;
    try {
        const r = await apiFetch('/aigc/payment/epay/create', { method: 'POST', body: JSON.stringify({ amount: amt, paymentType: paymentType.value }) });
        const d = await r.json();
        if (d.code !== 200)
            throw new Error(d.msg || '创建支付订单失败');
        if (d.data.mock) {
            payWindow.close();
            ElMessage.success('充值成功，余额已到账');
            loadAccountCenter();
            return;
        }
        payWindow.location.href = d.data.paymentUrl;
        ElMessage.success('支付订单已创建，请在新窗口完成支付');
        pollPayment(d.data.orderNo);
    }
    catch (e) {
        payWindow.close();
        ElMessage.error(e.message || '创建支付订单失败');
    }
    finally {
        customRechargeLoading.value = false;
    }
}
async function pollPayment(orderNo) {
    for (let i = 0; i < 100; i++) {
        await new Promise(r => setTimeout(r, 3000));
        if (!userToken.value)
            return;
        try {
            const r = await apiFetch(`/aigc/payment/epay/query/${orderNo}`);
            const d = await r.json();
            if (d.code === 200 && d.data.status === 'PAID') {
                await loadAccountCenter();
                accountTab.value = 'orders';
                ElMessage.success('充值成功，余额已到账');
                return;
            }
        }
        catch { }
    }
}
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['brand-mark', 'top-search', 'balance-pill', 'user-chip', 'ghost-btn', 'nav-item', 'nav-item', 'nav-item', 'group-head', 'tool-card', 'tool-card', 'tool-card', 'tool-card', 'tool-icon', 'ws-title', 'ws-title', 'panel-head', 'panel-head', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'model-select', 'skill-route', 'draw-revise-label', 'draw-revise-label', 'draw-revise', 'draw-revise', 'ghost-btn', 'draw-preview-trigger', 'draw-preview-trigger', 'draw-img', 'draw-actions', 'ghost-btn', 'draw-history-head', 'draw-history-grid', 'draw-history-grid', 'draw-history-grid', 'product-result-head', 'product-result-head', 'product-result-head', 'product-result-head', 'product-result-grid', 'product-result-grid', 'product-result-grid', 'picked', 'product-result-grid', 'product-result-grid', 'product-fields', 'product-fields', 'product-fields', 'product-fields', 'product-fields', 'form-panel', 'workspace-image', 'workspace-image', 'workspace-image', 'result-empty', 'workspace-image', 'result-empty', 'product-presets', 'product-presets', 'preset-row', 'preset-row', 'picked', 'selected-template-card', 'selected-template-card', 'selected-template-card', 'selected-template-card', 'selected-template-card', 'selected-template-card', 'template-mini', 'template-mini', 'template-filter-row', 'template-filter-row', 'template-filter-row', 'template-filter-row', 'template-filter-row', 'picked', 'template-result-count', 'template-library-card', 'template-library-card', 'picked', 'template-art', 'template-art', 'template-meta', 'template-meta', 'product-fields', 'product-fields', 'product-fields', 'product-result-grid', 'draw-revise-label', 'draw-revise-label', 'draw-revise-row', 'template-library-grid', 'selected-template-card', 'template-mini', 'draw-mode', 'draw-mode', 'picked', 'product-thumb', 'gen-btn', 'gen-btn', 'result-panel', 'result-top', 'result-top', 'dir-tag', 'dir-tag', 'picked', 'result-tabs', 'result-tabs', 'picked', 'revise-box', 'revise-box', 'history-item', 'history-item', 'picked', 'history-item', 'history-item', 'hd-top', 'mat-pick', 'mat-pick', 'mat-pick', 'picked', 'material-card', 'mat-actions', 'ghost-btn', 'material-card', 'ghost-btn', 'ghost-btn', 'danger', 'empty', 'result-empty', 'msg', 'msg', 'user', 'bubble', 'msg', 'bubble', 'chat-input', 'chat-input', 'gen-btn', 'size-btn', 'picked', 'draw-img', 'work-card', 'work-card', 'work-card', 'work-card', 'auth-hero', 'auth-hero', 'auth-form', 'auth-form', 'auth-switch', 'code-row', 'code-btn', 'account-dialog', 'account-dialog', 'account-dialog', 'el-tabs__item', 'account-summary', 'account-summary', 'account-summary', 'account-summary', 'package-item', 'package-item', 'package-item', 'package-item', 'package-item', 'custom-recharge', 'custom-recharge', 'ws-body', 'app', 'topbar', 'brand', 'brand-mark', 'balance-pill', 'balance-pill', 'user-chip', 'ghost-btn', 'ghost-btn', 'sidebar', 'nav-group', 'nav-item', 'nav-item', 'nav-item', 'active', 'nav-item', 'active', 'main', 'hero-title', 'hero-sub', 'group-title', 'tool-grid', 'tool-card', 'tool-card', 'tool-card', 'tool-card', 'workspace', 'ws-head', 'ws-title', 'form-panel', 'result-panel', 'chat-box', 'form-panel', 'panel-head', 'form-panel', 'form-panel', 'model-select', 'chat-input', 'form-panel', 'model-select', 'gen-btn', 'auth-btn', 'gen-btn', 'size-btn', 'picked', 'result-empty', 'empty-icon', 'el-dialog', 'account-dialog', 'el-dialog', 'auth-btn', 'code-btn', 'account-summary', 'account-summary', 'package-item', 'package-item', 'package-item', 'package-item', 'account-dialog', 'el-tabs__item', 'is-active', 'topbar', 'sidebar', 'main', 'top-search', 'top-right', 'sidebar', 'nav-item', 'sidebar', 'nav-group', 'sidebar', 'nav-item', 'sidebar', 'nav-item', 'layout', 'sidebar', 'mobile-menu', 'home', 'home-hero', 'hero-title', 'hero-title', 'hero-sub', 'hero-primary', 'hero-secondary', 'section-label', 'quick-card', 'quick-card', 'quick-card', 'quick-card', 'quick-icon', 'quick-icon', 'quick-icon', 'quick-icon', 'tool-library', 'home-group', 'tool-library', 'group-head', 'tool-library', 'tool-grid', 'tool-library', 'tool-card', 'tool-library', 'tool-icon', 'tool-library', 'tool-icon', 'chat-box', 'workspace-chat', 'chat-msgs', 'workspace-chat', 'chat-input', 'workspace-image', 'form-panel', 'form-panel', 'workspace-image', 'result-panel', 'workspace-video', 'result-panel', 'result-panel', 'works-grid', 'works-grid', 'mat-picker', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'media-upload', 'media-upload', 'media-upload', 'media-upload', 'media-upload', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'form-panel', 'gpt-image-head', 'gpt-image-head', 'gpt-new-image', 'gpt-image-empty', 'gpt-image-empty', 'gpt-image-empty', 'gpt-image-card', 'gpt-image-card', 'gpt-image-card', 'gpt-image-card', 'gpt-image-composer', 'gpt-image-composer', 'gpt-editing-chip', 'gpt-editing-chip', 'gpt-editing-chip', 'gpt-editing-chip', 'gpt-model-picker', 'gpt-download', 'gpt-download', 'gpt-send', 'gpt-send', 'gpt-send', 'home-hero', 'hero-orbit', 'quick-grid', 'ws-body', 'mobile-menu', 'topbar', 'brand', 'brand-mark', 'top-right', 'balance-pill', 'top-right', 'ghost-btn', 'layout', 'mobile-backdrop', 'sidebar', 'sidebar', 'sidebar', 'nav-item', 'sidebar', 'nav-group', 'sidebar', 'nav-item', 'sidebar', 'nav-item', 'main', 'home-hero', 'hero-title', 'hero-sub', 'hero-actions', 'hero-primary', 'hero-secondary', 'hero-orbit', 'section-label', 'section-label', 'section-note', 'quick-grid', 'quick-card', 'tool-library', 'tool-grid', 'tool-library', 'tool-card', 'tool-library', 'tool-card', 'tool-library', 'tool-card', 'workspace', 'ws-head', 'ws-title', 'ws-title', 'ws-actions', 'ws-actions', 'ghost-btn', 'ws-body', 'form-panel', 'result-panel', 'form-panel', 'result-panel', 'chat-box', 'chat-msgs', 'chat-input', 'chat-input', 'gen-btn', 'media-upload', 'media-upload', 'account-summary', 'account-summary', 'package-grid', 'custom-recharge', 'home-group', 'workspace-gpt-image', 'gpt-image-head', 'gpt-image-head', 'gpt-image-head', 'gpt-new-image', 'gpt-image-stage', 'gpt-image-empty', 'gpt-image-gallery', 'gpt-image-composer', 'gpt-image-composer', 'gpt-model-picker', 'gpt-used-model', 'skill-route', 'skill-route',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousemove: (__VLS_ctx.onGlow) },
        ...{ class: ("app") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("glow") },
        ...{ style: (({ '--x': '50%', '--y': '0%' })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: ("topbar") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.mobileNavOpen = !__VLS_ctx.mobileNavOpen;
            } },
        ...{ class: ("mobile-menu") },
        'aria-label': ("打开导航"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.goHome) },
        ...{ class: ("brand") },
        ...{ style: ({}) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("brand-mark") },
    });
    const __VLS_0 = {}.Zap;
    /** @type { [typeof __VLS_components.Zap, ] } */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: ((19)),
    }));
    const __VLS_2 = __VLS_1({
        size: ((19)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("top-search") },
    });
    const __VLS_6 = {}.Search;
    /** @type { [typeof __VLS_components.Search, ] } */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        size: ((15)),
    }));
    const __VLS_8 = __VLS_7({
        size: ((15)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
        placeholder: ("搜索工具…"),
    });
    (__VLS_ctx.query);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("top-right") },
    });
    if (__VLS_ctx.userName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("balance-pill") },
        });
        const __VLS_12 = {}.Wallet;
        /** @type { [typeof __VLS_components.Wallet, ] } */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            size: ((14)),
        }));
        const __VLS_14 = __VLS_13({
            size: ((14)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.balance ?? '--');
    }
    if (__VLS_ctx.userName) {
        const __VLS_18 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }));
        const __VLS_20 = __VLS_19({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        let __VLS_24;
        const __VLS_25 = {
            onClick: (...[$event]) => {
                if (!((__VLS_ctx.userName)))
                    return;
                __VLS_ctx.accountOpen = true;
                __VLS_ctx.loadAccountCenter();
            }
        };
        let __VLS_21;
        let __VLS_22;
        __VLS_23.slots.default;
        var __VLS_23;
    }
    else {
        const __VLS_26 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }));
        const __VLS_28 = __VLS_27({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        let __VLS_32;
        const __VLS_33 = {
            onClick: (...[$event]) => {
                if (!(!((__VLS_ctx.userName))))
                    return;
                __VLS_ctx.loginOpen = true;
            }
        };
        let __VLS_29;
        let __VLS_30;
        __VLS_31.slots.default;
        var __VLS_31;
    }
    if (__VLS_ctx.userName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.userName)))
                        return;
                    __VLS_ctx.accountOpen = true;
                    __VLS_ctx.loadAccountCenter();
                } },
            ...{ class: ("user-chip") },
        });
        (__VLS_ctx.userName);
        const __VLS_34 = {}.ChevronDown;
        /** @type { [typeof __VLS_components.ChevronDown, ] } */ ;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
            size: ((13)),
        }));
        const __VLS_36 = __VLS_35({
            size: ((13)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("layout") },
    });
    if (__VLS_ctx.mobileNavOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.mobileNavOpen)))
                        return;
                    __VLS_ctx.mobileNavOpen = false;
                } },
            ...{ class: ("mobile-backdrop") },
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: ("sidebar") },
        ...{ class: (({ 'is-open': __VLS_ctx.mobileNavOpen })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
    for (const [g] of __VLS_getVForSourceType((__VLS_ctx.GROUPS))) {
        (g);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("nav-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (g);
        for (const [t] of __VLS_getVForSourceType((__VLS_ctx.availableTools.filter((x) => x.group === g)))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        __VLS_ctx.pickTool(t);
                    } },
                key: ((t.key)),
                ...{ class: ("nav-item") },
                ...{ class: (({ active: __VLS_ctx.selected.key === t.key })) },
            });
            const __VLS_40 = ((t.icon));
            // @ts-ignore
            const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
                size: ((16)),
                ...{ style: (({ color: t.color })) },
            }));
            const __VLS_42 = __VLS_41({
                size: ((16)),
                ...{ style: (({ color: t.color })) },
            }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (t.title);
            if (t.disabled) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({
                    ...{ class: ("soon") },
                });
            }
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main") },
    });
    if (__VLS_ctx.selected.key === 'home') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("home") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("home-hero") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("hero-copy") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("eyebrow") },
        });
        const __VLS_46 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
            size: ((13)),
        }));
        const __VLS_48 = __VLS_47({
            size: ((13)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ class: ("hero-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.br)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("hero-sub") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("hero-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('koudabo'));
                } },
            ...{ class: ("hero-primary") },
        });
        const __VLS_52 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            size: ((16)),
        }));
        const __VLS_54 = __VLS_53({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('chat'));
                } },
            ...{ class: ("hero-secondary") },
        });
        const __VLS_58 = {}.Bot;
        /** @type { [typeof __VLS_components.Bot, ] } */ ;
        // @ts-ignore
        const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
            size: ((16)),
        }));
        const __VLS_60 = __VLS_59({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_59));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("hero-orbit") },
            'aria-hidden': ("true"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("orbit-ring ring-one") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("orbit-ring ring-two") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("orbit-core") },
        });
        const __VLS_64 = {}.Zap;
        /** @type { [typeof __VLS_components.Zap, ] } */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            size: ((30)),
        }));
        const __VLS_66 = __VLS_65({
            size: ((30)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("orbit-chip chip-one") },
        });
        const __VLS_70 = {}.PenLine;
        /** @type { [typeof __VLS_components.PenLine, ] } */ ;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent(__VLS_70, new __VLS_70({
            size: ((13)),
        }));
        const __VLS_72 = __VLS_71({
            size: ((13)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_71));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("orbit-chip chip-two") },
        });
        const __VLS_76 = {}.Palette;
        /** @type { [typeof __VLS_components.Palette, ] } */ ;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
            size: ((13)),
        }));
        const __VLS_78 = __VLS_77({
            size: ((13)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("orbit-chip chip-three") },
        });
        const __VLS_82 = {}.Video;
        /** @type { [typeof __VLS_components.Video, ] } */ ;
        // @ts-ignore
        const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({
            size: ((13)),
        }));
        const __VLS_84 = __VLS_83({
            size: ((13)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_83));
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("quick-start") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("section-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("eyebrow") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("section-note") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("quick-grid") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('koudabo'));
                } },
            ...{ class: ("quick-card quick-copy") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("quick-icon") },
        });
        const __VLS_88 = {}.Mic2;
        /** @type { [typeof __VLS_components.Mic2, ] } */ ;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
            size: ((20)),
        }));
        const __VLS_90 = __VLS_89({
            size: ((20)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        const __VLS_94 = {}.ChevronDown;
        /** @type { [typeof __VLS_components.ChevronDown, ] } */ ;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }));
        const __VLS_96 = __VLS_95({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('chat'));
                } },
            ...{ class: ("quick-card quick-chat") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("quick-icon") },
        });
        const __VLS_100 = {}.Bot;
        /** @type { [typeof __VLS_components.Bot, ] } */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            size: ((20)),
        }));
        const __VLS_102 = __VLS_101({
            size: ((20)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        const __VLS_106 = {}.ChevronDown;
        /** @type { [typeof __VLS_components.ChevronDown, ] } */ ;
        // @ts-ignore
        const __VLS_107 = __VLS_asFunctionalComponent(__VLS_106, new __VLS_106({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }));
        const __VLS_108 = __VLS_107({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_107));
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('image'));
                } },
            ...{ class: ("quick-card quick-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("quick-icon") },
        });
        const __VLS_112 = {}.Palette;
        /** @type { [typeof __VLS_components.Palette, ] } */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
            size: ((20)),
        }));
        const __VLS_114 = __VLS_113({
            size: ((20)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        const __VLS_118 = {}.ChevronDown;
        /** @type { [typeof __VLS_components.ChevronDown, ] } */ ;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent(__VLS_118, new __VLS_118({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }));
        const __VLS_120 = __VLS_119({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.selected.key === 'home')))
                        return;
                    __VLS_ctx.pickTool(__VLS_ctx.toolFor('video'));
                } },
            ...{ class: ("quick-card quick-video") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("quick-icon") },
        });
        const __VLS_124 = {}.Video;
        /** @type { [typeof __VLS_components.Video, ] } */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            size: ((20)),
        }));
        const __VLS_126 = __VLS_125({
            size: ((20)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        const __VLS_130 = {}.ChevronDown;
        /** @type { [typeof __VLS_components.ChevronDown, ] } */ ;
        // @ts-ignore
        const __VLS_131 = __VLS_asFunctionalComponent(__VLS_130, new __VLS_130({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }));
        const __VLS_132 = __VLS_131({
            size: ((16)),
            ...{ class: ("quick-arrow") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_131));
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("tool-library") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("section-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("eyebrow") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("section-note") },
        });
        (__VLS_ctx.filteredTools.length);
        for (const [g] of __VLS_getVForSourceType((__VLS_ctx.GROUPS))) {
            (g);
            if (__VLS_ctx.filteredTools.some(x => x.group === g)) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("home-group") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("group-head") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("group-title") },
                });
                (g);
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("group-count") },
                });
                (__VLS_ctx.filteredTools.filter(x => x.group === g).length);
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("tool-grid") },
                });
                for (const [t] of __VLS_getVForSourceType((__VLS_ctx.filteredTools.filter(x => x.group === g)))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!((__VLS_ctx.selected.key === 'home')))
                                    return;
                                if (!((__VLS_ctx.filteredTools.some(x => x.group === g))))
                                    return;
                                __VLS_ctx.pickTool(t);
                            } },
                        key: ((t.key)),
                        ...{ class: ("tool-card tilt") },
                        disabled: ((t.disabled)),
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("tool-icon") },
                        ...{ style: (({ background: t.color + '22', color: t.color, border: '1px solid ' + t.color + '44' })) },
                    });
                    const __VLS_136 = ((t.icon));
                    // @ts-ignore
                    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
                        size: ((22)),
                    }));
                    const __VLS_138 = __VLS_137({
                        size: ((22)),
                    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
                    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
                    (t.title);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                    (t.sub);
                }
            }
        }
    }
    else if (!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['workspace', `workspace-${__VLS_ctx.selected.key}`])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: (({ background: __VLS_ctx.selected.color + '22', color: __VLS_ctx.selected.color })) },
        });
        const __VLS_142 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_143 = __VLS_asFunctionalComponent(__VLS_142, new __VLS_142({
            size: ((17)),
        }));
        const __VLS_144 = __VLS_143({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_143));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.selected.sub);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-actions") },
        });
        const __VLS_148 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
            icon: ((__VLS_ctx.Copy)),
        }));
        const __VLS_150 = __VLS_149({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
            icon: ((__VLS_ctx.Copy)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_149));
        let __VLS_154;
        const __VLS_155 = {
            onClick: (__VLS_ctx.copyOutput)
        };
        let __VLS_151;
        let __VLS_152;
        __VLS_153.slots.default;
        var __VLS_153;
        const __VLS_156 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }));
        const __VLS_158 = __VLS_157({
            ...{ 'onClick': {} },
            ...{ class: ("ghost-btn") },
        }, ...__VLS_functionalComponentArgsRest(__VLS_157));
        let __VLS_162;
        const __VLS_163 = {
            onClick: (__VLS_ctx.openHistory)
        };
        let __VLS_159;
        let __VLS_160;
        __VLS_161.slots.default;
        var __VLS_161;
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: (({ background: __VLS_ctx.selected.color + '12', color: __VLS_ctx.selected.color })) },
        });
        const __VLS_164 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
            size: ((15)),
        }));
        const __VLS_166 = __VLS_165({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_165));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        for (const [f] of __VLS_getVForSourceType(((__VLS_ctx.selected.fields || [{ k: 'subject', label: '创作主题 / 内容', type: 'textarea', ph: '输入主题或粘贴需要处理的内容…' }])))) {
            (f.k);
            if (f.type === 'textarea') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
                (f.label);
                __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                    value: ((__VLS_ctx.subject)),
                    maxlength: ("3000"),
                    placeholder: ((f.ph)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("char-count") },
                });
                (__VLS_ctx.subject.length);
            }
            else if (f.type === 'select') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                (f.label);
                __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: ((__VLS_ctx.extra[f.k])),
                    ...{ class: ("model-select") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: (""),
                });
                for (const [o] of __VLS_getVForSourceType((f.options))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: ((o)),
                        value: ((o)),
                    });
                    (o);
                }
            }
        }
        if (__VLS_ctx.selected.directions && __VLS_ctx.selected.directions.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dir-tags") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("tag-row") },
            });
            for (const [d] of __VLS_getVForSourceType((__VLS_ctx.selected.directions))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.selected.directions && __VLS_ctx.selected.directions.length)))
                                return;
                            __VLS_ctx.direction = __VLS_ctx.direction === d ? '' : d;
                        } },
                    key: ((d)),
                    ...{ class: ("dir-tag") },
                    ...{ class: (({ picked: __VLS_ctx.direction === d })) },
                });
                (d);
            }
        }
        if (__VLS_ctx.selected.withImg !== false) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("upload-row") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.onUploadImg) },
                type: ("file"),
                accept: ("image/*"),
                id: ("img-input"),
                ...{ style: ({}) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.openImgPicker) },
                ...{ class: ("ghost-btn") },
            });
            (__VLS_ctx.imgUrl ? '已配图 ✓' : '📷 上传图片');
            if (__VLS_ctx.imgUrl) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.imgUrl)),
                    ...{ class: ("thumb") },
                    title: ((__VLS_ctx.imgUrl)),
                });
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("skill-route") },
        });
        const __VLS_170 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_171 = __VLS_asFunctionalComponent(__VLS_170, new __VLS_170({
            size: ((15)),
        }));
        const __VLS_172 = __VLS_171({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_171));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.generate) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.generating)),
        });
        const __VLS_176 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
            size: ((16)),
        }));
        const __VLS_178 = __VLS_177({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_177));
        (__VLS_ctx.generating ? '生成中…' : `立即生成 · 扣费 ${__VLS_ctx.selectedCost}`);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel") },
        });
        if (__VLS_ctx.output) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-top") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.selected.title);
            if (__VLS_ctx.results.length > 1) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("result-tabs") },
                });
                for (const [_, i] of __VLS_getVForSourceType((__VLS_ctx.results))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.selected.key === 'home'))))
                                    return;
                                if (!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key))))
                                    return;
                                if (!((__VLS_ctx.output)))
                                    return;
                                if (!((__VLS_ctx.results.length > 1)))
                                    return;
                                __VLS_ctx.selectResult(i);
                            } },
                        key: ((i)),
                        ...{ class: (({ picked: __VLS_ctx.activeResult === i })) },
                    });
                    (i + 1);
                }
            }
            if (__VLS_ctx.results[__VLS_ctx.activeResult] && __VLS_ctx.results[__VLS_ctx.activeResult].img) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.results[__VLS_ctx.activeResult].img)),
                    ...{ class: ("result-img") },
                    alt: ("配图"),
                });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-text") },
            });
            (__VLS_ctx.output);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("revise-box") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onKeyup: (__VLS_ctx.revise) },
                placeholder: ("输入修改要求，如：语气更幽默、缩短到100字、加上价格…"),
            });
            (__VLS_ctx.reviseInput);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.revise) },
                ...{ class: ("ghost-btn") },
                disabled: ((__VLS_ctx.revising)),
            });
            (__VLS_ctx.revising ? '修改中…' : '✏️ 按此要求修改');
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_182 = {}.Sparkles;
            /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
            // @ts-ignore
            const __VLS_183 = __VLS_asFunctionalComponent(__VLS_182, new __VLS_182({
                size: ((26)),
            }));
            const __VLS_184 = __VLS_183({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_183));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        }
    }
    else if (__VLS_ctx.selected.key === 'chat') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace chat-ws workspace-chat") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_188 = {}.Bot;
        /** @type { [typeof __VLS_components.Bot, ] } */ ;
        // @ts-ignore
        const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
            size: ((17)),
        }));
        const __VLS_190 = __VLS_189({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_189));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("chat-box") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("chat-msgs") },
        });
        if (__VLS_ctx.chatMessages.length === 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty") },
            });
            const __VLS_194 = {}.Bot;
            /** @type { [typeof __VLS_components.Bot, ] } */ ;
            // @ts-ignore
            const __VLS_195 = __VLS_asFunctionalComponent(__VLS_194, new __VLS_194({
                size: ((40)),
                opacity: (".3"),
            }));
            const __VLS_196 = __VLS_195({
                size: ((40)),
                opacity: (".3"),
            }, ...__VLS_functionalComponentArgsRest(__VLS_195));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        for (const [m, i] of __VLS_getVForSourceType((__VLS_ctx.chatMessages))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: ((i)),
                ...{ class: ("msg") },
                ...{ class: ((m.role)) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("bubble") },
            });
            (m.content);
        }
        if (__VLS_ctx.chatting) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("msg ai") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("bubble typing") },
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("chat-input") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.sendChat) },
            placeholder: ("输入消息，Enter 发送"),
        });
        (__VLS_ctx.chatInput);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.sendChat) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.chatting)),
        });
    }
    else if (__VLS_ctx.selected.key === 'gpt_image') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-gpt-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gpt-image-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        if (__VLS_ctx.drawUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.startNewGptImage) },
                ...{ class: ("gpt-new-image") },
            });
            const __VLS_200 = {}.Sparkles;
            /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
            // @ts-ignore
            const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
                size: ((15)),
            }));
            const __VLS_202 = __VLS_201({
                size: ((15)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_201));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gpt-image-stage") },
        });
        if (!__VLS_ctx.drawHistory.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("gpt-image-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            const __VLS_206 = {}.Sparkles;
            /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
            // @ts-ignore
            const __VLS_207 = __VLS_asFunctionalComponent(__VLS_206, new __VLS_206({
                size: ((25)),
            }));
            const __VLS_208 = __VLS_207({
                size: ((25)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_207));
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("gpt-image-gallery") },
            });
            for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.drawHistory))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!((__VLS_ctx.selected.key === 'gpt_image')))
                                return;
                            if (!(!((!__VLS_ctx.drawHistory.length))))
                                return;
                            __VLS_ctx.selectDrawResult(item);
                        } },
                    key: ((item.url + i)),
                    ...{ class: ("gpt-image-card") },
                    ...{ class: (({ selected: item.url === __VLS_ctx.drawUrl })) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((item.url)),
                    alt: ((item.prompt)),
                });
                if (item.url === __VLS_ctx.drawUrl) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                }
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gpt-image-composer") },
        });
        if (__VLS_ctx.drawUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("gpt-editing-chip") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.drawUrl)),
                alt: ("当前参考图"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.startNewGptImage) },
                title: ("取消选中，生成全新图片"),
            });
            const __VLS_212 = {}.X;
            /** @type { [typeof __VLS_components.X, ] } */ ;
            // @ts-ignore
            const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
                size: ((14)),
            }));
            const __VLS_214 = __VLS_213({
                size: ((14)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_213));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            ...{ onKeydown: (__VLS_ctx.submitGptImage) },
            value: ((__VLS_ctx.gptImageInput)),
            rows: ("1"),
            placeholder: ((__VLS_ctx.drawUrl ? '告诉我需要怎样修改这张图片…' : '描述一张新图片…')),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gpt-composer-tools") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gpt-model-picker") },
        });
        const __VLS_218 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_219 = __VLS_asFunctionalComponent(__VLS_218, new __VLS_218({
            size: ((14)),
        }));
        const __VLS_220 = __VLS_219({
            size: ((14)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_219));
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: ((__VLS_ctx.drawModel)),
            'aria-label': ("生图模型"),
        });
        for (const [model] of __VLS_getVForSourceType((__VLS_ctx.drawModels))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: ((model.model_code)),
                value: ((model.model_code)),
            });
            (model.model_name || model.model_code);
        }
        if (__VLS_ctx.drawUsedModel) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("gpt-used-model") },
            });
            (__VLS_ctx.drawUsedModel);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.downloadDraw) },
            ...{ class: ("gpt-download") },
            disabled: ((!__VLS_ctx.drawUrl)),
            title: ("下载选中图片"),
        });
        const __VLS_224 = {}.Download;
        /** @type { [typeof __VLS_components.Download, ] } */ ;
        // @ts-ignore
        const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
            size: ((16)),
        }));
        const __VLS_226 = __VLS_225({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_225));
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitGptImage) },
            ...{ class: ("gpt-send") },
            disabled: ((__VLS_ctx.drawing || !__VLS_ctx.gptImageInput.trim())),
            title: ("生成图片"),
        });
        const __VLS_230 = {}.ArrowUp;
        /** @type { [typeof __VLS_components.ArrowUp, ] } */ ;
        // @ts-ignore
        const __VLS_231 = __VLS_asFunctionalComponent(__VLS_230, new __VLS_230({
            size: ((18)),
        }));
        const __VLS_232 = __VLS_231({
            size: ((18)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_231));
    }
    else if (['image', 'product_main'].includes(__VLS_ctx.selected.key)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_236 = {}.Palette;
        /** @type { [typeof __VLS_components.Palette, ] } */ ;
        // @ts-ignore
        const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
            size: ((17)),
        }));
        const __VLS_238 = __VLS_237({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_237));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.key === 'product_main' ? '商品主图' : __VLS_ctx.selected.key === 'gpt_image' ? 'GPT 图片生成' : 'AI 绘画');
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.selected.key === 'product_main' ? '商品图 · 电商视觉生成' : __VLS_ctx.selected.key === 'gpt_image' ? '提示词生图 · 选图修改 · 模型切换' : '文生图 · 模型后台配置');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: ({}) },
        });
        const __VLS_242 = {}.Palette;
        /** @type { [typeof __VLS_components.Palette, ] } */ ;
        // @ts-ignore
        const __VLS_243 = __VLS_asFunctionalComponent(__VLS_242, new __VLS_242({
            size: ((15)),
        }));
        const __VLS_244 = __VLS_243({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_243));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        if (__VLS_ctx.selected.key === 'image') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-mode") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'image')))
                            return;
                        __VLS_ctx.drawMode = 'text';
                    } },
                ...{ class: (({ picked: __VLS_ctx.drawMode === 'text' })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'image')))
                            return;
                        __VLS_ctx.drawMode = 'product';
                    } },
                ...{ class: (({ picked: __VLS_ctx.drawMode === 'product' })) },
            });
        }
        if (__VLS_ctx.drawMode === 'product') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.uploadProductImage) },
                id: ("product-image-file"),
                type: ("file"),
                accept: ("image/*"),
                ...{ style: ({}) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.openProductPicker) },
                ...{ class: ("media-upload compact") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            const __VLS_248 = {}.ImageIcon;
            /** @type { [typeof __VLS_components.ImageIcon, ] } */ ;
            // @ts-ignore
            const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
                size: ((18)),
            }));
            const __VLS_250 = __VLS_249({
                size: ((18)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_249));
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.productUploading ? '上传中…' : '上传商品图片');
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("product-thumbs") },
            });
            for (const [url] of __VLS_getVForSourceType((__VLS_ctx.productImageUrls))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    key: ((url)),
                    src: ((url)),
                    ...{ class: ("product-thumb") },
                    alt: ("商品图片"),
                });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("product-fields") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                placeholder: ("商品名称"),
            });
            (__VLS_ctx.productName);
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                placeholder: ("核心卖点，如：防水、耐用、轻便"),
            });
            (__VLS_ctx.productSellingPoints);
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                placeholder: ("目标人群"),
            });
            (__VLS_ctx.productAudience);
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                placeholder: ("使用场景"),
            });
            (__VLS_ctx.productScene);
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: ((__VLS_ctx.productStyle)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("size-row") },
            });
            for (const [n] of __VLS_getVForSourceType(([1, 2, 3, 4]))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.drawMode === 'product')))
                                return;
                            __VLS_ctx.productCount = n;
                        } },
                    key: ((n)),
                    ...{ class: ("size-btn") },
                    ...{ class: (({ picked: __VLS_ctx.productCount === n })) },
                });
                (n);
            }
        }
        if (__VLS_ctx.drawMode === 'product') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                            return;
                        if (!((__VLS_ctx.drawMode === 'product')))
                            return;
                        __VLS_ctx.productTemplateOpen = true;
                    } },
                ...{ class: ("selected-template-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("template-mini") },
                ...{ style: (({ '--tone': __VLS_ctx.selectedProductTemplate.tone, '--accent': __VLS_ctx.selectedProductTemplate.accent })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.selectedProductTemplate.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.selectedProductTemplate.category);
            (__VLS_ctx.selectedProductTemplate.ratio);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                type: ("button"),
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.drawPrompt)),
            placeholder: ((__VLS_ctx.selected.key === 'product_main' ? '填写商品卖点、目标人群、使用场景、价格和画面要求' : '描述你想生成的画面，如：赛博朋克风格的未来城市夜景，霓虹灯，雨夜')),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: ((__VLS_ctx.drawModel)),
            ...{ class: ("model-select") },
        });
        for (const [model] of __VLS_getVForSourceType((__VLS_ctx.drawModels))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: ((model.model_code)),
                value: ((model.model_code)),
            });
            (model.model_name || model.model_code);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("skill-route") },
        });
        const __VLS_254 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_255 = __VLS_asFunctionalComponent(__VLS_254, new __VLS_254({
            size: ((15)),
        }));
        const __VLS_256 = __VLS_255({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_255));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.drawUsedModel ? `图片生成 Skill · ${__VLS_ctx.drawUsedModel}` : `图片生成 Skill · ${__VLS_ctx.drawModel || '后台默认路由'}`);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.drawUsedModel ? '本次请求实际使用的模型' : '仅显示后台已启用的绘图模型');
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("size-row") },
        });
        for (const [s] of __VLS_getVForSourceType((['1024x1024', '768x1024', '1024x768']))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                            return;
                        __VLS_ctx.drawSize = s;
                    } },
                key: ((s)),
                ...{ class: ("size-btn") },
                ...{ class: (({ picked: __VLS_ctx.drawSize === s })) },
            });
            (s);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.doDraw) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.drawing)),
        });
        const __VLS_260 = {}.Palette;
        /** @type { [typeof __VLS_components.Palette, ] } */ ;
        // @ts-ignore
        const __VLS_261 = __VLS_asFunctionalComponent(__VLS_260, new __VLS_260({
            size: ((16)),
        }));
        const __VLS_262 = __VLS_261({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_261));
        (__VLS_ctx.drawing ? '生成中…' : (__VLS_ctx.drawMode === 'product' ? `开始生成 ${__VLS_ctx.productCount} 张` : '开始绘画'));
        if (__VLS_ctx.drawMode === 'product') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({
                ...{ class: ("gen-cost") },
            });
            (__VLS_ctx.selectedCost * __VLS_ctx.productCount);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel") },
        });
        if (__VLS_ctx.drawMode === 'product' && __VLS_ctx.productResults.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("product-result-section") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("product-result-head") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.productResults.length);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("product-result-grid") },
            });
            for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.productResults))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.drawMode === 'product' && __VLS_ctx.productResults.length)))
                                return;
                            __VLS_ctx.selectDrawResult(item);
                        } },
                    key: ((item.url + i)),
                    ...{ class: (({ picked: item.url === __VLS_ctx.drawUrl })) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((item.url)),
                    alt: ((`商品主图 ${i + 1}`)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (item.url === __VLS_ctx.drawUrl ? '已选中' : `第 ${i + 1} 张`);
            }
        }
        else if (__VLS_ctx.drawUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.previewDraw) },
                ...{ class: ("draw-preview-trigger") },
                title: ("点击放大预览"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.drawUrl)),
                ...{ class: ("draw-img") },
                alt: ("AI 绘画结果"),
            });
        }
        if (__VLS_ctx.drawUrl && __VLS_ctx.drawUsedModel) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("model-result") },
            });
            (__VLS_ctx.drawUsedModel);
        }
        if (__VLS_ctx.drawUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-actions") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.previewDraw) },
                ...{ class: ("ghost-btn") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.downloadDraw) },
                ...{ class: ("ghost-btn") },
            });
        }
        if (__VLS_ctx.drawUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-revise") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-revise-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.drawMode === 'product' ? '基于选中图片继续生成' : '按提示修改当前图片');
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.drawMode === 'product' ? '新图片会追加到上方，原图不会被覆盖' : '保持未指定内容不变');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-revise-row") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onKeyup: (__VLS_ctx.reviseDraw) },
                placeholder: ("输入修改要求，如：换成厨房场景，保留商品主体"),
            });
            (__VLS_ctx.drawRevisePrompt);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.reviseDraw) },
                ...{ class: ("ghost-btn") },
                disabled: ((__VLS_ctx.revisingDraw)),
            });
            (__VLS_ctx.revisingDraw ? '生成中…' : '生成新图');
        }
        if (__VLS_ctx.drawHistory.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-history") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-history-head") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.drawHistory.length);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("draw-history-grid") },
            });
            for (const [item, i] of __VLS_getVForSourceType((__VLS_ctx.drawHistory))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!((['image', 'product_main'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.drawHistory.length)))
                                return;
                            __VLS_ctx.selectDrawResult(item);
                        } },
                    key: ((item.createdAt + i)),
                    ...{ class: (({ picked: item.url === __VLS_ctx.drawUrl })) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((item.url)),
                    alt: ("历史生成结果"),
                });
            }
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_266 = {}.Palette;
            /** @type { [typeof __VLS_components.Palette, ] } */ ;
            // @ts-ignore
            const __VLS_267 = __VLS_asFunctionalComponent(__VLS_266, new __VLS_266({
                size: ((26)),
            }));
            const __VLS_268 = __VLS_267({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_267));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.drawModels.length ? '填写要求并开始生成' : '需要后台配置绘图模型（capability=draw）');
        }
    }
    else if (__VLS_ctx.selected.key === 'video') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-video") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_272 = {}.Video;
        /** @type { [typeof __VLS_components.Video, ] } */ ;
        // @ts-ignore
        const __VLS_273 = __VLS_asFunctionalComponent(__VLS_272, new __VLS_272({
            size: ((17)),
        }));
        const __VLS_274 = __VLS_273({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_273));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: ({}) },
        });
        const __VLS_278 = {}.Video;
        /** @type { [typeof __VLS_components.Video, ] } */ ;
        // @ts-ignore
        const __VLS_279 = __VLS_asFunctionalComponent(__VLS_278, new __VLS_278({
            size: ((15)),
        }));
        const __VLS_280 = __VLS_279({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_279));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.videoPrompt)),
            placeholder: ("描述视频内容，如：一只橘猫在窗台上晒太阳，阳光洒落，温馨治愈"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(!((__VLS_ctx.selected.key === 'home'))))
                        return;
                    if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                        return;
                    if (!(!((__VLS_ctx.selected.key === 'chat'))))
                        return;
                    if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                        return;
                    if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                        return;
                    if (!((__VLS_ctx.selected.key === 'video')))
                        return;
                    __VLS_ctx.uploadVideoImage($event, 1);
                } },
            id: ("video-image-1"),
            type: ("file"),
            accept: ("image/*"),
            ...{ style: ({}) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.selected.key === 'home'))))
                        return;
                    if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                        return;
                    if (!(!((__VLS_ctx.selected.key === 'chat'))))
                        return;
                    if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                        return;
                    if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                        return;
                    if (!((__VLS_ctx.selected.key === 'video')))
                        return;
                    __VLS_ctx.openVideoPicker('video-image-1');
                } },
            ...{ class: ("media-upload compact") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        const __VLS_284 = {}.ImageIcon;
        /** @type { [typeof __VLS_components.ImageIcon, ] } */ ;
        // @ts-ignore
        const __VLS_285 = __VLS_asFunctionalComponent(__VLS_284, new __VLS_284({
            size: ((18)),
        }));
        const __VLS_286 = __VLS_285({
            size: ((18)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_285));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.videoImageUrl ? '首帧已上传' : '上传首帧图片');
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        if (__VLS_ctx.videoImageUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'video')))
                            return;
                        if (!((__VLS_ctx.videoImageUrl)))
                            return;
                        __VLS_ctx.uploadVideoImage($event, 2);
                    } },
                id: ("video-image-2"),
                type: ("file"),
                accept: ("image/*"),
                ...{ style: ({}) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'video')))
                            return;
                        if (!((__VLS_ctx.videoImageUrl)))
                            return;
                        __VLS_ctx.openVideoPicker('video-image-2');
                    } },
                ...{ class: ("media-upload compact") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            const __VLS_290 = {}.ImageIcon;
            /** @type { [typeof __VLS_components.ImageIcon, ] } */ ;
            // @ts-ignore
            const __VLS_291 = __VLS_asFunctionalComponent(__VLS_290, new __VLS_290({
                size: ((18)),
            }));
            const __VLS_292 = __VLS_291({
                size: ((18)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_291));
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.videoImageUrl2 ? '尾帧已上传' : '上传尾帧图片');
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("skill-route") },
        });
        const __VLS_296 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_297 = __VLS_asFunctionalComponent(__VLS_296, new __VLS_296({
            size: ((15)),
        }));
        const __VLS_298 = __VLS_297({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_297));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.doVideo) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.videoGenerating)),
        });
        const __VLS_302 = {}.Video;
        /** @type { [typeof __VLS_components.Video, ] } */ ;
        // @ts-ignore
        const __VLS_303 = __VLS_asFunctionalComponent(__VLS_302, new __VLS_302({
            size: ((16)),
        }));
        const __VLS_304 = __VLS_303({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_303));
        (__VLS_ctx.videoGenerating ? '生成中（约1-3分钟）…' : '生成视频');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel") },
        });
        if (__VLS_ctx.videoUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
                src: ((__VLS_ctx.videoUrl)),
                controls: (true),
                playsinline: (true),
                ...{ class: ("draw-img") },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_308 = {}.Video;
            /** @type { [typeof __VLS_components.Video, ] } */ ;
            // @ts-ignore
            const __VLS_309 = __VLS_asFunctionalComponent(__VLS_308, new __VLS_308({
                size: ((26)),
            }));
            const __VLS_310 = __VLS_309({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_309));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        }
    }
    else if (__VLS_ctx.selected.key === 'tts') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-tts") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_314 = {}.AudioLines;
        /** @type { [typeof __VLS_components.AudioLines, ] } */ ;
        // @ts-ignore
        const __VLS_315 = __VLS_asFunctionalComponent(__VLS_314, new __VLS_314({
            size: ((17)),
        }));
        const __VLS_316 = __VLS_315({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_315));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: ({}) },
        });
        const __VLS_320 = {}.AudioLines;
        /** @type { [typeof __VLS_components.AudioLines, ] } */ ;
        // @ts-ignore
        const __VLS_321 = __VLS_asFunctionalComponent(__VLS_320, new __VLS_320({
            size: ((15)),
        }));
        const __VLS_322 = __VLS_321({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_321));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.ttsText)),
            maxlength: ("3000"),
            placeholder: ("输入要转语音的文案，如：大家好，今天给大家分享一个实用的小技巧…"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("char-count") },
        });
        (__VLS_ctx.ttsText.length);
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: ((__VLS_ctx.ttsVoice)),
            ...{ class: ("model-select") },
        });
        for (const [v] of __VLS_getVForSourceType((__VLS_ctx.TTS_VOICES))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: ((v.id)),
                value: ((v.id)),
            });
            (v.name);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.doTts) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.ttsGenerating)),
        });
        const __VLS_326 = {}.AudioLines;
        /** @type { [typeof __VLS_components.AudioLines, ] } */ ;
        // @ts-ignore
        const __VLS_327 = __VLS_asFunctionalComponent(__VLS_326, new __VLS_326({
            size: ((16)),
        }));
        const __VLS_328 = __VLS_327({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_327));
        (__VLS_ctx.ttsGenerating ? '生成中…' : '生成配音');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel") },
        });
        if (__VLS_ctx.ttsUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-top") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.audio, __VLS_intrinsicElements.audio)({
                src: ((__VLS_ctx.ttsUrl)),
                controls: (true),
                ...{ class: ("tts-audio") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: ((__VLS_ctx.ttsUrl)),
                download: (true),
                ...{ class: ("ghost-btn") },
                ...{ style: ({}) },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_332 = {}.AudioLines;
            /** @type { [typeof __VLS_components.AudioLines, ] } */ ;
            // @ts-ignore
            const __VLS_333 = __VLS_asFunctionalComponent(__VLS_332, new __VLS_332({
                size: ((26)),
            }));
            const __VLS_334 = __VLS_333({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_333));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        }
    }
    else if (['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key)) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['workspace', 'workspace-media', `workspace-${__VLS_ctx.selected.key}`])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: (({ background: __VLS_ctx.selected.color + '22', color: __VLS_ctx.selected.color })) },
        });
        const __VLS_338 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_339 = __VLS_asFunctionalComponent(__VLS_338, new __VLS_338({
            size: ((17)),
        }));
        const __VLS_340 = __VLS_339({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_339));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.selected.sub);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: (({ background: __VLS_ctx.selected.color + '16', color: __VLS_ctx.selected.color })) },
        });
        const __VLS_344 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_345 = __VLS_asFunctionalComponent(__VLS_344, new __VLS_344({
            size: ((16)),
        }));
        const __VLS_346 = __VLS_345({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_345));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        if (__VLS_ctx.selected.key !== 'music') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
            (__VLS_ctx.selected.key === 'voice_clone' ? '参考声音' : __VLS_ctx.selected.key === 'face_merge' ? '第一张人脸照片' : '参考人物照片');
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'video'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'tts'))))
                            return;
                        if (!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key))))
                            return;
                        if (!((__VLS_ctx.selected.key !== 'music')))
                            return;
                        __VLS_ctx.uploadMediaFile($event, 1);
                    } },
                id: ("media-file-1"),
                type: ("file"),
                accept: ((__VLS_ctx.selected.key === 'voice_clone' ? 'audio/*' : 'image/*')),
                ...{ style: ({}) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'video'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'tts'))))
                            return;
                        if (!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key))))
                            return;
                        if (!((__VLS_ctx.selected.key !== 'music')))
                            return;
                        __VLS_ctx.openMediaPicker('media-file-1');
                    } },
                ...{ class: ("media-upload") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            if (__VLS_ctx.selected.key !== 'voice_clone') {
                const __VLS_350 = {}.ImageIcon;
                /** @type { [typeof __VLS_components.ImageIcon, ] } */ ;
                // @ts-ignore
                const __VLS_351 = __VLS_asFunctionalComponent(__VLS_350, new __VLS_350({
                    size: ((18)),
                }));
                const __VLS_352 = __VLS_351({
                    size: ((18)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_351));
            }
            else {
                const __VLS_356 = {}.AudioLines;
                /** @type { [typeof __VLS_components.AudioLines, ] } */ ;
                // @ts-ignore
                const __VLS_357 = __VLS_asFunctionalComponent(__VLS_356, new __VLS_356({
                    size: ((18)),
                }));
                const __VLS_358 = __VLS_357({
                    size: ((18)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_357));
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.mediaInputUrl ? '素材已上传' : '点击上传参考素材');
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.selected.key === 'voice_clone' ? 'MP3 / WAV，建议 10-60 秒' : 'JPG / PNG，建议正面清晰照片');
            if (__VLS_ctx.selected.key === 'face_merge') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                    ...{ onChange: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'video'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'tts'))))
                                return;
                            if (!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.selected.key !== 'music')))
                                return;
                            if (!((__VLS_ctx.selected.key === 'face_merge')))
                                return;
                            __VLS_ctx.uploadMediaFile($event, 2);
                        } },
                    id: ("media-file-2"),
                    type: ("file"),
                    accept: ("image/*"),
                    ...{ style: ({}) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'video'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'tts'))))
                                return;
                            if (!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key))))
                                return;
                            if (!((__VLS_ctx.selected.key !== 'music')))
                                return;
                            if (!((__VLS_ctx.selected.key === 'face_merge')))
                                return;
                            __VLS_ctx.openMediaPicker('media-file-2');
                        } },
                    ...{ class: ("media-upload compact") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                const __VLS_362 = {}.ScanFace;
                /** @type { [typeof __VLS_components.ScanFace, ] } */ ;
                // @ts-ignore
                const __VLS_363 = __VLS_asFunctionalComponent(__VLS_362, new __VLS_362({
                    size: ((18)),
                }));
                const __VLS_364 = __VLS_363({
                    size: ((18)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_363));
                __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
                (__VLS_ctx.mediaInputUrl2 ? '第二张照片已上传' : '上传第二张照片');
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        (__VLS_ctx.selected.key === 'music' ? '歌曲主题与风格' : __VLS_ctx.selected.key === 'voice_clone' ? '试听台词' : '动作与口播内容');
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.mediaPrompt)),
            maxlength: ("3000"),
            placeholder: ((__VLS_ctx.selected.key === 'music' ? '例如：轻快治愈的中文流行歌曲，女声，夏日旅行主题，包含主歌和副歌' : __VLS_ctx.selected.key === 'voice_clone' ? '输入生成克隆声音后用于试听的台词' : '描述希望人物说的话、动作、表情和画面风格')),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("char-count") },
        });
        (__VLS_ctx.mediaPrompt.length);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("skill-route") },
        });
        const __VLS_368 = {}.Sparkles;
        /** @type { [typeof __VLS_components.Sparkles, ] } */ ;
        // @ts-ignore
        const __VLS_369 = __VLS_asFunctionalComponent(__VLS_368, new __VLS_368({
            size: ((15)),
        }));
        const __VLS_370 = __VLS_369({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_369));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.currentMediaModels.length ? '由后台 Skill 自动选择可用模型' : '后台尚未配置可用模型');
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.doMedia) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.mediaGenerating || !__VLS_ctx.currentMediaModels.length)),
        });
        const __VLS_374 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_375 = __VLS_asFunctionalComponent(__VLS_374, new __VLS_374({
            size: ((16)),
        }));
        const __VLS_376 = __VLS_375({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_375));
        (__VLS_ctx.mediaGenerating ? '生成处理中…' : __VLS_ctx.currentMediaModels.length ? `开始${__VLS_ctx.selected.title}` : '等待后台配置模型');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel media-result") },
        });
        if (__VLS_ctx.mediaResultUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-top") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            (__VLS_ctx.selected.title);
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            if (['music', 'voice_clone'].includes(__VLS_ctx.selected.key)) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.audio, __VLS_intrinsicElements.audio)({
                    src: ((__VLS_ctx.mediaResultUrl)),
                    controls: (true),
                    ...{ class: ("tts-audio") },
                });
            }
            else if (__VLS_ctx.selected.key === 'face_merge') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.mediaResultUrl)),
                    ...{ class: ("draw-img") },
                    alt: ("生成结果"),
                });
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
                    src: ((__VLS_ctx.mediaResultUrl)),
                    controls: (true),
                    playsinline: (true),
                    ...{ class: ("draw-img") },
                });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: ((__VLS_ctx.mediaResultUrl)),
                target: ("_blank"),
                ...{ class: ("ghost-btn media-download") },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_380 = ((__VLS_ctx.selected.icon));
            // @ts-ignore
            const __VLS_381 = __VLS_asFunctionalComponent(__VLS_380, new __VLS_380({
                size: ((26)),
            }));
            const __VLS_382 = __VLS_381({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_381));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.currentMediaModels.length ? `${__VLS_ctx.selected.title}结果会显示在这里` : '后台尚未配置此类模型');
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.currentMediaModels.length ? '提交后可离开页面，任务会保存在我的作品' : `需要添加 capability=${__VLS_ctx.selected.needCap} 的模型`);
        }
    }
    else if (__VLS_ctx.selected.key === 'works') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-works") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_386 = {}.FolderOpen;
        /** @type { [typeof __VLS_components.FolderOpen, ] } */ ;
        // @ts-ignore
        const __VLS_387 = __VLS_asFunctionalComponent(__VLS_386, new __VLS_386({
            size: ((17)),
        }));
        const __VLS_388 = __VLS_387({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_387));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("works-grid") },
        });
        for (const [w] of __VLS_getVForSourceType((__VLS_ctx.works))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: ((w.task_no)),
                ...{ class: ("work-card tilt") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("tag") },
            });
            (__VLS_ctx.featureLabel(w.feature_code));
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            ((w.result_body || w.request_body || '').slice(0, 80));
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (w.status);
            (w.create_time);
            (w.credits_cost);
        }
        if (__VLS_ctx.works.length === 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty") },
                ...{ style: ({}) },
            });
            const __VLS_392 = {}.FolderOpen;
            /** @type { [typeof __VLS_components.FolderOpen, ] } */ ;
            // @ts-ignore
            const __VLS_393 = __VLS_asFunctionalComponent(__VLS_392, new __VLS_392({
                size: ((40)),
                opacity: (".3"),
            }));
            const __VLS_394 = __VLS_393({
                size: ((40)),
                opacity: (".3"),
            }, ...__VLS_functionalComponentArgsRest(__VLS_393));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
    }
    else if (__VLS_ctx.selected.key === 'materials') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-materials") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_398 = {}.Layers;
        /** @type { [typeof __VLS_components.Layers, ] } */ ;
        // @ts-ignore
        const __VLS_399 = __VLS_asFunctionalComponent(__VLS_398, new __VLS_398({
            size: ((17)),
        }));
        const __VLS_400 = __VLS_399({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_399));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("works-grid") },
        });
        for (const [m] of __VLS_getVForSourceType((__VLS_ctx.materials))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: ((m.id)),
                ...{ class: ("material-card tilt") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((m.url)),
                alt: ("素材"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("mat-actions") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'video'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'tts'))))
                            return;
                        if (!(!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'works'))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'materials')))
                            return;
                        __VLS_ctx.useMaterial(m.url);
                    } },
                ...{ class: ("ghost-btn") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.selected.key === 'home'))))
                            return;
                        if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'chat'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                            return;
                        if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'video'))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'tts'))))
                            return;
                        if (!(!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key)))))
                            return;
                        if (!(!((__VLS_ctx.selected.key === 'works'))))
                            return;
                        if (!((__VLS_ctx.selected.key === 'materials')))
                            return;
                        __VLS_ctx.delMaterial(m.id);
                    } },
                ...{ class: ("ghost-btn danger") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (m.create_time);
        }
        if (__VLS_ctx.materials.length === 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty") },
                ...{ style: ({}) },
            });
            const __VLS_404 = {}.Layers;
            /** @type { [typeof __VLS_components.Layers, ] } */ ;
            // @ts-ignore
            const __VLS_405 = __VLS_asFunctionalComponent(__VLS_404, new __VLS_404({
                size: ((40)),
                opacity: (".3"),
            }));
            const __VLS_406 = __VLS_405({
                size: ((40)),
                opacity: (".3"),
            }, ...__VLS_functionalComponentArgsRest(__VLS_405));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
    }
    else if (__VLS_ctx.selected.key === 'template_edit') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace workspace-template") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: ({}) },
        });
        const __VLS_410 = {}.Clapperboard;
        /** @type { [typeof __VLS_components.Clapperboard, ] } */ ;
        // @ts-ignore
        const __VLS_411 = __VLS_asFunctionalComponent(__VLS_410, new __VLS_410({
            size: ((17)),
        }));
        const __VLS_412 = __VLS_411({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_411));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-panel") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("panel-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("panel-icon") },
            ...{ style: ({}) },
        });
        const __VLS_416 = {}.Clapperboard;
        /** @type { [typeof __VLS_components.Clapperboard, ] } */ ;
        // @ts-ignore
        const __VLS_417 = __VLS_asFunctionalComponent(__VLS_416, new __VLS_416({
            size: ((15)),
        }));
        const __VLS_418 = __VLS_417({
            size: ((15)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_417));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        (__VLS_ctx.composeImgs.length);
        if (__VLS_ctx.materials.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("mat-picker") },
            });
            for (const [m] of __VLS_getVForSourceType((__VLS_ctx.materials))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.selected.key === 'home'))))
                                return;
                            if (!(!((!__VLS_ctx.selected.needCap && !['chat', 'works', 'tts'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'chat'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'gpt_image'))))
                                return;
                            if (!(!((['image', 'product_main'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'video'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'tts'))))
                                return;
                            if (!(!((['music', 'avatar_clone', 'voice_clone', 'face_merge', 'photo_dh'].includes(__VLS_ctx.selected.key)))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'works'))))
                                return;
                            if (!(!((__VLS_ctx.selected.key === 'materials'))))
                                return;
                            if (!((__VLS_ctx.selected.key === 'template_edit')))
                                return;
                            if (!((__VLS_ctx.materials.length)))
                                return;
                            __VLS_ctx.toggleComposeImg(m.url);
                        } },
                    key: ((m.id)),
                    ...{ class: ("mat-pick") },
                    ...{ class: (({ picked: __VLS_ctx.composeImgs.includes(m.url) })) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((m.url)),
                    alt: ("素材"),
                });
                if (__VLS_ctx.composeImgs.includes(m.url)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("pick-ok") },
                    });
                }
            }
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty") },
                ...{ style: ({}) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.composeText)),
            maxlength: ("3000"),
            placeholder: ("输入视频旁白文案，如：今天带大家看看这家宝藏咖啡店…"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("char-count") },
        });
        (__VLS_ctx.composeText.length);
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: ((__VLS_ctx.composeVoice)),
            ...{ class: ("model-select") },
        });
        for (const [v] of __VLS_getVForSourceType((__VLS_ctx.TTS_VOICES))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: ((v.id)),
                value: ((v.id)),
            });
            (v.name);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.doCompose) },
            ...{ class: ("gen-btn") },
            disabled: ((__VLS_ctx.composing)),
        });
        const __VLS_422 = {}.Clapperboard;
        /** @type { [typeof __VLS_components.Clapperboard, ] } */ ;
        // @ts-ignore
        const __VLS_423 = __VLS_asFunctionalComponent(__VLS_422, new __VLS_422({
            size: ((16)),
        }));
        const __VLS_424 = __VLS_423({
            size: ((16)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_423));
        (__VLS_ctx.composing ? '合成中（约1分钟）…' : '一键成片');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("result-panel") },
        });
        if (__VLS_ctx.composeUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-top") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
                src: ((__VLS_ctx.composeUrl)),
                controls: (true),
                playsinline: (true),
                ...{ class: ("draw-img") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: ((__VLS_ctx.composeUrl)),
                download: (true),
                ...{ class: ("ghost-btn") },
                ...{ style: ({}) },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty result-empty") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("empty-icon") },
            });
            const __VLS_428 = {}.Clapperboard;
            /** @type { [typeof __VLS_components.Clapperboard, ] } */ ;
            // @ts-ignore
            const __VLS_429 = __VLS_asFunctionalComponent(__VLS_428, new __VLS_428({
                size: ((26)),
            }));
            const __VLS_430 = __VLS_429({
                size: ((26)),
            }, ...__VLS_functionalComponentArgsRest(__VLS_429));
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("workspace") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-head") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tool-icon sm") },
            ...{ style: (({ background: __VLS_ctx.selected.color + '22', color: __VLS_ctx.selected.color })) },
        });
        const __VLS_434 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_435 = __VLS_asFunctionalComponent(__VLS_434, new __VLS_434({
            size: ((17)),
        }));
        const __VLS_436 = __VLS_435({
            size: ((17)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_435));
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.selected.title);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (__VLS_ctx.selected.sub);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("ws-body") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("empty") },
            ...{ style: ({}) },
        });
        const __VLS_440 = ((__VLS_ctx.selected.icon));
        // @ts-ignore
        const __VLS_441 = __VLS_asFunctionalComponent(__VLS_440, new __VLS_440({
            size: ((50)),
            opacity: (".3"),
        }));
        const __VLS_442 = __VLS_441({
            size: ((50)),
            opacity: (".3"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_441));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    }
    const __VLS_446 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_447 = __VLS_asFunctionalComponent(__VLS_446, new __VLS_446({
        modelValue: ((__VLS_ctx.drawPreviewOpen)),
        title: ("图片预览"),
        width: ("min(92vw, 900px)"),
        ...{ class: ("draw-preview-dialog") },
        destroyOnClose: (true),
    }));
    const __VLS_448 = __VLS_447({
        modelValue: ((__VLS_ctx.drawPreviewOpen)),
        title: ("图片预览"),
        width: ("min(92vw, 900px)"),
        ...{ class: ("draw-preview-dialog") },
        destroyOnClose: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_447));
    if (__VLS_ctx.drawUrl) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.drawUrl)),
            ...{ class: ("draw-preview-img") },
            alt: ("图片预览"),
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { footer: __VLS_thisSlot } = __VLS_451.slots;
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.downloadDraw) },
            ...{ class: ("ghost-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.drawPreviewOpen = false;
                } },
            ...{ class: ("gen-btn") },
        });
    }
    var __VLS_451;
    const __VLS_452 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_453 = __VLS_asFunctionalComponent(__VLS_452, new __VLS_452({
        modelValue: ((__VLS_ctx.productTemplateOpen)),
        title: ("选择商品主图模板"),
        width: ("min(94vw, 980px)"),
        ...{ class: ("product-template-dialog") },
        destroyOnClose: (true),
    }));
    const __VLS_454 = __VLS_453({
        modelValue: ((__VLS_ctx.productTemplateOpen)),
        title: ("选择商品主图模板"),
        width: ("min(94vw, 980px)"),
        ...{ class: ("product-template-dialog") },
        destroyOnClose: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_453));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("template-filter-row") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [x] of __VLS_getVForSourceType((['商品主图', '全部模板', '日常主图', '活动主图', '主图图标', '跨境电商主图', '外卖平台主图']))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.productTemplateType = x;
                } },
            key: ((x)),
            ...{ class: (({ picked: __VLS_ctx.productTemplateType === x })) },
        });
        (x);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("template-filter-row") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [x] of __VLS_getVForSourceType((['全部', '服饰箱包', '美容美妆', '数码家电', '食品', '家居百货', '生鲜', '母婴亲子', '五金工程', '休闲饮品', '珠宝首饰', '宠物', '户外运动', '家具建材', '跨境出口']))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.productTemplateCategory = x;
                } },
            key: ((x)),
            ...{ class: (({ picked: __VLS_ctx.productTemplateCategory === x })) },
        });
        (x);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("template-filter-row") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [x] of __VLS_getVForSourceType((['全部', '3:4', '1:1', '2:3']))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.productTemplateRatio = x;
                } },
            key: ((x)),
            ...{ class: (({ picked: __VLS_ctx.productTemplateRatio === x })) },
        });
        (x === '全部' ? '全部' : `商品主图(${x})`);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("template-result-count") },
    });
    (__VLS_ctx.filteredProductTemplates.length);
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("template-library-grid") },
    });
    for (const [tpl] of __VLS_getVForSourceType((__VLS_ctx.filteredProductTemplates))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.chooseProductTemplate(tpl);
                } },
            key: ((tpl.id)),
            ...{ class: ("template-library-card") },
            ...{ class: (({ picked: __VLS_ctx.selectedProductTemplateId === tpl.id })) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("template-art") },
            ...{ style: (({ '--tone': tpl.tone, '--accent': tpl.accent })) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("template-product") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("template-copy") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
        (tpl.ratio);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("template-meta") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (tpl.name);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (tpl.category);
        (tpl.scene);
    }
    __VLS_457.slots.default;
    var __VLS_457;
    const __VLS_458 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_459 = __VLS_asFunctionalComponent(__VLS_458, new __VLS_458({
        modelValue: ((__VLS_ctx.loginOpen)),
        width: ("400px"),
        ...{ class: ("auth-dialog") },
    }));
    const __VLS_460 = __VLS_459({
        modelValue: ((__VLS_ctx.loginOpen)),
        width: ("400px"),
        ...{ class: ("auth-dialog") },
    }, ...__VLS_functionalComponentArgsRest(__VLS_459));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("auth-hero") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("brand-mark big") },
    });
    const __VLS_464 = {}.Zap;
    /** @type { [typeof __VLS_components.Zap, ] } */ ;
    // @ts-ignore
    const __VLS_465 = __VLS_asFunctionalComponent(__VLS_464, new __VLS_464({
        size: ((26)),
    }));
    const __VLS_466 = __VLS_465({
        size: ((26)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_465));
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.loginMode === 'login' ? '登录后使用完整 AI 创作能力' : '注册账号，开始创作');
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("auth-form") },
    });
    if (__VLS_ctx.loginMode === 'register') {
        const __VLS_470 = {}.ElInput;
        /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
        // @ts-ignore
        const __VLS_471 = __VLS_asFunctionalComponent(__VLS_470, new __VLS_470({
            modelValue: ((__VLS_ctx.authEmail)),
            placeholder: ("邮箱"),
            size: ("large"),
        }));
        const __VLS_472 = __VLS_471({
            modelValue: ((__VLS_ctx.authEmail)),
            placeholder: ("邮箱"),
            size: ("large"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_471));
    }
    else {
        const __VLS_476 = {}.ElInput;
        /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
        // @ts-ignore
        const __VLS_477 = __VLS_asFunctionalComponent(__VLS_476, new __VLS_476({
            modelValue: ((__VLS_ctx.authUsername)),
            placeholder: ("邮箱"),
            size: ("large"),
        }));
        const __VLS_478 = __VLS_477({
            modelValue: ((__VLS_ctx.authUsername)),
            placeholder: ("邮箱"),
            size: ("large"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_477));
    }
    const __VLS_482 = {}.ElInput;
    /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
    // @ts-ignore
    const __VLS_483 = __VLS_asFunctionalComponent(__VLS_482, new __VLS_482({
        ...{ 'onKeyup': {} },
        modelValue: ((__VLS_ctx.authPassword)),
        type: ("password"),
        showPassword: (true),
        placeholder: ("密码"),
        size: ("large"),
    }));
    const __VLS_484 = __VLS_483({
        ...{ 'onKeyup': {} },
        modelValue: ((__VLS_ctx.authPassword)),
        type: ("password"),
        showPassword: (true),
        placeholder: ("密码"),
        size: ("large"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_483));
    let __VLS_488;
    const __VLS_489 = {
        onKeyup: (__VLS_ctx.doAuth)
    };
    let __VLS_485;
    let __VLS_486;
    var __VLS_487;
    if (__VLS_ctx.loginMode === 'register') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("code-row") },
        });
        const __VLS_490 = {}.ElInput;
        /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
        // @ts-ignore
        const __VLS_491 = __VLS_asFunctionalComponent(__VLS_490, new __VLS_490({
            ...{ 'onKeyup': {} },
            modelValue: ((__VLS_ctx.emailCode)),
            placeholder: ("邮箱验证码"),
            size: ("large"),
        }));
        const __VLS_492 = __VLS_491({
            ...{ 'onKeyup': {} },
            modelValue: ((__VLS_ctx.emailCode)),
            placeholder: ("邮箱验证码"),
            size: ("large"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_491));
        let __VLS_496;
        const __VLS_497 = {
            onKeyup: (__VLS_ctx.doAuth)
        };
        let __VLS_493;
        let __VLS_494;
        var __VLS_495;
        const __VLS_498 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_499 = __VLS_asFunctionalComponent(__VLS_498, new __VLS_498({
            ...{ 'onClick': {} },
            ...{ class: ("code-btn") },
            loading: ((__VLS_ctx.codeSending)),
            disabled: ((__VLS_ctx.codeCountdown > 0)),
        }));
        const __VLS_500 = __VLS_499({
            ...{ 'onClick': {} },
            ...{ class: ("code-btn") },
            loading: ((__VLS_ctx.codeSending)),
            disabled: ((__VLS_ctx.codeCountdown > 0)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_499));
        let __VLS_504;
        const __VLS_505 = {
            onClick: (__VLS_ctx.sendEmailCode)
        };
        let __VLS_501;
        let __VLS_502;
        (__VLS_ctx.codeCountdown > 0 ? `重新获取 ${__VLS_ctx.codeCountdown}s` : '获取验证码');
        __VLS_503.slots.default;
        var __VLS_503;
    }
    const __VLS_506 = {}.ElButton;
    /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
    // @ts-ignore
    const __VLS_507 = __VLS_asFunctionalComponent(__VLS_506, new __VLS_506({
        ...{ 'onClick': {} },
        type: ("primary"),
        size: ("large"),
        ...{ class: ("auth-btn") },
        loading: ((__VLS_ctx.authLoading)),
    }));
    const __VLS_508 = __VLS_507({
        ...{ 'onClick': {} },
        type: ("primary"),
        size: ("large"),
        ...{ class: ("auth-btn") },
        loading: ((__VLS_ctx.authLoading)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_507));
    let __VLS_512;
    const __VLS_513 = {
        onClick: (__VLS_ctx.doAuth)
    };
    let __VLS_509;
    let __VLS_510;
    (__VLS_ctx.loginMode === 'login' ? '登 录' : '注 册');
    __VLS_511.slots.default;
    var __VLS_511;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("auth-switch") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.loginMode === 'login' ? '还没有账号？' : '已有账号？');
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.loginMode = __VLS_ctx.loginMode === 'login' ? 'register' : 'login';
            } },
    });
    (__VLS_ctx.loginMode === 'login' ? '立即注册' : '去登录');
    __VLS_463.slots.default;
    var __VLS_463;
    const __VLS_514 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_515 = __VLS_asFunctionalComponent(__VLS_514, new __VLS_514({
        modelValue: ((__VLS_ctx.historyOpen)),
        width: ("760px"),
        ...{ class: ("history-dialog") },
        title: ("历史记录"),
    }));
    const __VLS_516 = __VLS_515({
        modelValue: ((__VLS_ctx.historyOpen)),
        width: ("760px"),
        ...{ class: ("history-dialog") },
        title: ("历史记录"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_515));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("history-body") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("history-list") },
    });
    for (const [w] of __VLS_getVForSourceType((__VLS_ctx.works))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.viewHistory(w);
                } },
            key: ((w.task_no)),
            ...{ class: ("history-item") },
            ...{ class: (({ picked: (w.result_body || w.error_message || '') === __VLS_ctx.historyDetail })) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("tag") },
        });
        (w.feature_code === 'video' ? '视频' : w.feature_code === 'image' ? '绘图' : '文案');
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        ((w.result_body || w.error_message || '(无内容)').slice(0, 60));
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (w.status);
        (w.create_time);
    }
    if (__VLS_ctx.works.length === 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("empty") },
            ...{ style: ({}) },
        });
        const __VLS_520 = {}.FolderOpen;
        /** @type { [typeof __VLS_components.FolderOpen, ] } */ ;
        // @ts-ignore
        const __VLS_521 = __VLS_asFunctionalComponent(__VLS_520, new __VLS_520({
            size: ((36)),
            opacity: (".3"),
        }));
        const __VLS_522 = __VLS_521({
            size: ((36)),
            opacity: (".3"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_521));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("history-detail") },
    });
    if (__VLS_ctx.historyDetail) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("hd-top") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.copyHistory) },
            ...{ class: ("ghost-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.continueFromHistory) },
            ...{ class: ("ghost-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("hd-text") },
        });
        (__VLS_ctx.historyDetail);
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("empty") },
        });
        const __VLS_526 = {}.History;
        /** @type { [typeof __VLS_components.History, ] } */ ;
        // @ts-ignore
        const __VLS_527 = __VLS_asFunctionalComponent(__VLS_526, new __VLS_526({
            size: ((36)),
            opacity: (".3"),
        }));
        const __VLS_528 = __VLS_527({
            size: ((36)),
            opacity: (".3"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_527));
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    __VLS_519.slots.default;
    var __VLS_519;
    const __VLS_532 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_533 = __VLS_asFunctionalComponent(__VLS_532, new __VLS_532({
        modelValue: ((__VLS_ctx.accountOpen)),
        width: ("820px"),
        ...{ class: ("account-dialog") },
        title: ("我的账户"),
    }));
    const __VLS_534 = __VLS_533({
        modelValue: ((__VLS_ctx.accountOpen)),
        width: ("820px"),
        ...{ class: ("account-dialog") },
        title: ("我的账户"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_533));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("account-summary") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.balance ?? 0);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.userName);
    const __VLS_538 = {}.ElButton;
    /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
    // @ts-ignore
    const __VLS_539 = __VLS_asFunctionalComponent(__VLS_538, new __VLS_538({
        ...{ 'onClick': {} },
        ...{ class: ("ghost-btn") },
        icon: ((__VLS_ctx.LogOut)),
    }));
    const __VLS_540 = __VLS_539({
        ...{ 'onClick': {} },
        ...{ class: ("ghost-btn") },
        icon: ((__VLS_ctx.LogOut)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_539));
    let __VLS_544;
    const __VLS_545 = {
        onClick: (...[$event]) => {
            __VLS_ctx.logout();
            __VLS_ctx.accountOpen = false;
        }
    };
    let __VLS_541;
    let __VLS_542;
    __VLS_543.slots.default;
    var __VLS_543;
    const __VLS_546 = {}.ElTabs;
    /** @type { [typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ] } */ ;
    // @ts-ignore
    const __VLS_547 = __VLS_asFunctionalComponent(__VLS_546, new __VLS_546({
        ...{ 'onTabChange': {} },
        modelValue: ((__VLS_ctx.accountTab)),
    }));
    const __VLS_548 = __VLS_547({
        ...{ 'onTabChange': {} },
        modelValue: ((__VLS_ctx.accountTab)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_547));
    let __VLS_552;
    const __VLS_553 = {
        onTabChange: (__VLS_ctx.loadAccountCenter)
    };
    let __VLS_549;
    let __VLS_550;
    const __VLS_554 = {}.ElTabPane;
    /** @type { [typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ] } */ ;
    // @ts-ignore
    const __VLS_555 = __VLS_asFunctionalComponent(__VLS_554, new __VLS_554({
        label: ("余额充值"),
        name: ("recharge"),
    }));
    const __VLS_556 = __VLS_555({
        label: ("余额充值"),
        name: ("recharge"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_555));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("payment-types") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_560 = {}.ElRadioGroup;
    /** @type { [typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ] } */ ;
    // @ts-ignore
    const __VLS_561 = __VLS_asFunctionalComponent(__VLS_560, new __VLS_560({
        modelValue: ((__VLS_ctx.paymentType)),
    }));
    const __VLS_562 = __VLS_561({
        modelValue: ((__VLS_ctx.paymentType)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_561));
    const __VLS_566 = {}.ElRadioButton;
    /** @type { [typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ] } */ ;
    // @ts-ignore
    const __VLS_567 = __VLS_asFunctionalComponent(__VLS_566, new __VLS_566({
        value: ("alipay"),
    }));
    const __VLS_568 = __VLS_567({
        value: ("alipay"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_567));
    __VLS_571.slots.default;
    var __VLS_571;
    const __VLS_572 = {}.ElRadioButton;
    /** @type { [typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ] } */ ;
    // @ts-ignore
    const __VLS_573 = __VLS_asFunctionalComponent(__VLS_572, new __VLS_572({
        value: ("wxpay"),
    }));
    const __VLS_574 = __VLS_573({
        value: ("wxpay"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_573));
    __VLS_577.slots.default;
    var __VLS_577;
    __VLS_565.slots.default;
    var __VLS_565;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("package-grid") },
    });
    for (const [pack] of __VLS_getVForSourceType((__VLS_ctx.packages))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.startRecharge(pack);
                } },
            key: ((pack.id)),
            ...{ class: ("package-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (pack.package_name);
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (pack.price);
        __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (pack.credits);
        __VLS_elementAsFunction(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
        (__VLS_ctx.rechargeLoading === pack.id ? '创建订单中…' : '立即充值');
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("custom-recharge") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_578 = {}.ElInputNumber;
    /** @type { [typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ] } */ ;
    // @ts-ignore
    const __VLS_579 = __VLS_asFunctionalComponent(__VLS_578, new __VLS_578({
        modelValue: ((__VLS_ctx.customAmount)),
        min: ((1)),
        max: ((10000)),
        step: ((10)),
        controlsPosition: ("right"),
        ...{ style: ({}) },
    }));
    const __VLS_580 = __VLS_579({
        modelValue: ((__VLS_ctx.customAmount)),
        min: ((1)),
        max: ((10000)),
        step: ((10)),
        controlsPosition: ("right"),
        ...{ style: ({}) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_579));
    const __VLS_584 = {}.ElButton;
    /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
    // @ts-ignore
    const __VLS_585 = __VLS_asFunctionalComponent(__VLS_584, new __VLS_584({
        ...{ 'onClick': {} },
        type: ("primary"),
        loading: ((__VLS_ctx.customRechargeLoading)),
    }));
    const __VLS_586 = __VLS_585({
        ...{ 'onClick': {} },
        type: ("primary"),
        loading: ((__VLS_ctx.customRechargeLoading)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_585));
    let __VLS_590;
    const __VLS_591 = {
        onClick: (__VLS_ctx.startCustomRecharge)
    };
    let __VLS_587;
    let __VLS_588;
    __VLS_589.slots.default;
    var __VLS_589;
    __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.customRate);
    __VLS_559.slots.default;
    var __VLS_559;
    const __VLS_592 = {}.ElTabPane;
    /** @type { [typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ] } */ ;
    // @ts-ignore
    const __VLS_593 = __VLS_asFunctionalComponent(__VLS_592, new __VLS_592({
        label: ("充值记录"),
        name: ("orders"),
    }));
    const __VLS_594 = __VLS_593({
        label: ("充值记录"),
        name: ("orders"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_593));
    const __VLS_598 = {}.ElTable;
    /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
    // @ts-ignore
    const __VLS_599 = __VLS_asFunctionalComponent(__VLS_598, new __VLS_598({
        data: ((__VLS_ctx.orders)),
        height: ("360"),
    }));
    const __VLS_600 = __VLS_599({
        data: ((__VLS_ctx.orders)),
        height: ("360"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_599));
    const __VLS_604 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_605 = __VLS_asFunctionalComponent(__VLS_604, new __VLS_604({
        prop: ("order_no"),
        label: ("订单号"),
        minWidth: ("200"),
    }));
    const __VLS_606 = __VLS_605({
        prop: ("order_no"),
        label: ("订单号"),
        minWidth: ("200"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_605));
    const __VLS_610 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_611 = __VLS_asFunctionalComponent(__VLS_610, new __VLS_610({
        prop: ("package_name"),
        label: ("套餐"),
    }));
    const __VLS_612 = __VLS_611({
        prop: ("package_name"),
        label: ("套餐"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_611));
    const __VLS_616 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_617 = __VLS_asFunctionalComponent(__VLS_616, new __VLS_616({
        prop: ("amount"),
        label: ("金额"),
        width: ("90"),
    }));
    const __VLS_618 = __VLS_617({
        prop: ("amount"),
        label: ("金额"),
        width: ("90"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_617));
    const __VLS_622 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_623 = __VLS_asFunctionalComponent(__VLS_622, new __VLS_622({
        prop: ("credits"),
        label: ("到账"),
        width: ("90"),
    }));
    const __VLS_624 = __VLS_623({
        prop: ("credits"),
        label: ("到账"),
        width: ("90"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_623));
    const __VLS_628 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_629 = __VLS_asFunctionalComponent(__VLS_628, new __VLS_628({
        prop: ("status"),
        label: ("状态"),
        width: ("100"),
    }));
    const __VLS_630 = __VLS_629({
        prop: ("status"),
        label: ("状态"),
        width: ("100"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_629));
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { default: __VLS_thisSlot } = __VLS_633.slots;
        const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
        const __VLS_634 = {}.ElTag;
        /** @type { [typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ] } */ ;
        // @ts-ignore
        const __VLS_635 = __VLS_asFunctionalComponent(__VLS_634, new __VLS_634({
            type: ((scope.row.status === 'PAID' ? 'success' : 'warning')),
        }));
        const __VLS_636 = __VLS_635({
            type: ((scope.row.status === 'PAID' ? 'success' : 'warning')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_635));
        (scope.row.status === 'PAID' ? '已支付' : '待支付');
        __VLS_639.slots.default;
        var __VLS_639;
    }
    var __VLS_633;
    const __VLS_640 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_641 = __VLS_asFunctionalComponent(__VLS_640, new __VLS_640({
        prop: ("create_time"),
        label: ("创建时间"),
        minWidth: ("160"),
    }));
    const __VLS_642 = __VLS_641({
        prop: ("create_time"),
        label: ("创建时间"),
        minWidth: ("160"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_641));
    __VLS_603.slots.default;
    var __VLS_603;
    __VLS_597.slots.default;
    var __VLS_597;
    const __VLS_646 = {}.ElTabPane;
    /** @type { [typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ] } */ ;
    // @ts-ignore
    const __VLS_647 = __VLS_asFunctionalComponent(__VLS_646, new __VLS_646({
        label: ("余额流水"),
        name: ("flows"),
    }));
    const __VLS_648 = __VLS_647({
        label: ("余额流水"),
        name: ("flows"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_647));
    const __VLS_652 = {}.ElTable;
    /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
    // @ts-ignore
    const __VLS_653 = __VLS_asFunctionalComponent(__VLS_652, new __VLS_652({
        data: ((__VLS_ctx.creditFlows)),
        height: ("360"),
    }));
    const __VLS_654 = __VLS_653({
        data: ((__VLS_ctx.creditFlows)),
        height: ("360"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_653));
    const __VLS_658 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_659 = __VLS_asFunctionalComponent(__VLS_658, new __VLS_658({
        prop: ("create_time"),
        label: ("时间"),
        minWidth: ("160"),
    }));
    const __VLS_660 = __VLS_659({
        prop: ("create_time"),
        label: ("时间"),
        minWidth: ("160"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_659));
    const __VLS_664 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_665 = __VLS_asFunctionalComponent(__VLS_664, new __VLS_664({
        prop: ("remark"),
        label: ("类型"),
    }));
    const __VLS_666 = __VLS_665({
        prop: ("remark"),
        label: ("类型"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_665));
    const __VLS_670 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_671 = __VLS_asFunctionalComponent(__VLS_670, new __VLS_670({
        prop: ("change_amount"),
        label: ("变动"),
        width: ("90"),
    }));
    const __VLS_672 = __VLS_671({
        prop: ("change_amount"),
        label: ("变动"),
        width: ("90"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_671));
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { default: __VLS_thisSlot } = __VLS_675.slots;
        const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
        __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
            ...{ class: ((scope.row.change_amount > 0 ? 'flow-plus' : 'flow-minus')) },
        });
        (scope.row.change_amount > 0 ? '+' : '');
        (scope.row.change_amount);
    }
    var __VLS_675;
    const __VLS_676 = {}.ElTableColumn;
    /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
    // @ts-ignore
    const __VLS_677 = __VLS_asFunctionalComponent(__VLS_676, new __VLS_676({
        prop: ("balance"),
        label: ("余额"),
        width: ("90"),
    }));
    const __VLS_678 = __VLS_677({
        prop: ("balance"),
        label: ("余额"),
        width: ("90"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_677));
    __VLS_657.slots.default;
    var __VLS_657;
    __VLS_651.slots.default;
    var __VLS_651;
    __VLS_551.slots.default;
    var __VLS_551;
    __VLS_537.slots.default;
    var __VLS_537;
    ['app', 'glow', 'topbar', 'mobile-menu', 'brand', 'brand-mark', 'top-search', 'top-right', 'balance-pill', 'ghost-btn', 'ghost-btn', 'user-chip', 'layout', 'mobile-backdrop', 'sidebar', 'is-open', 'nav-group', 'nav-item', 'active', 'soon', 'main', 'home', 'home-hero', 'hero-copy', 'eyebrow', 'hero-title', 'hero-sub', 'hero-actions', 'hero-primary', 'hero-secondary', 'hero-orbit', 'orbit-ring', 'ring-one', 'orbit-ring', 'ring-two', 'orbit-core', 'orbit-chip', 'chip-one', 'orbit-chip', 'chip-two', 'orbit-chip', 'chip-three', 'quick-start', 'section-label', 'eyebrow', 'section-note', 'quick-grid', 'quick-card', 'quick-copy', 'quick-icon', 'quick-arrow', 'quick-card', 'quick-chat', 'quick-icon', 'quick-arrow', 'quick-card', 'quick-image', 'quick-icon', 'quick-arrow', 'quick-card', 'quick-video', 'quick-icon', 'quick-arrow', 'tool-library', 'section-label', 'eyebrow', 'section-note', 'home-group', 'group-head', 'group-title', 'group-count', 'tool-grid', 'tool-card', 'tilt', 'tool-icon', 'workspace', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-actions', 'ghost-btn', 'ghost-btn', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'char-count', 'model-select', 'dir-tags', 'tag-row', 'dir-tag', 'picked', 'upload-row', 'ghost-btn', 'thumb', 'skill-route', 'gen-btn', 'result-panel', 'result-top', 'result-tabs', 'picked', 'result-img', 'result-text', 'revise-box', 'ghost-btn', 'empty', 'result-empty', 'empty-icon', 'workspace', 'chat-ws', 'workspace-chat', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'chat-box', 'chat-msgs', 'empty', 'msg', 'bubble', 'msg', 'ai', 'bubble', 'typing', 'chat-input', 'gen-btn', 'workspace', 'workspace-gpt-image', 'gpt-image-head', 'gpt-new-image', 'gpt-image-stage', 'gpt-image-empty', 'gpt-image-gallery', 'gpt-image-card', 'selected', 'gpt-image-composer', 'gpt-editing-chip', 'gpt-composer-tools', 'gpt-model-picker', 'gpt-used-model', 'gpt-download', 'gpt-send', 'workspace', 'workspace-image', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'draw-mode', 'picked', 'picked', 'media-upload', 'compact', 'product-thumbs', 'product-thumb', 'product-fields', 'size-row', 'size-btn', 'picked', 'selected-template-card', 'template-mini', 'model-select', 'skill-route', 'size-row', 'size-btn', 'picked', 'gen-btn', 'gen-cost', 'result-panel', 'product-result-section', 'product-result-head', 'product-result-grid', 'picked', 'draw-preview-trigger', 'draw-img', 'model-result', 'draw-actions', 'ghost-btn', 'ghost-btn', 'draw-revise', 'draw-revise-label', 'draw-revise-row', 'ghost-btn', 'draw-history', 'draw-history-head', 'draw-history-grid', 'picked', 'empty', 'result-empty', 'empty-icon', 'workspace', 'workspace-video', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'media-upload', 'compact', 'media-upload', 'compact', 'skill-route', 'gen-btn', 'result-panel', 'draw-img', 'empty', 'result-empty', 'empty-icon', 'workspace', 'workspace-tts', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'char-count', 'model-select', 'gen-btn', 'result-panel', 'result-top', 'tts-audio', 'ghost-btn', 'empty', 'result-empty', 'empty-icon', 'workspace', 'workspace-media', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'media-upload', 'media-upload', 'compact', 'char-count', 'skill-route', 'gen-btn', 'result-panel', 'media-result', 'result-top', 'tts-audio', 'draw-img', 'draw-img', 'ghost-btn', 'media-download', 'empty', 'result-empty', 'empty-icon', 'workspace', 'workspace-works', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'works-grid', 'work-card', 'tilt', 'tag', 'empty', 'workspace', 'workspace-materials', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'works-grid', 'material-card', 'tilt', 'mat-actions', 'ghost-btn', 'ghost-btn', 'danger', 'empty', 'workspace', 'workspace-template', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'form-panel', 'panel-head', 'panel-icon', 'mat-picker', 'mat-pick', 'picked', 'pick-ok', 'empty', 'char-count', 'model-select', 'gen-btn', 'result-panel', 'result-top', 'draw-img', 'ghost-btn', 'empty', 'result-empty', 'empty-icon', 'workspace', 'ws-head', 'ws-title', 'tool-icon', 'sm', 'ws-body', 'empty', 'draw-preview-dialog', 'draw-preview-img', 'ghost-btn', 'gen-btn', 'product-template-dialog', 'template-filter-row', 'picked', 'template-filter-row', 'picked', 'template-filter-row', 'picked', 'template-result-count', 'template-library-grid', 'template-library-card', 'picked', 'template-art', 'template-product', 'template-copy', 'template-meta', 'auth-dialog', 'auth-hero', 'brand-mark', 'big', 'auth-form', 'code-row', 'code-btn', 'auth-btn', 'auth-switch', 'history-dialog', 'history-body', 'history-list', 'history-item', 'picked', 'tag', 'empty', 'history-detail', 'hd-top', 'ghost-btn', 'ghost-btn', 'hd-text', 'empty', 'account-dialog', 'account-summary', 'ghost-btn', 'payment-types', 'package-grid', 'package-item', 'custom-recharge',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Mic2: Mic2,
            Sparkles: Sparkles,
            PenLine: PenLine,
            Copy: Copy,
            Bot: Bot,
            Palette: Palette,
            Video: Video,
            ImageIcon: ImageIcon,
            FolderOpen: FolderOpen,
            Clapperboard: Clapperboard,
            Layers: Layers,
            ScanFace: ScanFace,
            AudioLines: AudioLines,
            LogOut: LogOut,
            Search: Search,
            Zap: Zap,
            Wallet: Wallet,
            ChevronDown: ChevronDown,
            History: History,
            ArrowUp: ArrowUp,
            Download: Download,
            X: X,
            GROUPS: GROUPS,
            query: query,
            selected: selected,
            mobileNavOpen: mobileNavOpen,
            subject: subject,
            output: output,
            generating: generating,
            extra: extra,
            direction: direction,
            results: results,
            activeResult: activeResult,
            reviseInput: reviseInput,
            revising: revising,
            imgUrl: imgUrl,
            materials: materials,
            historyOpen: historyOpen,
            historyDetail: historyDetail,
            drawModels: drawModels,
            balance: balance,
            userName: userName,
            loginOpen: loginOpen,
            loginMode: loginMode,
            authUsername: authUsername,
            authPassword: authPassword,
            authEmail: authEmail,
            authLoading: authLoading,
            emailCode: emailCode,
            codeSending: codeSending,
            codeCountdown: codeCountdown,
            chatMessages: chatMessages,
            chatInput: chatInput,
            chatting: chatting,
            drawPrompt: drawPrompt,
            drawSize: drawSize,
            drawModel: drawModel,
            drawUrl: drawUrl,
            drawUsedModel: drawUsedModel,
            drawPreviewOpen: drawPreviewOpen,
            gptImageInput: gptImageInput,
            drawHistory: drawHistory,
            productResults: productResults,
            drawMode: drawMode,
            productImageUrls: productImageUrls,
            productName: productName,
            productSellingPoints: productSellingPoints,
            productAudience: productAudience,
            productScene: productScene,
            productStyle: productStyle,
            productCount: productCount,
            productUploading: productUploading,
            productTemplateOpen: productTemplateOpen,
            productTemplateType: productTemplateType,
            productTemplateCategory: productTemplateCategory,
            productTemplateRatio: productTemplateRatio,
            selectedProductTemplateId: selectedProductTemplateId,
            selectedProductTemplate: selectedProductTemplate,
            filteredProductTemplates: filteredProductTemplates,
            drawRevisePrompt: drawRevisePrompt,
            revisingDraw: revisingDraw,
            drawing: drawing,
            ttsText: ttsText,
            ttsVoice: ttsVoice,
            ttsUrl: ttsUrl,
            ttsGenerating: ttsGenerating,
            composeText: composeText,
            composeVoice: composeVoice,
            composeImgs: composeImgs,
            composeUrl: composeUrl,
            composing: composing,
            TTS_VOICES: TTS_VOICES,
            videoPrompt: videoPrompt,
            videoImageUrl: videoImageUrl,
            videoImageUrl2: videoImageUrl2,
            videoUrl: videoUrl,
            videoGenerating: videoGenerating,
            openVideoPicker: openVideoPicker,
            uploadVideoImage: uploadVideoImage,
            mediaPrompt: mediaPrompt,
            mediaInputUrl: mediaInputUrl,
            mediaInputUrl2: mediaInputUrl2,
            mediaResultUrl: mediaResultUrl,
            mediaGenerating: mediaGenerating,
            currentMediaModels: currentMediaModels,
            openMediaPicker: openMediaPicker,
            uploadMediaFile: uploadMediaFile,
            doMedia: doMedia,
            accountOpen: accountOpen,
            accountTab: accountTab,
            paymentType: paymentType,
            rechargeLoading: rechargeLoading,
            customAmount: customAmount,
            customRechargeLoading: customRechargeLoading,
            customRate: customRate,
            packages: packages,
            orders: orders,
            creditFlows: creditFlows,
            works: works,
            availableTools: availableTools,
            filteredTools: filteredTools,
            onGlow: onGlow,
            goHome: goHome,
            toolFor: toolFor,
            copyOutput: copyOutput,
            selectedCost: selectedCost,
            delMaterial: delMaterial,
            useMaterial: useMaterial,
            featureLabel: featureLabel,
            openHistory: openHistory,
            viewHistory: viewHistory,
            copyHistory: copyHistory,
            continueFromHistory: continueFromHistory,
            sendEmailCode: sendEmailCode,
            doAuth: doAuth,
            logout: logout,
            pickTool: pickTool,
            generate: generate,
            selectResult: selectResult,
            revise: revise,
            openImgPicker: openImgPicker,
            onUploadImg: onUploadImg,
            sendChat: sendChat,
            doDraw: doDraw,
            uploadProductImage: uploadProductImage,
            openProductPicker: openProductPicker,
            chooseProductTemplate: chooseProductTemplate,
            selectDrawResult: selectDrawResult,
            reviseDraw: reviseDraw,
            submitGptImage: submitGptImage,
            startNewGptImage: startNewGptImage,
            downloadDraw: downloadDraw,
            previewDraw: previewDraw,
            toggleComposeImg: toggleComposeImg,
            doCompose: doCompose,
            doTts: doTts,
            doVideo: doVideo,
            loadAccountCenter: loadAccountCenter,
            startRecharge: startRecharge,
            startCustomRecharge: startCustomRecharge,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
