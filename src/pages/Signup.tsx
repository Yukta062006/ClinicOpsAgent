import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  PhoneIcon,
  ChevronDownIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CalendarIcon,
  InformationCircleIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiAuth } from '../utils/api'
import { useData } from '../context/DataContext'

export default function Signup() {
  const [role, setRole] = useState<'Patient' | 'Front Desk' | 'Doctor'>('Patient')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Patient-specific ABDM / ABHA fields
  const [dob, setDob] = useState('2000-07-14')
  const [gender, setGender] = useState('Female')
  const [address, setAddress] = useState('123 Marine Drive, Mumbai 400020')
  const [emergencyContact, setEmergencyContact] = useState('+91 98201 99887')
  
  // ABHA Workflow state: 'existing' | 'generate'
  const [abhaMode, setAbhaMode] = useState<'existing' | 'generate'>('existing')
  const [abhaNumber, setAbhaNumber] = useState('91-4821-7290-3412')
  const [aadhaarNumber, setAadhaarNumber] = useState('XXXX-XXXX-4912')
  const [panNumber, setPanNumber] = useState('AAAPT4912K')
  const [abhaGeneratedNotice, setAbhaGeneratedNotice] = useState<string | null>(null)

  // Staff-specific fields
  const [department, setDepartment] = useState('Reception')
  const [specialty, setSpecialty] = useState('General Medicine')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()
  const { addPatient, setUser } = useData()

  // Format ABHA as XX-XXXX-XXXX-XXXX
  const handleAbhaChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 14)
    let formatted = ''
    if (raw.length > 0) formatted += raw.slice(0, 2)
    if (raw.length > 2) formatted += '-' + raw.slice(2, 6)
    if (raw.length > 6) formatted += '-' + raw.slice(6, 10)
    if (raw.length > 10) formatted += '-' + raw.slice(10, 14)
    setAbhaNumber(formatted || raw)
  }

  // Option B: Load authorized ABDM sandbox test identifier
  const handleGenerateDevAbha = () => {
    const sandboxAbhaSamples = [
      '14-8832-1094-5521',
      '91-4821-7290-3412',
      '22-4910-3382-7719',
      '14-5512-9901-2283'
    ]
    const chosen = sandboxAbhaSamples[Math.floor(Math.random() * sandboxAbhaSamples.length)]
    setAbhaNumber(chosen)
    setAbhaGeneratedNotice('Loaded authorized ABDM Sandbox Test ABHA for testing (ABDM / NDHM Sandbox Mode).')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please provide your full legal name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const normalizedRole = role === 'Front Desk' ? 'frontdesk' : role === 'Doctor' ? 'doctor' : 'patient'

    // Patient validations
    if (normalizedRole === 'patient') {
      const cleanAbha = abhaNumber.replace(/[^0-9]/g, '')
      if (cleanAbha.length !== 14) {
        setError('ABHA ID must be a valid 14-digit Ayushman Bharat Health Account number (format: XX-XXXX-XXXX-XXXX).')
        return
      }
      if (!phone.trim()) {
        setError('Please provide a registered mobile number for health records.')
        return
      }
    }

    setIsLoading(true)

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role: normalizedRole
      }

      if (normalizedRole === 'patient') {
        payload.date_of_birth = dob
        payload.gender = gender
        payload.address = address
        payload.emergency_contact = emergencyContact
        payload.abha_id = abhaNumber.trim()
        payload.aadhaar = aadhaarNumber.trim()
        payload.pan = panNumber.trim()
        payload.blood_type = 'O+'
      } else if (normalizedRole === 'doctor') {
        payload.specialty = specialty
        payload.department = department || 'Room 01'
      } else {
        payload.department = department || 'Reception'
      }

      const res = await apiAuth.register(payload)

      if (!res.success || !res.data) {
        setError(res.error || 'Registration failed. Please check details and try again.')
        setIsLoading(false)
        return
      }

      const returnedUser = res.data.user
      const returnedToken = res.data.token

      // Single real patient record connected immediately across workspace
      if (normalizedRole === 'patient') {
        addPatient({
          id: returnedUser.id,
          name: returnedUser.name,
          age: dob ? Math.max(1, new Date().getFullYear() - new Date(dob).getFullYear()) : 26,
          gender: gender || 'Other',
          phone: phone.trim() || '+91 98201 45892',
          email: returnedUser.email,
          address: address || 'Mumbai, Maharashtra',
          dateOfBirth: dob || '2000-07-14',
          registrationDate: new Date().toISOString().split('T')[0],
          status: 'active',
          abhaId: abhaNumber.trim(),
          aadhaar: aadhaarNumber.trim(),
          pan: panNumber.trim(),
          bloodGroup: 'O+',
          emergencyContact: emergencyContact,
          medicalHistory: ['Self-registered via ABHA digital portal'],
          allergies: ['No known drug allergies reported'],
          insurance: 'ABHA / PMJAY Health Record',
          primaryPhysician: 'Dr. Sarah Sharma'
        })
      }

      setUser(returnedUser)
      localStorage.setItem('clinicops_token', returnedToken)
      localStorage.setItem('clinicops_user', JSON.stringify(returnedUser))

      setSuccess('Registration verified and profile linked successfully! Opening your dedicated workspace...')

      setTimeout(() => {
        if (normalizedRole === 'doctor') navigate('/doctor-dashboard')
        else if (normalizedRole === 'frontdesk') navigate('/front-desk')
        else navigate('/patient-dashboard')
      }, 700)
    } catch (err: any) {
      setError(err.message || 'Connection error. Please check server status.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F8F4] relative flex items-center justify-center p-4 py-8 overflow-y-auto">
      {/* Botanical leaves framing: Top-Left Corner */}
      <div className="absolute top-0 left-0 w-80 md:w-96 h-80 md:h-96 pointer-events-none select-none z-0">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full text-emerald-800/30">
          <path d="M0,0 C60,20 120,60 140,140 C100,160 50,120 0,0 Z" fill="#2E5C46" opacity="0.4" />
          <path d="M20,0 C80,30 160,70 170,170 C120,180 70,130 20,0 Z" fill="#1B3E2F" opacity="0.3" />
        </svg>
      </div>

      {/* Botanical leaves framing: Bottom-Right Corner */}
      <div className="absolute bottom-0 right-0 w-80 md:w-96 h-80 md:h-96 pointer-events-none select-none z-0 rotate-180 scale-x-[-1]">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full text-emerald-800/30">
          <path d="M0,0 C60,20 120,60 140,140 C100,160 50,120 0,0 Z" fill="#2E5C46" opacity="0.4" />
          <path d="M20,0 C80,30 160,70 170,170 C120,180 70,130 20,0 Z" fill="#1B3E2F" opacity="0.3" />
        </svg>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-pale-sage/60 p-6 sm:p-9 relative z-10 my-4">
        {/* Top 'C' Emblem */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#DDE8E0] flex items-center justify-center shadow-xs text-forest-green">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-green tracking-tight">
            ClinicOps Registration
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Role-Based Clinical Operations & Ayushman Bharat Digital Health Integration
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-5 bg-[#EFF5EE] p-1.5 rounded-2xl flex items-center justify-between border border-[#E2ECE4]">
          {(['Patient', 'Front Desk', 'Doctor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r)
                setError('')
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                role === r
                  ? 'bg-white text-forest-green shadow-xs border border-pale-sage'
                  : 'text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              {r} Workspace
            </button>
          ))}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'Doctor' ? 'e.g. Dr. Rajesh Patil' : 'e.g. Yukta Ravindra Thakur'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yukta@clinicops.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row: Phone & Role Specific Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <PhoneIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98201 45892"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>

            {role === 'Patient' ? (
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Date of Birth *
                </label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                </div>
              </div>
            ) : role === 'Doctor' ? (
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Clinical Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Cardiology / General Medicine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Assigned Desk / Dept *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="OPD Main Reception"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PATIENT ONLY: ABHA & GOVERNMENT ID SECTION                */}
          {/* ========================================================= */}
          {role === 'Patient' && (
            <div className="pt-2 border-t border-[#E2ECE4] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <IdentificationIcon className="w-4 h-4 text-forest-green" />
                  <span className="text-xs font-bold text-forest-green uppercase tracking-wider">
                    Ayushman Bharat Health Account (ABHA)
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-[#EFF5EE] p-0.5 rounded-lg border border-[#E2ECE4]">
                  <button
                    type="button"
                    onClick={() => setAbhaMode('existing')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                      abhaMode === 'existing' ? 'bg-white text-forest-green shadow-2xs' : 'text-[#5A6D62]'
                    }`}
                  >
                    Existing ABHA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbhaMode('generate')
                      handleGenerateDevAbha()
                    }}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                      abhaMode === 'generate' ? 'bg-white text-forest-green shadow-2xs' : 'text-[#5A6D62]'
                    }`}
                  >
                    Register ABHA (Dev)
                  </button>
                </div>
              </div>

              {/* ABHA Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-800">
                    ABHA ID / ABHA Number (14 Digits) *
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.2 rounded-md">
                    National Health Authority Validated
                  </span>
                </div>
                <div className="relative">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={abhaNumber}
                    onChange={(e) => handleAbhaChange(e.target.value)}
                    placeholder="XX-XXXX-XXXX-XXXX"
                    className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                  {abhaMode === 'generate' && (
                    <button
                      type="button"
                      onClick={handleGenerateDevAbha}
                      className="absolute right-2 top-1.5 px-2.5 py-1 text-[10px] font-bold text-forest-green bg-[#EFF5EE] hover:bg-[#E2ECE4] rounded-lg transition-colors"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
                {abhaGeneratedNotice && (
                  <p className="text-[11px] text-[#5A6D62] mt-1 italic flex items-center gap-1">
                    <InformationCircleIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{abhaGeneratedNotice}</span>
                  </p>
                )}
              </div>

              {/* Aadhaar (Masked), PAN, and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="XXXX-XXXX-4912"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs font-mono text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="AAAPT4912K"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs font-mono uppercase text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Residential Address
                  </label>
                  <div className="relative">
                    <MapPinIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Marine Drive, Mumbai"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98201 99887 (Kin)"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Password *
              </label>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 rounded-xl bg-forest-green text-white font-semibold text-xs tracking-wide uppercase hover:bg-forest-green/90 transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? 'Verifying & Registering...' : `Complete ${role} Registration`}
          </button>
        </form>

        <p className="text-center text-xs text-stone-600 mt-4">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-forest-green hover:underline">
            Sign In with Email or ABHA
          </Link>
        </p>
      </div>
    </div>
  )
}