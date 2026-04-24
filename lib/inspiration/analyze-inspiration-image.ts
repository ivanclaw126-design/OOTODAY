import { getAiEnv } from '@/lib/env'
import { buildInspirationColorStrategy } from '@/lib/inspiration/build-inspiration-color-strategy'
import type { InspirationBreakdown, InspirationKeyItem } from '@/lib/inspiration/types'

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
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function readStyleTags(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`OpenAI returned invalid ${fieldName}`)
  }

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function readKeyItems(value: unknown): InspirationKeyItem[] {
  if (!Array.isArray(value)) {
    throw new Error('OpenAI returned invalid key_items')
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .slice(0, 4)
    .map((item, index) => ({
      id: `inspiration-item-${index}`,
      label: readRequiredString(item.label, 'key_items.label'),
      category: readRequiredString(item.category, 'key_items.category'),
      slot: readOptionalString(item.slot),
      colorHint: readOptionalString(item.color_hint),
      silhouette: readOptionalString(item.silhouette),
      layerRole: readOptionalString(item.layer_role),
      importance: readOptionalString(item.importance),
      styleTags: readStyleTags(item.style_tags, 'key_items.style_tags'),
      alternatives: readStringList(item.alternatives)
    }))
}

function readStylingTips(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('OpenAI returned invalid styling_tips')
  }

  return value
    .filter((tip): tip is string => typeof tip === 'string')
    .map((tip) => tip.trim())
    .filter(Boolean)
    .slice(0, 4)
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
            '你是穿搭灵感拆解助手。用户上传的是整套穿搭灵感图。只返回 JSON，字段必须是 summary、scene、vibe、color_formula、silhouette_formula、layering_formula、focal_point、key_items、styling_tips。key_items 必须是数组，成员字段必须是 label、category、slot、color_hint、silhouette、layer_role、importance、style_tags、alternatives。slot 用 top、bottom、onePiece、outerLayer、shoes、bag、accessory 之一。layer_role 描述 base、inner、outer、accent、finisher 或 standalone。importance 用 high、medium、low。alternatives 是可替代方案字符串数组。styling_tips 必须是字符串数组。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请按穿搭公式拆解这张灵感图：分析适用场景、色彩公式、轮廓公式、叠穿公式、视觉中心、关键单品和可替代方案。关键单品最多 5 个，每个单品说明 slot、轮廓、层次角色、重要度、颜色提示、风格标签和可替代方案。最后给出最多 4 条可执行搭配提示。'
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

  const breakdown: InspirationBreakdown = {
    summary: readRequiredString(parsed.summary, 'summary'),
    scene: readRequiredString(parsed.scene, 'scene'),
    vibe: readRequiredString(parsed.vibe, 'vibe'),
    colorFormula: readFormulaString(parsed.color_formula, '色彩公式暂未识别清楚，先按关键单品颜色复刻。'),
    silhouetteFormula: readFormulaString(parsed.silhouette_formula, '轮廓公式暂未识别清楚，先保住核心单品比例。'),
    layeringFormula: readFormulaString(parsed.layering_formula, '叠穿公式暂未识别清楚，先按内外层关系复刻。'),
    focalPoint: readFormulaString(parsed.focal_point, '视觉中心暂未识别清楚，先保住最显眼的关键单品。'),
    keyItems: readKeyItems(parsed.key_items),
    stylingTips: readStylingTips(parsed.styling_tips),
    colorStrategyNotes: []
  }

  return {
    ...breakdown,
    colorStrategyNotes: buildInspirationColorStrategy(breakdown)
  }
}
