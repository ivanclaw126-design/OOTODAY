import { OnboardingChecklist } from '@/components/beta/onboarding-checklist'
import { PageViewTracker } from '@/components/beta/page-view-tracker'
import { AppShell } from '@/components/app-shell'
import { TodayInteractiveWorkspace } from '@/components/today/today-interactive-workspace'
import { TodayStatusCard } from '@/components/today/today-status-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PrimaryLink } from '@/components/ui/button'
import type { TodayHistoryUpdateInput, TodayOotdFeedbackInput, TodayOotdHistoryEntry, TodayRecommendation, TodayView } from '@/lib/today/types'

export function TodayPage({
  view,
  updateCity,
  submitOotd,
  refreshRecommendations,
  changePassword,
  updateHistoryEntry,
  deleteHistoryEntry
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  submitOotd: (input: TodayOotdFeedbackInput) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: (input: { offset: number }) => Promise<{ recommendations: TodayRecommendation[] }>
  changePassword: (input: { password: string; confirmPassword: string }) => Promise<{ error: string | null }>
  updateHistoryEntry: (input: TodayHistoryUpdateInput) => Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }>
  deleteHistoryEntry: (input: { ootdId: string }) => Promise<{ error: string | null }>
}) {
  return (
    <AppShell title="Today">
      <PageViewTracker event="today_viewed" surface="today" />
      <div className="space-y-4">
        <TodayStatusCard weatherState={view.weatherState} />

        {view.itemCount === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title="你的衣橱还是空的"
              description="先上传几件常穿的单品，Today 才能给出真实推荐。"
              action={<PrimaryLink href="/closet?onboarding=1">去上传衣物</PrimaryLink>}
            />
            <OnboardingChecklist
              compact
              title="先把第一次闭环跑通"
              description="现在最重要的不是把所有页都点一遍，而是先把导入、推荐和反馈跑完一轮。"
            />
          </div>
        ) : (
          <TodayInteractiveWorkspace
            view={view}
            updateCity={updateCity}
            submitOotd={submitOotd}
            refreshRecommendations={refreshRecommendations}
            changePassword={changePassword}
            updateHistoryEntry={updateHistoryEntry}
            deleteHistoryEntry={deleteHistoryEntry}
          />
        )}
      </div>
    </AppShell>
  )
}
