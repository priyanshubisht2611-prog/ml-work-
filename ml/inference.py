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


def get_detector(cfg: dict | None = None) -> Detector:
    """Loaded once per process. The worker should call this at startup so the
    first upload of the demo is not the one that pays the model-load cost."""
    global _DETECTOR
    if _DETECTOR is None:
        cfg = cfg or load_config()
        _DETECTOR = Detector(
            weights=cfg.get("weights"),
            conf=cfg.get("conf_threshold", 0.25),
            iou=cfg.get("iou_threshold", 0.45),
            imgsz=cfg.get("imgsz", INPUT_IMAGE_SIZE),
        )
    return _DETECTOR


def run_inference(file_path: str, config: dict | None = None,
                  progress_cb=None) -> dict:
    """Raw sonar file (or preprocessed image) -> detections, in the frozen schema.

    Args:
        file_path: path to an .xtf/.jsf survey file or a preprocessed .png/.jpg.
        config: optional overrides for configs/inference.yaml.
        progress_cb: optional callable(stage: str, pct: int) so the backend
            worker can drive a real progress bar (B4 in the plan).

    Returns:
        dict matching ml.contract / schemas/detection_result.schema.json.

    Raises:
        FileNotFoundError: file_path does not exist.
        ContractError: the pipeline produced something off-contract (a bug on
            our side; the worker should mark the job failed and log it).
    """
    started = time.perf_counter()
    src = Path(file_path)
    if not src.exists():
        raise FileNotFoundError(file_path)

    cfg = {**load_config(), **(config or {})}
    detector = get_detector(cfg)
    pre = ReferencePreprocessor()
    post = ReferencePostProcessor()

    def report(stage: str, pct: int) -> None:
        if progress_cb:
            progress_cb(stage, pct)

    report("parsed", 10)
    sonar = pre.load(str(src))

    report("preprocessed", 30)
    tiles = pre.tile(
        sonar,
        size=cfg.get("imgsz", INPUT_IMAGE_SIZE),
        overlap=cfg.get("tile_overlap", TILE_OVERLAP),
    )

    report("inferred", 70)
    batch_size = cfg.get("batch_size", 16)
    per_tile: list[list[dict]] = []
    for i in range(0, len(tiles), batch_size):
        chunk = tiles[i : i + batch_size]
        per_tile.extend(detector.predict_tiles([t.image for t in chunk]))

    merged = post.stitch(
        list(zip(tiles, per_tile)), iou_threshold=cfg.get("stitch_iou", 0.5)
    )
    merged = post.georeference(merged, sonar)
    merged = [d for d in merged if d["confidence"] >= cfg.get("conf_threshold", 0.25)]
    merged = _clip_to_image(merged, sonar.width, sonar.height)

    overlay_path = None
    if cfg.get("write_overlay", True):
        overlay_path = _write_overlay(sonar.image, merged, sonar.image_id,
                                      Path(cfg.get("output_dir", "data/overlays")))

    result = InferenceResult(
        image_id=sonar.image_id,
        width=sonar.width,
        height=sonar.height,
        processing_ms=int((time.perf_counter() - started) * 1000),
        detections=[Detection.from_dict(d) for d in merged],
        overlay_path=overlay_path,
        model_version=detector.version,
    ).to_dict()

    validate_result(result)   # never hand the backend an off-contract payload
    report("stored", 100)
    return result
