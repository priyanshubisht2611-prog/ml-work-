'use client'

import { X, ShieldAlert, Compass, Layers, CheckCircle2, AlertTriangle, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ExtendedDetection = {
  id: string
  label: string
  confidence: number
  threat: 'high' | 'medium' | 'low'
  box: { x: number; y: number; w: number; h: number }
  dimensions: string
  depthMeters: number
  reflectivityDb: number
  coordinates: string
  description: string
  recommendation: string
}

interface TargetInspectorProps {
  target: ExtendedDetection | null
  onClose: () => void
  onAction: (targetId: string, action: 'flag' | 'safe') => void
}

export function TargetInspector({ target, onClose, onAction }: TargetInspectorProps) {
  if (!target) return null

  const isHighThreat = target.threat === 'high'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl glow-cyan">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-xl font-mono text-lg font-bold shadow ${
                isHighThreat
                  ? 'bg-destructive/20 text-destructive ring-1 ring-destructive/40'
                  : target.threat === 'medium'
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-accent/20 text-accent ring-1 ring-accent/40'
              }`}
            >
              <ShieldAlert className="size-5" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">{target.label}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${
                    isHighThreat
                      ? 'bg-destructive/20 text-destructive'
                      : target.threat === 'medium'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'
                  }`}
                >
                  {target.threat} priority
                </span>
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                ID: {target.id.toUpperCase()} · Submerged Telemetry Profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Confidence</span>
            <div className="mt-1 font-mono text-lg font-bold text-primary">
              {(target.confidence * 100).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Depth</span>
            <div className="mt-1 font-mono text-lg font-bold text-foreground">
              {target.depthMeters} m
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Reflectivity</span>
            <div className="mt-1 font-mono text-lg font-bold text-cyan-400">
              +{target.reflectivityDb} dB
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Dimensions</span>
            <div className="mt-1 font-mono text-sm font-bold text-foreground truncate">
              {target.dimensions}
            </div>
          </div>
        </div>

        {/* Coordinates & Location */}
        <div className="mt-4 rounded-xl border border-border/60 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Compass className="size-4 text-primary" />
            <span>Surveilled Geo-Coordinates:</span>
            <strong className="text-foreground">{target.coordinates}</strong>
          </div>
        </div>

        {/* Acoustic Signature Profile Curve (Synthetic Graph) */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" /> Target Acoustic Cross-Section
            </span>
            <span>Acoustic Frequency Response (kHz)</span>
          </div>

          <div className="relative h-20 overflow-hidden rounded-lg border border-border/60 bg-black/60 p-2">
            <svg className="h-full w-full" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 50 Q 50 45, 80 20 T 150 10 T 220 40 T 300 55"
                fill="url(#curveGrad)"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Highlight Peak */}
              <circle cx="150" cy="10" r="4" fill="#ef4444" className="animate-ping" />
              <circle cx="150" cy="10" r="3" fill="#ef4444" />
            </svg>
            <span className="absolute top-1 right-2 font-mono text-[9px] text-destructive font-semibold">
              Peak: 450kHz Harmonic
            </span>
          </div>
        </div>

        {/* Tactical Description & AI Recommendation */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <h4 className="font-mono text-xs font-semibold text-primary uppercase">
            AI Automated Assessment
          </h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {target.description}
          </p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{target.recommendation}</span>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <Button variant="outline" size="sm" onClick={() => onAction(target.id, 'safe')} className="gap-1.5 text-xs">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            Mark Safe / False Positive
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onAction(target.id, 'flag')}
              className="gap-1.5 text-xs font-semibold"
            >
              <ShieldAlert className="size-3.5" />
              Flag for AUV Inspection
            </Button>

            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
