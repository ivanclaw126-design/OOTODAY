import type { ClosetItemCardData } from '@/lib/closet/types'
import { ClosetItemCard } from '@/components/closet/closet-item-card'

export function ClosetItemGrid({ items }: { items: ClosetItemCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <ClosetItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
