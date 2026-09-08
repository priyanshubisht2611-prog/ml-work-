'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** Target numeric value to animate to */
  value: number
  /** Number of decimal places to display */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Duration of the count animation in ms */
  duration?: number
  className?: string
}

export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1400,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    let raf = 0
    let start = 0

    const run = () => {
      const step = (now: number) => {
        if (!start) start = now
        const progress = Math.min((now - start) / duration, 1)
        // easeOutCubic for a snappy, decelerating count
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(value * eased)
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
