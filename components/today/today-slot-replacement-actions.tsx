import { SecondaryButton } from '@/components/ui/button'
import type { TodayRecommendation, TodayReplaceableSlot } from '@/lib/today/types'

const slotActionLabels: Record<TodayReplaceableSlot, string> = {
  top: '换上装',
  bottom: '换下装',
  dress: '换主件',
  outerLayer: '换外套',
  shoes: '换鞋履',
  bag: '换包袋',
  accessories: '换配饰'
}

const slotDisplayLabels: Record<TodayReplaceableSlot, string> = {
  top: '上装',
  bottom: '下装',
  dress: '主件',
  outerLayer: '外套',
  shoes: '鞋履',
  bag: '包袋',
  accessories: '配饰'
}

export function getReplaceableSlots(recommendation: TodayRecommendation): TodayReplaceableSlot[] {
  return [
    recommendation.shoes ? 'shoes' : null,
    recommendation.outerLayer ? 'outerLayer' : null,
    recommendation.bag ? 'bag' : null,
    recommendation.bottom ? 'bottom' : null,
    recommendation.dress ? 'dress' : null,
    recommendation.top && !recommendation.dress ? 'top' : null
  ].filter((slot): slot is TodayReplaceableSlot => Boolean(slot))
}

export function getSlotActionLabel(slot: TodayReplaceableSlot) {
  return slotActionLabels[slot]
}

export function getSlotDisplayLabel(slot: TodayReplaceableSlot) {
  return slotDisplayLabels[slot]
}

export function TodaySlotReplacementActions({
  recommendation,
  disabled,
  replacingSlot,
  onReplace,
  onOpenFeedback
}: {
  recommendation: TodayRecommendation
  disabled?: boolean
  replacingSlot: TodayReplaceableSlot | null
  onReplace: (slot: TodayReplaceableSlot) => void
  onOpenFeedback: () => void
}) {
  const slots = getReplaceableSlots(recommendation)

  return (
    <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slots.map((slot) => (
        <SecondaryButton
          key={slot}
          type="button"
          disabled={disabled || Boolean(replacingSlot)}
          className="min-h-11 shrink-0 px-3"
          onClick={() => onReplace(slot)}
        >
          {replacingSlot === slot ? `正在${slotActionLabels[slot]}...` : slotActionLabels[slot]}
        </SecondaryButton>
      ))}
      <SecondaryButton
        type="button"
        disabled={disabled}
        className="min-h-11 shrink-0 px-3"
        onClick={onOpenFeedback}
      >
        不想穿
      </SecondaryButton>
    </div>
  )
}
