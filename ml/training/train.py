"""Training entry point. Every run is reproducible and logged.

    python -m ml.training.train --config configs/baseline_yolov8s.yaml
    python -m ml.training.train --config configs/baseline_yolov8s.yaml --epochs 5

A run that is not in runs/RUN_LOG.csv did not happen. The log is what lets us
say "v3 beat v2 because of X" in the deck instead of guessing.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import platform
import random
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
RUN_LOG = ROOT / "runs" / "RUN_LOG.csv"
LOG_FIELDS = [
    "run_id", "started_utc", "config", "config_hash", "dataset_version",
    "model", "epochs", "imgsz", "seed", "freeze", "git_sha",
    "map50", "map50_95", "precision", "recall", "checkpoint", "notes",
]


def set_seed(seed: int) -> None:
    random.seed(seed)
    try:
        import numpy as np
        import torch
    except ImportError:
        return
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def config_hash(cfg: dict) -> str:
    blob = json.dumps(cfg, sort_keys=True, default=str).encode()
    return hashlib.sha256(blob).hexdigest()[:10]


def git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except Exception:
        return "nogit"


def log_run(row: dict) -> None:
    RUN_LOG.parent.mkdir(parents=True, exist_ok=True)
    is_new = not RUN_LOG.exists()
    with RUN_LOG.open("a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=LOG_FIELDS)
        if is_new:
            writer.writeheader()
        writer.writerow({k: row.get(k, "") for k in LOG_FIELDS})
    print(f"logged run -> {RUN_LOG}")
