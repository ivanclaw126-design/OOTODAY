#!/usr/bin/env python3
"""Train and publish OOTODAY production recommendation scores.

The online Next.js app does not run Python. This job trains LightFM, implicit
ALS, and XGBoost Ranker offline, writes artifacts to Supabase Storage, and
writes promoted candidate/entity scores to Supabase tables.
"""

from __future__ import annotations

import argparse
import dataclasses
import hashlib
import json
import os
import pickle
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")


EVENT_WEIGHTS: dict[str, float] = {
    "exposed": 0.0,
    "opened": 0.1,
    "skipped": -0.05,
    "saved": 0.6,
    "worn": 1.0,
    "rated_good": 1.5,
    "repeated": 1.2,
    "replaced_item": -0.3,
    "disliked": -1.0,
    "hidden_item": -2.0,
}

RULE_FEATURES = [
    "contextFit",
    "visualCompatibility",
    "userPreference",
    "outfitStrategy",
    "weatherPracticality",
    "novelty",
    "wardrobeRotation",
    "trendOverlay",
    "explanationQuality",
]

COMPATIBILITY_FEATURES = [
    "color",
    "silhouette",
    "material",
    "formality",
    "styleDistance",
    "pattern",
    "shoesBag",
    "temperature",
    "scene",
]

STRATEGY_FEATURES = [
    "capsuleWardrobe",
    "outfitFormula",
    "threeWordStyle",
    "personalColorPalette",
    "sandwichDressing",
    "wrongShoeTheory",
    "twoThirdRule",
    "proportionBalance",
    "layering",
    "tonalDressing",
    "occasionNiche",
    "pinterestRecreation",
    "trendOverlay",
]

MODEL_FEATURES = [
    "lightfmScore",
    "implicitScore",
    "ruleBaselineScore",
]

FEATURE_SCHEMA = {
    "source": "推荐引擎ref.md",
    "ruleFeatures": RULE_FEATURES,
    "compatibilityFeatures": COMPATIBILITY_FEATURES,
    "strategyFeatures": STRATEGY_FEATURES,
    "modelFeatures": MODEL_FEATURES,
    "rankingLabel": "event_value from recommendation_interactions",
}


@dataclasses.dataclass(frozen=True)
class Interaction:
    user_id: str
    surface: str
    event_type: str
    candidate_id: str
    item_ids: tuple[str, ...]
    event_value: float
    context: dict[str, Any]
    score_breakdown: dict[str, Any]
    created_at: str


@dataclasses.dataclass(frozen=True)
class CandidateScore:
    run_id: str
    user_id: str
    surface: str
    candidate_id: str
    xgboost_score: float
    lightfm_score: float
    implicit_score: float
    rule_score: float
    final_score: float
    feature_snapshot: dict[str, Any]


@dataclasses.dataclass(frozen=True)
class EntityScore:
    run_id: str
    user_id: str
    surface: str
    entity_type: str
    entity_id: str
    lightfm_score: float
    implicit_score: float
    metadata: dict[str, Any]


@dataclasses.dataclass(frozen=True)
class NativeTrainingOutput:
    row_scores: list[tuple[float, float, float]]
    diagnostics: dict[str, Any]
    artifacts: dict[str, bytes]


def event_weight(event_type: str, rating: float | None = None) -> float:
    if event_type == "rated_good" and rating is not None:
        return 1.5 if rating >= 4 else 0.4
    return EVENT_WEIGHTS.get(event_type, 0.0)


def normalize_score(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def flatten_feature_snapshot(score_breakdown: dict[str, Any]) -> dict[str, float]:
    features: dict[str, float] = {}

    for group_name, keys in [
        ("ruleScores", RULE_FEATURES),
        ("compatibilityScores", COMPATIBILITY_FEATURES),
        ("strategyScores", STRATEGY_FEATURES),
    ]:
        group = score_breakdown.get(group_name)
        if not isinstance(group, dict):
            group = {}
        for key in keys:
            features[key] = float(group.get(key) or 0.0)

    features["ruleBaselineScore"] = float(score_breakdown.get("ruleBaselineScore") or 0.0)
    return features


def to_interaction(row: dict[str, Any]) -> Interaction:
    context = row.get("context") if isinstance(row.get("context"), dict) else {}
    score_breakdown = row.get("score_breakdown") if isinstance(row.get("score_breakdown"), dict) else {}
    event_type = str(row.get("event_type") or "exposed")
    event_value = row.get("event_value")

    return Interaction(
        user_id=str(row.get("user_id") or ""),
        surface=str(row.get("surface") or "today"),
        event_type=event_type,
        candidate_id=str(row.get("candidate_id") or row.get("recommendation_id") or ""),
        item_ids=tuple(str(item) for item in row.get("item_ids") or []),
        event_value=float(event_value) if event_value is not None else event_weight(event_type),
        context=context,
        score_breakdown=score_breakdown,
        created_at=str(row.get("created_at") or ""),
    )


def build_training_rows(interactions: Iterable[Interaction]) -> list[dict[str, Any]]:
    rows = []

    for interaction in interactions:
        if not interaction.user_id or not interaction.candidate_id:
            continue

        features = flatten_feature_snapshot(interaction.score_breakdown)
        context = interaction.context if isinstance(interaction.context, dict) else {}
        risk_flags = interaction.score_breakdown.get("riskFlags")
        if not isinstance(risk_flags, list):
            risk_flags = []
        rows.append({
            "user_id": interaction.user_id,
            "surface": interaction.surface,
            "event_type": interaction.event_type,
            "candidate_id": interaction.candidate_id,
            "label": interaction.event_value,
            "features": features,
            "item_ids": list(interaction.item_ids),
            "formula_id": str(context.get("formulaId") or extract_formula_id(interaction.candidate_id) or ""),
            "recall_source": str(context.get("recallSource") or infer_recall_source(interaction.candidate_id)),
            "category_keys": [str(item) for item in context.get("categoryKeys", [])] if isinstance(context.get("categoryKeys"), list) else [],
            "color_keys": [str(item) for item in context.get("colorKeys", [])] if isinstance(context.get("colorKeys"), list) else [],
            "risk_flags": [str(item) for item in risk_flags],
        })

    return rows


def extract_formula_id(candidate_id: str) -> str:
    if not candidate_id.startswith("formula-"):
        return ""

    parts = candidate_id.split("-")
    if len(parts) <= 2:
        return ""

    return "-".join(parts[1:-2]) if len(parts) > 3 else parts[1]


def infer_recall_source(candidate_id: str) -> str:
    if candidate_id.startswith("formula-"):
        return "formula"
    if candidate_id.startswith("model-seed-"):
        return "model_seed"
    if candidate_id.startswith("inspiration-"):
        return "exploration"
    if candidate_id.startswith("dress-") or candidate_id.startswith("set-"):
        return "rule"
    return "rule"


def heuristic_model_scores(row: dict[str, Any]) -> tuple[float, float, float]:
    features = row["features"]
    rule_score = normalize_score(features.get("ruleBaselineScore", 0.0))
    strategy_score = sum(features.get(key, 0.0) for key in STRATEGY_FEATURES) / len(STRATEGY_FEATURES)
    compatibility_score = sum(features.get(key, 0.0) for key in COMPATIBILITY_FEATURES) / len(COMPATIBILITY_FEATURES)
    label_bonus = max(-15.0, min(20.0, float(row["label"]) * 10.0))

    lightfm_score = normalize_score(strategy_score + label_bonus)
    implicit_score = normalize_score(compatibility_score + label_bonus * 0.6)
    xgboost_score = normalize_score(rule_score * 0.55 + lightfm_score * 0.25 + implicit_score * 0.2)
    return xgboost_score, lightfm_score, implicit_score


def normalize_series(raw_values: list[float], fallback: float = 50.0) -> list[float]:
    if not raw_values:
        return []

    low = min(raw_values)
    high = max(raw_values)
    if abs(high - low) < 1e-9:
        stable_score = 72.0 if high > 0 else fallback
        return [normalize_score(stable_score) for _ in raw_values]

    return [normalize_score(35.0 + ((value - low) / (high - low)) * 60.0) for value in raw_values]


def xgboost_feature_vector(row: dict[str, Any], lightfm_score: float, implicit_score: float) -> list[float]:
    features = row["features"]
    return [
        *[float(features.get(key, 0.0)) for key in RULE_FEATURES],
        *[float(features.get(key, 0.0)) for key in COMPATIBILITY_FEATURES],
        *[float(features.get(key, 0.0)) for key in STRATEGY_FEATURES],
        float(features.get("ruleBaselineScore", 0.0)),
        lightfm_score,
        implicit_score,
    ]


def train_native_model_scores(rows: list[dict[str, Any]]) -> NativeTrainingOutput:
    heuristic_scores = [heuristic_model_scores(row) for row in rows]
    xgboost_scores = [score[0] for score in heuristic_scores]
    lightfm_scores = [score[1] for score in heuristic_scores]
    implicit_scores = [score[2] for score in heuristic_scores]
    diagnostics: dict[str, Any] = {
        "mode": "native",
        "lightfm": {"status": "fallback"},
        "implicitAls": {"status": "fallback"},
        "xgboostRanker": {"status": "fallback"},
    }
    artifacts: dict[str, bytes] = {}

    if not rows:
        diagnostics["mode"] = "empty"
        return NativeTrainingOutput([], diagnostics, artifacts)

    user_to_index = {user_id: index for index, user_id in enumerate(sorted({row["user_id"] for row in rows}))}
    candidate_to_index = {candidate_id: index for index, candidate_id in enumerate(sorted({row["candidate_id"] for row in rows}))}
    positive_rows = [(index, row) for index, row in enumerate(rows) if float(row["label"]) > 0]

    if positive_rows:
        try:
            import numpy as np
            from lightfm import LightFM
            from scipy.sparse import coo_matrix

            matrix = coo_matrix(
                (
                    [max(0.01, float(row["label"])) for _, row in positive_rows],
                    (
                        [user_to_index[row["user_id"]] for _, row in positive_rows],
                        [candidate_to_index[row["candidate_id"]] for _, row in positive_rows],
                    ),
                ),
                shape=(len(user_to_index), len(candidate_to_index)),
            )
            model = LightFM(no_components=16, loss="warp", random_state=42)
            model.fit(matrix, epochs=12, num_threads=2)
            raw_scores = model.predict(
                np.array([user_to_index[row["user_id"]] for row in rows], dtype=np.int32),
                np.array([candidate_to_index[row["candidate_id"]] for row in rows], dtype=np.int32),
            )
            lightfm_scores = normalize_series([float(score) for score in raw_scores], fallback=50.0)
            artifacts["lightfm"] = pickle.dumps(model)
            diagnostics["lightfm"] = {
                "status": "trained",
                "users": len(user_to_index),
                "candidates": len(candidate_to_index),
                "positiveInteractions": len(positive_rows),
            }
        except Exception as exc:  # pragma: no cover - native library behavior varies by platform.
            diagnostics["lightfm"] = {"status": "fallback", "error": str(exc)}

        try:
            import numpy as np
            from implicit.als import AlternatingLeastSquares
            from scipy.sparse import coo_matrix

            user_item_matrix = coo_matrix(
                (
                    [max(0.01, float(row["label"])) for _, row in positive_rows],
                    (
                        [user_to_index[row["user_id"]] for _, row in positive_rows],
                        [candidate_to_index[row["candidate_id"]] for _, row in positive_rows],
                    ),
                ),
                shape=(len(user_to_index), len(candidate_to_index)),
            ).tocsr()
            model = AlternatingLeastSquares(factors=16, iterations=12, regularization=0.05, random_state=42)
            model.fit(user_item_matrix, show_progress=False)
            raw_scores = [
                float(np.dot(model.user_factors[user_to_index[row["user_id"]]], model.item_factors[candidate_to_index[row["candidate_id"]]]))
                for row in rows
            ]
            implicit_scores = normalize_series(raw_scores, fallback=50.0)
            artifacts["implicit_als"] = pickle.dumps(model)
            diagnostics["implicitAls"] = {
                "status": "trained",
                "users": len(user_to_index),
                "candidates": len(candidate_to_index),
                "positiveInteractions": len(positive_rows),
            }
        except Exception as exc:  # pragma: no cover - native library behavior varies by platform.
            diagnostics["implicitAls"] = {"status": "fallback", "error": str(exc)}
    else:
        diagnostics["lightfm"] = {"status": "fallback", "reason": "no_positive_interactions"}
        diagnostics["implicitAls"] = {"status": "fallback", "reason": "no_positive_interactions"}

    try:
        import numpy as np
        from xgboost import XGBRanker

        indexed_rows = sorted(enumerate(rows), key=lambda entry: (entry[1]["user_id"], entry[1]["surface"]))
        groups: list[int] = []
        current_group: tuple[str, str] | None = None
        group_size = 0
        for _, row in indexed_rows:
            group_key = (row["user_id"], row["surface"])
            if current_group is None:
                current_group = group_key
            if group_key != current_group:
                groups.append(group_size)
                current_group = group_key
                group_size = 0
            group_size += 1
        if group_size:
            groups.append(group_size)

        relevance = [
            3 if float(row["label"]) >= 1.0 else 1 if float(row["label"]) > 0.0 else 0
            for _, row in indexed_rows
        ]
        can_train_ranker = len(rows) >= 2 and len(groups) > 0 and max(groups) >= 2 and any(value > 0 for value in relevance)

        if can_train_ranker:
            x_train = np.array([
                xgboost_feature_vector(row, lightfm_scores[index], implicit_scores[index])
                for index, row in indexed_rows
            ], dtype=np.float32)
            y_train = np.array(relevance, dtype=np.float32)
            ranker = XGBRanker(
                objective="rank:ndcg",
                eval_metric="ndcg@10",
                n_estimators=40,
                max_depth=3,
                learning_rate=0.08,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42,
            )
            ranker.fit(x_train, y_train, group=groups, verbose=False)
            sorted_predictions = ranker.predict(x_train)
            raw_predictions = [0.0 for _ in rows]
            for sorted_index, (row_index, _) in enumerate(indexed_rows):
                raw_predictions[row_index] = float(sorted_predictions[sorted_index])
            xgboost_scores = normalize_series(raw_predictions, fallback=50.0)
            artifacts["xgboost_ranker"] = pickle.dumps(ranker)
            diagnostics["xgboostRanker"] = {
                "status": "trained",
                "groups": len(groups),
                "rows": len(rows),
                "features": len(x_train[0]) if len(x_train) else 0,
            }
        else:
            diagnostics["xgboostRanker"] = {
                "status": "fallback",
                "reason": "insufficient_grouped_positive_rows",
                "groups": len(groups),
                "rows": len(rows),
            }
    except Exception as exc:  # pragma: no cover - native library behavior varies by platform.
        diagnostics["xgboostRanker"] = {"status": "fallback", "error": str(exc)}

    return NativeTrainingOutput(
        row_scores=list(zip(xgboost_scores, lightfm_scores, implicit_scores)),
        diagnostics=diagnostics,
        artifacts=artifacts,
    )


def build_candidate_scores_with_diagnostics(
    rows: list[dict[str, Any]],
    run_id: str,
    use_native_models: bool = False,
) -> tuple[list[CandidateScore], dict[str, Any], dict[str, bytes]]:
    by_candidate: dict[tuple[str, str, str], list[dict[str, Any]]] = {}
    training_output = train_native_model_scores(rows) if use_native_models else NativeTrainingOutput(
        row_scores=[heuristic_model_scores(row) for row in rows],
        diagnostics={"mode": "heuristic_shadow"},
        artifacts={},
    )

    for row, model_scores in zip(rows, training_output.row_scores):
        row["model_scores"] = {
            "xgboostScore": model_scores[0],
            "lightfmScore": model_scores[1],
            "implicitScore": model_scores[2],
        }
        key = (row["user_id"], row["surface"], row["candidate_id"])
        by_candidate.setdefault(key, []).append(row)

    scores: list[CandidateScore] = []
    for (user_id, surface, candidate_id), candidate_rows in by_candidate.items():
        scored_rows = []
        for row in candidate_rows:
            model_scores = row["model_scores"]
            xgboost_score = normalize_score(model_scores["xgboostScore"])
            lightfm_score = normalize_score(model_scores["lightfmScore"])
            implicit_score = normalize_score(model_scores["implicitScore"])
            rule_score = normalize_score(row["features"].get("ruleBaselineScore", 0.0))
            final_score = normalize_score(
                xgboost_score * 0.72 + lightfm_score * 0.12 + implicit_score * 0.10 + rule_score * 0.06
            )
            scored_rows.append((
                final_score,
                xgboost_score,
                lightfm_score,
                implicit_score,
                rule_score,
                {
                    **row["features"],
                    "lightfmScore": lightfm_score,
                    "implicitScore": implicit_score,
                    "xgboostScore": xgboost_score,
                },
            ))

        final_score, xgboost_score, lightfm_score, implicit_score, rule_score, features = max(scored_rows, key=lambda entry: entry[0])
        scores.append(CandidateScore(
            run_id=run_id,
            user_id=user_id,
            surface=surface,
            candidate_id=candidate_id,
            xgboost_score=xgboost_score,
            lightfm_score=lightfm_score,
            implicit_score=implicit_score,
            rule_score=rule_score,
            final_score=final_score,
            feature_snapshot=features,
        ))

    return scores, training_output.diagnostics, training_output.artifacts


def build_candidate_scores(rows: list[dict[str, Any]], run_id: str) -> list[CandidateScore]:
    scores, _, _ = build_candidate_scores_with_diagnostics(rows, run_id)
    return scores


def build_entity_scores(rows: list[dict[str, Any]], candidate_scores: list[CandidateScore], run_id: str) -> list[EntityScore]:
    candidate_score_map = {
        (score.user_id, score.surface, score.candidate_id): score
        for score in candidate_scores
    }
    by_entity: dict[tuple[str, str, str], list[tuple[dict[str, Any], CandidateScore]]] = {}

    for row in rows:
        candidate_score = candidate_score_map.get((row["user_id"], row["surface"], row["candidate_id"]))
        if not candidate_score:
            continue
        for item_id in row.get("item_ids", []):
            by_entity.setdefault((row["user_id"], row["surface"], str(item_id)), []).append((row, candidate_score))

    entity_scores: list[EntityScore] = []
    for (user_id, surface, entity_id), entries in by_entity.items():
        lightfm_score = normalize_score(sum(score.lightfm_score for _, score in entries) / len(entries))
        implicit_score = normalize_score(sum(score.implicit_score for _, score in entries) / len(entries))
        labels = [float(row["label"]) for row, _ in entries]
        entity_scores.append(EntityScore(
            run_id=run_id,
            user_id=user_id,
            surface=surface,
            entity_type="closet_item",
            entity_id=entity_id,
            lightfm_score=lightfm_score,
            implicit_score=implicit_score,
            metadata={
                "candidateCount": len(entries),
                "positiveEventCount": sum(1 for label in labels if label > 0),
                "meanLabel": sum(labels) / len(labels),
            },
        ))

    return entity_scores


def row_relevance(row: dict[str, Any]) -> float:
    label = float(row["label"])
    if label >= 1.0:
        return 3.0
    if label > 0:
        return 1.0
    return 0.0


def dcg(relevances: list[float]) -> float:
    return sum((2 ** relevance - 1) / (math_log2(index + 2)) for index, relevance in enumerate(relevances))


def math_log2(value: int) -> float:
    import math

    return math.log2(value)


def average_precision(relevances: list[float]) -> float:
    hits = 0
    precision_sum = 0.0
    for index, relevance in enumerate(relevances, start=1):
        if relevance > 0:
            hits += 1
            precision_sum += hits / index
    return precision_sum / max(1, hits)


def jaccard_distance(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 0.0
    return 1.0 - (len(left & right) / max(1, len(left | right)))


def coverage(top_values: set[str], all_values: set[str]) -> float:
    return len(top_values) / max(1, len(all_values))


def ranking_metrics(rows: list[dict[str, Any]], scores: list[CandidateScore], k: int = 10) -> dict[str, float]:
    if not rows or not scores:
        return {
            "hitrate_at_k": 0.0,
            "recall_at_k": 0.0,
            "ndcg_at_k": 0.0,
            "map_at_k": 0.0,
            "coverage": 0.0,
            "item_coverage": 0.0,
            "category_coverage": 0.0,
            "color_coverage": 0.0,
            "formula_coverage": 0.0,
            "diversity": 0.0,
            "intra_list_diversity": 0.0,
            "novelty": 0.0,
            "edit_rate": 0.0,
            "item_repetition_rate": 0.0,
            "wear_through_rate": 0.0,
            "satisfaction_after_wear": 0.0,
            "hard_constraint_violations": 0.0,
            "row_count": 0.0,
            "positive_user_count": 0.0,
            "positive_candidate_count": 0.0,
        }

    by_candidate: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_candidate.setdefault(row["candidate_id"], []).append(row)

    candidate_relevance = {
        candidate_id: max(row_relevance(row) for row in candidate_rows)
        for candidate_id, candidate_rows in by_candidate.items()
    }
    positives = {candidate_id for candidate_id, relevance in candidate_relevance.items() if relevance > 0}
    top_scores = sorted(scores, key=lambda score: score.final_score, reverse=True)[:k]
    top_ids = {score.candidate_id for score in top_scores}
    hits = len(top_ids & positives)
    all_candidates = {row["candidate_id"] for row in rows}
    worn = [row for row in rows if float(row["label"]) >= 1.0]
    top_rows = [by_candidate.get(score.candidate_id, [{}])[0] for score in top_scores]
    top_relevances = [candidate_relevance.get(score.candidate_id, 0.0) for score in top_scores]
    ideal_relevances = sorted(candidate_relevance.values(), reverse=True)[:k]
    top_item_sets = [set(row.get("item_ids", [])) for row in top_rows]
    pair_distances = [
        jaccard_distance(left, right)
        for index, left in enumerate(top_item_sets)
        for right in top_item_sets[index + 1:]
    ]
    top_items = [item_id for row in top_rows for item_id in row.get("item_ids", [])]
    all_items = {item_id for row in rows for item_id in row.get("item_ids", [])}
    top_categories = {item for row in top_rows for item in row.get("category_keys", [])}
    all_categories = {item for row in rows for item in row.get("category_keys", [])}
    top_colors = {item for row in top_rows for item in row.get("color_keys", [])}
    all_colors = {item for row in rows for item in row.get("color_keys", [])}
    top_formulas = {row.get("formula_id") for row in top_rows if row.get("formula_id")}
    all_formulas = {row.get("formula_id") for row in rows if row.get("formula_id")}
    positive_rows = [row for row in rows if row_relevance(row) > 0]

    return {
        "hitrate_at_k": 1.0 if hits > 0 else 0.0,
        "recall_at_k": hits / max(1, len(positives)),
        "ndcg_at_k": dcg(top_relevances) / max(1e-9, dcg(ideal_relevances)),
        "map_at_k": average_precision(top_relevances),
        "coverage": len(top_ids) / max(1, len(all_candidates)),
        "item_coverage": coverage(set(top_items), all_items),
        "category_coverage": coverage(top_categories, all_categories) if all_categories else 0.0,
        "color_coverage": coverage(top_colors, all_colors) if all_colors else 0.0,
        "formula_coverage": coverage(top_formulas, all_formulas) if all_formulas else 0.0,
        "diversity": len({score.surface for score in top_scores}) / 4.0,
        "intra_list_diversity": sum(pair_distances) / max(1, len(pair_distances)),
        "novelty": sum(score.final_score < 72 for score in top_scores) / max(1, len(top_scores)),
        "edit_rate": sum(row.get("event_type") == "replaced_item" for row in rows) / max(1, len(rows)),
        "item_repetition_rate": 1.0 - (len(set(top_items)) / max(1, len(top_items))),
        "wear_through_rate": len(worn) / max(1, len(rows)),
        "satisfaction_after_wear": sum(float(row["label"]) for row in worn) / max(1, len(worn)),
        "hard_constraint_violations": sum(
            1
            for row in top_rows
            if {"hardAvoid", "weatherMismatch", "hiddenItem"} & set(row.get("risk_flags", []))
        ),
        "row_count": float(len(rows)),
        "positive_user_count": float(len({row["user_id"] for row in positive_rows})),
        "positive_candidate_count": float(len(positives)),
    }


def should_promote(
    metrics: dict[str, float],
    baseline_metrics: dict[str, float] | None = None,
    min_rows: int = 50,
    min_positive_users: int = 3,
    min_positive_candidates: int = 10,
) -> bool:
    if metrics.get("row_count", 0.0) < min_rows:
        return False

    if metrics.get("positive_user_count", 0.0) < min_positive_users:
        return False

    if metrics.get("positive_candidate_count", 0.0) < min_positive_candidates:
        return False

    if metrics.get("hard_constraint_violations", 1.0) > 0:
        return False

    if "coverage" in metrics and metrics.get("coverage", 0.0) <= 0:
        return False

    baseline_ndcg = (baseline_metrics or {}).get("ndcg_at_k", 0.0)
    if metrics.get("ndcg_at_k", 0.0) < baseline_ndcg:
        return False

    baseline_coverage = (baseline_metrics or {}).get("coverage", 0.0)
    if baseline_coverage and metrics.get("coverage", 0.0) < baseline_coverage * 0.9:
        return False

    baseline_diversity = (baseline_metrics or {}).get("diversity", 0.0)
    if baseline_diversity and metrics.get("diversity", 0.0) < baseline_diversity * 0.9:
        return False

    return True


def require_native_model_libraries() -> None:
    missing = []
    for module_name in ["lightfm", "implicit", "xgboost"]:
        try:
            __import__(module_name)
        except ImportError:
            missing.append(module_name)

    if missing:
        raise RuntimeError(f"Missing required ML libraries: {', '.join(missing)}")


def write_artifact(path: Path, payload: dict[str, Any]) -> str:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def supabase_client():
    from supabase import create_client

    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def fetch_interactions(client: Any, limit: int, lookback_days: int | None = None) -> list[Interaction]:
    query = (
        client.table("recommendation_interactions")
        .select("user_id,surface,event_type,event_value,recommendation_id,candidate_id,item_ids,context,score_breakdown,created_at")
    )
    if lookback_days and lookback_days > 0:
        since = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        query = query.gte("created_at", since.isoformat())

    result = query.order("created_at", desc=True).limit(limit).execute()
    return [to_interaction(row) for row in (result.data or [])]


def publish_scores(
    client: Any,
    run_id: str,
    metrics: dict[str, float],
    scores: list[CandidateScore],
    entity_scores: list[EntityScore],
    artifact_payload: dict[str, Any],
    artifact_checksum: str,
    model_artifacts: dict[str, bytes],
    dry_run: bool,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    run_payload = {
        "id": run_id,
        "model_version": f"recommendation-{now[:10]}",
        "status": "promoted",
        "algorithm_bundle": "lightfm_implicit_xgboost",
        "metrics": metrics,
        "feature_schema": FEATURE_SCHEMA,
        "promoted_at": now,
        "trained_at": now,
    }
    score_payload = [dataclasses.asdict(score) for score in scores]
    entity_score_payload = [dataclasses.asdict(score) for score in entity_scores]
    artifact_records = {
        "shadow_report": (
            "shadow_report.json",
            json.dumps(artifact_payload, ensure_ascii=False, indent=2).encode("utf-8"),
            artifact_checksum,
            "application/json",
        ),
        "feature_schema": (
            "feature_schema.json",
            json.dumps(FEATURE_SCHEMA, ensure_ascii=False, indent=2).encode("utf-8"),
            hashlib.sha256(json.dumps(FEATURE_SCHEMA, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest(),
            "application/json",
        ),
    }
    for artifact_type, artifact_bytes in model_artifacts.items():
        artifact_records[artifact_type] = (
            f"{artifact_type}.pkl",
            artifact_bytes,
            hashlib.sha256(artifact_bytes).hexdigest(),
            "application/octet-stream",
        )

    if dry_run:
        print(json.dumps({
            "run": run_payload,
            "scoreCount": len(score_payload),
            "entityScoreCount": len(entity_score_payload),
            "metrics": metrics,
            "artifacts": [
                {"type": artifact_type, "checksum": artifact[2]}
                for artifact_type, artifact in artifact_records.items()
            ],
        }, ensure_ascii=False, indent=2))
        return

    client.table("recommendation_model_runs").update({"status": "retired"}).eq("status", "promoted").execute()
    client.table("recommendation_model_runs").upsert(run_payload).execute()
    if score_payload:
        client.table("recommendation_model_candidate_scores").upsert(score_payload).execute()
    if entity_score_payload:
        client.table("recommendation_model_entity_scores").upsert(entity_score_payload).execute()

    bucket = os.environ.get("RECOMMENDATION_MODEL_ARTIFACT_BUCKET", "recommendation-model-artifacts")
    artifact_table_payload = []
    for artifact_type, (filename, artifact_bytes, checksum, content_type) in artifact_records.items():
        storage_path = f"{run_id}/{filename}"
        client.storage.from_(bucket).upload(
            storage_path,
            artifact_bytes,
            {"content-type": content_type, "upsert": "true"},
        )
        artifact_table_payload.append({
            "run_id": run_id,
            "artifact_type": artifact_type,
            "storage_bucket": bucket,
            "storage_path": storage_path,
            "checksum": checksum,
            "metadata": {
                "metrics": metrics,
                "feature_schema": FEATURE_SCHEMA,
            },
        })
    client.table("recommendation_model_artifacts").insert(artifact_table_payload).execute()


def run_training(args: argparse.Namespace) -> int:
    if args.require_native_models:
        require_native_model_libraries()

    run_id = args.run_id or str(uuid4())
    client = None if args.local_fixture else supabase_client()
    if args.local_fixture:
        rows = json.loads(Path(args.local_fixture).read_text(encoding="utf-8"))
        interactions = [to_interaction(row) for row in rows]
    else:
        interactions = fetch_interactions(client, args.limit, args.lookback_days)

    training_rows = build_training_rows(interactions)
    scores, training_diagnostics, model_artifacts = build_candidate_scores_with_diagnostics(
        training_rows,
        run_id,
        use_native_models=args.require_native_models,
    )
    entity_scores = build_entity_scores(training_rows, scores, run_id)
    metrics = ranking_metrics(training_rows, scores)
    promotion_eligible = should_promote(
        metrics,
        {"ndcg_at_k": 0.0, "coverage": 0.0, "diversity": 0.0},
        min_rows=args.min_interactions,
    )
    promoted = bool(args.promote and promotion_eligible)

    with tempfile.TemporaryDirectory() as tmp:
        artifact_path = Path(tmp) / "shadow_report.json"
        artifact_payload = {
            "runId": run_id,
            "featureSchema": FEATURE_SCHEMA,
            "metrics": metrics,
            "trainingDiagnostics": training_diagnostics,
            "scoreCount": len(scores),
            "entityScoreCount": len(entity_scores),
            "promoted": promoted,
            "promotionEligible": promotion_eligible,
            "promotionRequested": args.promote,
        }
        checksum = write_artifact(artifact_path, artifact_payload)

    if not promoted:
        print(json.dumps({
            "promoted": False,
            "promotionEligible": promotion_eligible,
            "promotionRequested": args.promote,
            "metrics": metrics,
            "trainingDiagnostics": training_diagnostics,
        }, ensure_ascii=False, indent=2))
        return 0

    if client is None and args.dry_run:
        publish_scores(client, run_id, metrics, scores, entity_scores, artifact_payload, checksum, model_artifacts, True)
        return 0

    if client is None:
        print(json.dumps({
            "promoted": True,
            "scoreCount": len(scores),
            "entityScoreCount": len(entity_scores),
            "metrics": metrics,
            "trainingDiagnostics": training_diagnostics,
            "artifacts": sorted(model_artifacts.keys()),
        }, ensure_ascii=False, indent=2))
        return 0

    publish_scores(client, run_id, metrics, scores, entity_scores, artifact_payload, checksum, model_artifacts, args.dry_run)
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5000)
    parser.add_argument("--lookback-days", type=int, default=90)
    parser.add_argument("--min-interactions", type=int, default=50)
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--require-native-models", action="store_true")
    parser.add_argument("--local-fixture")
    parser.add_argument("--run-id")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    return run_training(parse_args(argv or sys.argv[1:]))


if __name__ == "__main__":
    raise SystemExit(main())
