'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import type { TodayHistoryUpdateInput, TodayOotdHistoryEntry } from '@/lib/today/types'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(date))
}

function formatScore(score: number | null) {
  return score ? `${score} / 5 分` : '未评分'
}

export function TodayOotdHistory({
  entries,
  onUpdateEntry,
  onDeleteEntry
}: {
  entries: TodayOotdHistoryEntry[]
  onUpdateEntry: (input: TodayHistoryUpdateInput) => Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }>
  onDeleteEntry: (input: { ootdId: string }) => Promise<{ error: string | null }>
}) {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [draftScore, setDraftScore] = useState<number | null>(null)
  const [draftNotes, setDraftNotes] = useState('')
  const [submittingEntryId, setSubmittingEntryId] = useState<string | null>(null)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (entries.length === 0) {
    return null
  }

  function beginEditing(entry: TodayOotdHistoryEntry) {
    setEditingEntryId(entry.id)
    setDraftScore(entry.satisfactionScore)
    setDraftNotes(entry.notes ?? '')
    setErrorMessage(null)
  }

  async function handleSave(entry: TodayOotdHistoryEntry) {
    setSubmittingEntryId(entry.id)
    setErrorMessage(null)

    try {
      const result = await onUpdateEntry({
        ootdId: entry.id,
        satisfactionScore: draftScore,
        notes: draftNotes
      })

      if (result.error) {
        setErrorMessage(result.error)
        return
      }

      setEditingEntryId(null)
    } finally {
      setSubmittingEntryId(null)
    }
  }

  async function handleDelete(entry: TodayOotdHistoryEntry) {
    if (!window.confirm('确定要删除这条穿搭记录吗？删除后这条反馈不会再参与推荐校准。')) {
      return
    }

    setDeletingEntryId(entry.id)
    setErrorMessage(null)

    try {
      const result = await onDeleteEntry({ ootdId: entry.id })

      if (result.error) {
        setErrorMessage(result.error)
      }
    } finally {
      setDeletingEntryId(null)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
              OOTD history
            </p>
            <p className="text-lg font-semibold tracking-[-0.03em]">最近穿搭记录</p>
          </div>
          <p className="text-sm text-[var(--color-neutral-dark)]">
            记录会慢慢校准你对舒适度、搭配和重复穿着的偏好
          </p>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[1.25rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(248,245,238,0.86)_100%)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-[-0.02em]">{formatDate(entry.wornAt)}</p>
                  <p className="text-xs text-[var(--color-neutral-dark)]">这条记录会被拿去优化后续推荐</p>
                </div>
                <p className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {formatScore(entry.satisfactionScore)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-neutral-dark)]">
                {entry.notes ?? '本次记录没有备注摘要'}
              </p>
              {editingEntryId === entry.id ? (
                <div className="mt-4 space-y-3 rounded-[1rem] border border-black/6 bg-white/80 p-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--color-neutral-dark)]">满意度</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                            draftScore === score
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'border border-[var(--color-neutral-mid)] bg-white text-[var(--color-neutral-dark)]'
                          }`}
                          onClick={() => setDraftScore(score)}
                        >
                          {score} 分
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-[var(--color-neutral-dark)]">备注</span>
                    <textarea
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      className="min-h-24 rounded-[1rem] border border-[var(--color-neutral-mid)] px-3 py-2 outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton type="button" onClick={() => void handleSave(entry)} disabled={submittingEntryId === entry.id}>
                      {submittingEntryId === entry.id ? '保存中…' : '保存修改'}
                    </PrimaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setEditingEntryId(null)
                        setErrorMessage(null)
                      }}
                    >
                      取消
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <SecondaryButton type="button" onClick={() => beginEditing(entry)}>
                    编辑
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={() => void handleDelete(entry)} disabled={deletingEntryId === entry.id}>
                    {deletingEntryId === entry.id ? '删除中…' : '删除'}
                  </SecondaryButton>
                </div>
              )}
            </div>
          ))}
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </Card>
  )
}
