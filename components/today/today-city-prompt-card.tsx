import { Card } from '@/components/ui/card'

export function TodayCityPromptCard() {
  return (
    <Card>
      <div className="space-y-1 border-l-4 border-[var(--color-primary)] pl-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">城市 / weather</p>
        <p className="text-sm font-medium">填写常住城市，可获得更准推荐</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">没填也能推荐，只是会少掉天气维度。</p>
      </div>
    </Card>
  )
}
