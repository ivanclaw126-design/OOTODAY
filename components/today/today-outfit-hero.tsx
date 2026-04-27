import Image from 'next/image'
import { getSlotDisplayLabel } from '@/components/today/today-slot-replacement-actions'
import type { TodayRecommendation, TodayRecommendationItem, TodayReplaceableSlot, TodayWeatherState } from '@/lib/today/types'

type HeroSlot = {
  key: TodayReplaceableSlot
  label: string
  item: TodayRecommendationItem | null
  className: string
}

function itemName(item: TodayRecommendationItem | null, fallback: string) {
  return item?.subCategory ?? item?.category ?? fallback
}

function itemAlt(slotLabel: string, item: TodayRecommendationItem | null) {
  const color = item?.colorCategory ? `${item.colorCategory}` : ''
  const name = itemName(item, '待补充')
  return `${slotLabel}：${color}${name}`
}

function getOuterLayerEmptyLabel(recommendation: TodayRecommendation, weatherState?: TodayWeatherState) {
  const isMissingOuterLayer = (recommendation.missingSlots ?? []).includes('outerLayer')

  if (weatherState?.status === 'ready') {
    const temperature = weatherState.weather.temperatureC

    if (isMissingOuterLayer) {
      if (weatherState.weather.isCold) {
        return '天气偏冷，缺少合适外套'
      }

      if (temperature <= 18) {
        return `${temperature}°C 微凉，缺少合适外套`
      }

      return '缺少合适外套'
    }

    if (weatherState.weather.isWarm) {
      return `${temperature}°C 偏暖，不建议加外套`
    }

    if (temperature >= 19) {
      return `${temperature}°C 温和，可不加外套`
    }

    return `${temperature}°C，按偏好可不加外套`
  }

  return isMissingOuterLayer ? '缺少合适外套' : '今天可不加外套'
}

function SlotTile({
  slot,
  canReplace,
  isReplacing,
  emptyLabel,
  onRequestReplace
}: {
  slot: HeroSlot
  canReplace: boolean
  isReplacing: boolean
  emptyLabel?: string
  onRequestReplace?: (slot: TodayReplaceableSlot) => void
}) {
  const label = itemName(slot.item, emptyLabel ?? `待补充${slot.label}`)

  return (
    <div className={`relative overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-white/82 ${slot.className}`}>
      {slot.item?.imageUrl ? (
        <Image
          src={slot.item.imageUrl}
          alt={itemAlt(slot.label, slot.item)}
          fill
          unoptimized
          sizes="180px"
          className="object-contain p-1.5"
        />
      ) : (
        <div className="flex h-full min-h-0 w-full items-center justify-center px-2 text-center text-xs font-semibold leading-4 text-[var(--color-neutral-dark)]">
          {label}
        </div>
      )}
      <span className="absolute left-1.5 top-1.5 rounded-full bg-white/86 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] shadow-[0_6px_12px_rgba(0,0,0,0.08)]">
        {slot.label}
      </span>
      {canReplace ? (
        <button
          type="button"
          aria-label={`更换${getSlotDisplayLabel(slot.key)}`}
          aria-busy={isReplacing}
          disabled={isReplacing}
          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-primary)]/15 bg-[var(--color-accent)] text-[10px] font-semibold text-[var(--color-primary)] shadow-[0_8px_16px_rgba(17,14,9,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(17,14,9,0.2)] disabled:translate-y-0 disabled:opacity-55"
          onClick={() => onRequestReplace?.(slot.key)}
        >
          换
        </button>
      ) : null}
    </div>
  )
}

export function TodayOutfitHero({
  recommendation,
  weatherState,
  replaceableSlots = [],
  replacingSlot = null,
  onRequestReplace
}: {
  recommendation: TodayRecommendation
  variant?: 'hero' | 'compact'
  weatherState?: TodayWeatherState
  replaceableSlots?: TodayReplaceableSlot[]
  replacingSlot?: TodayReplaceableSlot | null
  onRequestReplace?: (slot: TodayReplaceableSlot) => void
}) {
  const accessories = recommendation.accessories ?? []
  const visibleAccessory = accessories[0] ?? null
  const extraAccessoryCount = Math.max(0, accessories.length - 1)
  const hasDress = Boolean(recommendation.dress)
  const replaceableSlotSet = new Set(replaceableSlots)
  const outerLayerEmptyLabel = getOuterLayerEmptyLabel(recommendation, weatherState)
  const slots: HeroSlot[] = hasDress
    ? [
        { key: 'outerLayer', label: '外套', item: recommendation.outerLayer, className: 'col-span-2 row-span-1' },
        { key: 'dress', label: '主件', item: recommendation.dress, className: 'col-span-2 row-span-2' },
        { key: 'shoes', label: '鞋履', item: recommendation.shoes, className: 'col-span-1 row-span-1' },
        { key: 'bag', label: '包袋', item: recommendation.bag ?? visibleAccessory, className: 'col-span-1 row-span-1' }
      ]
    : [
        { key: 'outerLayer', label: '外套', item: recommendation.outerLayer, className: 'col-span-2 row-span-1' },
        { key: 'top', label: '上装', item: recommendation.top, className: 'col-span-1 row-span-2' },
        { key: 'bottom', label: '下装', item: recommendation.bottom, className: 'col-span-1 row-span-2' },
        { key: 'shoes', label: '鞋履', item: recommendation.shoes, className: 'col-span-1 row-span-1' },
        { key: 'bag', label: '包袋', item: recommendation.bag ?? visibleAccessory, className: 'col-span-1 row-span-1' }
      ]

  return (
    <div className="relative rounded-[1.35rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,238,229,0.9))] p-3 shadow-[0_12px_26px_rgba(17,14,9,0.05)]">
      <div className="grid h-[18rem] grid-cols-2 gap-2">
        {slots.map((slot) => (
          <SlotTile
            key={slot.key}
            slot={slot}
            canReplace={Boolean(slot.item) && replaceableSlotSet.has(slot.key)}
            isReplacing={replacingSlot === slot.key}
            emptyLabel={slot.key === 'outerLayer' ? outerLayerEmptyLabel : undefined}
            onRequestReplace={onRequestReplace}
          />
        ))}
      </div>
      {extraAccessoryCount > 0 ? (
        <div className="absolute bottom-4 right-4 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-white shadow-[0_10px_18px_rgba(0,0,0,0.16)]">
          +{extraAccessoryCount}
        </div>
      ) : null}
    </div>
  )
}
