from ml.recommendation.train import (
    COMPATIBILITY_FEATURES,
    RULE_FEATURES,
    STRATEGY_FEATURES,
    build_candidate_scores,
    build_candidate_scores_with_diagnostics,
    build_entity_scores,
    build_training_rows,
    event_weight,
    flatten_feature_snapshot,
    ranking_metrics,
    should_promote,
    to_interaction,
)


def promotable_metrics(**overrides):
    metrics = {
        "hard_constraint_violations": 0,
        "ndcg_at_k": 0.7,
        "coverage": 1.0,
        "diversity": 0.8,
        "row_count": 50,
        "positive_user_count": 3,
        "positive_candidate_count": 10,
    }
    metrics.update(overrides)
    return metrics


def score_breakdown(rule_score=82):
    return {
        "ruleBaselineScore": rule_score,
        "ruleScores": {key: 80 for key in RULE_FEATURES},
        "compatibilityScores": {key: 78 for key in COMPATIBILITY_FEATURES},
        "strategyScores": {key: 76 for key in STRATEGY_FEATURES},
    }


def test_event_weights_match_product_contract():
    assert event_weight("exposed") == 0
    assert event_weight("opened") == 0.1
    assert event_weight("skipped") == -0.05
    assert event_weight("saved") == 0.6
    assert event_weight("worn") == 1.0
    assert event_weight("rated_good", rating=5) == 1.5
    assert event_weight("replaced_item") == -0.3
    assert event_weight("disliked") == -1.0
    assert event_weight("hidden_item") == -2.0


def test_feature_schema_contains_md_strategy_and_score_dimensions():
    features = flatten_feature_snapshot(score_breakdown())

    for key in [*RULE_FEATURES, *COMPATIBILITY_FEATURES, *STRATEGY_FEATURES, "ruleBaselineScore"]:
        assert key in features


def test_build_candidate_scores_outputs_model_bundle_scores():
    rows = [
        to_interaction({
            "user_id": "user-1",
            "surface": "today",
            "event_type": "worn",
            "candidate_id": "candidate-1",
            "event_value": 1.0,
            "score_breakdown": score_breakdown(88),
        })
    ]
    training_rows = build_training_rows(rows)
    scores = build_candidate_scores(training_rows, "run-1")

    assert scores[0].xgboost_score > 0
    assert scores[0].lightfm_score > 0
    assert scores[0].implicit_score > 0
    assert scores[0].final_score >= scores[0].rule_score * 0.06


def test_promotion_gate_blocks_hard_constraint_violations_and_regressions():
    assert should_promote(promotable_metrics(ndcg_at_k=0.5), {"ndcg_at_k": 0.4})
    assert not should_promote(promotable_metrics(hard_constraint_violations=1, ndcg_at_k=0.9), {"ndcg_at_k": 0.4})
    assert not should_promote(promotable_metrics(ndcg_at_k=0.3), {"ndcg_at_k": 0.4})
    assert not should_promote(promotable_metrics(coverage=0.0, ndcg_at_k=0.9), {"ndcg_at_k": 0.4})
    assert not should_promote(promotable_metrics(row_count=49))
    assert not should_promote(promotable_metrics(positive_user_count=2))
    assert not should_promote(promotable_metrics(positive_candidate_count=9))


def test_metrics_include_required_offline_acceptance_dimensions():
    rows = build_training_rows([
        to_interaction({
            "user_id": "user-1",
            "surface": "today",
            "event_type": "worn",
            "candidate_id": "candidate-1",
            "event_value": 1.0,
            "score_breakdown": score_breakdown(90),
        }),
        to_interaction({
            "user_id": "user-1",
            "surface": "today",
            "event_type": "skipped",
            "candidate_id": "candidate-2",
            "event_value": -0.05,
            "score_breakdown": score_breakdown(40),
        }),
    ])
    scores = build_candidate_scores(rows, "run-1")
    metrics = ranking_metrics(rows, scores)

    for key in [
        "hitrate_at_k",
        "recall_at_k",
        "ndcg_at_k",
        "map_at_k",
        "coverage",
        "item_coverage",
        "category_coverage",
        "color_coverage",
        "formula_coverage",
        "diversity",
        "intra_list_diversity",
        "novelty",
        "edit_rate",
        "item_repetition_rate",
        "wear_through_rate",
        "satisfaction_after_wear",
        "positive_user_count",
        "positive_candidate_count",
    ]:
        assert key in metrics
    assert metrics["ndcg_at_k"] >= metrics["map_at_k"]


def test_candidate_and_entity_scores_include_shadow_training_diagnostics():
    rows = build_training_rows([
        to_interaction({
            "user_id": "user-1",
            "surface": "today",
            "event_type": "worn",
            "candidate_id": "candidate-1",
            "item_ids": ["11111111-1111-1111-1111-111111111111"],
            "event_value": 1.0,
            "score_breakdown": score_breakdown(90),
        }),
    ])
    scores, diagnostics, artifacts = build_candidate_scores_with_diagnostics(rows, "run-1")
    entity_scores = build_entity_scores(rows, scores, "run-1")

    assert diagnostics["mode"] == "heuristic_shadow"
    assert artifacts == {}
    assert entity_scores[0].entity_type == "closet_item"
    assert entity_scores[0].entity_id == "11111111-1111-1111-1111-111111111111"
    assert entity_scores[0].lightfm_score > 0
