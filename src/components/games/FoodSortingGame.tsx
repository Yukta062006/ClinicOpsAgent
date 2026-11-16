import React, { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, Trophy, CheckCircle2, Heart, Award, ArrowRight } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface FoodSortingProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

type FoodCategory = 'healthy' | 'occasional'

interface FoodItem {
  id: string
  name: string
  icon: string
  category: FoodCategory
  clinicalNote: string
}

const ALL_FOODS: FoodItem[] = [
  // Healthy
  { id: 'f-1', name: 'Fresh Broccoli', icon: '🥦', category: 'healthy', clinicalNote: 'Packed with sulforaphane, vitamin C and folate supporting cellular repair.' },
  { id: 'f-2', name: 'Whole Millets & Oats', icon: '🌾', category: 'healthy', clinicalNote: 'Complex slow-release carbohydrates that regulate glycemic response.' },
  { id: 'f-3', name: 'Wild Salmon', icon: '🐟', category: 'healthy', clinicalNote: 'Rich in anti-inflammatory Omega-3 fatty acids for arterial elasticity.' },
  { id: 'f-4', name: 'Avocado', icon: '🥑', category: 'healthy', clinicalNote: 'Heart-protective monounsaturated oleic acid and potassium.' },
  { id: 'f-5', name: 'Crisp Apples', icon: '🍎', category: 'healthy', clinicalNote: 'Soluble pectin fiber lowers LDL cholesterol reabsorption.' },
  { id: 'f-6', name: 'Raw Almonds', icon: '🥜', category: 'healthy', clinicalNote: 'Vitamin E antioxidant shielding endothelial lining from oxidative stress.' },
  { id: 'f-7', name: 'Lentils & Dal', icon: '🍲', category: 'healthy', clinicalNote: 'Plant protein and prebiotic fiber feeding protective gut bifidobacteria.' },
  { id: 'f-8', name: 'Fresh Blueberries', icon: '🫐', category: 'healthy', clinicalNote: 'Anthocyanins boost microvascular perfusion and cognitive recall.' },
  { id: 'f-9', name: 'Baby Spinach', icon: '🥬', category: 'healthy', clinicalNote: 'Dietary nitrates promote healthy nitric oxide endothelial vasodilation.' },
  { id: 'f-10', name: 'Greek Yogurt', icon: '🥛', category: 'healthy', clinicalNote: 'Active probiotics and calcium strengthening metabolic bone density.' },

  // Occasional
  { id: 'f-11', name: 'Sugary Carbonated Cola', icon: '🥤', category: 'occasional', clinicalNote: 'Excess liquid fructose spikes insulin and accelerates liver steatosis.' },
  { id: 'f-12', name: 'Deep Fried Potato Chips', icon: '🍟', category: 'occasional', clinicalNote: 'High sodium and oxidized trans-fats strain microcirculatory tone.' },
  { id: 'f-13', name: 'Glazed Donuts', icon: '🍩', category: 'occasional', clinicalNote: 'Refined flour and hydrogenated oils elevate systemic triglycerides.' },
  { id: 'f-14', name: 'Processed Sausage', icon: '🌭', category: 'occasional', clinicalNote: 'Preservative sodium nitrates linked to vascular stiffening.' },
  { id: 'f-15', name: 'Sugary Gummy Candy', icon: '🍬', category: 'occasional', clinicalNote: 'Simple sugars deplete dental enamel and provoke sharp glycemic crashes.' },
  { id: 'f-16', name: 'Commercial Cream Pastry', icon: '🧁', category: 'occasional', clinicalNote: 'High glycemic index paired with saturated dairy fat.' }
]

export default function FoodSortingGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: FoodSortingProps) {
  const [level, setLevel] = useState<number>(1) // Level 1 (6 items), Level 2 (8 items), Level 3 (10 items)
  const [activeItems, setActiveItems] = useState<FoodItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string; note: string } | null>(null)
  const [isLevelComplete, setIsLevelComplete] = useState(false)

  // Start Level
  const initLevel = (lvl: number = level) => {
    const itemCount = lvl === 1 ? 6 : lvl === 2 ? 8 : 10

    // Balance healthy and occasional items
    const healthyPool = ALL_FOODS.filter(f => f.category === 'healthy')
    const occasionalPool = ALL_FOODS.filter(f => f.category === 'occasional')

    const selectedHealthy = [...healthyPool].sort(() => 0.5 - Math.random()).slice(0, Math.ceil(itemCount / 2))
    const selectedOccasional = [...occasionalPool].sort(() => 0.5 - Math.random()).slice(0, Math.floor(itemCount / 2))

    const mixed = [...selectedHealthy, ...selectedOccasional].sort(() => 0.5 - Math.random())

    setActiveItems(mixed)
    setCurrentIndex(0)
    setFeedback(null)
    setIsLevelComplete(false)
    playGameSound('start', soundEnabled, soundVolume)
  }

  useEffect(() => {
    initLevel(level)
  }, [level])

  // Handle Sort Decision
  const handleSort = (chosenCategory: FoodCategory) => {
    if (feedback || isLevelComplete || currentIndex >= activeItems.length) return

    const item = activeItems[currentIndex]
    const isCorrect = item.category === chosenCategory

    if (isCorrect) {
      const addedPoints = 10 + streak * 2
      setScore(prev => prev + addedPoints)
      setStreak(prev => prev + 1)
      playGameSound('match', soundEnabled, soundVolume)
      setFeedback({
        isCorrect: true,
        text: `✓ Spot On! +${addedPoints} pts`,
        note: item.clinicalNote
      })
    } else {
      setStreak(0)
      playGameSound('wrong', soundEnabled, soundVolume)
      setFeedback({
        isCorrect: false,
        text: `✗ Better categorized as ${item.category === 'healthy' ? 'Heart-Smart & Nutritious' : 'Occasional Treat'}`,
        note: item.clinicalNote
      })
    }

    setTimeout(() => {
      setFeedback(null)
      const nextIdx = currentIndex + 1
      if (nextIdx >= activeItems.length) {
        setIsLevelComplete(true)
        playGameSound('win', soundEnabled, soundVolume)
        onAwardPoints(30, `Completed Food Sorting Level ${level}!`)
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
        } catch {}
      } else {
        setCurrentIndex(nextIdx)
      }
    }, 1400)
  }

  const currentItem = activeItems[currentIndex]

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Nutritional Health Literacy
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Healthy Food Sorting
          </h2>
          <p className="text-xs text-text-secondary">
            Categorize clinical foods into Heart-Smart daily choices vs Occasional treats.
          </p>
        </div>

        {/* Level Indicator */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFF5EE] rounded-2xl border border-pale-sage shrink-0">
          {[1, 2, 3].map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevel(lvl)
                initLevel(lvl)
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                level === lvl
                  ? 'bg-forest-green text-white shadow-xs'
                  : 'text-stone-600 hover:text-forest-green'
              }`}
            >
              Level {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="text-xs text-stone-500">Progress</div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">
            {Math.min(currentIndex + 1, activeItems.length)} / {activeItems.length}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="text-xs text-stone-500">Score</div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{score}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="text-xs text-stone-500">Streak</div>
          <div className="text-xl font-serif font-bold text-amber-700 mt-0.5">
            {streak > 1 ? `🔥 ${streak}x` : `${streak}`}
          </div>
        </div>
      </div>

      {/* Level Complete Modal / Card */}
      {isLevelComplete ? (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-serif font-bold text-emerald-900 text-xl">
            Level {level} Complete! +30 Health Points Earned!
          </h3>
          <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
            You successfully sorted all {activeItems.length} foods with a final score of {score} points.
          </p>

          <div className="flex justify-center gap-3 mt-6">
            {level < 3 ? (
              <button
                type="button"
                onClick={() => {
                  setLevel(level + 1)
                  initLevel(level + 1)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
              >
                <span>Advance to Level {level + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => initLevel(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play from Level 1</span>
              </button>
            )}
          </div>
        </div>
      ) : currentItem ? (
        <div>
          {/* Active Food Card to Sort */}
          <div className="p-6 rounded-3xl bg-[#EFF5EE] border-2 border-pale-sage text-center mb-6 shadow-inner relative overflow-hidden">
            <span className="text-6xl sm:text-7xl block mb-2 animate-in zoom-in-75 duration-200">
              {currentItem.icon}
            </span>
            <h3 className="text-xl font-serif font-bold text-forest-green">
              {currentItem.name}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Where does this belong in a healthy lifestyle?
            </p>

            {/* Instant Feedback Overlay */}
            {feedback && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs animate-in fade-in duration-200 ${
                  feedback.isCorrect ? 'bg-emerald-900/90 text-white' : 'bg-rose-900/90 text-white'
                }`}
              >
                <span className="text-lg font-serif font-bold mb-1">{feedback.text}</span>
                <p className="text-xs max-w-sm opacity-95 leading-relaxed">{feedback.note}</p>
              </div>
            )}
          </div>

          {/* Destination Decision Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={!!feedback}
              onClick={() => handleSort('healthy')}
              className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950 transition-all cursor-pointer shadow-xs flex flex-col items-center text-center hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-3xl mb-1">🥗 💚</span>
              <span className="font-serif font-bold text-sm text-emerald-900">
                Heart-Smart & Nutritious
              </span>
              <span className="text-[11px] text-emerald-700 mt-0.5">
                Daily nourishing wholesome choice
              </span>
            </button>

            <button
              type="button"
              disabled={!!feedback}
              onClick={() => handleSort('occasional')}
              className="p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/70 hover:bg-amber-100/90 text-amber-950 transition-all cursor-pointer shadow-xs flex flex-col items-center text-center hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-3xl mb-1">🍩 ⭐</span>
              <span className="font-serif font-bold text-sm text-amber-900">
                Occasional Treat
              </span>
              <span className="text-[11px] text-amber-700 mt-0.5">
                Enjoy sparingly in moderation
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={() => initLevel(level)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Level</span>
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

