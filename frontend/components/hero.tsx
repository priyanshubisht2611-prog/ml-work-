import { Waves, Zap, Target } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/count-up'
import { Reveal } from '@/components/reveal'

export function Hero() {
  return (
    <section id="overview" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Ambient sonar backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: 'url(/sonar-waves.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 75%)',
        }}
      />

      {/* Rotating radar sweep + expanding ping rings */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 flex size-[42rem] max-w-none -translate-x-1/2 -translate-y-1/3 items-center justify-center opacity-60">
        <div className="radar-sweep absolute inset-0 rounded-full" />
        <div className="ping-ring absolute size-1/2 rounded-full border border-primary/40" />
        <div
          className="ping-ring absolute size-1/2 rounded-full border border-primary/40"
          style={{ animationDelay: '1.3s' }}
        />
        <div
          className="ping-ring absolute size-1/2 rounded-full border border-primary/40"
          style={{ animationDelay: '2.6s' }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,transparent,var(--background)_70%)]" />

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Sonar Neural Net v2.4 · Live
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            See what hides beneath the{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              deep
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            AquaDetect applies deep convolutional detection to side-scan sonar imagery — identifying
            mines, wrecks, debris, and marine structures on the seafloor with real-time bounding
            boxes and calibrated confidence scores.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#detector"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full gap-2 font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 sm:w-auto'
              )}
            >
              <Target className="size-4" />
              Try the Detector
            </a>
            <a
              href="#how"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'w-full gap-2 transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto'
              )}
            >
              How it works
            </a>
          </div>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Waves, value: 94.7, decimals: 1, suffix: '%', label: 'Detection mAP' },
            { icon: Zap, value: 38, decimals: 0, suffix: 'ms', label: 'Avg. inference' },
            { icon: Target, value: 12, decimals: 0, suffix: '', label: 'Object classes' },
          ].map(({ icon: Icon, value, decimals, suffix, label }, i) => (
            <Reveal
              key={label}
              delay={i * 120}
              className="group rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80"
            >
              <Icon className="mx-auto size-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="mt-2 font-mono text-2xl font-semibold">
                <CountUp value={value} decimals={decimals} suffix={suffix} />
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
