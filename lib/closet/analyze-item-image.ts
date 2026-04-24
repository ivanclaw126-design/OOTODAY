import type { ClosetAnalysisResult } from '@/lib/closet/types'
import { CATEGORY_DEFINITIONS, COLOR_DEFINITIONS, normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import { getAiEnv } from '@/lib/env'

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
  const { apiKey, baseUrl, model } = getAiEnv()
  const categoryPrompt = CATEGORY_DEFINITIONS.map((category) => {
    const subCategoryList = category.subCategories.map((subCategory) => subCategory.value).join('、')
    return `${category.value}：${subCategoryList}`
  }).join('；')
  const colorPrompt = COLOR_DEFINITIONS.map((color) => color.value).join('、')

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
            `你是衣橱助手。用户上传的是单件衣物图片。你必须把识别结果收敛到给定标准字典里，只返回 JSON，字段必须是 category、sub_category、color_category、style_tags。style_tags 必须是字符串数组。可选字段 algorithm_meta 可以包含 slot、layerRole、silhouette、length、material、fabricWeight、formality、warmthLevel、comfortLevel、visualWeight、pattern；所有 algorithm_meta 字段都必须保守，不确定就省略。如果把握不足，category 或 sub_category 返回“未知类型请手动选择”，color_category 返回“未知颜色请手动选择”。可选主分类和子分类如下：${categoryPrompt}。可选颜色如下：${colorPrompt}。`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请识别这张单件衣物图片，严格从标准字典中选一个主分类、一个子分类、一个颜色，并给出最多 5 个风格标签。若画面足够清楚，可额外给出 algorithm_meta，用于算法判断比例、叠穿、视觉中心、正式度、保暖度和舒适度。'
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
    algorithm_meta?: unknown
  }

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  const normalizedFields = normalizeClosetFields({
    category: readRequiredString(parsed.category, 'category'),
    subCategory: readRequiredString(parsed.sub_category, 'sub_category'),
    colorCategory: readRequiredString(parsed.color_category, 'color_category')
  })

  const styleTags = readStyleTags(parsed.style_tags)
  const algorithmMeta =
    typeof parsed.algorithm_meta === 'object' && parsed.algorithm_meta !== null && !Array.isArray(parsed.algorithm_meta)
      ? normalizeClosetAlgorithmMeta(parsed.algorithm_meta, {
        category: normalizedFields.category,
        subCategory: normalizedFields.subCategory,
        styleTags
      })
      : null

  return {
    category: normalizedFields.category,
    subCategory: normalizedFields.subCategory,
    colorCategory: normalizedFields.colorCategory,
    styleTags,
    ...(algorithmMeta ? { algorithmMeta } : {})
  }
}
