import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SecondaryButton } from '@/components/ui/button'

export function ClosetPage({ itemCount }: { itemCount: number }) {
  return (
    <AppShell title="Closet">
      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">已收录 {itemCount} 件单品</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先把第一件衣物放进来"
          description="下一阶段会把拍照、相册和链接导入都接在这里。"
          action={<SecondaryButton type="button">上传入口即将接入</SecondaryButton>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: Math.min(itemCount, 6) }).map((_, index) => (
            <div key={index} className="aspect-square rounded-md bg-white shadow-sm" />
          ))}
        </div>
      )}
    </AppShell>
  )
}
