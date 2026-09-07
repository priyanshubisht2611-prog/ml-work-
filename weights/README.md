# Trained weights

Two models, produced by a staged transfer chain. They are not
interchangeable: they have different class heads.

| File | Classes | Trained on | Domain | mAP50 | mAP50-95 |
|---|---|---|---|---|---|
| `debris_fls_v1.pt` | 10 debris types | Marine Debris FLS | forward-looking, water tank | 0.988 | 0.808 |
| `sidescan_v1.pt` | aircraft, human, ship | SCTD | **real side-scan survey** | 0.625 | 0.386 |

## The chain

    yolov8s.pt (COCO)  ->  debris_fls_v1  ->  sidescan_v1  ->  [stage 3]
      how to see          debris in sonar    side-scan geometry   debris in side-scan

Stage 3 needs annotated side-scan debris imagery. No such dataset is public;
it is being labelled in-house.

## Reading the numbers

`debris_fls_v1`'s 0.988 is inflated. The Marine Debris FLS set is water-tank
footage of a fixed set of physical objects, so the same objects appear in
train and test and the background carries none of a real seabed's clutter.
It is not an estimate of open-water performance.

`sidescan_v1`'s 0.625 is the honest figure - real survey imagery, real
clutter. Precision 0.923, recall 0.491: the model is conservative, rarely
flagging something that is not there but missing roughly half of what is.
For a screening tool that surfaces candidates for an analyst, that is the
right trade, and the confidence threshold moves it either way.

Per-class AP50 tracks training-set size almost linearly - ship 0.817 with
191 boxes, aircraft 0.464 with 39, human 0.595 with 24. That relationship is
the empirical case for prioritising annotation over model changes.

Caveat: the SCTD test split is 39 images. Per-class figures are indicative,
not precise.

## Relation to the problem statement

PS 57 asks for detection of man-made objects "including shipwrecks, pipes,
cylinders, and entangled debris nets" in side-scan sonar, and states the
objective as separating natural seafloor topology from artificial anomalies.

`sidescan_v1` is the PS-compliant model: right sensor, and shipwrecks and
submerged aircraft are named object types. `debris_fls_v1` extends the same
pipeline to smaller debris classes, on the sensor where annotated small-debris
data actually exists.

The PS also asks for efficient operation on edge devices without cloud
dependency. Both models run on CPU at roughly 150 ms per 640x640 image with
no GPU, and both ship as ONNX.

## Limitations

- `debris_fls_v1` trained with zero background images, so it has no concept
  of empty seabed and will over-fire on real survey data.
- `sidescan_v1` cannot name debris types - its head was rebuilt for SCTD's
  three classes. It carries sonar features, not debris vocabulary.

## Inference

11-13 ms per image at 640x640 on a T4, so roughly 80 fps. Real-time is not
a constraint for this application.
