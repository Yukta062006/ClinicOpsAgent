import React, { useState } from 'react'
import { 
  UserIcon, 
  ClockIcon, 
  CheckBadgeIcon, 
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../context/DataContext'

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients'>('appointments')
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'join' | 'start' | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  
  const { 
    appointments, 
    patients, 
    queue,
    updateQueueItem,
    getNextInQueue
  } = useData()

  // Get real data from context - use context Patient type directly
  const currentPatientInQueue = queue.find(q => q.status === 'in-progress')
  const waitingPatients = queue.filter(q => q.status === 'waiting')
  const nextInLine = queue.find(q => q.status === 'waiting')

  const appointmentList = appointments.slice(0, 4)
  const patientList = patients.slice(0, 4)

  const stats = {
    todayPatients: patientList.length,
    completedConsultations: appointmentList.filter(a => a.status === 'completed').length,
    pendingPatients: waitingPatients.length,
    averageWaitTime: '25 min'
  }

  const handleJoinConsultation = (queueId: string, patientName: string, patientId: string) => {
    // Update queue status to in-progress
    updateQueueItem(queueId, 'in-progress')
    setShowModal(true)
    setModalAction('join')
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
          <h1 className="text-3xl font-serif font-bold text-forest-green">Doctor Dashboard</h1>
          <p className="text-text-secondary">Welcome back, Dr. John Doe</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-light-green text-forest-green rounded-lg cursor-pointer"
          onClick={() => {
            const next = getNextInQueue()
            if (next) handleJoinConsultation(next.id, next.patientName, next.patientId)
          }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Available</span>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-pale-sage text-white rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-green-500">+2</span>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.todayPatients}</div>
          <div className="text-sm text-text-secondary mt-1">Patients Today</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-light-green text-forest-green rounded-lg">
              <CheckBadgeIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-green-500">+1</span>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.completedConsultations}</div>
          <div className="text-sm text-text-secondary mt-1">Completed</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <ClockIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-yellow-500">Active</span>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.pendingPatients}</div>
          <div className="text-sm text-text-secondary mt-1">Waiting</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white p-4 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <RectangleStackIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-forest-green">{stats.averageWaitTime}</div>
          <div className="text-sm text-text-secondary mt-1">Avg Wait Time</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-card hover:shadow-card-hover overflow-hidden"
        >
          <div className="p-6 border-b border-light-green">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'appointments' 
                    ? 'bg-forest-green text-white' 
                    : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'patients' 
                    ? 'bg-forest-green text-white' 
                    : 'bg-warm-cream/50 text-text-secondary hover:bg-warm-cream'
                }`}
              >
                My Patients
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointmentList.map((appointment, index) => {
                  // Find queue item for this patient appointment
                  const queueItem = queue.find(q => q.patientId === appointment.patientId)
                  
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-light-green rounded-lg hover:shadow-card transition-shadow cursor-pointer"
                      onClick={() => {
                        if (queueItem) {
                          handleJoinConsultation(queueItem.id, appointment.patientName, appointment.patientId)
                        }
                      }}
                    >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : appointment.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-pale-sage text-white'
                      }`}>
                        {appointment.status === 'completed' ? (
                          <CheckBadgeIcon className="w-6 h-6" />
                        ) : appointment.status === 'in-progress' ? (
                          <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                        ) : (
                          <CalendarIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-forest-green">{appointment.patientName}</h4>
                        <p className="text-sm text-text-secondary">{appointment.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-forest-green">{appointment.time}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {appointment.status === 'in-progress' ? 'In Progress' : appointment.status}
                      </span>
                    </div>
                  </motion.div>
                  )
                })}
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="space-y-4">
                {patientList.map((patient, index) => {
                  // Find queue item for this patient
                  const queueItem = queue.find(q => q.patientId === patient.id)
                  
                  return (
                    <motion.div
                      key={patient.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-light-green rounded-lg hover:shadow-card transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-pale-sage text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-forest-green">{patient.name}</h4>
                        <p className="text-sm text-text-secondary">{patient.condition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">{patient.lastVisit}</div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                        patient.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : patient.status === 'in-consultation'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                  </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Current Patient */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-forest-green">Current Patient</h3>
              <div className="flex items-center space-x-2">
                {currentConsultationPatient ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-text-secondary">Consultation in progress</span>
                  </>
                ) : (
                  <span className="text-sm text-text-secondary">No active consultation</span>
                )}
              </div>
            </div>
            {currentConsultationPatient ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-pale-sage/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-forest-green">
                    {currentConsultationPatient.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-forest-green">{currentConsultationPatient.name}</h4>
                  <p className="text-sm text-text-secondary">{currentConsultationPatient.age} years old • {currentConsultationPatient.condition}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-text-secondary">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
                  <span>No active consultation</span>
                </div>
              </div>
            )}
            <button 
              onClick={() => {
                const next = getNextInQueue()
                if (next) handleJoinConsultation(next.id, next.patientName, next.patientId)
                else if (waitingPatients.length > 0) {
                  const queueItem = queue.find(q => q.patientId === waitingPatients[0].id)
                  if (queueItem) handleJoinConsultation(queueItem.id, waitingPatients[0].name, waitingPatients[0].id)
                }
              }}
              className={`mt-6 w-full py-3 rounded-lg font-bold transition-colors ${
                waitingPatients.length > 0
                  ? 'bg-forest-green text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={waitingPatients.length === 0}
            >
              {waitingPatients.length > 0 ? 'Join Consultation' : 'No patients waiting'}
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h3 className="text-lg font-serif font-bold text-forest-green mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UserIcon, label: 'New Patient', action: 'new' },
                { icon: DocumentTextIcon, label: 'Prescription', action: 'prescription' },
                { icon: RectangleStackIcon, label: 'Lab Orders', action: 'lab' },
                { icon: ChatBubbleBottomCenterTextIcon, label: 'Consult', action: 'consult' }
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-3 bg-light-green rounded-lg hover:bg-pale-sage hover:text-white transition-colors"
                  onClick={() => {
                    if (item.action === 'new') setShowNewPatientForm(true)
                    else if (item.action === 'prescription') alert('Opening prescription form...')
                    else if (item.action === 'lab') alert('Opening lab orders...')
                    else if (item.action === 'consult') {
                      const next = getNextInQueue()
                      if (next) handleJoinConsultation(next.id, next.patientName, next.patientId)
                    }
                  }}
                >
                  <item.icon className="w-5 h-5 mb-2" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Schedule */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6"
          >
            <h3 className="text-lg font-serif font-bold text-forest-green mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {[
                { time: '11:00 AM', title: 'Lunch Break', type: 'break' },
                { time: '02:30 PM', title: 'Medical Research Review', type: 'work' },
                { time: '04:00 PM', title: 'Team Meeting', type: 'work' },
              ].map((slot, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-4 p-3 bg-light-green rounded-lg cursor-pointer"
                  onClick={() => {
                    if (slot.type === 'work') {
                      alert(`Opening: ${slot.title}`)
                    }
                  }}
                >
                  <div className="text-sm font-bold text-pale-sage w-16">{slot.time}</div>
                  <div className="flex-1">
                    <div className={`font-medium ${slot.type === 'work' ? 'text-forest-green' : 'text-text-secondary'}`}>
                      {slot.title}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    slot.type === 'work' ? 'bg-pale-sage' : 'bg-gray-300'
                  }`}></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-pale-sage">
            <div className="p-6 border-b border-light-green flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-forest-green">New Patient Registration</h2>
              <button 
                onClick={() => setShowNewPatientForm(false)}
                className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <span className="text-xl font-bold text-gray-600">×</span>
              </button>
            </div>

            <div className="p-6">
              <p className="text-text-secondary mb-4">This feature would open the patient registration form.</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowNewPatientForm(false)}
                  className="px-4 py-2 bg-warm-cream text-text-secondary rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
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
                    {modalAction === 'join' && 'Join Consultation'}
                    {modalAction === 'start' && 'Start Session'}
                  </h2>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <span className="text-xl font-bold text-gray-600">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-text-secondary mb-4">
                  {modalAction === 'join' && 'Join the current consultation session to continue patient care.'}
                  {modalAction === 'start' && 'Start a new consultation session with the selected patient.'}
                </p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-warm-cream text-text-secondary rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowModal(false)}
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