import { OnboardingChecklist } from '@/components/beta/onboarding-checklist'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { AppShell } from '@/components/app-shell'
import Link from 'next/link'
import { TodayInteractiveWorkspace } from '@/components/today/today-interactive-workspace'
import { TodaySettingsPanel } from '@/components/today/today-settings-panel'
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
  signOut,
  updateHistoryEntry,
  deleteHistoryEntry
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  submitOotd: (input: TodayOotdFeedbackInput) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: (input: { offset: number }) => Promise<{ recommendations: TodayRecommendation[] }>
  changePassword: (input: { password: string; confirmPassword: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateHistoryEntry: (input: TodayHistoryUpdateInput) => Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }>
  deleteHistoryEntry: (input: { ootdId: string }) => Promise<{ error: string | null }>
}) {
  return (
    <AppShell title="Today">
      <PageViewTracker
        eventName="today_viewed"
        module="today"
        properties={{
          itemCount: view.itemCount,
          city: view.city,
          hasRecommendations: view.recommendations.length > 0
        }}
      />
      <div className="space-y-4">
        {!view.hasCompletedStyleQuestionnaire ? (
          <div
            className="relative overflow-hidden rounded-[1.7rem] border border-black/10 p-5 text-white shadow-[0_22px_50px_rgba(21,21,18,0.18)]"
            style={{ background: 'radial-gradient(circle at 12% 20%, rgba(231,255,55,0.34), transparent 30%), linear-gradient(135deg, rgba(21,21,18,0.98) 0%, rgba(48,57,43,0.97) 56%, rgba(18,18,16,0.99) 100%)' }}
          >
            <div className="pointer-events-none absolute right-5 top-5 grid h-16 w-16 grid-cols-3 gap-1 opacity-45">
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} className={index % 2 === 0 ? 'rounded-full bg-white/22' : 'rounded-full bg-[var(--color-accent)]/82'} />
              ))}
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">AI recommendation engine</p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em]">先让 AI 认识你的穿法</h2>
                <p className="text-sm leading-6 text-white/84">花一分钟填写风格问卷，Today 会用你的场景、轮廓和颜色偏好重新校准推荐。</p>
              </div>
              <Link
                href="/preferences"
                className="inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.16)] hover:-translate-y-0.5"
                style={{ background: '#ffffff', color: 'var(--color-primary)' }}
              >
                填写风格问卷
              </Link>
            </div>
          </div>
        ) : null}

        <TodayStatusCard city={view.city} weatherState={view.weatherState} />

        {view.itemCount === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title="你的衣橱还是空的"
              description="先上传 5-10 件常穿的单品，Today 才能给出真实推荐。"
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
            updateHistoryEntry={updateHistoryEntry}
            deleteHistoryEntry={deleteHistoryEntry}
          />
        )}
        <TodaySettingsPanel
          accountEmail={view.accountEmail}
          passwordBootstrapped={view.passwordBootstrapped}
          passwordChangedAt={view.passwordChangedAt}
          changePassword={changePassword}
          signOut={signOut}
        />
      </div>
    </AppShell>
  )
}
