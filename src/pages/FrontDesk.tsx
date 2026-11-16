import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  ClockIcon, 
  PrinterIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  StopIcon,
  EllipsisHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  QueueListIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'
import { announcePatientCalling, stopAnnouncement, replayLastAnnouncement } from '../utils/speechAnnouncer'

export default function FrontDesk() {
  const location = useLocation()
  const { 
    patients, 
    addPatient, 
    appointments, 
    updateAppointment, 
    rescheduleAppointment,
    cancelAppointment,
    checkInPatient,
    callNextPatient,
    callPatientById,
    requeuePatient,
    callAgainPatient,
    returnToWaiting,
    moveQueuePosition,
    reactivateAppointment,
    queueAuditHistory,
    soundEnabled,
    toggleSound,
    queue,
    activeClinic,
    updateQueueItem
  } = useData()

  const [viewMode, setViewMode] = useState<'queue' | 'appointments'>('queue')
  const [activeTab, setActiveTab] = useState<'all' | 'arrived' | 'upcoming'>('all')
  const [queueFilter, setQueueFilter] = useState<'all' | 'waiting' | 'called' | 'in-progress' | 'completed' | 'cancelled' | 'paused'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [callingLang, setCallingLang] = useState<'en' | 'hi' | 'mr'>('en')
  const [isAnnouncing, setIsAnnouncing] = useState(false)
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null)
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.95)
  const [speechVolume, setSpeechVolume] = useState<number>(0.95)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [showRequeueModal, setShowRequeueModal] = useState<{ isOpen: boolean; item: any; note: string } | null>(null)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [activeCalledItem, setActiveCalledItem] = useState<{ token: string; name: string; room: string } | null>(() => {
    const called = queue.find(q => q.status === 'called')
    return called ? { token: called.token, name: called.patientName, room: called.room || 'Room 02' } : null
  })
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null)
  const [showPrintModal, setShowPrintModal] = useState<any | null>(null)
  const [showNewApptModal, setShowNewApptModal] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: 'Aisha Hassan',
    dob: '1992-06-18',
    gender: 'Female',
    phone: '+91 98201 45890',
    email: 'aisha.hassan@example.in',
    address: 'Flat 12, Hill Road, Bandra West, Mumbai 400050',
    emergencyContact: '+91 98201 99887 (Husband)',
    bloodGroup: 'B+',
    abhaId: '',
    aadhaar: '',
    pan: '',
    visitType: 'New patient consultation',
    doctor: 'Dr. Daniel Kim',
    time: '10:15 AM',
    consent: true
  })

  // Quick helper to show toast notifications
  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Handle URL query parameters from sidebar navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    const actionParam = params.get('action')

    if (tabParam === 'arrived' || tabParam === 'upcoming' || tabParam === 'all') {
      setActiveTab(tabParam)
    }

    if (actionParam === 'register') {
      // Focus registration area
      const regSection = document.getElementById('new-patient-registration')
      if (regSection) regSection.scrollIntoView({ behavior: 'smooth' })
      notify('New Patient Registration workspace active.')
    } else if (actionParam === 'search') {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      if (searchInput) searchInput.focus()
    } else if (actionParam === 'reports') {
      if (appointments.length > 0) {
        setShowPrintModal(appointments[0])
      }
    }
  }, [location.search, appointments])

  // Filter appointments
  const filteredVisits = appointments.filter(apt => {
    const docName = apt.doctorName || (apt as any).doctor || ''
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    const st = (apt.status || '').toLowerCase()
    if (activeTab === 'arrived') {
      return st === 'checked in' || st === 'arrived' || st === 'in-progress' || st === 'confirmed'
    }
    if (activeTab === 'upcoming') {
      return st === 'scheduled' || st === 'expected'
    }
    return true
  })

  // Live counts for 7 queue filter statuses
  const countAll = queue.length
  const countWaiting = queue.filter(q => q.status === 'waiting').length
  const countCalled = queue.filter(q => q.status === 'called').length
  const countInProgress = queue.filter(q => q.status === 'in-progress').length
  const countCompleted = queue.filter(q => q.status === 'completed').length
  const countCancelled = queue.filter(q => q.status === 'cancelled').length
  const countPaused = queue.filter(q => q.status === 'paused').length

  // Filtered queue items according to active filter and search query
  const filteredQueueList = queue.filter(item => {
    const searchMatch = !searchQuery || 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!searchMatch) return false

    const s = (item.status || '').toLowerCase()
    if (queueFilter === 'all') return true
    if (queueFilter === 'waiting') return s === 'waiting'
    if (queueFilter === 'called') return s === 'called'
    if (queueFilter === 'in-progress') return s === 'in-progress'
    if (queueFilter === 'completed') return s === 'completed'
    if (queueFilter === 'cancelled') return s === 'cancelled'
    if (queueFilter === 'paused') return s === 'paused'
    return true
  })

  // Next patient in line to be called
  const nextWaitingPatient = queue.find(q => q.status === 'waiting')

  // Last called patient in queue
  const lastCalledPatient = queue.filter(q => q.status === 'called').slice(-1)[0]

  // Handle checking in an appointment from the table
  const handleCheckIn = (aptId: string) => {
    const apt = appointments.find(a => a.id === aptId)
    if (apt) {
      const queueItem = checkInPatient(
        apt.patientId, 
        apt.doctorName || (apt as any).doctor || 'Dr. Elena Cooper', 
        apt.type || 'General OPD', 
        apt.notes || 'Scheduled Consultation'
      )
      const token = queueItem.token
      notify(`Patient checked in! Sequential Token ${token} assigned.`)
      setShowPrintModal({
        ...apt,
        token
      })
    }
  }

  // Handle calling next patient with Project Vaani Natural Female Voice
  const handleCallNextPatient = async () => {
    if (!nextWaitingPatient) {
      notify('No waiting patients in queue to call.')
      return
    }

    setIsAnnouncing(true)
    const token = nextWaitingPatient.token
    const name = nextWaitingPatient.patientName
    const room = nextWaitingPatient.room || 'Room 02'
    const doc = nextWaitingPatient.doctorName || 'Dr. Elena Cooper'

    // Update queue status and speak voice
    callNextPatient(undefined, callingLang)
    setLastAnnounced(`Token ${token} (${name})`)
    setActiveCalledItem({ token, name, room })

    const langLabel = callingLang === 'hi' ? 'Hindi' : callingLang === 'mr' ? 'Marathi' : 'English'
    notify(`Calling Token ${token} to ${room} with Project Vaani Female Voice (${langLabel}).`)

    setTimeout(() => {
      setIsAnnouncing(false)
    }, 3500)
  }

  // Handle calling a specific patient from the table
  const handleCallPatientDirect = async (patientName: string, doctorName: string, room: string = 'Room 02') => {
    setIsAnnouncing(true)
    const queueItem = queue.find(q => q.patientName.toLowerCase() === patientName.toLowerCase() && (q.status === 'waiting' || q.status === 'called'))
    const tokenToAnnounce = queueItem?.token || 'A-012'

    if (queueItem) {
      callPatientById(queueItem.id, callingLang)
    } else {
      await announcePatientCalling({
        token: tokenToAnnounce,
        patientName,
        room,
        doctorName,
        language: callingLang,
        speed: speechSpeed,
        volume: isMuted ? 0 : speechVolume,
        isMuted,
        onEnd: () => setIsAnnouncing(false)
      })
    }

    setLastAnnounced(`Token ${tokenToAnnounce} (${patientName})`)
    setActiveCalledItem({ token: tokenToAnnounce, name: patientName, room })
    const langLabel = callingLang === 'hi' ? 'Hindi' : callingLang === 'mr' ? 'Marathi' : 'English'
    notify(`Calling Token ${tokenToAnnounce} (${patientName}) with Project Vaani Female Voice (${langLabel}).`)
    setTimeout(() => setIsAnnouncing(false), 3500)
  }

  // Handle replaying the last announcement
  const handleReplayAnnouncement = async () => {
    if (!lastAnnounced) return
    setIsAnnouncing(true)
    await replayLastAnnouncement()
    setTimeout(() => setIsAnnouncing(false), 3000)
  }

  // Handle stopping ongoing announcement
  const handleStopAnnouncement = () => {
    stopAnnouncement()
    setIsAnnouncing(false)
    notify('Voice announcement stopped.')
  }

  // Handle calling a called patient again (Call Again)
  const handleCallAgain = async (item: any) => {
    setIsAnnouncing(true)
    callAgainPatient(item.id, callingLang)
    setLastAnnounced(`Token ${item.token} (${item.patientName})`)
    setActiveCalledItem({ token: item.token, name: item.patientName, room: item.room || 'Room 02' })
    const langLabel = callingLang === 'hi' ? 'Hindi' : callingLang === 'mr' ? 'Marathi' : 'English'
    notify(`Repeating voice call for Token ${item.token} (${item.patientName}) to ${item.room || 'Room 02'} (${langLabel}).`)
    setTimeout(() => setIsAnnouncing(false), 3500)
  }

  // Handle returning a called patient to waiting
  const handleReturnToWaiting = (item: any) => {
    returnToWaiting(item.id, 'Patient called but did not arrive - returned to waiting')
    notify(`Token ${item.token} (${item.patientName}) returned to active waiting queue.`)
  }

  // Handle new patient registration & booking
  const handleRegisterAndBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.name || !regForm.phone) {
      alert('Please provide patient name and contact number.')
      return
    }

    const cleanAbha = (regForm.abhaId || '').replace(/[^0-9]/g, '')
    if (cleanAbha && cleanAbha.length !== 14) {
      alert('ABHA Number must contain exactly 14 digits (format: XX-XXXX-XXXX-XXXX).')
      return
    }

    const newId = `p-${Date.now()}`
    const newPatientObj = {
      id: newId,
      name: regForm.name.trim(),
      age: regForm.dob ? Math.max(1, new Date().getFullYear() - new Date(regForm.dob).getFullYear()) : 32,
      gender: regForm.gender || 'Female',
      phone: regForm.phone.trim(),
      email: regForm.email || `${regForm.name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
      address: regForm.address || 'Mumbai, Maharashtra',
      dateOfBirth: regForm.dob || '1992-06-18',
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      abhaId: regForm.abhaId,
      abhaVerified: false,
      aadhaar: regForm.aadhaar,
      pan: regForm.pan,
      emergencyContact: regForm.emergencyContact,
      bloodGroup: regForm.bloodGroup,
      medicalHistory: ['Front-desk intake recorded'],
      allergies: ['No known drug allergies reported'],
      insurance: regForm.abhaId ? 'Ayushman Bharat / ABHA (self-declared)' : 'Not recorded',
      primaryPhysician: regForm.doctor
    }

    addPatient(newPatientObj)

    // Check in patient to generate sequential token
    const queueItem = checkInPatient(newId, regForm.doctor, 'General OPD', regForm.visitType)
    const token = queueItem.token

    // Also create appointment with the same sequential token
    const apptId = `apt-${Date.now()}`
    const newAppt = {
      id: apptId,
      patientId: newId,
      patientName: regForm.name.trim(),
      doctorId: regForm.doctor.includes('Kim') ? 'doc-kim' : (regForm.doctor.includes('Sharma') ? 'doc-sarah' : 'doc-cooper'),
      doctorName: regForm.doctor,
      department: 'General OPD',
      date: new Date().toISOString().split('T')[0],
      time: regForm.time,
      type: regForm.visitType,
      status: 'confirmed' as const,
      notes: 'Front Desk Registered & Checked-in',
      token
    }

    notify(`Patient ${regForm.name} registered! Sequential Token ${token} assigned.`)
    setShowPrintModal({
      ...newAppt,
      token
    })

    // Reset form to next entry
    setRegForm({
      name: '',
      dob: '',
      gender: 'Female',
      phone: '',
      email: '',
      address: 'Mumbai, Maharashtra',
      emergencyContact: '',
      bloodGroup: 'B+',
      abhaId: '',
      aadhaar: '',
      pan: '',
      visitType: 'General Consultation',
      doctor: 'Dr. Sarah Sharma',
      time: '11:00 AM',
      consent: true
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-forest-green text-white px-5 py-3 rounded-xl shadow-lg border border-pale-sage flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb + Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-forest-green/70 uppercase mb-1">
            OPD OPERATIONS / RECEPTION
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
            A smooth start to every visit.
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Welcome back, Olivia. Your morning clinic is ready for check-in.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Voice announcement is active' : 'Voice announcement is muted'}
            className="p-2.5 rounded-lg border border-pale-sage bg-white text-forest-green hover:bg-pale-sage/40 transition-colors shadow-2xs"
          >
            {soundEnabled ? <SpeakerWaveIcon className="w-4 h-4 text-forest-green" /> : <SpeakerXMarkIcon className="w-4 h-4 text-stone-400" />}
          </button>
          <button
            onClick={() => setShowNewApptModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-forest-green text-white font-medium text-sm hover:bg-forest-green/90 transition-all shadow-sm hover:shadow"
          >
            <span className="text-base leading-none">+</span>
            <span>New appointment</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <CalendarIcon className="w-4 h-4 text-forest-green" />
            <span>Appointments today</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">24</div>
          <p className="text-xs text-text-secondary mt-1">18 remaining this morning</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <CheckIcon className="w-4 h-4 text-forest-green" />
            <span>Checked in</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">06</div>
          <p className="text-xs text-text-secondary mt-1">2 ready for consultation</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <ClockIcon className="w-4 h-4 text-forest-green" />
            <span>Available slots</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">04</div>
          <p className="text-xs text-text-secondary mt-1">Next opening at 11:30</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <UserPlusIcon className="w-4 h-4 text-forest-green" />
            <span>New registrations</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">03</div>
          <p className="text-xs text-text-secondary mt-1">Today at {activeClinic || 'Willow Family Clinic'}</p>
        </div>
      </div>

      {/* Main Layout: 2 Columns (Left: Appointments Table + Quick Check-in, Right: Registration + Desk Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Queue & Appointments Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-bold text-forest-green">
                    Today's patient queue
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Real-time sequential tokens, room dispatch, and voice announcements.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* View Mode Toggle: Queue vs Appointments */}
                <div className="inline-flex p-0.5 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('queue')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'queue' ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
                    }`}
                  >
                    Queue ({countAll})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('appointments')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      viewMode === 'appointments' ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
                    }`}
                  >
                    Appointments ({appointments.length})
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg border border-pale-sage hover:bg-pale-sage/30 transition-colors"
                  title="View queue transition audit trail"
                >
                  Audit History ↗
                </button>
              </div>
            </div>

            {/* If in QUEUE mode: 7 Working Filters + Search */}
            {viewMode === 'queue' ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                  {/* 7 Required Queue Filter Pills with counts */}
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs">
                    <button
                      type="button"
                      onClick={() => setQueueFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'all' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>All Patients</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'all' ? 'bg-white/20 text-white' : 'bg-pale-sage/60 text-stone-700'}`}>
                        {countAll}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('waiting')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'waiting' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>Waiting</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'waiting' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {countWaiting}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('called')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'called' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>Called</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'called' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {countCalled}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('in-progress')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'in-progress' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>In Progress</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'in-progress' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                        {countInProgress}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('completed')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'completed' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>Completed</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>
                        {countCompleted}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('cancelled')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'cancelled' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>Cancelled</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'cancelled' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                        {countCancelled}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('paused')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        queueFilter === 'paused' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      <span>Paused</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${queueFilter === 'paused' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
                        {countPaused}
                      </span>
                    </button>
                  </div>

                  <div className="relative shrink-0">
                    <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search queue or token..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green"
                    />
                  </div>
                </div>

                {/* Requirement 7: Empty Queue message if genuinely no waiting patients */}
                {queueFilter === 'waiting' && countWaiting === 0 ? (
                  <div className="py-8 px-5 text-center bg-stone-50/70 rounded-xl border border-dashed border-pale-sage my-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-forest-green flex items-center justify-center mx-auto mb-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="text-base font-serif font-bold text-forest-green mb-1">
                      No patients currently waiting.
                    </h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto mb-4">
                      All arrived patients have been called, are in consultation, or completed. You can requeue any patient below or call upcoming visits.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-md mx-auto text-xs">
                      <div className="bg-white p-2 rounded-lg border border-pale-sage">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Total in Queue</span>
                        <span className="text-base font-serif font-bold text-forest-green">{countAll}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-pale-sage">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Called</span>
                        <span className="text-base font-serif font-bold text-emerald-700">{countCalled}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-pale-sage">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Completed</span>
                        <span className="text-base font-serif font-bold text-stone-700">{countCompleted}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-pale-sage">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Cancelled</span>
                        <span className="text-base font-serif font-bold text-amber-700">{countCancelled}</span>
                      </div>
                    </div>
                  </div>
                ) : filteredQueueList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-secondary bg-stone-50/50 rounded-xl border border-pale-sage my-3">
                    No patients found matching the "{queueFilter}" filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#F5F8F6] border-y border-pale-sage text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                          <th className="py-2.5 px-3">POS</th>
                          <th className="py-2.5 px-3">TOKEN</th>
                          <th className="py-2.5 px-3">PATIENT</th>
                          <th className="py-2.5 px-3">ROOM / DOCTOR</th>
                          <th className="py-2.5 px-3">ARRIVED</th>
                          <th className="py-2.5 px-3">STATUS</th>
                          <th className="py-2.5 px-3 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pale-sage/50 text-sm">
                        {filteredQueueList.map((item, index) => {
                          const isCalled = item.status === 'called'
                          const isWaiting = item.status === 'waiting'
                          const isInProgress = item.status === 'in-progress'
                          const isCompleted = item.status === 'completed'
                          const isCancelled = item.status === 'cancelled'
                          const isPaused = item.status === 'paused'

                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-colors ${
                                isCalled 
                                  ? 'bg-emerald-50/40' 
                                  : isWaiting 
                                  ? 'hover:bg-pale-sage/10' 
                                  : 'opacity-90 hover:opacity-100 hover:bg-stone-50'
                              }`}
                            >
                              {/* Position */}
                              <td className="py-3 px-3 text-xs font-mono font-bold text-stone-500">
                                #{index + 1}
                              </td>

                              {/* Token */}
                              <td className="py-3 px-3">
                                <span className="font-serif font-bold text-forest-green text-sm px-2 py-0.5 rounded-md bg-pale-sage/40">
                                  {item.token}
                                </span>
                              </td>

                              {/* Patient */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-pale-sage/60 text-forest-green font-serif font-bold text-xs flex items-center justify-center shrink-0">
                                    {item.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-stone-900 text-xs">
                                      {item.patientName}
                                    </div>
                                    <div className="text-[10px] text-text-secondary">
                                      {item.patientId}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Room / Doctor */}
                              <td className="py-3 px-3">
                                <div className="text-xs font-semibold text-stone-800">
                                  {item.room || 'Room 02'}
                                </div>
                                <div className="text-[11px] text-text-secondary">
                                  {item.doctorName || 'Dr. Elena Cooper'}
                                </div>
                              </td>

                              {/* Arrived */}
                              <td className="py-3 px-3 text-xs text-stone-700">
                                <div>{item.arrivalTime}</div>
                                {item.requeuedAt && (
                                  <div className="text-[10px] text-emerald-700 font-semibold">
                                    Requeued: {item.requeuedAt}
                                  </div>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  isCalled
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : isWaiting
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : isInProgress
                                    ? 'bg-teal-100 text-teal-800 border-teal-200'
                                    : isCompleted
                                    ? 'bg-stone-100 text-stone-700 border-stone-200'
                                    : isCancelled
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>
                                  {isCalled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                                  {isWaiting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                  <span>{item.status}</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Call Again button for CALLED patients */}
                                  {isCalled && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleCallAgain(item)}
                                        disabled={isAnnouncing}
                                        className="text-xs font-bold text-emerald-900 hover:text-white hover:bg-emerald-700 inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md transition-all shadow-2xs"
                                        title="Repeat female voice announcement for this called token"
                                      >
                                        <SpeakerWaveIcon className="w-3.5 h-3.5 text-emerald-700 group-hover:text-white" />
                                        <span>Call Again</span>
                                        {(item.callCount || 0) > 1 && (
                                          <span className="text-[9px] px-1 rounded-full bg-emerald-700 text-white font-mono">
                                            #{item.callCount}
                                          </span>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReturnToWaiting(item)}
                                        className="text-[11px] font-semibold text-stone-700 hover:text-forest-green inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-all"
                                        title="No-Show: Return patient to end of waiting queue"
                                      >
                                        <ArrowPathIcon className="w-3 h-3 text-stone-500" />
                                        <span>Return to Waiting</span>
                                      </button>
                                    </>
                                  )}

                                  {/* Call button for WAITING patients */}
                                  {isWaiting && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleCallPatientDirect(item.patientName, item.doctorName || 'Dr. Elena Cooper', item.room || 'Room 02')}
                                        disabled={isAnnouncing}
                                        className="text-xs font-bold text-forest-green hover:text-white hover:bg-forest-green inline-flex items-center gap-1 bg-pale-sage/40 hover:bg-forest-green px-2.5 py-1 rounded-md transition-all shadow-2xs"
                                        title="Call patient with Project Vaani Natural Female Voice"
                                      >
                                        <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                        <span>Call</span>
                                      </button>
                                      <div className="inline-flex items-center border border-pale-sage rounded-md overflow-hidden bg-white shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={() => moveQueuePosition(item.id, 'up')}
                                          className="p-1 hover:bg-pale-sage/40 text-stone-500 hover:text-forest-green transition-colors"
                                          title="Move up in queue order"
                                        >
                                          <ChevronUpIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveQueuePosition(item.id, 'down')}
                                          className="p-1 hover:bg-pale-sage/40 text-stone-500 hover:text-forest-green transition-colors border-l border-pale-sage"
                                          title="Move down in queue order"
                                        >
                                          <ChevronDownIcon className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {/* Requeue button for COMPLETED or CANCELLED patients */}
                                  {(isCompleted || isCancelled) && (
                                    <button
                                      type="button"
                                      onClick={() => setShowRequeueModal({ isOpen: true, item, note: '' })}
                                      className="text-xs font-bold text-emerald-800 hover:text-white hover:bg-emerald-700 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md transition-all shadow-2xs"
                                      title="Requeue patient back to active waiting queue with confirmation"
                                    >
                                      <ArrowPathIcon className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Requeue</span>
                                    </button>
                                  )}

                                  {/* Three-Dot Menu */}
                                  <div className="relative inline-block text-left">
                                    <button
                                      type="button"
                                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                      className="p-1 text-stone-400 hover:text-forest-green rounded-md hover:bg-pale-sage/30 transition-colors"
                                      title="More queue actions"
                                    >
                                      <EllipsisHorizontalIcon className="w-5 h-5" />
                                    </button>

                                    {activeMenuId === item.id && (
                                      <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white shadow-xl border border-pale-sage z-30 py-1.5 text-xs text-left">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowRequeueModal({ isOpen: true, item, note: '' })
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 font-semibold text-emerald-800 flex items-center gap-2"
                                        >
                                          <ArrowPathIcon className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>Requeue Patient</span>
                                        </button>

                                        {isCalled ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleCallAgain(item)
                                              setActiveMenuId(null)
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-forest-green flex items-center gap-2 font-medium"
                                          >
                                            <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                            <span>Call Again (Repeat Voice)</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleCallPatientDirect(item.patientName, item.doctorName || 'Dr. Elena Cooper', item.room || 'Room 02')
                                              setActiveMenuId(null)
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-forest-green flex items-center gap-2"
                                          >
                                            <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                            <span>Call Patient</span>
                                          </button>
                                        )}

                                        {isCalled && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleReturnToWaiting(item)
                                              setActiveMenuId(null)
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-stone-700 flex items-center gap-2"
                                          >
                                            <ArrowPathIcon className="w-3.5 h-3.5" />
                                            <span>Return to Waiting (No-Show)</span>
                                          </button>
                                        )}

                                        {isWaiting && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                moveQueuePosition(item.id, 'up')
                                                setActiveMenuId(null)
                                              }}
                                              className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-stone-700 flex items-center gap-2"
                                            >
                                              <ChevronUpIcon className="w-3.5 h-3.5" />
                                              <span>Move Up in Queue</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                moveQueuePosition(item.id, 'down')
                                                setActiveMenuId(null)
                                              }}
                                              className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-stone-700 flex items-center gap-2"
                                            >
                                              <ChevronDownIcon className="w-3.5 h-3.5" />
                                              <span>Move Down in Queue</span>
                                            </button>
                                          </>
                                        )}

                                        <div className="border-t border-pale-sage/50 my-1"></div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateQueueItem(item.id, 'in-progress')
                                            notify(`Token ${item.token} marked In-Progress.`)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-teal-800 flex items-center gap-2"
                                        >
                                          <CheckCircleIcon className="w-3.5 h-3.5 text-teal-600" />
                                          <span>Mark In-Progress</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateQueueItem(item.id, 'completed')
                                            notify(`Token ${item.token} marked Completed.`)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-stone-700 flex items-center gap-2"
                                        >
                                          <CheckCircleIcon className="w-3.5 h-3.5 text-stone-500" />
                                          <span>Mark Completed</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateQueueItem(item.id, 'paused')
                                            notify(`Token ${item.token} paused.`)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-pale-sage/20 text-yellow-700 flex items-center gap-2"
                                        >
                                          <span>Pause Token</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateQueueItem(item.id, 'cancelled')
                                            notify(`Token ${item.token} cancelled.`)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
                                        >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                          <span>Cancel / Remove</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* If in APPOINTMENTS mode: Scheduled Appointments view with Check In */
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="inline-flex p-1 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        activeTab === 'all' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      All visits ({appointments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('arrived')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        activeTab === 'arrived' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      Arrived ({appointments.filter(a => ['Checked In', 'Arrived', 'In Progress', 'confirmed'].includes(a.status)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upcoming')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                        activeTab === 'upcoming' 
                          ? 'bg-forest-green text-white shadow-xs' 
                          : 'text-text-secondary hover:text-forest-green'
                      }`}
                    >
                      Upcoming ({appointments.filter(a => ['scheduled', 'Expected', 'Scheduled'].includes(a.status)).length})
                    </button>
                  </div>

                  <div className="relative shrink-0">
                    <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search visits..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F5F8F6] border-y border-pale-sage text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                        <th className="py-2.5 px-3">PATIENT</th>
                        <th className="py-2.5 px-3">TIME</th>
                        <th className="py-2.5 px-3">DOCTOR / VISIT</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pale-sage/50 text-sm">
                      {filteredVisits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-text-secondary">
                            No appointments found matching current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredVisits.map((apt) => {
                          const isCheckedIn = apt.status === 'confirmed' || apt.status === 'in-progress' || apt.status === 'completed'
                          return (
                            <tr key={apt.id} className="hover:bg-pale-sage/10 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-pale-sage/60 text-forest-green font-serif font-bold text-xs flex items-center justify-center shrink-0">
                                    {apt.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-forest-green text-xs">
                                      {apt.patientName}
                                    </div>
                                    <div className="text-[11px] text-text-secondary">
                                      {apt.patientId || 'WC-1042'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-xs text-stone-700 font-medium">
                                {apt.time}
                              </td>

                              <td className="py-3 px-3">
                                <div className="text-xs font-medium text-stone-800">
                                  {apt.doctorName}
                                </div>
                                <div className="text-[11px] text-text-secondary">
                                  {apt.type}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                  isCheckedIn
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : apt.status === 'scheduled'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-stone-50 text-stone-600 border-stone-200'
                                }`}>
                                  {apt.status}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right">
                                {isCheckedIn ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleCallPatientDirect(apt.patientName, apt.doctorName || 'Dr. Elena Cooper', (apt as any).room || 'Room 02')}
                                      disabled={isAnnouncing}
                                      className="text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-200/80 px-2 py-1 rounded-md transition-all shadow-2xs"
                                      title="Announce patient calling with Project Vaani Natural Female Voice"
                                    >
                                      <SpeakerWaveIcon className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Call</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedVisit(apt)}
                                      className="text-xs font-semibold text-forest-green hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>View</span>
                                      <span>↗</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCheckIn(apt.id)}
                                    className="text-xs font-bold text-forest-green hover:text-forest-green/80 inline-flex items-center gap-1 bg-pale-sage/40 hover:bg-pale-sage/80 px-2.5 py-1 rounded-md transition-colors"
                                  >
                                    <span>Check in</span>
                                    <span>→</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-xs text-text-secondary mt-4 pt-3 border-t border-pale-sage/40">
              <span>Showing {viewMode === 'queue' ? filteredQueueList.length : filteredVisits.length} {viewMode === 'queue' ? 'queue entries' : 'appointments'}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-forest-green font-mono">Real-time sync active</span>
              </div>
            </div>
          </div>

          {/* Patient Calling & Clinic Readiness Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Live Patient Calling Console (Project Vaani AI Voice) */}
            <div className="bg-[#EFF5EE] rounded-xl p-5 border border-pale-sage shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-forest-green/10 text-forest-green flex items-center justify-center">
                      <SpeakerWaveIcon className="w-4 h-4 text-forest-green" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-forest-green">
                        Patient Calling
                      </h4>
                      <div className="text-[10px] text-[#5A6D62]">
                        Voice Announcement Console
                      </div>
                    </div>
                  </div>

                  {/* Active Voice Badge */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE7DF] text-[#1B3E2F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                    Vaani Female Voice
                  </span>
                </div>

                {/* Announcement Language Selection */}
                <div className="flex items-center justify-between bg-white/80 border border-pale-sage rounded-lg p-1 my-2 text-[11px]">
                  <span className="text-[10px] font-bold text-text-secondary pl-1.5 uppercase tracking-wider">
                    Language:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCallingLang('en')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        callingLang === 'en' ? 'bg-forest-green text-white shadow-2xs' : 'text-stone-600 hover:text-forest-green'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallingLang('hi')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        callingLang === 'hi' ? 'bg-forest-green text-white shadow-2xs' : 'text-stone-600 hover:text-forest-green'
                      }`}
                    >
                      हिन्दी
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallingLang('mr')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        callingLang === 'mr' ? 'bg-forest-green text-white shadow-2xs' : 'text-stone-600 hover:text-forest-green'
                      }`}
                    >
                      मराठी
                    </button>
                  </div>
                </div>

                {/* Voice Speed & Volume Controls */}
                <div className="bg-white/80 border border-pale-sage rounded-lg p-2 mb-2 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      Speed:
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.85, 1.0, 1.15].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSpeechSpeed(s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                            speechSpeed === s ? 'bg-forest-green text-white shadow-2xs' : 'text-stone-600 hover:text-forest-green'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 rounded text-stone-600 hover:text-forest-green transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <SpeakerXMarkIcon className="w-3.5 h-3.5 text-rose-500" /> : <SpeakerWaveIcon className="w-3.5 h-3.5 text-forest-green" />}
                    </button>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={isMuted ? 0 : speechVolume}
                      onChange={(e) => {
                        setSpeechVolume(parseFloat(e.target.value))
                        if (isMuted) setIsMuted(false)
                      }}
                      className="w-full accent-forest-green h-1.5 rounded-lg cursor-pointer bg-stone-200"
                      title={`Volume: ${Math.round((isMuted ? 0 : speechVolume) * 100)}%`}
                    />
                    <span className="text-[10px] text-text-secondary font-mono w-7 text-right">
                      {Math.round((isMuted ? 0 : speechVolume) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Active Called Patient Display Banner */}
                {activeCalledItem && (
                  <div className="bg-emerald-50 border border-emerald-300/80 rounded-lg p-2.5 mb-2.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          Now Called: Token {activeCalledItem.token}
                        </div>
                        <div className="text-xs font-semibold text-emerald-950 truncate">
                          {activeCalledItem.name} • {activeCalledItem.room}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                      Proceeding
                    </span>
                  </div>
                )}

                {/* Next in Line Display */}
                {nextWaitingPatient ? (
                  <div className="bg-white rounded-lg p-3 border border-pale-sage/70 mb-3 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary font-medium">Next in line:</span>
                      <span className="px-2 py-0.5 rounded font-serif font-bold text-forest-green bg-pale-sage/50 text-xs">
                        Token {nextWaitingPatient.token}
                      </span>
                    </div>
                    <div className="font-semibold text-stone-800 text-xs truncate">
                      {nextWaitingPatient.patientName}
                    </div>
                    <div className="text-[11px] text-[#5A6D62] flex justify-between">
                      <span>{nextWaitingPatient.room || 'Room 02'}</span>
                      <span>{nextWaitingPatient.doctorName || 'Dr. Elena Cooper'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-lg p-3 border border-pale-sage/50 mb-3 text-center text-xs text-text-secondary">
                    {queue.length > 0
                      ? 'All arrived patients currently called or with doctor.'
                      : 'No patients in waiting queue right now.'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-pale-sage/40">
                <button
                  onClick={handleCallNextPatient}
                  disabled={isAnnouncing || !nextWaitingPatient}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                    isAnnouncing
                      ? 'bg-emerald-700 text-white animate-pulse cursor-wait'
                      : nextWaitingPatient
                      ? 'bg-forest-green hover:bg-forest-green/90 text-white'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  <span>
                    {isAnnouncing
                      ? 'Announcing in Female AI Voice...'
                      : nextWaitingPatient
                      ? `Call Token ${nextWaitingPatient.token} Now`
                      : 'Call Next Patient'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleReplayAnnouncement}
                    disabled={isAnnouncing || !lastAnnounced}
                    className="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-forest-green/30 text-forest-green bg-white hover:bg-forest-green/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Replay the last spoken token announcement"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>Replay Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopAnnouncement}
                    disabled={!isAnnouncing}
                    className="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Stop ongoing voice announcement"
                  >
                    <StopIcon className="w-3.5 h-3.5" />
                    <span>Stop Voice</span>
                  </button>
                </div>

                {lastAnnounced && (
                  <div className="text-[10px] text-text-secondary text-center truncate">
                    Last called: <strong className="text-forest-green font-semibold">{lastAnnounced}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Clinic Readiness */}
            <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-serif font-bold text-forest-green mb-1">
                  Clinic readiness
                </h4>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">2 doctors on duty</span>
                    <span className="font-semibold text-forest-green">Family medicine • Morning clinic</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">Active Queue Tokens</span>
                    <span className="font-semibold text-forest-green">{queue.length} in queue</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">Audience Screen Sync</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-pale-sage/40 text-[11px] text-text-secondary">
                Dr. Daniel Kim's consultation room opens at 10:00 AM.
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (1 col): Patient Registration & Desk Notes */}
        <div className="space-y-6">
          
          {/* Patient Registration Card */}
          <div className="bg-[#FAFBF9] rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-serif font-bold text-forest-green">
                Patient registration
              </h3>
              <span className="text-[11px] font-semibold bg-pale-sage/80 text-forest-green px-2.5 py-0.5 rounded-full">
                New patient
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Create a record and reserve a visit.
            </p>

            <form onSubmit={handleRegisterAndBook} className="space-y-3.5">
              {/* Full name & Gender */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="e.g. Aisha Hassan"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    className="w-full px-2 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Date of birth & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={regForm.dob}
                    onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
              </div>

              {/* Email & Blood Group */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="patient@example.in"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={regForm.bloodGroup}
                    onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                    className="w-full px-2 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* ABHA ID */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  ABHA Number (Ayushman Bharat)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={regForm.abhaId}
                  onChange={(e) => setRegForm({ ...regForm, abhaId: e.target.value })}
                  placeholder="XX-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Status: <strong className="text-stone-700 font-medium">Self-declared — not verified with ABDM</strong>
                </span>
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Aadhaar (Optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={regForm.aadhaar}
                    onChange={(e) => setRegForm({ ...regForm, aadhaar: e.target.value })}
                    placeholder="12-digit Aadhaar"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    PAN Card (Optional)
                  </label>
                  <input
                    type="text"
                    value={regForm.pan}
                    onChange={(e) => setRegForm({ ...regForm, pan: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
              </div>

              {/* Address & Emergency Contact */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="Mumbai, Maharashtra"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={regForm.emergencyContact}
                    onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
                    placeholder="+91 91234 56789"
                    className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>
              </div>

              {/* Visit type */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Visit type
                </label>
                <select
                  value={regForm.visitType}
                  onChange={(e) => setRegForm({ ...regForm, visitType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                >
                  <option>New patient consultation</option>
                  <option>Follow-up visit</option>
                  <option>Specialist consultation</option>
                  <option>Routine checkup</option>
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Doctor
                </label>
                <select
                  value={regForm.doctor}
                  onChange={(e) => setRegForm({ ...regForm, doctor: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                >
                  <option>Dr. Elena Cooper (Family Medicine - Room 02)</option>
                  <option>Dr. Daniel Kim (Internal Medicine - Room 03)</option>
                  <option>Dr. Rajesh Patil (Cardiology)</option>
                </select>
              </div>

              {/* Appointment Slot */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Appointment slot
                </label>
                <input
                  type="text"
                  value={regForm.time}
                  onChange={(e) => setRegForm({ ...regForm, time: e.target.value })}
                  placeholder="Today, 10:15 AM"
                  className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                />
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.consent}
                  onChange={(e) => setRegForm({ ...regForm, consent: e.target.checked })}
                  className="mt-0.5 rounded border-pale-sage text-forest-green focus:ring-forest-green"
                />
                <span className="text-[11px] text-text-secondary leading-snug">
                  Contact and privacy consent recorded under Indian Digital Personal Data Protection Act.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-green text-white font-medium text-sm hover:bg-forest-green/90 transition-all shadow-sm"
              >
                <span>+ Register & book visit</span>
              </button>

              <p className="text-[10px] text-text-secondary text-center">
                A patient ID is assigned after registration.
              </p>
            </form>
          </div>

          {/* Desk Notes Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm space-y-4">
            <h4 className="text-base font-serif font-bold text-forest-green">
              Desk notes
            </h4>

            <div className="p-3.5 rounded-lg bg-[#F5F8F6] border border-pale-sage flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-forest-green">Room 02 is ready</div>
                <div className="text-[11px] text-text-secondary">Updated by reception • 09:38</div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Dr. Kim's morning clinic begins at 10:00. Direct new arrivals to the welcome desk.
            </p>
          </div>

        </div>
      </div>

      {/* Modal: View Visit / Token Details */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">Visit Details</h3>
                <button onClick={() => setSelectedVisit(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Patient Name</span>
                  <span className="font-semibold text-forest-green">{selectedVisit.patientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Assigned Doctor</span>
                  <span className="font-semibold text-forest-green">{selectedVisit.doctor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Appointment Time</span>
                  <span className="font-semibold text-stone-800">{selectedVisit.time}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Visit Type</span>
                  <span className="font-semibold text-stone-800">{selectedVisit.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Current Status</span>
                  <span className="font-semibold text-emerald-700">{selectedVisit.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pale-sage/40">
                  <span className="text-text-secondary">Consultation Room</span>
                  <span className="font-semibold text-forest-green">{selectedVisit.room || 'Room 02'}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setShowPrintModal(selectedVisit)
                    setSelectedVisit(null)
                  }}
                  className="flex-1 py-2 rounded-lg bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => {
                    cancelAppointment(selectedVisit.id)
                    notify('Appointment cancelled.')
                    setSelectedVisit(null)
                  }}
                  className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
                >
                  Cancel Visit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Printable Token Slip */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 border-2 border-forest-green shadow-2xl text-center"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs uppercase tracking-widest font-semibold text-forest-green">
                  {activeClinic || 'Willow Family Clinic'}
                </div>
                <button onClick={() => setShowPrintModal(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-text-secondary mb-3">Outpatient Department Token</div>

              <div className="my-4 py-4 px-6 bg-[#FAFBF9] border border-pale-sage rounded-xl">
                <div className="text-xs font-semibold text-text-secondary">QUEUE TOKEN</div>
                <div className="text-4xl font-serif font-black text-forest-green tracking-wider mt-1">
                  {showPrintModal.token || 'A-014'}
                </div>
                <div className="text-xs text-forest-green font-medium mt-1">
                  {showPrintModal.room || 'Room 02'} • {showPrintModal.doctor}
                </div>
              </div>

              <div className="text-left text-xs space-y-1.5 border-y border-pale-sage py-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Patient:</span>
                  <span className="font-semibold text-stone-800">{showPrintModal.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date & Time:</span>
                  <span className="font-semibold text-stone-800">Today, {showPrintModal.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status:</span>
                  <span className="text-emerald-700 font-semibold">Checked In • In Queue</span>
                </div>
              </div>

              <p className="text-[11px] text-text-secondary mb-4">
                Please take a seat in the waiting area. Watch the screen for your token number.
              </p>

              <button
                onClick={() => {
                  window.print()
                  setShowPrintModal(null)
                }}
                className="w-full py-2.5 rounded-lg bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Print Queue Slip</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: New Appointment */}
      <AnimatePresence>
        {showNewApptModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">Book Appointment</h3>
                <button onClick={() => setShowNewApptModal(false)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Select Patient</label>
                  <select 
                    id="new-appt-patient"
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Select Doctor</label>
                  <select 
                    id="new-appt-doctor"
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white"
                  >
                    <option>Dr. Elena Cooper (Family Medicine - Room 02)</option>
                    <option>Dr. Daniel Kim (Internal Medicine - Room 03)</option>
                    <option>Dr. Rajesh Patil (Cardiology)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Appointment Time</label>
                  <input
                    type="time"
                    defaultValue="11:30"
                    id="new-appt-time"
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">Visit Type</label>
                  <input
                    type="text"
                    defaultValue="Follow-up Consultation"
                    id="new-appt-type"
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white"
                  />
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => {
                      notify('Appointment created and added to schedule.')
                      setShowNewApptModal(false)
                    }}
                    className="w-full py-2.5 rounded-lg bg-forest-green text-white font-medium hover:bg-forest-green/90 transition-colors"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Requeue Confirmation Dialog Modal */}
      <AnimatePresence>
        {showRequeueModal && showRequeueModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-forest-green flex items-center justify-center">
                    <ArrowPathIcon className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-forest-green">
                      Confirm Requeue Patient
                    </h3>
                    <p className="text-[11px] text-text-secondary">Return patient to active waiting queue</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRequeueModal(null)} 
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Patient Summary Card */}
                <div className="bg-[#FAFBF9] border border-pale-sage rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Patient Name:</span>
                    <span className="font-semibold text-stone-900">{showRequeueModal.item.patientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Sequential Token:</span>
                    <span className="font-serif font-bold text-forest-green text-sm px-2 py-0.5 rounded bg-pale-sage/40">
                      {showRequeueModal.item.token}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Current Status:</span>
                    <span className="capitalize font-semibold text-stone-700">{showRequeueModal.item.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> This patient will be placed at the end of the active waiting queue with status <strong>WAITING</strong>. Their original sequential token number ({showRequeueModal.item.token}) and health records are strictly preserved. No new token is generated.
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Requeue Reason / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={showRequeueModal.note}
                    onChange={(e) => setShowRequeueModal({ ...showRequeueModal, note: e.target.value })}
                    placeholder="e.g. Returned from lab test / patient was away during initial call"
                    className="w-full p-2.5 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-pale-sage">
                  <button
                    type="button"
                    onClick={() => setShowRequeueModal(null)}
                    className="px-4 py-2 rounded-lg border border-pale-sage text-stone-600 hover:bg-stone-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      requeuePatient(showRequeueModal.item.id, showRequeueModal.note)
                      notify(`Patient ${showRequeueModal.item.patientName} (Token ${showRequeueModal.item.token}) requeued to waiting list.`)
                      setShowRequeueModal(null)
                    }}
                    className="px-4 py-2 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>Confirm & Requeue</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue Audit History Modal */}
      <AnimatePresence>
        {showAuditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-forest-green">
                    Queue Transitions & Audit History
                  </h3>
                  <p className="text-[11px] text-text-secondary">Immutable log of token calls, requeues and status updates</p>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)} 
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 text-xs pr-1">
                {queueAuditHistory.length === 0 ? (
                  <p className="py-6 text-center text-text-secondary">No transitions recorded yet today.</p>
                ) : (
                  queueAuditHistory.map((entry) => (
                    <div key={entry.id} className="p-2.5 rounded-lg bg-[#FAFBF9] border border-pale-sage flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-forest-green px-1.5 py-0.5 rounded bg-pale-sage/50 text-[11px]">
                            {entry.token}
                          </span>
                          <span className="capitalize font-semibold text-stone-800">{entry.action.replace('_', ' ')}</span>
                          {entry.previous_status && entry.new_status && (
                            <span className="text-[10px] text-text-secondary">
                              ({entry.previous_status} → {entry.new_status})
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <div className="text-[11px] text-stone-600 mt-1 italic">{entry.notes}</div>
                        )}
                      </div>
                      <span className="text-[10px] text-text-secondary whitespace-nowrap">
                        {entry.created_at.includes('T') ? entry.created_at.split('T')[1].slice(0, 5) : entry.created_at.slice(11, 16)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-pale-sage mt-4 text-right">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 rounded-lg bg-forest-green text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}