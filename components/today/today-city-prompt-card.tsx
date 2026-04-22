import { Card } from '@/components/ui/card'

export function TodayCityPromptCard() {
  return (
    <Card>
      <div className="space-y-2 border-l-4 border-[var(--color-primary)] pl-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">城市 / weather</p>
        <p className="text-sm font-medium leading-6">填写常住城市，可获得更准确推荐</p>
        <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
          没填也能正常推荐，但加入天气后，Today 会更贴近真实场景。
        </p>
      </div>
    </Card>
  )
}
