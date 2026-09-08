'use client'

import { Navbar } from '@/components/navbar'
import { AiPipelineVisualizer } from '@/components/ai-pipeline-visualizer'
import { HowItWorks } from '@/components/how-it-works'
import { Metrics } from '@/components/metrics'
import { SiteFooter } from '@/components/site-footer'
import { Cpu, Sparkles } from 'lucide-react'

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Navbar mode="tactical" />

      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-8">
          {/* Header Title Section */}
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Sparkles className="size-3.5" /> SeafloorNet Convolutional Neural Architecture
            </span>

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              AI Detection Pipeline
            </h1>

            <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
              Step-by-step deep neural execution flow. Trace acoustic signals from raw side-scan input, slant-range preprocessing, convolutional feature extraction, to temperature-calibrated target classification.
            </p>
          </div>

          {/* Interactive AI Pipeline Visualizer */}
          <AiPipelineVisualizer />

          {/* Pipeline Stage Documentation */}
          <HowItWorks />

          {/* Model Benchmarks */}
          <Metrics />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
