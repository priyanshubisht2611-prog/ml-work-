import { CountUp } from '@/components/count-up'
import { Reveal } from '@/components/reveal'

const metrics = [
  { value: 94.7, decimals: 1, suffix: '%', label: 'mAP@0.5', sub: 'on SeafloorNet-12 benchmark' },
  { value: 0.91, decimals: 2, suffix: '', label: 'F1 score', sub: 'across all object classes' },
  { value: 38, decimals: 0, suffix: 'ms', label: 'Inference latency', sub: 'per 1024px frame, single GPU' },
  { value: 2.1, decimals: 1, suffix: 'M', label: 'Training frames', sub: 'labeled side-scan sonar tiles' },
]

export function Metrics() {
  return (
    <section id="metrics" className="scroll-mt-20 border-t border-border/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <Reveal className="lg:col-span-1" from="left">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              Benchmarks
            </span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Measured on real sonar data
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Evaluated against a held-out set of surveyed seafloor targets, not synthetic
              renders — the numbers reflect field conditions.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {metrics.map((m, i) => (
              <Reveal
                key={m.label}
                delay={i * 100}
                className="group rounded-xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80"
              >
                <div className="font-mono text-3xl font-semibold text-primary md:text-4xl">
                  <CountUp value={m.value} decimals={m.decimals} suffix={m.suffix} />
                </div>
                <div className="mt-2 text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.sub}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
