import { describe, expect, it } from 'vitest'
import {
  ACCESSORY_CATEGORY,
  BAG_CATEGORY,
  getColorIntensity,
  getOutfitColorRole,
  hasSameColorFamily,
  inferClosetAlgorithmMeta,
  isAccessoryCategory,
  isBagCategory,
  isRecommendableCategory,
  isShoesCategory,
  isVividColor,
  normalizeClosetAlgorithmMeta,
  normalizeColorValue,
  SHOES_CATEGORY
} from '@/lib/closet/taxonomy'

describe('closet taxonomy color helpers', () => {
  it('normalizes color aliases to canonical values', () => {
    expect(normalizeColorValue('navy')).toBe('藏蓝色')
    expect(normalizeColorValue('ivory')).toBe('米白色')
  })

  it('classifies color intensity for stable recommendation rules', () => {
    expect(getColorIntensity('黑色')).toBe('muted')
    expect(getColorIntensity('酒红色')).toBe('muted')
    expect(getColorIntensity('绿色')).toBe('balanced')
    expect(getColorIntensity('红色')).toBe('vivid')
  })

  it('detects vivid colors and same-family colors', () => {
    expect(isVividColor('黄色')).toBe(true)
    expect(isVividColor('米色')).toBe(false)
    expect(hasSameColorFamily('浅蓝色', '藏蓝色')).toBe(true)
    expect(hasSameColorFamily('浅蓝色', '卡其色')).toBe(false)
    expect(getOutfitColorRole('黑色')).toBe('base')
    expect(getOutfitColorRole('蓝色')).toBe('accent')
    expect(getOutfitColorRole('绿色')).toBe('support')
  })

  it('classifies recommendation accessory categories', () => {
    expect(SHOES_CATEGORY).toBe('鞋履')
    expect(BAG_CATEGORY).toBe('包袋')
    expect(ACCESSORY_CATEGORY).toBe('配饰')
    expect(isShoesCategory('乐福鞋')).toBe(true)
    expect(isBagCategory('tote')).toBe(true)
    expect(isAccessoryCategory('scarf')).toBe(true)
    expect(isRecommendableCategory('鞋子')).toBe(true)
    expect(isRecommendableCategory('家居服')).toBe(false)
  })

  it('infers optional closet algorithm metadata from existing category and style fields', () => {
    expect(
      inferClosetAlgorithmMeta({
        category: '外套',
        subCategory: '长西装外套',
        styleTags: ['通勤', '硬挺']
      })
    ).toMatchObject({
      slot: 'outerwear',
      layerRole: 'outer',
      silhouette: ['硬挺'],
      fabricWeight: 'medium',
      formality: 4,
      warmthLevel: 2,
      comfortLevel: 3,
      visualWeight: 2,
      pattern: 'solid'
    })
  })

  it('normalizes optional algorithm metadata while preserving fallback fields', () => {
    expect(
      normalizeClosetAlgorithmMeta(
        {
          slot: 'wrong',
          layerRole: 'statement',
          silhouette: [' 长线条 ', '', '硬挺'],
          material: [' 羊毛 ', ''],
          fabricWeight: 'heavy',
          formality: 6,
          warmthLevel: 4,
          comfortLevel: 2,
          visualWeight: 5,
          pattern: 'stripe'
        },
        {
          category: '外套',
          subCategory: '大衣',
          styleTags: ['通勤']
        }
      )
    ).toMatchObject({
      slot: 'outerwear',
      layerRole: 'statement',
      silhouette: ['长线条', '硬挺'],
      material: ['羊毛'],
      fabricWeight: 'heavy',
      formality: 4,
      warmthLevel: 4,
      comfortLevel: 2,
      visualWeight: 5,
      pattern: 'stripe'
    })
  })
})
