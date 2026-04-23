'use client'

import { AppShell } from '@/components/app-shell'
import { ItemShowcase } from '@/components/ui/item-showcase'
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
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const parsedDraftDays = Number.parseInt(draftDays, 10)
  const isDaysValid = Number.isInteger(parsedDraftDays) && parsedDraftDays >= 1 && parsedDraftDays <= 14
  const canGeneratePlan = draftCity.trim().length > 0 && isDaysValid

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
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(241,235,226,0.94)_100%)]">
        <form
          action="/travel"
          className="flex min-w-0 flex-col gap-5"
          onSubmit={(event) => {
            if (!draftCity.trim()) {
              event.preventDefault()
              setFormError('先填目的地城市，再生成这次打包清单。')
              return
            }

            if (!isDaysValid) {
              event.preventDefault()
              setFormError('出行天数需要在 1 到 14 天之间。')
              return
            }

            setFormError(null)
          }}
        >
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Trip Setup</p>
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--color-primary)]">先把这趟行程压成一份够用方案</p>
              <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">输入城市、天数和场景后，我会优先从现有衣橱里拼出轻装轮换，尽量让打包清单像 Shop 一样一眼读懂。</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-[var(--color-line)] bg-[#111111] p-4 text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/70">Input</p>
                <p className="mt-2 text-sm text-white/82">先给出目的地和天数，再勾一下这趟最常见的场景，我会按衣橱覆盖度优先生成够用方案。</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.6fr)]">
                <label className="flex min-w-0 w-full flex-col gap-2 text-sm">
                  <span className="font-medium text-white/82">目的地城市</span>
                  <input
                    name="city"
                    value={draftCity}
                    onChange={(event) => {
                      setDraftCity(event.target.value)
                      if (formError) {
                        setFormError(null)
                      }
                    }}
                    placeholder="例如：东京"
                    aria-invalid={Boolean(formError) && !draftCity.trim()}
                    className={`w-full min-w-0 rounded-[1rem] border bg-white/10 px-3 py-3 text-white placeholder:text-white/45 ${
                      formError && !draftCity.trim() ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/55' : 'border-white/18'
                    }`}
                  />
                </label>

                <label className="flex min-w-0 w-full flex-col gap-2 text-sm">
                  <span className="font-medium text-white/82">出行天数</span>
                  <input
                    name="days"
                    type="number"
                    min={1}
                    max={14}
                    value={draftDays}
                    onChange={(event) => {
                      setDraftDays(event.target.value)
                      if (formError) {
                        setFormError(null)
                      }
                    }}
                    aria-invalid={Boolean(formError) && !isDaysValid}
                    className={`w-full min-w-0 rounded-[1rem] border bg-white/10 px-3 py-3 text-white ${
                      formError && !isDaysValid ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/55' : 'border-white/18'
                    }`}
                  />
                </label>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="text-sm font-medium text-white/82">行程场景</legend>
                <div className="flex flex-wrap gap-2">
                  {sceneOptions.map((scene) => (
                    <label
                      key={scene}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                        draftScenes.includes(scene)
                          ? 'border-transparent bg-[var(--color-accent)] text-[var(--color-primary)]'
                          : 'border-white/18 bg-white/10 text-white'
                      }`}
                    >
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
            </div>
          </div>

          {formError ? (
            <p
              role="alert"
              className="rounded-[1rem] border border-[rgba(231,255,55,0.28)] bg-[rgba(17,17,17,0.86)] px-4 py-3 text-sm font-medium text-white"
            >
              {formError}
            </p>
          ) : null}

          {view.savedPlanId ? <input type="hidden" name="savedPlanId" value={view.savedPlanId} /> : null}

          <div className="min-w-0">
            <PrimaryButton type="submit" disabled={!canGeneratePlan} className="w-full sm:w-auto">
              生成打包清单
            </PrimaryButton>
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
            <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(240,233,223,0.94)_100%)]">
              <div className="flex flex-col gap-2">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Editing Saved Plan</p>
                <p className="text-lg font-semibold text-[var(--color-primary)]">正在编辑已保存方案</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">
                  当前这页绑定的是“{view.editingSavedPlan.title}”，保存时会直接覆盖这份方案。
                </p>
              </div>
            </Card>
          ) : null}

          {view.justSaved ? (
            <Card className="bg-[linear-gradient(180deg,rgba(231,255,55,0.18),rgba(231,255,55,0.1))]">
              <p className="text-sm text-[var(--color-primary)]">这次旅行方案已经保存下来了，后面可以继续基于它补细节。</p>
            </Card>
          ) : null}

          {view.justUpdated ? (
            <Card className="bg-[linear-gradient(180deg,rgba(231,255,55,0.18),rgba(231,255,55,0.1))]">
              <p className="text-sm text-[var(--color-primary)]">这份已保存方案已经更新好了，当前内容和最近方案列表现在是同步的。</p>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-[rgba(9,9,9,0.04)] bg-[linear-gradient(180deg,var(--color-panel)_0%,var(--color-panel-soft)_100%)] text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/56">Trip Summary</p>
                    <p className="text-[2.15rem] font-semibold leading-none tracking-[-0.07em] text-white sm:text-[2.35rem]">
                      {view.plan.destinationCity} · {view.plan.days} 天
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(view.plan.scenes.length > 0 ? view.plan.scenes : ['默认日常场景']).map((scene) => (
                      <span
                        key={scene}
                        className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium tracking-[0.04em] text-white/84"
                      >
                        {scene}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-px w-full bg-white/8" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.45rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/54">Core Looks</p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-5xl font-semibold leading-none tracking-[-0.1em] text-[var(--color-accent)]">{view.plan.suggestedOutfitCount}</p>
                    <p className="pb-1 text-sm font-medium text-white/66">套稳定组合</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">先围绕这些最稳的搭配做复穿，行李会更轻。</p>
                </div>
                <div className="rounded-[1.45rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:col-span-2">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/54">Weather Read</p>
                  {view.plan.weather ? (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-white">{view.plan.weather.city}</p>
                        <p className="text-sm text-white/64">{view.plan.weather.conditionLabel}</p>
                      </div>
                      <p className="text-[2rem] font-semibold leading-none tracking-[-0.08em] text-white">{view.plan.weather.temperatureC}°C</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-base font-medium leading-7 text-white/92">当前天气暂时不可用，已按场景和衣橱稳定度降级生成</p>
                  )}
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {view.plan.weather ? '按这个温度先准备层次，剩下的变化交给上衣切换。' : '先按耐穿和低冲突组合给出基础方案，补天气后再细化。'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">
                {view.editingSavedPlan ? 'Update Current Plan' : 'Save This Plan'}
              </p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">{view.editingSavedPlan ? '更新当前方案' : '保存这次方案'}</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">
                {view.editingSavedPlan ? '这次改动会覆盖当前方案。' : '方案明确后先存下来，后面不用重填。'}
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

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Packing List</p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">建议打包</p>
                <p className="mt-1 text-sm text-[var(--color-neutral-dark)]">先带最稳的组合，再把变化留给上衣切换。</p>
              </div>

              <div className="grid gap-3">
                {view.plan.entries.map((entry) => (
                  <div key={entry.id} className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.68)] p-4">
                    <p className="text-sm font-medium">
                      {entry.categoryLabel} · 建议带 {entry.quantity} 件
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-dark)]">{entry.reason}</p>
                    <div className="mt-3">
                      <ItemShowcase
                        items={(entry.selectedItems ?? []).map((item) => ({
                          id: item.id,
                          imageUrl: item.imageUrl,
                          label: item.subCategory ?? item.category,
                          meta: [item.colorCategory, item.styleTags[0]].filter(Boolean).join(' · ')
                        }))}
                        title={`${entry.categoryLabel} 橱窗`}
                        subtitle={entry.itemLabels.join(' / ')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Daily Rotation</p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">按天轮换建议</p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-dark)]">先把每天的大致节奏排出来，旅行中就不容易临场乱翻箱子。</p>
              </div>

              <div className="grid gap-3">
                {view.plan.dailyPlan.map((entry) => (
                  <div key={entry.dayLabel} className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.68)] p-4">
                    <p className="text-sm font-medium">{entry.dayLabel}</p>
                    <p className="mt-1 text-sm">{entry.outfitSummary}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-dark)]">{entry.focus}</p>
                    {(entry.selectedItems ?? []).length > 0 ? (
                      <div className="mt-3">
                        <ItemShowcase
                          items={(entry.selectedItems ?? []).map((item) => ({
                            id: item.id,
                            imageUrl: item.imageUrl,
                            label: item.subCategory ?? item.category,
                            meta: [item.colorCategory, item.styleTags[0]].filter(Boolean).join(' · ')
                          }))}
                          title="当天组合 Outfit"
                          subtitle={entry.outfitSummary}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Saved Plans</p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">最近保存方案</p>
              {view.recentSavedPlans.length > 0 ? (
                <div className="grid gap-3">
                  {view.recentSavedPlans.map((plan) => (
                    <div key={plan.id} className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.68)] p-4">
                      <p className="text-sm font-medium">{plan.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-dark)]">
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

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Risk & Gaps</p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">风险与缺口</p>
              {view.plan.missingHints.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {view.plan.missingHints.map((hint) => (
                    <p key={hint} className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                      {hint}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">当前这份衣橱已经能支撑这趟旅行的基础打包，不需要额外补很多新单品。</p>
              )}
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Notes</p>
              <p className="text-lg font-semibold text-[var(--color-primary)]">打包策略</p>
              {view.plan.notes.map((note) => (
                <p key={note} className="text-sm leading-6 text-[var(--color-neutral-dark)]">
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
