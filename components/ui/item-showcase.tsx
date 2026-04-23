'use client'

import Image from 'next/image'

export type ItemShowcaseEntry = {
  id: string
  imageUrl: string | null
  label: string
  meta?: string | null
}

export function ItemShowcase({
  items,
  title,
  subtitle,
  compact = false
}: {
  items: ItemShowcaseEntry[]
  title?: string
  subtitle?: string | null
  compact?: boolean
}) {
  const visibleItems = items.slice(0, 4)
  const hasImages = visibleItems.some((item) => item.imageUrl)
  const gridClassName =
    visibleItems.length <= 1
      ? 'grid-cols-1'
      : visibleItems.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-2'

  return (
    <div className="rounded-[1.35rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.86)] p-3 shadow-[0_10px_24px_rgba(17,14,9,0.05)]">
      <div className="flex items-start gap-3">
        <div
          className={`grid aspect-square w-24 shrink-0 overflow-hidden rounded-[1.1rem] bg-[var(--color-secondary)] ${
            hasImages ? `${gridClassName} gap-px` : 'place-items-center'
          } ${compact ? 'w-20' : 'w-24'}`}
        >
          {hasImages ? (
            visibleItems.map((item) => (
              <div key={item.id} className="relative min-h-0 min-w-0 bg-white">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 112px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-medium text-[var(--color-neutral-dark)]">
                    {item.label}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 text-center text-[11px] font-medium leading-4 text-[var(--color-neutral-dark)]">
              暂无图片
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {title ? (
            <p className={`${compact ? 'text-sm' : 'text-[0.95rem]'} font-semibold leading-5 text-[var(--color-primary)]`}>
              {title}
            </p>
          ) : null}
          {subtitle ? <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">{subtitle}</p> : null}
          {visibleItems.length > 1 ? (
            <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">
              {visibleItems.map((item) => item.label).join(' / ')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
