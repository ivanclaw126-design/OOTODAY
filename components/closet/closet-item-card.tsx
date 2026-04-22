import { SecondaryButton } from '@/components/ui/button'
import type { ClosetItemCardData } from '@/lib/closet/types'

export function ClosetItemCard({
  item,
  onDelete,
  isDeleting
}: {
  item: ClosetItemCardData
  onDelete?: (item: ClosetItemCardData) => void
  isDeleting?: boolean
}) {
  const imageAlt = [item.category, item.colorCategory].filter(Boolean).join(' ')

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="aspect-square bg-[var(--color-secondary)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-neutral-dark)]">
            暂无图片
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-sm font-medium">{item.category}</p>
        {item.subCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.subCategory}</p> : null}
        {item.colorCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.colorCategory}</p> : null}
        {onDelete ? (
          <div className="mt-2">
            <SecondaryButton type="button" onClick={() => onDelete(item)} disabled={isDeleting}>
              {isDeleting ? '删除中…' : '删除这件衣物'}
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </article>
  )
}
