import { Card } from '@/components/ui/card'

export function TodayCityPromptCard() {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">填写常住城市，可获得更准确推荐</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">
          没填也能正常推荐，但加入天气后，Today 会更贴近真实场景。
        </p>
      </div>
    </Card>
  )
}
