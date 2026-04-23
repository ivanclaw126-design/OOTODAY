import { describe, expect, it } from 'vitest'
import { buildClosetInsights } from '@/lib/closet/build-closet-insights'

describe('buildClosetInsights', () => {
  it('finds duplicate items, idle pieces, and missing basics from closet data', () => {
    const result = buildClosetInsights(
      [
        {
          id: 'item-1',
          imageUrl: null,
          category: '上衣',
          subCategory: '短袖T恤',
          colorCategory: '灰色',
          styleTags: ['基础', '简约'],
          lastWornDate: null,
          wearCount: 0,
          createdAt: '2026-02-01T00:00:00Z'
        },
        {
          id: 'item-2',
          imageUrl: null,
          category: '上衣',
          subCategory: '短袖T恤',
          colorCategory: '灰色',
          styleTags: ['基础'],
          lastWornDate: null,
          wearCount: 1,
          createdAt: '2026-02-02T00:00:00Z'
        },
        {
          id: 'item-3',
          imageUrl: null,
          category: '裤装',
          subCategory: '西裤',
          colorCategory: '黑色',
          styleTags: ['通勤'],
          lastWornDate: '2026-02-10',
          wearCount: 2,
          createdAt: '2026-02-01T00:00:00Z'
        }
      ],
      new Date('2026-04-22T00:00:00Z')
    )

    expect(result.duplicateGroups).toEqual([
      {
        id: '上装::短袖t恤::灰色',
        label: '灰色 短袖T恤',
        count: 2,
        itemIds: ['item-1', 'item-2'],
        keepItemId: 'item-2',
        keepLabel: '灰色 短袖T恤',
        keepReason: '这件已经穿过 1 次，说明它更像你真的会反复拿出来穿的版本'
      }
    ])
    expect(result.idleItems[0]).toEqual({
      id: 'item-1',
      label: '灰色 短袖T恤',
      reason: '收录后还没真正穿出去过'
    })
    expect(result.idleItems[1]).toEqual({
      id: 'item-3',
      label: '黑色 西裤',
      reason: '距离上次穿着已经超过 45 天'
    })
    expect(result.missingBasics).toEqual([
      {
        id: 'outerwear',
        label: '可叠穿外套',
        reason: '天气变化和层次搭配都需要一件外套来做切换',
        priority: 'medium',
        nextStep: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算'
      }
    ])
    expect(result.actionPlan).toEqual([
      {
        id: 'action:outerwear',
        title: '先补 可叠穿外套',
        detail: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算',
        filterId: 'outerwear',
        tone: 'buy'
      },
      {
        id: 'action:上装::短袖t恤::灰色',
        title: '重复款先保留 灰色 短袖T恤',
        detail: '这件已经穿过 1 次，说明它更像你真的会反复拿出来穿的版本 其余 1 件可以先暂停同类购买，或者后面再决定去留。',
        filterId: '上装::短袖t恤::灰色',
        tone: 'keep'
      },
      {
        id: 'action:item-1',
        title: '复盘 灰色 短袖T恤',
        detail: '收录后还没真正穿出去过 先看看它是不是版型、颜色或使用场景出了问题。',
        filterId: 'item-1',
        tone: 'review'
      }
    ])
  })
})
