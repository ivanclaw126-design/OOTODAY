import type { ClosetItemCardData } from '@/lib/closet/types'
import { ClosetItemCard } from '@/components/closet/closet-item-card'

export function ClosetItemGrid({
  items,
  onDeleteItem,
  deletingItemId,
  emptyTitle = '当前没有符合条件的单品',
  emptyDescription = '换个筛选看看，或者继续往衣橱里补新的单品。'
}: {
  items: ClosetItemCardData[]
  onDeleteItem?: (item: ClosetItemCardData) => void
  deletingItemId?: string | null
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
        <ClosetItemCard key={item.id} item={item} onDelete={onDeleteItem} isDeleting={deletingItemId === item.id} />
      ))}
    </div>
  )
}
