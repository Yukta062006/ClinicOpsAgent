import { useState, useEffect, useRef } from 'react'
import { 
  UsersIcon, 
  ClockIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  TvIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'

export default function QueueManagement() {
  const navigate = useNavigate()
  const { 
    queue, 
    updateQueueItem, 
    callNextPatient, 
    soundEnabled, 
    toggleSound
  } = useData()

  const [selectedRoomFilter, setSelectedRoomFilter] = useState<'all' | 'room02' | 'room03' | 'paused'>('all')
  const [announcementType, setAnnouncementType] = useState('Audio & screen')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [showReassignModal, setShowReassignModal] = useState<any | null>(null)
  const [selectedQueueAction, setSelectedQueueAction] = useState<any | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize web audio for hospital announcement chime
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      console.warn('AudioContext not available:', e)
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  const notify = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Hospital chime sound (Two-tone chime: D5 -> A5)
  const playHospitalChime = () => {
    if (!soundEnabled) return
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now) // D5
      gain1.gain.setValueAtTime(0.2, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.6)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880, now + 0.3) // A5
      gain2.gain.setValueAtTime(0.2, now + 0.3)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.3)
      osc2.stop(now + 0.9)
    } catch (e) {
      console.warn('Chime audio playback error:', e)
    }
  }

  // Filtered queue items
  const filteredQueue = queue.filter(item => {
    const s = (item.status || '').toLowerCase()
    if (selectedRoomFilter === 'room02') return item.room === 'Room 02'
    if (selectedRoomFilter === 'room03') return item.room === 'Room 03'
    if (selectedRoomFilter === 'paused') return s === 'paused' || s === 'delayed'
    return true
  })

  // Next patient to call
  const nextEligiblePatient = queue.find(q => {
    const s = (q.status || '').toLowerCase()
    return (s === 'waiting' || s === 'ready') && (q.room === 'Room 02' || !q.room)
  }) || queue.find(q => {
    const s = (q.status || '').toLowerCase()
    return s === 'waiting' || s === 'ready'
  })

  // Active called or in-progress token
  const activeCalledToken = queue.find(q => {
    const s = (q.status || '').toLowerCase()
    return s === 'in-progress' || s === 'called'
  })?.token || 'A-013'

  const handleCallToRoom02 = () => {
    const called = callNextPatient()
    if (called) {
      playHospitalChime()
      notify(`Token ${called.token} (${called.patientName}) called to ${called.room || 'Room 02'}. Screen & chime updated.`)
    } else {
      notify('No waiting patients remaining in queue.')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-forest-green text-white px-5 py-3 rounded-xl shadow-lg border border-pale-sage flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb + Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-forest-green/70 uppercase mb-1">
            OPD OPERATIONS / LIVE QUEUE
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
            Every patient. The right next step.
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            A shared view of arrivals, rooms and consultations across the clinic.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live • 09:42</span>
          </span>
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Chime sound is enabled' : 'Chime sound is muted'}
            className="p-2 rounded-lg border border-pale-sage bg-white text-forest-green hover:bg-pale-sage/40 transition-colors"
          >
            {soundEnabled ? <SpeakerWaveIcon className="w-4 h-4" /> : <SpeakerXMarkIcon className="w-4 h-4 text-stone-400" />}
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <UsersIcon className="w-4 h-4 text-forest-green" />
            <span>Waiting</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">04</div>
          <p className="text-xs text-text-secondary mt-1">Across two clinical queues</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <ClockIcon className="w-4 h-4 text-forest-green" />
            <span>In consultation</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">01</div>
          <p className="text-xs text-text-secondary mt-1">Room 02 • Dr. Cooper</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <ClockIcon className="w-4 h-4 text-forest-green" />
            <span>Longest wait</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">14 min</div>
          <p className="text-xs text-text-secondary mt-1">B-008 • Room 03</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <CheckCircleIcon className="w-4 h-4 text-forest-green" />
            <span>Completed today</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">03</div>
          <p className="text-xs text-text-secondary mt-1">Tokens closed by care team</p>
        </div>
      </div>

      {/* Rooms Overview (2 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room 02 Card */}
        <div className="bg-[#FAFBF9] rounded-xl p-6 border border-pale-sage shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-bold text-forest-green">
              Room 02
            </h3>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              In consultation
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Dr. Elena Cooper
          </p>
          <div className="text-2xl font-serif font-bold text-forest-green mb-1">
            Now: {activeCalledToken || 'A-013'}
          </div>
          <p className="text-xs text-stone-600">
            Next: {nextEligiblePatient?.token || 'A-014'} · 09:45 appointment
          </p>
        </div>

        {/* Room 03 Card */}
        <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-bold text-forest-green">
              Room 03
            </h3>
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
              Starts 10:00
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Dr. Daniel Kim
          </p>
          <div className="text-2xl font-serif font-bold text-forest-green mb-1">
            Next: B-008
          </div>
          <p className="text-xs text-stone-600">
            2 patients waiting · Morning clinic
          </p>
        </div>
      </div>

      {/* Main Grid: Left Column (Patient Queue Table) + Right Column (Next Patient & Display Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient Queue Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-forest-green">
                Patient queue
              </h3>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                Queue history ↗
              </button>
            </div>

            {/* Room Filter Pills */}
            <div className="inline-flex p-1 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs mb-4">
              <button
                onClick={() => setSelectedRoomFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedRoomFilter === 'all' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                All rooms
              </button>
              <button
                onClick={() => setSelectedRoomFilter('room02')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedRoomFilter === 'room02' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Room 02
              </button>
              <button
                onClick={() => setSelectedRoomFilter('room03')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedRoomFilter === 'room03' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Room 03
              </button>
              <button
                onClick={() => setSelectedRoomFilter('paused')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedRoomFilter === 'paused' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Paused
              </button>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F8F6] border-y border-pale-sage text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                    <th className="py-2.5 px-3">TOKEN</th>
                    <th className="py-2.5 px-3">PATIENT</th>
                    <th className="py-2.5 px-3">ROOM</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">ARRIVED</th>
                    <th className="py-2.5 px-3">WAIT</th>
                    <th className="py-2.5 px-3 text-right">MORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pale-sage/50 text-sm">
                  {filteredQueue.map((item) => {
                    const isReady = item.status === 'waiting' || item.status === 'called'
                    const isInConsult = item.status === 'in-progress'

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isReady ? 'bg-[#FAFBF9] font-medium' : 'hover:bg-pale-sage/10'
                        }`}
                      >
                        {/* Token */}
                        <td className="py-3 px-3 font-serif font-bold text-forest-green text-sm">
                          {item.token}
                        </td>

                        {/* Patient */}
                        <td className="py-3 px-3 font-medium text-stone-800 text-xs">
                          {item.patientName}
                        </td>

                        {/* Room */}
                        <td className="py-3 px-3 text-xs text-text-secondary">
                          {item.room || 'Room 02'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isInConsult
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isReady
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'cancelled'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Arrived */}
                        <td className="py-3 px-3 text-xs text-text-secondary">
                          {item.arrivalTime}
                        </td>

                        {/* Wait */}
                        <td className="py-3 px-3 text-xs text-stone-600">
                          {isInConsult ? '—' : `${item.estimatedWait || '5 min'}`}
                        </td>

                        {/* More */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedQueueAction(item)}
                            className="p-1 text-stone-400 hover:text-forest-green rounded-md hover:bg-pale-sage/20"
                          >
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right Column (1 col): Next Patient + Display Controls */}
        <div className="space-y-6">
          
          {/* Next Patient Card */}
          <div className="bg-[#FAFBF9] rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase font-semibold text-text-secondary tracking-wider">
                Next patient
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                ROOM 02 • READY
              </span>
            </div>

            <div className="text-4xl font-serif font-black text-forest-green tracking-tight my-2">
              {nextEligiblePatient?.token || 'A-014'}
            </div>

            <h3 className="text-xl font-serif font-bold text-forest-green">
              {nextEligiblePatient?.patientName || 'Maya Patel'}
            </h3>

            <p className="text-xs text-text-secondary mb-4">
              WC-1042 · Follow-up Dr. Elena Cooper · 09:45 AM
            </p>

            <div className="space-y-2.5 text-xs border-y border-pale-sage py-3 mb-4">
              <div className="flex items-center gap-2 text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-semibold">Check-in complete</span>
                  <span className="text-text-secondary block text-[11px]">Arrived at 09:35</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-stone-700">
                <CheckCircleIcon className="w-4 h-4 text-forest-green shrink-0" />
                <div>
                  <span className="font-semibold">Intake form ready</span>
                  <span className="text-text-secondary block text-[11px]">Patient preparation complete</span>
                </div>
              </div>
            </div>

            {/* Call button */}
            <button
              onClick={handleCallToRoom02}
              className="w-full py-3 rounded-lg bg-forest-green text-white font-medium text-sm hover:bg-forest-green/90 transition-all shadow-sm flex items-center justify-center gap-2 mb-2"
            >
              <SpeakerWaveIcon className="w-4 h-4" />
              <span>Call to Room 02</span>
            </button>

            {/* Send arrival message */}
            <button
              onClick={() => notify(`SMS alert sent to ${nextEligiblePatient?.patientName || 'patient'}: 'Please proceed to Room 02.'`)}
              className="w-full py-2.5 rounded-lg border border-pale-sage bg-white text-forest-green font-medium text-xs hover:bg-pale-sage/30 transition-colors flex items-center justify-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Send arrival message</span>
            </button>

            <div className="flex items-center justify-between text-xs text-text-secondary pt-3 mt-1">
              <button 
                onClick={() => {
                  if (nextEligiblePatient) updateQueueItem(nextEligiblePatient.id, 'cancelled')
                  notify(`Token ${nextEligiblePatient?.token} paused.`)
                }}
                className="hover:text-forest-green"
              >
                Pause token
              </button>
              <button 
                onClick={() => setShowReassignModal(nextEligiblePatient)}
                className="hover:text-forest-green"
              >
                Reassign room
              </button>
            </div>
          </div>

          {/* Display Controls */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm space-y-4">
            <h4 className="text-base font-serif font-bold text-forest-green">
              Display controls
            </h4>

            <div className="p-3.5 rounded-lg bg-[#FAFBF9] border border-pale-sage flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pale-sage/60 flex items-center justify-center text-forest-green">
                  <TvIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-forest-green">Waiting room display</div>
                  <div className="text-[11px] text-text-secondary">Connected • Updated 09:42</div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>

            <button
              onClick={() => navigate('/waiting-room')}
              className="w-full py-2.5 rounded-lg border border-pale-sage bg-white text-forest-green font-semibold text-xs hover:bg-pale-sage/30 transition-colors"
            >
              Open display preview
            </button>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Call announcement
              </label>
              <select
                value={announcementType}
                onChange={(e) => setAnnouncementType(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
              >
                <option>Audio & screen</option>
                <option>Screen only (Silent)</option>
                <option>Audio chime only</option>
              </select>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Public display uses token numbers only. Patient names stay private.
            </p>
          </div>

        </div>
      </div>

      {/* Reassign Room Modal */}
      <AnimatePresence>
        {showReassignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-lg font-serif font-bold text-forest-green">
                  Reassign Room: {showReassignModal.token}
                </h3>
                <button onClick={() => setShowReassignModal(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-text-secondary">
                  Move patient {showReassignModal.patientName} to another consulting room:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      updateQueueItem(showReassignModal.id, 'waiting')
                      notify(`Assigned to Room 02 (Dr. Elena Cooper)`)
                      setShowReassignModal(null)
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-pale-sage hover:bg-pale-sage/20 font-medium text-forest-green"
                  >
                    Room 02 — Dr. Elena Cooper (Family Medicine)
                  </button>
                  <button
                    onClick={() => {
                      updateQueueItem(showReassignModal.id, 'waiting')
                      notify(`Assigned to Room 03 (Dr. Daniel Kim)`)
                      setShowReassignModal(null)
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-pale-sage hover:bg-pale-sage/20 font-medium text-forest-green"
                  >
                    Room 03 — Dr. Daniel Kim (Internal Medicine)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue Item Action Dropdown / Modal */}
      <AnimatePresence>
        {selectedQueueAction && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-lg font-serif font-bold text-forest-green">
                  Token {selectedQueueAction.token} Actions
                </h3>
                <button onClick={() => setSelectedQueueAction(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    updateQueueItem(selectedQueueAction.id, 'called')
                    notify(`Token ${selectedQueueAction.token} called.`)
                    setSelectedQueueAction(null)
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-pale-sage/20 text-forest-green font-medium"
                >
                  Call Patient for Consultation
                </button>
                <button
                  onClick={() => {
                    updateQueueItem(selectedQueueAction.id, 'cancelled')
                    notify(`Token ${selectedQueueAction.token} cancelled.`)
                    setSelectedQueueAction(null)
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-pale-sage/20 text-stone-700"
                >
                  Cancel / Skip Token
                </button>
                <button
                  onClick={() => {
                    updateQueueItem(selectedQueueAction.id, 'completed')
                    notify(`Token ${selectedQueueAction.token} completed.`)
                    setSelectedQueueAction(null)
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-pale-sage/20 text-emerald-800"
                >
                  Mark Consultation Completed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">Queue Audit & History</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-[#FAFBF9] border border-pale-sage flex justify-between">
                  <div>
                    <span className="font-bold text-forest-green">A-012 (Rahul Mehta)</span>
                    <span className="text-text-secondary block text-[11px]">Room 02 • Completed at 09:25 AM</span>
                  </div>
                  <span className="text-emerald-700 font-semibold">Completed</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAFBF9] border border-pale-sage flex justify-between">
                  <div>
                    <span className="font-bold text-forest-green">A-011 (Priya Joshi)</span>
                    <span className="text-text-secondary block text-[11px]">Room 02 • Completed at 09:10 AM</span>
                  </div>
                  <span className="text-emerald-700 font-semibold">Completed</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAFBF9] border border-pale-sage flex justify-between">
                  <div>
                    <span className="font-bold text-forest-green">A-010 (Aarav Sharma)</span>
                    <span className="text-text-secondary block text-[11px]">Room 02 • Completed at 08:55 AM</span>
                  </div>
                  <span className="text-emerald-700 font-semibold">Completed</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}