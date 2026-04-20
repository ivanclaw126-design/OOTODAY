import { AppShell } from '@/components/app-shell'
import { ClosetItemGrid } from '@/components/closet/closet-item-grid'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetItemCardData } from '@/lib/closet/types'

type ClosetPageProps = {
  userId: string
  itemCount: number
  items: ClosetItemCardData[]
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetPage({ userId, itemCount, items, storageBucket, analyzeUpload, saveItem }: ClosetPageProps) {
  return (
    <AppShell title="Closet">
      <ClosetUploadCard
        userId={userId}
        storageBucket={storageBucket}
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />

      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">已收录 {itemCount} 件单品</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先把第一件衣物放进来"
          description="上传一张单件衣物图片，AI 会先给你分类建议，再保存进衣橱。"
        />
      ) : (
        <ClosetItemGrid items={items} />
      )}
    </AppShell>
  )
}
