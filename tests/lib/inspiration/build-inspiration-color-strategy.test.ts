import { describe, expect, it } from 'vitest'
import { buildInspirationColorStrategy } from '@/lib/inspiration/build-inspiration-color-strategy'

describe('buildInspirationColorStrategy', () => {
  it('explains neutral anchors and single accent logic with shared outfit language', () => {
    const notes = buildInspirationColorStrategy({
      summary: 'summary',
      scene: 'scene',
      vibe: 'vibe',
      colorFormula: '红色重点 + 黑色托底',
      silhouetteFormula: '短上衣 + 直筒裤',
      layeringFormula: '单层搭配',
      focalPoint: '红色针织衫',
      keyItems: [
        {
          id: 'item-1',
          label: '针织衫',
          category: '上衣',
          colorHint: '红色',
          styleTags: ['通勤']
        },
        {
          id: 'item-2',
          label: '西裤',
          category: '下装',
          colorHint: '黑色',
          styleTags: ['通勤']
        },
        {
          id: 'item-3',
          label: '乐福鞋',
          category: '鞋履',
          colorHint: '黑色',
          styleTags: ['通勤']
        }
      ],
      stylingTips: [],
      colorStrategyNotes: []
    })

    expect(notes.some((note) => note.includes('基础色托底'))).toBe(true)
    expect(notes.some((note) => note.includes('亮点色基本只保留在一处'))).toBe(true)
    expect(notes.some((note) => note.includes('优先保住'))).toBe(true)
  })
})
