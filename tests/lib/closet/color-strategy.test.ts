import { describe, expect, it } from 'vitest'
import { buildClosetAnchoredColorHints, buildPaletteColorStrategyNotes } from '@/lib/closet/color-strategy'

describe('closet color strategy helpers', () => {
  it('builds reusable palette strategy notes from a set of colors', () => {
    const notes = buildPaletteColorStrategyNotes(['黑色', '灰色', '红色'])

    expect(notes.some((note) => note.includes('同色系深浅让层次自然'))).toBe(true)
    expect(notes.some((note) => note.includes('一处亮色重点清楚'))).toBe(true)
  })

  it('builds closet-anchored hints for candidate analysis', () => {
    const hints = buildClosetAnchoredColorHints('红色', [
      {
        id: 'item-1',
        imageUrl: null,
        category: '上装',
        subCategory: 'T恤',
        colorCategory: '白色',
        styleTags: ['基础'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-20T00:00:00Z'
      },
      {
        id: 'item-2',
        imageUrl: null,
        category: '下装',
        subCategory: '西裤',
        colorCategory: '黑色',
        styleTags: ['通勤'],
        lastWornDate: null,
        wearCount: 0,
        createdAt: '2026-04-20T00:00:00Z'
      }
    ])

    expect(hints.some((hint) => hint.includes('颜色存在感更强'))).toBe(true)
    expect(hints.some((hint) => hint.includes('基础色够用'))).toBe(true)
  })
})
