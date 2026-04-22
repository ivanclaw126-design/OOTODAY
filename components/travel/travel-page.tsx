'use client'

import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PrimaryButton, PrimaryLink, SecondaryButton } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { TravelPackingView, TravelScene, TravelSavedPlan } from '@/lib/travel/types'

const sceneOptions: TravelScene[] = ['通勤', '休闲', '正式', '约会', '户外']

function buildSavedPlanHref(planId: string, destinationCity: string, days: number, scenes: TravelScene[]) {
  const params = new URLSearchParams({
    savedPlanId: planId,
    city: destinationCity,
    days: String(days)
  })

  for (const scene of scenes) {
    params.append('scene', scene)
  }

  return `/travel?${params.toString()}`
}

export function TravelPage({
  view,
  savePlan,
  deleteSavedPlan
}: {
  view: TravelPackingView
  savePlan: (formData: FormData) => Promise<void>
  deleteSavedPlan: (input: { planId: string; source: TravelSavedPlan['source'] }) => Promise<void>
}) {
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [draftCity, setDraftCity] = useState(view.destinationCity ?? '')
  const [draftDays, setDraftDays] = useState(view.days ? String(view.days) : '3')
  const [draftScenes, setDraftScenes] = useState<TravelScene[]>(view.scenes)
  const router = useRouter()

  async function handleDeleteSavedPlan(plan: TravelSavedPlan) {
    if (!window.confirm(`确定要删除“${plan.title}”吗？删除后这份旅行方案不会再出现在列表里。`)) {
      return
    }

    setDeletingPlanId(plan.id)

    try {
      await deleteSavedPlan({
        planId: plan.id,
        source: plan.source
      })
      router.refresh()
    } finally {
      setDeletingPlanId(null)
    }
  }

  function toggleDraftScene(scene: TravelScene, checked: boolean) {
    setDraftScenes((current) => {
      if (checked) {
        return current.includes(scene) ? current : [...current, scene]
      }

      return current.filter((value) => value !== scene)
    })
  }

  return (
    <AppShell title="Travel">
      <Card>
        <form action="/travel" className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium">旅行打包</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">填目的地、天数和行程场景，先用现有衣橱拼出一份更轻更稳的打包方案。</p>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            目的地城市
            <input
              name="city"
              value={draftCity}
              onChange={(event) => setDraftCity(event.target.value)}
              placeholder="例如：东京"
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            出行天数
            <input
              name="days"
              type="number"
              min={1}
              max={14}
              value={draftDays}
              onChange={(event) => setDraftDays(event.target.value)}
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">行程场景</legend>
            <div className="flex flex-wrap gap-2">
              {sceneOptions.map((scene) => (
                <label key={scene} className="inline-flex items-center gap-2 rounded-md border border-[var(--color-neutral-mid)] bg-[var(--color-secondary)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="scene"
                    value={scene}
                    checked={draftScenes.includes(scene)}
                    onChange={(event) => toggleDraftScene(scene, event.target.checked)}
                  />
                  {scene}
                </label>
              ))}
            </div>
          </fieldset>

          {view.savedPlanId ? <input type="hidden" name="savedPlanId" value={view.savedPlanId} /> : null}

          <div>
            <PrimaryButton type="submit">生成打包清单</PrimaryButton>
          </div>
        </form>
      </Card>

      {view.status === 'empty-closet' ? (
        <EmptyState
          title="衣橱还不够做旅行打包"
          description="先收录几件常穿单品，Travel 才能从真实衣橱里帮你算出够用又不臃肿的打包方案。"
          action={<PrimaryLink href="/closet">先去上传衣物</PrimaryLink>}
        />
      ) : null}

      {view.status === 'idle' ? (
        <EmptyState
          title="先告诉我这趟要去哪里"
          description="输入目的地、天数和行程场景后，我会基于你的真实衣橱给出一份旅行打包清单。"
        />
      ) : null}

      {view.status === 'ready' ? (
        <>
          {view.editingSavedPlan ? (
            <Card>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">正在编辑已保存方案</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">
                  当前这页绑定的是“{view.editingSavedPlan.title}”。你现在改城市、天数或场景后，点击下面按钮会直接更新这份方案，不会新建一条重复记录。
                </p>
              </div>
            </Card>
          ) : null}

          {view.justSaved ? (
            <Card>
              <p className="text-sm text-[var(--color-primary)]">这次旅行方案已经保存下来了，后面可以继续基于它补细节。</p>
            </Card>
          ) : null}

          {view.justUpdated ? (
            <Card>
              <p className="text-sm text-[var(--color-primary)]">这份已保存方案已经更新好了，当前内容和最近方案列表现在是同步的。</p>
            </Card>
          ) : null}

          <Card>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">本次行程摘要</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">
                {view.plan.destinationCity} · {view.plan.days} 天 · {view.plan.scenes.join(' / ') || '默认日常场景'}
              </p>
              <p className="text-sm text-[var(--color-neutral-dark)]">
                建议至少准备 {view.plan.suggestedOutfitCount} 套核心组合
                {view.plan.weather
                  ? `，当前天气参考为 ${view.plan.weather.city} · ${view.plan.weather.temperatureC}°C · ${view.plan.weather.conditionLabel}`
                  : '，当前天气暂时不可用，已按场景和衣橱稳定度降级生成'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">{view.editingSavedPlan ? '更新当前方案' : '保存这次方案'}</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">
                {view.editingSavedPlan ? '这次改动会覆盖当前这份已保存方案，让最近列表和当前视图保持一致。' : '如果这趟行程已经比较明确，先把方案存下来，后面就不用重新填一遍。'}
              </p>
              <form action={savePlan}>
                <input type="hidden" name="city" value={draftCity} />
                <input type="hidden" name="days" value={draftDays} />
                {draftScenes.map((scene) => (
                  <input key={scene} type="hidden" name="scene" value={scene} />
                ))}
                {view.editingSavedPlan ? <input type="hidden" name="savedPlanId" value={view.editingSavedPlan.id} /> : null}
                {view.editingSavedPlan ? <input type="hidden" name="savedPlanSource" value={view.editingSavedPlan.source} /> : null}
                <PrimaryButton type="submit">{view.editingSavedPlan ? '更新这份方案' : '保存这次方案'}</PrimaryButton>
              </form>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium">建议打包</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">先带最稳的组合，再把变化留给上衣切换，而不是无限加件数。</p>
              </div>

              <div className="grid gap-3">
                {view.plan.entries.map((entry) => (
                  <div key={entry.id} className="rounded-lg bg-[var(--color-secondary)] p-4">
                    <p className="text-sm font-medium">
                      {entry.categoryLabel} · 建议带 {entry.quantity} 件
                    </p>
                    <p className="text-sm text-[var(--color-neutral-dark)]">{entry.reason}</p>
                    <p className="mt-2 text-sm">{entry.itemLabels.join(' / ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium">按天轮换建议</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">先把每天的大致节奏排出来，旅行中就不容易临场乱翻箱子。</p>
              </div>

              <div className="grid gap-3">
                {view.plan.dailyPlan.map((entry) => (
                  <div key={entry.dayLabel} className="rounded-lg bg-[var(--color-secondary)] p-4">
                    <p className="text-sm font-medium">{entry.dayLabel}</p>
                    <p className="text-sm">{entry.outfitSummary}</p>
                    <p className="text-sm text-[var(--color-neutral-dark)]">{entry.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">最近保存方案</p>
              {view.recentSavedPlans.length > 0 ? (
                <div className="grid gap-3">
                  {view.recentSavedPlans.map((plan) => (
                    <div key={plan.id} className="rounded-lg bg-[var(--color-secondary)] p-4">
                      <p className="text-sm font-medium">{plan.title}</p>
                      <p className="text-sm text-[var(--color-neutral-dark)]">
                        {plan.destinationCity} · {plan.days} 天 · {plan.scenes.join(' / ') || '默认日常场景'}
                      </p>
                      {view.editingSavedPlan?.id === plan.id ? <p className="text-sm text-[var(--color-primary)]">当前正在编辑这份方案</p> : null}
                      {plan.weatherSummary ? (
                        <p className="text-sm text-[var(--color-neutral-dark)]">{plan.weatherSummary}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PrimaryLink href={buildSavedPlanHref(plan.id, plan.destinationCity, plan.days, plan.scenes)}>重新打开这份方案</PrimaryLink>
                        <SecondaryButton type="button" onClick={() => handleDeleteSavedPlan(plan)} disabled={deletingPlanId === plan.id}>
                          {deletingPlanId === plan.id ? '删除中…' : '删除这份方案'}
                        </SecondaryButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-neutral-dark)]">这还是第一份旅行方案，保存之后就会出现在这里。</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">风险与缺口</p>
              {view.plan.missingHints.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {view.plan.missingHints.map((hint) => (
                    <p key={hint} className="text-sm text-[var(--color-neutral-dark)]">
                      {hint}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-neutral-dark)]">当前这份衣橱已经能支撑这趟旅行的基础打包，不需要额外补很多新单品。</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">打包策略</p>
              {view.plan.notes.map((note) => (
                <p key={note} className="text-sm text-[var(--color-neutral-dark)]">
                  {note}
                </p>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </AppShell>
  )
}
