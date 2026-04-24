'use client'

import { startTransition, useState } from 'react'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { Card } from '@/components/ui/card'
import { ThemeSettingsCard } from '@/components/theme/theme-settings-card'
import { TodayAccountSecurityCard } from '@/components/today/today-account-security-card'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import type { TodayHistoryUpdateInput, TodayOotdFeedbackInput, TodayOotdHistoryEntry, TodayOotdStatus, TodayRecommendation, TodayView } from '@/lib/today/types'

function isSameCalendarDay(left: string, right: string) {
  return new Date(left).toDateString() === new Date(right).toDateString()
}

function getRecordedRecommendationId({
  recommendations,
  ootdStatus,
  historyEntries
}: {
  recommendations: TodayRecommendation[]
  ootdStatus: TodayOotdStatus
  historyEntries: TodayOotdHistoryEntry[]
}) {
  if (ootdStatus.status !== 'recorded') {
    return null
  }

  const todayEntry = historyEntries.find((entry) => isSameCalendarDay(entry.wornAt, ootdStatus.wornAt))

  if (!todayEntry?.notes) {
    return null
  }

  return recommendations.find((recommendation) => buildOotdNotes(recommendation) === todayEntry.notes)?.id ?? null
}

export function TodayInteractiveWorkspace({
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
  const [isEditingCity, setIsEditingCity] = useState(false)
  const [ootdStatus, setOotdStatus] = useState<TodayOotdStatus>(view.ootdStatus)
  const [recommendations, setRecommendations] = useState(view.recommendations)
  const [recommendationOffset, setRecommendationOffset] = useState(0)
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [historyEntries, setHistoryEntries] = useState(view.recentOotdHistory)
  const [recordedRecommendationId, setRecordedRecommendationId] = useState<string | null>(() =>
    getRecordedRecommendationId({
      recommendations: view.recommendations,
      ootdStatus: view.ootdStatus,
      historyEntries: view.recentOotdHistory
    })
  )
  const hasStartedFeedbackLoop = ootdStatus.status === 'recorded' || historyEntries.length > 0

  async function submitTodayOotd(input: TodayOotdFeedbackInput) {
    const result = await submitOotd(input)

    if (!result.error && result.wornAt) {
      setOotdStatus({ status: 'recorded', wornAt: result.wornAt })
      setRecordedRecommendationId(input.recommendation.id)
    }

    return result
  }

  async function handleRefreshRecommendations() {
    setIsRefreshingRecommendations(true)
    const nextOffset = recommendationOffset + 1

    try {
      const result = await refreshRecommendations({ offset: nextOffset })
      startTransition(() => {
        setRecommendations(result.recommendations)
        setRecommendationOffset(nextOffset)
        setRecordedRecommendationId((current) =>
          current && result.recommendations.some((recommendation) => recommendation.id === current) ? current : null
        )
      })
    } finally {
      setIsRefreshingRecommendations(false)
    }
  }

  async function handleUpdateHistoryEntry(input: TodayHistoryUpdateInput) {
    const result = await updateHistoryEntry(input)

    if (!result.error && result.entry) {
      setHistoryEntries((current) => current.map((entry) => (entry.id === result.entry?.id ? result.entry : entry)))
    }

    return result
  }

  async function handleDeleteHistoryEntry(input: { ootdId: string }) {
    const deletedEntry = historyEntries.find((entry) => entry.id === input.ootdId) ?? null
    const result = await deleteHistoryEntry(input)

    if (!result.error) {
      setHistoryEntries((current) => current.filter((entry) => entry.id !== input.ootdId))

      if (deletedEntry && ootdStatus.status === 'recorded' && isSameCalendarDay(deletedEntry.wornAt, ootdStatus.wornAt)) {
        setOotdStatus({ status: 'not-recorded' })
        setRecordedRecommendationId(null)
      }
    }

    return result
  }

  return (
    <>
      {!hasStartedFeedbackLoop ? (
        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(245,239,230,0.94)_100%)]">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">First loop</p>
              <h2 className="text-xl font-semibold tracking-[-0.05em] text-[var(--color-primary)]">先在今天完成第一次推荐闭环</h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-neutral-dark)]">
                先选一套最接近今天会穿的方案，打一个满意度，再看系统下一轮有没有更像你。
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-neutral-dark)]">如果推荐不对劲，也可以直接发反馈，我会优先看 Today 的卡点。</p>
              <FeedbackLink
                surface="today_first_loop"
                label="反馈 Today 问题"
                className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
              />
            </div>
          </div>
        </Card>
      ) : null}

      {!view.city ? <TodayCityPromptCard /> : null}

      <TodayRecommendationList
        recommendations={recommendations}
        recommendationError={view.recommendationError}
        ootdStatus={ootdStatus}
        recordedRecommendationId={recordedRecommendationId}
        submitOotd={submitTodayOotd}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SecondaryButton type="button" onClick={() => void handleRefreshRecommendations()} disabled={isRefreshingRecommendations}>
          {isRefreshingRecommendations ? '正在整理新推荐...' : '换一批推荐'}
        </SecondaryButton>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[18rem]">
          <SecondaryButton type="button" onClick={() => setIsEditingCity(true)}>
            {view.city ? '修改城市' : '设置城市'}
          </SecondaryButton>
          {isEditingCity ? (
            <TodayCityForm
              initialCity={view.city ?? ''}
              onSubmit={updateCity}
              onCancel={() => setIsEditingCity(false)}
            />
          ) : null}
        </div>
      </div>

      <TodayOotdHistory entries={historyEntries} onUpdateEntry={handleUpdateHistoryEntry} onDeleteEntry={handleDeleteHistoryEntry} />

      <div className="pt-2">
        <PrimaryButton
          type="button"
          className="w-full bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent)]/90"
          onClick={() => setIsSettingsOpen(true)}
        >
          设置
        </PrimaryButton>
      </div>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Today 设置"
            className="relative z-10 w-full max-w-3xl"
          >
            <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-[1.75rem] border border-black/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,245,240,0.95)_100%)] p-4 shadow-[0_24px_60px_rgba(26,26,26,0.18)] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-primary)]">Settings</p>
                  <h2 className="text-lg font-semibold text-[var(--color-neutral-dark)]">主题与账号设置</h2>
                </div>
                <PrimaryButton
                  type="button"
                  className="shrink-0 bg-[var(--color-accent)] px-3 py-2 text-[var(--color-primary)] hover:bg-[var(--color-accent)]/90"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  关闭
                </PrimaryButton>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2 pr-1">
                <ThemeSettingsCard />
                <TodayAccountSecurityCard
                  email={view.accountEmail}
                  passwordBootstrapped={view.passwordBootstrapped}
                  passwordChangedAt={view.passwordChangedAt}
                  changePassword={changePassword}
                  signOut={signOut}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
