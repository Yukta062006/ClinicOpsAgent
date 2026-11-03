import React, { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  suffix?: string
}

export default function AnimatedNumber({
  value,
  className = '',
  duration = 700,
  suffix = ''
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const frameRef = useRef<number | null>(null)
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const from = displayRef.current
    if (from === value) return

    const settle = () => {
      displayRef.current = value
      setDisplay(value)
    }

    // Background tabs pause requestAnimationFrame; show the real value instead of a stale one.
    if (typeof document !== 'undefined' && document.hidden) {
      settle()
      return
    }

    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + (value - from) * eased)
      displayRef.current = next
      setDisplay(next)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        settle()
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    // Throttled or stalled animation frames must never leave a stale score on screen.
    settleRef.current = setTimeout(settle, duration + 120)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (settleRef.current) clearTimeout(settleRef.current)
    }
  }, [value, duration])

  return (
    <span className={className} aria-live="polite">
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}
