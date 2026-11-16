import React, { useState, useEffect } from 'react'
import { Sparkles, RotateCcw, User, Bot, Trophy, Volume2, VolumeX, ShieldCheck } from 'lucide-react'
import { playGameSound } from './gameSounds'
import confetti from 'canvas-confetti'

interface TicTacToeProps {
  onAwardPoints: (points: number, reason: string) => void
  soundEnabled: boolean
  soundVolume: number
  onBackToArcade?: () => void
}

type Player = 'X' | 'O'
type BoardState = (Player | null)[]

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

export default function TicTacToeGame({
  onAwardPoints,
  soundEnabled,
  soundVolume,
  onBackToArcade
}: TicTacToeProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState<boolean>(true)
  const [gameMode, setGameMode] = useState<'ai' | 'pvp'>('ai')
  const [aiDifficulty, setAiDifficulty] = useState<'normal' | 'smart'>('smart')
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  
  // Score record
  const [scores, setScores] = useState({ x: 0, o: 0, draws: 0 })
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false)

  // Check for winner
  const checkWinner = (currentBoard: BoardState): { winner: Player | 'draw' | null; line: number[] | null } => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a] as Player, line: combo }
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null }
    }
    return { winner: null, line: null }
  }

  // AI Move calculation
  const getAiMove = (currentBoard: BoardState): number => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null)

    if (emptyIndices.length === 0) return -1

    if (aiDifficulty === 'smart') {
      // 1. Can AI (O) win in 1 move?
      for (const idx of emptyIndices) {
        const copy = [...currentBoard]
        copy[idx] = 'O'
        if (checkWinner(copy).winner === 'O') return idx
      }

      // 2. Can Player (X) win in 1 move? Block them!
      for (const idx of emptyIndices) {
        const copy = [...currentBoard]
        copy[idx] = 'X'
        if (checkWinner(copy).winner === 'X') return idx
      }

      // 3. Take center if available
      if (emptyIndices.includes(4)) return 4

      // 4. Take corners
      const corners = [0, 2, 6, 8].filter(c => emptyIndices.includes(c))
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)]
      }
    }

    // Default or normal difficulty: pick smart or random
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
  }

  // Handle player click
  const handleClick = (index: number) => {
    if (board[index] || winner) return

    // If AI mode and it's AI turn, ignore clicks
    if (gameMode === 'ai' && !isXNext) return

    const newBoard = [...board]
    const currentPlayer = isXNext ? 'X' : 'O'
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    playGameSound('click', soundEnabled, soundVolume)

    const result = checkWinner(newBoard)
    if (result.winner) {
      handleGameOver(result.winner, result.line)
      return
    }

    setIsXNext(!isXNext)
  }

  // Trigger AI turn
  useEffect(() => {
    if (gameMode === 'ai' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const aiIndex = getAiMove(board)
        if (aiIndex !== -1) {
          const newBoard = [...board]
          newBoard[aiIndex] = 'O'
          setBoard(newBoard)
          playGameSound('click', soundEnabled, soundVolume)

          const result = checkWinner(newBoard)
          if (result.winner) {
            handleGameOver(result.winner, result.line)
          } else {
            setIsXNext(true)
          }
        }
      }, 420)
      return () => clearTimeout(timer)
    }
  }, [isXNext, gameMode, winner, board])

  const handleGameOver = (winResult: Player | 'draw', line: number[] | null) => {
    setWinner(winResult)
    setWinningLine(line)

    if (winResult === 'X') {
      setScores(prev => ({ ...prev, x: prev.x + 1 }))
      playGameSound('win', soundEnabled, soundVolume)
      if (!hasAwardedPoints) {
        onAwardPoints(25, 'Tic-Tac-Toe Victory!')
        setHasAwardedPoints(true)
      }
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } })
      } catch {}
    } else if (winResult === 'O') {
      setScores(prev => ({ ...prev, o: prev.o + 1 }))
      playGameSound(gameMode === 'ai' ? 'wrong' : 'win', soundEnabled, soundVolume)
    } else {
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }))
      playGameSound('match', soundEnabled, soundVolume)
    }
  }

  const restartRound = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setWinner(null)
    setWinningLine(null)
    setHasAwardedPoints(false)
    playGameSound('start', soundEnabled, soundVolume)
  }

  return (
    <div className="bg-white rounded-3xl border border-pale-sage p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pale-sage/60">
        <div>
          <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Interactive Logic Arcade
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest-green mt-1">
            Tic-Tac-Toe (O & X)
          </h2>
          <p className="text-xs text-text-secondary">
            Align 3 marks horizontally, vertically, or diagonally.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EFF5EE] rounded-2xl border border-pale-sage shrink-0">
          <button
            type="button"
            onClick={() => {
              setGameMode('ai')
              restartRound()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              gameMode === 'ai'
                ? 'bg-forest-green text-white shadow-xs'
                : 'text-stone-600 hover:text-forest-green'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGameMode('pvp')
              restartRound()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              gameMode === 'pvp'
                ? 'bg-forest-green text-white shadow-xs'
                : 'text-stone-600 hover:text-forest-green'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2-Player</span>
          </button>
        </div>
      </div>

      {/* Scoreboard Bar */}
      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className={`p-3 rounded-2xl border transition-all ${
          isXNext && !winner ? 'bg-[#E8F1EB] border-forest-green/40' : 'bg-[#FAFBF9] border-pale-sage'
        }`}>
          <div className="flex items-center justify-center gap-1 text-forest-green font-bold text-xs">
            <span>Player X</span>
            {gameMode === 'ai' && <span className="text-[10px] text-text-secondary">(You)</span>}
          </div>
          <div className="text-xl font-serif font-bold text-forest-green mt-0.5">{scores.x}</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#FAFBF9] border border-pale-sage">
          <div className="text-xs font-semibold text-stone-500">Draws</div>
          <div className="text-xl font-serif font-bold text-stone-700 mt-0.5">{scores.draws}</div>
        </div>

        <div className={`p-3 rounded-2xl border transition-all ${
          !isXNext && !winner ? 'bg-emerald-50 border-emerald-400/50' : 'bg-[#FAFBF9] border-pale-sage'
        }`}>
          <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-xs">
            <span>Player O</span>
            {gameMode === 'ai' && <span className="text-[10px] text-emerald-600">(AI)</span>}
          </div>
          <div className="text-xl font-serif font-bold text-emerald-800 mt-0.5">{scores.o}</div>
        </div>
      </div>

      {/* Turn or Result Status Banner */}
      <div className="mb-6 text-center">
        {winner ? (
          <div className={`py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-2 animate-in fade-in duration-300 ${
            winner === 'X'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : winner === 'O'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-stone-100 text-stone-800 border border-stone-300'
          }`}>
            <Trophy className="w-4 h-4 text-emerald-700" />
            <span>
              {winner === 'X'
                ? 'Player X Wins! +25 Health Points Earned!'
                : winner === 'O'
                ? (gameMode === 'ai' ? 'Computer Doctor Wins! Better luck next round!' : 'Player O Wins!')
                : "It's a Draw! Well played both sides."}
            </span>
          </div>
        ) : (
          <div className="text-xs text-text-secondary flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Current Turn:{' '}
              <strong className="text-forest-green">
                {isXNext ? 'Player X (Green Cross)' : gameMode === 'ai' ? 'Computer thinking...' : 'Player O (Emerald Circle)'}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* 3x3 Grid Board */}
      <div className="w-full max-w-[340px] mx-auto aspect-square grid grid-cols-3 gap-3 p-3 bg-[#EFF5EE] rounded-3xl border-2 border-pale-sage shadow-inner">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(idx)}
              disabled={!!cell || !!winner || (gameMode === 'ai' && !isXNext)}
              className={`relative rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-serif font-bold transition-all select-none shadow-2xs ${
                cell
                  ? isWinningCell
                    ? 'bg-emerald-500 text-white scale-105 shadow-md border-2 border-emerald-600'
                    : 'bg-white text-forest-green border border-pale-sage'
                  : 'bg-white/80 hover:bg-white text-transparent border border-pale-sage/60 hover:border-forest-green/40 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              {cell === 'X' && (
                <span className={`animate-in zoom-in-75 duration-200 ${isWinningCell ? 'text-white' : 'text-[#1B3E2F]'}`}>
                  ✕
                </span>
              )}
              {cell === 'O' && (
                <span className={`animate-in zoom-in-75 duration-200 ${isWinningCell ? 'text-white' : 'text-[#059669]'}`}>
                  ○
                </span>
              )}
              {!cell && !winner && (
                <span className="opacity-0 group-hover:opacity-20 text-stone-300 text-2xl">
                  {isXNext ? '✕' : '○'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-pale-sage/60">
        <button
          type="button"
          onClick={restartRound}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{winner ? 'Play Again' : 'Reset Board'}</span>
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

