import { getAiEnv } from '@/lib/env'
import { buildInspirationColorStrategy } from '@/lib/inspiration/build-inspiration-color-strategy'
import type {
  InspirationBreakdown,
  InspirationImportance,
  InspirationKeyItem,
  InspirationLayerRole,
  InspirationOutfitSlot
} from '@/lib/inspiration/types'

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new Error(`OpenAI returned invalid ${fieldName}`)
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`OpenAI returned empty ${fieldName}`)
  }

  return normalizedValue
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue || null
}

function readFormulaString(value: unknown, fallback: string) {
  return readOptionalString(value) ?? fallback
}

function readStringList(value: unknown) {
  if (typeof value === 'string') {
    return value
      .split(/[\s,，/、+＋·。；;:：-]+/u)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 4)
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function readStyleTags(value: unknown) {
  if (!Array.isArray(value)) {
    return readStringList(value).slice(0, 4)
  }

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function readOptionalField(record: Record<string, unknown>, camelName: string, snakeName: string) {
  return record[camelName] ?? record[snakeName]
}

function readSlot(value: unknown, fallbackCategory: string): InspirationOutfitSlot | null {
  const normalized = (readOptionalString(value) ?? fallbackCategory).trim().toLowerCase()

  if (['top', 'tops', '上装', '上衣'].includes(normalized)) {
    return 'top'
  }

  if (['bottom', 'bottoms', '下装', '裤装', '裙装'].includes(normalized)) {
    return 'bottom'
  }

  if (['onepiece', 'one_piece', 'dress', '连体', '连体/全身装', '全身装', '连衣裙'].includes(normalized)) {
    return 'onePiece'
  }

  if (['outerlayer', 'outer_layer', 'outerwear', '外层', '外套', '大衣', '西装外套'].includes(normalized)) {
    return 'outerLayer'
  }

  if (['shoes', 'shoe', 'footwear', '鞋履', '鞋子'].includes(normalized)) {
    return 'shoes'
  }

  if (['bag', 'bags', '包袋', '包'].includes(normalized)) {
    return 'bag'
  }

  if (['accessory', 'accessories', '配饰', '首饰', '围巾', '腰带'].includes(normalized)) {
    return 'accessory'
  }

  return null
}

function readLayerRole(value: unknown): InspirationLayerRole | null {
  const normalized = readOptionalString(value)?.toLowerCase()

  if (!normalized) {
    return null
  }

  if (['base', 'standalone', 'foundation', '基础', '主件'].includes(normalized)) {
    return 'base'
  }

  if (['mid', 'inner', 'middle', '内搭', '中层'].includes(normalized)) {
    return 'mid'
  }

  if (['outer', 'outerwear', '外层'].includes(normalized)) {
    return 'outer'
  }

  if (['statement', 'accent', 'focus', 'visual_focus', '亮点', '重点'].includes(normalized)) {
    return 'statement'
  }

  if (['support', 'finisher', 'finish', 'supporting', '收尾', '辅助'].includes(normalized)) {
    return 'support'
  }

  return null
}

function readImportance(value: unknown): InspirationImportance | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.round(value)

    if (normalized >= 1 && normalized <= 5) {
      return normalized as InspirationImportance
    }
  }

  const normalized = readOptionalString(value)?.toLowerCase()

  if (!normalized) {
    return null
  }

  if (['high', '核心', '重要', '5'].includes(normalized)) {
    return 5
  }

  if (['medium', '中', '3'].includes(normalized)) {
    return 3
  }

  if (['low', '低', '1'].includes(normalized)) {
    return 1
  }

  return null
}

function readKeyItems(value: unknown): InspirationKeyItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .slice(0, 4)
    .map((item, index) => {
      const category = readOptionalString(item.category) ?? '未分类单品'

      return {
        id: `inspiration-item-${index}`,
        label: readOptionalString(item.label) ?? `${category}${index + 1}`,
        category,
        slot: readSlot(item.slot, category),
        colorHint: readOptionalString(readOptionalField(item, 'colorHint', 'color_hint')),
        silhouette: readStringList(item.silhouette),
        layerRole: readLayerRole(readOptionalField(item, 'layerRole', 'layer_role')),
        importance: readImportance(item.importance),
        styleTags: readStyleTags(readOptionalField(item, 'styleTags', 'style_tags')),
        alternatives: readStringList(item.alternatives)
      }
    })
}

function readStylingTips(value: unknown) {
  if (!Array.isArray(value)) {
    return readStringList(value)
  }

  return value
    .filter((tip): tip is string => typeof tip === 'string')
    .map((tip) => tip.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function readColorStrategyNotes(value: unknown) {
  return readStringList(value).slice(0, 4)
}

function buildFormulaFallbacks({
  summary,
  vibe,
  keyItems
}: {
  summary: string
  vibe: string
  keyItems: InspirationKeyItem[]
}) {
  const colorHints = keyItems.map((item) => item.colorHint).filter((item): item is string => Boolean(item))
  const silhouettes = keyItems.flatMap((item) => item.silhouette ?? [])
  const layerRoles = keyItems.map((item) => item.layerRole).filter(Boolean)
  const focalItem = [...keyItems].sort((left, right) => (right.importance ?? 3) - (left.importance ?? 3))[0]

  return {
    colorFormula: colorHints.length > 0
      ? `${colorHints.slice(0, 3).join(' + ')}，按关键单品颜色保守复刻`
      : `${summary} 的主色未识别清楚，先用衣橱基础色托底`,
    silhouetteFormula: silhouettes.length > 0
      ? `${silhouettes.slice(0, 3).join(' + ')}，先保住核心比例`
      : `${vibe} 的轮廓未识别清楚，先保住主件线条`,
    layeringFormula: layerRoles.length > 0
      ? `${layerRoles.slice(0, 3).join(' + ')} 层次关系，按内外顺序复刻`
      : '叠穿公式暂未识别清楚，先按内外层关系复刻。',
    focalPoint: focalItem
      ? `${focalItem.label}${focalItem.colorHint ? `（${focalItem.colorHint}）` : ''}`
      : '视觉中心暂未识别清楚，先保住最显眼的关键单品。'
  }
}

export async function analyzeInspirationImage(imageUrl: string): Promise<InspirationBreakdown> {
  const { apiKey, baseUrl, model } = getAiEnv()

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '你是穿搭灵感拆解助手。用户上传的是整套穿搭灵感图。只返回 JSON，字段必须是 summary、scene、vibe、colorFormula、silhouetteFormula、layeringFormula、focalPoint、keyItems、stylingTips、colorStrategyNotes。兼容 snake_case 也可以。keyItems 必须是数组，成员字段必须是 label、category、slot、colorHint、silhouette、layerRole、importance、styleTags、alternatives。slot 用 top、bottom、onePiece、outerLayer、shoes、bag、accessory 之一。silhouette 是字符串数组。layerRole 用 base、mid、outer、statement、support 之一。importance 用 1-5 数字。alternatives 是可替代方案字符串数组。stylingTips 和 colorStrategyNotes 必须是字符串数组。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请按穿搭公式拆解这张灵感图：输出 scene、vibe、colorFormula、silhouetteFormula、layeringFormula、focalPoint、keyItems、stylingTips、colorStrategyNotes。关键单品最多 5 个，每个单品说明 slot/category/colorHint/silhouette/layerRole/importance/alternatives/styleTags。公式要能指导用户用自己的衣橱复刻，而不是只描述图片内容。'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null
      }
    }>
  }

  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI returned empty content')
  }

  let parsed: Record<string, unknown>

  try {
    parsed = JSON.parse(content) as Record<string, unknown>
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  const summary = readRequiredString(parsed.summary, 'summary')
  const scene = readRequiredString(parsed.scene, 'scene')
  const vibe = readRequiredString(parsed.vibe, 'vibe')
  const keyItems = readKeyItems(parsed.keyItems ?? parsed.key_items)
  const fallbacks = buildFormulaFallbacks({ summary, vibe, keyItems })
  const explicitColorStrategyNotes = readColorStrategyNotes(parsed.colorStrategyNotes ?? parsed.color_strategy_notes)
  const breakdown: InspirationBreakdown = {
    summary,
    scene,
    vibe,
    colorFormula: readFormulaString(parsed.colorFormula ?? parsed.color_formula, fallbacks.colorFormula),
    silhouetteFormula: readFormulaString(parsed.silhouetteFormula ?? parsed.silhouette_formula, fallbacks.silhouetteFormula),
    layeringFormula: readFormulaString(parsed.layeringFormula ?? parsed.layering_formula, fallbacks.layeringFormula),
    focalPoint: readFormulaString(parsed.focalPoint ?? parsed.focal_point, fallbacks.focalPoint),
    keyItems,
    stylingTips: readStylingTips(parsed.stylingTips ?? parsed.styling_tips),
    colorStrategyNotes: []
  }

  return {
    ...breakdown,
    colorStrategyNotes: explicitColorStrategyNotes.length > 0
      ? explicitColorStrategyNotes
      : buildInspirationColorStrategy(breakdown)
  }
}
