import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PrimaryLink } from '@/components/ui/button'

export function TodayPage({ itemCount, hasProfile }: { itemCount: number; hasProfile: boolean }) {
  return (
    <AppShell title="Today">
      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">今天先把基础页面和数据接通。</p>
        <p className="mt-2 text-lg font-medium">{hasProfile ? '欢迎回来' : '正在准备你的个人档案'}</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="你的衣橱还是空的"
          description="先上传几件常穿的单品，Tomorrow 才有推荐空间。"
          action={<PrimaryLink href="/closet">去上传衣物</PrimaryLink>}
        />
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-neutral-dark)]">推荐功能即将接入</p>
          {[1, 2, 3].map((slot) => (
            <Card key={slot}>
              <div className="aspect-[3/4] rounded-lg bg-[var(--color-secondary)]" />
              <p className="mt-3 text-sm">Outfit placeholder</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
