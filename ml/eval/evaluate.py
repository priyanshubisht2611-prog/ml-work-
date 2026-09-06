"""Evaluation harness (step A8). Akshat defines it, Neha runs it per checkpoint.

    python -m ml.eval.evaluate --weights runs/train/baseline/weights/best.pt
    python -m ml.eval.evaluate --weights best.pt --split test --area-km2 12.4

Outputs into runs/eval/<checkpoint-stem>/:
    metrics.json          machine-readable, used by the deck and the README table
    metrics.md            paste-ready table for Prachi
    confusion_matrix.png  } produced by ultralytics, copied here so one folder
    PR_curve.png          } holds everything the deck needs

Always evaluate on the held-out TEST split from surveys the model never saw.
Val numbers are for choosing a checkpoint, never for reporting.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

import yaml

from ml.contract import CLASSES

ROOT = Path(__file__).resolve().parents[2]


def evaluate(weights: str, data: str, split: str, area_km2: float | None,
             conf: float, iou: float) -> dict:
    from ultralytics import YOLO

    model = YOLO(weights)
    res = model.val(data=str(ROOT / data), split=split, conf=conf, iou=iou,
                    plots=True, verbose=False)

    names = getattr(res, "names", None) or {i: c for i, c in enumerate(CLASSES)}
    per_class = {}
    for i, cls_id in enumerate(getattr(res.box, "ap_class_index", [])):
        per_class[names[int(cls_id)]] = {
            "precision": round(float(res.box.p[i]), 4),
            "recall": round(float(res.box.r[i]), 4),
            "map50": round(float(res.box.ap50[i]), 4),
            "map50_95": round(float(res.box.ap[i]), 4),
        }

    summary = {
        "weights": str(weights),
        "data": data,
        "split": split,
        "conf_threshold": conf,
        "iou_threshold": iou,
        "map50": round(float(res.box.map50), 4),
        "map50_95": round(float(res.box.map), 4),
        "precision": round(float(res.box.mp), 4),
        "recall": round(float(res.box.mr), 4),
        "per_class": per_class,
        "plots_dir": str(res.save_dir),
    }

    # The metric a domain judge actually asks about: how much junk does an
    # analyst have to sift through per square kilometre of survey?
    fp = _false_positive_count(res)
    summary["false_positives"] = fp
    if area_km2:
        summary["area_km2"] = area_km2
        summary["false_positives_per_km2"] = round(fp / area_km2, 2)
    return summary


def _false_positive_count(res) -> int:
    """Sum the background column of the ultralytics confusion matrix: predictions
    that matched no ground-truth box."""
    try:
        matrix = res.confusion_matrix.matrix  # (nc+1, nc+1)
        return int(matrix[:-1, -1].sum())
    except Exception:
        return -1
