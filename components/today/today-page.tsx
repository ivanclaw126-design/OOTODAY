'use client'

import { startTransition, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { ThemeSettingsCard } from '@/components/theme/theme-settings-card'
import { TodayAccountSecurityCard } from '@/components/today/today-account-security-card'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { TodayStatusCard } from '@/components/today/today-status-card'
import { PrimaryLink, SecondaryButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { TodayHistoryUpdateInput, TodayOotdHistoryEntry, TodayOotdStatus, TodayRecommendation, TodayView } from '@/lib/today/types'

function isSameCalendarDay(left: string, right: string) {
  return new Date(left).toDateString() === new Date(right).toDateString()
}

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
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: (input: { offset: number }) => Promise<{ recommendations: TodayRecommendation[] }>
  changePassword: (input: { password: string; confirmPassword: string }) => Promise<{ error: string | null }>
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

  async function submitTodayOotd(input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) {
    const result = await submitOotd(input)

    if (!result.error && result.wornAt) {
      setOotdStatus({ status: 'recorded', wornAt: result.wornAt })
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
      }
    }

    return result
  }

  return (
    <AppShell title="Today">
      <div className="space-y-4">
        <TodayStatusCard weatherState={view.weatherState} />

        {view.itemCount === 0 ? (
          <EmptyState
            title="你的衣橱还是空的"
            description="先上传几件常穿的单品，Today 才能给出真实推荐。"
            action={<PrimaryLink href="/closet">去上传衣物</PrimaryLink>}
          />
        ) : (
          <>
            {!view.city ? <TodayCityPromptCard /> : null}

            {isEditingCity ? (
              <TodayCityForm
                initialCity={view.city ?? ''}
                onSubmit={updateCity}
                onCancel={() => setIsEditingCity(false)}
              />
            ) : null}

            <TodayRecommendationList
              recommendations={recommendations}
              recommendationError={view.recommendationError}
              ootdStatus={ootdStatus}
              submitOotd={submitTodayOotd}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <SecondaryButton type="button" onClick={() => void handleRefreshRecommendations()} disabled={isRefreshingRecommendations}>
                {isRefreshingRecommendations ? '正在整理新推荐...' : '换一批推荐'}
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => setIsEditingCity(true)}>
                {view.city ? '修改城市' : '设置城市'}
              </SecondaryButton>
            </div>

            <TodayOotdHistory
              entries={historyEntries}
              onUpdateEntry={handleUpdateHistoryEntry}
              onDeleteEntry={handleDeleteHistoryEntry}
            />

            <div className="pt-2">
              <SecondaryButton type="button" className="w-full" onClick={() => setIsSettingsOpen(true)}>
                设置
              </SecondaryButton>
            </div>
          </>
        )}
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
            <div className="max-h-[min(88vh,860px)] overflow-hidden rounded-[1.75rem] border border-black/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,245,240,0.95)_100%)] p-5 shadow-[0_24px_60px_rgba(26,26,26,0.18)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-primary)]">Settings</p>
                  <h2 className="text-lg font-semibold text-[var(--color-neutral-dark)]">主题与账号设置</h2>
                  <p className="text-sm text-[var(--color-neutral-dark)]">主题切换和账号操作都收在这里，避免打断 Today 主决策区的使用节奏。</p>
                </div>
                <button
                  type="button"
                  className="text-sm text-[var(--color-neutral-dark)] underline underline-offset-2"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  关闭
                </button>
              </div>

              <div className="max-h-[calc(min(88vh,860px)-5.75rem)] space-y-4 overflow-y-auto pr-1">
                <ThemeSettingsCard />
                <TodayAccountSecurityCard
                  email={view.accountEmail}
                  passwordBootstrapped={view.passwordBootstrapped}
                  passwordChangedAt={view.passwordChangedAt}
                  changePassword={changePassword}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
