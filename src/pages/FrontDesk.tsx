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
  SparklesIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

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
    queue,
    activeClinic
  } = useData()

  const [activeTab, setActiveTab] = useState<'all' | 'arrived' | 'upcoming'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickCheckInSearch, setQuickCheckInSearch] = useState('')
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
    abhaId: '14-5512-9901-2283',
    aadhaar: 'XXXX-XXXX-2283',
    pan: 'BBMPP2283L',
    abhaStatus: 'Self-declared / Sandbox Verified',
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

  // Quick check-in search results
  const quickResults = quickCheckInSearch.trim() === '' ? [] : patients.filter(p => 
    p.name.toLowerCase().includes(quickCheckInSearch.toLowerCase()) ||
    p.phone.includes(quickCheckInSearch) ||
    p.id.toLowerCase().includes(quickCheckInSearch.toLowerCase()) ||
    (p.abhaId && p.abhaId.includes(quickCheckInSearch))
  )

  // Handle checking in an appointment
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

  // Handle quick check-in for registered patient
  const handleQuickPatientCheckIn = (patient: any) => {
    const existing = appointments.find(a => a.patientId === patient.id && a.status !== 'completed' && a.status !== 'cancelled')
    if (existing) {
      handleCheckIn(existing.id)
    } else {
      const queueItem = checkInPatient(
        patient.id,
        patient.primaryPhysician || 'Dr. Sarah Sharma',
        'General Practice',
        'Walk-in Consultation'
      )
      notify(`Walk-in checked in! Sequential Token ${queueItem.token} assigned.`)
      setQuickCheckInSearch('')
    }
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
      aadhaar: regForm.aadhaar,
      pan: regForm.pan || 'ABCDE1234F',
      emergencyContact: regForm.emergencyContact,
      bloodGroup: regForm.bloodGroup,
      medicalHistory: ['Front-desk intake recorded'],
      allergies: ['No known drug allergies reported'],
      insurance: 'Ayushman Bharat (PM-JAY)',
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
      abhaId: '14-8832-1094-5521',
      aadhaar: 'XXXX-XXXX-8821',
      pan: 'AASPS8821M',
      abhaStatus: 'Self-declared / Sandbox Verified',
      visitType: 'General Consultation',
      doctor: 'Dr. Sarah Sharma',
      time: '11:00 AM',
      consent: true
    })
  }

  // Load verified test/demo sandbox ABHA identifier
  const loadSandboxTestAbha = () => {
    const demoAbhas = [
      '14-8832-1094-5521',
      '91-4821-7290-3412',
      '22-4910-3382-7719',
      '14-5512-9901-2283'
    ]
    const chosen = demoAbhas[Math.floor(Math.random() * demoAbhas.length)]
    setRegForm(prev => ({ 
      ...prev, 
      abhaId: chosen,
      abhaStatus: 'Sandbox Test ABHA'
    }))
    notify(`Loaded test environment ABHA: ${chosen} (Sandbox Mode)`)
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

        <button
          onClick={() => setShowNewApptModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-forest-green text-white font-medium text-sm hover:bg-forest-green/90 transition-all shadow-sm hover:shadow self-start md:self-auto"
        >
          <span className="text-base leading-none">+</span>
          <span>New appointment</span>
        </button>
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
          
          {/* Today's Appointments Card */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-forest-green">
                Today's appointments
              </h3>
              <button 
                onClick={() => notify('Calendar synchronised with Doctor OPD schedules.')}
                className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                View calendar ↗
              </button>
            </div>

            {/* Filter Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="inline-flex p-1 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs">
                <button
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
                  onClick={() => setActiveTab('arrived')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    activeTab === 'arrived' 
                      ? 'bg-forest-green text-white shadow-xs' 
                      : 'text-text-secondary hover:text-forest-green'
                  }`}
                >
                  Arrived ({appointments.filter(a => ['Checked In', 'Arrived', 'In Progress'].includes(a.status)).length})
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    activeTab === 'upcoming' 
                      ? 'bg-forest-green text-white shadow-xs' 
                      : 'text-text-secondary hover:text-forest-green'
                  }`}
                >
                  Upcoming ({appointments.filter(a => ['Scheduled', 'Expected', 'Confirmed'].includes(a.status)).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
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
            </div>

            {/* Visits Table */}
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
                      const isCheckedIn = apt.status === 'confirmed' || apt.status === 'in-progress'
                      return (
                        <tr key={apt.id} className="hover:bg-pale-sage/10 transition-colors">
                          {/* Patient */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-pale-sage/60 text-forest-green font-serif font-bold text-xs flex items-center justify-center shrink-0">
                                {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
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

                          {/* Time */}
                          <td className="py-3 px-3 text-xs text-stone-700 font-medium">
                            {apt.time}
                          </td>

                          {/* Doctor / Visit */}
                          <td className="py-3 px-3">
                            <div className="text-xs font-medium text-stone-800">
                              {apt.doctorName}
                            </div>
                            <div className="text-[11px] text-text-secondary">
                              {apt.type}
                            </div>
                          </td>

                          {/* Status */}
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

                          {/* Action */}
                          <td className="py-3 px-3 text-right">
                            {isCheckedIn ? (
                              <button
                                onClick={() => setSelectedVisit(apt)}
                                className="text-xs font-semibold text-forest-green hover:underline inline-flex items-center gap-1"
                              >
                                <span>View visit</span>
                                <span>↗</span>
                              </button>
                            ) : (
                              <button
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

            <div className="flex items-center justify-between text-xs text-text-secondary mt-4 pt-3 border-t border-pale-sage/40">
              <span>Showing {filteredVisits.length} appointments</span>
              <div className="flex items-center gap-2">
                <button className="hover:text-forest-green">← Previous</button>
                <span className="font-semibold text-forest-green">1</span>
                <button className="hover:text-forest-green">Next →</button>
              </div>
            </div>
          </div>

          {/* Quick Check-in & Clinic Readiness Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Quick Check-in */}
            <div className="bg-[#FAFBF9] rounded-xl p-5 border border-pale-sage shadow-2xs">
              <h4 className="text-sm font-serif font-bold text-forest-green mb-1">
                Quick check-in
              </h4>
              <p className="text-xs text-text-secondary mb-3">
                Find an existing patient by phone or patient ID.
              </p>

              <div className="relative mb-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Enter name, phone or ABHA..."
                  value={quickCheckInSearch}
                  onChange={(e) => setQuickCheckInSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green"
                />
              </div>

              {/* Quick Results Dropdown */}
              {quickResults.length > 0 && (
                <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto bg-white p-2 rounded-lg border border-pale-sage shadow-xs">
                  {quickResults.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-pale-sage/20 text-xs">
                      <div>
                        <div className="font-semibold text-forest-green">{p.name}</div>
                        <div className="text-[11px] text-text-secondary">{p.phone} • {p.id}</div>
                      </div>
                      <button
                        onClick={() => handleQuickPatientCheckIn(p)}
                        className="px-2.5 py-1 bg-forest-green text-white text-[11px] font-medium rounded-md hover:bg-forest-green/90"
                      >
                        Check in
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

              {/* ABHA ID with sandbox sample */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    ABHA Number (Ayushman Bharat)
                  </label>
                  <button
                    type="button"
                    onClick={loadSandboxTestAbha}
                    className="text-[10px] text-forest-green font-semibold hover:underline flex items-center gap-1"
                    title="Load an authorized sandbox test ABHA identifier"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    Load Sandbox Sample
                  </button>
                </div>
                <input
                  type="text"
                  value={regForm.abhaId}
                  onChange={(e) => setRegForm({ ...regForm, abhaId: e.target.value })}
                  placeholder="14-digit format: 14-8832-1094-5521"
                  className="w-full px-3 py-2 rounded-lg border border-pale-sage text-xs bg-white text-stone-800 focus:outline-hidden focus:border-forest-green"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Status: <strong className="text-forest-green font-medium">{regForm.abhaStatus || 'Self-declared / Sandbox'}</strong> (NDHM / ABDM Ready)
                </span>
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Aadhaar (Masked)
                  </label>
                  <input
                    type="text"
                    value={regForm.aadhaar}
                    onChange={(e) => setRegForm({ ...regForm, aadhaar: e.target.value })}
                    placeholder="XXXX-XXXX-8821"
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
    </div>
  )
}