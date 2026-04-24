import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/components/settings/settings-page'

describe('SettingsPage', () => {
  const resetPreferences = vi.fn()
  const restartQuestionnaire = vi.fn()

  beforeEach(() => {
    resetPreferences.mockReset()
    restartQuestionnaire.mockReset()
    resetPreferences.mockResolvedValue({ error: null })
    restartQuestionnaire.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the current recommendation mode', () => {
    render(
      <SettingsPage
        source="questionnaire"
        updatedAt="2026-04-24T06:00:00.000Z"
        resetPreferences={resetPreferences}
        restartQuestionnaire={restartQuestionnaire}
      />
    )

    expect(screen.getByRole('heading', { name: '问卷校准' })).toBeInTheDocument()
    expect(screen.getByText('当前使用风格问卷生成的初始推荐偏好。')).toBeInTheDocument()
  })

  it('confirms before resetting preferences and updates the displayed mode to default', async () => {
    render(
      <SettingsPage
        source="adaptive"
        updatedAt="2026-04-24T06:00:00.000Z"
        resetPreferences={resetPreferences}
        restartQuestionnaire={restartQuestionnaire}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '重置推荐权重' }))
    expect(resetPreferences).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认重置推荐权重' }))

    await waitFor(() => {
      expect(resetPreferences).toHaveBeenCalled()
    })
    expect(screen.getByRole('heading', { name: '默认权重' })).toBeInTheDocument()
    expect(screen.getByText('推荐权重已重置为默认')).toBeInTheDocument()
  })

  it('confirms before starting questionnaire refill', async () => {
    render(
      <SettingsPage
        source="default"
        updatedAt="2026-04-24T06:00:00.000Z"
        resetPreferences={resetPreferences}
        restartQuestionnaire={restartQuestionnaire}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '重新填写风格问卷' }))
    expect(restartQuestionnaire).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认重新填写' }))

    await waitFor(() => {
      expect(restartQuestionnaire).toHaveBeenCalled()
    })
  })

  it('shows reset errors inline', async () => {
    resetPreferences.mockResolvedValue({ error: '推荐权重重置失败，请稍后重试' })

    render(
      <SettingsPage
        source="default"
        updatedAt="2026-04-24T06:00:00.000Z"
        resetPreferences={resetPreferences}
        restartQuestionnaire={restartQuestionnaire}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '重置推荐权重' }))
    fireEvent.click(screen.getByRole('button', { name: '确认重置推荐权重' }))

    expect(await screen.findByText('推荐权重重置失败，请稍后重试')).toBeInTheDocument()
  })
})
