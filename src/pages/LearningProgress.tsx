import React, { useState, useEffect } from 'react'
import { 
  ArrowTrendingUpIcon, 
  CheckCircleIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  BookOpenIcon,
  FireIcon,
  AcademicCapIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

export default function LearningProgress() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview')
  const [currentLesson, setCurrentLesson] = useState<string | null>(null)
  const [lessonProgress, setLessonProgress] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  
  const { 
    lessons,
    achievements,
    userPoints,
    userStreak,
    completeLesson
  } = useData()

  const stats = {
    totalPoints: userPoints,
    completedLessons: lessons.filter(l => l.completed).length,
    currentStreak: userStreak,
    quizAverage: 92,
    timeLearned: 45.5
  }

  const completedLessons = lessons.filter(l => l.completed).map(l => ({
    id: l.id,
    title: l.title,
    date: l.dateCompleted,
    score: l.score,
    completed: l.completed,
    duration: l.duration
  }))

  const [currentLessonData, setCurrentLessonData] = useState<{
    title: string
    content: string
    quiz: { question: string; options: string[]; correct: number }
  } | null>(null)

  const startLesson = (lessonId: string) => {
    setCurrentLesson(lessonId)
    setLessonProgress(0)
    setQuizAnswer(null)
    setQuizResult(null)
    
    // Determine lesson index for question variation
    const index = parseInt(lessonId.replace('lesson-', '')) - 1
    setCurrentLessonIndex(index)

    if (lessonId === 'lesson-1') {
      setCurrentLessonData({
        title: 'Diabetes Prevention',
        content: 'Diabetes is a chronic condition that affects how your body turns food into energy. Most of the food you eat is broken down into sugar (glucose) and released into your bloodstream. When your blood sugar goes up, it signals your pancreas to release insulin. Insulin acts like a key to let the blood sugar into your body\'s cells for use as energy.\n\nPreventing diabetes involves maintaining a healthy weight, eating a balanced diet, and getting regular physical activity. Even modest weight loss - about 5 to 7 percent of your body weight - can help prevent or delay type 2 diabetes.',
        quiz: {
          question: 'What percentage of body weight loss can help prevent or delay type 2 diabetes?',
          options: ['1-2%', '3-5%', '5-7%', '10-15%'],
          correct: 2
        }
      })
    } else if (lessonId === 'lesson-2') {
      setCurrentLessonData({
        title: 'Heart Health Basics',
        content: 'Heart disease is the leading cause of death worldwide. However, many forms of heart disease are preventable with lifestyle changes.\n\nKey heart-healthy habits include:\n1. Eating a balanced diet rich in fruits and vegetables\n2. Exercising regularly (at least 150 minutes per week)\n3. Maintaining a healthy weight\n4. Managing stress through relaxation techniques\n5. Getting enough sleep (7-9 hours per night)\n6. Avoiding tobacco products\n7. Limiting alcohol consumption',
        quiz: {
          question: 'How much weekly exercise is recommended for heart health?',
          options: ['30 minutes', '60 minutes', '150 minutes', '300 minutes'],
          correct: 2
        }
      })
    } else if (lessonId === 'lesson-3') {
      setCurrentLessonData({
        title: 'Nutrition Fundamentals',
        content: 'Proper nutrition is essential for maintaining good health and preventing chronic diseases. A balanced diet includes:\n\n• Carbohydrates: Your body\'s main source of energy\n• Proteins: Essential for building and repairing tissues\n• Fats: Important for brain function and hormone production\n• Vitamins and minerals: Support various bodily functions\n• Fiber: Promotes digestive health\n\nTips for healthy eating:\n1. Choose whole grains over refined grains\n2. Eat plenty of fruits and vegetables\n3. Limit added sugars and salt\n4. Drink water instead of sugary beverages\n5. Practice portion control',
        quiz: {
          question: 'Which of the following is recommended for healthy eating?',
          options: ['Choose refined grains', 'Limit fruits and vegetables', 'Drink water instead of sugary beverages', 'Increase added sugars'],
          correct: 2
        }
      })
    } else {
      setCurrentLessonData({
        title: 'Diabetes Prevention',
        content: 'Diabetes is a chronic condition that affects how your body turns food into energy. Most of the food you eat is broken down into sugar (glucose) and released into your bloodstream. When your blood sugar goes up, it signals your pancreas to release insulin. Insulin acts like a key to let the blood sugar into your body\'s cells for use as energy.\n\nPreventing diabetes involves maintaining a healthy weight, eating a balanced diet, and getting regular physical activity. Even modest weight loss - about 5 to 7 percent of your body weight - can help prevent or delay type 2 diabetes.',
        quiz: {
          question: 'What is the primary function of insulin in the body?',
          options: ['Break down carbohydrates', 'Regulate blood sugar levels', 'Build muscle tissue', 'Control heart rate'],
          correct: 1
        }
      })
    }
  }

  const handleQuizAnswer = (index: number) => {
    setQuizAnswer(index)
    
    if (index === currentLessonData?.quiz.correct) {
      setQuizResult('correct')
      // Award points
      const pointsEarned = 20
      completeLesson(currentLesson || 'default', 100)
      setTimeout(() => {
        alert(`Correct! You earned ${pointsEarned} points!`)
        setCurrentLesson(null)
      }, 1000)
    } else {
      setQuizResult('incorrect')
      setTimeout(() => {
        setQuizResult(null)
        setQuizAnswer(null)
      }, 2000)
    }
  }

  const closeLesson = () => {
    setCurrentLesson(null)
    setCurrentLessonData(null)
  }

  const achievementsList = achievements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    unlocked: a.unlocked,
    date: a.dateUnlocked,
    points: a.points
  }))

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Learning Progress</h1>
          <p className="text-text-secondary">Track your health education journey</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-3 px-6 py-3 bg-yellow-50 text-white rounded-lg border border-yellow-200 shadow-card hover:shadow-card-hover"
        >
          <TrophyIcon className="w-6 h-6" />
          <div>
            <div className="font-bold text-xl">{stats.totalPoints}</div>
            <div className="text-xs opacity-90">Total Points</div>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-green-500 font-medium">+8 lessons</span>
          </div>
          <div className="text-3xl font-bold text-forest-green mb-1">{stats.completedLessons}</div>
          <div className="text-sm text-text-secondary">Lessons Completed</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <FireIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green mb-1">{stats.currentStreak}</div>
          <div className="text-sm text-text-secondary">Day Streak</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-blue-500 font-medium">+5%</span>
          </div>
          <div className="text-3xl font-bold text-forest-green mb-1">{stats.quizAverage}%</div>
          <div className="text-sm text-text-secondary">Quiz Average</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover border border-pale-sage"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <ClockIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green mb-1">{stats.timeLearned}h</div>
          <div className="text-sm text-text-secondary">Time Learned</div>
        </motion.div>
      </div>

      {/* Learning Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-8 border border-pale-sage mb-8"
      >
        <h2 className="text-xl font-serif font-bold mb-6 text-forest-green">Learning Goal Progress</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold mb-1 text-forest-green">24/30</div>
            <div className="text-sm text-text-secondary">Lessons to Complete This Month</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1 text-forest-green">80%</div>
            <div className="text-sm text-text-secondary">Monthly Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-light-green rounded-full h-4 mb-6 border border-pale-sage">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ duration: 1 }}
            className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full"
          >
            <div className="h-full w-full rounded-full bg-gradient-to-r from-green-300 to-green-400 animate-pulse"></div>
          </motion.div>
        </div>

        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Started: Oct 1, 2024</span>
          <span>Goal: Nov 1, 2024</span>
          <span>Estimated: 7 days remaining</span>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 bg-warm-cream p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover' 
                : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history' 
                ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover'
                : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
            }`}
          >
            History
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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Recent Activity</h3>
            <div className="space-y-4">
              {completedLessons.slice(0, 4).map((lesson, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-light-green rounded-lg hover:shadow-card transition-shadow cursor-pointer"
                  onClick={() => startLesson(lesson.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest-green">{lesson.title}</h4>
                      <div className="flex items-center space-x-3 text-sm text-text-secondary mt-1">
                        <span>{lesson.date}</span>
                        <span>•</span>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">{lesson.score}%</div>
                    <div className="text-xs text-green-500 font-medium">Completed</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Points History */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Points History</h3>
            <div className="space-y-3">
              {[150, 120, 140, 100, 130].map((points, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center justify-between p-3 border-b border-light-green last:border-0 cursor-pointer"
                  onClick={() => alert('View details - Feature not implemented')}
                >
                  <span className="text-sm text-text-secondary">
                    {['Oct 10', 'Oct 08', 'Oct 05', 'Oct 02', 'Sep 28'][index]}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-green-500">+{points} pts</span>
                    <span className="text-sm text-text-secondary">
                      Total: {2850 - [150, 120, 140, 100, 130].slice(0, index + 1).reduce((a, b) => a + b, 0)} pts
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'history' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-card hover:shadow-card-hover overflow-hidden border border-pale-sage"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-green">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-forest-green">Lesson</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-forest-green">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-forest-green">Duration</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-forest-green">Score</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-forest-green">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-green">
                {completedLessons.map((lesson) => (
                  <motion.tr
                    key={lesson.id}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    className="cursor-pointer"
                    onClick={() => startLesson(lesson.id)}
                  >
                    <td className="py-4 px-6 font-medium text-forest-green">{lesson.title}</td>
                    <td className="py-4 px-6 text-sm text-text-secondary">{lesson.date}</td>
                    <td className="py-4 px-6 text-sm text-text-secondary">{lesson.duration}</td>
                    <td className="py-4 px-6 text-sm font-bold text-green-500">{lesson.score}%</td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'achievements' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {achievementsList.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
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
                  <AcademicCapIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-forest-green">{achievement.title}</h3>
                  <p className="text-sm text-text-secondary">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-text-secondary">Unlocked on {achievement.date}</span>
                    </div>
                  )}
                </div>
              </div>
              {achievement.unlocked && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-yellow-700">{achievement.date}</span>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <StarIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (completedLessons.length === 0) {
              startLesson('lesson-1')
            } else {
              startLesson('lesson-1')
            }
          }}
          className="w-full py-4 bg-forest-green text-white rounded-lg font-bold hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
        >
          <PlayIcon className="w-5 h-5 inline mr-2" />
          Start New Lesson
        </motion.button>
      </motion.div>

      {/* Lesson Modal */}
      <AnimatePresence>
        {currentLesson && currentLessonData && !quizResult && (
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
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pale-sage"
            >
              <div className="p-6 border-b border-light-green sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold text-forest-green">{currentLessonData.title}</h2>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeLesson}
                    className="w-10 h-10 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200 border border-gray-200"
                  >
                    <span className="text-xl font-bold text-gray-600">×</span>
                  </motion.button>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <div className="w-full bg-light-green rounded-full h-2 mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${lessonProgress}%` }}
                      className="bg-forest-green h-2 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-text-secondary mb-4">Lesson Progress: {lessonProgress}%</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-light-green rounded-lg border border-pale-sage">
                    <h3 className="font-serif font-bold mb-2 text-forest-green">Lesson Content</h3>
                    <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                      {currentLessonData.content}
                    </p>
                  </div>

                  <div className="p-4 bg-pale-sage/30 rounded-lg border border-pale-sage">
                    <h3 className="font-serif font-bold mb-4 text-forest-green">
                      {currentLessonData.quiz.question}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {currentLessonData.quiz.options.map((option, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => quizAnswer === null && handleQuizAnswer(index)}
                          className={`p-4 text-left rounded-lg transition-colors ${
                            quizAnswer === index
                              ? quizResult === 'correct'
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'bg-red-100 border-2 border-red-500'
                              : quizAnswer !== null && index === currentLessonData.quiz.correct
                                ? 'bg-green-100 border-2 border-green-500'
                                : quizAnswer !== null && index !== currentLessonData.quiz.correct
                                  ? 'opacity-50'
                                  : 'bg-white border border-gray-200 hover:bg-light-green'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {quizResult === 'correct' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-green-50 border-t border-green-200 text-center"
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-serif font-bold text-green-600 mb-2">Excellent!</h3>
                  <p className="text-text-secondary">You've completed this lesson and earned points!</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      <AnimatePresence>
        {quizResult === 'correct' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-serif font-bold text-forest-green mb-2">Congratulations!</h2>
              <p className="text-text-secondary mb-6">You've completed a lesson and earned 20 points!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Reset all state and start fresh lesson
                  setCurrentLesson(null)
                  setCurrentLessonData(null)
                  setLessonProgress(0)
                  setQuizAnswer(null)
                  setQuizResult(null)
                  setTimeout(() => {
                    startLesson('lesson-1')
                  }, 100)
                }}
                className="px-6 py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600"
              >
                Continue Learning
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}