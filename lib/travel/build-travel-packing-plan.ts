import type { ClosetItemCardData } from '@/lib/closet/types'
import { buildMissingSlotCopy, buildRecommendationColorNotes } from '@/lib/recommendation/copy'
import { scoreRecommendationCandidate } from '@/lib/recommendation/canonical-scoring'
import { filterWeatherSuitableItems, rankItemsForRecommendation, type EvaluatedOutfit } from '@/lib/recommendation/outfit-evaluator'
import {
  isBagCategory,
  isBottomCategory,
  isOnePieceCategory,
  isOuterwearCategory,
  isShoesCategory,
  isTopCategory
} from '@/lib/closet/taxonomy'
import type { TravelDailyPlanEntry, TravelPackingEntry, TravelPackingPlan, TravelPackingSlot, TravelPlannerInput, TravelScene } from '@/lib/travel/types'
import type { PreferenceProfile } from '@/lib/recommendation/preference-types'
import type { CandidateModelScoreMap } from '@/lib/recommendation/model-score-storage'

function describeItem(item: ClosetItemCardData) {
  return [item.colorCategory, item.subCategory ?? item.category].filter(Boolean).join(' ')
}

function itemSearchText(item: ClosetItemCardData) {
  const meta = item.algorithmMeta

  return [
    item.category,
    item.subCategory,
    item.colorCategory,
    ...item.styleTags,
    ...(item.seasonTags ?? []),
    meta?.slot,
    meta?.layerRole,
    meta?.length,
    meta?.fabricWeight,
    meta?.pattern,
    ...(meta?.silhouette ?? []),
    ...(meta?.material ?? [])
  ].filter(Boolean).join(' ').toLowerCase()
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

function sortForComfortTravel(left: ClosetItemCardData, right: ClosetItemCardData) {
  const leftComfort = left.algorithmMeta?.comfortLevel ?? (isComfortShoe(left) ? 4 : 2)
  const rightComfort = right.algorithmMeta?.comfortLevel ?? (isComfortShoe(right) ? 4 : 2)

  if (rightComfort !== leftComfort) {
    return rightComfort - leftComfort
  }

  return sortForTravel(left, right)
}

function pickRankedItems(items: ClosetItemCardData[], quantity: number) {
  return items.slice(0, Math.max(0, quantity))
}

function pickComfortItems(items: ClosetItemCardData[], quantity: number) {
  return [...items]
    .sort(sortForComfortTravel)
    .slice(0, Math.max(0, quantity))
}

function buildEntry(
  id: string,
  categoryLabel: string,
  quantity: number,
  items: ClosetItemCardData[],
  reason: string,
  slot?: TravelPackingSlot
): TravelPackingEntry | null {
  const selected = pickRankedItems(items, quantity)

  if (selected.length === 0) {
    return null
  }

  return {
    id,
    slot,
    categoryLabel,
    quantity: Math.min(quantity, selected.length),
    itemLabels: selected.map((item) => describeItem(item) || item.category),
    selectedItems: selected,
    reason
  }
}

function buildSelectedEntry(
  id: string,
  categoryLabel: string,
  selected: ClosetItemCardData[],
  reason: string,
  slot: TravelPackingSlot
): TravelPackingEntry | null {
  if (selected.length === 0) {
    return null
  }

  return {
    id,
    slot,
    categoryLabel,
    quantity: selected.length,
    itemLabels: selected.map((item) => describeItem(item) || item.category),
    selectedItems: selected,
    reason
  }
}

function uniqueItems(items: ClosetItemCardData[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }

    seen.add(item.id)
    return true
  })
}

function buildDailyPlan({
  days,
  tops,
  bottoms,
  dresses,
  outerwear,
  formalShoes,
  comfortShoes,
  backupShoes,
  bags,
  scenes
}: {
  days: number
  tops: ClosetItemCardData[]
  bottoms: ClosetItemCardData[]
  dresses: ClosetItemCardData[]
  outerwear: ClosetItemCardData[]
  formalShoes: ClosetItemCardData[]
  comfortShoes: ClosetItemCardData[]
  backupShoes: ClosetItemCardData[]
  bags: ClosetItemCardData[]
  scenes: TravelScene[]
}): TravelDailyPlanEntry[] {
  const rankedTops = tops
  const rankedBottoms = bottoms
  const rankedDresses = dresses
  const rankedOuterwear = outerwear
  const rankedFormalShoes = formalShoes
  const rankedComfortShoes = comfortShoes
  const rankedBackupShoes = backupShoes
  const rankedBags = bags
  const formalTrip = includesFormalScene(scenes)
  const walkingTrip = includesWalkingHeavyScene(scenes, days)

  return Array.from({ length: days }, (_, index) => {
    const top = rankedTops.length > 0 ? rankedTops[index % rankedTops.length] : null
    const bottom = rankedBottoms.length > 0 ? rankedBottoms[index % rankedBottoms.length] : null
    const dress = rankedDresses.length > 0 && includesLeisureScene(scenes) && index % 3 === 2 ? rankedDresses[0] : null
    const layer = rankedOuterwear[0] ?? null
    const shoe =
      formalTrip && index === 0 && rankedFormalShoes.length > 0
        ? rankedFormalShoes[0]
        : walkingTrip && rankedComfortShoes.length > 0
          ? rankedComfortShoes[index % rankedComfortShoes.length]
          : rankedFormalShoes[0] ?? rankedComfortShoes[0] ?? rankedBackupShoes[0] ?? null
    const backupShoe = rankedBackupShoes.length > 0 && days >= 4 && index === days - 1 ? rankedBackupShoes[0] : null
    const bag = rankedBags[0] ?? null
    const shoeForSummary = backupShoe ?? shoe
    const focus =
      index === 0
        ? formalTrip && (shoeForSummary || bag)
          ? '先用正式度更稳的鞋包开局，减少到达当天的决策负担。'
          : '先用最稳的一套开局，减少到达当天的决策负担。'
        : index % 2 === 1
          ? walkingTrip && shoeForSummary
            ? '这一天优先照顾步行舒适度，上下装复穿也不会影响落地执行。'
            : '这一天优先复穿下装，只换上衣，让行李体积真正降下来。'
          : backupShoe
            ? '最后一天用备用鞋降低连续穿同一双的疲劳感。'
            : '这一天保留基础轮廓，靠上衣或场景切换做变化。'

    const coreSummary = dress
      ? `${describeItem(dress) || '连衣裙'}${layer ? ` + ${describeItem(layer) || '外层'}` : ''}`
      : [top ? describeItem(top) || '上衣' : '待补上衣', bottom ? describeItem(bottom) || '下装' : '待补下装', layer ? describeItem(layer) || '外层' : null]
          .filter(Boolean)
          .join(' + ')
    const shoeSummary = shoeForSummary ? describeItem(shoeForSummary) || '鞋履' : null
    const bagSummary = bag ? describeItem(bag) || '包袋' : null
    const outfitSummary = [coreSummary, shoeSummary, bagSummary].filter(Boolean).join(' + ')

    return {
      dayLabel: `第 ${index + 1} 天`,
      outfitSummary,
      shoeSummary,
      bagSummary,
      focus,
      selectedItems: uniqueItems([dress, top, bottom, layer, shoeForSummary, bag].filter((item): item is ClosetItemCardData => item !== null))
    }
  })
}

function includesFormalScene(scenes: TravelScene[]) {
  return scenes.includes('正式') || scenes.includes('通勤')
}

function includesLeisureScene(scenes: TravelScene[]) {
  return scenes.includes('休闲') || scenes.includes('约会') || scenes.includes('户外')
}

function includesWalkingHeavyScene(scenes: TravelScene[], days: number) {
  return scenes.includes('户外') || scenes.includes('休闲') || days >= 4
}

function prefersLightPacking(profile: PreferenceProfile | null | undefined) {
  return Boolean(profile && profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority && profile.layeringPreference.complexity <= 1)
}

function prefersCompleteStyling(profile: PreferenceProfile | null | undefined) {
  return Boolean(profile && profile.practicalityPreference.stylePriority > profile.practicalityPreference.comfortPriority)
}

function isFormalShoe(item: ClosetItemCardData) {
  const text = itemSearchText(item)
  return ['正式', '通勤', '商务', '皮鞋', '乐福', '高跟', '短靴', '靴子', 'loaf', 'heel', 'boot'].some((token) => text.includes(token))
}

function isComfortShoe(item: ClosetItemCardData) {
  const text = itemSearchText(item)
  return ['舒适', '休闲', '运动', '平底', '凉鞋', '拖鞋', '户外', '徒步', 'sneaker', 'walking', 'flat', 'sandal'].some((token) => text.includes(token))
}

function isFormalBag(item: ClosetItemCardData) {
  const text = itemSearchText(item)
  return ['正式', '通勤', '商务', '托特', '单肩', '手提', '电脑', 'tote', 'work'].some((token) => text.includes(token))
}

function buildColorStrategyNotes(items: ClosetItemCardData[]) {
  return buildRecommendationColorNotes(items.map((item) => item.colorCategory), 'travel')
}

function buildSingleSlotOutfit(item: ClosetItemCardData, slot: TravelPackingSlot): EvaluatedOutfit {
  if (slot === 'tops') {
    return { top: item, missingSlots: ['bottom', 'shoes', 'bag'] }
  }

  if (slot === 'bottoms') {
    return { bottom: item, missingSlots: ['top', 'shoes', 'bag'] }
  }

  if (slot === 'dresses') {
    return { dress: item, missingSlots: ['shoes', 'bag'] }
  }

  if (slot === 'outerwear') {
    return { outerLayer: item, missingSlots: ['top', 'bottom', 'shoes', 'bag'] }
  }

  if (slot === 'comfortShoes' || slot === 'formalShoes' || slot === 'backupShoes') {
    return { shoes: item, missingSlots: ['top', 'bottom', 'bag'] }
  }

  return { bag: item, missingSlots: ['top', 'bottom', 'shoes'] }
}

function rankTravelItemsWithModel({
  items,
  slot,
  modelScoreMap,
  entityModelScoreMap,
  trendSignals,
  learningSignals,
  weather,
  profile,
  scenes
}: {
  items: ClosetItemCardData[]
  slot: TravelPackingSlot
  modelScoreMap?: CandidateModelScoreMap
  entityModelScoreMap?: TravelPlannerInput['entityModelScoreMap']
  trendSignals?: TravelPlannerInput['trendSignals']
  learningSignals?: TravelPlannerInput['learningSignals']
  weather: TravelPlannerInput['weather']
  profile: PreferenceProfile | null | undefined
  scenes: TravelScene[]
}) {
  return [...items].sort((left, right) => {
    const scoreItem = (item: ClosetItemCardData) => scoreRecommendationCandidate({
      id: `travel-${slot}-${item.id}`,
      surface: 'travel',
      outfit: buildSingleSlotOutfit(item, slot),
      context: {
        surface: 'travel',
        weather,
        profile,
        travelScenes: scenes,
        trendSignals,
        learningSignals,
        recallSource: 'rule',
        effortLevel: profile && profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority ? 'low' : 'medium'
      }
    }, modelScoreMap?.[`travel-${slot}-${item.id}`]).scoreBreakdown.totalScore +
      (entityModelScoreMap?.[item.id]?.finalScore ?? 0) * 0.08
    const delta = scoreItem(right) - scoreItem(left)

    if (delta !== 0) {
      return delta
    }

    return sortForTravel(left, right)
  })
}

export function buildTravelPackingPlan({
  destinationCity,
  days,
  scenes,
  items,
  weather,
  preferenceState,
  modelScoreMap,
  entityModelScoreMap,
  trendSignals,
  learningSignals
}: TravelPlannerInput): TravelPackingPlan {
  const profile = preferenceState?.profile
  const rankContext = { weather, profile, travelScenes: scenes }
  const lightPacking = prefersLightPacking(profile)
  const completeStyling = prefersCompleteStyling(profile)
  const dislikesComplexLayering = (profile?.layeringPreference.complexity ?? 1) === 0
  const comfortLeads = Boolean(profile && profile.practicalityPreference.comfortPriority > profile.practicalityPreference.stylePriority)
  const tops = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isTopCategory(item.category)), weather, 46),
    rankContext
    ),
    slot: 'tops',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const bottoms = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isBottomCategory(item.category)), weather, 52),
    rankContext
    ),
    slot: 'bottoms',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const dresses = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isOnePieceCategory(item.category)), weather, 50),
    rankContext
    ),
    slot: 'dresses',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const outerwear = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isOuterwearCategory(item.category)), weather, 45),
    rankContext
    ),
    slot: 'outerwear',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const shoes = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(
    filterWeatherSuitableItems(items.filter((item) => isShoesCategory(item.category)), weather, 52),
    rankContext
    ),
    slot: 'comfortShoes',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const bags = rankTravelItemsWithModel({
    items: rankItemsForRecommendation(items.filter((item) => isBagCategory(item.category)), rankContext),
    slot: 'bags',
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    weather,
    profile,
    scenes
  })
  const formalTrip = includesFormalScene(scenes)
  const walkingTrip = includesWalkingHeavyScene(scenes, days)
  const formalShoeCandidates = shoes.filter(isFormalShoe)
  const comfortShoeCandidates = shoes.filter((item) => isComfortShoe(item) || !isFormalShoe(item))
  const formalBagCandidates = bags.filter(isFormalBag)
  const selectedFormalShoes = formalTrip ? pickRankedItems(formalShoeCandidates, 1) : []
  const selectedComfortShoes = walkingTrip || comfortLeads || selectedFormalShoes.length === 0 ? pickComfortItems(comfortShoeCandidates, 1) : []
  const selectedShoeIds = new Set([...selectedFormalShoes, ...selectedComfortShoes].map((item) => item.id))
  const selectedBackupShoes =
    !lightPacking && shoes.length > selectedShoeIds.size && (days >= 4 || walkingTrip || completeStyling)
      ? pickRankedItems(shoes.filter((item) => !selectedShoeIds.has(item.id)), 1)
      : []
  const selectedBags = bags.length > 0 && (!lightPacking || formalTrip || completeStyling)
    ? pickRankedItems(formalTrip && formalBagCandidates.length > 0 ? formalBagCandidates : bags, 1)
    : []

  const topQuantity = Math.max(2, Math.min(tops.length, Math.ceil(days / 2) + (includesFormalScene(scenes) ? 1 : 0)))
  const bottomQuantity = Math.max(1, Math.min(bottoms.length, Math.ceil(days / 3)))
  const dressQuantity =
    dresses.length > 0 && includesLeisureScene(scenes)
      ? Math.max(0, Math.min(dresses.length, Math.floor(days / 3)))
      : 0
  const outerwearQuantity =
    outerwear.length > 0 && !dislikesComplexLayering && (weather?.isCold || includesFormalScene(scenes) || days >= 4)
      ? 1
      : 0

  const entries = [
    buildEntry('tops', '上衣', topQuantity, tops, '上衣按 2 天左右轮换一次来带，能兼顾体积和变化。', 'tops'),
    buildEntry('bottoms', '下装', bottomQuantity, bottoms, '下装复穿频率可以更高，优先带最稳的基础款。', 'bottoms'),
    buildEntry('dresses', '连体/全身装', dressQuantity, dresses, '如果行程里有休闲或约会场景，带一件连体/全身装能快速起完整造型。', 'dresses'),
    buildEntry('outerwear', '外层', outerwearQuantity, outerwear, '外层主要承担温差和正式感，带 1 件最稳的就够。', 'outerwear'),
    buildSelectedEntry('formal-shoes', '正式鞋', selectedFormalShoes, '通勤或正式场景先放一双正式度更稳的鞋，整体完成度会更可靠。', 'formalShoes'),
    buildSelectedEntry('comfort-shoes', '舒适鞋', selectedComfortShoes, '户外、步行或长途旅行优先保证脚感，一双舒适鞋比多带一件上衣更关键。', 'comfortShoes'),
    buildSelectedEntry('backup-shoes', '备用鞋', selectedBackupShoes, '行程较长时准备一双备用鞋，能降低连续穿同一双的疲劳和天气风险。', 'backupShoes'),
    buildSelectedEntry('bags', '包袋', selectedBags, formalTrip ? '通勤或正式场景需要包袋承接电脑、证件和整体正式感。' : '带一只颜色稳定的包袋，能把每日组合收完整。', 'bags')
  ].filter((entry): entry is TravelPackingEntry => entry !== null)

  const missingHints: string[] = []

  if (tops.length < Math.max(2, Math.ceil(days / 2))) {
    missingHints.push('上衣储备偏少，这趟建议优先带最百搭的几件，并接受更高的复穿比例。')
  }

  if (bottoms.length === 0) {
    missingHints.push('当前衣橱里缺少稳定下装，这会让旅行搭配明显受限。')
  }

  if ((weather?.isCold || days >= 4) && outerwear.length === 0) {
    missingHints.push(buildMissingSlotCopy('outerLayer', 'travel'))
  }

  if (includesFormalScene(scenes) && tops.length === 0) {
    missingHints.push('行程包含通勤或正式场景，但衣橱里缺少足够稳的正式上衣。')
  }

  if (shoes.length === 0) {
    missingHints.push(buildMissingSlotCopy('shoes', 'travel'))
  } else {
    if (formalTrip && selectedFormalShoes.length === 0) {
      missingHints.push('行程包含通勤或正式场景，但现有鞋履正式度不够，会影响整体利落感和场景适配。')
    }

    if (walkingTrip && selectedComfortShoes.length === 0) {
      missingHints.push('这趟包含户外、步行或长途场景，但缺少舒适鞋，会影响全天行走体验。')
    }
  }

  if (bags.length === 0) {
    missingHints.push(formalTrip ? '通勤或正式场景缺少包袋，会影响电脑、证件携带和整套造型完整度。' : buildMissingSlotCopy('bag', 'travel'))
  } else if (lightPacking && selectedBags.length === 0) {
    missingHints.push('你更偏轻装，这次先不强制带非必要包袋；如果有正式场景再补一只稳定包。')
  }

  const baseOutfitCount = dresses.length > 0 && includesLeisureScene(scenes) ? dressQuantity + Math.min(topQuantity, bottomQuantity) : Math.min(topQuantity, bottomQuantity)
  const suggestedOutfitCount = Math.max(1, Math.min(days, baseOutfitCount))

  const notes = [
    days >= 4 ? '把最稳的下装当成复穿核心，再用上衣切换场景，会比硬塞更多单品更省空间。' : '短途优先带最不会出错的组合，不必为了变化硬加太多单品。',
    weather
      ? weather.isWarm
        ? '目的地偏暖，优先选轻薄和透气的单品，把外层权重往下放。'
        : weather.isCold
          ? '目的地偏冷，记得把层次和叠穿放进清单，而不是只看单件好不好看。'
          : '目的地温度比较温和，优先带最稳定的基础组合，再用上衣和场景做变化。'
      : '天气数据暂时不可用，这份清单先按衣橱稳定度和场景覆盖来排。'
  ]

  notes.push(...buildColorStrategyNotes([...tops, ...bottoms, ...dresses, ...outerwear, ...shoes, ...bags]))

  if (includesFormalScene(scenes)) {
    notes.push('正式或通勤场景优先靠深色下装、外层、正式鞋和包袋稳住，不需要每一天都完全换新。')
  }

  if (walkingTrip) {
    notes.push(comfortLeads ? '你的偏好更重视舒适度，户外、步行或长途旅行会优先把舒适鞋排到前面。' : '户外、步行或长途旅行先保住舒适鞋，再考虑造型变化。')
  }

  if (lightPacking) {
    notes.push('你的偏好更接近轻装出行，备用鞋、非必要包袋和复杂配饰会被压低优先级。')
  }

  if (completeStyling && !lightPacking) {
    notes.push('你的偏好更重视完整造型，鞋包这些收尾 slot 会尽量保留。')
  }

  if (dislikesComplexLayering) {
    notes.push('你不喜欢复杂叠穿，这次会减少三层组合，只保留必要外层。')
  }

  const dailyPlan = buildDailyPlan({
    days,
    tops,
    bottoms,
    dresses,
    outerwear,
    formalShoes: selectedFormalShoes,
    comfortShoes: selectedComfortShoes,
    backupShoes: selectedBackupShoes,
    bags: selectedBags,
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
