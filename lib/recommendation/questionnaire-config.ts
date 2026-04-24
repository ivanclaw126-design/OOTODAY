import type {
  ColorPalettePreference,
  PreferenceProfile,
  QuestionnaireExploration,
  QuestionnaireLayeringComplexity,
  QuestionnairePracticality,
  SilhouettePreference,
  StyleQuestionnaireAnswers
} from '@/lib/recommendation/preference-types'

export type QuestionnaireOption<TValue extends string> = {
  value: TValue
  label: string
  description: string
}

export const SCENE_OPTIONS: Array<QuestionnaireOption<StyleQuestionnaireAnswers['scenes'][number]>> = [
  { value: 'work', label: '通勤干净', description: '更重视场景适配和稳定完成度。' },
  { value: 'casual', label: '轻松日常', description: '保留舒适、好穿和复穿空间。' },
  { value: 'date', label: '约会/聚会', description: '允许更多视觉中心和造型感。' },
  { value: 'travel', label: '城市旅行', description: '更重视天气舒适和少量单品成套。' },
  { value: 'outdoor', label: '运动户外', description: '把天气和舒适度权重放高。' }
]

export const SILHOUETTE_OPTIONS: Array<QuestionnaireOption<SilhouettePreference>> = [
  { value: 'shortTopHighWaist', label: '上短下长', description: '强调腰线和比例。' },
  { value: 'looseTopSlimBottom', label: '上松下窄', description: '上半身放松，下半身收住。' },
  { value: 'fittedTopWideBottom', label: '上窄下宽', description: '上半身利落，下装更有廓形。' },
  { value: 'relaxedAll', label: '全身松弛', description: '整体宽松、舒适优先。' },
  { value: 'onePiece', label: '连衣裙/一体式', description: '减少上下装搭配成本。' }
]

export const COLOR_PALETTE_OPTIONS: Array<QuestionnaireOption<ColorPalettePreference>> = [
  { value: 'neutral', label: '黑白灰 / 米棕 / 藏青', description: '低冲突、复穿稳定。' },
  { value: 'tonal', label: '同色系深浅', description: '靠颜色层次建立完整感。' },
  { value: 'softColor', label: '柔和低饱和', description: '保留颜色但降低存在感。' },
  { value: 'oneAccent', label: '基础色 + 一处亮色', description: '用一个重点提神。' },
  { value: 'boldContrast', label: '高对比 / 撞色', description: '接受更强视觉冲突。' }
]

export const LAYERING_OPTIONS: Array<QuestionnaireOption<QuestionnaireLayeringComplexity>> = [
  { value: 'simple', label: '简单两件', description: '尽量避免复杂叠穿。' },
  { value: 'lightLayer', label: '轻外套', description: '接受轻量外层。' },
  { value: 'threeLayer', label: '三层叠穿', description: '愿意用层次增强造型。' },
  { value: 'textureMix', label: '材质混搭', description: '接受更复杂的层次和材质变化。' }
]

export const FOCAL_POINT_OPTIONS: Array<QuestionnaireOption<PreferenceProfile['focalPointPreference']>> = [
  { value: 'upperBody', label: '上半身 / 脸周围', description: '重点靠近上半身。' },
  { value: 'waist', label: '腰线', description: '重点放在比例和腰线。' },
  { value: 'shoes', label: '鞋子', description: '允许鞋子成为视觉重点。' },
  { value: 'bagAccessory', label: '包 / 配饰', description: '让包袋或配饰完成造型。' },
  { value: 'subtle', label: '整体低调', description: '不强调单点抢眼。' }
]

export const PRACTICALITY_OPTIONS: Array<QuestionnaireOption<QuestionnairePracticality>> = [
  { value: 'comfort', label: '舒适优先', description: '提高天气舒适和实用性。' },
  { value: 'balanced', label: '均衡', description: '保持默认平衡。' },
  { value: 'style', label: '造型优先', description: '提高层次和视觉重点。' },
  { value: 'weekdayComfortWeekendStyle', label: '工作日舒适，周末造型', description: '在舒适和造型之间略偏完整。' }
]

export const SLOT_OPTIONS: Array<QuestionnaireOption<keyof PreferenceProfile['slotPreference']>> = [
  { value: 'outerwear', label: '外套', description: '允许推荐外层。' },
  { value: 'shoes', label: '鞋子', description: '推荐尽量补齐鞋履。' },
  { value: 'bag', label: '包袋', description: '用包袋补完整度和呼应。' },
  { value: 'accessories', label: '配饰', description: '允许少量配饰成为细节。' }
]

export const EXPLORATION_OPTIONS: Array<QuestionnaireOption<QuestionnaireExploration>> = [
  { value: 'stable', label: '尽量稳定', description: '几乎不插入灵感推荐。' },
  { value: 'slight', label: '一点变化', description: '低频尝试轻微变化。' },
  { value: 'inspiration', label: '偶尔给我灵感', description: '允许更明显的新鲜感。' },
  { value: 'bold', label: '大胆尝试', description: '提高探索频率，但仍保留避雷项。' }
]

export const HARD_AVOID_OPTIONS = [
  '不喜欢紧身',
  '不喜欢高跟鞋',
  '不喜欢短裙',
  '不喜欢无袖',
  '不喜欢大面积亮色',
  '不喜欢复杂叠穿',
  '不喜欢露腰',
  '不喜欢大 logo',
  '不喜欢帽子',
  '不喜欢太正式',
  '不喜欢太运动'
] as const
