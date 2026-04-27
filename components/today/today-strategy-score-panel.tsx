'use client'

import { useEffect, useState } from 'react'
import type {
  RecommendationScoreBreakdown,
  RecommendationStrategyKey,
  RecommendationStrategyScores
} from '@/lib/recommendation/canonical-types'
import {
  buildRecommendationStrategyRows,
  buildRecommendationStrategySummaryRows,
  type RecommendationStrategyDisplayRow,
  type RecommendationStrategyVisualType
} from '@/lib/recommendation/strategy-display'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function StrategyCoreVisual({ type }: { type: RecommendationStrategyVisualType }) {
  if (type === 'capsule-grid') {
    return (
      <div className="grid h-16 grid-cols-3 gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <span
            key={index}
            className={cx(
              'rounded-[0.45rem]',
              index % 4 === 0 ? 'bg-[var(--color-primary)]' : index % 2 === 0 ? 'bg-[var(--color-neutral-mid)]' : 'bg-[var(--color-secondary)]'
            )}
          />
        ))}
      </div>
    )
  }

  if (type === 'formula-stack') {
    return (
      <div className="flex h-16 items-center gap-1.5" aria-hidden="true">
        <span className="h-10 w-5 rounded-full bg-[var(--color-primary)]" />
        <span className="h-14 w-8 rounded-[0.7rem] bg-[var(--color-accent)]" />
        <span className="h-9 w-6 rounded-[0.55rem] bg-[var(--color-neutral-mid)]" />
        <span className="h-5 w-10 rounded-full bg-[var(--color-panel-soft)]" />
      </div>
    )
  }

  if (type === 'word-triad') {
    return (
      <div className="flex h-16 items-center justify-center gap-2" aria-hidden="true">
        {[1, 2, 3].map((index) => (
          <span key={index} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-xs font-semibold text-[var(--color-primary)]">
            {index}
          </span>
        ))}
      </div>
    )
  }

  if (type === 'palette-line') {
    return (
      <div className="flex h-16 items-center gap-1.5" aria-hidden="true">
        <span className="h-10 flex-1 rounded-full bg-[var(--color-primary)]" />
        <span className="h-10 flex-1 rounded-full bg-[var(--color-neutral-mid)]" />
        <span className="h-10 w-8 rounded-full bg-[var(--color-accent)]" />
      </div>
    )
  }

  if (type === 'sandwich-band') {
    return (
      <div className="flex h-16 flex-col justify-center gap-1.5" aria-hidden="true">
        <span className="h-3 rounded-full bg-[var(--color-primary)]" />
        <span className="h-7 rounded-[0.8rem] bg-[var(--color-secondary)]" />
        <span className="h-3 rounded-full bg-[var(--color-primary)]" />
      </div>
    )
  }

  if (type === 'shoe-offset') {
    return (
      <div className="relative h-16" aria-hidden="true">
        <span className="absolute left-2 top-2 h-9 w-12 rounded-[0.8rem] bg-[var(--color-secondary)]" />
        <span className="absolute left-8 top-7 h-6 w-14 rounded-full bg-[var(--color-primary)]" />
        <span className="absolute right-2 top-3 h-7 w-7 rounded-full bg-[var(--color-accent)]" />
      </div>
    )
  }

  if (type === 'two-third-block') {
    return (
      <div className="grid h-16 grid-cols-3 gap-1.5" aria-hidden="true">
        <span className="rounded-[0.7rem] bg-[var(--color-primary)]" />
        <span className="rounded-[0.7rem] bg-[var(--color-primary)]" />
        <span className="rounded-[0.7rem] bg-[var(--color-accent)]" />
      </div>
    )
  }

  if (type === 'proportion-bars') {
    return (
      <div className="flex h-16 items-end justify-center gap-2" aria-hidden="true">
        <span className="h-10 w-8 rounded-t-full bg-[var(--color-primary)]" />
        <span className="h-16 w-5 rounded-full bg-[var(--color-accent)]" />
        <span className="h-12 w-10 rounded-t-[1rem] bg-[var(--color-neutral-mid)]" />
      </div>
    )
  }

  if (type === 'layer-stack') {
    return (
      <div className="relative h-16" aria-hidden="true">
        <span className="absolute left-6 top-2 h-11 w-16 rounded-[0.9rem] bg-[var(--color-secondary)]" />
        <span className="absolute left-3 top-6 h-9 w-16 rounded-[0.9rem] bg-[var(--color-neutral-mid)]" />
        <span className="absolute left-10 top-8 h-7 w-16 rounded-[0.9rem] bg-[var(--color-primary)]" />
      </div>
    )
  }

  if (type === 'tonal-scale') {
    return (
      <div className="flex h-16 items-center gap-1" aria-hidden="true">
        {['bg-[var(--color-secondary)]', 'bg-[var(--color-neutral-mid)]', 'bg-[var(--color-neutral-dark)]', 'bg-[var(--color-primary)]'].map((className) => (
          <span key={className} className={cx('h-11 flex-1 rounded-full', className)} />
        ))}
      </div>
    )
  }

  if (type === 'occasion-axis') {
    return (
      <div className="relative h-16" aria-hidden="true">
        <span className="absolute left-2 right-2 top-8 h-1 rounded-full bg-[var(--color-line)]" />
        <span className="absolute left-2 top-5 h-7 w-7 rounded-full bg-[var(--color-secondary)]" />
        <span className="absolute left-1/2 top-4 h-9 w-9 -translate-x-1/2 rounded-full bg-[var(--color-accent)]" />
        <span className="absolute right-2 top-5 h-7 w-7 rounded-full bg-[var(--color-primary)]" />
      </div>
    )
  }

  if (type === 'pinterest-frame') {
    return (
      <div className="grid h-16 grid-cols-[1.2fr_0.8fr] gap-1.5" aria-hidden="true">
        <span className="rounded-[0.9rem] border border-[var(--color-primary)] bg-white" />
        <span className="rounded-[0.9rem] bg-[var(--color-secondary)]" />
        <span className="rounded-[0.9rem] bg-[var(--color-accent)]" />
        <span className="rounded-[0.9rem] border border-[var(--color-line)] bg-white" />
      </div>
    )
  }

  return (
    <div className="relative h-16" aria-hidden="true">
      <span className="absolute inset-x-2 top-8 h-1 rounded-full bg-[var(--color-line)]" />
      <span className="absolute left-3 top-5 h-8 w-8 rounded-full bg-[var(--color-primary)]" />
      <span className="absolute left-10 top-3 h-10 w-10 rounded-full border border-[var(--color-line)] bg-white" />
      <span className="absolute right-3 top-5 h-8 w-8 rounded-full bg-[var(--color-accent)]" />
    </div>
  )
}

function getRowTone(row: RecommendationStrategyDisplayRow) {
  if (row.level === 'primary') {
    return 'border-[var(--color-primary)] bg-white shadow-[0_18px_34px_rgba(0,0,0,0.08)]'
  }

  if (row.level === 'supporting') {
    return 'border-[rgba(9,9,9,0.18)] bg-white/82'
  }

  if (row.level === 'weak') {
    return 'border-[var(--color-line)] bg-white/42 opacity-68'
  }

  return 'border-[var(--color-line)] bg-white/62'
}

function getLevelLabel(row: RecommendationStrategyDisplayRow) {
  if (row.level === 'primary') {
    return '主命中策略'
  }

  if (row.level === 'supporting') {
    return '辅助命中'
  }

  if (row.level === 'weak') {
    return '低信号'
  }

  return '参考信号'
}

export function TodayStrategyScorePanel({
  scoreBreakdown,
  strategyScores
}: {
  scoreBreakdown?: RecommendationScoreBreakdown | null
  strategyScores?: Partial<RecommendationStrategyScores> | null
}) {
  const [openKey, setOpenKey] = useState<RecommendationStrategyKey | null>(null)
  const [showAll, setShowAll] = useState(false)
  const rows = buildRecommendationStrategyRows(scoreBreakdown?.strategyScores ?? strategyScores, {
    primaryStrategy: scoreBreakdown?.primaryStrategy ?? null
  })
  const summaryRows = scoreBreakdown ? buildRecommendationStrategySummaryRows(scoreBreakdown) : rows.slice(0, 3)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenKey(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  if (rows.length === 0) {
    return null
  }

  return (
    <section className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/64 p-3 shadow-[0_12px_24px_rgba(16,16,16,0.05)]">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">策略摘要</p>
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">这套最能说明差异的 3 个判断</h3>
        </div>
        <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">完整评分默认收起，避免打断穿搭决策。</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {summaryRows.map((row) => (
          <div key={row.key} className="rounded-[0.95rem] border border-[var(--color-line)] bg-white/78 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{row.name}</p>
                <p className="mt-0.5 text-xs text-[var(--color-neutral-dark)]">{getLevelLabel(row)}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{row.score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(9,9,9,0.08)]">
              <div
                className={cx(
                  'h-full rounded-full',
                  row.level === 'primary' ? 'bg-[var(--color-primary)]' : row.level === 'weak' ? 'bg-[var(--color-neutral-mid)]' : 'bg-[var(--color-accent)]'
                )}
                style={{ width: `${row.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[var(--color-line)] bg-white/76 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-white sm:w-auto"
        aria-expanded={showAll}
        onClick={() => {
          setShowAll((current) => !current)
          setOpenKey(null)
        }}
      >
        {showAll ? '收起策略评分' : `查看全部 ${rows.length} 项策略`}
      </button>

      {showAll ? (
        <div className="mt-3 space-y-3 border-t border-[var(--color-line)] pt-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">策略评分</p>
              <h3 className="text-sm font-semibold text-[var(--color-primary)]">13 个穿搭子策略命中情况</h3>
            </div>
            <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">分数来自当前推荐引擎，不改变排序。</p>
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
        {rows.map((row) => {
          const open = openKey === row.key
          const popoverId = `today-strategy-${row.key}`

          return (
            <div
              key={row.key}
              className={cx(
                'relative rounded-[1rem] border px-3 py-2.5 transition',
                getRowTone(row)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-[var(--color-primary)]">{row.name}</span>
                    <span className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      row.level === 'primary'
                        ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                        : 'bg-[var(--color-secondary)] text-[var(--color-neutral-dark)]'
                    )}>
                      {getLevelLabel(row)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-neutral-dark)]">{row.shortLabel}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">{row.score}</span>
                  <button
                    type="button"
                    aria-label={`查看${row.name}策略说明`}
                    aria-expanded={open}
                    aria-controls={popoverId}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-xs font-semibold text-[var(--color-primary)] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5"
                    onClick={() => setOpenKey(open ? null : row.key)}
                  >
                    i
                  </button>
                </div>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(9,9,9,0.08)]">
                <div
                  className={cx(
                    'h-full rounded-full',
                    row.level === 'primary' ? 'bg-[var(--color-primary)]' : row.level === 'weak' ? 'bg-[var(--color-neutral-mid)]' : 'bg-[var(--color-accent)]'
                  )}
                  style={{ width: `${row.score}%` }}
                />
              </div>

              {open ? (
                <div
                  id={popoverId}
                  role="dialog"
                  aria-label={`${row.name}策略说明`}
                  className="absolute right-0 top-[calc(100%+0.55rem)] z-30 w-[min(21rem,calc(100vw-3rem))] rounded-[1.1rem] border border-[var(--color-line)] bg-white p-3 text-[var(--color-primary)] shadow-[0_24px_50px_rgba(0,0,0,0.18)]"
                >
                  <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                    <StrategyCoreVisual type={row.visualType} />
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{row.name}</p>
                        <button
                          type="button"
                          aria-label="关闭策略说明"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-xs font-semibold"
                          onClick={() => setOpenKey(null)}
                        >
                          x
                        </button>
                      </div>
                      <p className="text-xs leading-5 text-[var(--color-neutral-dark)]">{row.meaning}</p>
                      <p className="rounded-[0.8rem] bg-[var(--color-secondary)] px-2.5 py-2 text-xs leading-5 text-[var(--color-primary)]">
                        {row.core}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
