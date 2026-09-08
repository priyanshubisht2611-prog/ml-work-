'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Battery,
  Radio,
  Navigation,
  MapPin,
  Clock,
  Activity,
  Sparkles,
  ChevronRight,
  Database,
  Crosshair,
  Gauge,
  CheckCircle2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'

export interface Waypoint {
  id: string
  code: string
  label: string
  x: number // 0 to 100%
  y: number // 0 to 100%
  status: 'passed' | 'active' | 'pending'
  depthMeters: number
}

export interface MissionTarget {
  id: string
  code: string
  label: string
  threat: 'high' | 'medium' | 'low'
  x: number
  y: number
  depthMeters: number
  discoveredAtWaypoint: string
  confidence: number
  revealed: boolean
}

const INITIAL_WAYPOINTS: Waypoint[] = [
  { id: 'wp-1', code: 'WP-01', label: 'Sector Alpha Launch', x: 12, y: 75, status: 'passed', depthMeters: 25.0 },
  { id: 'wp-2', code: 'WP-02', label: 'Trench Boundary North', x: 34, y: 35, status: 'passed', depthMeters: 38.5 },
  { id: 'wp-3', code: 'WP-03', label: 'Seabed Basin Survey', x: 58, y: 65, status: 'active', depthMeters: 44.2 },
  { id: 'wp-4', code: 'WP-04', label: 'Coral Ridge East', x: 78, y: 30, status: 'pending', depthMeters: 52.1 },
  { id: 'wp-5', code: 'WP-05', label: 'Sector Bravo Recovery', x: 90, y: 70, status: 'pending', depthMeters: 20.0 },
]

const INITIAL_TARGETS: MissionTarget[] = [
  {
    id: 'mt-1',
    code: 'OBJ-9634',
    label: 'Metallic Ordnance',
    threat: 'high',
    x: 32,
    y: 42,
    depthMeters: 42.6,
    discoveredAtWaypoint: 'WP-02',
    confidence: 0.963,
    revealed: true,
  },
  {
    id: 'mt-2',
    code: 'OBJ-8120',
    label: 'Debris Cluster',
    threat: 'medium',
    x: 52,
    y: 58,
    depthMeters: 48.1,
    discoveredAtWaypoint: 'WP-03',
    confidence: 0.812,
    revealed: true,
  },
  {
    id: 'mt-3',
    code: 'OBJ-8851',
    label: 'Submerged Cable Fault',
    threat: 'medium',
    x: 74,
    y: 35,
    depthMeters: 52.4,
    discoveredAtWaypoint: 'WP-04',
    confidence: 0.885,
    revealed: false,
  },
]

export function MissionTracker() {
  const [isMoving, setIsMoving] = useState<boolean>(true)
  const [progressPct, setProgressPct] = useState<number>(54)
  const [auvPos, setAuvPos] = useState<{ x: number; y: number; heading: number }>({ x: 50, y: 55, heading: 125 })
  const [waypoints, setWaypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS)
  const [targets, setTargets] = useState<MissionTarget[]>(INITIAL_TARGETS)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('wp-3')

  const stepRef = useRef<number>(54)

  // Submarine smooth position interpolation along waypoints
  useEffect(() => {
    if (!isMoving) return

    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 0.4) % 100
      const p = stepRef.current
      setProgressPct(+p.toFixed(1))

      // Compute sub position along piecewise waypoints
      let x = 12
      let y = 75
      let heading = 125

      if (p < 25) {
        const ratio = p / 25
        x = 12 + (34 - 12) * ratio
        y = 75 + (35 - 75) * ratio
        heading = 125
      } else if (p < 55) {
        const ratio = (p - 25) / 30
        x = 34 + (58 - 34) * ratio
        y = 35 + (65 - 35) * ratio
        heading = 145
      } else if (p < 80) {
        const ratio = (p - 55) / 25
        x = 58 + (78 - 58) * ratio
        y = 65 + (30 - 65) * ratio
        heading = 60
      } else {
        const ratio = (p - 80) / 20
        x = 78 + (90 - 78) * ratio
        y = 30 + (70 - 30) * ratio
        heading = 160
      }

      setAuvPos({ x: +x.toFixed(1), y: +y.toFixed(1), heading })

      // Update Waypoint Active/Passed status
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (p >= 80 && wp.id === 'wp-5') return { ...wp, status: 'active' }
          if (p >= 55 && wp.id === 'wp-4') return { ...wp, status: p >= 80 ? 'passed' : 'active' }
          if (p >= 25 && wp.id === 'wp-3') return { ...wp, status: p >= 55 ? 'passed' : 'active' }
          if (wp.id === 'wp-2') return { ...wp, status: p >= 25 ? 'passed' : 'active' }
          return wp
        }),
      )

      // Reveal targets as AUV sweeps near them
      setTargets((prev) =>
        prev.map((t) => {
          const dist = Math.hypot(x - t.x, y - t.y)
          if (dist < 18) return { ...t, revealed: true }
          return t
        }),
      )
    }, 150)

    return () => clearInterval(interval)
  }, [isMoving])

  const currentDepth = (25 + (progressPct / 100) * 27.4).toFixed(1)
  const distanceCoveredKm = ((progressPct / 100) * 7.5).toFixed(2)
  const timeRemainingMins = Math.max(0, Math.floor(((100 - progressPct) / 100) * 35))

  const handleResetMission = () => {
    stepRef.current = 0
    setProgressPct(0)
    setIsMoving(true)
    setTargets(INITIAL_TARGETS)
  }

  return (
    <div className="space-y-6">
      {/* Main Grid: Left Interactive Tactical Map (8 Cols) + Right Telemetry Panel (4 Cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Interactive Underwater Tactical Map Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-md space-y-3">
            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <Navigation className="size-4 text-primary animate-pulse" />
                  AUV Tactical Survey Map (Hydro-Array #04)
                </span>

                {/* Progress Badge */}
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  {progressPct}% COMPLETED
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <Button
                  variant={isMoving ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => setIsMoving(!isMoving)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isMoving ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  {isMoving ? 'Pause Motion' : 'Resume Mission'}
                </Button>

                <Button variant="outline" size="sm" onClick={handleResetMission} className="gap-1.5 text-xs">
                  <RotateCcw className="size-3.5" />
                  Restart Path
                </Button>
              </div>
            </div>

            {/* Top Mission Progress Bar */}
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>SECTOR ALPHA LAUNCH</span>
                <span className="text-primary font-bold">{progressPct}% COVERAGE</span>
                <span>SECTOR BRAVO RECOVERY</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-accent"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Map Canvas & SVG Path Container */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/80 bg-black/90 select-none">
              {/* Bathymetric Grid Backdrop */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Waypoint Connecting Route Polyline SVG */}
              <svg className="absolute inset-0 size-full pointer-events-none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Waypoint Track Lines */}
                <polyline
                  points={waypoints.map((wp) => `${wp.x * 6.5},${wp.y * 3.8}`).join(' ')}
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="opacity-75"
                />
              </svg>

              {/* Waypoint Marker Nodes */}
              {waypoints.map((wp) => {
                const isPassed = wp.status === 'passed'
                const isActive = wp.status === 'active'

                return (
                  <div
                    key={wp.id}
                    onClick={() => setSelectedNodeId(wp.id)}
                    className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 z-10 transition hover:scale-125"
                    style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                  >
                    <div
                      className={`flex size-7 items-center justify-center rounded-full border shadow-lg ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse glow-cyan'
                          : isPassed
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-border bg-black/80 text-muted-foreground'
                      }`}
                    >
                      <MapPin className="size-3.5" />
                    </div>

                    <span className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-primary/20 backdrop-blur">
                      {wp.code}
                    </span>
                  </div>
                )
              })}

              {/* Detected Target Locations */}
              {targets.map((mt) => {
                if (!mt.revealed) return null
                const isHigh = mt.threat === 'high'

                return (
                  <motion.div
                    key={mt.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => setSelectedNodeId(mt.id)}
                    className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ left: `${mt.x}%`, top: `${mt.y}%` }}
                  >
                    <div
                      className={`flex size-6 items-center justify-center rounded-full border shadow-md ${
                        isHigh
                          ? 'border-destructive bg-destructive/30 text-destructive animate-ping'
                          : 'border-primary bg-primary/30 text-primary'
                      }`}
                    >
                      <ShieldAlert className="size-3.5" />
                    </div>

                    <span
                      className={`absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] font-bold shadow border ${
                        isHigh
                          ? 'bg-destructive/90 text-destructive-foreground border-destructive/40'
                          : 'bg-black/90 text-primary border-primary/40'
                      }`}
                    >
                      {mt.code} ({(mt.confidence * 100).toFixed(0)}%)
                    </span>
                  </motion.div>
                )
              })}

              {/* Animated Moving Submarine Icon & Sonar Coverage Sector Cone */}
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                animate={{ left: `${auvPos.x}%`, top: `${auvPos.y}%` }}
                transition={{ duration: 0.3, ease: 'linear' }}
              >
                {/* Sonar Coverage Sector Cone */}
                <div
                  className="absolute -top-12 -left-12 size-24 pointer-events-none opacity-40"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(56,189,248,0.5) 40deg, transparent 80deg)',
                    transform: `rotate(${auvPos.heading - 40}deg)`,
                  }}
                />

                {/* Submarine Icon */}
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-cyan-400 bg-primary text-primary-foreground shadow-2xl glow-cyan">
                  <Navigation
                    className="size-5 transition-transform duration-300"
                    style={{ transform: `rotate(${auvPos.heading}deg)` }}
                  />
                </div>
              </motion.div>

              {/* HUD Coordinates Overlay (Bottom Left) */}
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg bg-black/80 px-3 py-1.5 font-mono text-[11px] text-cyan-400 backdrop-blur border border-primary/30">
                <span className="flex items-center gap-1 font-bold text-primary">
                  <Crosshair className="size-3 text-primary animate-pulse" />
                  LAT: 24°18.421' N
                </span>
                <span>LNG: 78°31.104' W</span>
                <span className="text-foreground">DEPTH: {currentDepth}m</span>
                <span className="text-emerald-400">SPEED: 2.8 kts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mission Telemetry Control Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-md space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Gauge className="size-4 text-primary" />
                <span>Mission Telemetry Panel</span>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                IN PROGRESS
              </span>
            </div>

            {/* 4 Metric Key-Value Cards */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Compass className="size-3 text-primary" /> Distance Covered
                </span>
                <strong className="mt-1 text-lg font-bold text-primary block">
                  {distanceCoveredKm} km <span className="text-xs text-muted-foreground">/ 7.5km</span>
                </strong>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Database className="size-3 text-cyan-400" /> Targets Detected
                </span>
                <strong className="mt-1 text-lg font-bold text-cyan-400 block">
                  {targets.filter((t) => t.revealed).length} Locked
                </strong>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Activity className="size-3 text-foreground" /> Current Depth
                </span>
                <strong className="mt-1 text-lg font-bold text-foreground block">
                  {currentDepth} m
                </strong>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="size-3 text-emerald-400" /> Time Remaining
                </span>
                <strong className="mt-1 text-lg font-bold text-emerald-400 block">
                  ~{timeRemainingMins} mins
                </strong>
              </div>
            </div>

            {/* AUV Battery & Telemetry Health */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between font-bold text-primary">
                <span className="flex items-center gap-1.5">
                  <Battery className="size-4 text-emerald-400" /> AUV Power & Link
                </span>
                <span className="text-emerald-400">84% Battery</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Acoustic Modem Link: +18 dB</span>
                <span>Water Temp: 14.2°C</span>
              </div>
            </div>

            {/* Waypoints List Breakdown */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
              <span className="font-mono text-xs font-bold text-muted-foreground uppercase block">
                Mission Waypoints Track
              </span>

              {waypoints.map((wp) => {
                const isPassed = wp.status === 'passed'
                const isActive = wp.status === 'active'

                return (
                  <div
                    key={wp.id}
                    onClick={() => setSelectedNodeId(wp.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 font-mono text-xs cursor-pointer transition ${
                      isActive
                        ? 'border-primary bg-primary/15 font-bold text-primary shadow glow-cyan'
                        : isPassed
                        ? 'border-border/60 bg-background/40 text-muted-foreground'
                        : 'border-border/40 bg-background/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isPassed ? (
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <Activity className="size-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <MapPin className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">{wp.code} — {wp.label}</div>
                        <div className="text-[10px] text-muted-foreground">Target Depth: {wp.depthMeters}m</div>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold">
                      {wp.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
