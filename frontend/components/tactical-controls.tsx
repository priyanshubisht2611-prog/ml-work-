'use client'

import { SlidersHorizontal, Eye, Volume2, VolumeX, Download, Filter, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'

export type SpectrumFilter = 'raw' | 'bathymetric' | 'shadow' | 'thermal'
export type ThreatFilter = 'all' | 'high' | 'medium' | 'low'

interface TacticalControlsProps {
  confidenceThreshold: number
  onConfidenceChange: (val: number) => void
  spectrumFilter: SpectrumFilter
  onSpectrumFilterChange: (filter: SpectrumFilter) => void
  threatFilter: ThreatFilter
  onThreatFilterChange: (threat: ThreatFilter) => void
  audioEnabled: boolean
  onAudioToggle: () => void
  onExport: () => void
  totalTargetsCount: number
  visibleTargetsCount: number
}

const SPECTRUM_MODES: { id: SpectrumFilter; label: string; desc: string }[] = [
  { id: 'raw', label: 'Raw Acoustic', desc: 'Standard side-scan return' },
  { id: 'bathymetric', label: 'Bathymetric', desc: 'Depth & elevation gradient' },
  { id: 'shadow', label: 'Shadow Contrast', desc: 'High edge contrast for structure' },
  { id: 'thermal', label: 'Thermal Intensity', desc: 'Sonar return energy spectrum' },
]

export function TacticalControls({
  confidenceThreshold,
  onConfidenceChange,
  spectrumFilter,
  onSpectrumFilterChange,
  threatFilter,
  onThreatFilterChange,
  audioEnabled,
  onAudioToggle,
  onExport,
  totalTargetsCount,
  visibleTargetsCount,
}: TacticalControlsProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <h3 className="font-semibold text-sm">Detection & Display Parameters</h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-secondary/80 px-2.5 py-1 font-mono text-muted-foreground">
            Displaying <strong className="text-primary">{visibleTargetsCount}</strong> of {totalTargetsCount} targets
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onAudioToggle}
            className={`gap-1.5 font-mono text-xs ${
              audioEnabled ? 'border-primary/50 bg-primary/15 text-primary' : ''
            }`}
          >
            {audioEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            {audioEnabled ? 'Sonar Audio ON' : 'Mute Audio'}
          </Button>

          <Button variant="secondary" size="sm" onClick={onExport} className="gap-1.5 text-xs">
            <Download className="size-3.5" />
            Export Telemetry
          </Button>
        </div>
      </div>

      <div className="mt-3.5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Spectrum Filter Modes */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Layers className="size-3.5 text-primary" /> Multi-Spectrum Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {SPECTRUM_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSpectrumFilterChange(mode.id)}
                className={`relative rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                  spectrumFilter === mode.id
                    ? 'border-primary bg-primary/15 font-medium text-primary shadow-sm'
                    : 'border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <div className="truncate font-medium leading-tight">{mode.label}</div>
                <div className="truncate text-[10px] text-muted-foreground/80">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="size-3.5 text-primary" /> Confidence Threshold
              </span>
              <motion.span
                key={confidenceThreshold}
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="rounded bg-primary/15 px-2 py-0.5 font-semibold text-primary"
              >
                {(confidenceThreshold * 100).toFixed(0)}%
              </motion.span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.01"
              value={confidenceThreshold}
              onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary transition"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>50% (High Recall)</span>
              <span>75% (Balanced)</span>
              <span>95% (High Precision)</span>
            </div>
          </div>
        </div>

        {/* Threat Level Filter Toggles */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Filter className="size-3.5 text-primary" /> Threat Priority Filter
          </label>
          <div className="relative flex rounded-lg border border-border/60 bg-background/40 p-1">
            {(['all', 'high', 'medium', 'low'] as ThreatFilter[]).map((threat) => {
              const isActive = threatFilter === threat
              return (
                <button
                  key={threat}
                  onClick={() => onThreatFilterChange(threat)}
                  className={`relative flex-1 rounded-md py-1 font-mono text-xs capitalize transition-colors z-10 ${
                    isActive ? 'font-semibold text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeThreatTab"
                      className="absolute inset-0 -z-10 rounded-md bg-primary shadow"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {threat}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
