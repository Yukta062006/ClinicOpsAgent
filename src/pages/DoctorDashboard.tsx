import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  UserIcon, 
  ClockIcon, 
  CalendarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

export default function DoctorDashboard() {
  const location = useLocation()
  const { 
    appointments, 
    patients, 
    queue,
    user,
    startConsultation,
    completeConsultation,
    callNextPatient
  } = useData()

  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon' | 'completed'>('morning')
  const [showConsultationModal, setShowConsultationModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState<any | null>(null)
  const [showIntakeModal, setShowIntakeModal] = useState<any | null>(null)
  const [showReceptionModal, setShowReceptionModal] = useState(false)
  const [receptionMsg, setReceptionMsg] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Handle URL query parameters from sidebar links
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    const actionParam = params.get('action')

    if (tabParam === 'morning' || tabParam === 'afternoon' || tabParam === 'completed') {
      setActiveTab(tabParam)
    } else if (tabParam === 'patients') {
      setShowRecordModal(patients[0] || null)
    }

    if (actionParam === 'consult') {
      setShowConsultationModal(true)
    } else if (actionParam === 'history' || actionParam === 'notes') {
      setShowRecordModal(patients[0] || null)
    } else if (actionParam === 'followup') {
      setShowConsultationModal(true)
    }
  }, [location.search, patients])

  // Consultation Form State
  const [consultNotes, setConsultNotes] = useState({
    chiefComplaint: 'Follow-up for type 2 diabetes management and mild morning fatigue.',
    vitals: {
      bp: '124/82 mmHg',
      pulse: '74 bpm',
      spo2: '98%',
      temp: '98.4 °F'
    },
    observations: 'Patient reports steady compliance with Metformin 500mg. Fasting blood sugar logs show average 118 mg/dL over past 3 weeks. No hypoglycemic episodes.',
    diagnosis: 'Type 2 Diabetes Mellitus - Well controlled on oral hypoglycemics.',
    prescription: '1. Tab. Metformin 500mg - 1 tablet twice daily after meals.\n2. Tab. Methylcobalamin 1500 mcg - 1 tablet once daily.\n3. Continue lifestyle modifications and 40 min brisk walk.',
    followUp: '2026-11-20'
  })

  const notify = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Active next patient
  const readyPatientQueue = queue.find(q => {
    const s = (q.status || '').toLowerCase()
    return s === 'in-progress' || s === 'called' || s === 'waiting' || s === 'ready'
  })
  const activeToken = readyPatientQueue?.token || 'A-014'
  const activePatientName = readyPatientQueue?.patientName || 'Maya Patel'
  const activePatientObj = patients.find(p => p.id === readyPatientQueue?.patientId || p.name === activePatientName) || {
    id: 'p-maya',
    name: 'Maya Patel',
    age: 34,
    gender: 'Female',
    phone: '+91 98201 45890',
    abhaId: '91-4523-8890-1234',
    allergies: ['No allergies recorded'],
    medicalHistory: ['Type 2 Diabetes (2023)', 'Mild Hypertension']
  }

  // Filter schedule
  const scheduleVisits = appointments.filter(a => {
    const st = (a.status || '').toLowerCase()
    if (activeTab === 'completed') return st === 'completed'
    return st !== 'cancelled'
  })

  // Handle start consultation
  const handleStartConsultationClick = () => {
    if (readyPatientQueue) {
      startConsultation(readyPatientQueue.id)
    }
    setShowConsultationModal(true)
  }

  // Handle finish consultation
  const handleCompleteConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (readyPatientQueue) {
      completeConsultation(
        readyPatientQueue.id,
        {
          diagnosis: consultNotes.diagnosis,
          observations: consultNotes.observations,
          prescription: consultNotes.prescription,
          vitals: `${consultNotes.vitals.bp} | Pulse: ${consultNotes.vitals.pulse} | SpO2: ${consultNotes.vitals.spo2}`,
          notes: consultNotes.chiefComplaint,
          followUpDate: consultNotes.followUp
        }
      )
    }
    notify(`Consultation for ${activePatientName} saved and signed. Medical record & queue updated.`)
    setShowConsultationModal(false)
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
            OPD OPERATIONS / CLINICAL WORKSPACE
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
            Good morning, Dr. Cooper.
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Your consultations and schedule, with the right context at hand.
          </p>
        </div>

        <button
          onClick={() => notify('OPD schedule is open for 12 appointments today.')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-pale-sage bg-white text-forest-green font-medium text-sm hover:bg-pale-sage/40 transition-colors shadow-sm self-start md:self-auto"
        >
          <CalendarIcon className="w-4 h-4 text-forest-green" />
          <span>Open schedule</span>
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <CalendarIcon className="w-4 h-4 text-forest-green" />
            <span>Today's consultations</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">12</div>
          <p className="text-xs text-text-secondary mt-1">Morning & afternoon clinic</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <ClipboardDocumentCheckIcon className="w-4 h-4 text-forest-green" />
            <span>Completed</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">03</div>
          <p className="text-xs text-text-secondary mt-1">Notes saved for every visit</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <UserIcon className="w-4 h-4 text-forest-green" />
            <span>Ready to see you</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">02</div>
          <p className="text-xs text-text-secondary mt-1">Room 02 • Family medicine</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-pale-sage shadow-sm">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
            <ClockIcon className="w-4 h-4 text-forest-green" />
            <span>Next break</span>
          </div>
          <div className="text-3xl font-serif font-bold text-forest-green">12:30</div>
          <p className="text-xs text-text-secondary mt-1">30 min • Protected time</p>
        </div>
      </div>

      {/* Main Grid: Left Column (Next Consult + Morning Schedule) + Right Column (Patient at a glance + Care team) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Next Consultation Highlight Card */}
          <div className="bg-[#FAFBF9] rounded-xl p-6 border border-pale-sage shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold text-text-secondary tracking-wider">
                Next consultation
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ready for consultation
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-2">
              <div>
                <h3 className="text-2xl font-serif font-bold text-forest-green">
                  {activePatientName} · Follow-up
                </h3>
                <p className="text-xs text-stone-600 font-medium mt-1">
                  09:45–10:00 AM · Room 02 · <span className="font-bold text-forest-green">Token {activeToken}</span>
                </p>
                <p className="text-xs text-text-secondary mt-2 max-w-lg leading-relaxed">
                  Intake complete. Previous visit summary and patient questions are ready to review.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    const nextP = callNextPatient()
                    if (nextP) {
                      notify(`Called Token ${nextP.token} for ${nextP.patientName} to Room 02.`)
                    } else {
                      notify('No waiting patients remaining in queue.')
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#EFF5EE] border border-pale-sage text-forest-green text-xs font-bold hover:bg-[#E2ECE4] transition-colors shadow-2xs"
                >
                  <ClockIcon className="w-4 h-4 text-forest-green" />
                  <span>Call Next Patient</span>
                </button>
                <button
                  onClick={handleStartConsultationClick}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-forest-green text-white font-medium text-sm hover:bg-forest-green/90 transition-all shadow-sm"
                >
                  <span>→ Start consultation</span>
                </button>
                <button
                  onClick={() => setShowRecordModal(activePatientObj)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-pale-sage bg-white text-forest-green text-xs font-semibold hover:bg-pale-sage/30 transition-colors"
                >
                  <span>Review previous notes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Your Morning Schedule */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-bold text-forest-green">
                Your morning schedule
              </h3>
              <button 
                onClick={() => notify('Full day schedule: 12 patients confirmed.')}
                className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1"
              >
                Full day ↗
              </button>
            </div>

            {/* Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-[#F5F8F6] border border-pale-sage text-xs mb-4">
              <button
                onClick={() => setActiveTab('morning')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'morning' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Morning
              </button>
              <button
                onClick={() => setActiveTab('afternoon')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'afternoon' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Afternoon
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'completed' ? 'bg-forest-green text-white shadow-xs' : 'text-text-secondary hover:text-forest-green'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Schedule List */}
            <div className="space-y-2.5">
              {scheduleVisits.slice(0, 5).map((visit, idx) => (
                <div 
                  key={visit.id}
                  className="p-3.5 rounded-xl border border-pale-sage/70 hover:bg-[#FAFBF9] transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-stone-800 font-semibold w-16">
                      <div>{visit.time}</div>
                      <div className="text-[10px] text-text-secondary font-normal">15 min</div>
                    </div>
                    <div>
                      <div className="font-semibold text-forest-green text-xs">
                        {visit.patientName}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {visit.type} · {visit.patientId || 'WC-1042'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      visit.status === 'in-progress'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : visit.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-stone-50 text-stone-600 border-stone-200'
                    }`}>
                      {visit.status === 'confirmed' ? 'Ready' : visit.status}
                    </span>
                    <button
                      onClick={() => setShowRecordModal({ name: visit.patientName, id: visit.patientId })}
                      className="text-xs font-semibold text-forest-green hover:underline inline-flex items-center gap-1"
                    >
                      <span>View record</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-secondary/80 mt-4 pt-3 border-t border-pale-sage/40">
              11:30–12:30 · Flexible appointments / 12:30–13:00 · Lunch break
            </p>
          </div>
        </div>

        {/* Right Column (1 col): Patient at a glance + Care team */}
        <div className="space-y-6">
          
          {/* Patient at a glance */}
          <div className="bg-[#FAFBF9] rounded-xl p-6 border border-pale-sage shadow-sm">
            <h4 className="text-xs uppercase font-semibold text-text-secondary tracking-wider mb-4">
              Patient at a glance
            </h4>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-pale-sage/70 text-forest-green font-serif font-bold text-sm flex items-center justify-center shrink-0">
                {activePatientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-forest-green">
                  {activePatientName}
                </h3>
                <div className="text-xs text-text-secondary">
                  34 years • {activePatientObj.id || 'WC-1042'}
                </div>
              </div>
            </div>

            <div className="inline-block mb-4">
              <span className="text-[11px] font-semibold bg-pale-sage/80 text-forest-green px-2.5 py-0.5 rounded-full">
                Token {activeToken} • Ready
              </span>
            </div>

            <div className="space-y-2.5 text-xs border-t border-pale-sage pt-3 mb-4">
              <div className="flex items-start gap-2.5">
                <CalendarIcon className="w-4 h-4 text-forest-green shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-800">Follow-up consultation</div>
                  <div className="text-text-secondary text-[11px]">Today • 09:45 AM • Room 02</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <DocumentTextIcon className="w-4 h-4 text-forest-green shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-800">Last visit: 29 Sep 2026</div>
                  <div className="text-text-secondary text-[11px]">Visit summary available</div>
                </div>
              </div>
            </div>

            {/* Allergy record */}
            <div className="mb-4">
              <span className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Allergy record
              </span>
              <div className="p-2.5 rounded-lg bg-white border border-pale-sage text-xs text-stone-700">
                No allergies recorded
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Confirm allergies and medication history with the patient at every visit.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRecordModal(activePatientObj)}
                className="w-full py-2.5 rounded-lg bg-forest-green text-white font-medium text-xs hover:bg-forest-green/90 transition-all shadow-sm"
              >
                Open patient record
              </button>
              <button
                onClick={() => setShowIntakeModal(activePatientObj)}
                className="w-full py-2 rounded-lg border border-pale-sage bg-white text-forest-green font-semibold text-xs hover:bg-pale-sage/30 transition-colors"
              >
                View intake form
              </button>
            </div>
          </div>

          {/* Care Team */}
          <div className="bg-white rounded-xl p-6 border border-pale-sage shadow-sm space-y-4">
            <h4 className="text-base font-serif font-bold text-forest-green">
              Care team
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-[#FAFBF9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-forest-green">Olivia Martin</div>
                    <div className="text-[11px] text-text-secondary">Front desk • Online</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-[#FAFBF9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-forest-green">Dr. Daniel Kim</div>
                    <div className="text-[11px] text-text-secondary">Room 03 • Available at 10:00</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-stone-300"></span>
              </div>
            </div>

            <button
              onClick={() => setShowReceptionModal(true)}
              className="w-full py-2.5 rounded-lg border border-pale-sage bg-white text-forest-green font-semibold text-xs hover:bg-pale-sage/30 transition-colors flex items-center justify-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Message reception</span>
            </button>
          </div>

        </div>
      </div>

      {/* Modal: Interactive Consultation Notes & Diagnosis */}
      <AnimatePresence>
        {showConsultationModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-4 mb-5">
                <div>
                  <span className="text-xs font-semibold text-forest-green uppercase tracking-wider bg-pale-sage/70 px-2.5 py-0.5 rounded-full">
                    Active Clinical Consultation • Room 02
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-forest-green mt-1">
                    {activePatientName} (Token {activeToken})
                  </h2>
                </div>
                <button onClick={() => setShowConsultationModal(false)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCompleteConsultationSubmit} className="space-y-4 text-xs">
                {/* Vitals row */}
                <div className="p-4 rounded-xl bg-[#FAFBF9] border border-pale-sage">
                  <h4 className="font-semibold text-forest-green mb-2 uppercase tracking-wider text-[11px]">
                    Recorded Vitals (Intake)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-text-secondary block">Blood Pressure:</span>
                      <input 
                        type="text" 
                        value={consultNotes.vitals.bp} 
                        onChange={(e) => setConsultNotes({ ...consultNotes, vitals: { ...consultNotes.vitals, bp: e.target.value } })}
                        className="font-semibold text-stone-800 p-1 border rounded w-full bg-white text-xs" 
                      />
                    </div>
                    <div>
                      <span className="text-text-secondary block">Heart Rate:</span>
                      <input 
                        type="text" 
                        value={consultNotes.vitals.pulse} 
                        onChange={(e) => setConsultNotes({ ...consultNotes, vitals: { ...consultNotes.vitals, pulse: e.target.value } })}
                        className="font-semibold text-stone-800 p-1 border rounded w-full bg-white text-xs" 
                      />
                    </div>
                    <div>
                      <span className="text-text-secondary block">SpO2:</span>
                      <input 
                        type="text" 
                        value={consultNotes.vitals.spo2} 
                        onChange={(e) => setConsultNotes({ ...consultNotes, vitals: { ...consultNotes.vitals, spo2: e.target.value } })}
                        className="font-semibold text-stone-800 p-1 border rounded w-full bg-white text-xs" 
                      />
                    </div>
                    <div>
                      <span className="text-text-secondary block">Temperature:</span>
                      <input 
                        type="text" 
                        value={consultNotes.vitals.temp} 
                        onChange={(e) => setConsultNotes({ ...consultNotes, vitals: { ...consultNotes.vitals, temp: e.target.value } })}
                        className="font-semibold text-stone-800 p-1 border rounded w-full bg-white text-xs" 
                      />
                    </div>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Chief Complaint / Symptoms
                  </label>
                  <input
                    type="text"
                    value={consultNotes.chiefComplaint}
                    onChange={(e) => setConsultNotes({ ...consultNotes, chiefComplaint: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs"
                  />
                </div>

                {/* Observations & Diagnosis */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Clinical Observations & Physical Examination
                  </label>
                  <textarea
                    rows={3}
                    value={consultNotes.observations}
                    onChange={(e) => setConsultNotes({ ...consultNotes, observations: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Working Diagnosis / Assessment
                  </label>
                  <input
                    type="text"
                    value={consultNotes.diagnosis}
                    onChange={(e) => setConsultNotes({ ...consultNotes, diagnosis: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs font-semibold text-forest-green"
                  />
                </div>

                {/* Prescription */}
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Prescription & Therapeutic Recommendations
                  </label>
                  <textarea
                    rows={3}
                    value={consultNotes.prescription}
                    onChange={(e) => setConsultNotes({ ...consultNotes, prescription: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs leading-relaxed font-mono"
                  />
                </div>

                {/* Next Follow Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Recommended Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={consultNotes.followUp}
                      onChange={(e) => setConsultNotes({ ...consultNotes, followUp: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Referral / Lab Orders
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fasting HbA1c, Lipid Profile in 4 weeks"
                      className="w-full p-2.5 rounded-lg border border-pale-sage bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-pale-sage flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary">
                    Electronically signed by Dr. Elena Cooper (Reg. MCI/MH/2014)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConsultationModal(false)}
                      className="px-4 py-2 rounded-lg border border-stone-200 text-stone-700 font-medium hover:bg-stone-50"
                    >
                      Hold
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-forest-green text-white font-medium hover:bg-forest-green/90 transition-colors shadow-sm"
                    >
                      Complete & Sign Consultation
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Patient Record */}
      <AnimatePresence>
        {showRecordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">
                  EMR Medical Record: {showRecordModal.name || 'Maya Patel'}
                </h3>
                <button onClick={() => setShowRecordModal(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAFBF9] border border-pale-sage">
                  <div className="font-semibold text-forest-green mb-1">ABHA Health Profile (India)</div>
                  <div className="text-text-secondary">ABHA ID: 91-4523-8890-1234</div>
                  <div className="text-text-secondary">ABHA Address: maya.patel@abdm</div>
                </div>

                <div>
                  <span className="font-semibold text-stone-800 block mb-1">Chronic Diagnoses</span>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    <li>Type 2 Diabetes Mellitus (E11.9) - Diagnosed Oct 2023</li>
                    <li>Essential Primary Hypertension (I10) - Stable</li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-stone-800 block mb-1">Current Active Medications</span>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    <li>Tab. Metformin HCl 500mg - 1 tab BID with meals</li>
                    <li>Tab. Telmisartan 40mg - 1 tab OD morning</li>
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-stone-800 block mb-1">Recent Lab Results</span>
                  <div className="p-2.5 rounded-lg border border-pale-sage bg-white flex justify-between">
                    <span>HbA1c (15 Sep 2026): <strong>6.8%</strong></span>
                    <span>FBS: <strong>112 mg/dL</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowRecordModal(null)}
                  className="px-4 py-2 rounded-lg bg-forest-green text-white text-xs font-medium hover:bg-forest-green/90"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Intake Form */}
      <AnimatePresence>
        {showIntakeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">Reception Intake Summary</h3>
                <button onClick={() => setShowIntakeModal(null)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-stone-700">
                <div className="p-3 rounded-lg bg-[#FAFBF9] border border-pale-sage space-y-1">
                  <div><strong>Check-in Time:</strong> 09:35 AM</div>
                  <div><strong>Verified ID:</strong> Aadhaar verified (biometric / OTP)</div>
                  <div><strong>Primary Concern:</strong> Routine prescription refill and checkup</div>
                  <div><strong>Pain Score:</strong> 0 / 10</div>
                  <div><strong>Mobility:</strong> Ambulatory, no assistance needed</div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowIntakeModal(null)}
                  className="px-4 py-2 rounded-lg bg-forest-green text-white text-xs font-medium hover:bg-forest-green/90"
                >
                  Close Intake
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Message Reception */}
      <AnimatePresence>
        {showReceptionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-pale-sage shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
                <h3 className="text-xl font-serif font-bold text-forest-green">Message Front Desk</h3>
                <button onClick={() => setShowReceptionModal(false)} className="text-stone-400 hover:text-stone-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-text-secondary">
                  Send immediate intercom note to Olivia Martin (Reception desk):
                </p>
                <textarea
                  rows={3}
                  value={receptionMsg}
                  onChange={(e) => setReceptionMsg(e.target.value)}
                  placeholder="e.g. Please send next patient to Room 02 in 5 minutes..."
                  className="w-full p-3 rounded-lg border border-pale-sage bg-white text-xs"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowReceptionModal(false)}
                    className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      notify('Intercom dispatched to front desk: ' + (receptionMsg || 'Ready for next patient.'))
                      setReceptionMsg('')
                      setShowReceptionModal(false)
                    }}
                    className="px-4 py-2 rounded-lg bg-forest-green text-white font-medium hover:bg-forest-green/90"
                  >
                    Send Message
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