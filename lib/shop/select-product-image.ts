import { getAiEnv } from '@/lib/env'

function clampCandidates(candidates: string[]) {
  return Array.from(new Set(candidates.filter(Boolean))).slice(0, 6)
}

export async function selectBestShopProductImage(candidates: string[]) {
  const normalizedCandidates = clampCandidates(candidates)

  if (normalizedCandidates.length <= 1) {
    return normalizedCandidates[0] ?? null
  }

  let env

  try {
    env = getAiEnv()
  } catch {
    return null
  }

  const response = await fetch(`${env.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.apiKey}`
    },
    body: JSON.stringify({
      model: env.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            '你是电商商品主图筛选助手。用户会给你多张同一商品的候选图片 URL。请优先选择最像“单品干净图”的那张：只突出单个商品、背景简单、没有明显模特全身穿搭、没有拼图排版、没有营销 banner、没有站点分享图。只返回 JSON，字段必须是 selected_index。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请从下面 ${normalizedCandidates.length} 张候选图里选最适合做单品识别和结果展示的一张，返回 0-based 的 selected_index。`
            },
            ...normalizedCandidates.flatMap((candidate, index) => [
              {
                type: 'text' as const,
                text: `候选图 ${index}`
              },
              {
                type: 'image_url' as const,
                image_url: {
                  url: candidate
                }
              }
            ])
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    return null
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
    return null
  }

  try {
    const parsed = JSON.parse(content) as { selected_index?: unknown }
    const selectedIndex = parsed.selected_index

    if (typeof selectedIndex !== 'number' || !Number.isInteger(selectedIndex)) {
      return null
    }

    return normalizedCandidates[selectedIndex] ?? null
  } catch {
    return null
  }
}
