import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  CalendarIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
  ChevronRightIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { useData, Appointment } from '../context/DataContext'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    currentPatient, 
    appointments, 
    queue, 
    user,
    addAppointment,
    rescheduleAppointment,
    cancelAppointment,
    consultations,
    getNextSequentialToken,
    userPoints
  } = useData()

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false)
  const [isReschedulingModalOpen, setIsReschedulingModalOpen] = useState(false)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)

  // Booking Form State
  const [bookDoctor, setBookDoctor] = useState('Dr. Elena Cooper')
  const [bookType, setBookType] = useState('Family Medicine Follow-up')
  const [bookDate, setBookDate] = useState('2026-10-24')
  const [bookTime, setBookTime] = useState('09:45 AM')
  const [bookReason, setBookReason] = useState('')

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM')

  // Handle URL query parameters from sidebar navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const actionParam = params.get('action')

    if (actionParam === 'schedule') {
      setIsBookingModalOpen(true)
    } else if (actionParam === 'records') {
      setIsRecordsModalOpen(true)
    }
  }, [location.search])

  // Find active queue status for patient
  const patientQueueItem = queue.find(q => 
    q.patientId === currentPatient.id || 
    q.patientName.toLowerCase() === currentPatient.name.toLowerCase()
  ) || queue[2] // Fallback

  // Patient appointments
  const patientAppts = appointments.filter(a => 
    a.patientId === currentPatient.id || 
    a.patientName.toLowerCase() === currentPatient.name.toLowerCase()
  )

  const activeAppt = patientAppts.find(a => a.status === 'scheduled' || a.status === 'confirmed') || {
    id: 'appt-default-1',
    patientId: currentPatient.id,
    patientName: currentPatient.name,
    doctorId: 'doc-elena',
    doctorName: 'Dr. Elena Cooper',
    doctorSpecialty: 'Family medicine',
    time: '09:45 AM',
    date: 'Tue, 13 Oct 2026',
    type: 'Family medicine follow-up',
    status: 'confirmed' as const,
    notes: 'Routine family medicine review and blood glucose check',
    token: patientQueueItem?.token || 'A-014'
  }

  // Extract patient first name
  const rawName = user?.name || currentPatient?.name || 'Maya'
  const firstName = rawName.split(' ')[0]

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault()
    const token = getNextSequentialToken(bookType)
    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      doctorId: bookDoctor.includes('Cooper') ? 'doc-elena' : (bookDoctor.includes('Sharma') ? 'doc-sarah' : 'doc-amit'),
      doctorName: bookDoctor,
      doctorSpecialty: bookType,
      time: bookTime,
      date: bookDate,
      type: bookType,
      status: 'confirmed',
      notes: bookReason || 'Booked via patient portal',
      token
    }

    addAppointment(newAppt)
    setIsBookingModalOpen(false)
    setBookReason('')
  }

  const handleConfirmReschedule = () => {
    if (!selectedAppt || !rescheduleDate) return
    rescheduleAppointment(selectedAppt.id, rescheduleDate, rescheduleTime)
    setIsReschedulingModalOpen(false)
    setSelectedAppt(null)
  }

  const handleCancelAppt = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled appointment?')) {
      cancelAppointment(id, 'Cancelled by patient via dashboard')
      setSelectedAppt(null)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    setMessageSent(true)
    setTimeout(() => {
      setMessageSent(false)
      setMessageText('')
      setIsMessageModalOpen(false)
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#2D5A43] tracking-widest uppercase mb-1">
            PATIENT ENGAGEMENT / MY CARE
          </p>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1B3E2F] tracking-tight">
            Hello {firstName}, you're in good hands.
          </h1>
          <p className="text-sm text-[#5A6D62] mt-1 font-normal">
            Your visits, care updates and health learning, all in one place.
          </p>
        </div>

        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-[#1B3E2F] hover:bg-[#143024] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4 text-white" />
          <span>Book a visit</span>
        </button>
      </div>

      {/* Hero Banner: Your Next Step + Token */}
      <div className="rounded-3xl bg-[#E8F1E9] border border-[#D5E4D8] p-6 lg:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="max-w-xl">
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold tracking-wider text-[#2D5A43] uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43] animate-pulse"></span>
            <span>{patientQueueItem?.status === 'called' ? 'NOW CALLING • PROCEED TO ROOM' : 'TODAY • CHECKED IN'}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-[#1B3E2F] tracking-tight">
            {patientQueueItem?.status === 'called' ? 'Your turn now: Room 02' : 'Your next step: Room 02'}
          </h2>
          <p className="text-sm text-[#2E4738] mt-2 font-medium">
            Follow-up with Dr. Elena Cooper at 09:45 AM.
          </p>
          <p className="text-xs text-[#5A6D62] mt-1 font-normal">
            Queue token {patientQueueItem?.token || 'A-014'} • We'll let you know when it's your turn.
          </p>
        </div>

        {/* Token Pill Box */}
        <div className="bg-white rounded-2xl p-5 border border-[#D5E4D8] min-w-[190px] text-center shadow-2xs flex-shrink-0">
          <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider">YOUR TOKEN</p>
          <div className="text-4xl font-serif font-bold text-[#1B3E2F] my-1.5 tracking-tight">
            {patientQueueItem?.token || 'A-014'}
          </div>
          <span className="inline-block text-[11px] font-bold text-[#2D5A43] bg-[#EFF5EE] px-3.5 py-1 rounded-full border border-[#D5E4D8]">
            {patientQueueItem?.status === 'called' ? 'Serving Now' : "You're next"}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Next appointment */}
        <div 
          onClick={() => setSelectedAppt(activeAppt as Appointment)}
          className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-2xs hover:border-[#1B3E2F]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-3">
            <CalendarIcon className="w-4 h-4 text-[#829489]" />
            <span>Next appointment</span>
          </div>
          <div className="text-3xl font-serif font-bold text-[#1B3E2F]">09:45</div>
          <p className="text-xs text-[#5A6D62] mt-1">Today • Family medicine</p>
        </div>

        {/* Metric 2: Care documents */}
        <div 
          onClick={() => setIsRecordsModalOpen(true)}
          className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-2xs hover:border-[#1B3E2F]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-3">
            <DocumentTextIcon className="w-4 h-4 text-[#829489]" />
            <span>Care documents</span>
          </div>
          <div className="text-3xl font-serif font-bold text-[#1B3E2F]">04</div>
          <p className="text-xs text-[#5A6D62] mt-1">All available to view</p>
        </div>

        {/* Metric 3: Learning score */}
        <div 
          onClick={() => navigate('/learning-progress')}
          className="bg-white border border-[#E2ECE4] rounded-2xl p-5 shadow-2xs hover:border-[#1B3E2F]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] mb-3">
            <SparklesIcon className="w-4 h-4 text-[#829489]" />
            <span>Learning score</span>
          </div>
          <div className="text-3xl font-serif font-bold text-[#1B3E2F]">{userPoints || 840}</div>
          <p className="text-xs text-[#5A6D62] mt-1">Keep your curiosity growing</p>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Timeline, Appointments, and Learning Banner */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Your Care Timeline */}
            <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2ECE4] mb-4">
                  <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Your care timeline</h3>
                  <button 
                    onClick={() => setIsRecordsModalOpen(true)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-[#1B3E2F] hover:underline"
                  >
                    <span>All activity</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#1E2D25] truncate">Follow-up appointment</p>
                        <span className="text-[10px] font-bold text-[#2D5A43] bg-[#EFF5EE] border border-[#D5E4D8] px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A6D62] mt-0.5">Today • 09:45 AM • Dr. Elena Cooper</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircleIcon className="w-4 h-4 text-[#2D5A43]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1E2D25]">Visit preparation completed</p>
                      <p className="text-[11px] text-[#5A6D62] mt-0.5">12 Oct • Your intake form is saved</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <DocumentTextIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1E2D25]">Visit summary available</p>
                      <p className="text-[11px] text-[#5A6D62] mt-0.5">29 Sep • Family medicine consultation</p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <SparklesIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1E2D25]">Welcome to Willow Clinic</p>
                      <p className="text-[11px] text-[#5A6D62] mt-0.5">22 Sep • Patient profile created</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Appointments */}
            <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2ECE4] mb-4">
                  <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Appointments</h3>
                  <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-[#1B3E2F] hover:underline"
                  >
                    <span>Manage</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <span className="inline-block text-[10px] font-bold text-[#2D5A43] bg-[#EFF5EE] border border-[#D5E4D8] px-2.5 py-0.5 rounded-full mb-2">
                    Confirmed
                  </span>
                  <h4 className="text-base font-serif font-bold text-[#1B3E2F]">
                    Family medicine follow-up
                  </h4>
                  <p className="text-xs text-[#5A6D62] mt-1 leading-relaxed">
                    Tue, 13 Oct 2026 • 09:45–10:00 Willow Family Clinic • Room 02
                  </p>
                </div>

                {/* Secondary Appointment Box */}
                <div className="mt-4 p-3.5 bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E2ECE4] flex items-center justify-center text-[#5A6D62]">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E2D25]">Annual wellness visit</p>
                    <p className="text-[11px] text-[#5A6D62]">Tue, 10 Nov • 10:30 AM</p>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-2">
                <button
                  onClick={() => setSelectedAppt(activeAppt as Appointment)}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#D5E4D8] hover:bg-[#EFF5EE] text-[#1B3E2F] font-semibold text-xs transition-colors text-center"
                >
                  View visit details
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Learning Banner: Small habits */}
          <div className="rounded-3xl bg-[#E8F1E9] border border-[#D5E4D8] p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold text-[#2D5A43] tracking-widest uppercase mb-1">
                A LITTLE LEARNING WHILE YOU WAIT
              </p>
              <h3 className="text-xl lg:text-2xl font-serif font-bold text-[#1B3E2F]">
                Small habits. A healthier understanding.
              </h3>
              <p className="text-xs text-[#3E5246] mt-1.5 leading-relaxed">
                Explore balanced eating, gentle movement and sleep basics. Pick up where you left off.
              </p>
              <p className="text-[11px] text-[#5A6D62] mt-2 font-medium">
                Your current path: Everyday wellbeing • 3 of 5 lessons
              </p>
            </div>

            <button
              onClick={() => navigate('/health-games')}
              className="inline-flex items-center space-x-2 bg-[#1B3E2F] hover:bg-[#143024] text-white px-5 py-2.5 rounded-xl font-medium text-xs transition-all shadow-2xs self-start sm:self-auto flex-shrink-0 cursor-pointer"
            >
              <span>Continue learning</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legal / Medical Info Footer */}
          <div className="flex items-start space-x-2 text-[11px] text-[#829489] px-2">
            <InformationCircleIcon className="w-4 h-4 text-[#829489] flex-shrink-0 mt-0.5" />
            <p>
              Learning resources are educational and are not personalized medical advice. For questions about your care, contact your clinical team.
            </p>
          </div>
        </div>

        {/* Right Column (4 cols): Doctor Profile & Before Your Visit */}
        <div className="lg:col-span-4 space-y-6">
          {/* Doctor Card */}
          <div className="bg-white border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="overflow-hidden rounded-2xl h-48 bg-[#EFF5EE] relative">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600" 
                alt="Dr. Elena Cooper"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-[#1B3E2F]">Dr. Elena Cooper</h3>
              </div>
              <p className="text-xs text-[#5A6D62] mt-0.5">Family medicine • Your care team</p>
              <div className="mt-2">
                <span className="inline-block text-[10px] font-bold text-[#2D5A43] bg-[#EFF5EE] border border-[#D5E4D8] px-2.5 py-0.5 rounded-full">
                  Available today
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5A6D62] leading-relaxed">
              A familiar face for your check-ups, questions and ongoing care.
            </p>

            {/* Visit appointment mini badge */}
            <div className="p-3 bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E2ECE4] flex items-center justify-center text-[#5A6D62]">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#1E2D25]">Today at 09:45 AM</p>
                <p className="text-[#5A6D62]">Room 02 • Willow Family Clinic</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setSelectedAppt(activeAppt as Appointment)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1B3E2F] hover:bg-[#143024] text-white font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                View appointment
              </button>
              <button
                onClick={() => setIsMessageModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#D5E4D8] hover:bg-[#EFF5EE] text-[#1B3E2F] font-semibold text-xs transition-colors inline-flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Message care team</span>
              </button>
            </div>
          </div>

          {/* Before your visit Card */}
          <div className="bg-[#FAF9F5] border border-[#E2ECE4] rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Before your visit</h3>

            <div className="space-y-3">
              {/* Checklist 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E2ECE4] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DocumentTextIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E2D25]">Your forms are complete</p>
                  <p className="text-[11px] text-[#5A6D62]">Submitted yesterday</p>
                </div>
              </div>

              {/* Checklist 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E2ECE4] text-[#1B3E2F] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IdentificationIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E2D25]">Bring your health card</p>
                  <p className="text-[11px] text-[#5A6D62]">And your current medication list</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/travel-planner')}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#D5E4D8] hover:bg-[#EFF5EE] text-[#1B3E2F] font-semibold text-xs transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <MapPinIcon className="w-4 h-4 text-[#2D5A43]" />
              <span>Plan my journey</span>
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Detail / Reschedule / Cancel Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4] mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Token #{selectedAppt.token || 'A-014'}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F] mt-1">{selectedAppt.type}</h3>
              </div>
              <button 
                onClick={() => setSelectedAppt(null)}
                className="p-1 text-[#829489] hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 bg-[#FAF9F5] rounded-xl flex justify-between">
                <span className="text-[#5A6D62] font-semibold">Doctor:</span>
                <span className="text-[#1E2D25] font-bold">{selectedAppt.doctorName}</span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded-xl flex justify-between">
                <span className="text-[#5A6D62] font-semibold">Date & Time:</span>
                <span className="text-[#1E2D25] font-bold">{selectedAppt.date || 'Today'} at {selectedAppt.time}</span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded-xl flex justify-between">
                <span className="text-[#5A6D62] font-semibold">Status:</span>
                <span className="text-[#2D5A43] font-bold capitalize">{selectedAppt.status}</span>
              </div>
              <div className="p-3 bg-[#FAF9F5] rounded-xl">
                <span className="text-[#5A6D62] font-semibold block mb-1">Clinical Notes / Reason:</span>
                <p className="text-[#1E2D25] leading-relaxed">{selectedAppt.notes || 'Routine consultation'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setRescheduleDate(selectedAppt.date || '2026-10-24')
                  setRescheduleTime(selectedAppt.time || '10:00 AM')
                  setIsReschedulingModalOpen(true)
                }}
                className="w-full py-2.5 bg-[#1B3E2F] text-white rounded-xl font-medium text-xs hover:bg-[#143024] transition-colors cursor-pointer"
              >
                Reschedule Visit
              </button>
              <button
                onClick={() => handleCancelAppt(selectedAppt.id)}
                className="w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-xs hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rescheduling Modal */}
      {isReschedulingModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-md p-6">
            <h3 className="font-serif font-bold text-lg text-[#1B3E2F] mb-2">Reschedule Appointment</h3>
            <p className="text-xs text-[#5A6D62] mb-4">
              Adjust date and time for your visit with {selectedAppt.doctorName}.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="09:45 AM">09:45 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] cursor-pointer"
              >
                Confirm Reschedule
              </button>
              <button
                onClick={() => setIsReschedulingModalOpen(false)}
                className="px-4 py-2.5 border border-[#E2ECE4] text-[#5A6D62] rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Visit Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4] mb-4">
              <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Schedule New Visit</h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="cursor-pointer">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">Doctor & Department</label>
                <select 
                  value={bookDoctor} 
                  onChange={(e) => setBookDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                >
                  <option value="Dr. Elena Cooper">Dr. Elena Cooper • Family Medicine (Room 02)</option>
                  <option value="Dr. Sarah Sharma">Dr. Sarah Sharma • General Medicine (Room 01)</option>
                  <option value="Dr. Amit Deshmukh">Dr. Amit Deshmukh • Pediatrics (Room 02)</option>
                  <option value="Dr. Neha Kulkarni">Dr. Neha Kulkarni • Endocrinology (Room 03)</option>
                  <option value="Dr. Rajesh Patil">Dr. Rajesh Patil • Cardiology (Room 04)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">Visit Type</label>
                  <select 
                    value={bookType} 
                    onChange={(e) => setBookType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                  >
                    <option value="Family Medicine Follow-up">Family Medicine Follow-up</option>
                    <option value="General Checkup">General Checkup</option>
                    <option value="Specialist Consultation">Specialist Consultation</option>
                    <option value="Cardiology Consult">Cardiology Consult</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">Time Slot</label>
                  <select 
                    value={bookTime} 
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:45 AM">09:45 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">Reason for Visit</label>
                <textarea
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="Describe symptoms or reason for visit..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1B3E2F] text-white rounded-xl text-sm font-medium hover:bg-[#143024] transition-colors cursor-pointer"
                >
                  Generate Token & Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Records & ABHA Profile Modal */}
      {isRecordsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4] mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Patient Health Records</h3>
                <p className="text-xs text-[#5A6D62]">National Digital Health Mission (ABDM/ABHA)</p>
              </div>
              <button onClick={() => setIsRecordsModalOpen(false)} className="cursor-pointer">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#EFF5EE] rounded-2xl border border-[#E2ECE4]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[#1B3E2F] text-base">{currentPatient.name}</h4>
                    <p className="text-xs text-[#5A6D62]">DOB: {currentPatient.dateOfBirth} • Age: {currentPatient.age} yrs • Blood Group: {currentPatient.bloodGroup || 'O+'}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white text-[#1B3E2F] px-2.5 py-1 rounded-lg border border-[#E2ECE4]">
                    {currentPatient.gender}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E2ECE4] text-xs">
                  <div>
                    <span className="text-[#829489] block">ABHA Number</span>
                    <span className="font-mono font-bold text-[#1E2D25]">{currentPatient.abhaId || '91-4821-7290-3412'}</span>
                  </div>
                  <div>
                    <span className="text-[#829489] block">Aadhaar (Masked)</span>
                    <span className="font-mono font-bold text-[#1E2D25]">{currentPatient.aadhaar || 'XXXX-XXXX-4912'}</span>
                  </div>
                  <div>
                    <span className="text-[#829489] block">PAN Number</span>
                    <span className="font-mono font-bold text-[#1E2D25]">{currentPatient.pan || 'AAAPT4912K'}</span>
                  </div>
                  <div>
                    <span className="text-[#829489] block">Emergency Contact</span>
                    <span className="font-medium text-[#1E2D25]">{currentPatient.emergencyContact || '+91 98201 99887'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#1B3E2F] mb-2">Past Consultations & Summaries</h4>
                <div className="space-y-3">
                  {consultations.map(c => (
                    <div key={c.id} className="p-3.5 bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-[#1B3E2F]">
                        <span>{c.doctorName}</span>
                        <span className="text-[#5A6D62]">{c.date}</span>
                      </div>
                      <p><strong className="text-[#5A6D62]">Diagnosis:</strong> {c.diagnosis}</p>
                      <p><strong className="text-[#5A6D62]">Prescription:</strong> {c.prescription}</p>
                      <p><strong className="text-[#5A6D62]">Vitals:</strong> {c.vitals}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#E2ECE4]">
              <button
                onClick={() => setIsRecordsModalOpen(false)}
                className="w-full py-2.5 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] cursor-pointer"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Care Team Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4] mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">Message Care Team</h3>
                <p className="text-xs text-[#5A6D62]">Direct communication with Dr. Elena Cooper</p>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="cursor-pointer">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {messageSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#EFF5EE] text-[#1B3E2F] flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-6 h-6 text-[#2D5A43]" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#1B3E2F]">Message Sent</h4>
                <p className="text-xs text-[#5A6D62]">Your care team has received your message and will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1">
                    Your Question or Update
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message regarding symptoms, medications, or upcoming visit..."
                    rows={4}
                    className="w-full px-3 py-2 border border-[#E2ECE4] rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#1B3E2F] text-white rounded-xl text-xs font-bold hover:bg-[#143024] cursor-pointer"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="px-4 py-2.5 border border-[#E2ECE4] text-[#5A6D62] rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}