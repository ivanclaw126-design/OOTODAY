import { describe, expect, it } from 'vitest'
import { buildInspirationAttemptLabel, buildMissingSlotCopy, buildRecommendationColorNotes } from '@/lib/recommendation/copy'

describe('recommendation shared copy', () => {
  it('uses consistent color language across recommendation surfaces', () => {
    expect(buildRecommendationColorNotes(['黑色', '灰色'], 'today')).toContain('基础色托底，今天穿起来稳定，日常容错率高。')
    expect(buildRecommendationColorNotes(['米色', '棕色'], 'shop')[0]).toContain('基础色托底')
    expect(buildRecommendationColorNotes(['藏蓝色', '白色'], 'travel')[0]).toContain('基础色托底')
    expect(buildRecommendationColorNotes(['浅蓝色', '蓝色'], 'inspiration')[0]).toContain('同色系深浅')
    expect(buildRecommendationColorNotes(['黑色', '红色'], 'shop')).toContain('如果把它当一处亮色重点，购买价值会更清楚。')
    expect(buildRecommendationColorNotes(['红色', '黄色'], 'today')).toContain('多个亮色会让视觉中心竞争，今天穿时建议收掉一处。')
  })

  it('keeps missing slot copy non-blocking and surface-specific', () => {
    expect(buildMissingSlotCopy('shoes', 'today')).toContain('仍可生成')
    expect(buildMissingSlotCopy('bag', 'travel')).toContain('计划仍能生成')
    expect(buildMissingSlotCopy('accessories', 'default')).toContain('不阻断推荐')
  })

  it('labels inspiration recommendations as inspiration attempts', () => {
    expect(buildInspirationAttemptLabel()).toBe('灵感尝试')
  })
})
