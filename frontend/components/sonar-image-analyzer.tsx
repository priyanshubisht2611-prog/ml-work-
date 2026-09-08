'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Upload,
  ImageIcon,
  ScanLine,
  RotateCcw,
  ShieldAlert,
  Compass,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  Play,
  Activity,
  Maximize2,
  Minimize2,
  Crosshair,
  Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'

export interface AnalysisDetection {
  id: string
  code: string
  label: string
  confidence: number
  threat: 'high' | 'medium' | 'low'
  estimatedRange: number
  estimatedDepth: number
  dimensions: string
  box: { x: number; y: number; w: number; h: number }
  description: string
  recommendation: string
}

const MOCK_ANALYSIS_RESULTS: AnalysisDetection[] = [
  {
    id: 'det-1',
    code: 'OBJ-9634',
    label: 'Metallic Ordnance (Naval Mine)',
    confidence: 0.963,
    threat: 'high',
    estimatedRange: 38.4,
    estimatedDepth: 42.6,
    dimensions: '2.4m × 0.8m × 0.6m',
    box: { x: 54, y: 44, w: 26, h: 30 },
    description:
      'Specular metallic cylindrical structure exhibiting strong specular reflection and characteristic acoustic shadow signature consistent with naval mine payload.',
    recommendation: 'Flag for immediate AUV EOD survey. Maintain 500m standoff buffer.',
  },
  {
    id: 'det-2',
    code: 'OBJ-8120',
    label: 'Debris Cluster (Vessel Ballast)',
    confidence: 0.812,
    threat: 'medium',
    estimatedRange: 44.2,
    estimatedDepth: 48.1,
    dimensions: '4.1m × 3.2m × 1.1m',
    box: { x: 16, y: 60, w: 20, h: 22 },
    description:
      'Fragmented structural frame with irregular scattering geometry. High probability of vessel ballast or shipping container wreckage.',
    recommendation: 'Log location for environmental survey team. Low explosive hazard.',
  },
]

const threatStyles: Record<AnalysisDetection['threat'], { text: string; ring: string; box: string; badge: string }> = {
  high: {
    text: 'text-destructive',
    ring: 'ring-destructive/40',
    box: 'border-destructive glow-destructive bg-destructive/10',
    badge: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  medium: {
    text: 'text-primary',
    ring: 'ring-primary/40',
    box: 'border-primary glow-cyan bg-primary/10',
    badge: 'bg-primary/20 text-primary border-primary/30',
  },
  low: {
    text: 'text-accent',
    ring: 'ring-accent/40',
    box: 'border-accent bg-accent/10',
    badge: 'bg-accent/20 text-accent border-accent/30',
  },
}

function playScanSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    // Restricted
  }
}

export function SonarImageAnalyzer() {
  const [file, setFile] = useState<{ src: string; name: string; sizeMb: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [selectedDetection, setSelectedDetection] = useState<AnalysisDetection | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File | undefined) => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return
    const url = URL.createObjectURL(selectedFile)
    const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2)
    setFile({ src: url, name: selectedFile.name, sizeMb: `${sizeMb} MB` })
    setHasAnalyzed(false)
    setSelectedDetection(null)
    setProgress(0)
  }

  const handleLoadSample = () => {
    setFile({
      src: '/sonar-seabed.png',
      name: 'survey_seabed_tile_04.png',
      sizeMb: '1.82 MB',
    })
    setHasAnalyzed(false)
    setSelectedDetection(null)
    setProgress(0)
  }

  const handleStartAnalysis = () => {
    if (!file || isAnalyzing) return
    setIsAnalyzing(true)
    setProgress(0)
    playScanSound()

    let p = 0
    const interval = setInterval(() => {
      p += 15
      if (p <= 100) {
        setProgress(p)
      } else {
        clearInterval(interval)
        setIsAnalyzing(false)
        setHasAnalyzed(true)
        setSelectedDetection(MOCK_ANALYSIS_RESULTS[0])
        playScanSound()
      }
    }, 280)
  }

  const handleReset = () => {
    setFile(null)
    setIsAnalyzing(false)
    setHasAnalyzed(false)
    setSelectedDetection(null)
    setProgress(0)
    setZoomLevel(1)
  }

  return (
    <div className="space-y-6">
      {/* Upload & Analysis Viewport Section */}
      <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-primary font-bold">
              <Sparkles className="size-4 animate-pulse" /> HIGH-FREQUENCY SIDE-SCAN FRAME PROCESSOR
            </span>
            <h3 className="mt-1 text-lg font-bold">Sonar Image Analysis Workspace</h3>
          </div>

          {file && (
            <div className="flex items-center gap-2 font-mono text-xs">
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="size-3.5" />
                Upload New Image
              </Button>
            </div>
          )}
        </div>

        {/* Drag & Drop Upload Zone */}
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFileSelect(e.dataTransfer.files?.[0])
            }}
            className={`flex aspect-[21/9] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
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
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 glow-cyan">
              <Upload className="size-7 text-primary" />
            </span>

            <p className="mt-4 font-bold text-lg text-foreground">Drag & Drop Sonar Image Here</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Or click to browse from local drive (.PNG, .JPG, .TIFF up to 25MB)
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" variant="secondary" onClick={handleLoadSample} className="gap-2 text-xs">
                <ImageIcon className="size-4 text-primary" />
                Load Sample Survey Scan #04
              </Button>
            </div>
          </label>
        ) : (
          /* Uploaded File Details & Actions Card */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm leading-tight">{file.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Size: {file.sizeMb} · Dimensions: 1024×1024 px · Format: Side-Scan Tile
                  </p>
                </div>
              </div>

              {!hasAnalyzed && (
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  size="lg"
                  className="gap-2 font-bold text-xs glow-cyan"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="size-4 animate-spin text-primary-foreground" />
                      Analyzing Image ({progress}%)…
                    </>
                  ) : (
                    <>
                      <Play className="size-4 fill-current" />
                      Analyze Sonar Image
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Analysis Progress Bar */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-primary">
                  <span className="flex items-center gap-1.5">
                    <ScanLine className="size-3.5 animate-spin" />
                    Executing Deep Convolutional Object Inference…
                  </span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post-Analysis Split View Display */}
      {hasAnalyzed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-6 lg:grid-cols-12"
        >
          {/* Left: Interactive Image Viewport with Bounding Overlays (7 Columns) */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-3 font-mono text-xs">
                <span className="flex items-center gap-2 font-bold text-primary">
                  <Crosshair className="size-4 text-primary animate-pulse" />
                  Localised Object Bounding Box Viewport
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : zoomLevel === 1.5 ? 2 : 1)}
                    className="flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-foreground border border-border hover:bg-black/90 transition"
                  >
                    {zoomLevel > 1 ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    {zoomLevel}x
                  </button>
                </div>
              </div>

              <div className="relative aspect-[16/9] flex-1 overflow-hidden rounded-xl bg-black border border-border/80 cursor-crosshair select-none">
                <div
                  className="h-full w-full transition-transform duration-300 sonar-filter-raw"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <Image
                    src={file?.src || '/sonar-seabed.png'}
                    alt="Analyzed Sonar Viewport"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Detected Bounding Box Overlays */}
                {MOCK_ANALYSIS_RESULTS.map((det) => {
                  const style = threatStyles[det.threat]
                  const isSelected = selectedDetection?.id === det.id

                  return (
                    <motion.div
                      key={det.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: isSelected ? 1.05 : 1, opacity: 1 }}
                      onClick={() => setSelectedDetection(det)}
                      className={`absolute cursor-pointer rounded-lg border-2 ${style.box} transition-all ${
                        isSelected ? 'ring-4 ring-cyan-400 border-primary scale-[1.05] z-30 glow-cyan' : 'hover:scale-[1.03] hover:z-20'
                      }`}
                      style={{
                        left: `${det.box.x}%`,
                        top: `${det.box.y}%`,
                        width: `${det.box.w}%`,
                        height: `${det.box.h}%`,
                      }}
                    >
                      <span
                        className={`absolute -top-7 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                          isSelected ? 'bg-cyan-400 text-black shadow-lg ring-2 ring-cyan-300' : `bg-black/90 ${style.text}`
                        } backdrop-blur shadow-md`}
                      >
                        <span className="size-2 rounded-full bg-primary animate-ping" />
                        {det.label} {(det.confidence * 100).toFixed(0)}%
                      </span>
                    </motion.div>
                  )
                })}

                {/* Scale HUD overlay */}
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 font-mono text-[10px] text-cyan-400 bg-black/80 px-3 py-1.5 rounded-lg border border-primary/30 backdrop-blur">
                  <span>SCALE: 1024×1024</span>
                  <span>CONFIDENCE: {(MOCK_ANALYSIS_RESULTS[0].confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Telemetry & Object Breakdown (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="size-4 text-primary" />
                  <span>Detection Results Telemetry</span>
                </div>

                <span className="rounded bg-primary/15 px-2.5 py-0.5 font-mono text-xs text-primary font-bold">
                  {MOCK_ANALYSIS_RESULTS.length} OBJECTS FOUND
                </span>
              </div>

              {/* Target Selector Tabs */}
              <div className="flex gap-2">
                {MOCK_ANALYSIS_RESULTS.map((det) => (
                  <button
                    key={det.id}
                    onClick={() => setSelectedDetection(det)}
                    className={`flex-1 rounded-lg border px-3 py-2 font-mono text-xs transition text-left ${
                      selectedDetection?.id === det.id
                        ? 'border-primary bg-primary/15 font-bold text-primary shadow'
                        : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="truncate font-bold">{det.code}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{det.label}</div>
                  </button>
                ))}
              </div>

              {selectedDetection && (
                <div className="space-y-4 flex-1">
                  {/* Primary Threat Card */}
                  <div
                    className={`rounded-xl border p-4 ${
                      threatStyles[selectedDetection.threat].box
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                          CLASSIFICATION MATCH
                        </span>
                        <h3 className="mt-1 text-xl font-bold text-foreground">
                          {selectedDetection.label}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase border ${
                          threatStyles[selectedDetection.threat].badge
                        }`}
                      >
                        {selectedDetection.threat} priority
                      </span>
                    </div>
                  </div>

                  {/* 4 Metric Key-Value Grid */}
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase block">Confidence Score</span>
                      <strong className="mt-1 text-lg font-bold text-primary block">
                        {(selectedDetection.confidence * 100).toFixed(1)}%
                      </strong>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase block">Estimated Range</span>
                      <strong className="mt-1 text-lg font-bold text-cyan-400 block">
                        {selectedDetection.estimatedRange} m
                      </strong>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase block">Estimated Depth</span>
                      <strong className="mt-1 text-lg font-bold text-foreground block">
                        {selectedDetection.estimatedDepth} m
                      </strong>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase block">Dimensions</span>
                      <strong className="mt-1 text-xs font-bold text-foreground block truncate">
                        {selectedDetection.dimensions}
                      </strong>
                    </div>
                  </div>

                  {/* Assessment Description */}
                  <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 space-y-2 font-mono text-xs">
                    <h4 className="font-bold text-primary uppercase text-[11px]">AI Feature Summary</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedDetection.description}
                    </p>
                    <div className="border-t border-border/40 pt-2 text-amber-400 font-semibold">
                      Action: {selectedDetection.recommendation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
