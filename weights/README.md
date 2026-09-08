# Trained weights

Two detection heads, both side-scan sonar, detecting different things. They run
together in `pipeline.py` and their detections merge into one report.

| File | Detects | Trained on | mAP50 | mAP50-95 | Precision | Recall |
|---|---|---|---|---|---|---|
| `sidescan_v1.pt` | shipwrecks, submerged aircraft | SCTD, 357 images | 0.625 | 0.386 | 0.923 | 0.491 |
| `ghostgear_v1.pt` | derelict crab pots | Ghost Pot SSS, 6,674 images | 0.310 | 0.116 | 0.293 | 0.457 |

Both figures are on held-out test splits. ONNX exports sit alongside each.

## How they were trained

    yolov8s.pt        COCO photographs      how to see at all
        |
        v
    stage 1           Marine Debris FLS     what debris looks like in sonar
        |             (forward-looking)
        v
    stage 2           SCTD                  side-scan geometry
        |             -> sidescan_v1
        v
    stage 3           Ghost Pot SSS         derelict fishing gear
                      -> ghostgear_v1

Stage 1 used forward-looking sonar because that is where annotated small-debris
data exists. Its weights are not kept here - it is a pretraining step, not a
deliverable, and its own numbers are not meaningful for this problem (water-tank
imagery, with the same physical objects appearing across splits).

## Reading the numbers

**`sidescan_v1`** is the stronger model but on an easier target: a wreck fills a
large part of the frame. Its test split is only 39 images, so per-class figures
are indicative rather than precise.

**`ghostgear_v1`** is the harder and more relevant problem. A crab pot is median
23x24 px, 60% of targets are under 32 px, the imagery is consumer-grade
Humminbird sonar, and the test split is a survey recording the model never saw.
0.310 mAP50 reflects that difficulty honestly.

Its precision and recall trade sharply with the confidence threshold. Measured
on the test split:

| conf | precision | recall | F1 |
|---|---|---|---|
| 0.10 | 0.229 | 0.661 | 0.341 |
| 0.15 | 0.307 | 0.459 | 0.367 |
| 0.20 | 0.416 | 0.330 | 0.368 |
| 0.25 | 0.500 | 0.213 | 0.299 |
| 0.30 | 0.595 | 0.138 | 0.223 |

The pipeline runs it at 0.20, the best-F1 point. For a screening tool that
surfaces candidates for an analyst rather than replacing one, 0.10 is a
defensible alternative: it finds two thirds of pots at the cost of roughly three
false positives per true one.

## What was tried and did not work

Retraining ghost gear at 1280px scored **worse** - mAP50 0.248 against 0.310.
The source images are already 640x640, so doubling the input only upscaled them,
adding interpolation blur rather than detail, and forced the batch from 16 to 8.
Resolution is not the bottleneck; object size in the source imagery is.

## Relation to the problem statement

PS 57 asks for detection of man-made objects "including shipwrecks, pipes,
cylinders, and entangled debris nets" in side-scan sonar, and opens on ghost
fishing gear specifically.

`sidescan_v1` covers the shipwrecks; `ghostgear_v1` covers derelict fishing
gear. Both are on the sensor the problem statement names.

The PS also asks for efficient operation on edge devices without cloud
dependency. Both models run on CPU at roughly 150-250 ms per 640x640 image with
no GPU, and both ship as ONNX.

## Known limitations

- `ghostgear_v1` is uncertain everywhere: no detection on the test split exceeds
  0.5 confidence. It is a screening tool, not an authority.
- Neither model has been tested on Indian coastal waters. Ghost Pot is Delaware
  bays; SCTD is mixed provenance.
- The SCTD test split is 39 images. Treat `sidescan_v1`'s figures as indicative.
- Object size in metres is derived from the assumed sonar range. The pipeline's
  `--range` flag sets it; the wrong value reports a 1 m crab pot as 15 m.

## Data sources

- Ghost Pot Side-Scan Sonar Detection Dataset, PING Ecosystem.
  doi:10.57967/hf/8397, CC-BY-SA-4.0.
- SCTD (Sonar Common Target Detection), Zhang, Ning et al.
- Marine Debris FLS Datasets, Valdenegro-Toro et al., OCEANS 2025 (stage 1 only).
