import React, { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, Clock, Move, Trophy, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface JigsawProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

interface JigsawPiece {
  id: number // 0 to N-1
  currentSlot: number | null // null if in tray, index if on board
  correctSlot: number
  label: string
  icon: string
  bgGradient: string
}

const PUZZLE_THEMES = [
  {
    id: 'heart-wellness',
    title: 'Cardiovascular Vitality',
    pieces3x3: [
      { id: 0, label: 'Atrium', icon: '🫀', bgGradient: 'from-rose-500 to-red-600' },
      { id: 1, label: 'Aorta', icon: '🩸', bgGradient: 'from-red-500 to-pink-600' },
      { id: 2, label: 'Pulse', icon: '💓', bgGradient: 'from-pink-500 to-rose-600' },
      { id: 3, label: 'Rhythm', icon: '⚡', bgGradient: 'from-emerald-500 to-teal-600' },
      { id: 4, label: 'Ventricle', icon: '❤️', bgGradient: 'from-rose-600 to-red-700' },
      { id: 5, label: 'Oxygen', icon: '🫧', bgGradient: 'from-sky-500 to-blue-600' },
      { id: 6, label: 'Artery', icon: '🩺', bgGradient: 'from-red-600 to-rose-700' },
      { id: 7, label: 'Pressure', icon: '📊', bgGradient: 'from-emerald-600 to-green-700' },
      { id: 8, label: 'Longevity', icon: '🌿', bgGradient: 'from-teal-600 to-emerald-700' }
    ]
  },
  {
    id: 'clinic-care',
    title: 'Modern Clinic Campus',
    pieces3x3: [
      { id: 0, label: 'Reception', icon: '🏥', bgGradient: 'from-emerald-600 to-teal-700' },
      { id: 1, label: 'Triage', icon: '📋', bgGradient: 'from-teal-600 to-cyan-700' },
      { id: 2, label: 'Consultation', icon: '👨‍⚕️', bgGradient: 'from-cyan-600 to-sky-700' },
      { id: 3, label: 'Diagnostics', icon: '🔬', bgGradient: 'from-emerald-500 to-green-600' },
      { id: 4, label: 'Patient Hub', icon: '🤝', bgGradient: 'from-green-600 to-emerald-700' },
      { id: 5, label: 'Pharmacy', icon: '💊', bgGradient: 'from-sky-500 to-blue-600' },
      { id: 6, label: 'Emergency', icon: '🚑', bgGradient: 'from-rose-500 to-red-600' },
      { id: 7, label: 'Laboratory', icon: '🧪', bgGradient: 'from-indigo-500 to-violet-600' },
      { id: 8, label: 'Wellness Garden', icon: '🪴', bgGradient: 'from-teal-700 to-emerald-800' }
    ]
  }
]

export default function JigsawPuzzleGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: JigsawProps) {
  const [themeIdx, setThemeIdx] = useState(0)
  const [gridSize, setGridSize] = useState<2 | 3>(3) // 2x2 (4 pieces) or 3x3 (9 pieces)
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null)
  const [boardSlots, setBoardSlots] = useState<(number | null)[]>([]) // slot index -> pieceId
  const [trayPieces, setTrayPieces] = useState<number[]>([]) // pieceIds in tray
  const [moves, setMoves] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const activeTheme = PUZZLE_THEMES[themeIdx]
  const totalSlots = gridSize * gridSize

  // Initialize puzzle
  const initPuzzle = (size: 2 | 3 = gridSize, tIdx: number = themeIdx) => {
    const total = size * size
    const availablePieces = activeTheme.pieces3x3.slice(0, total)

    // Shuffled tray
    const pieceIds = availablePieces.map((_, idx) => idx)
    for (let i = pieceIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pieceIds[i], pieceIds[j]] = [pieceIds[j], pieceIds[i]]
    }

    setBoardSlots(Array(total).fill(null))
    setTrayPieces(pieceIds)
    setSelectedPieceId(null)
    setMoves(0)
    setTimerSeconds(0)
    setIsComplete(false)
    setIsPlaying(true)
    playGameSound('start', soundEnabled, soundVolume)
  }

  useEffect(() => {
    initPuzzle()
  }, [gridSize, themeIdx])

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

  // Click on piece in tray
  const handleSelectTrayPiece = (pieceId: number) => {
    if (isComplete) return
    setSelectedPieceId(pieceId === selectedPieceId ? null : pieceId)
    playGameSound('click', soundEnabled, soundVolume)
  }

  // Click on board slot
  const handleSlotClick = (slotIndex: number) => {
    if (isComplete) return

    // If a piece is selected from tray
    if (selectedPieceId !== null) {
      const currentPieceInSlot = boardSlots[slotIndex]

      const newSlots = [...boardSlots]
      const newTray = trayPieces.filter(id => id !== selectedPieceId)

      // If slot already had a piece, return old piece to tray
      if (currentPieceInSlot !== null) {
        newTray.push(currentPieceInSlot)
      }

      newSlots[slotIndex] = selectedPieceId
      setBoardSlots(newSlots)
      setTrayPieces(newTray)
      setSelectedPieceId(null)
      setMoves(prev => prev + 1)

      // Play snap sound if correctly placed
      if (selectedPieceId === slotIndex) {
        playGameSound('snap', soundEnabled, soundVolume)
      } else {
        playGameSound('click', soundEnabled, soundVolume)
      }

      // Check win
      const allFilledAndCorrect = newSlots.every((pid, idx) => pid === idx)
      if (allFilledAndCorrect) {
        setIsComplete(true)
        setIsPlaying(false)
        playGameSound('win', soundEnabled, soundVolume)
        onAwardPoints(40, 'Medical Jigsaw Master!')
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } })
        } catch {}
      }
    } else {
      // If no piece is selected, clicking a filled slot removes it back to tray
      const pieceInSlot = boardSlots[slotIndex]
      if (pieceInSlot !== null) {
        const newSlots = [...boardSlots]
        newSlots[slotIndex] = null
        setBoardSlots(newSlots)
        setTrayPieces(prev => [...prev, pieceInSlot])
        playGameSound('flip', soundEnabled, soundVolume)
      }
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Visual Spatial Reconstruction
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Clinical Jigsaw Puzzle
          </h2>
          <p className="text-xs text-text-secondary">
            Select pieces from the tray and place them into the correct frame slots.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid Size Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#EFF5EE] rounded-xl border border-pale-sage">
            <button
              type="button"
              onClick={() => {
                setGridSize(2)
                initPuzzle(2)
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                gridSize === 2 ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
              }`}
            >
              2x2 (4 pcs)
            </button>
            <button
              type="button"
              onClick={() => {
                setGridSize(3)
                initPuzzle(3)
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                gridSize === 3 ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
              }`}
            >
              3x3 (9 pcs)
            </button>
          </div>

          {/* Theme switch */}
          <button
            type="button"
            onClick={() => {
              const nextTheme = (themeIdx + 1) % PUZZLE_THEMES.length
              setThemeIdx(nextTheme)
              initPuzzle(gridSize, nextTheme)
            }}
            className="px-3 py-1.5 rounded-xl border border-pale-sage bg-[#F5F8F6] text-forest-green text-xs font-semibold hover:bg-pale-sage/40 transition-colors flex items-center gap-1"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Theme: {activeTheme.title.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Move className="w-3.5 h-3.5 text-forest-green" />
            <span>Placements</span>
          </div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{moves}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 text-forest-green" />
            <span>Timer</span>
          </div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{formatTime(timerSeconds)}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Trophy className="w-3.5 h-3.5 text-emerald-700" />
            <span>Placed</span>
          </div>
          <div className="text-xl font-serif font-bold text-emerald-800 mt-0.5">
            {boardSlots.filter(s => s !== null).length} / {totalSlots}
          </div>
        </div>
      </div>

      {/* Victory Celebration */}
      {isComplete && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
          <h4 className="font-serif font-bold text-emerald-900 text-base">
            Jigsaw Puzzle Completed! +40 Health Points!
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Arranged {totalSlots} clinical pieces in {moves} moves ({formatTime(timerSeconds)}).
          </p>
        </div>
      )}

      {/* Main Play Area: Puzzle Frame + Piece Tray */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Puzzle Target Board */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-forest-green uppercase tracking-wider">
              Target Frame ({activeTheme.title})
            </span>
            <span className="text-[11px] text-text-secondary">
              Click slot to place piece
            </span>
          </div>

          <div
            className={`grid gap-2.5 p-3 bg-[#EFF5EE] rounded-3xl border-2 border-pale-sage shadow-inner ${
              gridSize === 2 ? 'grid-cols-2 max-w-[280px]' : 'grid-cols-3 max-w-[340px]'
            } mx-auto aspect-square`}
          >
            {boardSlots.map((pieceId, slotIdx) => {
              const pieceData = pieceId !== null ? activeTheme.pieces3x3[pieceId] : null
              const isCorrectSlot = pieceId === slotIdx

              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handleSlotClick(slotIdx)}
                  className={`rounded-2xl relative flex flex-col items-center justify-center p-2 transition-all border-2 select-none aspect-square ${
                    pieceData
                      ? isCorrectSlot
                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 border-emerald-500 shadow-xs'
                        : 'bg-white border-amber-300 shadow-2xs hover:scale-[1.02]'
                      : selectedPieceId !== null
                      ? 'border-dashed border-forest-green/50 bg-white/70 hover:bg-emerald-50/50 cursor-pointer animate-pulse'
                      : 'border-dashed border-pale-sage bg-white/40 cursor-default'
                  }`}
                >
                  {pieceData ? (
                    <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-90">
                      <span className="text-3xl sm:text-4xl">{pieceData.icon}</span>
                      <span className="text-[11px] font-serif font-bold text-forest-green mt-1">
                        {pieceData.label}
                      </span>
                      {isCorrectSlot && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-stone-300">
                      Slot #{slotIdx + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Piece Tray */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-forest-green uppercase tracking-wider">
              Puzzle Pieces Tray ({trayPieces.length} remaining)
            </span>
            {selectedPieceId !== null && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                Piece selected! Click slot
              </span>
            )}
          </div>

          <div className="p-3 bg-[#FAFBF9] rounded-3xl border border-pale-sage min-h-[280px]">
            {trayPieces.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {trayPieces.map(pieceId => {
                  const pieceData = activeTheme.pieces3x3[pieceId]
                  const isSelected = selectedPieceId === pieceId

                  return (
                    <button
                      key={pieceId}
                      type="button"
                      onClick={() => handleSelectTrayPiece(pieceId)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-100 border-forest-green ring-2 ring-forest-green scale-105 shadow-md'
                          : 'bg-white border-pale-sage hover:border-forest-green/60 hover:scale-[1.02]'
                      }`}
                    >
                      <span className="text-2xl mb-1">{pieceData.icon}</span>
                      <span className="text-[10px] font-bold text-stone-800 truncate max-w-full">
                        {pieceData.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-text-secondary text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p>All pieces placed into frame!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={() => initPuzzle()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Puzzle</span>
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

