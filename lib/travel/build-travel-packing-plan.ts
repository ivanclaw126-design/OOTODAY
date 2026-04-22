import type { ClosetItemCardData } from '@/lib/closet/types'
import type { TravelDailyPlanEntry, TravelPackingEntry, TravelPackingPlan, TravelPlannerInput, TravelScene } from '@/lib/travel/types'

function describeItem(item: ClosetItemCardData) {
  return [item.colorCategory, item.subCategory ?? item.category].filter(Boolean).join(' ')
}

function sortForTravel(left: ClosetItemCardData, right: ClosetItemCardData) {
  if (right.wearCount !== left.wearCount) {
    return right.wearCount - left.wearCount
  }

  const leftLastWorn = left.lastWornDate ? new Date(left.lastWornDate).getTime() : 0
  const rightLastWorn = right.lastWornDate ? new Date(right.lastWornDate).getTime() : 0

  if (rightLastWorn !== leftLastWorn) {
    return rightLastWorn - leftLastWorn
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
}

function pickItems(items: ClosetItemCardData[], quantity: number) {
  return [...items]
    .sort(sortForTravel)
    .slice(0, Math.max(0, quantity))
}

function buildEntry(id: string, categoryLabel: string, quantity: number, items: ClosetItemCardData[], reason: string): TravelPackingEntry | null {
  const selected = pickItems(items, quantity)

  if (selected.length === 0) {
    return null
  }

  return {
    id,
    categoryLabel,
    quantity: Math.min(quantity, selected.length),
    itemLabels: selected.map((item) => describeItem(item) || item.category),
    reason
  }
}

function buildDailyPlan({
  days,
  tops,
  bottoms,
  dresses,
  outerwear,
  scenes
}: {
  days: number
  tops: ClosetItemCardData[]
  bottoms: ClosetItemCardData[]
  dresses: ClosetItemCardData[]
  outerwear: ClosetItemCardData[]
  scenes: TravelScene[]
}): TravelDailyPlanEntry[] {
  const rankedTops = [...tops].sort(sortForTravel)
  const rankedBottoms = [...bottoms].sort(sortForTravel)
  const rankedDresses = [...dresses].sort(sortForTravel)
  const rankedOuterwear = [...outerwear].sort(sortForTravel)

  return Array.from({ length: days }, (_, index) => {
    const top = rankedTops.length > 0 ? rankedTops[index % rankedTops.length] : null
    const bottom = rankedBottoms.length > 0 ? rankedBottoms[index % rankedBottoms.length] : null
    const dress = rankedDresses.length > 0 && includesLeisureScene(scenes) && index % 3 === 2 ? rankedDresses[0] : null
    const layer = rankedOuterwear[0] ?? null
    const focus =
      index === 0
        ? '先用最稳的一套开局，减少到达当天的决策负担。'
        : index % 2 === 1
          ? '这一天优先复穿下装，只换上衣，让行李体积真正降下来。'
          : '这一天保留基础轮廓，靠上衣或场景切换做变化。'

    const outfitSummary = dress
      ? `${describeItem(dress) || '连衣裙'}${layer ? ` + ${describeItem(layer) || '外套'}` : ''}`
      : [top ? describeItem(top) || '上衣' : '待补上衣', bottom ? describeItem(bottom) || '下装' : '待补下装', layer ? describeItem(layer) || '外套' : null]
          .filter(Boolean)
          .join(' + ')

    return {
      dayLabel: `第 ${index + 1} 天`,
      outfitSummary,
      focus
    }
  })
}

function includesFormalScene(scenes: TravelScene[]) {
  return scenes.includes('正式') || scenes.includes('通勤')
}

function includesLeisureScene(scenes: TravelScene[]) {
  return scenes.includes('休闲') || scenes.includes('约会') || scenes.includes('户外')
}

export function buildTravelPackingPlan({
  destinationCity,
  days,
  scenes,
  items,
  weather
}: TravelPlannerInput): TravelPackingPlan {
  const tops = items.filter((item) => item.category === '上衣')
  const bottoms = items.filter((item) => ['裤装', '下装', '裤子', '裙装'].includes(item.category))
  const dresses = items.filter((item) => item.category === '连衣裙')
  const outerwear = items.filter((item) => item.category === '外套')

  const topQuantity = Math.max(2, Math.min(tops.length, Math.ceil(days / 2) + (includesFormalScene(scenes) ? 1 : 0)))
  const bottomQuantity = Math.max(1, Math.min(bottoms.length, Math.ceil(days / 3)))
  const dressQuantity =
    dresses.length > 0 && includesLeisureScene(scenes)
      ? Math.max(0, Math.min(dresses.length, Math.floor(days / 3)))
      : 0
  const outerwearQuantity =
    outerwear.length > 0 && (weather?.isCold || includesFormalScene(scenes) || days >= 4)
      ? 1
      : 0

  const entries = [
    buildEntry('tops', '上衣', topQuantity, tops, '上衣按 2 天左右轮换一次来带，能兼顾体积和变化。'),
    buildEntry('bottoms', '下装', bottomQuantity, bottoms, '下装复穿频率可以更高，优先带最稳的基础款。'),
    buildEntry('dresses', '连衣裙', dressQuantity, dresses, '如果行程里有休闲或约会场景，带一条连衣裙能快速起完整造型。'),
    buildEntry('outerwear', '外套', outerwearQuantity, outerwear, '外套主要承担温差和正式感，带 1 件最稳的就够。')
  ].filter((entry): entry is TravelPackingEntry => entry !== null)

  const missingHints: string[] = []

  if (tops.length < Math.max(2, Math.ceil(days / 2))) {
    missingHints.push('上衣储备偏少，这趟建议优先带最百搭的几件，并接受更高的复穿比例。')
  }

  if (bottoms.length === 0) {
    missingHints.push('当前衣橱里缺少稳定下装，这会让旅行搭配明显受限。')
  }

  if ((weather?.isCold || days >= 4) && outerwear.length === 0) {
    missingHints.push('这趟更适合带一件外套，但当前衣橱里没有可直接打包的外套。')
  }

  if (includesFormalScene(scenes) && tops.length === 0) {
    missingHints.push('行程包含通勤或正式场景，但衣橱里缺少足够稳的正式上衣。')
  }

  const baseOutfitCount = dresses.length > 0 && includesLeisureScene(scenes) ? dressQuantity + Math.min(topQuantity, bottomQuantity) : Math.min(topQuantity, bottomQuantity)
  const suggestedOutfitCount = Math.max(1, Math.min(days, baseOutfitCount))

  const notes = [
    days >= 4 ? '把最稳的下装当成复穿核心，再用上衣切换场景，会比硬塞更多单品更省空间。' : '短途优先带最不会出错的组合，不必为了变化硬加太多单品。',
    weather
      ? weather.isWarm
        ? '目的地偏暖，优先选轻薄和透气的单品，把外套权重往下放。'
        : weather.isCold
          ? '目的地偏冷，记得把层次和叠穿放进清单，而不是只看单件好不好看。'
          : '目的地温度比较温和，优先带最稳定的基础组合，再用上衣和场景做变化。'
      : '天气数据暂时不可用，这份清单先按衣橱稳定度和场景覆盖来排。'
  ]

  if (includesFormalScene(scenes)) {
    notes.push('正式或通勤场景优先靠深色下装和一件外套稳住，不需要每一天都完全换新。')
  }

  const dailyPlan = buildDailyPlan({
    days,
    tops,
    bottoms,
    dresses,
    outerwear,
    scenes
  })

  return {
    destinationCity,
    days,
    scenes,
    suggestedOutfitCount,
    weather,
    entries,
    dailyPlan,
    missingHints,
    notes
  }
}
