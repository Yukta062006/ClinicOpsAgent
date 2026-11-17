import React, { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, Clock, Trophy, CheckCircle2, Search, Check } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface WordSearchProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

interface WordDefinition {
  word: string
  hint: string
  color: string
}

const HEALTH_WORDS: WordDefinition[] = [
  { word: 'VITAMIN', hint: 'Essential micronutrient for immunity and enzyme function', color: 'bg-emerald-200 text-emerald-900 border-emerald-400' },
  { word: 'CARDIAC', hint: 'Relating to the human heart and blood vessels', color: 'bg-rose-200 text-rose-900 border-rose-400' },
  { word: 'DOCTOR', hint: 'Licensed healthcare physician providing medical care', color: 'bg-sky-200 text-sky-900 border-sky-400' },
  { word: 'OXYGEN', hint: 'Life-sustaining gas carried by hemoglobin red blood cells', color: 'bg-cyan-200 text-cyan-900 border-cyan-400' },
  { word: 'VACCINE', hint: 'Biological preparation providing acquired immunity', color: 'bg-amber-200 text-amber-900 border-amber-400' },
  { word: 'HYDRATE', hint: 'Maintaining essential body fluid balance daily', color: 'bg-blue-200 text-blue-900 border-blue-400' },
  { word: 'WELLNESS', hint: 'Proactive state of complete physical and mental health', color: 'bg-teal-200 text-teal-900 border-teal-400' }
]

const GRID_SIZE = 10

export default function WordSearchGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: WordSearchProps) {
  const [grid, setGrid] = useState<string[][]>([])
  const [placedWords, setPlacedWords] = useState<Record<string, [number, number][]>>({}) // word -> list of [r, c]
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [selectedCoords, setSelectedCoords] = useState<[number, number][]>([])
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Generate word search grid
  const generateGrid = () => {
    // 1. Create empty 10x10 matrix
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
    const newPlaced: Record<string, [number, number][]> = {}

    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal Down-Right
      [-1, 1]   // Diagonal Up-Right
    ]

    for (const item of HEALTH_WORDS) {
      const w = item.word
      let placed = false
      let attempts = 0

      while (!placed && attempts < 100) {
        attempts++
        const dir = directions[Math.floor(Math.random() * directions.length)]
        const [dr, dc] = dir

        const maxRow = dr > 0 ? GRID_SIZE - w.length : dr < 0 ? GRID_SIZE - 1 : GRID_SIZE - 1
        const minRow = dr < 0 ? w.length - 1 : 0
        const maxCol = dc > 0 ? GRID_SIZE - w.length : GRID_SIZE - 1

        const startR = Math.floor(Math.random() * (maxRow - minRow + 1)) + minRow
        const startC = Math.floor(Math.random() * (maxCol + 1))

        // Check if word fits without conflicting letters
        let canPlace = true
        const coords: [number, number][] = []

        for (let i = 0; i < w.length; i++) {
          const r = startR + dr * i
          const c = startC + dc * i
          if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
            canPlace = false
            break
          }
          if (newGrid[r][c] !== '' && newGrid[r][c] !== w[i]) {
            canPlace = false
            break
          }
          coords.push([r, c])
        }

        if (canPlace) {
          coords.forEach(([r, c], i) => {
            newGrid[r][c] = w[i]
          })
          newPlaced[w] = coords
          placed = true
        }
      }
    }

    // Fill remaining empty cells with random uppercase letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newGrid[r][c]) {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)]
        }
      }
    }

    setGrid(newGrid)
    setPlacedWords(newPlaced)
    setFoundWords([])
    setSelectedCoords([])
    setTimerSeconds(0)
    setIsComplete(false)
    setIsPlaying(true)
    playGameSound('start', soundEnabled, soundVolume)
  }

  useEffect(() => {
    generateGrid()
  }, [])

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

  // Cell click handler
  const handleCellClick = (r: number, c: number) => {
    if (isComplete) return

    // If already in selectedCoords, deselect if it's the last, or clear
    const existsIndex = selectedCoords.findIndex(([sr, sc]) => sr === r && sc === c)
    let nextCoords: [number, number][] = []

    if (selectedCoords.length === 0) {
      nextCoords = [[r, c]]
      playGameSound('click', soundEnabled, soundVolume)
    } else {
      // Connect line from first selected coordinate to this one if in same row/col/diagonal
      const [startR, startC] = selectedCoords[0]
      const dr = r - startR
      const dc = c - startC

      const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1
      const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1

      const isLine = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)

      if (isLine) {
        const length = Math.max(Math.abs(dr), Math.abs(dc)) + 1
        const line: [number, number][] = []
        for (let i = 0; i < length; i++) {
          line.push([startR + stepR * i, startC + stepC * i])
        }
        nextCoords = line
        playGameSound('click', soundEnabled, soundVolume)
      } else {
        // Reset to newly clicked cell
        nextCoords = [[r, c]]
        playGameSound('click', soundEnabled, soundVolume)
      }
    }

    setSelectedCoords(nextCoords)

    // Check if the current selected letters match any unfound word
    const currentWord = nextCoords.map(([cr, cc]) => grid[cr][cc]).join('')
    const reversedWord = currentWord.split('').reverse().join('')

    for (const item of HEALTH_WORDS) {
      const target = item.word
      if (!foundWords.includes(target) && (currentWord === target || reversedWord === target)) {
        // Discovered!
        const updatedFound = [...foundWords, target]
        setFoundWords(updatedFound)
        setSelectedCoords([])
        playGameSound('match', soundEnabled, soundVolume)
        onAwardPoints(15, `Found "${target}"!`)

        if (updatedFound.length === HEALTH_WORDS.length) {
          setIsComplete(true)
          setIsPlaying(false)
          playGameSound('win', soundEnabled, soundVolume)
          onAwardPoints(50, 'All Health Words Found!')
          try {
            confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } })
          } catch {}
        }
        break
      }
    }
  }

  const isCellSelected = (r: number, c: number) => {
    return selectedCoords.some(([sr, sc]) => sr === r && sc === c)
  }

  const getFoundWordColorForCell = (r: number, c: number): string | null => {
    for (const item of HEALTH_WORDS) {
      if (foundWords.includes(item.word)) {
        const coords = placedWords[item.word] || []
        if (coords.some(([pr, pc]) => pr === r && pc === c)) {
          return item.color
        }
      }
    }
    return null
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Cognitive Lexical Search
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Health Word Search Puzzle
          </h2>
          <p className="text-xs text-text-secondary">
            Find the 7 vital medical and wellness words hidden in the grid.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#FAFBF9] border border-pale-sage text-center">
            <span className="text-[10px] text-stone-500 block">Timer</span>
            <span className="font-serif font-bold text-forest-green text-sm">{formatTime(timerSeconds)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-800 block">Words Found</span>
            <span className="font-serif font-bold text-emerald-900 text-sm">
              {foundWords.length} / {HEALTH_WORDS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {isComplete && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
          <h4 className="font-serif font-bold text-emerald-900 text-base">
            All Medical Words Discovered! +50 Bonus Points!
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Brilliant visual scanning! You located all 7 wellness keywords in {formatTime(timerSeconds)}.
          </p>
        </div>
      )}

      {/* Grid + Words Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Word Grid (7 cols) */}
        <div className="lg:col-span-7 select-none">
          <div className="p-3 bg-[#EFF5EE] rounded-3xl border-2 border-pale-sage shadow-inner max-w-[380px] mx-auto">
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {grid.map((row, r) =>
                row.map((letter, c) => {
                  const isSelected = isCellSelected(r, c)
                  const foundColor = getFoundWordColorForCell(r, c)

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      className={`aspect-square rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all border ${
                        isSelected
                          ? 'bg-forest-green text-white scale-105 shadow-md border-forest-green'
                          : foundColor
                          ? `${foundColor} font-black scale-[0.98]`
                          : 'bg-white hover:bg-emerald-50/60 text-stone-800 border-pale-sage/60 hover:scale-105'
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          <p className="text-[11px] text-text-secondary text-center mt-2">
            Click first letter, then click last letter of word (horizontal, vertical, or diagonal).
          </p>
        </div>

        {/* Word Target Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <h4 className="text-xs font-bold text-forest-green uppercase tracking-wider mb-2">
            Hidden Health Words ({foundWords.length}/{HEALTH_WORDS.length}):
          </h4>

          <div className="space-y-2">
            {HEALTH_WORDS.map(item => {
              const isFound = foundWords.includes(item.word)

              return (
                <div
                  key={item.word}
                  className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isFound
                      ? 'bg-emerald-50/80 border-emerald-300 opacity-90'
                      : 'bg-[#FAFBF9] border-pale-sage'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      isFound ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isFound ? <Check className="w-3 h-3" /> : '•'}
                  </div>

                  <div>
                    <span
                      className={`text-xs font-serif font-bold tracking-wider ${
                        isFound ? 'line-through text-emerald-800' : 'text-stone-900'
                      }`}
                    >
                      {item.word}
                    </span>
                    <p className="text-[10px] text-text-secondary mt-0.5 leading-snug">
                      {item.hint}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={generateGrid}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Puzzle</span>
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

