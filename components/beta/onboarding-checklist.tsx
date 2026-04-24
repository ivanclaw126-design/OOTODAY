import { firstRunSteps } from '@/lib/beta/first-run-content'

export function OnboardingChecklist({
  title = '先完成这 3 步',
  description = '先跑通一轮最小闭环，再去扩展 Travel、Looks 和 Shop。',
  compact = false
}: {
  title?: string
  description?: string | null
  compact?: boolean
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">First run</p>
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-[var(--color-neutral-dark)]">{description}</p> : null}
      </div>

      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-1' : 'sm:grid-cols-3'}`}>
        {firstRunSteps.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-primary)]">{item.step}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-primary)]">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-dark)]">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
