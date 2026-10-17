import React, { useState, useEffect } from 'react'
import { 
  PlayIcon, 
  TrophyIcon, 
  FireIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon,
  PauseIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface Node {
  id: number
  x: number
  y: number
  value: number
  connected: boolean
  selected: boolean
}

interface Puzzle {
  gridSize: number
  path: number[]
  nodes: Node[]
  difficulty: string
}

export default function DailyZipChallenge() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'game'>('dashboard')
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null)
  const [selectedNodes, setSelectedNodes] = useState<number[]>([])
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [hintMode, setHintMode] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'completed' | 'won'>('playing')
  const [streakCompleted, setStreakCompleted] = useState(false)
  
  const { 
    userStreak,
    userPoints,
    completeLesson,
    setUserStreak,
    setUserPoints
  } = useData()

  const [currentStreak, setCurrentStreak] = useState(userStreak)
  const [bestStreak, setBestStreak] = useState(14)
  const [todayDate, setTodayDate] = useState(new Date().toDateString())

  // Initialize streak completion check
  useEffect(() => {
    const completedDate = localStorage.getItem('clinicops_zip_daily_completed')
    if (completedDate === todayDate) {
      setStreakCompleted(true)
    }
    const storedBest = localStorage.getItem('clinicops_zip_best_streak')
    if (storedBest) {
      setBestStreak(parseInt(storedBest))
    }
  }, [todayDate])

  // Generate a solvable puzzle
  const generatePuzzle = (day: number): Puzzle => {
    let gridSize = 4
    let numNodes = 16
    
    if (day >= 3) { gridSize = 4; numNodes = 20 }
    if (day >= 5) { gridSize = 5; numNodes = 25 }
    if (day >= 7) { gridSize = 5; numNodes = 30 }
    if (day >= 10) { gridSize = 6; numNodes = 36 }
    if (day >= 14) { gridSize = 6; numNodes = 42 }

    const positions = new Set<string>()
    while (positions.size < numNodes) {
      const x = Math.floor(Math.random() * gridSize)
      const y = Math.floor(Math.random() * gridSize)
      positions.add(`${x},${y}`)
    }
    
    const positionList = Array.from(positions).map(pos => {
      const [x, y] = pos.split(',').map(Number)
      return { x, y }
    })

    const path: number[] = []
    const usedPositions = new Set<string>()
    let startX = Math.floor(gridSize / 2)
    let startY = Math.floor(gridSize / 2)
    
    path.push(1)
    usedPositions.add(`${startX},${startY}`)
    let lastX = startX
    let lastY = startY

    for (let i = 2; i <= numNodes; i++) {
      let validMoveFound = false
      let attempts = 0
      
      while (!validMoveFound && attempts < 100) {
        const directions = [
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
        ]
        
        for (let j = directions.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1))
          [directions[j], directions[k]] = [directions[k], directions[j]]
        }
        
        for (const dir of directions) {
          const newX = lastX + dir.dx
          const newY = lastY + dir.dy
          
          if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            const posKey = `${newX},${newY}`
            if (!usedPositions.has(posKey)) {
              path.push(i)
              usedPositions.add(posKey)
              lastX = newX
              lastY = newY
              validMoveFound = true
              break
            }
          }
        }
        attempts++
      }
      
      if (!validMoveFound) {
        path.pop()
        break
      }
    }

    const pathSet = new Set(path)
    const shuffledPath = [...path].sort(() => Math.random() - 0.5)
    
    let nodeIndex = 0
    const nodes: Node[] = []
    
    for (const pos of positionList) {
      if (nodeIndex < path.length) {
        nodes.push({
          id: nodeIndex + 1,
          x: pos.x,
          y: pos.y,
          value: path[nodeIndex],
          connected: false,
          selected: false
        })
      }
      nodeIndex++
    }

    nodes.sort((a, b) => a.value - b.value)

    return {
      gridSize,
      path: path,
      nodes,
      difficulty: day >= 10 ? 'Hard' : day >= 5 ? 'Medium' : 'Easy'
    }
  }

  const loadTodayPuzzle = () => {
    const storedPuzzle = localStorage.getItem('clinicops_zip_daily_puzzle')
    const storedDate = localStorage.getItem('clinicops_zip_daily_date')
    const day = currentStreak + 1
    
    if (storedPuzzle && storedDate === todayDate) {
      setCurrentPuzzle(JSON.parse(storedPuzzle))
    } else {
      const puzzle = generatePuzzle(day)
      setCurrentPuzzle(puzzle)
      localStorage.setItem('clinicops_zip_daily_puzzle', JSON.stringify(puzzle))
      localStorage.setItem('clinicops_zip_daily_date', todayDate)
    }
    
    setCurrentStep(1)
    setSelectedNodes([])
    setPathPoints([])
    setMoves(0)
    setTimeElapsed(0)
    setHintMode(false)
    setGameStatus('playing')
  }

  const startGame = () => {
    const storedPuzzle = localStorage.getItem('clinicops_zip_daily_puzzle')
    const storedDate = localStorage.getItem('clinicops_zip_daily_date')
    const day = currentStreak + 1
    
    let puzzle: Puzzle
    
    if (storedPuzzle && storedDate === todayDate) {
      puzzle = JSON.parse(storedPuzzle)
    } else {
      puzzle = generatePuzzle(day)
      localStorage.setItem('clinicops_zip_daily_puzzle', JSON.stringify(puzzle))
      localStorage.setItem('clinicops_zip_daily_date', todayDate)
    }
    
    setCurrentPuzzle(puzzle)
    setCurrentStep(1)
    setSelectedNodes([])
    setPathPoints([])
    setMoves(0)
    setTimeElapsed(0)
    setHintMode(false)
    setGameStatus('playing')
    setActiveTab('game')
  }

  const getNodePosition = (x: number, y: number, gridSize: number) => {
    const cellSize = 80
    const padding = 40
    const centerX = (gridSize * cellSize + padding * 2) / 2 + (x - (gridSize - 1) / 2) * cellSize
    const centerY = (gridSize * cellSize + padding * 2) / 2 + (y - (gridSize - 1) / 2) * cellSize
    return { x: centerX, y: centerY }
  }

  const handleNodeClick = (node: Node) => {
    if (gameStatus !== 'playing') return
    
    if (node.value !== currentStep) return
    
    const nodePos = getNodePosition(node.x, node.y, currentPuzzle!.gridSize)
    setPathPoints(prev => [...prev, nodePos])

    const newNodes = currentPuzzle!.nodes.map(n => 
      n.id === node.id ? { ...n, selected: true, connected: true } : n
    )
    setCurrentPuzzle({ ...currentPuzzle!, nodes: newNodes })
    setSelectedNodes(prev => [...prev, node.id])

    setCurrentStep(prev => prev + 1)
    setMoves(prev => prev + 1)

    if (currentStep === currentPuzzle!.path.length) {
      completeLevel()
    }
  }

  const completeLevel = () => {
    const score = Math.max(100 - moves * 2 - Math.floor(timeElapsed / 60), 50)
    const newStreak = currentStreak + 1
    
    if (newStreak > bestStreak) {
      setBestStreak(newStreak)
      localStorage.setItem('clinicops_zip_best_streak', newStreak.toString())
    }
    
    localStorage.setItem('clinicops_zip_daily_completed', todayDate)
    setStreakCompleted(true)
    setCurrentStreak(newStreak)
    setUserStreak(newStreak)
    
    const pointsEarned = Math.round(score / 5)
    setUserPoints(userPoints + pointsEarned)
    completeLesson('zip-challenge', score)
    
    setShowCompletion(true)
    setGameStatus('won')
  }

  const undoMove = () => {
    if (pathPoints.length === 0 || gameStatus !== 'playing') return
    
    const lastNodeId = selectedNodes[selectedNodes.length - 1]
    const lastNode = currentPuzzle!.nodes.find(n => n.id === lastNodeId)
    
    if (lastNode) {
      const newNodes = currentPuzzle!.nodes.map(n => 
        n.id === lastNodeId ? { ...n, selected: false, connected: false } : n
      )
      setCurrentPuzzle({ ...currentPuzzle!, nodes: newNodes })
      
      const newPathPoints = [...pathPoints]
      newPathPoints.pop()
      setPathPoints(newPathPoints)
      
      setSelectedNodes(prev => prev.slice(0, -1))
      setCurrentStep(prev => prev - 1)
      setMoves(prev => Math.max(0, prev - 1))
    }
  }

  const restartGame = () => {
    loadTodayPuzzle()
    setShowPauseModal(false)
  }

  const togglePause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused')
      setShowPauseModal(true)
    } else if (gameStatus === 'paused') {
      setGameStatus('playing')
      setShowPauseModal(false)
    }
  }

  useEffect(() => {
    if (gameStatus === 'playing') {
      const interval = setInterval(() => setTimeElapsed(prev => prev + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [gameStatus])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      {activeTab === 'dashboard' && (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-forest-green">Daily Zip Challenge</h1>
              <p className="text-text-secondary">Complete today's path to keep your streak alive</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <FireIcon className="w-6 h-6 text-yellow-500" />
                <div>
                  <div className="font-bold text-lg text-yellow-700">{currentStreak} Days</div>
                  <div className="text-xs text-yellow-600">Current Streak</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2 bg-forest-green text-white rounded-lg shadow-card">
                <TrophyIcon className="w-6 h-6" />
                <div>
                  <div className="font-bold text-lg">{bestStreak}</div>
                  <div className="text-xs opacity-80">Best Streak</div>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-card hover:shadow-card-hover p-8 border border-pale-sage mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold mb-2 text-forest-green">Daily Zip Challenge</h2>
                <p className="text-text-secondary mb-4">Connect numbered points in sequence to complete the path</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-forest-green mb-1">
                  {streakCompleted ? '✅' : `Day ${currentStreak + 1}`}
                </div>
                <div className="text-sm text-text-secondary">Daily Challenge</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-light-green rounded-lg p-4 text-center border border-pale-sage">
                <div className="text-2xl font-bold text-forest-green mb-1">{currentStreak}</div>
                <div className="text-sm text-text-secondary">Current Streak</div>
              </div>
              <div className="bg-light-green rounded-lg p-4 text-center border border-pale-sage">
                <div className="text-2xl font-bold text-forest-green mb-1">{bestStreak}</div>
                <div className="text-sm text-text-secondary">Best Streak</div>
              </div>
              <div className="bg-light-green rounded-lg p-4 text-center border border-pale-sage">
                <div className="text-2xl font-bold text-forest-green mb-1">{streakCompleted ? 'Done' : '-'}</div>
                <div className="text-sm text-text-secondary">Today's Status</div>
              </div>
            </div>

            {streakCompleted ? (
              <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-700 mb-2">Daily Challenge Complete!</h3>
                <p className="text-green-600 mb-4">You've completed today's path!</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-6 py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600"
                >
                  Review Challenge
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startGame}
                className="w-full py-4 bg-forest-green text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
              >
                <PlayIcon className="w-6 h-6 inline mr-2" />
                Start Challenge
              </motion.button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-light-green rounded-xl p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-3 text-forest-green">How to Play</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="text-forest-green font-bold">•</span>
                <span>Connect numbered points in sequence: 1 → 2 → 3 → ... → 16</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-forest-green font-bold">•</span>
                <span>Each number must connect to the next number in sequence</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-forest-green font-bold">•</span>
                <span>Use Undo to correct mistakes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-forest-green font-bold">•</span>
                <span>Complete the path to earn points and maintain your streak</span>
              </li>
            </ul>
          </motion.div>
        </>
      )}

      {activeTab === 'game' && currentPuzzle && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('dashboard')
                setGameStatus('playing')
                setShowPauseModal(false)
                setShowCompletion(false)
                setPathPoints([])
                setSelectedNodes([])
                setCurrentStep(1)
                setMoves(0)
                setTimeElapsed(0)
              }}
              className="flex items-center space-x-2 text-forest-green hover:text-green-600"
            >
              <XMarkIcon className="w-5 h-5" />
              <span>Exit Game</span>
            </button>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-text-secondary">Step</div>
                <div className="text-2xl font-bold text-forest-green">{currentStep}/{currentPuzzle.path.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-text-secondary">Time</div>
                <div className="text-2xl font-bold text-forest-green">{formatTime(timeElapsed)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-text-secondary">Moves</div>
                <div className="text-2xl font-bold text-forest-green">{moves}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={togglePause}
                className="p-2 bg-pale-sage text-forest-green rounded-lg hover:bg-pale-sage/80"
              >
                {gameStatus === 'paused' ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={restartGame}
                className="p-2 bg-pale-sage text-forest-green rounded-lg hover:bg-pale-sage/80"
              >
                <RefreshIcon className="w-5 h-5" />
              </button>
              <button
                onClick={undoMove}
                className={`p-2 rounded-lg hover:bg-pale-sage/80 ${pathPoints.length === 0 ? 'opacity-50 cursor-not-allowed' : 'text-forest-green'}`}
                disabled={pathPoints.length === 0 || gameStatus !== 'playing'}
              >
                <UndoIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setHintMode(true)}
                className={`p-2 rounded-lg hover:bg-pale-sage/80 ${gameStatus !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'text-forest-green'}`}
                disabled={gameStatus !== 'playing'}
              >
                <LightBulbIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <motion.div 
            className="bg-cream rounded-xl p-8 shadow-card border border-pale-sage flex justify-center"
          >
            <div className="relative">
              <div 
                className="relative"
                style={{
                  width: currentPuzzle.gridSize * 80 + 80,
                  height: currentPuzzle.gridSize * 80 + 80
                }}
              >
                <svg 
                  className="absolute inset-0 pointer-events-none overflow-visible"
                  width={currentPuzzle.gridSize * 80 + 80}
                  height={currentPuzzle.gridSize * 80 + 80}
                >
                  <path
                    d={`M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-60"
                  />
                </svg>

                {hintMode && currentStep <= currentPuzzle.nodes.length && (
                  <div className="absolute animate-bounce">
                    <div className="bg-green-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10">
                      <span className="font-bold">{currentStep}</span>
                    </div>
                  </div>
                )}

                {currentPuzzle.nodes.map((node) => {
                  const pos = getNodePosition(node.x, node.y, currentPuzzle.gridSize)
                  const isSelected = node.selected
                  const isNextHint = hintMode && node.value === currentStep

                  return (
                    <motion.button
                      key={node.id}
                      whileHover={!isSelected && gameStatus === 'playing' ? { scale: 1.1 } : {}}
                      whileTap={!isSelected && gameStatus === 'playing' ? { scale: 0.9 } : {}}
                      onClick={() => handleNodeClick(node)}
                      disabled={gameStatus !== 'playing' || isSelected}
                      className={`absolute w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        isSelected 
                          ? 'bg-green-500 text-white scale-110 ring-4 ring-green-200' 
                          : isNextHint
                            ? 'bg-green-400 text-white scale-125 ring-4 ring-green-200 animate-pulse'
                            : 'bg-white text-forest-green hover:bg-light-green'
                      }`}
                      style={{
                        left: pos.x - 28,
                        top: pos.y - 28,
                        zIndex: isSelected ? 10 : isNextHint ? 20 : 5
                      }}
                    >
                      <span className="font-bold text-lg">{node.value}</span>
                    </motion.button>
                  )
                })}
              </div>

              {gameStatus === 'paused' && (
                <div className="mt-6 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="px-6 py-3 bg-forest-green text-white rounded-lg font-bold"
                  >
                    Resume
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showPauseModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6"
          >
            <h2 className="text-2xl font-serif font-bold mb-4 text-forest-green text-center">Game Paused</h2>
            <div className="space-y-4 text-center">
              <p className="text-text-secondary">Ready to continue your daily challenge?</p>
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                  className="px-6 py-3 bg-forest-green text-white rounded-lg font-bold"
                >
                  Resume
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="px-6 py-3 bg-pale-sage text-white rounded-lg font-bold"
                >
                  Restart
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showCompletion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-serif font-bold mb-2 text-forest-green">Challenge Complete!</h2>
            <p className="text-text-secondary mb-6">You've successfully completed today's daily challenge.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Time</div>
                <div className="text-2xl font-bold text-green-700">{formatTime(timeElapsed)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Moves</div>
                <div className="text-2xl font-bold text-green-700">{moves}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Score</div>
                <div className="text-2xl font-bold text-green-700">{Math.max(100 - moves * 2 - Math.floor(timeElapsed / 60), 50)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Points</div>
                <div className="text-2xl font-bold text-green-700">
                  {Math.round((Math.max(100 - moves * 2 - Math.floor(timeElapsed / 60), 50)) / 5)}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FireIcon className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-forest-green">Streak: {currentStreak} Days</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowCompletion(false)
                setActiveTab('dashboard')
              }}
              className="w-full py-3 bg-forest-green text-white rounded-lg font-bold text-lg hover:bg-green-600"
            >
              Continue to Dashboard
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
