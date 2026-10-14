import React, { useState, useEffect, useRef } from 'react'
import { 
  ClockIcon, 
  UserIcon, 
  ArrowUpOnSquareIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CalendarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

interface Patient {
  id: string
  name: string
  token: string
  arrivalTime: string
  status: 'waiting' | 'called' | 'in-consultation' | 'completed'
  priority: 'normal' | 'urgent'
  estimatedWait: string
}

export default function WaitingRoom() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [currentDoctor, setCurrentDoctor] = useState('Dr. John Doe')
  const [doctorAvailability, setDoctorAvailability] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const { queue, soundEnabled: contextSoundEnabled, toggleSound } = useData()

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Sync with context
  useEffect(() => {
    const transformedPatients = queue.map(item => ({
      id: item.id,
      name: item.patientName,
      token: item.token,
      arrivalTime: item.arrivalTime,
      status: item.status as 'waiting' | 'called' | 'in-consultation' | 'completed',
      priority: item.priority,
      estimatedWait: item.status === 'waiting' ? '30 min' : '-'
    }))
    setPatients(transformedPatients)
    setSoundEnabled(contextSoundEnabled)
  }, [queue, contextSoundEnabled])

  const playAnnouncement = (patientName: string, token: string) => {
    if (!soundEnabled || !audioContextRef.current) return
    
    try {
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 500
      oscillator.type = 'triangle'
      gainNode.gain.value = 0.2
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1.0)
      
      // Also speak the announcement
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Calling ${patientName}, token ${token}`)
        utterance.rate = 0.9
        utterance.pitch = 1.1
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('Error playing announcement:', error)
    }
  }

  const stats = {
    totalWaiting: patients.filter(p => p.status === 'waiting').length,
    totalCalled: patients.filter(p => p.status === 'called').length,
    inConsultation: patients.filter(p => p.status === 'in-consultation').length,
  }

  // Simulate waiting time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => prev.map(p => {
        if (p.status === 'waiting' && p.priority === 'normal') {
          const waitTime = parseInt(p.estimatedWait) - 5
          return { ...p, estimatedWait: `${Math.max(0, waitTime)} min` }
        }
        return p
      }))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

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
          <h1 className="text-3xl font-serif font-bold text-forest-green">Waiting Room Display</h1>
          <p className="text-text-secondary">Real-time queue status and patient information</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-warm-cream rounded-lg border border-light-green">
            <UserIcon className="w-5 h-5 text-forest-green" />
            <span className="font-medium text-forest-green">Current Doctor:</span>
            <span className="font-bold">{currentDoctor}</span>
          </div>
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
        </div>
      </div>

      {/* Doctor Status Banner */}
      <div className="mb-8">
        <div className={`rounded-lg shadow-card hover:shadow-card-hover transition-shadow flex items-center justify-between ${
          doctorAvailability 
            ? 'bg-white p-6' 
            : 'bg-gray-100 p-6'
        }`}>
          <div className="flex items-center space-x-6">
            <div className={`flex items-center space-x-3 ${doctorAvailability ? '' : 'opacity-70'}`}>
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                doctorAvailability ? 'bg-pale-sage/30 text-forest-green' : 'bg-gray-300 text-gray-500'
              }`}>
                <UserIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-xl font-serif font-bold ${doctorAvailability ? 'text-forest-green' : 'text-gray-500'}`}>{currentDoctor}</h3>
                <p className="text-sm text-text-secondary">General Practitioner</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${doctorAvailability ? 'text-forest-green' : 'text-gray-500'}`}>{stats.inConsultation}</div>
              <div className="text-sm text-text-secondary">In Consultation</div>
            </div>
            <div className="w-px h-16 bg-gray-200"></div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${doctorAvailability ? 'text-forest-green' : 'text-gray-500'}`}>{stats.totalWaiting}</div>
              <div className="text-sm text-text-secondary">Waiting</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              doctorAvailability ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className={`font-bold text-lg ${doctorAvailability ? 'text-green-600' : 'text-gray-500'}`}>
              {doctorAvailability ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current and Next */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h2 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
              <ClockIcon className="w-6 h-6 mr-2" />
              Current Patient
            </h2>
            <div className="flex items-center justify-between p-6 bg-pale-sage/20 rounded-lg border border-pale-sage">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-pale-sage rounded-xl flex items-center justify-center text-2xl font-bold text-forest-green">
                  {patients.find(p => p.status === 'in-consultation')?.token.replace('#', '')}
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-forest-green">
                    {patients.find(p => p.status === 'in-consultation')?.name || 'No patient'}
                  </h3>
                  <p className="text-text-secondary">
                    {patients.find(p => p.status === 'in-consultation')?.token || '-'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">
                  {patients.find(p => p.status === 'in-consultation')?.status === 'in-consultation' ? '✓' : '-'}
                </div>
                <div className="text-sm text-text-secondary">
                  {patients.find(p => p.status === 'in-consultation')?.status === 'in-consultation' ? 'In Consultation' : 'Ready'}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h2 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
              <ArrowUpOnSquareIcon className="w-6 h-6 mr-2" />
              Next in Queue
            </h2>
            <div className="space-y-3">
              {patients.filter(p => p.status === 'waiting').map((patient) => (
                <motion.div
                  key={patient.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer ${
                    patient.priority === 'urgent' 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-light-green border-pale-sage'
                  }`}
                  onClick={() => {
                    if (patient.priority === 'urgent') {
                      playAnnouncement(patient.name, patient.token)
                      alert(`Urgent patient called: ${patient.name}`)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-2xl text-forest-green">{patient.token.replace('#', '')}</span>
                      <span className="text-sm text-text-secondary">{patient.arrivalTime}</span>
                    </div>
                    {patient.priority === 'urgent' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">URGENT</span>
                    )}
                  </div>
                  <h4 className="font-bold text-forest-green">{patient.name}</h4>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-text-secondary">Estimated wait:</span>
                    <span className={`font-bold ${patient.priority === 'urgent' ? 'text-red-600' : 'text-pale-sage'}`}>
                      {patient.estimatedWait}
                    </span>
                  </div>
                </motion.div>
              ))}
              {patients.filter(p => p.status === 'waiting').length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-text-secondary"
                >
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No patients waiting</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Waiting Room Info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Waiting Room Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-light-green rounded-lg">
                <span className="text-text-secondary">Total Waiting</span>
                <span className="font-bold text-3xl text-forest-green">{stats.totalWaiting}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-light-green rounded-lg">
                <span className="text-text-secondary">Called Today</span>
                <span className="font-bold text-3xl text-pale-sage">{stats.totalCalled}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-light-green rounded-lg">
                <span className="text-text-secondary">Average Wait Time</span>
                <span className="font-bold text-3xl text-forest-green">25m</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-light-green rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
          >
            <h3 className="text-lg font-serif font-bold mb-4 text-forest-green">Waiting Room Tips</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-forest-green" />
                <p className="text-text-secondary">Check your queue status regularly. Estimated wait times are updated every minute.</p>
              </div>
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-forest-green" />
                <p className="text-text-secondary">Your appointment time may vary based on patient conditions and emergencies.</p>
              </div>
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-forest-green" />
                <p className="text-text-secondary">Please arrive 15 minutes before your scheduled appointment time.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}