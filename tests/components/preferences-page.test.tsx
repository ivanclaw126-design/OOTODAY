import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StyleQuestionnairePage } from '@/components/preferences/style-questionnaire-page'
import { HARD_AVOID_OPTIONS } from '@/lib/recommendation/questionnaire-config'

describe('StyleQuestionnairePage', () => {
  const submitAnswers = vi.fn()

  beforeEach(() => {
    submitAnswers.mockReset()
    submitAnswers.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the visual questionnaire sections', () => {
    render(<StyleQuestionnairePage submitAnswers={submitAnswers} />)

    expect(screen.getByText('你最常需要穿搭服务的场景是什么？')).toBeInTheDocument()
    expect(screen.getByText('至少选择 1 个，最多选择 2 个。')).toBeInTheDocument()
    expect(screen.getByText('你更喜欢哪种全身轮廓？')).toBeInTheDocument()
    expect(screen.getByText('可多选，选择 0-5 个都可以。')).toBeInTheDocument()
    expect(screen.getByText('你更喜欢哪种配色？')).toBeInTheDocument()
    expect(screen.getAllByText('单选，只能选择 1 个。')).toHaveLength(5)
    expect(screen.getByText('你能接受多复杂的叠穿？')).toBeInTheDocument()
    expect(screen.getByText('你希望一套穿搭的视觉中心通常在哪里？')).toBeInTheDocument()
    expect(screen.getByText('你更看重舒适实用，还是造型感？')).toBeInTheDocument()
    expect(screen.getByText('你希望推荐包含哪些单品层级？')).toBeInTheDocument()
    expect(screen.getByText('可多选，选择 0-4 个都可以。')).toBeInTheDocument()
    expect(screen.getByText('你愿意偶尔尝试和平时不同的风格吗？')).toBeInTheDocument()
    expect(screen.getByText('明确不喜欢的元素')).toBeInTheDocument()
    expect(screen.getByText(`可多选，选择 0-${HARD_AVOID_OPTIONS.length} 个都可以。`)).toBeInTheDocument()
  })

  it('submits selected answers to the server action prop', async () => {
    render(<StyleQuestionnairePage submitAnswers={submitAnswers} />)

    fireEvent.click(screen.getByRole('button', { name: /通勤干净/u }))
    fireEvent.click(screen.getByRole('button', { name: /城市旅行/u }))
    fireEvent.click(screen.getByRole('button', { name: /上短下长/u }))
    fireEvent.click(screen.getByRole('button', { name: /高对比/u }))
    fireEvent.click(screen.getByRole('button', { name: /三层叠穿/u }))
    fireEvent.click(screen.getAllByRole('button', { name: /鞋子/u })[0])
    fireEvent.click(screen.getByRole('button', { name: /造型优先/u }))
    fireEvent.click(screen.getAllByRole('button', { name: /配饰/u })[1])
    fireEvent.click(screen.getByRole('button', { name: /大胆尝试/u }))
    fireEvent.click(screen.getByRole('button', { name: '不喜欢高跟鞋' }))
    fireEvent.click(screen.getByRole('button', { name: '保存风格偏好' }))

    await waitFor(() => {
      expect(submitAnswers).toHaveBeenCalledWith({
        scenes: ['work', 'travel'],
        silhouettes: ['shortTopHighWaist'],
        colorPalette: 'boldContrast',
        layeringComplexity: 'threeLayer',
        focalPoint: 'shoes',
        practicality: 'style',
        slots: {
          outerwear: true,
          shoes: true,
          bag: true,
          accessories: true
        },
        exploration: 'bold',
        hardAvoids: ['不喜欢高跟鞋']
      })
    })
    expect(screen.getByText('风格问卷已保存')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '回 Today 看新推荐' })).toHaveAttribute('href', '/today')
  })

  it('shows an inline save error from the action', async () => {
    submitAnswers.mockResolvedValue({ error: '风格问卷保存失败，请稍后重试' })

    render(<StyleQuestionnairePage submitAnswers={submitAnswers} />)
    fireEvent.click(screen.getByRole('button', { name: '保存风格偏好' }))

    expect(await screen.findByText('风格问卷保存失败，请稍后重试')).toBeInTheDocument()
  })
})
