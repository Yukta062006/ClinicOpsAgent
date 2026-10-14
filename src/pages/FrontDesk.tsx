import React, { useState, useEffect } from 'react'
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  ClockIcon, 
  PrinterIcon,
  QrCodeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useData } from '../context/DataContext'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  registrationDate: string
  status: 'active' | 'inactive'
  email: string
  address: string
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctor: string
  time: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

export default function FrontDesk() {
  const { patients, addPatient, appointments, updateAppointment } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState<string | null>(null)
  
  // Form states
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '', age: 0, gender: 'M', phone: '', email: '', address: ''
  })
  const [appointment, setAppointment] = useState<Partial<Appointment>>({
    patientId: '', doctor: '', time: '', type: 'General Checkup', status: 'scheduled'
  })

  // Filter patients
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Generate random token
  const generateToken = () => {
    const token = Math.floor(100 + Math.random() * 900)
    return `#${token}`
  }

  const [currentToken, setCurrentToken] = useState(generateToken())

  // Handle new patient form submission
  const handleNewPatient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatient.name || !newPatient.phone) {
      alert('Please fill in required fields')
      return
    }

    const patient: Patient = {
      id: Date.now().toString(),
      name: newPatient.name!,
      age: newPatient.age || 0,
      gender: newPatient.gender || 'M',
      phone: newPatient.phone!,
      email: newPatient.email || '',
      address: newPatient.address || '',
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active',
      medicalHistory: [],
      allergies: [],
      insurance: 'Self Pay',
      primaryPhysician: 'Dr. John Doe'
    }

    addPatient(patient)
    setNewPatient({ name: '', age: 0, gender: 'M', phone: '', email: '', address: '' })
    setShowNewPatientForm(false)
    alert(`Patient ${patient.name} registered successfully!`)
  }

  // Handle appointment scheduling
  const handleScheduleAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment.patientId || !appointment.time) {
      alert('Please select patient and time')
      return
    }

    const patient = patients.find(p => p.id === appointment.patientId)
    if (!patient) return

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      patientId: appointment.patientId!,
      patientName: patient.name,
      doctorId: 'doc1',
      doctorName: 'Dr. John Doe',
      time: appointment.time!,
      type: appointment.type || 'General Checkup',
      status: 'scheduled',
      notes: ''
    }

    // In a real app, we would add to appointments state
    alert(`Appointment scheduled for ${patient.name} at ${appointment.time} with ${appointment.doctor}`)
    setShowAppointmentForm(false)
    setAppointment({ patientId: '', doctor: '', time: '', type: 'General Checkup', status: 'scheduled' })
  }

  // Print patient card
  const printPatientCard = (patientId: string) => {
    setShowPrintModal(patientId)
  }

  // Simulate QR scan
  const simulateQRScan = () => {
    const mockQRData = {
      patientId: '1',
      patientName: 'Alice Johnson',
      token: '#125',
      status: 'checked-in'
    }
    alert(`QR Scanned:\n\nPatient: ${mockQRData.patientName}\nToken: ${mockQRData.token}\nStatus: ${mockQRData.status}`)
    setShowQRScanner(false)
  }

  // Today's stats
  const todayStats = {
    totalPatients: patients.length,
    appointments: appointments.filter(a => a.status === 'scheduled').length,
    activePatients: patients.filter(p => p.status === 'active').length
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-green">Front Desk</h1>
          <p className="text-sm text-text-secondary">Patient registration and appointment management</p>
        </div>
        <button 
          onClick={() => setShowNewPatientForm(true)}
          className="flex items-center space-x-2 bg-forest-green text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-all shadow-card"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>New Patient</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Registration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Search */}
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-forest-green">Patient Search</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all text-sm"
                  placeholder="Search patients by name, phone, or email..."
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-light-green">
                    <th className="text-left py-2 px-4 text-xs font-medium text-forest-green">Patient</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-forest-green">Contact</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-forest-green">Registered</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-forest-green">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-green">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-light-green/30 transition-colors">
                      <td className="py-2 px-4">
                        <div className="font-medium text-text-primary">{patient.name}</div>
                        <div className="text-xs text-text-secondary">
                          {patient.age}y | {patient.gender}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-xs text-text-secondary">
                        {patient.phone}<br />
                        {patient.email}
                      </td>
                      <td className="py-2 px-4 text-xs text-text-secondary">{patient.registrationDate}</td>
                      <td className="py-2 px-4 text-right space-x-2">
                        <button 
                          onClick={() => printPatientCard(patient.id)}
                          className="p-1.5 text-text-secondary hover:bg-pale-sage hover:text-forest-green rounded transition-colors"
                          title="Print Card"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-serif font-bold text-forest-green mb-4">Token Generator</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-light-green text-forest-green w-20 h-20 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-3xl font-serif font-bold">{currentToken}</span>
                </div>
                <button
                  onClick={() => setCurrentToken(generateToken())}
                  className="flex items-center space-x-2 bg-forest-green text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Generate New</span>
                </button>
              </div>
              <p className="text-xs text-text-secondary">Generate queue tokens for walk-in patients</p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-serif font-bold text-forest-green mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowAppointmentForm(true)}
                  className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 hover:bg-light-green/50 hover:text-forest-green rounded-lg transition-colors text-sm"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Schedule Appointment</span>
                </button>
                <button 
                  onClick={() => setShowQRScanner(true)}
                  className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 hover:bg-light-green/50 hover:text-forest-green rounded-lg transition-colors text-sm"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </button>
                <button 
                  onClick={() => alert('Print reports feature coming soon!')}
                  className="w-full flex items-center space-x-3 p-2.5 bg-warm-cream/50 hover:bg-light-green/50 hover:text-forest-green rounded-lg transition-colors text-sm"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Print Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-forest-green">Today's Appointments</h2>
              <span className="text-xs text-text-secondary">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-2">
              {appointments.filter(a => a.status === 'scheduled').map((appointment) => (
                <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-warm-cream/50 rounded-lg hover:bg-light-green/50 hover:text-forest-green transition-colors group">
                  <div className="bg-forest-green text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary group-hover:text-forest-green">{appointment.patientName}</p>
                    <p className="text-xs text-text-secondary group-hover:text-forest-green/70">{appointment.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-forest-green group-hover:text-forest-green">{appointment.time}</p>
                    <p className="text-xs text-text-secondary group-hover:text-forest-green/70">{appointment.doctor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-5 shadow-card">
            <h3 className="text-base font-serif font-bold text-forest-green mb-4">Today's Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-light-green text-forest-green rounded-lg text-center">
                <div className="text-xl font-serif font-bold">{todayStats.appointments}</div>
                <div className="text-xs opacity-80">Appointments</div>
              </div>
              <div className="p-3 bg-forest-green text-white rounded-lg text-center">
                <div className="text-xl font-serif font-bold">{todayStats.totalPatients}</div>
                <div className="text-xs opacity-80">Total Patients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Patient Form Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-pale-sage">
            <div className="p-6 border-b border-light-green flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-forest-green">New Patient Registration</h2>
              <button 
                onClick={() => setShowNewPatientForm(false)}
                className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleNewPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newPatient.name || ''}
                    onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatient.age || ''}
                    onChange={e => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Gender</label>
                  <select
                    value={newPatient.gender || 'M'}
                    onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newPatient.phone || ''}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                  <input
                    type="email"
                    value={newPatient.email || ''}
                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Address</label>
                  <input
                    type="text"
                    value={newPatient.address || ''}
                    onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Register Patient
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="px-6 py-3 bg-warm-cream text-text-primary rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Scheduling Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-pale-sage">
            <div className="p-6 border-b border-light-green flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-forest-green">Schedule Appointment</h2>
              <button 
                onClick={() => setShowAppointmentForm(false)}
                className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleScheduleAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Patient *</label>
                <select
                  value={appointment.patientId || ''}
                  onChange={e => setAppointment({ ...appointment, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                  className="w-full px-3 py-2 border border-pale-sage rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Time *</label>
                <select
                  value={appointment.time || ''}
                  onChange={e => setAppointment({ ...appointment, time: e.target.value })}
                  className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                  required
                >
                  <option value="">Select Time</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Appointment Type</label>
                <select
                  value={appointment.type || 'General Checkup'}
                  onChange={e => setAppointment({ ...appointment, type: e.target.value })}
                  className="w-full px-3 py-2 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green"
                >
                  <option value="General Checkup">General Checkup</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Specialist Consultation">Specialist Consultation</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Schedule Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAppointmentForm(false)}
                  className="px-6 py-3 bg-warm-cream text-text-primary rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-pale-sage">
            <div className="p-6 border-b border-light-green flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-forest-green">Scan QR Code</h2>
              <button 
                onClick={() => setShowQRScanner(false)}
                className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden mb-4">
                <CameraIcon className="w-16 h-16 text-gray-600" />
                <p className="absolute bottom-4 text-white/80 text-sm">Camera access required</p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-text-secondary text-center">If camera is not available, use manual entry:</p>
                <button
                  onClick={simulateQRScan}
                  className="w-full bg-light-green text-forest-green py-2 rounded-lg font-medium hover:bg-pale-sage/50 transition-colors"
                >
                  Simulate QR Scan
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-light-green">
              <button
                onClick={() => setShowQRScanner(false)}
                className="w-full bg-warm-cream text-text-primary py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Patient Card Modal */}
      {showPrintModal && patients.find(p => p.id === showPrintModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-pale-sage">
            <div className="p-6 border-b border-light-green flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-forest-green">Print Patient Card</h2>
              <button 
                onClick={() => setShowPrintModal(null)}
                className="w-8 h-8 bg-warm-cream rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const patient = patients.find(p => p.id === showPrintModal)!
                return (
                  <div className="bg-pale-sage/20 p-6 rounded-lg border-2 border-pale-sage mb-6">
                    <div className="text-center">
                      <h3 className="font-serif font-bold text-2xl text-forest-green mb-2">ClinicOps</h3>
                      <p className="text-sm text-text-secondary mb-4">Patient Identification Card</p>
                      
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl font-bold text-forest-green border-2 border-pale-sage">
                          {patient.name.charAt(0)}
                        </div>
                      </div>
                      
                      <p className="text-xl font-bold text-text-primary mb-2">{patient.name}</p>
                      <p className="text-sm text-text-secondary mb-1">ID: {patient.id}</p>
                      <p className="text-sm text-text-secondary mb-1">DOB: {patient.age ? new Date().getFullYear() - patient.age + '-01-01' : 'N/A'}</p>
                      <p className="text-sm text-text-secondary mb-1">Phone: {patient.phone}</p>
                      
                      <div className="mt-4 flex justify-center">
                        <div className="bg-black p-2 rounded">
                          <div className="text-white text-xs text-center font-mono">
                            {patient.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <button
                onClick={() => {
                  setShowPrintModal(null)
                  window.print()
                }}
                className="w-full bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors mb-3"
              >
                Print Card
              </button>
              <button
                onClick={() => setShowPrintModal(null)}
                className="w-full bg-warm-cream text-text-primary py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}