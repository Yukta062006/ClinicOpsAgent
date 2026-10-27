import { useState, useEffect } from 'react'
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { Building2, HelpCircle, Coffee, BookOpen } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useNavigate } from 'react-router-dom'

export default function WaitingRoom() {
  const navigate = useNavigate()
  const { 
    queue, 
    activeClinic, 
    soundEnabled, 
    toggleSound,
    activeToken
  } = useData()

  // Real-time clock
  const [currentTime, setCurrentTime] = useState('')
  const [currentDateFormatted, setCurrentDateFormatted] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
      setCurrentDateFormatted(now.toLocaleDateString('en-US', options).toUpperCase())
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Find actively called or in-progress token
  const activeServingItem = queue.find(q => {
    const s = (q.status || '').toLowerCase()
    return s === 'called' || s === 'in-progress'
  }) || queue[0]

  const servingToken = activeServingItem?.token || activeToken || 'A-013'
  const servingRoom = activeServingItem?.room || 'Room 02'
  const servingDoctor = activeServingItem?.doctorName || 'Dr. Elena Cooper'

  // Find upcoming waiting tokens
  const waitingTokens = queue.filter(q => {
    const s = (q.status || '').toLowerCase()
    return s === 'waiting' || s === 'ready'
  })
  const tokenNext1 = waitingTokens[0] || { token: 'A-014', room: 'Room 02', reason: 'You are next' }
  const tokenNext2 = waitingTokens[1] || { token: 'A-015', room: 'Room 02', reason: 'Please stay nearby' }
  const tokenNext3 = waitingTokens[2] || { token: 'B-008', room: 'Room 03', reason: 'Clinic starts 10:00' }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-forest-green/70 uppercase mb-1">
            OPD OPERATIONS / AUDIENCE DISPLAY
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
            Welcome to {activeClinic || 'Willow Family Clinic'}.
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Please watch for your token number. We'll guide you from here.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Display live</span>
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

      {/* Main Grid: Left Column (Now Serving + Next + Info Cards) + Right Column (Clock + While You Wait + Privacy) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Huge NOW SERVING Display Card */}
          <motion.div 
            key={servingToken}
            initial={{ scale: 0.98, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-[#1B3E2F] text-white rounded-2xl p-8 md:p-10 shadow-xl border border-forest-green/40 relative overflow-hidden"
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                NOW SERVING
              </span>
              <SpeakerWaveIcon className="w-6 h-6 text-emerald-300/80" />
            </div>

            {/* Token + Destination */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 my-6">
              <div>
                <div className="text-6xl md:text-8xl font-serif font-black tracking-tight text-white drop-shadow-md">
                  {servingToken}
                </div>
              </div>

              <div className="md:text-right border-t md:border-t-0 border-white/20 pt-4 md:pt-0">
                <p className="text-xs uppercase tracking-wider text-emerald-200/80 mb-1">
                  Please proceed to
                </p>
                <div className="text-4xl md:text-5xl font-serif font-bold text-white flex items-center md:justify-end gap-2">
                  <span>{servingRoom}</span>
                  <span className="text-emerald-300">→</span>
                </div>
                <p className="text-xs text-emerald-100/70 mt-2 font-medium">
                  {servingDoctor} • Outpatient Consultation
                </p>
              </div>
            </div>

            {/* Bottom reassurance note */}
            <p className="text-xs text-emerald-100/70 pt-4 border-t border-white/15">
              Thank you for your patience. Your care team is ready to welcome you.
            </p>
          </motion.div>

          {/* Coming Up Next Section */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
            <h3 className="text-xl font-serif font-bold text-forest-green mb-4">
              Coming up next
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              {/* Card 1 */}
              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-pale-sage/90 flex flex-col justify-between">
                <span className="text-[11px] text-text-secondary font-medium">
                  {tokenNext1.room || 'Room 02'}
                </span>
                <div className="text-3xl font-serif font-bold text-forest-green my-2">
                  {tokenNext1.token || 'A-014'}
                </div>
                <span className="text-xs font-semibold text-emerald-800">
                  You are next
                </span>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-pale-sage/90 flex flex-col justify-between">
                <span className="text-[11px] text-text-secondary font-medium">
                  {tokenNext2.room || 'Room 02'}
                </span>
                <div className="text-3xl font-serif font-bold text-forest-green my-2">
                  {tokenNext2.token || 'A-015'}
                </div>
                <span className="text-xs text-stone-600">
                  Please stay nearby
                </span>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-pale-sage/90 flex flex-col justify-between">
                <span className="text-[11px] text-text-secondary font-medium">
                  {tokenNext3.room || 'Room 03'}
                </span>
                <div className="text-3xl font-serif font-bold text-forest-green my-2">
                  {tokenNext3.token || 'B-008'}
                </div>
                <span className="text-xs text-stone-600">
                  Clinic starts 10:00
                </span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary">
              Tokens may be called in a different order depending on the appointment and care team.
            </p>
          </div>

          {/* 2 Bottom Cards: We're here to help & Learn something new */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-[#FAFBF9] rounded-xl p-5 border border-pale-sage shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-base font-serif font-bold text-forest-green mb-3">
                  We're here to help
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-pale-sage flex items-center justify-center text-forest-green shrink-0 mt-0.5">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-forest-green">Have a question about your visit?</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">Speak with the team at the welcome desk.</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mt-4 pt-3 border-t border-pale-sage/40">
                Let reception know if you need support or if you leave the waiting area.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FAFBF9] rounded-xl p-5 border border-pale-sage shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-base font-serif font-bold text-forest-green mb-3">
                  Learn something new
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-pale-sage flex items-center justify-center text-forest-green shrink-0 mt-0.5">
                    <BookOpenIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-forest-green">Your waiting time, well spent</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">Videos, articles and short health quizzes.</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mt-4 pt-3 border-t border-pale-sage/40">
                Open Patient Engagement in your ClinicOpsAgent workspace.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column (1 col): Clock Card + While You Wait + Privacy Note */}
        <div className="space-y-6">
          
          {/* Top Clock Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm text-center">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-text-secondary block mb-1">
              {currentDateFormatted || 'FRIDAY, 23 OCTOBER'}
            </span>
            <div className="text-5xl md:text-6xl font-serif font-black text-forest-green tracking-tight my-2">
              {currentTime || '09:42'}
            </div>
            <p className="text-xs text-text-secondary mb-6">
              Good morning from {activeClinic || 'Willow Family Clinic'}
            </p>

            <div className="space-y-3.5 text-left border-t border-pale-sage pt-5 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-pale-sage/60 flex items-center justify-center text-forest-green font-bold text-xs shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-semibold text-forest-green">Rooms 01–03</div>
                  <div className="text-[11px] text-text-secondary">Follow the signs past reception</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-pale-sage/60 flex items-center justify-center text-forest-green font-bold text-xs shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-semibold text-forest-green">Need a little assistance?</div>
                  <div className="text-[11px] text-text-secondary">Our reception team is here to help</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-pale-sage/60 flex items-center justify-center text-forest-green font-bold text-xs shrink-0 mt-0.5">
                  <Coffee className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-semibold text-forest-green">Make yourself comfortable</div>
                  <div className="text-[11px] text-text-secondary">Water station beside the entrance</div>
                </div>
              </div>
            </div>
          </div>

          {/* While You Wait Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm space-y-3">
            <h4 className="text-base font-serif font-bold text-forest-green">
              While you wait
            </h4>

            {/* Cozy Reading Banner / Image Area */}
            <div className="h-32 rounded-xl bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50 flex items-center justify-center p-4 border border-pale-sage/60 relative overflow-hidden text-forest-green">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-xs">
                  <Coffee className="w-6 h-6" />
                </div>
              </div>
            </div>

            <h5 className="text-lg font-serif font-bold text-forest-green">
              A moment for yourself.
            </h5>
            <p className="text-xs text-text-secondary leading-relaxed">
              Take a comfortable seat, enjoy a little reading, or explore our health learning library.
            </p>

            <button
              onClick={() => navigate('/learning-progress')}
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-pale-sage/70 text-forest-green hover:bg-pale-sage transition-colors"
            >
              Educational resources →
            </button>
          </div>

          {/* Bottom Privacy Notice */}
          <div className="bg-[#FAFBF9] rounded-xl p-4 border border-pale-sage flex items-start gap-2.5">
            <InformationCircleIcon className="w-5 h-5 text-forest-green/80 shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              We call token numbers, not names, to protect your privacy. If you miss your call, please visit reception.
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}