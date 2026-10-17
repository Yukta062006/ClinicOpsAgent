import React, { useState, useEffect } from 'react'
import { 
  CalendarIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  BeakerIcon,
  VideoCameraIcon,
  PlayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  BookOpenIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  FireIcon,
  MapPinIcon,
  BuildingIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'

interface Appointment {
  id: string
  doctor: string
  date: string
  time: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'learning' | 'health'>('appointments')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'visit' | 'records' | 'consultation' | 'game' | 'research' | 'summary'>('visit')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [streakCompleted, setStreakCompleted] = useState(false)
  const navigate = useNavigate()
  
  const { 
    appointments, 
    queue, 
    startLesson, 
    userPoints, 
    userStreak, 
    lessons,
    soundEnabled,
    toggleSound,
    completeLesson
  } = useData()

  // Check if streak is already completed today
  useEffect(() => {
    const today = new Date().toDateString()
    const completedStreak = localStorage.getItem('clinicops_streak_completed')
    if (completedStreak === today) {
      setStreakCompleted(true)
    }
  }, [])

  const handleDailyStreak = () => {
    if (!streakCompleted) {
      const today = new Date().toDateString()
      localStorage.setItem('clinicops_streak_completed', today)
      setStreakCompleted(true)
      completeLesson('streak', 100)
      alert('Streak completed! Great job maintaining your health journey!')
    }
  }

  // Calculate real data from context
  const patientAppointments = appointments.slice(0, 4) as Appointment[]
  const waitingPatient = queue.find(q => q.status === 'waiting')
  
  const healthStats = {
    steps: 8432,
    calories: 2150,
    water: 8,
    sleep: 7.5
  }

  const learningProgress = {
    completedLessons: lessons.filter(l => l.completed).length,
    avgScore: 92,
    streak: userStreak,
    points: userPoints
  }

  const handleQuickAction = (type: 'visit' | 'records' | 'consultation' | 'game' | 'research' | 'summary') => {
    setModalType(type)
    setShowModal(true)
    switch (type) {
      case 'game':
        navigate('/health-games')
        break
      case 'visit':
        navigate('/front-desk')
        break
      case 'records':
        navigate('/learning-progress')
        break
      case 'consultation':
        navigate('/patient-dashboard')
        break
      case 'research':
        navigate('/medical-research')
        break
      case 'summary':
        navigate('/research-summary')
        break
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-green">Patient Dashboard</h1>
          <p className="text-sm text-text-secondary">Welcome back, Alice Johnson</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-medium text-forest-green">Queue Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-500 font-medium">
                {waitingPatient ? 'In Waiting Room' : 'No active queue'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-light-green text-forest-green rounded-lg">
              <ClockIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-forest-green">Current Wait</span>
          </div>
          <div className="text-2xl font-serif font-bold text-forest-green">
            {waitingPatient ? '15 min' : 'N/A'}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Token #{waitingPatient?.token.replace('#', '') || '-'}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-light-green text-forest-green rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-forest-green">{healthStats.steps}</div>
          <div className="text-xs text-text-secondary mt-1">Steps Today</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-light-green text-forest-green rounded-lg">
              <BeakerIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-forest-green">
            {patientAppointments.filter(a => a.status === 'scheduled').length}
          </div>
          <div className="text-xs text-text-secondary mt-1">Upcoming Visits</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-light-green text-forest-green rounded-lg">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-forest-green">12</div>
          <div className="text-xs text-text-secondary mt-1">Records Available</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-card"
          >
            <div className="flex items-center space-x-4 mb-5">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'appointments' 
                    ? 'bg-forest-green text-white' 
                    : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Appointments</span>
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'learning' 
                    ? 'bg-forest-green text-white' 
                    : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                }`}
              >
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span>Learning</span>
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'health' 
                    ? 'bg-forest-green text-white' 
                    : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                }`}
              >
                <BeakerIcon className="w-4 h-4" />
                <span>Health</span>
              </button>
            </div>

            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {patientAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-warm-cream/50 rounded-lg hover:bg-light-green/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-forest-green text-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-text-primary">{appointment.doctor}</h4>
                        <p className="text-xs text-text-secondary">{appointment.type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-forest-green">{appointment.date}</span>
                          <span className="text-xs text-text-secondary">•</span>
                          <span className="text-xs text-text-secondary">{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : appointment.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'learning' && (
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 bg-light-green text-forest-green rounded-xl"
                >
                  <h3 className="text-base font-serif font-bold mb-2">Learning Progress</h3>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-xl font-serif font-bold">{learningProgress.completedLessons}</div>
                      <div className="text-xs opacity-80">Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-serif font-bold">{learningProgress.avgScore}%</div>
                      <div className="text-xs opacity-80">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-serif font-bold">{learningProgress.points}</div>
                      <div className="text-xs opacity-80">Points</div>
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-forest-green">Recent Activity</h3>
                  {[{
                    title: 'Diabetes Prevention', date: 'Oct 10', score: 95, completed: true },
                    { title: 'Healthy Living', date: 'Oct 08', score: 88, completed: true },
                    { title: 'Nutrition Basics', date: 'Oct 05', score: 92, completed: true },
                  ].map((lesson, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between p-3 bg-warm-cream/50 rounded-lg cursor-pointer"
                      onClick={() => startLesson(`lesson-${index + 1}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-light-green text-forest-green rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{lesson.title}</div>
                          <div className="text-xs text-text-secondary">{lesson.date}</div>
                        </div>
                      </div>
                      {lesson.completed && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-green-600">{lesson.score}%</span>
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Voice Summary Section */}
                <div className="p-4 bg-pale-sage/30 rounded-lg border border-pale-sage">
                  <h3 className="font-serif font-bold mb-3 text-forest-green">Voice Summary</h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text-secondary">Listen to your health records and learning progress summaries</p>
                  </div>
                  <button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled)
                      if (!voiceEnabled) {
                        const utterance = new SpeechSynthesisUtterance('Here is your health summary. You have completed 3 lessons with an average score of 92 percent. Your current streak is 14 days.')
                        utterance.rate = 1
                        utterance.pitch = 1
                        window.speechSynthesis.speak(utterance)
                      } else {
                        window.speechSynthesis.cancel()
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      voiceEnabled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-forest-green text-white'
                    }`}
                  >
                    {voiceEnabled ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                    <span>{voiceEnabled ? 'Stop Reading' : 'Read Summary Aloud'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-4">
                {/* Daily Zip Challenge Section */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-5 shadow-card cursor-pointer"
                  onClick={() => navigate('/daily-zip-challenge')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-forest-green">
                        <Squares2X2Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl text-forest-green">Daily Zip Challenge</h3>
                        <p className="text-sm text-text-secondary">Complete today's path to keep your streak alive</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-forest-green">{userStreak}</div>
                      <div className="text-xs text-text-secondary">
                        {userStreak === 1 ? 'Day Streak' : 'Days Streak'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Ready to play</span>
                    </div>
                  </div>
                </motion.div>

                {/* Daily Streak Section */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-5 shadow-card cursor-pointer"
                  onClick={handleDailyStreak}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${streakCompleted ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        <FireIcon className={`w-8 h-8 ${streakCompleted ? 'text-green-600' : 'text-yellow-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl text-forest-green">Daily Streak</h3>
                        <p className="text-sm text-text-secondary">Complete daily health activity</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-forest-green">{userStreak}</div>
                      <div className="text-xs text-text-secondary">
                        {userStreak === 1 ? 'Day Streak' : 'Days Streak'}
                      </div>
                    </div>
                  </div>
                  {streakCompleted ? (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-green-700 font-medium">Streak completed today!</p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-center">
                      <p className="text-sm text-yellow-700 font-medium">Click to complete today's health activity</p>
                    </div>
                  )}
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-warm-cream/50 rounded-xl text-center"
                  >
                    <div className="text-2xl font-serif font-bold text-forest-green mb-1">{healthStats.calories}</div>
                    <div className="text-xs text-text-secondary">Calories Burned</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-warm-cream/50 rounded-xl text-center"
                  >
                    <div className="text-2xl font-serif font-bold text-forest-green mb-1">{healthStats.water}</div>
                    <div className="text-xs text-text-secondary">Glasses of Water</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-warm-cream/50 rounded-xl text-center"
                  >
                    <div className="text-2xl font-serif font-bold text-forest-green mb-1">{healthStats.sleep}</div>
                    <div className="text-xs text-text-secondary">Hours of Sleep</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-warm-cream/50 rounded-xl text-center"
                  >
                    <div className="text-2xl font-serif font-bold text-forest-green mb-1">98.6°</div>
                    <div className="text-xs text-text-secondary">Avg Temperature</div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-card"
          >
            <h3 className="text-base font-serif font-bold text-forest-green mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('visit')}
                className="w-full flex items-center space-x-3 p-2.5 bg-light-green text-forest-green rounded-lg hover:bg-green-500 hover:text-white transition-colors text-sm"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Schedule New Visit</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('records')}
                className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 text-forest-green rounded-lg hover:bg-light-green hover:text-forest-green transition-colors text-sm"
              >
                <BeakerIcon className="w-4 h-4" />
                <span>View Medical Records</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('consultation')}
                className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 text-forest-green rounded-lg hover:bg-light-green hover:text-forest-green transition-colors text-sm"
              >
                <VideoCameraIcon className="w-4 h-4" />
                <span>Virtual Consultation</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('game')}
                className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 text-forest-green rounded-lg hover:bg-light-green hover:text-forest-green transition-colors text-sm"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Start Health Game</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('research')}
                className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 text-forest-green rounded-lg hover:bg-light-green hover:text-forest-green transition-colors text-sm"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>Medical Research</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction('summary')}
                className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 text-forest-green rounded-lg hover:bg-light-green hover:text-forest-green transition-colors text-sm"
              >
                <SpeakerWaveIcon className="w-4 h-4" />
                <span>Voice Summary</span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-light-green text-forest-green rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BeakerIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold">Health Tip</h3>
                <p className="text-xs opacity-80">Stay hydrated!</p>
              </div>
            </div>
            <p className="text-xs opacity-80">Drink at least 8 glasses of water today to stay healthy and energized.</p>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-light-green">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-serif font-bold text-forest-green">
                    {modalType === 'visit' && 'Schedule New Visit'}
                    {modalType === 'records' && 'View Medical Records'}
                    {modalType === 'consultation' && 'Virtual Consultation'}
                    {modalType === 'game' && 'Start Health Game'}
                  </h2>
                  <button 
                    onClick={closeModal}
                    className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <span className="text-xl font-bold text-gray-600">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-text-secondary mb-4">
                  {modalType === 'visit' && 'Select a preferred date and time for your next appointment.'}
                  {modalType === 'records' && 'Access your complete medical records and history.'}
                  {modalType === 'consultation' && 'Join a virtual consultation with your healthcare provider.'}
                  {modalType === 'game' && 'Start an educational health game to earn points.'}
                </p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={closeModal}
                    className="px-4 py-2 bg-warm-cream text-text-secondary rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (modalType === 'game') {
                        navigate('/health-games')
                      } else if (modalType === 'visit') {
                        navigate('/front-desk')
                      } else if (modalType === 'records') {
                        navigate('/learning-progress')
                      } else if (modalType === 'consultation') {
                        navigate('/patient-dashboard')
                      } else if (modalType === 'research') {
                        navigate('/medical-research')
                      } else if (modalType === 'summary') {
                        navigate('/research-summary')
                      } else {
                        alert(`Action: ${modalType} - Feature not implemented in this demo`)
                        closeModal()
                      }
                    }}
                    className="px-4 py-2 bg-forest-green text-white rounded-lg hover:bg-green-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}