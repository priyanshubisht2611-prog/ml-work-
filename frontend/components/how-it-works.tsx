import { Waves, Cpu, ScanSearch, FileBarChart } from 'lucide-react'
import { Reveal } from '@/components/reveal'

const steps = [
  {
    icon: Waves,
    title: 'Acoustic capture',
    desc: 'Side-scan sonar sweeps the seabed, converting reflected sound pulses into a high-resolution grayscale acoustic image.',
  },
  {
    icon: Cpu,
    title: 'Signal conditioning',
    desc: 'Slant-range correction and speckle denoising normalize the frame so faint targets stand out from seafloor clutter.',
  },
  {
    icon: ScanSearch,
    title: 'Neural detection',
    desc: 'A convolutional detector proposes regions, classifies each target across 12 classes, and regresses tight bounding boxes.',
  },
  {
    icon: FileBarChart,
    title: 'Confidence scoring',
    desc: 'Temperature-calibrated softmax outputs produce reliable confidence values, flagging high-priority targets for review.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-border/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Pipeline</span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            From ping to prediction
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Four stages take raw acoustic returns to actionable detections in under 40 milliseconds.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 120}
              className="group relative rounded-xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80"
            >
              <span className="font-mono text-xs text-muted-foreground">
                0{i + 1}
              </span>
              <span className="mt-3 flex size-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
