import { buildPreferencesFromQuestionnaire } from '@/lib/recommendation/questionnaire-map'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import { savePreferenceState } from '@/lib/recommendation/save-preference-state'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'
import type { RecommendationSupabaseClientLike } from '@/lib/recommendation/recommendation-supabase'

export async function submitQuestionnaire({
  userId,
  answers,
  now = new Date(),
  supabase
}: {
  userId: string
  answers: StyleQuestionnaireAnswers
  now?: Date
  supabase?: RecommendationSupabaseClientLike
}) {
  const defaultState = resetRecommendationPreferences(now)
  const questionnaireResult = buildPreferencesFromQuestionnaire(answers)
  const state = {
    ...defaultState,
    source: 'questionnaire' as const,
    hasQuestionnaireAnswers: true,
    questionnaireAnswers: answers,
    questionnaireDelta: questionnaireResult.questionnaireDelta,
    ratingDelta: {},
    finalWeights: questionnaireResult.finalWeights,
    profile: questionnaireResult.profile,
    updatedAt: now.toISOString()
  }

  await savePreferenceState({
    userId,
    state,
    questionnaireAnswers: answers,
    supabase
  })

  return state
}
