'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { SonarDetector, SAMPLE_DETECTIONS } from '@/components/sonar-detector'
import { TacticalControls, SpectrumFilter, ThreatFilter } from '@/components/tactical-controls'
import { DetectionResultsGrid } from '@/components/detection-results-grid'
import { WaterfallStream } from '@/components/waterfall-stream'
import { HowItWorks } from '@/components/how-it-works'
import { Metrics } from '@/components/metrics'
import { SiteFooter } from '@/components/site-footer'
import { ExtendedDetection } from '@/components/target-inspector'
import { Download, History, Database, ShieldAlert, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScanHistoryEntry {
    id: string
    timestamp: string
    frameName: string
    targetCount: number
    avgConfidence: number
    highPriorityCount: number
}

export default function Page() {
    const [mode, setMode] = useState<'tactical' | 'overview'>('tactical')
    const [spectrumFilter, setSpectrumFilter] = useState<SpectrumFilter>('raw')
    const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.65)
    const [threatFilter, setThreatFilter] = useState<ThreatFilter>('all')
    const [audioEnabled, setAudioEnabled] = useState<boolean>(true)
    const [activeTargets, setActiveTargets] = useState<ExtendedDetection[]>(SAMPLE_DETECTIONS)
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)

    // Initial Scan History
    const [scanHistory] = useState<ScanHistoryEntry[]>([
        {
            id: 'scan-0941',
            timestamp: '12:18:42 UTC',
            frameName: 'Survey Tile #04 (Sector B-12)',
            targetCount: 4,
            avgConfidence: 0.833,
            highPriorityCount: 1,
        },
        {
            id: 'scan-0940',
            timestamp: '11:45:10 UTC',
            frameName: 'Survey Tile #03 (Sector B-11)',
            targetCount: 2,
            avgConfidence: 0.912,
            highPriorityCount: 0,
        },
        {
            id: 'scan-0939',
            timestamp: '10:22:05 UTC',
            frameName: 'Survey Tile #02 (Sector A-04)',
            targetCount: 5,
            avgConfidence: 0.785,
            highPriorityCount: 2,
        },
    ])

    // Filter visible targets based on confidence & threat parameters
    const visibleTargets = activeTargets.filter((t) => {
        if (t.confidence < confidenceThreshold) return false
        if (threatFilter !== 'all' && t.threat !== threatFilter) return false
        return true
    })

    const highPriorityCount = visibleTargets.filter((t) => t.threat === 'high').length

    const handleExportTelemetry = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(visibleTargets, null, 2))
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute('href', dataStr)
        downloadAnchor.setAttribute('download', `aquadetect_telemetry_${Date.now()}.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
    }

    const handleSelectTargetFromCard = (target: ExtendedDetection) => {
        setSelectedTargetId(target.id)
        const detectorEl = document.getElementById('detector')
        if (detectorEl) {
            detectorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
            <Navbar mode={mode} onModeChange={setMode} activeTargetsCount={visibleTargets.length} />

            <main className="pt-16">
                {mode === 'overview' ? (
                    <>
                        <Hero />
                        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
                            <TacticalControls
                                confidenceThreshold={confidenceThreshold}
                                onConfidenceChange={setConfidenceThreshold}
                                spectrumFilter={spectrumFilter}
                                onSpectrumFilterChange={setSpectrumFilter}
                                threatFilter={threatFilter}
                                onThreatFilterChange={setThreatFilter}
                                audioEnabled={audioEnabled}
                                onAudioToggle={() => setAudioEnabled(!audioEnabled)}
                                onExport={handleExportTelemetry}
                                totalTargetsCount={activeTargets.length}
                                visibleTargetsCount={visibleTargets.length}
                            />

                            <DetectionResultsGrid
                                targets={activeTargets}
                                selectedTargetId={selectedTargetId}
                                onSelectTarget={handleSelectTargetFromCard}
                                confidenceThreshold={confidenceThreshold}
                                threatFilter={threatFilter}
                            />
                        </div>

                        <SonarDetector
                            spectrumFilter={spectrumFilter}
                            confidenceThreshold={confidenceThreshold}
                            threatFilter={threatFilter}
                            audioEnabled={audioEnabled}
                            selectedTargetId={selectedTargetId}
                            onSelectTargetId={setSelectedTargetId}
                            onTargetsChange={setActiveTargets}
                        />
                        <HowItWorks />
                        <Metrics />
                    </>
                ) : (
                    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
                        {/* Tactical Command Header Stats */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                                    <span>Hydro-Acoustic Array</span>
                                    <Cpu className="size-4 text-primary" />
                                </div>
                                <div className="mt-2 font-mono text-xl font-bold text-foreground">Active (450 kHz)</div>
                                <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Side-Scan Transducer #04
                                </div>
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                                    <span>Targets Locked</span>
                                    <Database className="size-4 text-cyan-400" />
                                </div>
                                <div className="mt-2 font-mono text-xl font-bold text-primary">
                                    {visibleTargets.length} <span className="text-xs text-muted-foreground">/ {activeTargets.length}</span>
                                </div>
                                <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                                    Filtered at {(confidenceThreshold * 100).toFixed(0)}% threshold
                                </div>
                            </div>

                            <div className="rounded-xl border border-destructive/30 bg-card/60 p-4 backdrop-blur-md glow-destructive">
                                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                                    <span>High Threat Anomalies</span>
                                    <ShieldAlert className="size-4 text-destructive" />
                                </div>
                                <div className="mt-2 font-mono text-xl font-bold text-destructive">{highPriorityCount}</div>
                                <div className="mt-1 text-[11px] text-destructive/80 font-mono">
                                    {highPriorityCount > 0 ? 'Requires immediate survey' : 'No critical threats'}
                                </div>
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                                    <span>Inference Performance</span>
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-mono">38ms</span>
                                </div>
                                <div className="mt-2 font-mono text-xl font-bold text-emerald-400">94.7% mAP</div>
                                <div className="mt-1 text-[11px] text-muted-foreground font-mono">SeafloorNet-12 Model v2.4</div>
                            </div>
                        </div>

                        {/* Live Waterfall Oscilloscope Stream */}
                        <WaterfallStream frequencyKHz={450} gainDb={18} activeThreatCount={highPriorityCount} />

                        {/* Tactical Display Filter & Parameter Control Bar */}
                        <TacticalControls
                            confidenceThreshold={confidenceThreshold}
                            onConfidenceChange={setConfidenceThreshold}
                            spectrumFilter={spectrumFilter}
                            onSpectrumFilterChange={setSpectrumFilter}
                            threatFilter={threatFilter}
                            onThreatFilterChange={setThreatFilter}
                            audioEnabled={audioEnabled}
                            onAudioToggle={() => setAudioEnabled(!audioEnabled)}
                            onExport={handleExportTelemetry}
                            totalTargetsCount={activeTargets.length}
                            visibleTargetsCount={visibleTargets.length}
                        />

                        {/* Detection Results Grid */}
                        <DetectionResultsGrid
                            targets={activeTargets}
                            selectedTargetId={selectedTargetId}
                            onSelectTarget={handleSelectTargetFromCard}
                            confidenceThreshold={confidenceThreshold}
                            threatFilter={threatFilter}
                        />

                        {/* Core Interactive Sonar Detector Viewport */}
                        <SonarDetector
                            spectrumFilter={spectrumFilter}
                            confidenceThreshold={confidenceThreshold}
                            threatFilter={threatFilter}
                            audioEnabled={audioEnabled}
                            selectedTargetId={selectedTargetId}
                            onSelectTargetId={setSelectedTargetId}
                            onTargetsChange={setActiveTargets}
                        />

                        {/* Scan History & Audit Log */}
                        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <History className="size-4 text-primary" />
                                    <span>Surveilled Frame History & Audit Logs</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleExportTelemetry} className="gap-1.5 text-xs">
                                    <Download className="size-3.5" />
                                    Export Full History (JSON)
                                </Button>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left font-mono text-xs">
                                    <thead>
                                        <tr className="border-b border-border/40 text-muted-foreground">
                                            <th className="pb-2 font-normal">Scan ID</th>
                                            <th className="pb-2 font-normal">Timestamp</th>
                                            <th className="pb-2 font-normal">Frame Designation</th>
                                            <th className="pb-2 font-normal">Targets</th>
                                            <th className="pb-2 font-normal">Avg Confidence</th>
                                            <th className="pb-2 font-normal">Threat Level</th>
                                            <th className="pb-2 font-normal text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {scanHistory.map((h) => (
                                            <tr key={h.id} className="hover:bg-secondary/30 transition">
                                                <td className="py-2.5 font-bold text-primary">{h.id}</td>
                                                <td className="py-2.5 text-muted-foreground">{h.timestamp}</td>
                                                <td className="py-2.5 text-foreground">{h.frameName}</td>
                                                <td className="py-2.5">{h.targetCount} objects</td>
                                                <td className="py-2.5 text-cyan-400">{(h.avgConfidence * 100).toFixed(1)}%</td>
                                                <td className="py-2.5">
                                                    {h.highPriorityCount > 0 ? (
                                                        <span className="rounded bg-destructive/20 px-2 py-0.5 text-destructive font-semibold">
                                                            HIGH HAZARD ({h.highPriorityCount})
                                                        </span>
                                                    ) : (
                                                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                                                            NORMAL
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] text-primary">
                                                        Re-analyze
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <HowItWorks />
                        <Metrics />
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    )
}
