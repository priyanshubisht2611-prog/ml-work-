'use client'

import { useEffect, useRef, useState } from 'react'
import { Activity, Play, Pause, Volume2, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface WaterfallStreamProps {
  frequencyKHz?: number
  gainDb?: number
  activeThreatCount?: number
}

export function WaterfallStream({
  frequencyKHz = 450,
  gainDb = 18,
  activeThreatCount = 0,
}: WaterfallStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [snr, setSnr] = useState(24.8)
  const frameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600)
    let height = (canvas.height = 120)

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = 120
    }

    window.addEventListener('resize', handleResize)

    // Waterfall buffer lines
    const maxLines = height
    const lines: number[][] = []
    const cols = Math.floor(width / 3)

    // Populate initial lines
    for (let i = 0; i < maxLines; i++) {
      const line: number[] = []
      for (let j = 0; j < cols; j++) {
        line.push(Math.random() * 0.15)
      }
      lines.push(line)
    }

    let phase = 0

    const render = () => {
      if (isPlaying) {
        phase += 0.08
        // Generate new acoustic frequency slice
        const newLine: number[] = []
        for (let j = 0; j < cols; j++) {
          // Baseline ambient acoustic noise
          let val = Math.random() * 0.18

          // Seafloor acoustic return harmonic peak
          const centerHarmonic = Math.sin((j / cols) * Math.PI * 4 + phase) * 0.2
          val += Math.max(0, centerHarmonic)

          // Submerged object return spike simulation
          if (j > cols * 0.45 && j < cols * 0.55) {
            val += Math.sin(phase * 2) * 0.35 + 0.3
          }

          // Threat signal pulse boost
          if (activeThreatCount > 0 && j > cols * 0.7 && j < cols * 0.8) {
            val += Math.abs(Math.sin(phase * 3)) * 0.4
          }

          newLine.push(Math.min(1, val * (gainDb / 12)))
        }

        lines.pop()
        lines.unshift(newLine)

        // Random SNR micro fluctuations
        setSnr(+(22.5 + Math.sin(phase * 0.5) * 3.5).toFixed(1))
      }

      // Draw waterfall lines onto canvas
      ctx.fillStyle = '#0b1329'
      ctx.fillRect(0, 0, width, height)

      const colWidth = width / cols
      const lineHeight = height / maxLines

      for (let y = 0; y < maxLines; y++) {
        const line = lines[y]
        if (!line) continue
        for (let x = 0; x < cols; x++) {
          const intensity = line[x]
          // Cyan-to-emerald sonar heat spectrum
          const r = Math.floor(intensity * 30)
          const g = Math.floor(intensity * 220 + 20)
          const b = Math.floor(intensity * 255 + 50)
          const alpha = Math.min(1, intensity + 0.15)

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.fillRect(x * colWidth, y * lineHeight, colWidth + 0.5, lineHeight + 0.5)
        }
      }

      // Overlay animated oscilloscope waveform line across top
      ctx.beginPath()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1.8
      ctx.shadowColor = '#0284c7'
      ctx.shadowBlur = 6

      const currentLine = lines[0] || []
      for (let x = 0; x < cols; x++) {
        const val = currentLine[x] || 0
        const py = 30 - val * 24
        if (x === 0) ctx.moveTo(0, py)
        else ctx.lineTo(x * colWidth, py)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      frameIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [isPlaying, gainDb, activeThreatCount])

  return (
    <div className="rounded-xl border border-primary/20 bg-card/70 p-3.5 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-primary">
          <Activity className={`size-4 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-semibold uppercase tracking-wider">Hydro-Acoustic Spectrum Stream</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {frequencyKHz} kHz
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="hidden sm:inline-flex items-center gap-1">
            <Volume2 className="size-3 text-cyan-400" /> Gain: +{gainDb} dB
          </span>
          <span className="hidden md:inline-flex">SNR: {snr} dB</span>
          
          <span className={`inline-flex items-center gap-1.5 ${isPlaying ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className={`size-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {isPlaying ? 'LIVE' : 'PAUSED'}
          </span>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex size-6 items-center justify-center rounded border border-border bg-secondary/60 text-foreground transition hover:bg-primary/20"
            title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
          >
            {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-black/60">
        <canvas ref={canvasRef} className="block h-[110px] w-full cursor-crosshair" />

        {/* Smooth continuous sonar scanning beam animation */}
        {isPlaying && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-cyan-400/30 to-cyan-400/60 border-r border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
            animate={{ left: ['-10%', '100%'] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Animated Anomaly Detection Markers */}
        <AnimatePresence>
          {activeThreatCount > 0 && (
            <>
              {/* Target Anomaly Marker #1 at 50% range */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute top-4 left-[50%] -translate-x-1/2 flex items-center justify-center"
              >
                <span className="size-5 rounded-full border border-destructive bg-destructive/30 animate-ping" />
                <span className="absolute size-2.5 rounded-full bg-destructive" />
              </motion.div>

              {/* Target Anomaly Marker #2 at 75% range */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="pointer-events-none absolute top-6 left-[75%] -translate-x-1/2 flex items-center justify-center"
              >
                <span className="size-5 rounded-full border border-primary bg-primary/30 animate-ping" />
                <span className="absolute size-2 rounded-full bg-primary" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Tactical scale markers */}
        <div className="pointer-events-none absolute bottom-1 left-2 flex items-center gap-3 font-mono text-[9px] text-cyan-400/70">
          <span>0m</span>
          <span>15m</span>
          <span>30m</span>
          <span>45m</span>
          <span>60m (Range)</span>
        </div>

        {/* Anomaly Badge */}
        <AnimatePresence>
          {activeThreatCount > 0 && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="pointer-events-none absolute top-1 right-2 flex items-center gap-1 rounded bg-destructive/80 px-1.5 py-0.5 font-mono text-[10px] text-destructive-foreground"
            >
              <ShieldAlert className="size-3 animate-pulse" />
              {activeThreatCount} ANOMALIES DETECTED
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
