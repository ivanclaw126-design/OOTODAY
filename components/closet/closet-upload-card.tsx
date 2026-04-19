'use client'

import { Card } from '@/components/ui/card'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

type ClosetUploadCardProps = {
  userId: string
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetUploadCard({ userId, storageBucket }: ClosetUploadCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">添加衣物</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">上传一张单件衣物图片，AI 会帮你生成分类建议。</p>
        <label className="inline-flex w-fit cursor-pointer rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)]">
          添加衣物
          <input aria-label="选择衣物图片" type="file" accept="image/*" capture="environment" className="sr-only" />
        </label>
        <p className="text-xs text-[var(--color-neutral-dark)]">当前用户：{userId}，bucket：{storageBucket}</p>
      </div>
    </Card>
  )
}
