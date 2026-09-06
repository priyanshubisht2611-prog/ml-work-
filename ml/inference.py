"""THE handoff point. Backend calls exactly one function from the ML track:

    from ml.inference import run_inference
    result = run_inference("/data/uploads/3/line_03.png")

Everything else in ml/ is private to the ML track. The returned dict is
validated against ml.contract before it is returned, so a broken model can
never hand the backend a broken shape.

CLI:
    python -m ml.inference <file> --out result.json
    python -m ml.inference <file> --weights runs/best.pt
"""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

import numpy as np
import yaml

from ml.contract import (
    INPUT_IMAGE_SIZE,
    TILE_OVERLAP,
    Detection,
    InferenceResult,
    validate_result,
)
from ml.detector import Detector
from ml.interfaces import ReferencePostProcessor, ReferencePreprocessor

_CONFIG_PATH = Path(__file__).resolve().parent.parent / "configs" / "inference.yaml"
_DETECTOR: Detector | None = None


def load_config(path: str | Path | None = None) -> dict:
    cfg_path = Path(path) if path else _CONFIG_PATH
    cfg = yaml.safe_load(cfg_path.read_text()) if cfg_path.exists() else {}
    # env overrides let the backend container point at its own paths
    if os.getenv("SIH_ML_WEIGHTS"):
        cfg["weights"] = os.environ["SIH_ML_WEIGHTS"]
    if os.getenv("SIH_ML_OUTPUT_DIR"):
        cfg["output_dir"] = os.environ["SIH_ML_OUTPUT_DIR"]
    return cfg
