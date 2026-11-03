import React, { useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { Award, Sparkles, Star, Trophy } from 'lucide-react'

export interface CelebrationEvent {
  id: number
  type: 'points' | 'level' | 'achievement'
  points: number
  title: string
  subtitle?: string
}

interface PointsCelebrationProps {
  event: CelebrationEvent | null
}

const CONFETTI_COLORS = ['#1B3E2F', '#2F7D52', '#8FCFA4', '#E9C46A', '#FFFFFF', '#DCEBDD']

function fireConfetti(type: CelebrationEvent['type']) {
  if (type === 'points') {
    confetti({
      particleCount: 55,
      spread: 70,
      startVelocity: 32,
      scalar: 0.9,
      origin: { y: 0.58 },
      colors: CONFETTI_COLORS
    })
    return
  }

  if (type === 'level') {
    confetti({ particleCount: 110, spread: 95, startVelocity: 42, origin: { y: 0.58 }, colors: CONFETTI_COLORS })
    confetti({ particleCount: 45, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS })
    confetti({ particleCount: 45, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS })
    return
  }

  confetti({ particleCount: 90, spread: 360, startVelocity: 28, ticks: 160, origin: { y: 0.5 }, colors: CONFETTI_COLORS })
  confetti({ particleCount: 80, spread: 110, startVelocity: 38, origin: { y: 0.6 }, colors: CONFETTI_COLORS })
}

export default function PointsCelebration({ event }: PointsCelebrationProps) {
  useEffect(() => {
    if (!event) return
    fireConfetti(event.type)
  }, [event?.id])

  const floaters = useMemo(() => {
    if (!event) return []
    return Array.from({ length: 8 }, (_, index) => ({
      id: index,
      left: 42 + Math.random() * 18,
      top: 48 + Math.random() * 16,
      delay: index * 0.07,
      size: 20 + Math.random() * 20,
      drift: -40 + Math.random() * 80
    }))
  }, [event?.id])

  const stars = useMemo(() => {
    if (!event) return []
    return Array.from({ length: 10 }, (_, index) => ({
      id: index,
      left: 24 + Math.random() * 58,
      top: 30 + Math.random() * 42,
      delay: Math.random() * 0.5,
      size: 10 + Math.random() * 16
    }))
  }, [event?.id])

  if (!event) return null

  const hasPoints = event.points > 0
  const isAchievement = event.type === 'achievement'
  const Icon = isAchievement ? Award : event.type === 'level' ? Trophy : Star
  const eyebrow = isAchievement ? 'ACHIEVEMENT UNLOCKED' : event.type === 'level' ? 'LEVEL COMPLETE' : 'BRILLIANT WORK'
  const headline = hasPoints ? `+${event.points}` : isAchievement ? 'UNLOCKED' : 'COMPLETE'
  const headlineSuffix = hasPoints ? ' POINTS!' : '!'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none px-4"
      role="status"
      aria-live="polite"
    >
      <div className="celebration-shell relative flex items-center justify-center">
        {/* Glowing stars */}
        {stars.map(star => (
          <span
            key={`star-${star.id}`}
            className="celebration-star absolute"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`
            }}
          >
            <svg width={star.size} height={star.size} viewBox="0 0 24 24" fill="none">
              <path
                d="M12 1.8l2.7 6.4 6.9.6-5.2 4.6 1.6 6.8L12 16.6 6 20.2l1.6-6.8L2.4 8.8l6.9-.6L12 1.8z"
                fill="#FDE68A"
                stroke="#F59E0B"
                strokeWidth="0.8"
              />
            </svg>
          </span>
        ))}

        {/* Floating score numbers — only when real points were earned */}
        {event.points > 0 && floaters.map(floater => (
          <span
            key={`float-${floater.id}`}
            className="celebration-floater absolute font-serif font-bold text-[#1B3E2F]"
            style={{
              left: `${floater.left}%`,
              top: `${floater.top}%`,
              fontSize: `${floater.size}px`,
              animationDelay: `${floater.delay}s`,
              ['--drift' as any]: `${floater.drift}px`
            }}
          >
            +{event.points}
          </span>
        ))}

        <div className="points-celebration-card relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-[#173B2C] via-[#24523E] to-[#32724F] px-8 py-7 sm:px-14 sm:py-9 text-center text-white shadow-[0_25px_70px_-15px_rgba(19,50,37,0.7)]">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="absolute -bottom-20 -right-12 h-44 w-44 rounded-full bg-amber-200/15 blur-2xl" />

          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25">
            <Icon className="h-7 w-7 text-amber-300" strokeWidth={2.2} />
            <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-emerald-200" />
          </div>

          <p className="relative text-[10px] font-bold uppercase tracking-[0.32em] text-emerald-200/90">
            {eyebrow}
          </p>

          <p className="relative mt-1 font-serif text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            <span className="celebration-headline inline-block bg-gradient-to-b from-white via-amber-50 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
              {headline}
            </span>
            <span className="ml-2 text-xl font-bold text-amber-200 sm:text-2xl">
              {headlineSuffix}
            </span>
          </p>

          <p className="relative mt-3 text-base font-bold text-white sm:text-lg">{event.title}</p>
          {event.subtitle && (
            <p className="relative mt-1 max-w-xs text-xs text-emerald-100/80 sm:max-w-sm">
              {event.subtitle}
            </p>
          )}

          <div className="relative mt-4 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="celebration-dot h-1.5 w-1.5 rounded-full bg-amber-300"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
