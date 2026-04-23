type CategoryDefinition = {
  value: string
  label: string
  aliases: string[]
  subCategories: Array<{
    value: string
    label: string
    aliases: string[]
  }>
}

type ColorDefinition = {
  value: string
  label: string
  aliases: string[]
  family:
    | 'neutral'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'purple'
    | 'pink'
    | 'metallic'
  depth: 'light' | 'mid' | 'dark'
}

export type ColorIntensity = 'muted' | 'balanced' | 'vivid'
export type OutfitColorRole = 'base' | 'support' | 'accent'

export const UNKNOWN_CATEGORY = '未知类型请手动选择'
export const UNKNOWN_SUBCATEGORY = '未知类型请手动选择'
export const UNKNOWN_COLOR = '未知颜色请手动选择'

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    value: '上装',
    label: '上装',
    aliases: ['上装', '上衣', 'top', 'tops', 'shirt', 'tee', 'tshirt', 't-shirt', 'blouse'],
    subCategories: [
      { value: '短袖T恤', label: '短袖T恤', aliases: ['短袖t恤', '短t', 'tee', 't恤', 't-shirt', '短袖tee'] },
      { value: '长袖T恤', label: '长袖T恤', aliases: ['长袖t恤', '长t', 'long sleeve tee', '长袖tee'] },
      { value: '背心/吊带', label: '背心/吊带', aliases: ['背心', '吊带', 'tank', 'cami', 'camisole', 'vest top'] },
      { value: 'POLO衫', label: 'POLO衫', aliases: ['polo', 'polo衫'] },
      { value: '衬衫', label: '衬衫', aliases: ['衬衫', 'shirt', 'button-up', 'button down', 'blouse', '罩衫'] },
      { value: '针织衫', label: '针织衫', aliases: ['针织衫', '针织', 'knit top'] },
      { value: '毛衣', label: '毛衣', aliases: ['毛衣', 'sweater', 'jumper', '套头针织'] },
      { value: '开衫', label: '开衫', aliases: ['开衫', 'cardigan'] },
      { value: '卫衣', label: '卫衣', aliases: ['卫衣', 'sweatshirt'] },
      { value: '连帽卫衣', label: '连帽卫衣', aliases: ['连帽卫衣', 'hoodie'] },
      { value: '开衫卫衣', label: '开衫卫衣', aliases: ['拉链卫衣', 'zip hoodie', '开衫卫衣'] },
      { value: '打底衫', label: '打底衫', aliases: ['打底衫', 'base layer', '内搭上衣', '高领打底'] },
      { value: '运动上衣', label: '运动上衣', aliases: ['运动上衣', 'active top', 'training top'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '下装',
    label: '下装',
    aliases: ['下装', '裤装', '裤子', '裙装', 'bottom', 'bottoms', 'pants', 'trousers', 'skirt'],
    subCategories: [
      { value: '牛仔裤', label: '牛仔裤', aliases: ['牛仔裤', 'jeans', 'denim'] },
      { value: '休闲裤', label: '休闲裤', aliases: ['休闲裤', 'casual pants'] },
      { value: '西裤', label: '西裤', aliases: ['西裤', 'dress pants', 'trousers', 'slacks'] },
      { value: '阔腿裤', label: '阔腿裤', aliases: ['阔腿裤', 'wide leg pants'] },
      { value: '直筒裤', label: '直筒裤', aliases: ['直筒裤', 'straight leg pants'] },
      { value: '工装裤', label: '工装裤', aliases: ['工装裤', 'cargo pants'] },
      { value: '运动裤', label: '运动裤', aliases: ['运动裤', 'joggers', 'sweatpants', 'track pants'] },
      { value: '瑜伽裤', label: '瑜伽裤', aliases: ['瑜伽裤', 'yoga pants'] },
      { value: '打底裤', label: '打底裤', aliases: ['打底裤', 'legging', 'leggings', '紧身裤'] },
      { value: '短裤', label: '短裤', aliases: ['短裤', 'shorts'] },
      { value: '半裙', label: '半裙', aliases: ['半裙', '短裙', 'skirt', 'mini skirt', 'midi skirt'] },
      { value: '长裙', label: '长裙', aliases: ['长裙', 'maxi skirt', 'long skirt'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '全身装',
    label: '全身装',
    aliases: ['全身装', '连衣裙', '连体裤', 'jumpsuit', 'romper', 'dress', 'one piece', 'one-piece'],
    subCategories: [
      { value: '连衣裙', label: '连衣裙', aliases: ['连衣裙', 'dress'] },
      { value: '衬衫裙', label: '衬衫裙', aliases: ['衬衫裙', 'shirt dress'] },
      { value: '针织连衣裙', label: '针织连衣裙', aliases: ['针织连衣裙', 'knit dress'] },
      { value: '吊带裙', label: '吊带裙', aliases: ['吊带裙', 'slip dress', 'camisole dress'] },
      { value: '连体裤', label: '连体裤', aliases: ['连体裤', 'jumpsuit', 'romper'] },
      { value: '背带裤', label: '背带裤', aliases: ['背带裤', 'overalls', 'dungarees'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '外套',
    label: '外套',
    aliases: ['外套', 'jacket', 'coat', 'outerwear', 'blazer'],
    subCategories: [
      { value: '西装外套', label: '西装外套', aliases: ['西装外套', 'blazer', 'sport coat'] },
      { value: '夹克', label: '夹克', aliases: ['夹克', 'jacket', 'bomber'] },
      { value: '牛仔外套', label: '牛仔外套', aliases: ['牛仔外套', 'denim jacket'] },
      { value: '风衣', label: '风衣', aliases: ['风衣', 'trench'] },
      { value: '大衣', label: '大衣', aliases: ['大衣', 'overcoat', 'wool coat'] },
      { value: '羽绒服', label: '羽绒服', aliases: ['羽绒服', 'down jacket', 'puffer'] },
      { value: '棉服', label: '棉服', aliases: ['棉服', 'padded jacket'] },
      { value: '冲锋衣', label: '冲锋衣', aliases: ['冲锋衣', 'shell jacket', 'windbreaker'] },
      { value: '皮衣', label: '皮衣', aliases: ['皮衣', 'leather jacket'] },
      { value: '开衫外套', label: '开衫外套', aliases: ['开衫外套', 'outer cardigan'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '套装',
    label: '套装',
    aliases: ['套装', 'matching set', 'co-ord', 'co ord', 'suit set'],
    subCategories: [
      { value: '西装套装', label: '西装套装', aliases: ['西装套装', 'suit set'] },
      { value: '休闲套装', label: '休闲套装', aliases: ['休闲套装', 'matching set'] },
      { value: '运动套装', label: '运动套装', aliases: ['运动套装', 'tracksuit'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '内搭',
    label: '内搭',
    aliases: ['内搭', 'innerwear', 'underwear', 'bra', 'bralette', 'thermals'],
    subCategories: [
      { value: '文胸/内衣', label: '文胸/内衣', aliases: ['文胸', '内衣', 'bra', 'bralette'] },
      { value: '保暖内搭', label: '保暖内搭', aliases: ['保暖内搭', 'thermal', 'heattech'] },
      { value: '吊带内搭', label: '吊带内搭', aliases: ['吊带内搭', 'camisole inner'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '鞋履',
    label: '鞋履',
    aliases: ['鞋履', '鞋子', 'shoes', 'footwear', 'sneakers', 'boots'],
    subCategories: [
      { value: '运动鞋', label: '运动鞋', aliases: ['运动鞋', 'sneakers'] },
      { value: '靴子', label: '靴子', aliases: ['靴子', 'boots'] },
      { value: '乐福鞋', label: '乐福鞋', aliases: ['乐福鞋', 'loafers'] },
      { value: '凉鞋', label: '凉鞋', aliases: ['凉鞋', 'sandals'] },
      { value: '高跟鞋', label: '高跟鞋', aliases: ['高跟鞋', 'heels'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '包袋',
    label: '包袋',
    aliases: ['包袋', '包', 'bag', 'handbag', 'tote'],
    subCategories: [
      { value: '托特包', label: '托特包', aliases: ['托特包', 'tote bag'] },
      { value: '单肩包', label: '单肩包', aliases: ['单肩包', 'shoulder bag'] },
      { value: '斜挎包', label: '斜挎包', aliases: ['斜挎包', 'crossbody bag'] },
      { value: '双肩包', label: '双肩包', aliases: ['双肩包', 'backpack'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '配饰',
    label: '配饰',
    aliases: ['配饰', 'accessories', 'jewelry', 'hat', 'belt', 'scarf'],
    subCategories: [
      { value: '帽子', label: '帽子', aliases: ['帽子', 'hat', 'cap'] },
      { value: '围巾', label: '围巾', aliases: ['围巾', 'scarf'] },
      { value: '腰带', label: '腰带', aliases: ['腰带', 'belt'] },
      { value: '首饰', label: '首饰', aliases: ['首饰', 'jewelry'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: '家居服',
    label: '家居服',
    aliases: ['家居服', 'sleepwear', 'loungewear', 'pajamas'],
    subCategories: [
      { value: '家居套装', label: '家居套装', aliases: ['家居套装', 'pajamas', 'pajama set'] },
      { value: '睡裙', label: '睡裙', aliases: ['睡裙', 'nightgown'] },
      { value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }
    ]
  },
  {
    value: UNKNOWN_CATEGORY,
    label: UNKNOWN_CATEGORY,
    aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'],
    subCategories: [{ value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY, aliases: ['未知类型请手动选择', '未知', 'other', 'unknown'] }]
  }
]

export const COLOR_DEFINITIONS: ColorDefinition[] = [
  { value: '白色', label: '白色', aliases: ['白色', 'white'], family: 'neutral', depth: 'light' },
  { value: '米白色', label: '米白色', aliases: ['米白', 'off white', 'ivory', 'cream', '奶白'], family: 'neutral', depth: 'light' },
  { value: '浅灰色', label: '浅灰色', aliases: ['浅灰', 'light gray', 'light grey', 'heather gray'], family: 'neutral', depth: 'light' },
  { value: '灰色', label: '灰色', aliases: ['灰色', 'gray', 'grey'], family: 'neutral', depth: 'mid' },
  { value: '深灰色', label: '深灰色', aliases: ['深灰', 'charcoal', 'dark gray', 'dark grey', '炭灰'], family: 'neutral', depth: 'dark' },
  { value: '黑色', label: '黑色', aliases: ['黑色', 'black'], family: 'neutral', depth: 'dark' },
  { value: '米色', label: '米色', aliases: ['米色', 'beige', 'natural'], family: 'neutral', depth: 'light' },
  { value: '卡其色', label: '卡其色', aliases: ['卡其', 'khaki'], family: 'neutral', depth: 'mid' },
  { value: '驼色', label: '驼色', aliases: ['驼色', 'camel', 'tan'], family: 'neutral', depth: 'mid' },
  { value: '棕色', label: '棕色', aliases: ['棕色', 'brown'], family: 'neutral', depth: 'mid' },
  { value: '深棕色', label: '深棕色', aliases: ['深棕', 'dark brown', 'coffee'], family: 'neutral', depth: 'dark' },
  { value: '浅蓝色', label: '浅蓝色', aliases: ['浅蓝', 'light blue', 'sky blue', 'baby blue'], family: 'blue', depth: 'light' },
  { value: '蓝色', label: '蓝色', aliases: ['蓝色', 'blue', 'royal blue'], family: 'blue', depth: 'mid' },
  { value: '牛仔蓝', label: '牛仔蓝', aliases: ['牛仔蓝', 'denim blue', 'indigo'], family: 'blue', depth: 'mid' },
  { value: '藏蓝色', label: '藏蓝色', aliases: ['藏蓝', 'navy', 'navy blue', '海军蓝'], family: 'blue', depth: 'dark' },
  { value: '绿色', label: '绿色', aliases: ['绿色', 'green'], family: 'green', depth: 'mid' },
  { value: '橄榄绿', label: '橄榄绿', aliases: ['橄榄绿', 'olive', 'army green', '军绿'], family: 'green', depth: 'dark' },
  { value: '黄色', label: '黄色', aliases: ['黄色', 'yellow', 'mustard'], family: 'yellow', depth: 'mid' },
  { value: '橙色', label: '橙色', aliases: ['橙色', 'orange'], family: 'orange', depth: 'mid' },
  { value: '红色', label: '红色', aliases: ['红色', 'red'], family: 'red', depth: 'mid' },
  { value: '酒红色', label: '酒红色', aliases: ['酒红', 'burgundy', 'wine', 'maroon'], family: 'red', depth: 'dark' },
  { value: '粉色', label: '粉色', aliases: ['粉色', 'pink', 'dusty pink', 'hot pink'], family: 'pink', depth: 'light' },
  { value: '紫色', label: '紫色', aliases: ['紫色', 'purple', 'lavender'], family: 'purple', depth: 'mid' },
  { value: '金色', label: '金色', aliases: ['金色', 'gold'], family: 'metallic', depth: 'mid' },
  { value: '银色', label: '银色', aliases: ['银色', 'silver'], family: 'metallic', depth: 'mid' },
  { value: UNKNOWN_COLOR, label: UNKNOWN_COLOR, aliases: ['未知颜色请手动选择', '未知', 'other', 'unknown'], family: 'neutral', depth: 'mid' }
]

const categoryLookup = CATEGORY_DEFINITIONS.flatMap((category) =>
  [category.value, ...category.aliases].map((alias) => [normalizeInput(alias), category.value] as const)
)

const subCategoryLookup = CATEGORY_DEFINITIONS.flatMap((category) =>
  category.subCategories.flatMap((subCategory) =>
    [subCategory.value, ...subCategory.aliases].map((alias) => [normalizeInput(alias), { category: category.value, subCategory: subCategory.value }] as const)
  )
)

const colorLookup = COLOR_DEFINITIONS.flatMap((color) =>
  [color.value, ...color.aliases].map((alias) => [normalizeInput(alias), color.value] as const)
)

export function normalizeInput(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function findDefinitionByValue<T extends { value: string }>(definitions: T[], value: string) {
  return definitions.find((definition) => definition.value === value) ?? null
}

function matchesAlias(input: string, aliases: string[]) {
  return aliases.some((alias) => {
    const normalizedAlias = normalizeInput(alias)
    return input === normalizedAlias || input.includes(normalizedAlias)
  })
}

export function getCategoryOptions() {
  return CATEGORY_DEFINITIONS.map(({ value, label }) => ({ value, label }))
}

export function getColorOptions() {
  return COLOR_DEFINITIONS.map(({ value, label }) => ({ value, label }))
}

export function getSubCategoryOptions(category: string) {
  const normalizedCategory = normalizeCategoryValue(category)
  const definition = findDefinitionByValue(CATEGORY_DEFINITIONS, normalizedCategory)

  if (!definition) {
    return [{ value: UNKNOWN_SUBCATEGORY, label: UNKNOWN_SUBCATEGORY }]
  }

  return definition.subCategories.map(({ value, label }) => ({ value, label }))
}

export function normalizeCategoryValue(input: string | null | undefined): string {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return UNKNOWN_CATEGORY
  }

  const exactMatch = categoryLookup.find(([alias]) => alias === normalized)

  if (exactMatch) {
    return exactMatch[1]
  }

  for (const definition of CATEGORY_DEFINITIONS) {
    if (matchesAlias(normalized, [definition.value, ...definition.aliases])) {
      return definition.value
    }
  }

  return UNKNOWN_CATEGORY
}

export function normalizeSubCategoryValue(input: string | null | undefined, category?: string | null): string {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return UNKNOWN_SUBCATEGORY
  }

  const normalizedCategory = category ? normalizeCategoryValue(category) : null
  const exactMatch = subCategoryLookup.find(([alias, value]) => alias === normalized && (!normalizedCategory || value.category === normalizedCategory))

  if (exactMatch) {
    return exactMatch[1].subCategory
  }

  const subCategoryDefinitions =
    normalizedCategory && normalizedCategory !== UNKNOWN_CATEGORY
      ? findDefinitionByValue(CATEGORY_DEFINITIONS, normalizedCategory)?.subCategories ?? []
      : CATEGORY_DEFINITIONS.flatMap((definition) => definition.subCategories)

  for (const definition of subCategoryDefinitions) {
    if (matchesAlias(normalized, [definition.value, ...definition.aliases])) {
      return definition.value
    }
  }

  return UNKNOWN_SUBCATEGORY
}

export function inferCategoryFromSubCategory(input: string | null | undefined): string {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return UNKNOWN_CATEGORY
  }

  const exactMatch = subCategoryLookup.find(([alias]) => alias === normalized)

  if (exactMatch) {
    return exactMatch[1].category
  }

  for (const definition of CATEGORY_DEFINITIONS) {
    for (const subCategory of definition.subCategories) {
      if (matchesAlias(normalized, [subCategory.value, ...subCategory.aliases])) {
        return definition.value
      }
    }
  }

  return UNKNOWN_CATEGORY
}

export function normalizeColorValue(input: string | null | undefined): string {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return UNKNOWN_COLOR
  }

  const exactMatch = colorLookup.find(([alias]) => alias === normalized)

  if (exactMatch) {
    return exactMatch[1]
  }

  for (const definition of COLOR_DEFINITIONS) {
    if (matchesAlias(normalized, [definition.value, ...definition.aliases])) {
      return definition.value
    }
  }

  return UNKNOWN_COLOR
}

export function normalizeClosetFields(input: {
  category: string | null | undefined
  subCategory: string | null | undefined
  colorCategory: string | null | undefined
}) {
  const inferredCategory = inferCategoryFromSubCategory(input.subCategory)
  const normalizedCategory =
    normalizeCategoryValue(input.category) === UNKNOWN_CATEGORY && inferredCategory !== UNKNOWN_CATEGORY
      ? inferredCategory
      : normalizeCategoryValue(input.category)
  const normalizedSubCategory = normalizeSubCategoryValue(input.subCategory, normalizedCategory)
  const normalizedColorCategory = normalizeColorValue(input.colorCategory)

  return {
    category: normalizedCategory,
    subCategory: normalizedSubCategory,
    colorCategory: normalizedColorCategory
  }
}

export function isTopCategory(category: string | null | undefined) {
  return normalizeCategoryValue(category) === '上装'
}

export function isBottomCategory(category: string | null | undefined) {
  return normalizeCategoryValue(category) === '下装'
}

export function isOnePieceCategory(category: string | null | undefined) {
  return normalizeCategoryValue(category) === '全身装'
}

export function isOuterwearCategory(category: string | null | undefined) {
  return normalizeCategoryValue(category) === '外套'
}

export function isSupportedTodayCategory(category: string | null | undefined) {
  const normalizedCategory = normalizeCategoryValue(category)
  return ['上装', '下装', '全身装', '外套'].includes(normalizedCategory)
}

export function getColorDefinition(color: string | null | undefined) {
  return findDefinitionByValue(COLOR_DEFINITIONS, normalizeColorValue(color))
}

export function isNeutralColor(color: string | null | undefined) {
  const definition = getColorDefinition(color)
  return definition?.family === 'neutral'
}

export function getColorIntensity(color: string | null | undefined): ColorIntensity {
  const definition = getColorDefinition(color)

  if (!definition || definition.value === UNKNOWN_COLOR) {
    return 'balanced'
  }

  if (definition.family === 'neutral') {
    return 'muted'
  }

  if (definition.family === 'metallic') {
    return 'vivid'
  }

  const vividColors = new Set(['红色', '黄色', '橙色', '蓝色'])
  const mutedColors = new Set(['酒红色', '浅蓝色', '粉色', '紫色', '橄榄绿'])

  if (vividColors.has(definition.value)) {
    return 'vivid'
  }

  if (mutedColors.has(definition.value)) {
    return 'muted'
  }

  return 'balanced'
}

export function isVividColor(color: string | null | undefined) {
  return getColorIntensity(color) === 'vivid'
}

export function hasSameColorFamily(left: string | null | undefined, right: string | null | undefined) {
  const leftDefinition = getColorDefinition(left)
  const rightDefinition = getColorDefinition(right)

  if (!leftDefinition || !rightDefinition) {
    return false
  }

  return leftDefinition.family === rightDefinition.family
}

export function getOutfitColorRole(color: string | null | undefined): OutfitColorRole {
  const normalizedColor = normalizeColorValue(color)

  if (isNeutralColor(normalizedColor)) {
    return 'base'
  }

  const intensity = getColorIntensity(normalizedColor)

  if (intensity === 'vivid') {
    return 'accent'
  }

  return 'support'
}

function isNearFamily(leftFamily: ColorDefinition['family'], rightFamily: ColorDefinition['family']) {
  const pairs = new Set([
    'red:pink',
    'pink:red',
    'blue:purple',
    'purple:blue',
    'green:blue',
    'blue:green',
    'yellow:orange',
    'orange:yellow'
  ])

  return pairs.has(`${leftFamily}:${rightFamily}`)
}

export function scoreColorCompatibility(left: string | null | undefined, right: string | null | undefined) {
  const leftDefinition = getColorDefinition(left)
  const rightDefinition = getColorDefinition(right)

  if (!leftDefinition || !rightDefinition) {
    return 0
  }

  if (leftDefinition.value === UNKNOWN_COLOR || rightDefinition.value === UNKNOWN_COLOR) {
    return 0
  }

  if (leftDefinition.family === rightDefinition.family) {
    if (leftDefinition.depth !== rightDefinition.depth) {
      return 3
    }

    return 2
  }

  if (leftDefinition.family === 'neutral' || rightDefinition.family === 'neutral') {
    return 3
  }

  if (isNearFamily(leftDefinition.family, rightDefinition.family)) {
    return 2
  }

  const boldPairs = new Set([
    'red:green',
    'green:red',
    'blue:orange',
    'orange:blue',
    'yellow:purple',
    'purple:yellow',
    'red:blue',
    'blue:red'
  ])

  if (boldPairs.has(`${leftDefinition.family}:${rightDefinition.family}`)) {
    return 1
  }

  return 0
}

export function buildCategoryResearchSummary() {
  return [
    '主流零售目录在女装和男装都稳定收敛到 Tops / Bottoms / Dresses-or-One Pieces / Outerwear 这几个核心主类。',
    '二级类目里，T恤、衬衫、针织/毛衣、卫衣、裤装、牛仔、短裤、裙装、外套是跨平台最稳定的颗粒度。',
    '颜色目录普遍会把中性色拆成浅灰/灰/深灰、米白/米色/卡其/驼色、蓝/藏蓝等，因为这些差异会直接影响搭配策略。'
  ]
}
