"""SIH PS57 — the full pipeline, end to end.

    sonar image -> sensor routing -> detection -> confidence filtering
                -> geo-referencing -> JSON/CSV anomaly report

    python pipeline.py                        # random image, auto-routed
    python pipeline.py path/to/image.png
    python pipeline.py --sensor sidescan      # override the routing
    python pipeline.py --conf 0.15
    python pipeline.py --live                 # stay loaded, image after image

One system, two trained heads. The router picks the model that matches the
sensor; both models are loaded once and reused.

NAVIGATION IS SIMULATED - there is no raw XTF file here, so a plausible survey
track is attached. The geo-referencing is the real implementation; every report
declares the navigation source.
"""

import argparse
import random
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from ml.router import detect_sensor, SIDESCAN, FLS          # noqa: E402
from ml.interfaces import SonarImage, ReferencePostProcessor  # noqa: E402
from ml.survey import attach_track                           # noqa: E402
from ml.report import build_report, write_json, write_csv    # noqa: E402

WEIGHTS = {
    SIDESCAN: HERE / "weights" / "sidescan_v1.pt",
    FLS: HERE / "weights" / "debris_fls_v1.pt",
}
OUT = HERE / "out"
LABEL = {
    SIDESCAN: "side-scan  (wrecks, aircraft, large anomalies)",
    FLS: "forward-looking  (tyre, bottle, can, chain, hook...)",
}


def _before_after(original: Path, annotated: Path, out: Path, n: int) -> Path:
    """Raw image on the left, detections on the right, labelled."""
    from PIL import Image, ImageDraw

    a = Image.open(original).convert("RGB")
    b = Image.open(annotated).convert("RGB")
    h = 620
    a = a.resize((int(a.width * h / a.height), h))
    b = b.resize((int(b.width * h / b.height), h))

    pad, bar = 16, 46
    W = a.width + b.width + pad * 3
    canvas = Image.new("RGB", (W, h + bar + pad * 2), "#111318")
    canvas.paste(a, (pad, bar + pad))
    canvas.paste(b, (pad * 2 + a.width, bar + pad))

    d = ImageDraw.Draw(canvas)
    d.text((pad + 4, 16), "RAW SONAR", fill="#8b93a7")
    label = f"DETECTED  ({n} anomal{'y' if n == 1 else 'ies'})"
    d.text((pad * 2 + a.width + 4, 16), label, fill="#4ade80" if n else "#8b93a7")
    canvas.save(out, quality=92)
    return out


def load_models():
    from ultralytics import YOLO
    models = {k: YOLO(str(v)) for k, v in WEIGHTS.items()}
    return models


def process(image_path: Path, models, conf: float, sensor_override=None,
            survey="DEMO-LINE-01", quiet=False, show=True) -> dict:
    import numpy as np
    from PIL import Image

    arr = np.array(Image.open(image_path).convert("L"), dtype=np.uint8)

    # --- 1. route ---------------------------------------------------------
    routing = detect_sensor(arr)
    sensor = sensor_override or routing.sensor

    # --- 2. detect --------------------------------------------------------
    t0 = time.perf_counter()
    r = models[sensor].predict(str(image_path), conf=conf, verbose=False)[0]
    infer_ms = (time.perf_counter() - t0) * 1000

    detections = []
    for b in r.boxes:
        x1, y1, x2, y2 = [float(v) for v in b.xyxy[0]]
        detections.append({
            "class": r.names[int(b.cls)],
            "confidence": round(float(b.conf), 4),
            "bbox": [x1, y1, x2 - x1, y2 - y1],
        })

    # --- 3. geo-reference -------------------------------------------------
    # Only side-scan. The geo-referencing model offsets perpendicular to a tow
    # path using across-track ground range - that is side-scan geometry.
    # Forward-looking sonar images a fan: range along the beam, bearing across
    # it. Feeding FLS pixels through the side-scan model produces confident
    # nonsense (a 38 m tyre), so FLS detections stay ungeotagged until the fan
    # projection is implemented.
    sonar = SonarImage(image=arr, image_id=image_path.stem)
    geo_applicable = sensor == SIDESCAN
    if geo_applicable:
        attach_track(sonar)
        detections = ReferencePostProcessor().georeference(detections, sonar)

    result = {
        "image_id": sonar.image_id,
        "width": sonar.width,
        "height": sonar.height,
        "processing_ms": int(infer_ms),
        "detections": detections,
        "overlay_path": None,
    }

    # --- 4. report --------------------------------------------------------
    nav_source = ("SIMULATED survey track (no raw XTF available)"
                  if geo_applicable else
                  "not geotagged - forward-looking fan projection not implemented")
    report = build_report(
        result, survey_name=survey,
        navigation_source=nav_source,
        model_version=WEIGHTS[sensor].name,
    )

    OUT.mkdir(exist_ok=True)
    stem = f"report_{sonar.image_id}"
    write_json(report, OUT / f"{stem}.json")
    write_csv(report, OUT / f"{stem}.csv")
    r.save(filename=str(OUT / f"{stem}.jpg"))

    # Side-by-side: the raw sonar an analyst would scroll past, next to what
    # the system found in it. This is the comparison that makes the point.
    _before_after(image_path, OUT / f"{stem}.jpg", OUT / f"{stem}_compare.jpg",
                  len(detections))

    if not quiet:
        print(f"  image    {image_path.name}   {sonar.width} x {sonar.height} px")
        print(f"  sensor   {LABEL[sensor]}"
              + ("   [manual override]" if sensor_override else ""))
        print(f"           {routing.reason}")
        if geo_applicable:
            print(f"  swath    {sonar.meta['swath_m']} m across track")
        else:
            print(f"  geo      not applied - fan projection not implemented for FLS")
        print(f"  time     {infer_ms:.0f} ms")
        print()
        if not detections:
            print("  no anomalies above threshold")
        else:
            print(f"  {len(detections)} anomaly(ies), "
                  f"{report['summary']['geotagged']} geotagged:")
            if geo_applicable:
                print(f"    {'CLASS':<16}{'CONF':>7}{'LATITUDE':>13}"
                      f"{'LONGITUDE':>13}{'LEN(m)':>9}")
                for a in report["anomalies"]:
                    print(f"    {a['classification']:<16}{a['confidence_pct']:>6.1f}%"
                          f"{a['latitude']:>13.6f}{a['longitude']:>13.6f}"
                          f"{a['dimensions_m']['length']:>9.2f}")
            else:
                print(f"    {'CLASS':<16}{'CONF':>7}   {'BBOX (px)':<24}")
                for a in report["anomalies"]:
                    b = a["bbox_pixels"]
                    print(f"    {a['classification']:<16}{a['confidence_pct']:>6.1f}%"
                          f"   {b['x']},{b['y']} {b['width']}x{b['height']}")
        print()
        print(f"  wrote {stem}.json / .csv / .jpg / _compare.jpg")

    if show:
        import os
        os.startfile(OUT / f"{stem}_compare.jpg")
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description="SIH PS57 sonar anomaly pipeline")
    ap.add_argument("image", nargs="?")
    ap.add_argument("--sensor", choices=[SIDESCAN, FLS], default=None,
                    help="override automatic sensor routing")
    ap.add_argument("--conf", type=float, default=0.25)
    ap.add_argument("--survey", default="DEMO-LINE-01")
    ap.add_argument("--live", action="store_true",
                    help="keep models loaded and process image after image")
    args = ap.parse_args()

    for s, p in WEIGHTS.items():
        if not p.exists():
            print(f"Missing model: {p}")
            return 1

    print("loading models ...")
    models = load_models()
    pool = sorted(HERE.glob("samples/*.png")) + sorted(HERE.glob("samples/*.jpg"))
    if pool:
        for m in models.values():
            m.predict(str(pool[0]), verbose=False)   # warm both
    print("ready\n")

    if not args.live:
        image = Path(args.image) if args.image else random.choice(pool)
        if not image.exists():
            print(f"No such image: {image}")
            return 1
        process(image, models, args.conf, args.sensor, args.survey)
        return 0

    print("  ENTER      random image      <path>   specific image      q   quit\n")
    while True:
        try:
            line = input("> ").strip().strip('"')
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if line.lower() in {"q", "quit", "exit"}:
            return 0
        image = Path(line) if line else random.choice(pool)
        if not image.exists():
            print(f"  no such file: {image}\n")
            continue
        process(image, models, args.conf, args.sensor, args.survey)
        print()


if __name__ == "__main__":
    sys.exit(main())
