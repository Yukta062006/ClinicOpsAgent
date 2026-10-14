import React, { useState, useEffect, useRef } from 'react'
import { 
  PlayIcon, 
  TrophyIcon, 
  FireIcon,
  CheckBadgeIcon,
  ClockIcon,
  HeartIcon,
  PuzzlePieceIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import confetti from 'canvas-confetti'

interface Game {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: string
  category: string
  plays: number
  highScore: number
  type: 'memory' | 'matching' | 'puzzle' | 'sorting' | 'quiz'
  icon: React.ReactNode
}

interface GameResult {
  score: number
  moves: number
  time: number
  correct: number
  incorrect: number
  completed: boolean
}

interface GameStats {
  totalGamesPlayed: number
  totalPoints: number
  currentStreak: number
  highestScore: number
  gamesCompleted: number
}

// Sound effects using Web Audio API
const playSound = (type: 'correct' | 'incorrect' | 'win' | 'flip' | 'match', soundEnabled: boolean) => {
  if (!soundEnabled) return
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  if (type === 'correct') {
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  } else if (type === 'incorrect') {
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  } else if (type === 'win') {
    // Celebration sound
    const now = audioContext.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]
    notes.forEach((note, i) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.type = 'triangle'
      osc.frequency.value = note
      gain.gain.setValueAtTime(0.2, now + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.4)
    })
  } else if (type === 'flip') {
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } else if (type === 'match') {
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  }
}

export default function HealthGames() {
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'achievements'>('home')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const { 
    games, 
    userScores, 
    saveGameScore,
    userPoints,
    userStreak,
    achievements,
    completeLesson,
    soundEnabled
  } = useData()

  const [highScores, setHighScores] = useState<Record<string, number>>({})
  const [currentGameType, setCurrentGameType] = useState<string>('')

  useEffect(() => {
    setHighScores(userScores)
  }, [userScores])

  const gamesList: Game[] = [
    {
      id: 'memory-match',
      title: 'Memory Match',
      description: 'Match medical symbols in this classic memory game. Find all pairs with the fewest moves!',
      difficulty: 'medium',
      duration: '5 min',
      category: 'Memory',
      plays: 1542,
      highScore: 95,
      type: 'memory',
      icon: <PuzzlePieceIcon className="w-8 h-8" />
    },
    {
      id: 'healthy-foods',
      title: 'Healthy Food Match',
      description: 'Match foods with their nutritional benefits. Learn to make better food choices!',
      difficulty: 'easy',
      duration: '8 min',
      category: 'Nutrition',
      plays: 2387,
      highScore: 88,
      type: 'matching',
      icon: <HeartIcon className="w-8 h-8" />
    },
    {
      id: 'anatomy-puzzle',
      title: 'Anatomy Puzzle',
      description: 'Put the body parts in the correct order to complete the anatomy puzzle.',
      difficulty: 'medium',
      duration: '10 min',
      category: 'Anatomy',
      plays: 1876,
      highScore: 92,
      type: 'puzzle',
      icon: <CheckBadgeIcon className="w-8 h-8" />
    },
    {
      id: 'first-aid',
      title: 'First Aid Challenge',
      description: 'Test your first aid knowledge with real-life scenarios and emergencies.',
      difficulty: 'hard',
      duration: '15 min',
      category: 'Emergency Care',
      plays: 892,
      highScore: 96,
      type: 'quiz',
      icon: <HeartIcon className="w-8 h-8" />
    },
    {
      id: 'healthy-habits',
      title: 'Healthy Habits Sorting',
      description: 'Sort daily activities into healthy and unhealthy categories.',
      difficulty: 'easy',
      duration: '10 min',
      category: 'Lifestyle',
      plays: 3124,
      highScore: 100,
      type: 'sorting',
      icon: <FireIcon className="w-8 h-8" />
    },
    {
      id: 'medical-words',
      title: 'Medical Word Puzzle',
      description: 'Form medical terms from given word fragments and definitions.',
      difficulty: 'hard',
      duration: '12 min',
      category: 'Medical Terms',
      plays: 678,
      highScore: 94,
      type: 'puzzle',
      icon: <CheckBadgeIcon className="w-8 h-8" />
    }
  ]

  const stats: GameStats = {
    totalGamesPlayed: gamesList.reduce((acc, g) => acc + g.plays, 0),
    totalPoints: userPoints,
    currentStreak: userStreak,
    highestScore: Math.max(...Object.values(highScores), 0),
    gamesCompleted: 0 // Will be updated based on achievements
  }

  const startGame = () => {
    setIsPlaying(true)
    setScore(0)
    
    // Clear confetti canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setScore(prev => prev + 10)
      // Trigger confetti for correct answers
      triggerConfetti()
    }
  }

  const finishGame = () => {
    setIsPlaying(false)
    
    if (score > 0 && selectedGame) {
      saveGameScore(selectedGame.id, score)
      completeLesson(selectedGame.id, score)
      
      // Calculate points earned
      const pointsEarned = Math.round(score / 10)
      if (pointsEarned > 0) {
        triggerConfetti()
        setTimeout(() => {
          alert(`Game Over! You scored ${score} points and earned ${pointsEarned} points!`)
        }, 500)
      }
    }
    
    setScore(0)
  }

  const triggerConfetti = (x?: number, y?: number) => {
    const duration = 1500
    const end = Date.now() + duration

    const frame = () => {
      if (Date.now() > end) return

      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Left confetti
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            zIndex: 1000,
            canvas: canvas
          })
          // Right confetti
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            zIndex: 1000,
            canvas: canvas
          })
        }
      }

      requestAnimationFrame(frame)
    }

    frame()
  }

  // ============ GAME 1: MEMORY MATCH ============
  const [memoryCards, setMemoryCards] = useState<{ id: number; content: string; flipped: boolean; matched: boolean }[]>([])
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryStartTime, setMemoryStartTime] = useState<number>(0)
  const [memoryTime, setMemoryTime] = useState(0)
  const [memoryTimerActive, setMemoryTimerActive] = useState(false)

  const startMemoryGame = () => {
    const cards = [
      { id: 1, content: '🩺' },
      { id: 2, content: '🩺' },
      { id: 3, content: '💊' },
      { id: 4, content: '💊' },
      { id: 5, content: '🏥' },
      { id: 6, content: '🏥' },
      { id: 7, content: '🩹' },
      { id: 8, content: '🩹' },
      { id: 9, content: '🩻' },
      { id: 10, content: '🩻' },
      { id: 11, content: '🩼' },
      { id: 12, content: '🩼' },
    ]

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      [cards[i], cards[j]] = [cards[j], cards[i]]
    }

    setMemoryCards(cards.map(c => ({ ...c, flipped: false, matched: false })))
    setSelectedCards([])
    setMemoryMoves(0)
    setMemoryStartTime(Date.now())
    setMemoryTime(0)
    setMemoryTimerActive(true)
  }

  const flipCard = (id: number) => {
    if (selectedCards.length >= 2 || memoryCards.find(c => c.id === id)?.matched || memoryCards.find(c => c.id === id)?.flipped) {
      return
    }

    playSound('flip', soundEnabled)
    const newCards = memoryCards.map(c => 
      c.id === id ? { ...c, flipped: true } : c
    )
    setMemoryCards(newCards)
    setSelectedCards(prev => [...prev, id])

    if (selectedCards.length === 1) {
      const firstCard = memoryCards.find(c => c.id === selectedCards[0])
      const secondCard = newCards.find(c => c.id === id)

      if (firstCard && secondCard && firstCard.content === secondCard.content) {
        // Match found
        playSound('match', soundEnabled)
        triggerConfetti()
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            c.id === firstCard.id || c.id === secondCard.id 
              ? { ...c, matched: true, flipped: false } 
              : c
          ))
          setSelectedCards([])
          setMemoryMoves(prev => prev + 1)
          
          // Check if all matched
          if (newCards.every(c => c.matched)) {
            setMemoryTimerActive(false)
            playSound('win', soundEnabled)
            setTimeout(() => {
              const timeTaken = Date.now() - memoryStartTime
              const finalScore = Math.max(100 - memoryMoves * 5, 50)
              handleGameComplete('memory-match', finalScore, memoryMoves, Math.floor(timeTaken / 1000))
            }, 500)
          }
        }, 300)
      } else {
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            c.id === selectedCards[0] || c.id === id ? { ...c, flipped: false } : c
          ))
          setSelectedCards([])
          setMemoryMoves(prev => prev + 1)
        }, 800)
      }
    }
  }

  // ============ GAME 2: HEALTHY FOOD MATCHING ============
  const [foodCards, setFoodCards] = useState<{ id: number; content: string; type: 'food' | 'benefit'; matched: boolean }[]>([])
  const [selectedFoodCards, setSelectedFoodCards] = useState<number[]>([])
  const [foodMoves, setFoodMoves] = useState(0)

  const startFoodGame = () => {
    const items = [
      { id: 1, content: '🍎', type: 'food', matched: false },
      { id: 2, content: '🥗', type: 'benefit', matched: false }, // Salad
      { id: 3, content: '🥦', type: 'food', matched: false },
      { id: 4, content: '💪', type: 'benefit', matched: false }, // Muscle
      { id: 5, content: '🥛', type: 'food', matched: false },
      { id: 6, content: '🦴', type: 'benefit', matched: false }, // Bone
      { id: 7, content: '🍊', type: 'food', matched: false },
      { id: 8, content: '🛡️', type: 'benefit', matched: false }, // Shield/Immunity
    ]

    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      [items[i], items[j]] = [items[j], items[i]]
    }

    setFoodCards(items)
    setSelectedFoodCards([])
    setFoodMoves(0)
  }

  const handleFoodClick = (id: number) => {
    if (selectedFoodCards.length >= 2 || foodCards.find(c => c.id === id)?.matched) {
      return
    }

    playSound('flip', soundEnabled)
    const newCards = [...foodCards]
    const cardIndex = newCards.findIndex(c => c.id === id)
    const existingIndex = selectedFoodCards.findIndex(sid => foodCards.find(c => c.id === sid)?.type === newCards[cardIndex].type)

    if (existingIndex !== -1 && selectedFoodCards.length === 1) {
      // Same type, mark both as matched
      playSound('match', soundEnabled)
      triggerConfetti()
      newCards[cardIndex] = { ...newCards[cardIndex], matched: true }
      newCards[existingIndex] = { ...newCards[existingIndex], matched: true }
      setFoodCards(newCards)
      setSelectedFoodCards([])
      setFoodMoves(prev => prev + 1)

      if (newCards.every(c => c.matched)) {
        playSound('win', soundEnabled)
        setTimeout(() => {
          handleGameComplete('healthy-foods', Math.max(100 - foodMoves * 8, 60), foodMoves, 0)
        }, 500)
      }
    } else if (selectedFoodCards.length === 1) {
      // Different type, show as selected but wait for second
      setSelectedFoodCards(prev => [...prev, id])
      setTimeout(() => {
        if (selectedFoodCards.length === 1) {
          const secondCardId = selectedFoodCards[0]
          newCards[secondCardId] = { ...newCards[secondCardId], matched: false }
          newCards[cardIndex] = { ...newCards[cardIndex], matched: false }
          setFoodCards(newCards)
          setSelectedFoodCards([])
          setFoodMoves(prev => prev + 1)
        }
      }, 500)
    } else {
      setSelectedFoodCards(prev => [...prev, id])
    }
  }

  // ============ GAME 3: ANATOMY PUZZLE ============
  const [puzzlePieces, setPuzzlePieces] = useState<{ id: number; position: number; correctPosition: number; content: string }[]>([])
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [puzzleStartTime, setPuzzleStartTime] = useState<number>(0)
  const [puzzleTime, setPuzzleTime] = useState(0)

  const startPuzzleGame = () => {
    const pieces = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      position: i,
      correctPosition: i,
      content: ['🧠', '❤️', ' lungs', '🫀', '🦴', '🦵', '🦿', '🦾', '💪'][i]
    }))
    
    // Shuffle positions
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]]
    }
    
    setPuzzlePieces(pieces)
    setSelectedPiece(null)
    setPuzzleStartTime(Date.now())
    setPuzzleTime(0)
  }

  const handlePieceClick = (pieceId: number) => {
    if (selectedPiece === null) {
      setSelectedPiece(pieceId)
      playSound('flip', soundEnabled)
    } else {
      const pieces = [...puzzlePieces]
      const index1 = pieces.findIndex(p => p.id === selectedPiece)
      const index2 = pieces.findIndex(p => p.id === pieceId)
      
      [pieces[index1], pieces[index2]] = [pieces[index2], pieces[index1]]
      setPuzzlePieces(pieces)
      setSelectedPiece(null)

      // Check if solved
      if (pieces.every(p => p.position === p.correctPosition)) {
        playSound('win', soundEnabled)
        setTimeout(() => {
          const timeTaken = Date.now() - puzzleStartTime
          handleGameComplete('anatomy-puzzle', 100, 0, Math.floor(timeTaken / 1000))
        }, 500)
      } else {
        playSound('flip', soundEnabled)
      }
    }
  }

  // ============ GAME 4: FIRST AID QUIZ ============
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizQuestions] = useState([
    {
      question: 'What is the first step in treating a burn?',
      options: ['Apply ice directly', 'Cool with water', 'Pop blisters', 'Apply butter'],
      correct: 1
    },
    {
      question: 'How should you treat a nosebleed?',
      options: ['Tilt head back', 'Pinch nose and lean forward', 'Lie down flat', 'Apply hot compress'],
      correct: 1
    },
    {
      question: 'What is the ratio for CPR compressions to breaths?',
      options: ['15:2', '30:2', '30:5', '15:5'],
      correct: 1
    },
    {
      question: 'When should you use a tourniquet?',
      options: ['For minor cuts', 'For severe bleeding', 'For nosebleeds', 'For burns'],
      correct: 1
    },
    {
      question: 'What should you do for a sprain?',
      options: ['Apply heat immediately', 'Rest and apply ice', 'Massage the area', 'Continue activity'],
      correct: 1
    }
  ])

  const startQuizGame = () => {
    setQuizQuestionIndex(0)
    setQuizScore(0)
    setQuizAnswered(false)
  }

  const handleQuizAnswer = (index: number) => {
    if (quizAnswered) return
    
    playSound(index === quizQuestions[quizQuestionIndex].correct ? 'correct' : 'incorrect', soundEnabled)
    
    if (index === quizQuestions[quizQuestionIndex].correct) {
      setQuizScore(prev => prev + 20)
    }
    
    setQuizAnswered(true)
    
    setTimeout(() => {
      if (quizQuestionIndex < quizQuestions.length - 1) {
        setQuizQuestionIndex(prev => prev + 1)
        setQuizAnswered(false)
      } else {
        playSound('win', soundEnabled)
        handleGameComplete('first-aid', quizScore + (index === quizQuestions[quizQuestionIndex].correct ? 20 : 0), 0, 0)
      }
    }, 1000)
  }

  // ============ GAME 5: HEALTHY HABITS SORTING ============
  const [sortingCards, setSortingCards] = useState<{ id: number; content: string; type: 'healthy' | 'unhealthy' }[]>([])
  const [selectedSortingCard, setSelectedSortingCard] = useState<number | null>(null)
  const [sortingScore, setSortingScore] = useState(0)
  const [sortingMoves, setSortingMoves] = useState(0)

  const startSortingGame = () => {
    const cards = [
      { id: 1, content: '🍎', type: 'healthy' },
      { id: 2, content: '🍔', type: 'unhealthy' },
      { id: 3, content: '🏃', type: 'healthy' },
      { id: 4, content: '📺', type: 'unhealthy' },
      { id: 5, content: '🥗', type: 'healthy' },
      { id: 6, content: '🚬', type: 'unhealthy' },
      { id: 7, content: '💤', type: 'healthy' },
      { id: 8, content: '🍬', type: 'unhealthy' },
    ]

    setSortingCards(cards)
    setSelectedSortingCard(null)
    setSortingScore(0)
    setSortingMoves(0)
  }

  const handleSortingClick = (id: number) => {
    if (selectedSortingCard !== null) {
      // Already selected a card, check if sorting is correct
      const card = sortingCards.find(c => c.id === id)
      const selected = sortingCards.find(c => c.id === selectedSortingCard)
      
      if (card && selected && card.type === selected.type) {
        // Move to sorted section (mark as sorted)
        playSound('match', soundEnabled)
        triggerConfetti()
        setSortingScore(prev => prev + 10)
        
        // Mark as sorted by changing content
        setSortingCards(prev => prev.map(c => c.id === id || c.id === selectedSortingCard 
          ? { ...c, type: c.type === 'healthy' ? 'healthy-sorted' : 'unhealthy-sorted' } 
          : c
        ))
        setSelectedSortingCard(null)
        
        // Check if all sorted
        if (sortingCards.every(c => c.type === 'healthy-sorted' || c.type === 'unhealthy-sorted')) {
          playSound('win', soundEnabled)
          setTimeout(() => {
            handleGameComplete('healthy-habits', sortingScore + 10, 0, 0)
          }, 500)
        }
      } else if (card && selected && card.type !== selected.type) {
        playSound('incorrect', soundEnabled)
        // Error animation
        setSelectedSortingCard(null)
      }
    } else {
      setSelectedSortingCard(id)
      playSound('flip', soundEnabled)
    }
  }

  // ============ GAME 6: MEDICAL WORD PUZZLE ============
  const [wordPuzzleIndex, setWordPuzzleIndex] = useState(0)
  const [wordScore, setWordScore] = useState(0)
  const [wordAnswered, setWordAnswered] = useState(false)
  const [wordWords] = useState([
    {
      question: 'Which word means "inflammation of the lungs"?',
      options: ['Pneumonia', 'Bronchitis', 'Asthma', 'COPD'],
      correct: 0
    },
    {
      question: 'What is the medical term for high blood pressure?',
      options: ['Hypotension', 'Hypertension', 'Arrhythmia', 'Tachycardia'],
      correct: 1
    },
    {
      question: 'Which condition affects blood sugar levels?',
      options: ['Diabetes', 'Hypertension', 'Arthritis', 'Migraine'],
      correct: 0
    }
  ])

  const startWordGame = () => {
    setWordPuzzleIndex(0)
    setWordScore(0)
    setWordAnswered(false)
  }

  const handleWordAnswer = (index: number) => {
    if (wordAnswered) return
    
    playSound(index === wordWords[wordPuzzleIndex].correct ? 'correct' : 'incorrect', soundEnabled)
    
    if (index === wordWords[wordPuzzleIndex].correct) {
      setWordScore(prev => prev + 30)
    }
    
    setWordAnswered(true)
    
    setTimeout(() => {
      if (wordPuzzleIndex < wordWords.length - 1) {
        setWordPuzzleIndex(prev => prev + 1)
        setWordAnswered(false)
      } else {
        playSound('win', soundEnabled)
        handleGameComplete('medical-words', wordScore + (index === wordWords[wordPuzzleIndex].correct ? 30 : 0), 0, 0)
      }
    }, 1000)
  }

  // ============ GAME MANAGEMENT ============
  const handleGameComplete = (gameId: string, finalScore: number, moves: number, time: number) => {
    setGameResult({
      score: finalScore,
      moves,
      time,
      correct: 0,
      incorrect: 0,
      completed: true
    })
    
    setShowCompletion(true)
    triggerConfetti()
    
    // Update high scores
    const currentHigh = highScores[gameId] || 0
    if (finalScore > currentHigh) {
      saveGameScore(gameId, finalScore)
      setHighScores(prev => ({ ...prev, [gameId]: finalScore }))
    }
    
    // Award points
    const pointsEarned = Math.round(finalScore / 10)
    if (pointsEarned > 0) {
      completeLesson(gameId, finalScore)
    }
    
    // Update plays count
    // (In a real app, this would update the game's play count)
  }

  const restartGame = () => {
    setShowCompletion(false)
    setGameResult(null)
    
    if (currentGameType === 'memory') {
      startMemoryGame()
    } else if (currentGameType === 'matching') {
      startFoodGame()
    } else if (currentGameType === 'puzzle') {
      startPuzzleGame()
    } else if (currentGameType === 'quiz') {
      if (selectedGame?.id === 'first-aid') {
        startQuizGame()
      } else if (selectedGame?.id === 'medical-words') {
        startWordGame()
      }
    } else if (currentGameType === 'sorting') {
      startSortingGame()
    }
  }

  const closeGame = () => {
    setShowCompletion(false)
    setGameResult(null)
    setIsPlaying(false)
    setSelectedGame(null)
    setCurrentGameType('')
    // Reset game states when closing
    setMemoryCards([])
    setFoodCards([])
    setPuzzlePieces([])
    setSortingCards([])
    setQuizQuestionIndex(0)
    setWordPuzzleIndex(0)
  }

  // Initialize game data when modal opens
  useEffect(() => {
    if (selectedGame && currentGameType === 'memory') {
      console.log('Initializing Memory Game')
      startMemoryGame()
    }
  }, [selectedGame?.id, currentGameType])

  useEffect(() => {
    if (memoryTimerActive) {
      const interval = setInterval(() => {
        setMemoryTime(Date.now() - memoryStartTime)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [memoryTimerActive, memoryStartTime])

  useEffect(() => {
    if (selectedGame && currentGameType === 'matching') {
      console.log('Initializing Food Game')
      startFoodGame()
    }
  }, [selectedGame?.id, currentGameType])

  useEffect(() => {
    if (selectedGame && currentGameType === 'puzzle') {
      console.log('Initializing Puzzle Game')
      startPuzzleGame()
    }
  }, [selectedGame?.id, currentGameType])

  useEffect(() => {
    if (selectedGame && currentGameType === 'sorting') {
      console.log('Initializing Sorting Game')
      startSortingGame()
    }
  }, [selectedGame?.id, currentGameType])

  useEffect(() => {
    if (selectedGame && currentGameType === 'quiz') {
      console.log('Initializing Quiz Game')
      if (selectedGame.id === 'first-aid') {
        startQuizGame()
      } else if (selectedGame.id === 'medical-words') {
        startWordGame()
      }
    }
  }, [selectedGame?.id, currentGameType])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      {/* Confetti Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-50"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Health Games</h1>
          <p className="text-text-secondary">Learn and have fun while improving your health knowledge</p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <FireIcon className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="font-bold text-yellow-700">{stats.currentStreak} Days</div>
              <div className="text-xs text-yellow-600">Current Streak</div>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 px-4 py-2 bg-forest-green text-white rounded-lg shadow-card"
          >
            <TrophyIcon className="w-6 h-6" />
            <div>
              <div className="font-bold">{stats.totalPoints} pts</div>
              <div className="text-xs opacity-80">Total Points</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pale-sage/30 rounded-lg text-pale-sage">
              <PlayIcon className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-forest-green">{gamesList.length}</span>
          </div>
          <div className="text-lg font-medium text-forest-green">Games Available</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-forest-green">{stats.highestScore}</span>
          </div>
          <div className="text-lg font-medium text-forest-green">Highest Score</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <HeartIcon className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-forest-green">{achievements.filter(a => a.unlocked).length}</span>
          </div>
          <div className="text-lg font-medium text-forest-green">Achievements</div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 bg-warm-cream p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'home' 
                ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover' 
                : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'games' 
                ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover'
                : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
            }`}
          >
            Games
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'achievements' 
                ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover'
                : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
            }`}
          >
            Achievements
          </button>
        </div>
      </div>

      {activeTab === 'home' && (
        <div className="space-y-8">
          {/* Featured Game */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-8 border border-pale-sage"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold mb-2 text-forest-green">Featured Game: Medicine Match</h2>
                <p className="text-text-secondary mb-4 max-w-xl leading-relaxed">
                  Test your medical knowledge by matching terms with definitions. Perfect for healthcare students and professionals!
                </p>
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <span>Difficulty: Medium</span>
                  <span>Duration: 10 min</span>
                  <span>{gamesList[0]?.plays} plays</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedGame(gamesList[0])
                    setCurrentGameType(gamesList[0].type)
                  }}
                  className="mt-6 px-8 py-3 bg-forest-green text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-card hover:shadow-card-hover"
                >
                  Play Now
                </motion.button>
              </div>
              <div className="w-32 h-32 bg-pale-sage/30 rounded-xl flex items-center justify-center">
                <PuzzlePieceIcon className="w-16 h-16 text-pale-sage" />
              </div>
            </div>
          </motion.div>

          {/* Quick Play */}
          <div>
            <h3 className="text-xl font-serif font-bold mb-4 text-forest-green">Quick Play Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesList.slice(1, 4).map((game, index) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedGame(game)
                    setCurrentGameType(game.type)
                  }}
                  className="bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover cursor-pointer border border-pale-sage transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-pale-sage text-white rounded-lg flex items-center justify-center">
                      <PlayIcon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      game.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {game.difficulty}
                    </span>
                  </div>
                  <h4 className="font-bold text-forest-green mb-2">{game.title}</h4>
                  <p className="text-sm text-text-secondary line-clamp-2">{game.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>{game.duration}</span>
                    <span>{game.plays.toLocaleString()} plays</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gamesList.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white rounded-lg shadow-card hover:shadow-card-hover overflow-hidden group border border-pale-sage"
            >
              <div className="h-40 bg-pale-sage/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <PlayIcon className="absolute inset-0 m-auto w-12 h-12 text-white" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    game.difficulty === 'easy' ? 'bg-green-500' :
                    game.difficulty === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {game.difficulty}
                  </span>
                  <span className="ml-2 text-xs opacity-90">{game.duration}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-pale-sage font-medium">{game.category}</span>
                  <span className="text-sm text-text-secondary">{game.plays.toLocaleString()} plays</span>
                </div>
                <h3 className="font-bold text-forest-green mb-2 group-hover:text-pale-sage transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-text-secondary mb-4">{game.description}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedGame(game)
                    setCurrentGameType(game.type)
                  }}
                  className="w-full py-2 bg-pale-sage/50 text-forest-green rounded-lg font-medium hover:bg-forest-green hover:text-white transition-colors"
                >
                  Play Game
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`flex items-center justify-between p-6 rounded-lg border ${
                achievement.unlocked 
                  ? 'bg-yellow-50 text-gray-800 shadow-card hover:shadow-card-hover border-yellow-200' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  achievement.unlocked 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-50 text-gray-400'
                }`}>
                  <TrophyIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-forest-green">{achievement.title}</h3>
                  <p className="text-sm text-text-secondary">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-text-secondary">Unlocked on {achievement.date}</span>
                    </div>
                  )}
                </div>
              </div>
              {achievement.unlocked && (
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrophyIcon className="w-6 h-6 text-yellow-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Game Modal - Memory Match */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'memory' && memoryCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">Memory Match</h2>
                    <p className="text-sm text-text-secondary">Match medical symbols</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green flex items-center justify-around">
                <div className="text-center">
                  <div className="text-sm text-text-secondary">Moves</div>
                  <div className="text-2xl font-bold text-forest-green">{memoryMoves}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-text-secondary">Time</div>
                  <div className="text-2xl font-bold text-forest-green">{Math.floor(memoryTime / 1000)}s</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={startMemoryGame}
                  className="px-4 py-2 bg-pale-sage text-white rounded-lg hover:bg-forest-green"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {memoryCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => flipCard(card.id)}
                      disabled={card.matched || selectedCards.length >= 2 || card.flipped}
                      className={`h-20 rounded-lg flex items-center justify-center text-4xl transition-all ${
                        card.flipped || card.matched
                          ? 'bg-forest-green text-white shadow-md'
                          : 'bg-pale-sage text-forest-green hover:bg-light-green cursor-pointer'
                      }`}
                    >
                      {(card.flipped || card.matched) && card.content}
                    </motion.button>
                  ))}
                </div>
                
                {memoryTimerActive && (
                  <div className="mt-6 text-center">
                    <div className="text-xs text-text-secondary">Timer running...</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modal - Food Matching */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'matching' && foodCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">Healthy Food Match</h2>
                    <p className="text-sm text-text-secondary">Match foods with their benefits</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-text-secondary mb-1">Moves</div>
                  <div className="text-2xl font-bold text-forest-green">{foodMoves}</div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {foodCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFoodClick(card.id)}
                      disabled={card.matched || selectedFoodCards.length >= 2}
                      className={`h-20 rounded-lg flex items-center justify-center text-4xl transition-all ${
                        card.matched
                          ? 'bg-green-100 text-green-700 shadow-inner'
                          : 'bg-pale-sage text-forest-green hover:bg-light-green cursor-pointer'
                      }`}
                    >
                      {card.content}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modal - Anatomy Puzzle */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'puzzle' && selectedGame.id === 'anatomy-puzzle' && puzzlePieces.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">Anatomy Puzzle</h2>
                    <p className="text-sm text-text-secondary">Arrange the pieces correctly</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green text-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={startPuzzleGame}
                  className="px-4 py-2 bg-pale-sage text-white rounded-lg hover:bg-forest-green"
                >
                  <ArrowPathIcon className="w-5 h-5 inline mr-2" />
                  Reset
                </motion.button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {puzzlePieces.map((piece) => (
                    <motion.button
                      key={piece.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePieceClick(piece.id)}
                      className={`h-20 rounded-lg flex items-center justify-center text-3xl transition-colors ${
                        selectedPiece === piece.id
                          ? 'bg-yellow-200 ring-4 ring-yellow-400'
                          : piece.position === piece.correctPosition
                            ? 'bg-green-100'
                            : 'bg-pale-sage text-forest-green'
                      }`}
                    >
                      {piece.content}
                    </motion.button>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-sm text-text-secondary">Tap to select, then tap another to swap</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modal - First Aid Quiz */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'quiz' && selectedGame.id === 'first-aid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">First Aid Challenge</h2>
                    <p className="text-sm text-text-secondary">Question {quizQuestionIndex + 1} of {quizQuestions.length}</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Score</div>
                    <div className="text-3xl font-bold text-forest-green">{quizScore}</div>
                  </div>
                  <div className="w-64">
                    <div className="w-full bg-light-green rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((quizQuestionIndex) / quizQuestions.length) * 100}%` }}
                        className="bg-forest-green h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold mb-6 text-forest-green text-center">
                    {quizQuestions[quizQuestionIndex].question}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {quizQuestions[quizQuestionIndex].options.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuizAnswer(index)}
                        disabled={quizAnswered}
                        className={`p-4 text-left rounded-lg transition-colors ${
                          quizAnswered && index === quizQuestions[quizQuestionIndex].correct
                            ? 'bg-green-100 border-2 border-green-500'
                            : quizAnswered && index !== quizQuestions[quizQuestionIndex].correct
                              ? 'opacity-50'
                              : quizAnswered && index === quizQuestionIndex ? 'bg-red-100 border-2 border-red-500' : 'bg-white border border-gray-200 hover:bg-light-green'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>

                  {quizAnswered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (quizQuestionIndex < quizQuestions.length - 1) {
                            setQuizQuestionIndex(prev => prev + 1)
                            setQuizAnswered(false)
                          } else {
                            playSound('win', soundEnabled)
                            handleGameComplete('first-aid', quizScore, 0, 0)
                          }
                        }}
                        className="px-6 py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        {quizQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Game'}
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modal - Healthy Habits Sorting */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'sorting' && sortingCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">Healthy Habits Sorting</h2>
                    <p className="text-sm text-text-secondary">Sort activities into categories</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-sm text-text-secondary mb-1">Healthy</div>
                  <div className="text-3xl font-bold text-green-600">{sortingScore / 10}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-text-secondary mb-1">Score</div>
                  <div className="text-3xl font-bold text-forest-green">{sortingScore}</div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {sortingCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSortingClick(card.id)}
                      className={`h-20 rounded-lg flex items-center justify-center text-4xl transition-all ${
                        selectedSortingCard === card.id
                          ? 'bg-yellow-200 ring-4 ring-yellow-400'
                          : card.type === 'healthy-sorted'
                            ? 'bg-green-100 text-green-600'
                            : card.type === 'unhealthy-sorted'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-pale-sage text-forest-green hover:bg-light-green cursor-pointer'
                      }`}
                    >
                      {card.content}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-text-secondary">
                    Tap a card to select, then tap another card of the same type
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Modal - Medical Word Puzzle */}
      <AnimatePresence>
        {selectedGame && currentGameType === 'quiz' && selectedGame.id === 'medical-words' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-forest-green">Medical Word Puzzle</h2>
                    <p className="text-sm text-text-secondary">Question {wordPuzzleIndex + 1} of {wordWords.length}</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeGame}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Score</div>
                    <div className="text-3xl font-bold text-forest-green">{wordScore}</div>
                  </div>
                  <div className="w-64">
                    <div className="w-full bg-light-green rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((wordPuzzleIndex) / wordWords.length) * 100}%` }}
                        className="bg-forest-green h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold mb-6 text-forest-green text-center">
                    {wordWords[wordPuzzleIndex].question}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {wordWords[wordPuzzleIndex].options.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleWordAnswer(index)}
                        disabled={wordAnswered}
                        className={`p-4 text-left rounded-lg transition-colors ${
                          wordAnswered && index === wordWords[wordPuzzleIndex].correct
                            ? 'bg-green-100 border-2 border-green-500'
                            : wordAnswered && index !== wordWords[wordPuzzleIndex].correct
                              ? 'opacity-50'
                              : wordAnswered && index === wordPuzzleIndex ? 'bg-red-100 border-2 border-red-500' : 'bg-white border border-gray-200 hover:bg-light-green'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>

                  {wordAnswered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (wordPuzzleIndex < wordWords.length - 1) {
                            setWordPuzzleIndex(prev => prev + 1)
                            setWordAnswered(false)
                          } else {
                            playSound('win', soundEnabled)
                            handleGameComplete('medical-words', wordScore, 0, 0)
                          }
                        }}
                        className="px-6 py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        {wordPuzzleIndex < wordWords.length - 1 ? 'Next Question' : 'Finish Game'}
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Completion Modal */}
      <AnimatePresence>
        {showCompletion && gameResult && selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-pale-sage"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-serif font-bold mb-2 text-forest-green">Game Complete!</h2>
              <p className="text-text-secondary mb-6">You did great!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-light-green p-4 rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Final Score</div>
                  <div className="text-3xl font-bold text-forest-green">{gameResult.score}</div>
                </div>
                <div className="bg-light-green p-4 rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Best Score</div>
                  <div className="text-3xl font-bold text-forest-green">{highScores[selectedGame.id] || gameResult.score}</div>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="w-full py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600 shadow-card"
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeGame}
                  className="w-full py-3 bg-warm-cream text-text-secondary rounded-lg font-medium hover:bg-gray-200"
                >
                  Back to Games
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}