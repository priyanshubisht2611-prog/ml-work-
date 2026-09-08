'use client'

import Image from 'next/image'
import { ExtendedDetection } from '@/components/target-inspector'
import { CircleAlert, Clock, Layers, ShieldAlert, Crosshair, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface DetectionResultsGridProps {
  targets: ExtendedDetection[]
  selectedTargetId?: string | null
  onSelectTarget: (target: ExtendedDetection) => void
  confidenceThreshold?: number
  threatFilter?: string
}

const threatStyles: Record<ExtendedDetection['threat'], { text: string; ring: string; border: string; bg: string; badge: string }> = {
  high: {
    text: 'text-destructive',
    ring: 'ring-destructive/50',
    border: 'border-destructive/40 hover:border-destructive glow-destructive',
    bg: 'bg-destructive/10',
    badge: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  medium: {
    text: 'text-primary',
    ring: 'ring-primary/50',
    border: 'border-primary/40 hover:border-primary glow-cyan',
    bg: 'bg-primary/10',
    badge: 'bg-primary/20 text-primary border-primary/30',
  },
  low: {
    text: 'text-accent',
    ring: 'ring-accent/50',
    border: 'border-accent/40 hover:border-accent',
    bg: 'bg-accent/10',
    badge: 'bg-accent/20 text-accent border-accent/30',
  },
}

// Sample extra metadata for the 4 targets
const TARGET_METADATA: Record<string, { timestamp: string; rangeMeters: number; code: string }> = {
  d1: { timestamp: '12:18:42 UTC', rangeMeters: 38.4, code: 'OBJ-9634' },
  d2: { timestamp: '12:18:41 UTC', rangeMeters: 44.2, code: 'OBJ-8120' },
  d3: { timestamp: '12:18:40 UTC', rangeMeters: 51.0, code: 'OBJ-8851' },
  d4: { timestamp: '12:18:38 UTC', rangeMeters: 29.6, code: 'OBJ-6742' },
}

export function DetectionResultsGrid({
  targets,
  selectedTargetId,
  onSelectTarget,
  confidenceThreshold = 0.5,
  threatFilter = 'all',
}: DetectionResultsGridProps) {
  // Filter visible targets based on parameters
  const filteredTargets = targets.filter((t) => {
    if (t.confidence < confidenceThreshold) return false
    if (threatFilter !== 'all' && t.threat !== threatFilter) return false
    return true
  })

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4 backdrop-blur-md">
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          <h3 className="font-semibold text-sm">Detection Results</h3>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary border border-primary/30">
            {filteredTargets.length} TARGETS CLASSIFIED
          </span>
        </div>

        <span className="font-mono text-xs text-muted-foreground">
          Click any card to pinpoint marker in viewport
        </span>
      </div>

      {/* 4 Target Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filteredTargets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-6 text-center font-mono text-xs text-muted-foreground"
            >
              No targets meet current confidence or threat filter parameters.
            </motion.div>
          ) : (
            filteredTargets.map((target, idx) => {
              const meta = TARGET_METADATA[target.id] || {
                timestamp: '12:18:40 UTC',
                rangeMeters: target.depthMeters,
                code: `OBJ-${target.id.toUpperCase()}`,
              }
              const style = threatStyles[target.threat]
              const isSelected = selectedTargetId === target.id

              return (
                <motion.div
                  key={target.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  onClick={() => onSelectTarget(target)}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all duration-200 hover:-translate-y-1 ${
                    style.border
                  } ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/10 shadow-lg glow-cyan scale-[1.02]'
                      : 'bg-background/60 hover:bg-card/90'
                  }`}
                >
                  {/* Active highlight glow indicator */}
                  {isSelected && (
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-cyan-400 to-accent animate-pulse" />
                  )}

                  {/* Top Header: Thumbnail + Badges */}
                  <div className="flex items-start gap-3">
                    {/* Small Sonar Thumbnail Cutout */}
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-black">
                      <Image
                        src="/sonar-seabed.png"
                        alt={target.label}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Subdued sonar visual box cutout indicator */}
                      <div
                        className={`absolute border ${style.border} rounded-sm bg-primary/10`}
                        style={{
                          left: `${target.box.x * 0.6}%`,
                          top: `${target.box.y * 0.6}%`,
                          width: `${Math.min(70, target.box.w * 0.8)}%`,
                          height: `${Math.min(70, target.box.h * 0.8)}%`,
                        }}
                      />
                      {/* Scan overlay shimmer */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {meta.code}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase font-semibold border ${style.badge}`}
                        >
                          {target.threat}
                        </span>
                      </div>

                      <h4 className="mt-0.5 truncate text-xs font-bold text-foreground group-hover:text-primary transition">
                        {target.label}
                      </h4>

                      <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className={`font-bold ${style.text}`}>
                          {(target.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Metrics Line */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-border/40 bg-secondary/30 p-2 font-mono text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Depth / Range:</span>
                      <strong className="text-foreground">
                        {target.depthMeters}m / {meta.rangeMeters}m
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Timestamp:</span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Clock className="size-2.5" />
                        {meta.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Footer highlight prompt */}
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 text-primary">
                      <Crosshair className={`size-3 ${isSelected ? 'animate-spin' : ''}`} />
                      {isSelected ? 'TARGET LOCKED IN VIEWPORT' : 'PINPOINT ON MAP'}
                    </span>
                    <span className="text-xs group-hover:translate-x-0.5 transition">→</span>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
