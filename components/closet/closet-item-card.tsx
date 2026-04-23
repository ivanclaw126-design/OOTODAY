'use client'

import { SecondaryButton } from '@/components/ui/button'
import { ClosetItemImage } from '@/components/closet/closet-item-image'
import { ClosetCategoryBadge, ClosetColorBadge } from '@/components/closet/closet-taxonomy-icons'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { useState } from 'react'

export function ClosetItemCard({
  item,
  onEdit,
  onReanalyze,
  onDelete,
  onRotateImage,
  onRestoreOriginalImage,
  isReanalyzing,
  isDeleting,
  isFlipping
}: {
  item: ClosetItemCardData
  onEdit?: (item: ClosetItemCardData) => void
  onReanalyze?: (item: ClosetItemCardData) => void
  onDelete?: (item: ClosetItemCardData) => void
  onRotateImage?: (item: ClosetItemCardData) => void
  onRestoreOriginalImage?: (item: ClosetItemCardData) => void
  isReanalyzing?: boolean
  isDeleting?: boolean
  isFlipping?: boolean
}) {
  const imageAlt = [item.category, item.colorCategory].filter(Boolean).join(' ')
  const [confirmingAction, setConfirmingAction] = useState<'rotate' | 'restore' | null>(null)

  function handleRotateIntent() {
    setConfirmingAction((current) => (current === 'rotate' ? null : 'rotate'))
  }

  function handleRestoreIntent() {
    setConfirmingAction((current) => (current === 'restore' ? null : 'restore'))
  }

  function handleConfirmAction() {
    if (confirmingAction === 'rotate') {
      onRotateImage?.(item)
    }

    if (confirmingAction === 'restore' && item.canRestoreOriginal) {
      onRestoreOriginalImage?.(item)
    }

    setConfirmingAction(null)
  }

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="aspect-square bg-[var(--color-secondary)]">
        {item.imageUrl ? (
          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <ClosetItemImage src={item.imageUrl} alt={imageAlt} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-neutral-dark)]">
            暂无图片
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex flex-wrap gap-2">
          <ClosetCategoryBadge category={item.category} />
          {item.colorCategory ? <ClosetColorBadge color={item.colorCategory} /> : null}
        </div>
        {item.subCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.subCategory}</p> : null}
        {onEdit || onReanalyze || onDelete || onRotateImage || onRestoreOriginalImage ? (
          <div className="mt-2 flex flex-col gap-2">
            {onRotateImage || onRestoreOriginalImage ? (
              <div className="flex flex-wrap items-center gap-2">
                {onRotateImage ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--color-neutral-mid)] bg-[var(--color-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]"
                    onClick={handleRotateIntent}
                    disabled={isFlipping}
                  >
                    {isFlipping && confirmingAction === 'rotate' ? '处理中…' : '右转 90°'}
                  </button>
                ) : null}
                {item.canRestoreOriginal && onRestoreOriginalImage ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--color-neutral-mid)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-neutral-dark)]"
                    onClick={handleRestoreIntent}
                    disabled={isFlipping}
                  >
                    {isFlipping && confirmingAction === 'restore' ? '处理中…' : '恢复原图'}
                  </button>
                ) : null}
                {confirmingAction && (confirmingAction !== 'restore' || item.canRestoreOriginal) ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-medium text-white"
                    onClick={handleConfirmAction}
                    disabled={isFlipping}
                  >
                    {confirmingAction === 'restore' ? '确认恢复' : '确认右转'}
                  </button>
                ) : null}
              </div>
            ) : null}
            {onEdit ? (
              <SecondaryButton type="button" onClick={() => onEdit(item)}>
                编辑识别结果
              </SecondaryButton>
            ) : null}
            {onReanalyze ? (
              <SecondaryButton type="button" onClick={() => onReanalyze(item)} disabled={isReanalyzing}>
                {isReanalyzing ? '重新识别中…' : '一键重新识别'}
              </SecondaryButton>
            ) : null}
            {onDelete ? (
              <SecondaryButton type="button" onClick={() => onDelete(item)} disabled={isDeleting}>
                {isDeleting ? '删除中…' : '删除这件衣物'}
              </SecondaryButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
