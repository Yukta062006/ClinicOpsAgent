import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Flame, 
  Star, 
  Gamepad2, 
  Clock, 
  Play, 
  Check, 
  X, 
  Sparkles, 
  Award, 
  Target, 
  Pill, 
  Stethoscope, 
  ChevronRight,
  Brain,
  Apple,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Heart,
  Droplets,
  Dumbbell,
  Moon,
  Smile,
  Activity,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react'
import { useData } from '../context/DataContext'
import confetti from 'canvas-confetti'

interface QuizQuestion {
  id: number
  question: string
  category: string
  options: { key: string; text: string }[]
  correctKey: string
  explanationTitle: string
  explanationText: string
  points: number
}

interface GameDefinition {
  id: string
  title: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: string
  plays: string
  description: string
  icon: any
  questions: QuizQuestion[]
}

// 1. Quiz Definitions
const quizGamesData: GameDefinition[] = [
  {
    id: 'balanced-eating',
    title: 'Balanced Eating Challenge',
    category: 'Everyday wellbeing',
    difficulty: 'Easy',
    duration: '5 min',
    plays: '3,420 plays',
    description: 'Master balanced nutrition groups, healthy plate portions, and glycemic control.',
    icon: Apple,
    questions: [
      {
        id: 1,
        question: 'Which component should fill approximately half of a healthy, balanced dinner plate?',
        category: 'Plate Proportions',
        options: [
          { key: 'A', text: 'Refined carbohydrates and white rice' },
          { key: 'B', text: 'Colorful non-starchy vegetables and leafy greens' },
          { key: 'C', text: 'Fried protein foods' },
          { key: 'D', text: 'Saturated dairy fats' }
        ],
        correctKey: 'B',
        explanationTitle: "That's right. Half the plate is colorful vegetables.",
        explanationText: 'Vegetables provide vital micronutrients, polyphenols, and dietary fiber without causing sharp glycemic spikes.',
        points: 80
      },
      {
        id: 2,
        question: 'Why are whole millets (such as Ragi and Jowar) preferred over refined white flour?',
        category: 'Complex Carbohydrates',
        options: [
          { key: 'A', text: 'They digest rapidly into glucose within 10 minutes' },
          { key: 'B', text: 'They contain zero dietary minerals' },
          { key: 'C', text: 'Their high soluble fiber ensures a slow, sustained glucose release' },
          { key: 'D', text: 'They eliminate the need for drinking water' }
        ],
        correctKey: 'C',
        explanationTitle: 'Correct! Millets provide slow-release energy.',
        explanationText: 'Complex dietary fibers delay gastric emptying and prevent post-prandial blood sugar surges.',
        points: 80
      },
      {
        id: 3,
        question: 'Which choice best describes a varied eating pattern for cardiovascular wellness?',
        category: 'Cardio Nutrition',
        options: [
          { key: 'A', text: 'Only eating foods from one single food group' },
          { key: 'B', text: 'A mix of vegetables, whole grains, lean proteins, legumes, and fruit' },
          { key: 'C', text: 'Skipping meals to create balance later' },
          { key: 'D', text: 'Choosing the same ultra-processed snack for every meal' }
        ],
        correctKey: 'B',
        explanationTitle: "That's right. Variety is the idea.",
        explanationText: 'Different food groups offer complementary nutrients, antioxidants, and essential micronutrients rather than relying on one food.',
        points: 80
      },
      {
        id: 4,
        question: 'What is the recommended daily dietary sodium intake limit for hypertensive adults?',
        category: 'Blood Pressure Control',
        options: [
          { key: 'A', text: 'Under 2,000 mg of sodium (approx. 1 level teaspoon of salt)' },
          { key: 'B', text: 'Over 10,000 mg of sodium' },
          { key: 'C', text: 'Zero sodium under all circumstances' },
          { key: 'D', text: 'Sodium intake has no relation to blood pressure' }
        ],
        correctKey: 'A',
        explanationTitle: 'Accurate! Moderation in sodium protects arterial walls.',
        explanationText: 'Limiting sodium intake to less than 2,000 mg daily directly reduces fluid volume overload and lowers arterial pressure.',
        points: 80
      },
      {
        id: 5,
        question: 'Which cooking oil profile is considered most protective for blood lipid balance?',
        category: 'Healthy Fats',
        options: [
          { key: 'A', text: 'Hydrogenated vanaspati trans fats' },
          { key: 'B', text: 'Cold-pressed oils rich in monounsaturated fats (MUFA like Mustard/Olive)' },
          { key: 'C', text: 'Re-boiled and reused deep-frying oil' },
          { key: 'D', text: 'Industrial palm shortening' }
        ],
        correctKey: 'B',
        explanationTitle: 'Well done! Monounsaturated fats support HDL health.',
        explanationText: 'MUFA-rich oils protect endothelial lining and help lower circulating LDL cholesterol.',
        points: 80
      }
    ]
  },
  {
    id: 'medicine-match',
    title: 'Pharmacology Literacy',
    category: 'Medication Safety',
    difficulty: 'Medium',
    duration: '6 min',
    plays: '1,542 plays',
    description: 'Learn safe indications, administration timings, and precautions for common clinical medications.',
    icon: Pill,
    questions: [
      {
        id: 1,
        question: 'What is the primary action of Metformin in managing type 2 diabetes?',
        category: 'Endocrinology',
        options: [
          { key: 'A', text: 'Forces the pancreas to exhaustively overproduce insulin' },
          { key: 'B', text: 'Decreases hepatic glucose production and enhances cellular insulin sensitivity' },
          { key: 'C', text: 'Suppresses all bodily fluid absorption' },
          { key: 'D', text: 'Elevates blood pressure' }
        ],
        correctKey: 'B',
        explanationTitle: 'Correct! Metformin acts primarily on the liver.',
        explanationText: 'It reduces hepatic gluconeogenesis and improves muscle glucose sensitivity without causing hypoglycemic crashes.',
        points: 80
      },
      {
        id: 2,
        question: 'Why should prescribed antibiotics always be completed for the full prescribed duration?',
        category: 'Infectious Disease',
        options: [
          { key: 'A', text: 'To ensure complete eradication and prevent antimicrobial resistance' },
          { key: 'B', text: 'Medications expire within 24 hours' },
          { key: 'C', text: 'To substitute for normal meals' },
          { key: 'D', text: 'To change blood type' }
        ],
        correctKey: 'A',
        explanationTitle: 'Critical! Preventing bacterial resistance saves lives.',
        explanationText: 'Stopping early leaves surviving mutated bacteria that can proliferate into resistant infections.',
        points: 80
      },
      {
        id: 3,
        question: 'What is the maximum safe 24-hour adult dosage of Paracetamol (Acetaminophen)?',
        category: 'Analgesics',
        options: [
          { key: 'A', text: '12,000 mg' },
          { key: 'B', text: '4,000 mg (4 grams in 24 hours)' },
          { key: 'C', text: '500 mg per month' },
          { key: 'D', text: 'Unlimited dosage' }
        ],
        correctKey: 'B',
        explanationTitle: 'Crucial for hepatoprotection!',
        explanationText: 'Exceeding 4,000 mg in 24 hours depletes liver glutathione stores and risks acute hepatic injury.',
        points: 80
      }
    ]
  }
]

// 2. Memory Match Cards Definition
interface MemoryCard {
  uid: string
  pairId: string
  label: string
  subLabel: string
  iconName: 'apple' | 'heart' | 'droplet' | 'dumbbell' | 'moon' | 'brain'
}

const memoryCardPairs: Omit<MemoryCard, 'uid'>[] = [
  { pairId: 'p1', label: 'Fresh Fruit', subLabel: 'Natural Vitamins', iconName: 'apple' },
  { pairId: 'p1', label: 'Balanced Nutrition', subLabel: 'Dietary Fiber', iconName: 'apple' },

  { pairId: 'p2', label: 'Active Heart', subLabel: 'Blood Flow', iconName: 'heart' },
  { pairId: 'p2', label: 'Cardio Wellness', subLabel: 'Lower BP', iconName: 'heart' },

  { pairId: 'p3', label: 'Pure Water', subLabel: '2L Daily Goal', iconName: 'droplet' },
  { pairId: 'p3', label: 'Hydration Balance', subLabel: 'Vital Electrolytes', iconName: 'droplet' },

  { pairId: 'p4', label: 'Daily Movement', subLabel: '30-Min Walk', iconName: 'dumbbell' },
  { pairId: 'p4', label: 'Muscular Fitness', subLabel: 'Joint Mobility', iconName: 'dumbbell' },

  { pairId: 'p5', label: 'Restful Sleep', subLabel: '7-8 Hours', iconName: 'moon' },
  { pairId: 'p5', label: 'Cellular Recovery', subLabel: 'Immune Renewal', iconName: 'moon' },

  { pairId: 'p6', label: 'Mindful Breathing', subLabel: 'Stress Regulation', iconName: 'brain' },
  { pairId: 'p6', label: 'Mental Wellness', subLabel: 'Vagal Reset', iconName: 'brain' },
]

export default function HealthGames() {
  const navigate = useNavigate()
  const { 
    userPoints, 
    userStreak, 
    saveGameScore, 
    achievements,
    completeLesson,
    habits,
    toggleHabit
  } = useData()

  // Tab State: 'quiz' | 'memory' | 'habits'
  const [activeTab, setActiveTab] = useState<'quiz' | 'memory' | 'habits'>('quiz')

  // Floating Points Animation Notifications
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; text: string }[]>([])

  const triggerPointsAnimation = (text: string) => {
    const id = Date.now() + Math.random()
    setFloatingPoints(prev => [...prev, { id, text }])
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(p => p.id !== id))
    }, 1800)
  }

  // ==========================================
  // GAME 1: HEALTH QUIZ STATE
  // ==========================================
  const [selectedGameId, setSelectedGameId] = useState<string>('balanced-eating')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [correctInRow, setCorrectInRow] = useState<number>(0)
  const [showQuizComplete, setShowQuizComplete] = useState<boolean>(false)
  const [quizTimer, setQuizTimer] = useState<number>(30)

  const activeGame = quizGamesData.find(g => g.id === selectedGameId) || quizGamesData[0]
  const currentQuestion = activeGame.questions[currentQuestionIndex] || activeGame.questions[0]

  useEffect(() => {
    if (activeTab === 'quiz' && !isAnswerChecked && !showQuizComplete) {
      const timer = setInterval(() => {
        setQuizTimer(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [activeTab, isAnswerChecked, showQuizComplete, currentQuestionIndex])

  const handleSelectOption = (key: string) => {
    if (isAnswerChecked) return
    setSelectedOptionKey(key)
    setIsAnswerChecked(true)

    const isCorrect = key === currentQuestion.correctKey
    if (isCorrect) {
      const pts = currentQuestion.points || 80
      setQuizScore(prev => prev + pts)
      setCorrectInRow(prev => prev + 1)
      saveGameScore(activeGame.id, pts)
      triggerPointsAnimation(`+${pts} Points!`)
    } else {
      setCorrectInRow(0)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeGame.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedOptionKey(null)
      setIsAnswerChecked(false)
      setQuizTimer(30)
    } else {
      setShowQuizComplete(true)
      completeLesson(activeGame.id, quizScore + 80)
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      })
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedOptionKey(null)
    setIsAnswerChecked(false)
    setQuizScore(0)
    setShowQuizComplete(false)
    setQuizTimer(30)
  }

  // ==========================================
  // GAME 2: MEMORY MATCH STATE
  // ==========================================
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [attempts, setAttempts] = useState<number>(0)
  const [memoryTimer, setMemoryTimer] = useState<number>(0)
  const [isMemoryActive, setIsMemoryActive] = useState<boolean>(false)
  const [memoryComplete, setMemoryComplete] = useState<boolean>(false)

  const initMemoryGame = () => {
    const shuffled = [...memoryCardPairs]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({ ...item, uid: `${item.pairId}-${idx}-${Date.now()}` }))
    setMemoryCards(shuffled)
    setFlippedIndices([])
    setMatchedPairs([])
    setAttempts(0)
    setMemoryTimer(0)
    setIsMemoryActive(true)
    setMemoryComplete(false)
  }

  useEffect(() => {
    if (activeTab === 'memory' && memoryCards.length === 0) {
      initMemoryGame()
    }
  }, [activeTab])

  useEffect(() => {
    let interval: any = null
    if (isMemoryActive && !memoryComplete && activeTab === 'memory') {
      interval = setInterval(() => {
        setMemoryTimer(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isMemoryActive, memoryComplete, activeTab])

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2) return
    if (flippedIndices.includes(index)) return
    if (matchedPairs.includes(memoryCards[index].pairId)) return

    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setAttempts(a => a + 1)
      const first = memoryCards[newFlipped[0]]
      const second = memoryCards[newFlipped[1]]

      if (first.pairId === second.pairId) {
        // Matched!
        const updatedMatches = [...matchedPairs, first.pairId]
        setMatchedPairs(updatedMatches)
        setFlippedIndices([])
        saveGameScore('memory-match', 20)
        triggerPointsAnimation('+20 Points!')

        if (updatedMatches.length === 6) {
          setIsMemoryActive(false)
          setMemoryComplete(true)
          saveGameScore('memory-match', 100)
          triggerPointsAnimation('+100 Bonus Completion!')
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          })
        }
      } else {
        // Not matched, flip back after 800ms
        setTimeout(() => {
          setFlippedIndices([])
        }, 800)
      }
    }
  }

  const renderCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'apple': return <Apple className="w-6 h-6 text-emerald-700" />
      case 'heart': return <Heart className="w-6 h-6 text-rose-600" />
      case 'droplet': return <Droplets className="w-6 h-6 text-sky-600" />
      case 'dumbbell': return <Dumbbell className="w-6 h-6 text-amber-600" />
      case 'moon': return <Moon className="w-6 h-6 text-indigo-600" />
      case 'brain': return <Brain className="w-6 h-6 text-teal-600" />
      default: return <Activity className="w-6 h-6 text-emerald-800" />
    }
  }

  // ==========================================
  // GAME 3: DAILY HEALTH HABIT CHALLENGE
  // ==========================================
  const habitList = habits || []
  const completedHabitsCount = habitList.filter(h => h.completed).length
  const habitPercent = Math.round((completedHabitsCount / Math.max(1, habitList.length)) * 100)

  const handleToggleHabitItem = (id: string) => {
    const res = toggleHabit(id)
    if (res.completed) {
      triggerPointsAnimation('+10 Points!')
      if (completedHabitsCount + 1 === habitList.length) {
        confetti({
          particleCount: 90,
          spread: 65,
          origin: { y: 0.6 }
        })
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans relative">
      
      {/* Floating Points Animation Display */}
      <div className="fixed top-24 right-8 z-50 pointer-events-none space-y-2">
        {floatingPoints.map(item => (
          <div
            key={item.id}
            className="bg-[#1B3E2F] text-white font-bold text-sm px-4 py-2 rounded-2xl shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Top Header & Breadcrumb */}
      <div>
        <p className="text-[11px] font-bold text-[#829489] uppercase tracking-wider">
          PATIENT ENGAGEMENT / INTERACTIVE HEALTH GAMES
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1B3E2F] tracking-tight">
              Learn a little. Play a little.
            </h1>
            <p className="text-xs text-[#5A6D62] mt-0.5">
              Turn clinical health principles into enjoyable, lasting habits through interactive games.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-[#E2ECE4] text-xs font-bold text-[#1B3E2F]">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{userStreak} Day Streak</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EFF5EE] border border-[#E2ECE4] text-xs font-bold text-[#1B3E2F]">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{userPoints} Total Pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Game Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 bg-white border border-[#E2ECE4] p-1.5 rounded-2xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'quiz'
              ? 'bg-[#1B3E2F] text-white shadow-xs'
              : 'text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F]'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>1. Health Quiz</span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'memory'
              ? 'bg-[#1B3E2F] text-white shadow-xs'
              : 'text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F]'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>2. Memory Match</span>
        </button>

        <button
          onClick={() => setActiveTab('habits')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'habits'
              ? 'bg-[#1B3E2F] text-white shadow-xs'
              : 'text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>3. Habit Challenge ({completedHabitsCount}/6)</span>
        </button>
      </div>

      {/* Main Grid: Left Game Area (8 cols) & Right Companion Stats (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ACTIVE GAME (8 cols)                         */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* --------------------------------------------------------- */}
          {/* TAB 1: HEALTH QUIZ                                        */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Quiz Banner Header */}
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      In progress
                    </span>
                    <span className="text-xs text-[#5A6D62]">
                      {activeGame.category} • {activeGame.questions.length} questions
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B3E2F] mt-1.5">
                    {activeGame.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#5A6D62] bg-white px-3 py-1.5 rounded-xl border border-[#E2ECE4]">
                    <Clock className="w-4 h-4 text-[#829489]" />
                    <span>{quizTimer}s</span>
                  </div>
                  <button
                    onClick={() => {
                      const nextId = selectedGameId === 'balanced-eating' ? 'medicine-match' : 'balanced-eating'
                      setSelectedGameId(nextId)
                      handleRestartQuiz()
                    }}
                    className="text-xs font-semibold text-[#1B3E2F] hover:underline bg-white px-3 py-1.5 rounded-xl border border-[#E2ECE4]"
                  >
                    Switch Topic
                  </button>
                </div>
              </div>

              {!showQuizComplete ? (
                /* Question Card matching Reference Screenshot */
                <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between text-xs text-[#829489] font-bold uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {activeGame.questions.length}</span>
                    <span className="text-emerald-700">{currentQuestion.category}</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#EFF5EE] h-2 rounded-full overflow-hidden flex gap-1">
                    {activeGame.questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          i <= currentQuestionIndex ? 'bg-[#1B3E2F]' : 'bg-[#E2ECE4]'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Question Title */}
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1E2D25] leading-snug">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-xs text-[#5A6D62]">
                    Choose one answer. You can learn from the medical explanation below.
                  </p>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQuestion.options.map(option => {
                      const isSelected = selectedOptionKey === option.key
                      const isCorrect = option.key === currentQuestion.correctKey
                      
                      let optionClasses = 'bg-[#FAF9F5] border-[#E2ECE4] text-[#1E2D25] hover:border-[#1B3E2F]/40 hover:bg-[#EFF5EE]'
                      if (isAnswerChecked) {
                        if (isCorrect) {
                          optionClasses = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                        } else if (isSelected) {
                          optionClasses = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400'
                        } else {
                          optionClasses = 'opacity-60 bg-[#FAF9F5] border-[#E2ECE4]'
                        }
                      }

                      return (
                        <button
                          key={option.key}
                          onClick={() => handleSelectOption(option.key)}
                          disabled={isAnswerChecked}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-sm ${optionClasses}`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                              isAnswerChecked && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : isAnswerChecked && isSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-white border border-[#E2ECE4] text-[#1B3E2F]'
                            }`}>
                              {option.key}
                            </span>
                            <span className="leading-snug">{option.text}</span>
                          </div>

                          {isAnswerChecked && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                          )}
                          {isAnswerChecked && isSelected && !isCorrect && (
                            <X className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Explanation Card when Answer is Checked */}
                  {isAnswerChecked && (
                    <div className="p-5 rounded-2xl bg-[#EFF5EE] border border-[#E2ECE4] space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#1B3E2F]">
                          <Sparkles className="w-4 h-4 text-emerald-700" />
                          <span>{currentQuestion.explanationTitle}</span>
                        </div>
                        {selectedOptionKey === currentQuestion.correctKey && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                            +{currentQuestion.points} points
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5A6D62] leading-relaxed">
                        {currentQuestion.explanationText}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleRestartQuiz}
                      className="text-xs font-semibold text-[#5A6D62] hover:text-[#1B3E2F] flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart quiz</span>
                    </button>

                    {isAnswerChecked && (
                      <button
                        onClick={handleNextQuestion}
                        className="py-2.5 px-6 bg-[#1B3E2F] hover:bg-[#143024] text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center space-x-2"
                      >
                        <span>{currentQuestionIndex + 1 === activeGame.questions.length ? 'Finish & see score' : 'Next question'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Final Score Summary View */
                <div className="bg-white border border-[#E2ECE4] rounded-3xl p-8 text-center shadow-2xs space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center mx-auto shadow-xs">
                    <Trophy className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#1B3E2F]">
                      Outstanding Quiz Completed!
                    </h2>
                    <p className="text-xs text-[#5A6D62] mt-1">
                      You completed the {activeGame.title} and earned valuable health knowledge.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 max-w-sm mx-auto gap-4">
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4]">
                      <p className="text-xs text-[#5A6D62]">Score Earned</p>
                      <p className="text-3xl font-serif font-bold text-[#1B3E2F] mt-0.5">+{quizScore}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4]">
                      <p className="text-xs text-[#5A6D62]">Accuracy</p>
                      <p className="text-3xl font-serif font-bold text-emerald-700 mt-0.5">100%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleRestartQuiz}
                      className="py-2.5 px-6 rounded-xl border border-[#E2ECE4] text-xs font-semibold text-[#1B3E2F] hover:bg-[#EFF5EE]"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => navigate('/patient/learning-progress')}
                      className="py-2.5 px-6 rounded-xl bg-[#1B3E2F] text-white text-xs font-semibold hover:bg-[#143024] shadow-xs"
                    >
                      View in Learning Progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* TAB 2: HEALTH MEMORY MATCH                                */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'memory' && (
            <div className="space-y-6">
              {/* Memory Match Header Banner */}
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      Card Match Challenge
                    </span>
                    <span className="text-xs text-[#5A6D62]">
                      Match health habits with physiological benefits
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B3E2F] mt-1.5">
                    Health Memory Match
                  </h3>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2ECE4] text-[#1E2D25] font-semibold">
                    <span>Attempts: <strong>{attempts}</strong></span>
                  </div>
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2ECE4] text-[#1E2D25] font-semibold flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#829489]" />
                    <span>{Math.floor(memoryTimer / 60)}:{(memoryTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <button
                    onClick={initMemoryGame}
                    className="p-2 bg-white rounded-xl border border-[#E2ECE4] text-[#1B3E2F] hover:bg-gray-50"
                    title="Restart Memory Game"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Memory Cards Grid (12 Cards: 3x4 on desktop, 2x6 on mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {memoryCards.map((card, idx) => {
                  const isFlipped = flippedIndices.includes(idx) || matchedPairs.includes(card.pairId)
                  const isMatched = matchedPairs.includes(card.pairId)

                  return (
                    <div
                      key={card.uid}
                      onClick={() => handleCardClick(idx)}
                      className={`h-36 rounded-2xl cursor-pointer select-none transition-all duration-300 p-4 flex flex-col items-center justify-center text-center border ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 opacity-90'
                          : isFlipped
                          ? 'bg-white border-[#1B3E2F] shadow-md scale-102'
                          : 'bg-gradient-to-br from-[#1B3E2F] to-[#2B5E48] border-[#1B3E2F] hover:shadow-md hover:scale-101'
                      }`}
                    >
                      {isFlipped ? (
                        <div className="space-y-2 animate-in zoom-in-90 duration-150">
                          <div className="w-10 h-10 rounded-full bg-[#EFF5EE] flex items-center justify-center mx-auto">
                            {renderCardIcon(card.iconName)}
                          </div>
                          <div>
                            <p className="font-serif font-bold text-xs text-[#1E2D25] leading-tight">
                              {card.label}
                            </p>
                            <p className="text-[10px] text-[#5A6D62] mt-0.5">
                              {card.subLabel}
                            </p>
                          </div>
                          {isMatched && (
                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                              Matched ✓
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-white/80 space-y-1">
                          <Activity className="w-6 h-6 mx-auto opacity-70" />
                          <p className="text-[10px] font-semibold tracking-wider uppercase text-emerald-200">
                            Flip Card
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Memory Match Success Modal */}
              {memoryComplete && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-emerald-950">
                    All Pairs Matched Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Completed in <strong>{attempts} attempts</strong> and <strong>{memoryTimer} seconds</strong>. +100 bonus learning points added to your profile!
                  </p>
                  <button
                    onClick={initMemoryGame}
                    className="py-2 px-5 bg-[#1B3E2F] hover:bg-[#143024] text-white rounded-xl text-xs font-bold"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* TAB 3: DAILY HEALTH HABIT CHALLENGE                       */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'habits' && (
            <div className="space-y-6">
              {/* Habits Hero Header */}
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      Daily Clinical Wellbeing
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B3E2F] mt-1.5">
                      Today's Health Habit Challenge
                    </h3>
                    <p className="text-xs text-[#5A6D62] mt-0.5">
                      Complete daily physician-recommended habits. Earn +10 points for each checked milestone!
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E2ECE4] text-center min-w-[140px] shadow-2xs">
                    <span className="text-xs font-bold text-[#5A6D62] uppercase tracking-wider block">Today's Progress</span>
                    <span className="text-2xl font-serif font-bold text-[#1B3E2F]">
                      {completedHabitsCount} / {habitList.length}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      {habitPercent}% Goal Reached
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden mt-5 border border-[#E2ECE4]">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                    style={{ width: `${habitPercent}%` }}
                  />
                </div>
              </div>

              {/* Habit Checklist Cards */}
              <div className="space-y-3">
                {habitList.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabitItem(habit.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      habit.completed
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-[#E2ECE4] hover:border-[#1B3E2F]/40 hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        habit.completed
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#FAF9F5] border border-[#E2ECE4] text-transparent'
                      }`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-bold leading-tight ${
                            habit.completed ? 'line-through text-stone-500' : 'text-[#1E2D25]'
                          }`}>
                            {habit.label}
                          </p>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-[#E2ECE4]">
                            {habit.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6D62] mt-0.5">
                          {habit.detail}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      habit.completed
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-[#EFF5EE] text-[#1B3E2F]'
                    }`}>
                      +{habit.points} pts
                    </span>
                  </div>
                ))}
              </div>

              {/* Celebration Banner when 100% completed */}
              {habitPercent === 100 && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 to-[#1B3E2F] text-white shadow-md text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
                  <h4 className="font-serif font-bold text-xl">
                    Great job! Daily Health Goal Completed!
                  </h4>
                  <p className="text-xs text-emerald-100 max-w-md mx-auto">
                    You completed all 6 daily wellness habits today. Your continuous streak is +1 stronger!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: QUIZ COMPANION & STATS (4 cols)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Companion Card matching Reference Screenshot */}
          <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-5">
            <div>
              <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider mb-2">
                YOUR QUIZ COMPANION
              </p>
              
              {/* Botanical/Healthy Bowl Illustration */}
              <div className="w-full h-36 rounded-2xl overflow-hidden bg-white border border-[#E2ECE4] mb-4">
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
                  alt="Balanced Bowl"
                  className="w-full h-full object-cover"
                />
              </div>

              <h4 className="font-serif font-bold text-lg text-[#1B3E2F] leading-snug">
                Curiosity looks good on you.
              </h4>
              <p className="text-xs text-[#5A6D62] mt-1.5 leading-relaxed">
                Build understanding one question at a time. There's no timer pressure and no penalties for learning.
              </p>
            </div>

            {/* Score Metrics */}
            <div className="pt-4 border-t border-[#E2ECE4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5A6D62]">This round score</span>
                <span className="text-xl font-serif font-bold text-[#1B3E2F]">{quizScore} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5A6D62]">Learning total</span>
                <span className="text-xl font-serif font-bold text-[#1B3E2F]">{userPoints} pts</span>
              </div>
            </div>

            {/* Streak Indicator */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E2ECE4] flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E2D25]">{correctInRow || 3} in a row</p>
                <p className="text-[10px] text-[#5A6D62]">Keep exploring, not rushing</p>
              </div>
            </div>
          </div>

          {/* Your Next Achievement Card matching Reference Screenshot */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-4">
            <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
              YOUR NEXT ACHIEVEMENT
            </p>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-forest-green" />
              </div>
              <div>
                <h5 className="font-serif font-bold text-sm text-[#1B3E2F]">Nutrition Explorer</h5>
                <p className="text-[11px] text-[#5A6D62] mt-0.5">Finish the Balanced Eating challenge to unlock this badge.</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] text-[#5A6D62]">
                <span>Progress</span>
                <span>{currentQuestionIndex + 1} of {activeGame.questions.length} answered</span>
              </div>
              <div className="w-full bg-[#EFF5EE] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((currentQuestionIndex + 1) / activeGame.questions.length) * 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate('/patient/learning-progress')}
              className="w-full py-2.5 rounded-xl border border-[#E2ECE4] hover:bg-[#EFF5EE] text-xs font-bold text-[#1B3E2F] transition-colors text-center"
            >
              View all achievements
            </button>
          </div>

          {/* Disclaimer Footer */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4] text-[11px] text-[#829489] leading-relaxed">
            Quiz and game points reflect educational learning activity. They do not constitute personalized medical advice.
          </div>

        </div>
      </div>
    </div>
  )
}