import { trackServerEvent } from '@/lib/analytics/server'
import type { RecommendationModelScores, RecommendationSurface } from '@/lib/recommendation/canonical-types'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type CandidateModelScoreMap = Record<string, RecommendationModelScores>

type SupabaseModelScoreClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

function normalizeScore(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null
}

function isLowQualityRun(metrics: unknown) {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return false
  }

  const values = metrics as Record<string, unknown>
  const hardConstraintViolations = Number(values.hard_constraint_violations ?? values.hardConstraintViolations ?? 0)
  const ndcg = Number(values.ndcg_at_k ?? values.ndcgAtK ?? values.ndcg ?? 1)

  return hardConstraintViolations > 0 || (Number.isFinite(ndcg) && ndcg < 0)
}

function routeForSurface(surface: RecommendationSurface) {
  return surface === 'inspiration' ? '/inspiration' : `/${surface}`
}

async function trackModelFallback({
  userId,
  surface,
  reason,
  runId
}: {
  userId: string
  surface: RecommendationSurface
  reason: string
  runId?: string
}) {
  await trackServerEvent({
    userId,
    eventName: 'recommendation_model_fallback',
    module: surface === 'inspiration' ? 'inspiration' : surface,
    route: routeForSurface(surface),
    properties: {
      surface,
      reason,
      runId
    }
  })
}

export async function getPromotedRecommendationModelRun(supabase?: SupabaseModelScoreClient) {
  const client = supabase ?? await createSupabaseServerClient()
  const { data, error } = await client
    .from('recommendation_model_runs')
    .select('id, metrics, promoted_at, trained_at, created_at')
    .eq('status', 'promoted')
    .order('promoted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const trainedAt = data.trained_at ?? data.promoted_at ?? data.created_at
  const trainedTime = trainedAt ? new Date(trainedAt).getTime() : 0
  const maxAgeMs = 14 * 24 * 60 * 60 * 1000

  return {
    id: data.id,
    status: Date.now() - trainedTime > maxAgeMs
      ? 'expired' as const
      : isLowQualityRun(data.metrics)
        ? 'low_quality' as const
        : 'active' as const
  }
}

export async function getCandidateModelScoreMap({
  userId,
  surface,
  supabase
}: {
  userId: string
  surface: RecommendationSurface
  supabase?: SupabaseModelScoreClient
}): Promise<CandidateModelScoreMap> {
  try {
    const client = supabase ?? await createSupabaseServerClient()
    const run = await getPromotedRecommendationModelRun(client)

    if (!run) {
      await trackModelFallback({ userId, surface, reason: 'missing_promoted_run' })
      return {}
    }

    if (run.status !== 'active') {
      await trackModelFallback({ userId, surface, reason: run.status, runId: run.id })
    }

    const { data, error } = await client
      .from('recommendation_model_candidate_scores')
      .select('candidate_id, xgboost_score, lightfm_score, implicit_score, rule_score, final_score')
      .eq('run_id', run.id)
      .eq('user_id', userId)
      .eq('surface', surface)
      .limit(2000)

    if (error) {
      throw error
    }

    if ((data ?? []).length === 0) {
      await trackModelFallback({ userId, surface, reason: 'empty_score_set', runId: run.id })
    }

    return Object.fromEntries(
      ((data ?? []) as Pick<Database['public']['Tables']['recommendation_model_candidate_scores']['Row'], 'candidate_id' | 'xgboost_score' | 'lightfm_score' | 'implicit_score' | 'rule_score' | 'final_score'>[])
        .map((row) => [
          row.candidate_id,
          {
            modelRunId: run.id,
            xgboostScore: normalizeScore(row.xgboost_score),
            lightfmScore: normalizeScore(row.lightfm_score),
            implicitScore: normalizeScore(row.implicit_score),
            ruleScore: normalizeScore(row.rule_score),
            finalScore: normalizeScore(row.final_score),
            status: run.status
          } satisfies RecommendationModelScores
        ])
    )
  } catch {
    await trackServerEvent({
      userId,
      eventName: 'server_action_failed',
      module: surface === 'inspiration' ? 'inspiration' : surface,
      route: routeForSurface(surface),
      properties: {
        code: 'recommendation_model_score_load_failed',
        surface
      }
    })
    return {}
  }
}
