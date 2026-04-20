import type { ClosetAnalysisResult } from '@/lib/closet/types'

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  return apiKey
}

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

function readStyleTags(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('OpenAI returned invalid style_tags')
  }

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
}

export async function analyzeItemImage(imageUrl: string): Promise<ClosetAnalysisResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getOpenAiApiKey()}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '你是衣橱助手。用户上传的是单件衣物图片。只返回 JSON，字段必须是 category、sub_category、color_category、style_tags。style_tags 必须是字符串数组。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请识别这张单件衣物图片，给出最自然的分类、子分类、主颜色和最多 5 个风格标签。'
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

  let parsed: {
    category?: unknown
    sub_category?: unknown
    color_category?: unknown
    style_tags?: unknown
  }

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  return {
    category: readRequiredString(parsed.category, 'category'),
    subCategory: readRequiredString(parsed.sub_category, 'sub_category'),
    colorCategory: readRequiredString(parsed.color_category, 'color_category'),
    styleTags: readStyleTags(parsed.style_tags)
  }
}
