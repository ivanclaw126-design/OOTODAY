import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { getReplaceableSlots, getSlotActionLabel } from '@/components/today/today-slot-replacement-actions'
import type { TodayFeedbackReasonTag, TodayRecommendation, TodayReplaceableSlot } from '@/lib/today/types'

const feedbackReasons: Array<{ tag: TodayFeedbackReasonTag; label: string }> = [
  { tag: 'dislike_color', label: '颜色不喜欢' },
  { tag: 'dislike_silhouette', label: '比例不对' },
  { tag: 'dislike_too_complex', label: '太复杂' },
  { tag: 'dislike_too_plain', label: '太普通' },
  { tag: 'dislike_too_bold', label: '太夸张' },
  { tag: 'dislike_shoes', label: '鞋子不搭' },
  { tag: 'dislike_scene_fit', label: '不适合今天' },
  { tag: 'dislike_comfort', label: '不够舒服' },
  { tag: 'dislike_item', label: '不想穿这件单品' }
]

export function TodayQuickFeedbackSheet({
  recommendation,
  selectedScope,
  selectedSlot,
  selectedReasonTags,
  isSubmitting,
  error,
  onSelectOutfit,
  onSelectSlot,
  onToggleReason,
  onSubmit,
  onCancel
}: {
  recommendation: TodayRecommendation
  selectedScope: 'outfit' | 'slot'
  selectedSlot: TodayReplaceableSlot | null
  selectedReasonTags: TodayFeedbackReasonTag[]
  isSubmitting: boolean
  error: string | null
  onSelectOutfit: () => void
  onSelectSlot: (slot: TodayReplaceableSlot) => void
  onToggleReason: (tag: TodayFeedbackReasonTag) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const slots = getReplaceableSlots(recommendation)

  return (
    <div className="space-y-3 rounded-[1.25rem] border border-[var(--color-line)] bg-white/82 p-3 shadow-[0_16px_32px_rgba(17,14,9,0.08)]">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-primary)]">不想穿哪里？</p>
        <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">整套反馈会降低这张卡优先级；单品反馈会自动尝试局部替换。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <SecondaryButton
          type="button"
          aria-pressed={selectedScope === 'outfit'}
          className={selectedScope === 'outfit' ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
          onClick={onSelectOutfit}
        >
          整套都不想穿
        </SecondaryButton>
        {slots.map((slot) => (
          <SecondaryButton
            key={slot}
            type="button"
            aria-pressed={selectedScope === 'slot' && selectedSlot === slot}
            className={selectedScope === 'slot' && selectedSlot === slot ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
            onClick={() => onSelectSlot(slot)}
          >
            {getSlotActionLabel(slot).replace('换', '')}不想穿
          </SecondaryButton>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {feedbackReasons.map((reason) => {
          const selected = selectedReasonTags.includes(reason.tag)

          return (
            <SecondaryButton
              key={reason.tag}
              type="button"
              aria-pressed={selected}
              className={selected ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
              onClick={() => onToggleReason(reason.tag)}
            >
              {reason.label}
            </SecondaryButton>
          )
        })}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <PrimaryButton type="button" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? '正在保存...' : '提交反馈'}
        </PrimaryButton>
        <SecondaryButton type="button" disabled={isSubmitting} onClick={onCancel}>
          取消
        </SecondaryButton>
      </div>
    </div>
  )
}
