import { describe, expect, it } from 'vitest'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'

describe('buildOotdNotes', () => {
  it('formats a dress recommendation with outer layer and reason', () => {
    expect(
      buildOotdNotes({
        id: 'rec-1',
        reason: '一件完成搭配',
        top: null,
        bottom: null,
        dress: {
          id: 'dress-1',
          imageUrl: null,
          category: '连衣裙',
          subCategory: '针织连衣裙',
          colorCategory: '黑色',
          styleTags: ['通勤']
        },
        outerLayer: {
          id: 'outer-1',
          imageUrl: null,
          category: '外套',
          subCategory: '西装外套',
          colorCategory: '藏蓝',
          styleTags: ['通勤']
        }
      })
    ).toBe('OOTD: 针织连衣裙；外层建议：西装外套；理由：一件完成搭配')
  })

  it('formats a separates recommendation and keeps missing bottom explicit', () => {
    expect(
      buildOotdNotes({
        id: 'rec-2',
        reason: '先用已有单品起一套思路',
        top: {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础']
        },
        bottom: null,
        dress: null,
        outerLayer: null
      })
    ).toBe('OOTD: T恤 + 待补充下装；理由：先用已有单品起一套思路')
  })
})
