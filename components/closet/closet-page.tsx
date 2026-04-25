import { OnboardingChecklist } from '@/components/beta/onboarding-checklist'
import { AnalyticsEventTracker } from '@/components/analytics/event-tracker'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { AppShell } from '@/components/app-shell'
import { ClosetSection } from '@/components/closet/closet-section'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { ClosetWorkspace } from '@/components/closet/closet-workspace'
import { DemoClosetImportPrompt } from '@/components/closet/demo-closet-import-prompt'
import type { DemoClosetAudience } from '@/lib/demo/demo-closet'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetInsights, ClosetItemCardData } from '@/lib/closet/types'

type ClosetPageProps = {
  userId: string
  onboardingMode?: boolean
  itemCount: number
  items: ClosetItemCardData[]
  insights: ClosetInsights
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  analyzeImportUrl: (input: { sourceUrl: string }) => Promise<{ error: string | null; draft: ClosetAnalysisDraft | null }>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
  updateItem: (input: { itemId: string; draft: ClosetAnalysisDraft }) => Promise<void>
  replaceItemImage?: (input: { itemId: string; draft: ClosetAnalysisDraft }) => Promise<{
    persisted: boolean
    imageUrl?: string | null
    imageFlipped?: boolean
    imageOriginalUrl?: string | null
    imageRotationQuarterTurns?: number
    imageRestoreExpiresAt?: string | null
    canRestoreOriginal?: boolean
  }>
  reanalyzeItem: (input: { itemId: string }) => Promise<ClosetAnalysisDraft>
  deleteItem: (input: { itemId: string }) => Promise<void>
  copyDemoCloset?: (audience: DemoClosetAudience) => Promise<{ error: string | null; copiedCount: number }>
  updateImageRotation: (input: {
    itemId: string
    operation: 'rotate-right-90' | 'restore-original'
  }) => Promise<{
    persisted: boolean
    imageUrl?: string | null
    imageFlipped?: boolean
    imageOriginalUrl?: string | null
    imageRotationQuarterTurns?: number
    imageRestoreExpiresAt?: string | null
    canRestoreOriginal?: boolean
  }>
}

export function ClosetPage({
  userId,
  onboardingMode = false,
  itemCount,
  items,
  insights,
  storageBucket,
  analyzeUpload,
  analyzeImportUrl,
  saveItem,
  updateItem,
  replaceItemImage = async () => {
    throw new Error('图片替换暂不可用')
  },
  reanalyzeItem,
  deleteItem,
  copyDemoCloset = async () => ({ error: '演示衣橱导入暂不可用', copiedCount: 0 }),
  updateImageRotation
}: ClosetPageProps) {
  return (
    <AppShell title="Closet">
      <PageViewTracker eventName="closet_viewed" module="closet" properties={{ itemCount }} />
      {itemCount === 0 ? (
        <AnalyticsEventTracker
          eventName="closet_empty_state_viewed"
          module="closet"
          properties={{ route: onboardingMode ? 'onboarding' : 'default' }}
        />
      ) : null}
      <section className="overflow-hidden rounded-[1.55rem] bg-[#111111] text-white shadow-[var(--shadow-strong)]">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-end gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">Closet</p>
            <p className="text-sm text-white/72">已收录</p>
            <p className="text-[2rem] font-semibold leading-none tracking-[-0.08em] text-[var(--color-accent)]">{itemCount}</p>
            <p className="pb-0.5 text-sm text-white/72">件</p>
          </div>
          {itemCount === 0 ? <p className="max-w-sm text-sm leading-6 text-white/72">先导入几件最常穿的衣服，Today 才会开始变得有用。</p> : null}
        </div>
      </section>

      {itemCount > 0 ? (
        <ClosetWorkspace
          userId={userId}
          itemCount={itemCount}
          items={items}
          insights={insights}
          storageBucket={storageBucket}
          analyzeUpload={analyzeUpload}
          analyzeImportUrl={analyzeImportUrl}
          saveItem={saveItem}
          updateItem={updateItem}
          replaceItemImage={replaceItemImage}
          reanalyzeItem={reanalyzeItem}
          deleteItem={deleteItem}
          copyDemoCloset={copyDemoCloset}
          updateImageRotation={updateImageRotation}
        />
      ) : (
        <>
          {onboardingMode ? (
            <OnboardingChecklist
              compact
              title="先在 Closet 完成第一步"
              description={null}
            />
          ) : null}

          <DemoClosetImportPrompt copyDemoCloset={copyDemoCloset} />

          <ClosetSection
            eyebrow="Step 1"
            title="导入衣物"
            description={onboardingMode ? '先放进 5-10 件最常穿的，跑通 Today 后再继续补。' : '先放进第一件，后面就能开始整理。'}
          >
            <ClosetUploadCard
              userId={userId}
              storageBucket={storageBucket}
              analyzeUpload={analyzeUpload}
              analyzeImportUrl={analyzeImportUrl}
              saveItem={saveItem}
            />
          </ClosetSection>
        </>
      )}
    </AppShell>
  )
}
