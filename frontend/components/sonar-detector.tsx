'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Upload,
  ImageIcon,
  ScanLine,
  RotateCcw,
  CircleAlert,
  ShieldCheck,
  Anchor,
  Maximize2,
  Minimize2,
  Crosshair,
  Sparkles,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExtendedDetection, TargetInspector } from '@/components/target-inspector'
import { SpectrumFilter, ThreatFilter } from '@/components/tactical-controls'
import { motion, AnimatePresence } from 'motion/react'

type Status = 'idle' | 'scanning' | 'done'

const SAMPLE_IMAGE = '/sonar-seabed.png'

export const SAMPLE_DETECTIONS: ExtendedDetection[] = [
  {
    id: 'd1',
    label: 'Metallic Ordnance',
    confidence: 0.963,
    threat: 'high',
    box: { x: 54, y: 44, w: 26, h: 30 },
    dimensions: '2.4m × 0.8m × 0.6m',
    depthMeters: 42.6,
    reflectivityDb: 14.2,
    coordinates: "24°18'42.1\" N, 78°31'10.4\" W",
    description:
      'Dense metallic cylindrical structure exhibiting strong specular reflection and characteristic acoustic shadow signature consistent with naval mine payload.',
    recommendation: 'Flag for immediate AUV EOD survey. Maintain 500m standoff buffer.',
  },
  {
    id: 'd2',
    label: 'Debris Cluster',
    confidence: 0.812,
    threat: 'medium',
    box: { x: 16, y: 60, w: 20, h: 22 },
    dimensions: '4.1m × 3.2m × 1.1m',
    depthMeters: 48.1,
    reflectivityDb: 8.5,
    coordinates: "24°18'45.8\" N, 78°31'14.2\" W",
    description:
      'Fragmented structural frame with irregular scattering geometry. High probability of vessel ballast or shipping container wreckage.',
    recommendation: 'Log location for environmental survey team. Low explosive hazard.',
  },
  {
    id: 'd3',
    label: 'Submerged Cable Fault',
    confidence: 0.885,
    threat: 'medium',
    box: { x: 70, y: 20, w: 18, h: 18 },
    dimensions: '12.0m × 0.3m × 0.3m',
    depthMeters: 52.4,
    reflectivityDb: 11.4,
    coordinates: "24°18'51.2\" N, 78°31'04.8\" W",
    description:
      'Linear high-contrast acoustic boundary continuous across seabed tile with localized trench disturbance.',
    recommendation: 'Route inspection notice to submarine telecom operations center.',
  },
  {
    id: 'd4',
    label: 'Marine Life',
    confidence: 0.674,
    threat: 'low',
    box: { x: 30, y: 18, w: 16, h: 16 },
    dimensions: '1.8m × 0.6m × 0.4m',
    depthMeters: 34.2,
    reflectivityDb: 3.2,
    coordinates: "24°18'39.4\" N, 78°31'08.1\" W",
    description:
      'Dynamic acoustic target with diffuse backscatter profile matching swim bladder response of pelagic fauna.',
    recommendation: 'Non-hazardous biological target. No action required.',
  },
]

const threatStyles: Record<ExtendedDetection['threat'], { text: string; ring: string; box: string; dot: string; bg: string }> = {
  high: {
    text: 'text-destructive',
    ring: 'ring-destructive/40',
    box: 'border-destructive glow-destructive',
    dot: 'bg-destructive',
    bg: 'bg-destructive/10',
  },
  medium: {
    text: 'text-primary',
    ring: 'ring-primary/40',
    box: 'border-primary glow-cyan',
    dot: 'bg-primary',
    bg: 'bg-primary/10',
  },
  low: {
    text: 'text-accent',
    ring: 'ring-accent/40',
    box: 'border-accent',
    dot: 'bg-accent',
    bg: 'bg-accent/10',
  },
}

// Synthesize Hydro-Acoustic Ping Audio
function playSonarPingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // Frequency sweep from 1400Hz down to 800Hz
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.35)

    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.42)
  } catch (err) {
    // AudioContext blocked by user gesture policy
  }
}

interface SonarDetectorProps {
  spectrumFilter?: SpectrumFilter
  confidenceThreshold?: number
  threatFilter?: ThreatFilter
  audioEnabled?: boolean
  selectedTargetId?: string | null
  onSelectTargetId?: (id: string | null) => void
  onTargetsChange?: (targets: ExtendedDetection[]) => void
}

export function SonarDetector({
  spectrumFilter = 'raw',
  confidenceThreshold = 0.5,
  threatFilter = 'all',
  audioEnabled = true,
  selectedTargetId,
  onSelectTargetId,
  onTargetsChange,
}: SonarDetectorProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [allDetections, setAllDetections] = useState<ExtendedDetection[]>([])
  const [selectedTarget, setSelectedTarget] = useState<ExtendedDetection | null>(null)
  const [dragging, setDragging] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; lat: string; lng: string; depth: number } | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external selectedTargetId with internal state
  useEffect(() => {
    if (selectedTargetId) {
      const matched = allDetections.find((d) => d.id === selectedTargetId)
      if (matched) setSelectedTarget(matched)
    }
  }, [selectedTargetId, allDetections])

  const runScan = useCallback((src: string) => {
    setImageSrc(src)
    setStatus('scanning')
    setAllDetections([])
    if (audioEnabled) playSonarPingSound()

    window.setTimeout(() => {
      setAllDetections(SAMPLE_DETECTIONS)
      setStatus('done')
      if (onTargetsChange) onTargetsChange(SAMPLE_DETECTIONS)
      if (audioEnabled) playSonarPingSound()
    }, 2400)
  }, [audioEnabled, onTargetsChange])

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      runScan(url)
    },
    [runScan],
  )

  const reset = () => {
    setStatus('idle')
    setImageSrc(null)
    setAllDetections([])
    setSelectedTarget(null)
    if (onSelectTargetId) onSelectTargetId(null)
    setZoomLevel(1)
  }

  // Filter detections based on user threshold & threat selection
  const filteredDetections = allDetections.filter((d) => {
    if (d.confidence < confidenceThreshold) return false
    if (threatFilter !== 'all' && d.threat !== threatFilter) return false
    return true
  })

  const avgConfidence =
    filteredDetections.length > 0
      ? filteredDetections.reduce((a, d) => a + d.confidence, 0) / filteredDetections.length
      : 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

    const lat = (24 + (18 + y * 0.001)).toFixed(4)
    const lng = (78 + (31 + x * 0.001)).toFixed(4)
    const depth = +(30 + (y / 100) * 25).toFixed(1)

    setCursorCoords({ x, y, lat: `24°${lat}' N`, lng: `78°${lng}' W`, depth })
  }

  const handleAction = (targetId: string, action: 'flag' | 'safe') => {
    if (action === 'safe') {
      const updated = allDetections.filter((d) => d.id !== targetId)
      setAllDetections(updated)
      if (onTargetsChange) onTargetsChange(updated)
    }
    setSelectedTarget(null)
    if (onSelectTargetId) onSelectTargetId(null)
  }

  const handleTargetClick = (d: ExtendedDetection) => {
    setSelectedTarget(d)
    if (onSelectTargetId) onSelectTargetId(d.id)
    if (audioEnabled) playSonarPingSound()
  }

  return (
    <section id="detector" className="scroll-mt-20 py-8 md:py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            <Sparkles className="size-3.5" /> High-Resolution Acoustic Analytics
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Live Tactical Sonar Detector
          </h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            Analyze side-scan sonar returns in real time. Localize submerged hazards, measure physical dimensions, and inspect calibrated acoustic reflectivity profiles.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Main Viewport (8 Columns) */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-md">
              {!imageSrc ? (
                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    handleFile(e.dataTransfer.files?.[0])
                  }}
                  className={`flex aspect-[16/9] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                    dragging
                      ? 'border-primary bg-primary/15 scale-[0.99]'
                      : 'border-border/80 bg-background/50 hover:border-primary/60 hover:bg-primary/5'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 glow-cyan">
                    <Upload className="size-6 text-primary" />
                  </span>
                  <p className="mt-4 font-semibold text-base">Drop Sonar Frame File</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports high-frequency side-scan imagery (.PNG, .JPG, .TIFF up to 20MB)
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={(e) => {
                        e.preventDefault()
                        runScan(SAMPLE_IMAGE)
                      }}
                    >
                      <ImageIcon className="size-4" />
                      Load Survey Sample #04
                    </Button>
                  </div>
                </label>
              ) : (
                <div
                  ref={containerRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setCursorCoords(null)}
                  className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black border border-border/80 cursor-crosshair select-none"
                >
                  {/* Sonar Frame Image with Multi-Spectrum Filter Class */}
                  <div
                    className={`h-full w-full transition-transform duration-300 ${
                      spectrumFilter === 'bathymetric'
                        ? 'sonar-filter-bathymetric'
                        : spectrumFilter === 'shadow'
                        ? 'sonar-filter-shadow'
                        : spectrumFilter === 'thermal'
                        ? 'sonar-filter-thermal'
                        : 'sonar-filter-raw'
                    }`}
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <Image
                      src={imageSrc}
                      alt="Side-Scan Sonar Telemetry"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  {/* Scanning Scanline animation */}
                  {status === 'scanning' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-primary/10" />
                      <div className="sonar-scanline absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-background/90 px-3 py-1.5 font-mono text-xs text-primary backdrop-blur border border-primary/30">
                        <ScanLine className="size-4 animate-spin text-primary" />
                        Executing Convolutional Acoustic Inference…
                      </div>
                    </div>
                  )}

                  {/* Mouse Crosshair Telemetry HUD Overlay */}
                  {cursorCoords && status === 'done' && (
                    <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg bg-black/80 px-3 py-1.5 font-mono text-[11px] text-cyan-400 backdrop-blur border border-primary/30">
                      <span className="flex items-center gap-1">
                        <Crosshair className="size-3 text-primary animate-pulse" />
                        LAT: {cursorCoords.lat}
                      </span>
                      <span>LNG: {cursorCoords.lng}</span>
                      <span className="text-foreground">DEPTH: {cursorCoords.depth}m</span>
                    </div>
                  )}

                  {/* Top Control Overlay: Zoom & Filter Status */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <span className="rounded bg-black/70 px-2.5 py-1 font-mono text-[10px] uppercase text-cyan-300 backdrop-blur border border-cyan-500/30">
                      Filter: {spectrumFilter}
                    </span>

                    <button
                      onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : zoomLevel === 1.5 ? 2 : 1)}
                      className="flex items-center gap-1 rounded bg-black/70 px-2 py-1 font-mono text-xs text-foreground backdrop-blur border border-border hover:bg-black/90 transition"
                      title="Toggle Zoom"
                    >
                      {zoomLevel > 1 ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                      {zoomLevel}x
                    </button>
                  </div>

                  {/* Interactive Bounding Box Overlays */}
                  <AnimatePresence>
                    {status === 'done' &&
                      filteredDetections.map((d) => {
                        const s = threatStyles[d.threat]
                        const isHighlighted = selectedTargetId === d.id || selectedTarget?.id === d.id

                        return (
                          <motion.div
                            key={d.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                              scale: isHighlighted ? 1.06 : 1,
                              opacity: 1,
                            }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => handleTargetClick(d)}
                            className={`absolute cursor-pointer rounded-lg border-2 ${s.box} transition-all ${
                              isHighlighted
                                ? 'ring-4 ring-cyan-400 border-primary scale-[1.06] z-30 glow-cyan'
                                : 'hover:scale-[1.03] hover:z-20'
                            }`}
                            style={{
                              left: `${d.box.x}%`,
                              top: `${d.box.y}%`,
                              width: `${d.box.w}%`,
                              height: `${d.box.h}%`,
                            }}
                          >
                            <span
                              className={`absolute -top-7 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                                isHighlighted
                                  ? 'bg-cyan-400 text-black shadow-lg ring-2 ring-cyan-300'
                                  : `bg-black/90 ${s.text} ring-1 ${s.ring}`
                              } backdrop-blur shadow-md`}
                            >
                              <span className={`size-2 rounded-full ${s.dot} animate-ping`} />
                              {d.label} {(d.confidence * 100).toFixed(0)}%
                            </span>
                          </motion.div>
                        )
                      })}
                  </AnimatePresence>
                </div>
              )}

              {/* Status bar */}
              {imageSrc && (
                <div className="mt-3 flex items-center justify-between px-1 font-mono text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                      {status === 'scanning'
                        ? 'PROCESSING HYDRO-ACOUSTIC ARRAY...'
                        : `${filteredDetections.length} TARGETS LOCKED (${allDetections.length} TOTAL)`}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={reset}>
                    <RotateCcw className="size-3.5" />
                    New Frame
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Side Results Telemetry Panel (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Target Telemetry Breakdown</span>
                </div>
                {status === 'done' && (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-xs text-primary ring-1 ring-primary/30 font-semibold">
                    {(avgConfidence * 100).toFixed(1)}% avg
                  </span>
                )}
              </div>

              {status === 'idle' && (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                  <Anchor className="size-10 text-muted-foreground/40" />
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    Awaiting sonar data input. Drop a side-scan tile or select survey sample #04 to execute detection model.
                  </p>
                </div>
              )}

              {status === 'scanning' && (
                <div className="mt-4 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl border border-border/60 bg-secondary/30"
                    />
                  ))}
                </div>
              )}

              {status === 'done' && (
                <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
                  <AnimatePresence mode="popLayout">
                    {filteredDetections.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-8 text-center font-mono text-xs text-muted-foreground"
                      >
                        No targets meet the selected confidence threshold ({(confidenceThreshold * 100).toFixed(0)}%).
                      </motion.div>
                    ) : (
                      filteredDetections.map((d) => {
                        const s = threatStyles[d.threat]
                        const isHighlighted = selectedTargetId === d.id || selectedTarget?.id === d.id

                        return (
                          <motion.div
                            key={d.id}
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleTargetClick(d)}
                            className={`group cursor-pointer rounded-xl border border-border/60 p-3 transition-all hover:border-primary/50 hover:bg-card/90 ${
                              isHighlighted
                                ? 'ring-2 ring-cyan-400 bg-primary/10 shadow-lg glow-cyan'
                                : 'bg-background/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.text}`}>
                                  <CircleAlert className="size-4" />
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold leading-tight group-hover:text-primary transition">
                                    {d.label}
                                  </h4>
                                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                    Depth: {d.depthMeters}m · {d.dimensions}
                                  </p>
                                </div>
                              </div>

                              <span className={`font-mono text-xs font-bold ${s.text}`}>
                                {(d.confidence * 100).toFixed(1)}%
                              </span>
                            </div>

                            {/* Confidence Progress Bar */}
                            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                className={`h-full rounded-full ${s.dot}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${d.confidence * 100}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                              <span className="capitalize">{d.threat} priority</span>
                              <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                                Inspect Details <Search className="size-3" />
                              </span>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Target Inspector Modal */}
      <TargetInspector
        target={selectedTarget}
        onClose={() => {
          setSelectedTarget(null)
          if (onSelectTargetId) onSelectTargetId(null)
        }}
        onAction={handleAction}
      />
    </section>
  )
}
