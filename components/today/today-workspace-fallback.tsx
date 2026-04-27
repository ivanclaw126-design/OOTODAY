import { Card } from '@/components/ui/card'

export function TodayWorkspaceFallback() {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/78 p-2.5 shadow-[0_10px_22px_rgba(17,14,9,0.04)]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-14 w-20 shrink-0 animate-pulse rounded-full bg-[var(--color-primary)]/12" />
          <div className="h-14 w-40 shrink-0 animate-pulse rounded-full bg-white/82" />
          <div className="h-14 w-28 shrink-0 animate-pulse rounded-full bg-white/82" />
        </div>
      </section>
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(238,231,220,0.94)_100%)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-black/8" />
            <div className="h-8 w-52 animate-pulse rounded-2xl bg-black/10" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-black/8" />
          </div>
          <div className="rounded-[1.35rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,238,229,0.9))] p-3">
            <div className="grid h-[18rem] grid-cols-2 gap-2">
              <div className="col-span-2 row-span-1 animate-pulse rounded-[1rem] border border-[var(--color-line)] bg-white/82" />
              <div className="col-span-1 row-span-2 animate-pulse rounded-[1rem] border border-[var(--color-line)] bg-white/82" />
              <div className="col-span-1 row-span-2 animate-pulse rounded-[1rem] border border-[var(--color-line)] bg-white/82" />
              <div className="col-span-1 row-span-1 animate-pulse rounded-[1rem] border border-[var(--color-line)] bg-white/82" />
              <div className="col-span-1 row-span-1 animate-pulse rounded-[1rem] border border-[var(--color-line)] bg-white/82" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-11 animate-pulse rounded-full bg-[var(--color-primary)]/12" />
            <div className="h-11 animate-pulse rounded-full bg-[var(--color-accent)]/35" />
            <div className="h-11 animate-pulse rounded-full bg-white/80" />
          </div>
        </div>
      </Card>
    </div>
  )
}
