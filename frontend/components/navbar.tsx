'use client'

import { useEffect, useState } from 'react'
import { Radar, Menu, X, Radio, Clock, ShieldCheck, Activity, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  mode?: 'overview' | 'tactical'
  onModeChange?: (mode: 'overview' | 'tactical') => void
  activeTargetsCount?: number
}

const links = [
  { label: 'Dashboard', href: '/' },
  { label: 'Live Scope Radar', href: '/live-detector' },
  { label: 'Image Analysis', href: '/image-analysis' },
  { label: 'AI Pipeline', href: '/pipeline' },
]

export function Navbar({ mode = 'tactical', onModeChange, activeTargetsCount = 4 }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [timeStr, setTimeStr] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const d = new Date()
      setTimeStr(d.toISOString().substring(11, 19) + ' UTC')
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-2.5">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/40 glow-cyan">
              <Radar className="size-5 text-primary" />
              <span className="absolute inset-0 animate-ping rounded-xl bg-primary/10" />
            </span>
            <span className="font-mono text-lg font-bold tracking-tight">
              Aqua<span className="text-primary">Detect</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary">
            <Radio className="size-3 animate-pulse text-emerald-400" />
            <span>Hydro-Array #04 · 450kHz</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Tactical Mode Toggle & Clock HUD */}
        <div className="hidden items-center gap-3 md:flex">
          {mounted && timeStr ? (
            <span className="hidden xl:flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              {timeStr}
            </span>
          ) : null}

          {onModeChange && (
            <div className="flex rounded-lg border border-border/60 bg-secondary/40 p-1">
              <button
                onClick={() => onModeChange('tactical')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs transition ${
                  mode === 'tactical'
                    ? 'bg-primary text-primary-foreground font-semibold shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="size-3.5" />
                Tactical Command
              </button>
              <button
                onClick={() => onModeChange('overview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs transition ${
                  mode === 'overview'
                    ? 'bg-primary text-primary-foreground font-semibold shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Terminal className="size-3.5" />
                Showcase
              </button>
            </div>
          )}

          <a
            href="#detector"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground gap-1.5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
          >
            <ShieldCheck className="size-3.5" />
            Live Viewport
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground md:hidden hover:bg-secondary"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}

            {onModeChange && (
              <div className="flex gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant={mode === 'tactical' ? 'default' : 'outline'}
                  className="w-full text-xs"
                  onClick={() => {
                    onModeChange('tactical')
                    setOpen(false)
                  }}
                >
                  Tactical Command
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'overview' ? 'default' : 'outline'}
                  className="w-full text-xs"
                  onClick={() => {
                    onModeChange('overview')
                    setOpen(false)
                  }}
                >
                  Showcase
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
