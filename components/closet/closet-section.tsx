import type { ReactNode } from 'react'

export function ClosetSection({
  eyebrow,
  title,
  description,
  collapsible = false,
  collapsed = false,
  onToggle,
  emphasize = false,
  tone = 'default',
  children
}: {
  eyebrow: string
  title: string
  description: string
  collapsible?: boolean
  collapsed?: boolean
  onToggle?: () => void
  emphasize?: boolean
  tone?: 'default' | 'import' | 'insights' | 'browse'
  children: ReactNode
}) {
  const toneClasses =
    tone === 'import'
      ? 'bg-[#f3ecdf]'
      : tone === 'insights'
        ? 'bg-[#f6efe3]'
        : tone === 'browse'
          ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(240,233,223,0.96)_100%)]'
          : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(243,236,225,0.98)_100%)]'

  const layerBackClass =
    tone === 'import'
      ? 'bg-[#ddd4c4]'
      : tone === 'insights'
        ? 'bg-[#e5d8c8]'
        : 'bg-[#ddd5c8]'

  const layerMidClass =
    tone === 'import'
      ? 'bg-[#ebe2d3]'
      : tone === 'insights'
        ? 'bg-[#efe5d9]'
        : 'bg-[#ebe2d3]'

  const isLayered = tone !== 'browse'

  return (
    <div className={`relative ${isLayered ? 'px-1 pb-3 pt-1.5' : ''}`}>
      {isLayered ? (
        <>
          <div className={`absolute inset-x-2 bottom-0 top-4 rounded-[1.55rem] border border-black/6 ${layerBackClass}`} aria-hidden="true" />
          <div className={`absolute inset-x-1 bottom-1 top-2.5 rounded-[1.55rem] border border-black/6 ${layerMidClass}`} aria-hidden="true" />
        </>
      ) : null}

      <section
        className={`relative rounded-[1.5rem] border border-[var(--color-line)] ${toneClasses} p-3.5 shadow-[var(--shadow-soft)] ${
          emphasize ? 'sm:p-4' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">{eyebrow}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-base font-semibold tracking-[-0.03em] text-[var(--color-primary)]">{title}</h2>
              <p className="text-xs text-[var(--color-neutral-dark)]">{description}</p>
            </div>
          </div>

          {collapsible ? (
            <button
              type="button"
              className="shrink-0 rounded-full border border-[var(--color-line)] bg-white/88 px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-[var(--color-neutral-dark)] shadow-sm"
              onClick={onToggle}
            >
              {collapsed ? '展开' : '收起'}
            </button>
          ) : null}
        </div>

        {collapsed ? null : <div className="mt-3">{children}</div>}
      </section>
    </div>
  )
}
