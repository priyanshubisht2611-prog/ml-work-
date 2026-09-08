'use client'

import { Navbar } from '@/components/navbar'
import { LiveRadarDetector } from '@/components/live-radar-detector'
import { WaterfallStream } from '@/components/waterfall-stream'
import { HowItWorks } from '@/components/how-it-works'
import { SiteFooter } from '@/components/site-footer'
import { Sparkles, Radio, ShieldAlert, Cpu } from 'lucide-react'

export default function LiveDetectorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Navbar mode="tactical" />

      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-8">
          {/* Header Title Section */}
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Sparkles className="size-3.5" /> Military & Oceanographic Command Center
            </span>

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Live Underwater Radar & Sonar Scope
            </h1>

            <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
              Real-time hydro-acoustic monitoring system. Tracks submerged objects, computes heading vectors, measures bathymetric depth, and flags naval hazard priorities.
            </p>
          </div>

          {/* Top Quick Status Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Active Transducer Array</span>
                <Radio className="size-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-foreground">Hydro-Scope #04</div>
              <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                450 kHz Conical Radar Sweep
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Sweep Speed</span>
                <Cpu className="size-4 text-primary" />
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-primary">1.2° / Frame</div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">1.2s Ping Refresh Interval</div>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-card/60 p-4 backdrop-blur-md glow-destructive">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Critical Hazards</span>
                <ShieldAlert className="size-4 text-destructive" />
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-destructive">1 Target Locked</div>
              <div className="mt-1 text-[11px] text-destructive/80 font-mono">TRK-9634 (Metallic Ordnance)</div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Coverage Scale</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-mono">60m Radius</span>
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-cyan-400">11,310 m²</div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">Continuous 360° Sector</div>
            </div>
          </div>

          {/* Oscilloscope Waterfall Stream */}
          <WaterfallStream frequencyKHz={450} gainDb={18} activeThreatCount={1} />

          {/* Main Animated Live Radar Scope Component */}
          <LiveRadarDetector />

          <HowItWorks />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
