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
  ChevronRight,
  ChevronLeft,
  Brain,
  Apple,
  ArrowRight,
  RotateCcw,
  Heart,
  Droplets,
  Dumbbell,
  Moon,
  Activity,
  CheckCircle2,
  CalendarCheck,
  Volume2,
  VolumeX,
  Lock,
  Zap,
  Footprints,
  BookOpen
} from 'lucide-react'
import { useData } from '../context/DataContext'
import GameArtwork, { GameArtKey } from '../components/games/GameArtwork'
import PointsCelebration, { CelebrationEvent } from '../components/games/PointsCelebration'
import AnimatedNumber from '../components/games/AnimatedNumber'
import { playGameSound, GameSoundName } from '../components/games/gameSounds'

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

interface QuizGame {
  id: string
  title: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: string
  description: string
  icon: any
  questions: QuizQuestion[]
}

interface MemoryCard {
  uid: string
  pairId: string
  label: string
  subLabel: string
  iconName: 'apple' | 'heart' | 'droplet' | 'dumbbell' | 'moon' | 'brain'
}

interface ArcadeGame {
  id: string
  title: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: string
  description: string
  pointsLabel: string
  art: GameArtKey
  tab: 'quiz' | 'memory' | 'habits'
  quizId?: string
  bestKey: string
  icon: any
}

const todayKey = () => new Date().toISOString().slice(0, 10)

// ============================================================
// Quiz content (existing challenges preserved, Anatomy added)
// ============================================================
const quizGamesData: QuizGame[] = [
  {
    id: 'balanced-eating',
    title: 'Balanced Eating Challenge',
    category: 'Everyday wellbeing',
    difficulty: 'Easy',
    duration: '5 min',
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
    title: 'Medicine Match',
    category: 'Medication Safety',
    difficulty: 'Medium',
    duration: '6 min',
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
  },
  {
    id: 'anatomy-puzzle',
    title: 'Anatomy Challenge',
    category: 'Human Anatomy',
    difficulty: 'Hard',
    duration: '8 min',
    description: 'Identify organs, chambers and systems with an anatomy round built for curious minds.',
    icon: Brain,
    questions: [
      {
        id: 1,
        question: 'Which chamber of the heart pumps oxygenated blood into the systemic circulation?',
        category: 'Cardiovascular',
        options: [
          { key: 'A', text: 'Right atrium' },
          { key: 'B', text: 'Right ventricle' },
          { key: 'C', text: 'Left ventricle' },
          { key: 'D', text: 'Left atrium' }
        ],
        correctKey: 'C',
        explanationTitle: 'Correct! The left ventricle is the systemic pump.',
        explanationText: 'It has the thickest myocardium because it must generate enough pressure to perfuse the entire body.',
        points: 80
      },
      {
        id: 2,
        question: 'Which muscle separates the thoracic cavity from the abdominal cavity?',
        category: 'Respiratory',
        options: [
          { key: 'A', text: 'Diaphragm' },
          { key: 'B', text: 'Trapezius' },
          { key: 'C', text: 'Biceps brachii' },
          { key: 'D', text: 'Sartorius' }
        ],
        correctKey: 'A',
        explanationTitle: 'Exactly. The diaphragm drives quiet breathing.',
        explanationText: 'Its dome-shaped contraction creates negative intrathoracic pressure, drawing air into the lungs.',
        points: 80
      },
      {
        id: 3,
        question: 'How many bones are typically present in an adult human skeleton?',
        category: 'Skeletal System',
        options: [
          { key: 'A', text: '106' },
          { key: 'B', text: '156' },
          { key: 'C', text: '206' },
          { key: 'D', text: '306' }
        ],
        correctKey: 'C',
        explanationTitle: 'Correct — 206 bones.',
        explanationText: 'Babies start with around 270 bones; many fuse during growth, leaving 206 in adulthood.',
        points: 80
      },
      {
        id: 4,
        question: 'The largest organ of the human body is the:',
        category: 'Integumentary',
        options: [
          { key: 'A', text: 'Liver' },
          { key: 'B', text: 'Skin' },
          { key: 'C', text: 'Lungs' },
          { key: 'D', text: 'Small intestine' }
        ],
        correctKey: 'B',
        explanationTitle: 'Yes! Skin is the largest organ.',
        explanationText: 'Skin forms the body’s first immune and thermal barrier and accounts for roughly 15% of body weight.',
        points: 80
      }
    ]
  }
]

// ============================================================
// Memory cards
// ============================================================
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
  { pairId: 'p6', label: 'Mental Wellness', subLabel: 'Vagal Reset', iconName: 'brain' }
]

// ============================================================
// Arcade catalogue (all existing games, clickable thumbnails)
// ============================================================
const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'balanced-eating',
    title: 'Balanced Eating Challenge',
    category: 'Nutrition',
    difficulty: 'Easy',
    duration: '5 min',
    description: 'Build the perfect plate, understand millets and master heart-smart nutrition choices.',
    pointsLabel: 'Up to 450 pts',
    art: 'nutrition',
    tab: 'quiz',
    quizId: 'balanced-eating',
    bestKey: 'balanced-eating',
    icon: Apple
  },
  {
    id: 'medicine-match',
    title: 'Medicine Match',
    category: 'Medication Safety',
    difficulty: 'Medium',
    duration: '6 min',
    description: 'Link medicines to their clinical actions, safe doses and essential precautions.',
    pointsLabel: 'Up to 290 pts',
    art: 'medicine',
    tab: 'quiz',
    quizId: 'medicine-match',
    bestKey: 'medicine-match',
    icon: Pill
  },
  {
    id: 'anatomy-puzzle',
    title: 'Anatomy Challenge',
    category: 'Human Anatomy',
    difficulty: 'Hard',
    duration: '8 min',
    description: 'Explore the heart, lungs, skeleton and skin through a focused anatomy quiz.',
    pointsLabel: 'Up to 370 pts',
    art: 'anatomy',
    tab: 'quiz',
    quizId: 'anatomy-puzzle',
    bestKey: 'anatomy-puzzle',
    icon: Brain
  },
  {
    id: 'memory-match',
    title: 'Medical Memory Match',
    category: 'Memory & Focus',
    difficulty: 'Easy',
    duration: '4 min',
    description: 'Flip cards and pair healthy habits with the physiology that powers them.',
    pointsLabel: 'Up to 220 pts',
    art: 'memory',
    tab: 'memory',
    bestKey: 'memory-match',
    icon: Gamepad2
  },
  {
    id: 'habit-challenge',
    title: 'Daily Habit Challenge',
    category: 'Healthy Routine',
    difficulty: 'Easy',
    duration: 'All day',
    description: 'Check off six physician-recommended daily habits and keep your streak alive.',
    pointsLabel: '85 pts daily',
    art: 'habits',
    tab: 'habits',
    bestKey: 'habit-challenge',
    icon: CalendarCheck
  }
]

const ACHIEVEMENT_ICONS: Record<string, any> = {
  footprints: Footprints,
  book: BookOpen,
  moon: Moon,
  apple: Apple,
  calendar: CalendarCheck,
  brain: Brain,
  star: Star,
  gamepad: Gamepad2,
  trophy: Trophy
}

function difficultyStyle(difficulty: ArcadeGame['difficulty']) {
  if (difficulty === 'Easy') return 'bg-emerald-100/95 text-emerald-900 border-emerald-300/60'
  if (difficulty === 'Medium') return 'bg-amber-100/95 text-amber-900 border-amber-300/60'
  return 'bg-rose-100/95 text-rose-900 border-rose-300/60'
}

export default function HealthGames() {
  const navigate = useNavigate()
  const {
    userPoints,
    userStreak,
    userScores,
    gamePlayCounts,
    recordGameResult,
    awardPoints,
    retractPoints,
    achievements,
    unlockAchievement,
    habits,
    toggleHabit,
    soundEnabled,
    toggleSound,
    soundVolume,
    setSoundVolume
  } = useData()

  // ---------------------------------------------------------
  // Navigation / celebration / sound
  // ---------------------------------------------------------
  const [activeView, setActiveView] = useState<'hub' | 'play'>('hub')
  const [activeTab, setActiveTab] = useState<'quiz' | 'memory' | 'habits'>('quiz')
  const [activeArcadeId, setActiveArcadeId] = useState<string>('balanced-eating')

  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null)
  const celebrationQueue = useRef<CelebrationEvent[]>([])
  const celebrationShowing = useRef(false)
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runCelebrationQueue = () => {
    const next = celebrationQueue.current.shift()
    if (!next) {
      celebrationShowing.current = false
      setCelebration(null)
      return
    }
    celebrationShowing.current = true
    setCelebration(next)
    celebrationTimer.current = setTimeout(
      runCelebrationQueue,
      next.type === 'points' ? 1550 : 2500
    )
  }

  const enqueueCelebration = (event: Omit<CelebrationEvent, 'id'>) => {
    celebrationQueue.current.push({ ...event, id: Date.now() + Math.random() })
    if (!celebrationShowing.current) runCelebrationQueue()
  }

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current)
    }
  }, [])

  const sfx = (name: GameSoundName) => playGameSound(name, soundEnabled, soundVolume)

  const celebrateAchievement = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId)
    if (!unlockAchievement(achievementId)) return
    sfx('achievement')
    enqueueCelebration({
      type: 'achievement',
      points: 0,
      title: achievement?.title || 'Achievement unlocked',
      subtitle: achievement?.description || 'A new badge has joined your collection.'
    })
  }

  const maybeUnlockArcadeRegular = (gameId: string) => {
    const played = new Set(
      Object.keys(gamePlayCounts).filter(id => (gamePlayCounts[id] || 0) > 0)
    )
    played.add(gameId)
    if (played.size >= 3) celebrateAchievement('8')
  }

  // Point Collector milestone is earned by crossing 1,000 real points (not on page load)
  const pointMilestoneInitialised = useRef(false)
  useEffect(() => {
    if (!pointMilestoneInitialised.current) {
      pointMilestoneInitialised.current = true
      return
    }
    if (userPoints >= 1000) celebrateAchievement('9')
  }, [userPoints])

  // ---------------------------------------------------------
  // Quiz state
  // ---------------------------------------------------------
  const [selectedGameId, setSelectedGameId] = useState<string>('balanced-eating')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [quizAwarded, setQuizAwarded] = useState<number>(0)
  const [quizCorrectCount, setQuizCorrectCount] = useState<number>(0)
  const [correctInRow, setCorrectInRow] = useState<number>(0)
  const [showQuizComplete, setShowQuizComplete] = useState<boolean>(false)
  const [quizTimer, setQuizTimer] = useState<number>(30)
  const [questionAward, setQuestionAward] = useState<number>(0)
  const [roundBonus, setRoundBonus] = useState<number>(0)
  const [roundTotal, setRoundTotal] = useState<number>(0)

  const activeQuiz = quizGamesData.find(g => g.id === selectedGameId) || quizGamesData[0]
  const currentQuestion = activeQuiz.questions[currentQuestionIndex] || activeQuiz.questions[0]
  const activeArcade = ARCADE_GAMES.find(g => g.id === activeArcadeId) || ARCADE_GAMES[0]
  const activeBest = userScores[activeArcade.bestKey] || 0

  useEffect(() => {
    if (activeView === 'play' && activeTab === 'quiz' && !isAnswerChecked && !showQuizComplete) {
      const timer = setInterval(() => {
        setQuizTimer(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [activeView, activeTab, isAnswerChecked, showQuizComplete, currentQuestionIndex])

  const resetQuiz = (gameId: string = activeQuiz.id) => {
    setSelectedGameId(gameId)
    setCurrentQuestionIndex(0)
    setSelectedOptionKey(null)
    setIsAnswerChecked(false)
    setQuizScore(0)
    setQuizAwarded(0)
    setQuizCorrectCount(0)
    setCorrectInRow(0)
    setShowQuizComplete(false)
    setQuizTimer(30)
    setQuestionAward(0)
    setRoundBonus(0)
    setRoundTotal(0)
  }

  const handleSelectOption = (key: string) => {
    if (isAnswerChecked) return
    setSelectedOptionKey(key)
    setIsAnswerChecked(true)

    const isCorrect = key === currentQuestion.correctKey
    if (isCorrect) {
      const points = currentQuestion.points || 80
      // Daily keys: replaying is welcome, but the same question cannot pay out twice today.
      const awarded = awardPoints(points, {
        uniqueKey: `quiz:${activeQuiz.id}:${currentQuestion.id}:${todayKey()}`,
        gameId: activeQuiz.id,
        reason: 'Correct quiz answer'
      })
      setQuizScore(prev => prev + points)
      setQuizAwarded(prev => prev + awarded)
      setQuizCorrectCount(prev => prev + 1)
      setCorrectInRow(prev => prev + 1)
      setQuestionAward(awarded)
      if (awarded > 0) {
        sfx('points')
        enqueueCelebration({
          type: 'points',
          points: awarded,
          title: 'Correct answer!',
          subtitle: currentQuestion.explanationTitle
        })
      } else {
        sfx('click')
      }
    } else {
      setQuestionAward(0)
      setCorrectInRow(0)
      sfx('wrong')
    }
  }

  const finishQuiz = () => {
    setShowQuizComplete(true)
    const totalQuestions = activeQuiz.questions.length
    const accuracy = Math.round((quizCorrectCount / totalQuestions) * 100)
    const perfect = quizCorrectCount === totalQuestions

    const result = recordGameResult(activeQuiz.id, quizScore + 50, {
      completed: true,
      bonusPoints: 50,
      bonusKey: `quiz-complete:${activeQuiz.id}:${todayKey()}`
    })

    setRoundBonus(result.awarded)
    setRoundTotal(quizAwarded + result.awarded)

    sfx('level')
    enqueueCelebration({
      type: 'level',
      points: result.awarded,
      title: perfect ? 'Perfect round!' : 'Level complete!',
      subtitle: `${quizCorrectCount}/${totalQuestions} correct • ${accuracy}% accuracy`
    })

    if (perfect) celebrateAchievement('7')
    if (activeQuiz.id === 'balanced-eating') celebrateAchievement('4')
    maybeUnlockArcadeRegular(activeQuiz.id)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedOptionKey(null)
      setIsAnswerChecked(false)
      setQuestionAward(0)
      setQuizTimer(30)
    } else {
      finishQuiz()
    }
  }

  const switchQuizTopic = () => {
    const currentIndex = quizGamesData.findIndex(g => g.id === activeQuiz.id)
    const next = quizGamesData[(currentIndex + 1) % quizGamesData.length]
    resetQuiz(next.id)
    sfx('click')
  }

  // ---------------------------------------------------------
  // Memory match state
  // ---------------------------------------------------------
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [attempts, setAttempts] = useState<number>(0)
  const [memoryTimer, setMemoryTimer] = useState<number>(0)
  const [isMemoryActive, setIsMemoryActive] = useState<boolean>(false)
  const [memoryComplete, setMemoryComplete] = useState<boolean>(false)
  const [memoryScore, setMemoryScore] = useState<number>(0)

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
    setMemoryScore(0)
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isMemoryActive && !memoryComplete && activeView === 'play' && activeTab === 'memory') {
      interval = setInterval(() => {
        setMemoryTimer(t => t + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isMemoryActive, memoryComplete, activeView, activeTab])

  const handleCardClick = (index: number) => {
    if (!memoryCards[index]) return
    if (flippedIndices.length === 2) return
    if (flippedIndices.includes(index)) return
    if (matchedPairs.includes(memoryCards[index].pairId)) return

    sfx('flip')
    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setAttempts(a => a + 1)
      const first = memoryCards[newFlipped[0]]
      const second = memoryCards[newFlipped[1]]

      if (first.pairId === second.pairId) {
        const awarded = awardPoints(20, {
          uniqueKey: `memory:${first.pairId}:${todayKey()}`,
          gameId: 'memory-match',
          reason: 'Matched pair'
        })
        const updatedMatches = [...matchedPairs, first.pairId]
        setMatchedPairs(updatedMatches)
        setFlippedIndices([])

        let sessionScore = memoryScore
        if (awarded > 0) {
          sessionScore = memoryScore + awarded
          setMemoryScore(sessionScore)
          sfx('points')
          enqueueCelebration({
            type: 'points',
            points: awarded,
            title: 'Pair matched!',
            subtitle: `${first.label} ↔ ${second.label}`
          })
        }

        if (updatedMatches.length === 6) {
          setIsMemoryActive(false)
          setMemoryComplete(true)
          const finalScore = sessionScore + 100
          const result = recordGameResult('memory-match', finalScore, {
            completed: true,
            bonusPoints: 100,
            bonusKey: `memory-complete:${todayKey()}`
          })
          setMemoryScore(sessionScore + result.awarded)
          sfx('level')
          enqueueCelebration({
            type: 'level',
            points: result.awarded,
            title: 'All pairs matched!',
            subtitle: `${attempts + 1} attempts • ${memoryTimer} seconds`
          })
          celebrateAchievement('6')
          maybeUnlockArcadeRegular('memory-match')
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([])
          sfx('wrong')
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

  // ---------------------------------------------------------
  // Habit challenge
  // ---------------------------------------------------------
  const habitList = habits || []
  const completedHabitsCount = habitList.filter(h => h.completed).length
  const habitPercent = Math.round(
    (completedHabitsCount / Math.max(1, habitList.length)) * 100
  )

  const handleToggleHabitItem = (habitId: string) => {
    const habit = habitList.find(h => h.id === habitId)
    const wasCompleted = Boolean(habit?.completed)
    const res = toggleHabit(habitId)

    if (res.completed) {
      const newCount = completedHabitsCount + 1
      if (res.pointsEarned > 0) {
        sfx('points')
        enqueueCelebration({
          type: 'points',
          points: res.pointsEarned,
          title: habit?.label || 'Habit complete!',
          subtitle: habit?.detail || 'A healthy step forward.'
        })
      }

      if (newCount === habitList.length) {
        const bonus = awardPoints(25, {
          uniqueKey: `habits-complete:${todayKey()}`,
          gameId: 'habit-challenge',
          reason: 'All daily habits completed'
        })
        recordGameResult('habit-challenge', 85, { completed: true })
        if (bonus > 0) {
          sfx('level')
          enqueueCelebration({
            type: 'level',
            points: bonus,
            title: 'Daily goal complete!',
            subtitle: 'All six healthy habits checked today'
          })
        }
        celebrateAchievement('5')
        maybeUnlockArcadeRegular('habit-challenge')
      }
    } else {
      if (wasCompleted) {
        // Undo the all-habits bonus too, so unchecking cannot farm points.
        retractPoints(25, `habits-complete:${todayKey()}`)
      }
      sfx('click')
    }
  }

  // ---------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------
  const openGame = (game: ArcadeGame) => {
    setActiveArcadeId(game.id)
    setActiveTab(game.tab)
    if (game.tab === 'quiz' && game.quizId) resetQuiz(game.quizId)
    if (game.tab === 'memory') initMemoryGame()
    setActiveView('play')
    sfx('click')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToArcade = () => {
    setActiveView('hub')
    setCelebration(null)
    celebrationQueue.current = []
    celebrationShowing.current = false
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current)
    sfx('click')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentRoundPoints =
    activeTab === 'quiz'
      ? quizAwarded + roundBonus
      : activeTab === 'memory'
      ? memoryScore
      : completedHabitsCount * 10 + (completedHabitsCount === habitList.length ? 25 : 0)

  const unlockedAchievements = achievements.filter(a => a.unlocked).length
  const overallBest = Math.max(0, ...Object.values(userScores))
  const displayName = 'Explorer'

  const soundControls = (
    <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] flex items-center justify-center text-[#1B3E2F]">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">Game sounds</p>
            <p className="text-xs font-bold text-[#1B3E2F]">
              {soundEnabled ? 'Audio on' : 'Muted'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            toggleSound()
            if (!soundEnabled) playGameSound('click', true, soundVolume)
          }}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
            soundEnabled
              ? 'bg-[#EFF5EE] border-[#E2ECE4] text-[#1B3E2F] hover:bg-[#E4EFE4]'
              : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {soundEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <VolumeX className="w-3.5 h-3.5 text-[#829489] shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(soundVolume * 100)}
          onChange={e => setSoundVolume(Number(e.target.value) / 100)}
          className="w-full accent-[#1B3E2F] h-1.5 cursor-pointer"
          aria-label="Game sound volume"
        />
        <Volume2 className="w-3.5 h-3.5 text-[#829489] shrink-0" />
        <span className="text-[11px] font-bold text-[#5A6D62] w-9 text-right">
          {Math.round(soundVolume * 100)}%
        </span>
      </div>

      <button
        onClick={() => playGameSound('points', true, soundVolume)}
        disabled={!soundEnabled}
        className="w-full py-2 rounded-xl border border-[#E2ECE4] text-[11px] font-bold text-[#1B3E2F] hover:bg-[#EFF5EE] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Test reward chime
      </button>
    </div>
  )

  const achievementsCard = (
    <div className="bg-white border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
          Achievements
        </p>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
          {unlockedAchievements}/{achievements.length}
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {achievements.map(achievement => {
          const Icon = ACHIEVEMENT_ICONS[achievement.icon || 'star'] || Award
          return (
            <div
              key={achievement.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-2xl border transition-colors ${
                achievement.unlocked
                  ? 'bg-[#F3F8F0] border-emerald-200/80'
                  : 'bg-[#FAF9F5] border-[#E2ECE4]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  achievement.unlocked
                    ? 'bg-[#1B3E2F] text-amber-300'
                    : 'bg-white border border-[#E2ECE4] text-[#829489]'
                }`}
              >
                {achievement.unlocked ? <Icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E2D25] leading-tight">
                  {achievement.title}
                </p>
                <p className="text-[10px] text-[#5A6D62] leading-snug mt-0.5">
                  {achievement.description}
                </p>
                <p className={`text-[9px] font-bold mt-1 ${
                  achievement.unlocked ? 'text-emerald-700' : 'text-[#829489]'
                }`}>
                  {achievement.unlocked ? achievement.dateUnlocked : 'Locked'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const progressCard = (
    <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
          Your arcade progress
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1B3E2F] bg-white border border-[#E2ECE4] px-2 py-0.5 rounded-full">
          <Flame className="w-3 h-3 text-amber-500" />
          {userStreak} day streak
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">Total points</p>
          <AnimatedNumber
            value={userPoints}
            className="font-serif text-4xl font-bold text-[#1B3E2F] leading-none"
          />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">Best score</p>
          <AnimatedNumber
            value={overallBest}
            className="font-serif text-2xl font-bold text-emerald-700 leading-none"
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {ARCADE_GAMES.map(game => {
          const best = userScores[game.bestKey] || 0
          const Icon = game.icon
          return (
            <div key={game.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#E2ECE4] flex items-center justify-center text-[#1B3E2F] shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-[#1E2D25] truncate">
                  {game.title}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#5A6D62] shrink-0">
                {best} pts
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans relative">
      <PointsCelebration event={celebration} />

      {/* ========================================================= */}
      {/* HUB HERO                                                  */}
      {/* ========================================================= */}
      {activeView === 'hub' ? (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#173B2C] via-[#24523E] to-[#32724F] p-6 sm:p-8 text-white shadow-[0_25px_60px_-30px_rgba(19,50,37,0.8)]">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-200/10 blur-2xl" />
          <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 opacity-20 lg:block">
            <Gamepad2 className="w-48 h-48" strokeWidth={1} />
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold text-emerald-200/90 uppercase tracking-[0.28em]">
                PATIENT ENGAGEMENT / HEALTH GAMES ARCADE
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-[2.7rem] font-bold leading-tight tracking-tight">
                Play smart. Feel better.
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-emerald-50/80 leading-relaxed max-w-xl">
                Five original challenges, one flowing point total. Every correct answer, matched
                pair and daily habit earns real points that are saved to your learning profile.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 backdrop-blur-xs">
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <AnimatedNumber value={userPoints} className="text-sm font-bold" />
                  <span className="text-[11px] text-emerald-100/80 font-semibold">points</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 backdrop-blur-xs">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-bold">{userStreak}</span>
                  <span className="text-[11px] text-emerald-100/80 font-semibold">day streak</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 backdrop-blur-xs">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-bold">{unlockedAchievements}/{achievements.length}</span>
                  <span className="text-[11px] text-emerald-100/80 font-semibold">badges</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  toggleSound()
                  if (!soundEnabled) playGameSound('click', true, soundVolume)
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                title={soundEnabled ? 'Mute game sounds' : 'Unmute game sounds'}
                aria-label={soundEnabled ? 'Mute game sounds' : 'Unmute game sounds'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 h-10">
                <VolumeX className="w-3.5 h-3.5 text-emerald-100/70" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(soundVolume * 100)}
                  onChange={e => setSoundVolume(Number(e.target.value) / 100)}
                  className="w-24 accent-amber-300 cursor-pointer"
                  aria-label="Game sound volume"
                />
                <Volume2 className="w-3.5 h-3.5 text-emerald-100/70" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* PLAY HEADER                                                */
        /* ========================================================= */
        <div className="space-y-4">
          <button
            onClick={backToArcade}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6D62] hover:text-[#1B3E2F] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All games
          </button>

          <div className="relative overflow-hidden rounded-3xl border border-[#E2ECE4] bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-24 h-16 rounded-2xl overflow-hidden border border-[#E2ECE4] shrink-0">
                  <GameArtwork gameId={activeArcade.art} className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-[#EFF5EE] border border-[#E2ECE4] px-2 py-0.5 rounded-full">
                      {activeArcade.category}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${difficultyStyle(activeArcade.difficulty)}`}>
                      {activeArcade.difficulty}
                    </span>
                  </div>
                  <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1B3E2F] mt-1 truncate">
                    {activeArcade.title}
                  </h1>
                  <p className="text-[11px] text-[#5A6D62] mt-0.5 truncate">
                    {activeArcade.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-[#EFF5EE] border border-[#E2ECE4] text-center">
                  <p className="text-[9px] font-bold text-[#829489] uppercase tracking-wider">This round</p>
                  <AnimatedNumber
                    value={currentRoundPoints}
                    className="font-serif text-xl font-bold text-[#1B3E2F] leading-none"
                  />
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E2ECE4] text-center">
                  <p className="text-[9px] font-bold text-[#829489] uppercase tracking-wider">Best</p>
                  <AnimatedNumber
                    value={activeBest}
                    className="font-serif text-xl font-bold text-emerald-700 leading-none"
                  />
                </div>
                <button
                  onClick={() => {
                    toggleSound()
                    if (!soundEnabled) playGameSound('click', true, soundVolume)
                  }}
                  className="w-9 h-9 rounded-xl bg-[#EFF5EE] border border-[#E2ECE4] flex items-center justify-center text-[#1B3E2F] hover:bg-[#E4EFE4] transition-colors"
                  aria-label={soundEnabled ? 'Mute game sounds' : 'Unmute game sounds'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HUB OR ACTIVE GAME                                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        <div className="lg:col-span-8 space-y-6">
          {activeView === 'hub' && (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1B3E2F]">Choose your challenge</h2>
                  <p className="text-xs text-[#5A6D62] mt-0.5">
                    Tap any card to launch the playable game. Points are awarded only for real actions.
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-[#EFF5EE] border border-[#E2ECE4] px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  {Object.values(gamePlayCounts).reduce((a, b) => a + b, 0)} sessions played
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ARCADE_GAMES.map(game => {
                  const best = userScores[game.bestKey] || 0
                  const Icon = game.icon
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => openGame(game)}
                      className="game-card group relative w-full overflow-hidden rounded-3xl border border-[#E2ECE4] bg-white text-left shadow-2xs"
                    >
                      <div className="relative h-44 sm:h-48 overflow-hidden">
                        <div className="game-art absolute inset-0">
                          <GameArtwork gameId={game.art} className="w-full h-full" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2F24]/70 via-[#0F2F24]/5 to-transparent" />
                        <div className="game-shine" />

                        <div className="absolute left-3 top-3 flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border shadow-2xs ${difficultyStyle(game.difficulty)}`}>
                            {game.difficulty}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/90 text-[#1B3E2F] border border-white/60 shadow-2xs">
                            {game.category}
                          </span>
                        </div>

                        <span className="absolute right-3 top-3 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#1B3E2F]/85 text-emerald-100 border border-white/20 backdrop-blur-xs">
                          {game.pointsLabel}
                        </span>

                        <span className="game-play-overlay absolute inset-0 m-auto h-fit w-fit inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-xs font-bold text-[#1B3E2F] shadow-2xl">
                          <Play className="w-4 h-4 fill-[#1B3E2F]" />
                          PLAY NOW
                        </span>

                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {game.duration}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                            <Star className="w-3.5 h-3.5 text-amber-300" />
                            Best {best} pts
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] border border-[#E2ECE4] text-[#1B3E2F] flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1B3E2F] leading-tight">
                              {game.title}
                            </h3>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-[#5A6D62] bg-[#FAF9F5] border border-[#E2ECE4] px-2 py-1 rounded-full">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            {best} best
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6D62] leading-relaxed">
                          {game.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E2ECE4]/70">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5" />
                            Live points &amp; achievements
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B3E2F] group-hover:gap-2 transition-all">
                            Enter game
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* --------------------------------------------------------- */}
          {/* QUIZ GAME                                                 */}
          {/* --------------------------------------------------------- */}
          {activeView === 'play' && activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      {showQuizComplete ? 'Completed' : 'In progress'}
                    </span>
                    <span className="text-xs text-[#5A6D62]">
                      {activeQuiz.category} • {activeQuiz.questions.length} questions
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1B3E2F] mt-1">
                    {activeQuiz.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A6D62] bg-white px-3 py-1.5 rounded-xl border border-[#E2ECE4]">
                    <Clock className="w-4 h-4 text-[#829489]" />
                    <span>{quizTimer}s</span>
                  </div>
                  <button
                    onClick={switchQuizTopic}
                    className="text-xs font-semibold text-[#1B3E2F] hover:underline bg-white px-3 py-1.5 rounded-xl border border-[#E2ECE4]"
                  >
                    Switch topic
                  </button>
                </div>
              </div>

              {!showQuizComplete ? (
                <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between text-xs text-[#829489] font-bold uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                    <span className="text-emerald-700">{currentQuestion.category}</span>
                  </div>

                  <div className="w-full bg-[#EFF5EE] h-2 rounded-full overflow-hidden flex gap-1">
                    {activeQuiz.questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          i <= currentQuestionIndex ? 'bg-[#1B3E2F]' : 'bg-[#E2ECE4]'
                        }`}
                      />
                    ))}
                  </div>

                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1E2D25] leading-snug">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-xs text-[#5A6D62]">
                    Choose one answer. Correct answers earn {currentQuestion.points} points and unlock a medical explanation.
                  </p>

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

                  {isAnswerChecked && (
                    <div className="p-5 rounded-2xl bg-[#EFF5EE] border border-[#E2ECE4] space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#1B3E2F]">
                          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{currentQuestion.explanationTitle}</span>
                        </div>
                        {selectedOptionKey === currentQuestion.correctKey && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            {questionAward > 0
                              ? `+${questionAward} points`
                              : 'Already earned today'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5A6D62] leading-relaxed">
                        {currentQuestion.explanationText}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => resetQuiz(activeQuiz.id)}
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
                        <span>{currentQuestionIndex + 1 === activeQuiz.questions.length ? 'Finish & see score' : 'Next question'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#E2ECE4] rounded-3xl p-8 text-center shadow-2xs space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center mx-auto shadow-xs">
                    <Trophy className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#1B3E2F]">
                      {quizCorrectCount === activeQuiz.questions.length
                        ? 'Perfect round — outstanding!'
                        : 'Quiz completed!'}
                    </h2>
                    <p className="text-xs text-[#5A6D62] mt-1">
                      {roundTotal > 0
                        ? `You completed ${activeQuiz.title} and added real points to your learning profile.`
                        : `You already earned today's points for ${activeQuiz.title}. Your best score is still tracked.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 max-w-md mx-auto gap-3">
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4]">
                      <p className="text-[10px] font-bold text-[#5A6D62] uppercase tracking-wider">Points earned</p>
                      <AnimatedNumber
                        value={roundTotal}
                        className="font-serif font-bold text-[#1B3E2F] mt-0.5 text-2xl block"
                      />
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4]">
                      <p className="text-[10px] font-bold text-[#5A6D62] uppercase tracking-wider">Accuracy</p>
                      <p className="font-serif font-bold text-emerald-700 mt-0.5 text-2xl">
                        {Math.round((quizCorrectCount / activeQuiz.questions.length) * 100)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4]">
                      <p className="text-[10px] font-bold text-[#5A6D62] uppercase tracking-wider">Best score</p>
                      <p className="font-serif font-bold text-[#1B3E2F] mt-0.5 text-2xl">
                        {userScores[activeQuiz.id] || 0}
                      </p>
                    </div>
                  </div>

                  {roundBonus > 0 && (
                    <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 rounded-full px-3 py-1 inline-block">
                      Includes +{roundBonus} completion bonus
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => resetQuiz(activeQuiz.id)}
                      className="py-2.5 px-6 rounded-xl border border-[#E2ECE4] text-xs font-semibold text-[#1B3E2F] hover:bg-[#EFF5EE]"
                    >
                      Play again
                    </button>
                    <button
                      onClick={backToArcade}
                      className="py-2.5 px-6 rounded-xl bg-[#1B3E2F] text-white text-xs font-semibold hover:bg-[#143024] shadow-xs"
                    >
                      Choose another game
                    </button>
                    <button
                      onClick={() => navigate('/patient/learning-progress')}
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#5A6D62] hover:text-[#1B3E2F]"
                    >
                      Learning progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* MEMORY GAME                                               */}
          {/* --------------------------------------------------------- */}
          {activeView === 'play' && activeTab === 'memory' && (
            <div className="space-y-6">
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      Card match challenge
                    </span>
                    <span className="text-xs text-[#5A6D62]">
                      Match habits with their physiological benefit
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B3E2F] mt-1.5">
                    Health Memory Match
                  </h3>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2ECE4] text-[#1E2D25] font-semibold">
                    Score: <strong className="text-emerald-700">{memoryScore}</strong>
                  </div>
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2ECE4] text-[#1E2D25] font-semibold">
                    Attempts: <strong>{attempts}</strong>
                  </div>
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#E2ECE4] text-[#1E2D25] font-semibold flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#829489]" />
                    <span>{Math.floor(memoryTimer / 60)}:{(memoryTimer % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <button
                    onClick={initMemoryGame}
                    className="p-2 bg-white rounded-xl border border-[#E2ECE4] text-[#1B3E2F] hover:bg-[#FAF9F5]"
                    title="Restart memory game"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

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
                          ? 'bg-white border-[#1B3E2F] shadow-md scale-[1.02]'
                          : 'bg-gradient-to-br from-[#1B3E2F] to-[#2B5E48] border-[#1B3E2F] hover:shadow-md hover:scale-[1.01]'
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
                              Matched +20
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-white/80 space-y-1">
                          <Activity className="w-6 h-6 mx-auto opacity-70" />
                          <p className="text-[10px] font-semibold tracking-wider uppercase text-emerald-200">
                            Flip card
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {memoryComplete && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-emerald-950">
                    All pairs matched successfully!
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Completed in <strong>{attempts} attempts</strong> and <strong>{memoryTimer} seconds</strong>.{' '}
                    {memoryScore > 0
                      ? <>You earned <strong>{memoryScore} points</strong> from genuine matches and the completion bonus.</>
                      : <>Today&apos;s match points were already earned — replay practice does not duplicate them.</>}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={initMemoryGame}
                      className="py-2 px-5 bg-[#1B3E2F] hover:bg-[#143024] text-white rounded-xl text-xs font-bold"
                    >
                      Play again
                    </button>
                    <button
                      onClick={backToArcade}
                      className="py-2 px-5 bg-white border border-[#E2ECE4] text-[#1B3E2F] rounded-xl text-xs font-bold hover:bg-[#EFF5EE]"
                    >
                      All games
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* HABIT CHALLENGE                                           */}
          {/* --------------------------------------------------------- */}
          {activeView === 'play' && activeTab === 'habits' && (
            <div className="space-y-6">
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-[#E2ECE4]">
                      Daily clinical wellbeing
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B3E2F] mt-1.5">
                      Today&apos;s Health Habit Challenge
                    </h3>
                    <p className="text-xs text-[#5A6D62] mt-0.5">
                      Complete daily physician-recommended habits. Earn +10 points for each checked milestone plus a +25 bonus for all six.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E2ECE4] text-center min-w-[140px] shadow-2xs">
                    <span className="text-xs font-bold text-[#5A6D62] uppercase tracking-wider block">Today&apos;s progress</span>
                    <span className="text-2xl font-serif font-bold text-[#1B3E2F]">
                      {completedHabitsCount} / {habitList.length}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      {habitPercent}% goal reached
                    </span>
                  </div>
                </div>

                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden mt-5 border border-[#E2ECE4]">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                    style={{ width: `${habitPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {habitList.map(habit => (
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
                        <div className="flex items-center space-x-2 flex-wrap">
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

              {habitPercent === 100 && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 to-[#1B3E2F] text-white shadow-md text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
                  <h4 className="font-serif font-bold text-xl">
                    Daily health goal completed!
                  </h4>
                  <p className="text-xs text-emerald-100 max-w-md mx-auto">
                    You completed all six daily wellness habits today and earned the full daily bonus. Your streak is now +1 stronger.
                  </p>
                  <button
                    onClick={backToArcade}
                    className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1B3E2F] bg-white/95 hover:bg-white px-4 py-2 rounded-xl"
                  >
                    Back to arcade
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR                                             */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {activeView === 'play' && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B3E2F] to-[#2F6B4E] p-5 text-white shadow-md">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/10" />
              <p className="text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider">
                This round · {activeArcade.title}
              </p>
              <div className="mt-2 flex items-end justify-between">
                <AnimatedNumber
                  value={currentRoundPoints}
                  className="font-serif text-4xl font-bold leading-none"
                />
                <span className="text-[11px] font-bold text-emerald-100/80">points</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-100/70 font-bold">Best</p>
                  <p className="text-lg font-serif font-bold">{activeBest}</p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-100/70 font-bold">Streak</p>
                  <p className="text-lg font-serif font-bold inline-flex items-center gap-1">
                    {userStreak}
                    <Flame className="w-4 h-4 text-amber-300" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {progressCard}
          {achievementsCard}
          {soundControls}

          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2ECE4] text-[11px] text-[#829489] leading-relaxed">
            Points and badges reflect educational learning activity. They are not a clinical
            assessment or personalised medical advice. Scores are saved locally to your profile and
            are only awarded once per genuine action.
          </div>

          {activeView === 'hub' && (
            <div className="rounded-2xl border border-[#E2ECE4] bg-white p-4">
              <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">
                Why it matters
              </p>
              <p className="mt-1 text-xs text-[#5A6D62] leading-relaxed">
                Short, playful learning sessions improve medication safety, nutrition literacy and
                daily self-care. Keep the streak going, {displayName}.
              </p>
              <button
                onClick={() => navigate('/patient/learning-progress')}
                className="mt-3 w-full py-2.5 rounded-xl border border-[#E2ECE4] hover:bg-[#EFF5EE] text-xs font-bold text-[#1B3E2F] transition-colors flex items-center justify-center gap-1.5"
              >
                View learning progress
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
