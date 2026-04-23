import type { TodayRecommendation, TodayRecommendationItem } from '@/lib/today/types'

function itemName(item: TodayRecommendationItem | null, fallback: string) {
  return item?.subCategory ?? item?.category ?? fallback
}

export function buildOotdNotes(recommendation: TodayRecommendation) {
  const summary = recommendation.dress
    ? `OOTD: ${itemName(recommendation.dress, '待补充主件')}`
    : `OOTD: ${itemName(recommendation.top, '待补充上装')} + ${itemName(recommendation.bottom, '待补充下装')}`

  const outerLayer = recommendation.outerLayer
    ? `；外层建议：${itemName(recommendation.outerLayer, '待补充外层')}`
    : ''

  return `${summary}${outerLayer}；理由：${recommendation.reason}`
}
