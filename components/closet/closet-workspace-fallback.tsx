import { ClosetSection } from '@/components/closet/closet-section'

export function ClosetWorkspaceFallback() {
  return (
    <div className="grid gap-3">
      <ClosetSection eyebrow="Step 1" title="导入衣物" description="正在载入导入工作区…" tone="import">
        <div className="h-40 rounded-[1.25rem] bg-white/70" />
      </ClosetSection>
      <ClosetSection eyebrow="Step 2" title="整理建议" description="正在整理洞察视图…" tone="insights">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-32 rounded-[1.25rem] bg-white/75" />
          <div className="h-32 rounded-[1.25rem] bg-white/75" />
          <div className="h-32 rounded-[1.25rem] bg-white/75" />
        </div>
      </ClosetSection>
      <ClosetSection eyebrow="Step 3" title="衣橱浏览" description="正在载入浏览工作区…" tone="browse" emphasize>
        <div className="h-64 rounded-[1.25rem] bg-white/75" />
      </ClosetSection>
    </div>
  )
}
