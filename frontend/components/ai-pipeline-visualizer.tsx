'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Waves,
  Sliders,
  Cpu,
  ScanSearch,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
  Compass,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Activity,
  FileBarChart,
  FileCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'

export interface PipelineStage {
  id: number
  name: string
  shortDesc: string
  icon: typeof Waves
  latencyMs: number
  confidencePct: number
  status: 'idle' | 'processing' | 'complete'
}

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: 1,
    name: 'Sonar Input',
    shortDesc: 'Acoustic matrix ingestion',
    icon: Waves,
    latencyMs: 4,
    confidencePct: 99.8,
    status: 'complete',
  },
  {
    id: 2,
    name: 'Preprocessing',
    shortDesc: 'Speckle denoising & slant correction',
    icon: Sliders,
    latencyMs: 8,
    confidencePct: 98.4,
    status: 'complete',
  },
  {
    id: 3,
    name: 'Feature Extraction',
    shortDesc: 'Convolutional bathymetric maps',
    icon: Cpu,
    latencyMs: 11,
    confidencePct: 97.2,
    status: 'complete',
  },
  {
    id: 4,
    name: 'AI Detection',
    shortDesc: 'Regional proposal box regression',
    icon: ScanSearch,
    latencyMs: 9,
    confidencePct: 96.3,
    status: 'complete',
  },
  {
    id: 5,
    name: 'Classification',
    shortDesc: 'Temperature-calibrated softmax',
    icon: FileBarChart,
    latencyMs: 4,
    confidencePct: 96.3,
    status: 'complete',
  },
  {
    id: 6,
    name: 'Final Result',
    shortDesc: 'Calibrated threat telemetry',
    icon: FileCheck,
    latencyMs: 36,
    confidencePct: 96.3,
    status: 'complete',
  },
]

// Audio ping helper
function playPipelineStepPing(freq = 1200) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq / 1.6, ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.24)
  } catch (e) {
    // Restricted
  }
}

export function AiPipelineVisualizer() {
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeStageId, setActiveStageId] = useState<number>(6)
  const [selectedObjectIdx, setSelectedObjectIdx] = useState<number>(0)

  const detectedObjects = [
    {
      code: 'OBJ-9634',
      label: 'Metallic Ordnance',
      confidence: 96.3,
      threat: 'high' as const,
      estimatedRange: 38.4,
      estimatedDepth: 42.6,
      dimensions: '2.4m × 0.8m × 0.6m',
      box: { x: 54, y: 44, w: 26, h: 30 },
      description: 'Specular metallic cylinder showing signature acoustic shadow of naval mine.',
      recommendation: 'Flag for immediate AUV EOD survey. 500m standoff buffer required.',
    },
    {
      code: 'OBJ-8120',
      label: 'Debris Cluster',
      confidence: 81.2,
      threat: 'medium' as const,
      estimatedRange: 44.2,
      estimatedDepth: 48.1,
      dimensions: '4.1m × 3.2m × 1.1m',
      box: { x: 16, y: 60, w: 20, h: 22 },
      description: 'Fragmented structural debris frame with irregular backscatter geometry.',
      recommendation: 'Log location for environmental survey team. Low explosive hazard.',
    },
  ]

  const currentResult = detectedObjects[selectedObjectIdx] || detectedObjects[0]

  const handleRunAnalysis = () => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setActiveStageId(1)

    // Reset all stages to idle
    setStages((prev) => prev.map((s) => ({ ...s, status: s.id === 1 ? 'processing' : 'idle' })))
    playPipelineStepPing(900)

    // Step through each stage sequentially
    let step = 1
    const interval = setInterval(() => {
      step++
      if (step <= 6) {
        setActiveStageId(step)
        playPipelineStepPing(900 + step * 100)
        setStages((prev) =>
          prev.map((s) => {
            if (s.id < step) return { ...s, status: 'complete' }
            if (s.id === step) return { ...s, status: 'processing' }
            return { ...s, status: 'idle' }
          }),
        )
      } else {
        clearInterval(interval)
        playPipelineStepPing(1600)
        setStages((prev) => prev.map((s) => ({ ...s, status: 'complete' })))
        setActiveStageId(6)
        setIsAnalyzing(false)
      }
    }, 450)
  }

  const totalLatencyMs = stages.reduce((acc, s) => acc + s.latencyMs, 0)

  return (
    <div className="space-y-8">
      {/* Interactive Stage Pipeline Header */}
      <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-primary font-bold">
              <Activity className="size-4 animate-pulse" /> SEAFLEET-NET DEEP PIPELINE DIAGRAM
            </span>
            <h3 className="mt-1 text-lg font-bold">Convolutional Neural Network Execution Graph</h3>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="rounded-md bg-secondary/80 px-3 py-1 text-muted-foreground">
              Total Latency: <strong className="text-emerald-400">{totalLatencyMs} ms</strong>
            </span>

            <Button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="gap-2 text-xs font-semibold glow-cyan"
            >
              {isAnalyzing ? (
                <>
                  <RotateCcw className="size-3.5 animate-spin" />
                  Executing Pipeline ({activeStageId}/6)…
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  Run AI Pipeline Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 6 Visual Pipeline Nodes Flow */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 relative">
          {stages.map((stage, idx) => {
            const Icon = stage.icon
            const isProcessing = stage.status === 'processing'
            const isComplete = stage.status === 'complete'
            const isCurrentActive = activeStageId === stage.id

            return (
              <div key={stage.id} className="relative flex flex-col">
                {/* Node Box */}
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`relative flex flex-col justify-between h-full rounded-xl border p-3.5 transition-all ${
                    isCurrentActive
                      ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-lg glow-cyan scale-[1.03]'
                      : isComplete
                      ? 'border-border/80 bg-background/60'
                      : 'border-border/40 bg-background/20 opacity-60'
                  }`}
                >
                  {/* Status Badge Top */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">
                      STAGE 0{stage.id}
                    </span>

                    {isProcessing ? (
                      <span className="flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-primary animate-pulse">
                        <Activity className="size-2.5 animate-spin" /> RUNNING
                      </span>
                    ) : isComplete ? (
                      <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400">
                        <CheckCircle2 className="size-2.5" /> OK
                      </span>
                    ) : (
                      <span className="rounded bg-secondary px-1.5 py-0.2 font-mono text-[9px] text-muted-foreground">
                        IDLE
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="my-3 flex items-center gap-2.5">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        isCurrentActive
                          ? 'bg-primary text-primary-foreground shadow'
                          : isComplete
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold leading-tight truncate">{stage.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                        {stage.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[10px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="size-2.5 text-primary" /> {stage.latencyMs}ms
                    </span>
                    <span className="text-cyan-400 font-bold">{stage.confidencePct}%</span>
                  </div>
                </motion.div>

                {/* Animated Connecting Pulse Line to Next Node */}
                {idx < stages.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <motion.div
                      animate={{
                        x: [0, 4, 0],
                        opacity: isCurrentActive ? [0.6, 1, 0.6] : 0.4,
                      }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <ArrowRight className={`size-4 ${isCurrentActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    </motion.div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Split View Section: Left Sonar Preview + Right AI Analysis Results */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Sonar Image Preview (6 Columns) */}
        <div className="lg:col-span-6">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                <Sparkles className="size-4 text-primary" />
                <span>Side-Scan Sonar Telemetry Tile</span>
              </div>

              <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/30">
                FRAME: SEAFLEET-409
              </span>
            </div>

            <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-xl bg-black border border-border/80 select-none">
              <Image
                src="/sonar-seabed.png"
                alt="Sonar Processing Input"
                fill
                unoptimized
                className="object-cover sonar-filter-raw"
              />

              {/* Scanning sweep beam overlay during analysis */}
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-primary/10" />
                  <div className="sonar-scanline absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-primary/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md bg-black/80 px-3 py-1.5 font-mono text-xs text-primary backdrop-blur border border-primary/40">
                    <Activity className="size-4 animate-spin text-primary" />
                    Neural Feature Map Generation…
                  </div>
                </div>
              )}

              {/* Highlighted Bounding Box overlay */}
              <AnimatePresence>
                {!isAnalyzing && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute cursor-pointer rounded-lg border-2 border-destructive glow-destructive bg-destructive/10"
                    style={{
                      left: `${currentResult.box.x}%`,
                      top: `${currentResult.box.y}%`,
                      width: `${currentResult.box.w}%`,
                      height: `${currentResult.box.h}%`,
                    }}
                  >
                    <span className="absolute -top-7 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 font-mono text-[11px] font-bold text-destructive ring-1 ring-destructive/40 shadow-md backdrop-blur">
                      <span className="size-2 rounded-full bg-destructive animate-ping" />
                      {currentResult.label} {currentResult.confidence}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scale Markers */}
              <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-3 font-mono text-[10px] text-cyan-400/80 bg-black/70 px-2.5 py-1 rounded border border-primary/20">
                <span>SEABED DEPTH: {currentResult.estimatedDepth}m</span>
                <span>RANGE: {currentResult.estimatedRange}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Analysis Results Telemetry Panel (6 Columns) */}
        <div className="lg:col-span-6">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileCheck className="size-4 text-primary" />
                <span>AI Automated Analysis Results</span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                {detectedObjects.map((obj, oIdx) => (
                  <button
                    key={obj.code}
                    onClick={() => setSelectedObjectIdx(oIdx)}
                    className={`rounded px-2.5 py-1 text-[10px] font-bold transition ${
                      selectedObjectIdx === oIdx
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {obj.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed AI Telemetry Metrics Card */}
            <div className="mt-4 flex-1 space-y-4">
              {/* Top Result Header */}
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 glow-destructive">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-destructive uppercase">
                      ID: {currentResult.code} · HIGH HAZARD CLASSIFICATION
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-foreground tracking-tight">
                      {currentResult.label}
                    </h3>
                  </div>

                  <span className="rounded-full bg-destructive/20 border border-destructive/40 px-3 py-1 font-mono text-xs font-bold text-destructive">
                    {currentResult.threat.toUpperCase()} THREAT
                  </span>
                </div>
              </div>

              {/* 4 Metric Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Confidence Score</span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-primary">
                    {currentResult.confidence}%
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Estimated Range</span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-cyan-400">
                    {currentResult.estimatedRange} m
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Estimated Depth</span>
                  <div className="mt-1 font-mono text-xl font-extrabold text-foreground">
                    {currentResult.estimatedDepth} m
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Dimensions</span>
                  <div className="mt-1 font-mono text-sm font-extrabold text-foreground truncate">
                    {currentResult.dimensions}
                  </div>
                </div>
              </div>

              {/* Description & Recommendations */}
              <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase text-primary">
                    Neural Feature Assessment
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {currentResult.description}
                  </p>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <h4 className="font-mono text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5" /> Recommended Operational Action
                  </h4>
                  <p className="mt-1 text-xs text-foreground leading-relaxed font-mono">
                    {currentResult.recommendation}
                  </p>
                </div>
              </div>

              {/* Bottom Metadata Bar */}
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-3.5 py-2.5 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Compass className="size-3.5 text-primary" /> COORDS: 24°18'42.1" N, 78°31'10.4" W
                </span>
                <span className="text-cyan-400">LATENCY: 36ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
