import React, { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, Clock, Move, Trophy, CheckCircle2 } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface MemoryMatchProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

interface CardItem {
  id: string
  pairId: number
  title: string
  icon: string
  fact: string
  isFlipped: boolean
  isMatched: boolean
}

const MEDICAL_CARDS_MASTER = [
  { pairId: 1, title: 'Cardiology', icon: '🫀', fact: 'The human heart pumps 7,500 liters of blood daily.' },
  { pairId: 2, title: 'Neurology', icon: '🧠', fact: 'The brain contains ~86 billion neurons communicating via synapses.' },
  { pairId: 3, title: 'Stethoscope', icon: '🩺', fact: 'Invented in 1816 in France by Dr. René Laennec.' },
  { pairId: 4, title: 'Pharmacy', icon: '💊', fact: 'Antibiotics target bacterial cell walls without harming human cells.' },
  { pairId: 5, title: 'Genetics', icon: '🧬', fact: 'Human DNA is 99.9% identical across all individuals.' },
  { pairId: 6, title: 'Ambulance', icon: '🚑', fact: 'Emergency golden hour care triples trauma recovery rates.' },
  { pairId: 7, title: 'Ophthalmology', icon: '👁️', fact: 'The human eye can distinguish approximately 10 million distinct colors.' },
  { pairId: 8, title: 'Microbiology', icon: '🔬', fact: 'Compound microscopes reveal pathogens as small as 0.2 micrometers.' },
  { pairId: 9, title: 'Vaccines', icon: '💉', fact: 'Immunizations train memory B-cells to neutralize future pathogens.' },
  { pairId: 10, title: 'Nutrition', icon: '🥗', fact: 'Dietary fiber supports gut microbiome short-chain fatty acid synthesis.' }
]

type Difficulty = 'easy' | 'medium' | 'hard'

export default function MedicalMemoryMatchGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: MemoryMatchProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [cards, setCards] = useState<CardItem[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([]) // Indices of currently flipped cards
  const [moves, setMoves] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [lastMatchFact, setLastMatchFact] = useState<string | null>(null)

  // Initialize deck based on difficulty
  const initGame = (diff: Difficulty = difficulty) => {
    const pairCount = diff === 'easy' ? 6 : diff === 'medium' ? 8 : 10
    const chosen = MEDICAL_CARDS_MASTER.slice(0, pairCount)

    const deck: CardItem[] = []
    chosen.forEach(item => {
      deck.push({
        id: `card-${item.pairId}-a`,
        pairId: item.pairId,
        title: item.title,
        icon: item.icon,
        fact: item.fact,
        isFlipped: false,
        isMatched: false
      })
      deck.push({
        id: `card-${item.pairId}-b`,
        pairId: item.pairId,
        title: item.title,
        icon: item.icon,
        fact: item.fact,
        isFlipped: false,
        isMatched: false
      })
    })

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    setCards(deck)
    setFlippedCards([])
    setMoves(0)
    setTimerSeconds(0)
    setIsComplete(false)
    setIsPlaying(true)
    setLastMatchFact(null)
    playGameSound('start', soundEnabled, soundVolume)
  }

  useEffect(() => {
    initGame()
  }, [difficulty])

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isPlaying && !isComplete) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isComplete])

  // Card click handler
  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
      return
    }

    playGameSound('flip', soundEnabled, soundVolume)

    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)

    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      const [firstIdx, secondIdx] = newFlipped
      const firstCard = newCards[firstIdx]
      const secondCard = newCards[secondIdx]

      if (firstCard.pairId === secondCard.pairId) {
        // Matched!
        setTimeout(() => {
          firstCard.isMatched = true
          secondCard.isMatched = true
          setCards([...newCards])
          setFlippedCards([])
          setLastMatchFact(firstCard.fact)
          playGameSound('match', soundEnabled, soundVolume)

          // Check if all matched
          const allMatched = newCards.every(c => c.isMatched)
          if (allMatched) {
            setIsComplete(true)
            setIsPlaying(false)
            playGameSound('win', soundEnabled, soundVolume)
            onAwardPoints(35, 'Medical Memory Match Champion!')
            try {
              confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } })
            } catch {}
          }
        }, 400)
      } else {
        // Not matched: flip back after delay
        setTimeout(() => {
          firstCard.isFlipped = false
          secondCard.isFlipped = false
          setCards([...newCards])
          setFlippedCards([])
          playGameSound('wrong', soundEnabled, soundVolume)
        }, 900)
      }
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const gridColsClass =
    difficulty === 'easy'
      ? 'grid-cols-3 sm:grid-cols-4'
      : difficulty === 'medium'
      ? 'grid-cols-4'
      : 'grid-cols-4 sm:grid-cols-5'

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Neuroplasticity & Focus
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Medical Memory Match
          </h2>
          <p className="text-xs text-text-secondary">
            Pair clinical icons and uncover medical science facts.
          </p>
        </div>

        {/* Difficulty Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFF5EE] rounded-2xl border border-pale-sage shrink-0">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDifficulty(d)
                initGame(d)
              }}
              className={`capitalize px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                difficulty === d
                  ? 'bg-forest-green text-white shadow-xs'
                  : 'text-stone-600 hover:text-forest-green'
              }`}
            >
              {d === 'easy' ? 'Easy (12)' : d === 'medium' ? 'Med (16)' : 'Hard (20)'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Move className="w-3.5 h-3.5 text-forest-green" />
            <span>Turns</span>
          </div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{moves}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 text-forest-green" />
            <span>Time</span>
          </div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{formatTime(timerSeconds)}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Trophy className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pairs Found</span>
          </div>
          <div className="text-xl font-serif font-bold text-emerald-800 mt-0.5">
            {cards.filter(c => c.isMatched).length / 2} / {cards.length / 2}
          </div>
        </div>
      </div>

      {/* Fact Bubble */}
      {lastMatchFact && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Medical Fact:</strong> {lastMatchFact}
          </div>
        </div>
      )}

      {/* Victory Alert */}
      {isComplete && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
          <h4 className="font-serif font-bold text-emerald-900 text-base">
            All Medical Pairs Matched! +35 Health Points Earned!
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Matched all {cards.length / 2} pairs in {moves} turns ({formatTime(timerSeconds)}).
          </p>
        </div>
      )}

      {/* Cards Grid */}
      <div className={`grid ${gridColsClass} gap-2.5 p-3 bg-[#EFF5EE] rounded-3xl border-2 border-pale-sage shadow-inner select-none`}>
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(idx)}
              disabled={isRevealed || flippedCards.length === 2}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer shadow-xs border ${
                card.isMatched
                  ? 'bg-emerald-50/90 border-emerald-400 text-forest-green scale-[0.98] opacity-90'
                  : isRevealed
                  ? 'bg-white border-forest-green shadow-md scale-102'
                  : 'bg-forest-green hover:bg-forest-green/90 border-emerald-900 text-white hover:scale-[1.03]'
              }`}
            >
              {isRevealed ? (
                <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
                  <span className="text-2xl sm:text-3xl mb-0.5">{card.icon}</span>
                  <span className="font-serif font-bold text-[10px] sm:text-xs text-forest-green truncate max-w-[65px]">
                    {card.title}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-bold text-sm">
                    ✚
                  </div>
                  <span className="text-[9px] text-emerald-200 font-semibold mt-1">Care</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={() => initGame()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Game</span>
        </button>

        {onBackToArcade && (
          <button
            type="button"
            onClick={onBackToArcade}
            className="px-4 py-2.5 rounded-xl border border-pale-sage bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            Back to Arcade
          </button>
        )}
      </div>
    </div>
  )
}

