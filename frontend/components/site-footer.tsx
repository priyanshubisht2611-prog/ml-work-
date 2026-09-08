import { Radar } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:px-6 md:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Radar className="size-4 text-primary" />
          </span>
          <span className="font-mono text-sm font-semibold">
            Aqua<span className="text-primary">Detect</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built for the DeepBlue Hackathon 2026 · Demo detections are simulated for illustration.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a href="#detector" className="transition-colors hover:text-foreground">
            Detector
          </a>
          <a href="#metrics" className="transition-colors hover:text-foreground">
            Metrics
          </a>
          <a href="#overview" className="transition-colors hover:text-foreground">
            Top
          </a>
        </div>
      </div>
    </footer>
  )
}
