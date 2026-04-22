'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { TodayStatusCard } from '@/components/today/today-status-card'
import { PrimaryLink, SecondaryButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { TodayOotdStatus, TodayRecommendation, TodayView } from '@/lib/today/types'

export function TodayPage({
  view,
  updateCity,
  submitOotd,
  refreshRecommendations
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: () => Promise<void>
}) {
  const [isEditingCity, setIsEditingCity] = useState(false)
  const [ootdStatus, setOotdStatus] = useState<TodayOotdStatus>(view.ootdStatus)

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
              recommendations={view.recommendations}
              recommendationError={view.recommendationError}
              ootdStatus={ootdStatus}
              submitOotd={submitTodayOotd}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <SecondaryButton type="button" onClick={() => void refreshRecommendations()}>
                换一批推荐
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => setIsEditingCity(true)}>
                {view.city ? '修改城市' : '设置城市'}
              </SecondaryButton>
            </div>

            <TodayOotdHistory entries={view.recentOotdHistory} />
          </>
        )}
      </div>
    </AppShell>
  )
}
