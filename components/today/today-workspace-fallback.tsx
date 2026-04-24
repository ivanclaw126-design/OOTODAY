import { Card } from '@/components/ui/card'

export function TodayWorkspaceFallback() {
  return (
    <div className="space-y-4">
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(240,233,223,0.92)_100%)]">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full bg-black/8" />
          <div className="h-24 rounded-[1.5rem] bg-[#111111]" />
        </div>
      </Card>
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(238,231,220,0.94)_100%)]">
        <div className="space-y-3">
          <div className="h-4 w-36 rounded-full bg-black/8" />
          <div className="grid gap-3">
            <div className="h-40 rounded-[1.5rem] bg-white/80" />
            <div className="h-40 rounded-[1.5rem] bg-white/80" />
          </div>
        </div>
      </Card>
    </div>
  )
}
