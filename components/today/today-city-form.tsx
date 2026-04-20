'use client'

import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'

type TodayCityFormProps = {
  initialCity: string
  onSubmit: (input: { city: string }) => Promise<{ error: string | null }>
  onCancel: () => void
}

export function TodayCityForm({ initialCity, onSubmit, onCancel }: TodayCityFormProps) {
  const [city, setCity] = useState(initialCity)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <form
      className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault()
        setIsSaving(true)
        const result = await onSubmit({ city })
        setError(result.error)
        setIsSaving(false)
        if (!result.error) {
          onCancel()
        }
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>常住城市</span>
        <input
          aria-label="常住城市"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={isSaving}>
          保存城市
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          取消
        </SecondaryButton>
      </div>
    </form>
  )
}
