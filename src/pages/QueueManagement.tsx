import React, { useState, useEffect, useRef } from 'react'
import { 
  UsersIcon, 
  ClockIcon, 
  CheckBadgeIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface QueueItem {
  id: string
  token: string
  patientName: string
  arrivalTime: string
  status: 'waiting' | 'called' | 'in-progress' | 'completed'
  priority: 'normal' | 'urgent'
  department: string
  reason: string
}

export default function QueueManagement() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in-progress' | 'completed'>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const { 
    queue: contextQueue, 
    updateQueueItem, 
    getNextInQueue,
    soundEnabled: contextSoundEnabled,
    toggleSound
  } = useData()

  // Sync with context
  useEffect(() => {
    setQueue(contextQueue)
    setSoundEnabled(contextSoundEnabled)
  }, [contextQueue, contextSoundEnabled])

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playBeep = () => {
    if (!soundEnabled || !audioContextRef.current) return
    
    try {
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing beep:', error)
    }
  }

  const playAnnouncementSound = () => {
    if (!soundEnabled || !audioContextRef.current) return
    
    try {
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440
      oscillator.type = 'sine'
      gainNode.gain.value = 0.2
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.8)
    } catch (error) {
      console.error('Error playing announcement:', error)
    }
  }

  const updateStatus = (id: string, newStatus: QueueItem['status']) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ))
    updateQueueItem(id, newStatus)
  }

  const callNextPatient = () => {
    const nextPatient = getNextInQueue()
    if (nextPatient) {
      updateStatus(nextPatient.id, 'called')
      playBeep()
      playAnnouncementSound()
      
      setTimeout(() => {
        updateStatus(nextPatient.id, 'in-progress')
      }, 3000)
    }
  }

  const handleStatusChange = (id: string, newStatus: QueueItem['status']) => {
    if (newStatus === 'called') {
      playBeep()
      playAnnouncementSound()
    }
    updateStatus(id, newStatus)
  }

  const filteredQueue = queue.filter(item => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.token.includes(searchTerm)
    const matchesFilter = filter === 'all' || item.status === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    totalWaiting: queue.filter(q => q.status === 'waiting').length,
    totalCalled: queue.filter(q => q.status === 'called').length,
    totalInProgress: queue.filter(q => q.status === 'in-progress').length,
    averageWaitTime: '25 min'
  }

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
          <h1 className="text-3xl font-serif font-bold text-forest-green">Queue Management</h1>
          <p className="text-text-secondary">Manage patient queues and appointments</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSound}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {soundEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
            <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={callNextPatient}
            className="flex items-center space-x-2 bg-forest-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-all shadow-card hover:shadow-card-hover"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Call Next Patient</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ClockIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.totalWaiting}</div>
          <div className="text-sm text-text-secondary mt-1">Waiting</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.totalCalled}</div>
          <div className="text-sm text-text-secondary mt-1">Called</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckBadgeIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.totalInProgress}</div>
          <div className="text-sm text-text-secondary mt-1">In Progress</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <ArrowPathIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.averageWaitTime}</div>
          <div className="text-sm text-text-secondary mt-1">Avg Wait Time</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Queue List */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-light-green border border-light-green rounded-lg focus:outline-none focus:ring-2 focus:ring-pale-sage transition-all"
                  placeholder="Search patients..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {(['all', 'waiting', 'in-progress', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f 
                        ? 'bg-forest-green text-white' 
                        : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {filteredQueue.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      item.priority === 'urgent' ? 'border-l-4 border-red-500 bg-red-50' : 'bg-light-green'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl transition-colors ${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : item.status === 'in-progress'
                            ? 'bg-forest-green text-white'
                            : item.status === 'called'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-200 text-gray-600'
                      }`}>
                        {item.status === 'completed' ? '✓' : item.token.replace('#', '')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-forest-green">{item.patientName}</h4>
                          {item.priority === 'urgent' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">URGENT</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-text-secondary">{item.arrivalTime}</span>
                          <span className="text-sm text-text-secondary">•</span>
                          <span className="text-sm text-text-secondary">{item.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === 'waiting' && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusChange(item.id, 'called')}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          Call
                        </motion.button>
                      )}
                      {item.status === 'called' && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusChange(item.id, 'in-progress')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Start
                        </motion.button>
                      )}
                      {item.status === 'in-progress' && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusChange(item.id, 'completed')}
                          className="px-4 py-2 bg-pale-sage text-white rounded-lg hover:bg-forest-green transition-colors"
                        >
                          Complete
                        </motion.button>
                      )}
                      {item.status === 'completed' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          Done
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredQueue.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No patients found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Queue Status */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h3 className="text-xl font-serif font-bold mb-4 text-forest-green">Queue Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-light-green pb-2">
                <span className="text-sm text-text-secondary">Current Token</span>
                <span className="text-2xl font-bold text-forest-green">
                  {queue.find(q => q.status === 'in-progress')?.token.replace('#', '') || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-light-green pb-2">
                <span className="text-sm text-text-secondary">Next in Line</span>
                <span className="text-xl font-bold text-forest-green">
                  {queue.find(q => q.status === 'waiting')?.token || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Patients</span>
                <span className="text-xl font-bold text-forest-green">{queue.length}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Recent Activity</h3>
            <div className="space-y-3">
              {queue.slice().reverse().slice(0, 3).map((item, index) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between text-sm cursor-pointer"
                >
                  <span className="text-text-secondary">{item.token}</span>
                  <span className="font-medium text-forest-green">{item.patientName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : item.status === 'in-progress'
                        ? 'bg-forest-green text-white'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}