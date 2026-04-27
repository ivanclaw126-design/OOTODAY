import { Card } from '@/components/ui/card'

export function TodayCityPromptCard() {
  return (
    <Card>
      <div className="flex flex-col gap-4 border-l-4 border-[var(--color-primary)] pl-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">城市 / weather</p>
          <p className="text-sm font-medium">填写常住城市，可获得更准推荐</p>
          <p className="text-sm text-[var(--color-neutral-dark)]">在“今日状态”里设置即可；没填也能推荐，只是会少掉天气维度。</p>
        </div>
      </div>
    </Card>
  )
}
