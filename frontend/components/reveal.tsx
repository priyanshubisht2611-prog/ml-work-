'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay in ms before the reveal animation starts */
  delay?: number
  /** Direction the element travels from */
  from?: 'up' | 'down' | 'left' | 'right'
  as?: 'div' | 'section' | 'li'
}

const offsets: Record<NonNullable<RevealProps['from']>, string> = {
  up: 'translate-y-8',
  down: '-translate-y-8',
  left: 'translate-x-8',
  right: '-translate-x-8',
}

export function Reveal({
  children,
  className,
  delay = 0,
  from = 'up',
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion preferences.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      // @ts-expect-error — ref typing across polymorphic tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none',
        visible ? 'translate-x-0 translate-y-0 opacity-100' : `opacity-0 ${offsets[from]}`,
        className,
      )}
    >
      {children}
    </Tag>
  )
}
