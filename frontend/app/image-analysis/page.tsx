'use client'

import { Navbar } from '@/components/navbar'
import { SonarImageAnalyzer } from '@/components/sonar-image-analyzer'
import { HowItWorks } from '@/components/how-it-works'
import { Metrics } from '@/components/metrics'
import { SiteFooter } from '@/components/site-footer'
import { Sparkles } from 'lucide-react'

export default function ImageAnalysisPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Navbar mode="tactical" />

      <main className="pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-8">
          {/* Header Title Section */}
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Sparkles className="size-3.5" /> High-Resolution Sonar Image Intelligence
            </span>

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Sonar Image Analysis
            </h1>

            <p className="text-pretty text-sm text-muted-foreground leading-relaxed">
              Upload custom side-scan sonar image tiles to run deep convolutional object detection. Localize submerged targets, measure range and depth, and inspect calibrated threat classification scores.
            </p>
          </div>

          {/* Sonar Image Analyzer Component */}
          <SonarImageAnalyzer />

          {/* Documentation & Metrics */}
          <HowItWorks />
          <Metrics />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
