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
      colorHint: readOptionalString(item.color_hint),
      styleTags: readStyleTags(item.style_tags, 'key_items.style_tags')
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
            '你是穿搭灵感拆解助手。用户上传的是整套穿搭灵感图。只返回 JSON，字段必须是 summary、scene、vibe、key_items、styling_tips。key_items 必须是数组，成员字段必须是 label、category、color_hint、style_tags。styling_tips 必须是字符串数组。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请拆解这张穿搭灵感图：总结整体氛围、适用场景、风格关键词，列出最多 4 个关键单品，并给出最多 4 条可执行的搭配提示。'
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
    keyItems: readKeyItems(parsed.key_items),
    stylingTips: readStylingTips(parsed.styling_tips),
    colorStrategyNotes: []
  }

  return {
    ...breakdown,
    colorStrategyNotes: buildInspirationColorStrategy(breakdown)
  }
}
