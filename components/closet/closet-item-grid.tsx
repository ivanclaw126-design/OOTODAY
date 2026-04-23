import type { ClosetItemCardData } from '@/lib/closet/types'
import { ClosetItemCard } from '@/components/closet/closet-item-card'

export function ClosetItemGrid({
  items,
  onEditItem,
  onReanalyzeItem,
  onDeleteItem,
  onRotateImageItem,
  onRestoreOriginalImageItem,
  reanalyzingItemId,
  deletingItemId,
  flippingItemId,
  emptyTitle = '当前没有符合条件的单品',
  emptyDescription = '换个筛选看看，或者继续往衣橱里补新的单品。'
}: {
  items: ClosetItemCardData[]
  onEditItem?: (item: ClosetItemCardData) => void
  onReanalyzeItem?: (item: ClosetItemCardData) => void
  onDeleteItem?: (item: ClosetItemCardData) => void
  onRotateImageItem?: (item: ClosetItemCardData) => void
  onRestoreOriginalImageItem?: (item: ClosetItemCardData) => void
  reanalyzingItemId?: string | null
  deletingItemId?: string | null
  flippingItemId?: string | null
  emptyTitle?: string
  emptyDescription?: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-[var(--color-neutral-mid)] bg-white p-5 text-center">
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ClosetItemCard
          key={item.id}
          item={item}
          onEdit={onEditItem}
          onReanalyze={onReanalyzeItem}
          onDelete={onDeleteItem}
          onRotateImage={onRotateImageItem}
          onRestoreOriginalImage={onRestoreOriginalImageItem}
          isReanalyzing={reanalyzingItemId === item.id}
          isDeleting={deletingItemId === item.id}
          isFlipping={flippingItemId === item.id}
        />
      ))}
    </div>
  )
}
