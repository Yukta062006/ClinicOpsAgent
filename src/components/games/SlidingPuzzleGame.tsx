import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, RotateCcw, Clock, Move, Trophy, CheckCircle2, Eye } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface SlidingPuzzleProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

// 3x3 sliding puzzle (tiles 1 to 8, 0 represents the empty slot)
const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]

const TILE_DATA: Record<number, { title: string; icon: string; desc: string }> = {
  1: { title: 'Cardiology', icon: '❤️', desc: 'Heart care' },
  2: { title: 'Pharmacy', icon: '💊', desc: 'Medicine' },
  3: { title: 'Wellness', icon: '🥗', desc: 'Nutrition' },
  4: { title: 'Diagnosis', icon: '🩺', desc: 'Stethoscope' },
  5: { title: 'Genetics', icon: '🧬', desc: 'DNA strands' },
  6: { title: 'Neurology', icon: '🧠', desc: 'Brain health' },
  7: { title: 'Emergency', icon: '🚑', desc: 'Ambulance' },
  8: { title: 'Clinical', icon: '🏥', desc: 'Hospital OPD' }
}

export default function SlidingPuzzleGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: SlidingPuzzleProps) {
  const [board, setBoard] = useState<number[]>([...GOAL_STATE])
  const [moves, setMoves] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [bestMoves, setBestMoves] = useState<number>(() => {
    const s = localStorage.getItem('clinicops_sliding_best_moves')
    return s ? parseInt(s, 10) : 0
  })

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isPlaying && !isSolved) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isSolved])

  // Count inversions to guarantee solvable puzzle
  const countInversions = (arr: number[]) => {
    let inversions = 0
    const nonZero = arr.filter(n => n !== 0)
    for (let i = 0; i < nonZero.length - 1; i++) {
      for (let j = i + 1; j < nonZero.length; j++) {
        if (nonZero[i] > nonZero[j]) inversions++
      }
    }
    return inversions
  }

  // Shuffle board by performing random valid moves to ensure solvability
  const shuffleBoard = useCallback(() => {
    let current = [...GOAL_STATE]
    let zeroIdx = 8

    // Make 80 valid moves from goal state
    for (let i = 0; i < 80; i++) {
      const neighbors: number[] = []
      const row = Math.floor(zeroIdx / 3)
      const col = zeroIdx % 3

      if (row > 0) neighbors.push(zeroIdx - 3) // Up
      if (row < 2) neighbors.push(zeroIdx + 3) // Down
      if (col > 0) neighbors.push(zeroIdx - 1) // Left
      if (col < 2) neighbors.push(zeroIdx + 1) // Right

      const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)]
      current[zeroIdx] = current[swapIdx]
      current[swapIdx] = 0
      zeroIdx = swapIdx
    }

    // Check it's not already solved
    if (current.every((val, idx) => val === GOAL_STATE[idx])) {
      // Small swap
      const temp = current[0]
      current[0] = current[1]
      current[1] = temp
    }

    setBoard(current)
    setMoves(0)
    setTimerSeconds(0)
    setIsSolved(false)
    setIsPlaying(true)
    playGameSound('start', soundEnabled, soundVolume)
  }, [soundEnabled, soundVolume])

  useEffect(() => {
    shuffleBoard()
  }, [shuffleBoard])

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (isSolved || board[index] === 0) return

    const zeroIndex = board.indexOf(0)
    const row = Math.floor(index / 3)
    const col = index % 3
    const zeroRow = Math.floor(zeroIndex / 3)
    const zeroCol = zeroIndex % 3

    // Check adjacency (cardinal directions only)
    const isAdjacent =
      (Math.abs(row - zeroRow) === 1 && col === zeroCol) ||
      (Math.abs(col - zeroCol) === 1 && row === zeroRow)

    if (!isAdjacent) {
      playGameSound('wrong', soundEnabled, soundVolume)
      return
    }

    const newBoard = [...board]
    newBoard[zeroIndex] = board[index]
    newBoard[index] = 0

    setBoard(newBoard)
    setMoves(prev => prev + 1)
    playGameSound('snap', soundEnabled, soundVolume)

    // Check if solved
    const solved = newBoard.every((val, idx) => val === GOAL_STATE[idx])
    if (solved) {
      setIsSolved(true)
      setIsPlaying(false)
      playGameSound('win', soundEnabled, soundVolume)
      onAwardPoints(35, 'Sliding Puzzle Master!')

      if (!bestMoves || moves + 1 < bestMoves) {
        setBestMoves(moves + 1)
        localStorage.setItem('clinicops_sliding_best_moves', (moves + 1).toString())
      }

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      } catch {}
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Spatial Picture Puzzle
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Clinical Sliding Puzzle
          </h2>
          <p className="text-xs text-text-secondary">
            Slide tiles into the empty space to arrange numbers 1 to 8.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showPreview
              ? 'bg-forest-green text-white border-forest-green shadow-xs'
              : 'bg-[#EFF5EE] text-forest-green border-pale-sage hover:bg-pale-sage/40'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showPreview ? 'Hide Goal' : 'Preview Goal'}</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
            <Move className="w-3.5 h-3.5 text-forest-green" />
            <span>Moves</span>
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
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Best Moves</span>
          </div>
          <div className="text-xl font-serif font-bold text-amber-800 mt-0.5">
            {bestMoves ? bestMoves : '—'}
          </div>
        </div>
      </div>

      {/* Solved Celebration Alert */}
      {isSolved && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
          <h4 className="font-serif font-bold text-emerald-900 text-base">
            Puzzle Solved! +35 Health Points Awarded!
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Completed in {moves} moves ({formatTime(timerSeconds)}). Fantastic cognitive agility!
          </p>
        </div>
      )}

      {/* Goal Preview Overlay if toggled */}
      {showPreview && (
        <div className="mb-4 p-3 rounded-2xl bg-[#EFF5EE] border border-pale-sage text-center animate-in fade-in duration-200">
          <p className="text-xs font-bold text-forest-green mb-2">Target Goal Layout (1 to 8):</p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
            {GOAL_STATE.map((num, i) => (
              <div
                key={i}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                  num === 0 ? 'bg-transparent border border-dashed border-stone-300' : 'bg-white text-forest-green shadow-2xs'
                }`}
              >
                <span>{num !== 0 ? num : ''}</span>
                {num !== 0 && <span className="text-[10px]">{TILE_DATA[num].icon}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3x3 Sliding Puzzle Grid */}
      <div className="w-full max-w-[340px] mx-auto aspect-square grid grid-cols-3 gap-2.5 p-3 bg-[#EFF5EE] rounded-3xl border-2 border-pale-sage shadow-inner">
        {board.map((num, idx) => {
          if (num === 0) {
            return (
              <div
                key="empty"
                className="rounded-2xl border-2 border-dashed border-pale-sage/80 bg-white/30 flex items-center justify-center"
              >
                <span className="text-xs text-stone-400 font-mono">empty</span>
              </div>
            )
          }

          const isCorrectPosition = num === GOAL_STATE[idx]
          const data = TILE_DATA[num]

          return (
            <button
              key={num}
              type="button"
              onClick={() => handleTileClick(idx)}
              className={`relative rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer select-none shadow-xs border ${
                isCorrectPosition
                  ? 'bg-white hover:bg-emerald-50/70 border-emerald-300 text-forest-green'
                  : 'bg-white hover:bg-[#FAFBF9] border-pale-sage text-stone-800'
              } hover:scale-[1.03] active:scale-[0.97]`}
            >
              <span className="text-2xl mb-0.5">{data.icon}</span>
              <span className="font-serif font-bold text-xs">{data.title}</span>
              <span className="absolute top-1.5 left-2 text-[10px] font-bold text-stone-400">
                #{num}
              </span>
              {isCorrectPosition && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={shuffleBoard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Shuffle & Replay</span>
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

