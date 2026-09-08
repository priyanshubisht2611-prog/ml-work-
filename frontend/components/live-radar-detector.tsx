'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Radar,
  Play,
  Pause,
  ShieldAlert,
  Compass,
  Activity,
  Radio,
  Crosshair,
  Volume2,
  VolumeX,
  Target,
  Maximize2,
  Minimize2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'

export interface RadarTarget {
  id: string
  code: string
  label: string
  threat: 'high' | 'medium' | 'low'
  confidence: number
  distanceMeters: number // 10 to 90m
  angleDeg: number // 0 to 360 deg
  depthMeters: number
  velocityKts: number
  headingDeg: number
  history: { x: number; y: number }[]
  lastPingTime: string
  description: string
}

const INITIAL_RADAR_TARGETS: RadarTarget[] = [
  {
    id: 'trg-1',
    code: 'TRK-9634',
    label: 'Metallic Ordnance',
    threat: 'high',
    confidence: 0.963,
    distanceMeters: 55,
    angleDeg: 45,
    depthMeters: 42.6,
    velocityKts: 0.2,
    headingDeg: 120,
    history: [],
    lastPingTime: 'Just now',
    description: 'High specular acoustic return. Suspected submerged naval mine payload.',
  },
  {
    id: 'trg-2',
    code: 'TRK-8120',
    label: 'Debris Cluster',
    threat: 'medium',
    confidence: 0.812,
    distanceMeters: 75,
    angleDeg: 210,
    depthMeters: 48.1,
    velocityKts: 0.0,
    headingDeg: 0,
    history: [],
    lastPingTime: '1s ago',
    description: 'Fragmented structural debris frame. Stationary seabed hazard.',
  },
  {
    id: 'trg-3',
    code: 'TRK-8851',
    label: 'Submerged Cable Fault',
    threat: 'medium',
    confidence: 0.885,
    distanceMeters: 35,
    angleDeg: 310,
    depthMeters: 52.4,
    velocityKts: 0.0,
    headingDeg: 340,
    history: [],
    lastPingTime: 'Just now',
    description: 'Linear acoustic disturbance along seabed trench boundary.',
  },
  {
    id: 'trg-4',
    code: 'TRK-6742',
    label: 'Biological Target (School of Fish)',
    threat: 'low',
    confidence: 0.742,
    distanceMeters: 28,
    angleDeg: 140,
    depthMeters: 22.8,
    velocityKts: 2.4,
    headingDeg: 200,
    history: [],
    lastPingTime: 'Just now',
    description: 'Diffuse moving backscatter matching pelagic fauna acoustic signature.',
  },
]

const threatColors: Record<RadarTarget['threat'], { text: string; bg: string; border: string; dot: string; glow: string }> = {
  high: {
    text: 'text-destructive',
    bg: 'bg-destructive/15',
    border: 'border-destructive/50',
    dot: 'bg-destructive',
    glow: 'glow-destructive',
  },
  medium: {
    text: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/50',
    dot: 'bg-primary',
    glow: 'glow-cyan',
  },
  low: {
    text: 'text-accent',
    bg: 'bg-accent/15',
    border: 'border-accent/50',
    dot: 'bg-accent',
    glow: '',
  },
}

// Synthesize Hydro-Acoustic Ping Sound
function playRadarPing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.38)
  } catch (e) {
    // Audio Context restricted
  }
}

export function LiveRadarDetector() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState<boolean>(true)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true)
  const [targets, setTargets] = useState<RadarTarget[]>(INITIAL_RADAR_TARGETS)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>('trg-1')
  const [activeAlert, setActiveAlert] = useState<{ message: string; threat: RadarTarget['threat'] } | null>(null)
  const [sweepAngle, setSweepAngle] = useState<number>(0)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const sweepAngleRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const lastAlertTimeRef = useRef<number>(0)

  // Canvas radar animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let size = Math.min(canvas.parentElement?.clientWidth || 600, 650)
    canvas.width = size
    canvas.height = size

    const handleResize = () => {
      if (!canvas.parentElement) return
      size = Math.min(canvas.parentElement.clientWidth, 650)
      canvas.width = size
      canvas.height = size
    }

    window.addEventListener('resize', handleResize)

    const render = () => {
      const cx = size / 2
      const cy = size / 2
      const radius = (size / 2) * 0.88

      // Clear dark ocean backdrop
      ctx.fillStyle = '#060d1e'
      ctx.fillRect(0, 0, size, size)

      // Draw Concentric Radar Rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'
      ctx.lineWidth = 1
      const rings = [0.25, 0.5, 0.75, 1.0]

      rings.forEach((r, idx) => {
        ctx.beginPath()
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2)
        ctx.stroke()

        // Distance label (15m, 30m, 45m, 60m)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'
        ctx.font = '10px monospace'
        ctx.fillText(`${(idx + 1) * 15}m`, cx + 4, cy - radius * r + 12)
      })

      // Draw Axis Crosshairs
      ctx.beginPath()
      ctx.moveTo(cx - radius, cy)
      ctx.lineTo(cx + radius, cy)
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx, cy + radius)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)'
      ctx.stroke()

      // Draw Compass Headings (N, E, S, W)
      ctx.fillStyle = '#38bdf8'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N (000°)', cx, cy - radius - 14)
      ctx.fillText('E (090°)', cx + radius + 22, cy)
      ctx.fillText('S (180°)', cx, cy + radius + 14)
      ctx.fillText('W (270°)', cx - radius - 22, cy)

      // Update Sweep Angle if active
      if (isScanning) {
        sweepAngleRef.current = (sweepAngleRef.current + 1.2) % 360
        setSweepAngle(Math.floor(sweepAngleRef.current))
      }

      const currentAngleRad = (sweepAngleRef.current * Math.PI) / 180

      // Draw Rotating Radar Conical Sweep Arc
      const sweepGradient = ctx.createConicGradient(currentAngleRad - Math.PI / 2, cx, cy)
      sweepGradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)')
      sweepGradient.addColorStop(0.12, 'rgba(56, 189, 248, 0.12)')
      sweepGradient.addColorStop(0.35, 'transparent')
      sweepGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = sweepGradient
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw Leading Edge Scanning Line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + radius * Math.cos(currentAngleRad), cy + radius * Math.sin(currentAngleRad))
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.shadowColor = '#38bdf8'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0

      // Render Targets & Trajectory Lines
      targets.forEach((t) => {
        // Convert distance & angle to canvas coordinates
        const rNorm = (t.distanceMeters / 60) * radius
        const tRad = (t.angleDeg * Math.PI) / 180
        const tx = cx + rNorm * Math.cos(tRad)
        const ty = cy + rNorm * Math.sin(tRad)

        // Draw Historical Trajectory Trail Lines
        if (t.history.length > 1) {
          ctx.beginPath()
          ctx.strokeStyle = t.threat === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([3, 3])
          t.history.forEach((pt, pIdx) => {
            const hx = cx + (pt.x / 60) * radius
            const hy = cy + (pt.y / 60) * radius
            if (pIdx === 0) ctx.moveTo(hx, hy)
            else ctx.lineTo(hx, hy)
          })
          ctx.lineTo(tx, ty)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Check if sweep line is passing over target angle (±15 deg)
        const angleDiff = Math.abs((sweepAngleRef.current - t.angleDeg + 360) % 360)
        const isSweptOver = angleDiff < 18

        if (isSweptOver && isScanning) {
          // Trigger audio ping & alert notification (throttled)
          const now = Date.now()
          if (now - lastAlertTimeRef.current > 3500) {
            lastAlertTimeRef.current = now
            if (audioEnabled) playRadarPing()

            if (t.threat === 'high') {
              setActiveAlert({
                message: `HIGH PRIORITY ANOMALY: ${t.code} (${t.label}) at ${t.distanceMeters}m`,
                threat: 'high',
              })
            }
          }
        }

        // Draw Target Marker
        const isSelected = t.id === selectedTargetId
        const markerColor = t.threat === 'high' ? '#ef4444' : t.threat === 'medium' ? '#38bdf8' : '#34d399'

        ctx.beginPath()
        ctx.arc(tx, ty, isSelected ? 8 : 5, 0, Math.PI * 2)
        ctx.fillStyle = markerColor
        ctx.shadowColor = markerColor
        ctx.shadowBlur = isSweptOver || isSelected ? 15 : 6
        ctx.fill()
        ctx.shadowBlur = 0

        // Selection ring indicator
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(tx, ty, 14, 0, Math.PI * 2)
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Target Code Label
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(t.code, tx + 10, ty - 6)
      })

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [isScanning, audioEnabled, targets, selectedTargetId])

  // Move targets slightly over time to simulate dynamic tracking
  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => {
          if (t.velocityKts === 0) return t
          const rad = (t.headingDeg * Math.PI) / 180
          const deltaR = t.velocityKts * 0.05
          const newAngle = (t.angleDeg + (Math.random() - 0.5) * 1.5 + 360) % 360
          const newDist = Math.max(15, Math.min(85, t.distanceMeters + Math.cos(rad) * deltaR))

          const oldRad = (t.angleDeg * Math.PI) / 180
          const oldX = t.distanceMeters * Math.cos(oldRad)
          const oldY = t.distanceMeters * Math.sin(oldRad)

          const newHistory = [...t.history, { x: oldX, y: oldY }].slice(-5)

          return {
            ...t,
            angleDeg: Math.floor(newAngle),
            distanceMeters: +newDist.toFixed(1),
            history: newHistory,
          }
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [isScanning])

  const activeSelectedTarget = targets.find((t) => t.id === selectedTargetId) || targets[0]

  return (
    <div className="space-y-6">
      {/* Top Banner Alert Bar */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-destructive shadow-lg glow-destructive">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 animate-pulse shrink-0" />
                <span className="font-mono text-xs font-bold uppercase tracking-wide">
                  {activeAlert.message}
                </span>
              </div>

              <button
                onClick={() => setActiveAlert(null)}
                className="rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] uppercase font-bold hover:bg-destructive/40 transition"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tactical Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left / Primary: Animated Real-time Sonar Radar Canvas (8 Columns) */}
        <div className="lg:col-span-8">
          <div className="relative rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-md">
            {/* Top Viewport Header Toolbar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <Radar className="size-4 text-primary animate-spin" />
                  360° Hydro-Acoustic Radar Scope
                </span>

                {/* LIVE Status Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                    isScanning
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isScanning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  {isScanning ? 'LIVE MONITORING ACTIVE' : 'RADAR SCAN PAUSED'}
                </span>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`gap-1.5 text-xs ${audioEnabled ? 'border-primary/50 text-primary' : ''}`}
                >
                  {audioEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                  {audioEnabled ? 'Pings ON' : 'Muted'}
                </Button>

                <Button
                  variant={isScanning ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => setIsScanning(!isScanning)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isScanning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  {isScanning ? 'Pause Scan' : 'Resume Scan'}
                </Button>
              </div>
            </div>

            {/* Radar Scope Viewport Container */}
            <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-black/90 p-4">
              <canvas ref={canvasRef} className="block cursor-crosshair max-w-full select-none" />

              {/* HUD Telemetry Overlay (Top Left) */}
              <div className="pointer-events-none absolute top-4 left-4 font-mono text-[11px] text-cyan-400/90 space-y-1 bg-black/70 p-2.5 rounded-lg border border-primary/20 backdrop-blur">
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <Compass className="size-3.5 animate-pulse" />
                  SWEEP ANGLE: {sweepAngle.toString().padStart(3, '0')}°
                </div>
                <div>RANGE SCALE: 60m</div>
                <div>BEAM FREQ: 450 kHz</div>
                <div>DEPTH: 46.8m</div>
              </div>

              {/* HUD Target Stats Overlay (Top Right) */}
              <div className="pointer-events-none absolute top-4 right-4 font-mono text-[11px] text-muted-foreground bg-black/70 p-2.5 rounded-lg border border-border/60 backdrop-blur text-right">
                <div>TRACKED NODES: <strong className="text-primary">{targets.length}</strong></div>
                <div>HIGH THREATS: <strong className="text-destructive">{targets.filter(t => t.threat === 'high').length}</strong></div>
                <div>SWEEP SPEED: 1.2°/frame</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Secondary: Currently Tracked Targets Panel (4 Columns) */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Target className="size-4 text-primary" />
                <span>Currently Tracked Targets ({targets.length})</span>
              </div>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                Acoustic ID
              </span>
            </div>

            {/* Target List */}
            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
              {targets.map((t) => {
                const style = threatColors[t.threat]
                const isSelected = t.id === selectedTargetId

                return (
                  <motion.div
                    key={t.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedTargetId(t.id)}
                    className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                      style.border
                    } ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/10 shadow-lg glow-cyan'
                        : 'bg-background/50 hover:bg-card/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{t.code}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold ${style.bg} ${style.text}`}
                          >
                            {t.threat}
                          </span>
                        </div>
                        <h4 className="mt-1 text-xs font-bold text-foreground group-hover:text-primary transition">
                          {t.label}
                        </h4>
                      </div>

                      <span className={`font-mono text-xs font-bold ${style.text}`}>
                        {(t.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border/40 bg-secondary/30 p-2 font-mono text-[10px]">
                      <div>
                        <span className="text-muted-foreground block">Distance / Bearing:</span>
                        <strong className="text-foreground">
                          {t.distanceMeters}m @ {t.angleDeg}°
                        </strong>
                      </div>

                      <div>
                        <span className="text-muted-foreground block">Depth / Velocity:</span>
                        <strong className="text-cyan-400">
                          {t.depthMeters}m / {t.velocityKts}kts
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>Updated: {t.lastPingTime}</span>
                      <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                        Focus Target <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Selected Target Telemetry Card Detail */}
            {activeSelectedTarget && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-primary font-bold">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="size-3.5 text-primary animate-pulse" />
                    Focus Node: {activeSelectedTarget.code}
                  </span>
                  <span>{(activeSelectedTarget.confidence * 100).toFixed(1)}% Match</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeSelectedTarget.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
