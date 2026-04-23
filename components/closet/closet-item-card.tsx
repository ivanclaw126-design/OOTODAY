import { SecondaryButton } from '@/components/ui/button'
import { ClosetCategoryBadge, ClosetColorBadge } from '@/components/closet/closet-taxonomy-icons'
import type { ClosetItemCardData } from '@/lib/closet/types'

export function ClosetItemCard({
  item,
  onEdit,
  onReanalyze,
  onDelete,
  isReanalyzing,
  isDeleting
}: {
  item: ClosetItemCardData
  onEdit?: (item: ClosetItemCardData) => void
  onReanalyze?: (item: ClosetItemCardData) => void
  onDelete?: (item: ClosetItemCardData) => void
  isReanalyzing?: boolean
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
        <div className="flex flex-wrap gap-2">
          <ClosetCategoryBadge category={item.category} />
          {item.colorCategory ? <ClosetColorBadge color={item.colorCategory} /> : null}
        </div>
        {item.subCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.subCategory}</p> : null}
        {onEdit || onReanalyze || onDelete ? (
          <div className="mt-2 flex flex-col gap-2">
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
