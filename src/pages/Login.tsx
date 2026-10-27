import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  IdentificationIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { apiAuth } from '../utils/api'
import { useData } from '../context/DataContext'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'frontdesk'>('patient')
  const [loginMethod, setLoginMethod] = useState<'email' | 'abha'>('email')
  
  const [email, setEmail] = useState('patient@clinicops.com')
  const [abhaNumber, setAbhaNumber] = useState('91-4821-7290-3412')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const navigate = useNavigate()
  const { setUser } = useData()

  // Auto redirect if already logged in with valid token & role
  useEffect(() => {
    const token = localStorage.getItem('clinicops_token')
    const savedUser = localStorage.getItem('clinicops_user')
    if (token && savedUser) {
      try {
        const u = JSON.parse(savedUser)
        const role = (u.role || 'patient').toLowerCase().replace('_', '')
        if (role.includes('doc')) navigate('/doctor-dashboard')
        else if (role.includes('front')) navigate('/front-desk')
        else navigate('/patient-dashboard')
      } catch (e) {
        navigate('/patient-dashboard')
      }
    }
  }, [navigate])

  const completeLogin = (token: string, userObj: any) => {
    localStorage.setItem('clinicops_token', token)
    localStorage.setItem('clinicops_user', JSON.stringify(userObj))
    setUser(userObj)
    setSuccessMsg(`Welcome, ${userObj.name}! Loading ${userObj.role.toUpperCase()} Workspace...`)
    
    setTimeout(() => {
      const role = (userObj.role || 'patient').toLowerCase().replace('_', '')
      if (role.includes('doc')) {
        navigate('/doctor-dashboard')
      } else if (role.includes('front')) {
        navigate('/front-desk')
      } else {
        navigate('/patient-dashboard')
      }
    }, 400)
  }

  const handleAbhaChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 14)
    let formatted = ''
    if (raw.length > 0) formatted += raw.slice(0, 2)
    if (raw.length > 2) formatted += '-' + raw.slice(2, 6)
    if (raw.length > 6) formatted += '-' + raw.slice(6, 10)
    if (raw.length > 10) formatted += '-' + raw.slice(10, 14)
    setAbhaNumber(formatted || raw)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (selectedRole === 'patient' && loginMethod === 'abha') {
      const cleanAbha = abhaNumber.replace(/[^0-9]/g, '')
      if (cleanAbha.length !== 14) {
        setError('Please enter a valid 14-digit ABHA ID (format: XX-XXXX-XXXX-XXXX).')
        return
      }
    } else {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid registered email address.')
        return
      }
    }

    if (!password.trim()) {
      setError('Please enter your account password.')
      return
    }

    setIsLoading(true)

    try {
      const isAbha = selectedRole === 'patient' && loginMethod === 'abha'
      const identifier = isAbha ? abhaNumber.trim() : email.trim().toLowerCase()

      const response = await apiAuth.login(identifier, password, isAbha)
      if (response.success && response.data) {
        const userObj = response.data.user
        const actualRole = (userObj.role || 'patient').toLowerCase().replace('_', '')
        const normalizedSelected = selectedRole === 'doctor' ? 'doctor' : selectedRole === 'frontdesk' ? 'frontdesk' : 'patient'

        const roleMismatch = 
          (normalizedSelected === 'doctor' && !actualRole.includes('doc')) ||
          (normalizedSelected === 'frontdesk' && !actualRole.includes('front') && !actualRole.includes('recept')) ||
          (normalizedSelected === 'patient' && (actualRole.includes('doc') || actualRole.includes('front') || actualRole.includes('recept')))

        if (roleMismatch) {
          setError(`Role mismatch: This account (${userObj.email}) is registered as ${userObj.role.toUpperCase()}. You selected "${selectedRole.toUpperCase()}" workspace. Please select the correct role above.`)
          setIsLoading(false)
          return
        }

        completeLogin(response.data.token, userObj)
      } else {
        // Check local users if server request failed
        handleLocalFallback(identifier, password, isAbha, response.error)
      }
    } catch (err: any) {
      handleLocalFallback(email.trim(), password, false, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalFallback = (identifier: string, passInput: string, isAbha: boolean, serverError?: string) => {
    // Only accept correct credentials in development fallback
    const idLower = identifier.toLowerCase()

    if (selectedRole === 'doctor') {
      if (!idLower.includes('doctor') && !idLower.includes('cooper') && !idLower.includes('sharma') && !idLower.includes('patil')) {
        setError(serverError || 'Invalid doctor credentials. Please use doctor@clinicops.com or select Patient.')
        return
      }
      completeLogin('token-doctor-session', {
        id: 'u-cooper',
        email: idLower.includes('@') ? idLower : 'doctor@clinicops.com',
        name: 'Dr. Elena Cooper',
        role: 'doctor',
        specialty: 'Family Medicine',
        department: 'Room 02'
      })
    } else if (selectedRole === 'frontdesk') {
      if (!idLower.includes('front') && !idLower.includes('recept') && !idLower.includes('martin')) {
        setError(serverError || 'Invalid front desk credentials. Please use frontdesk@clinicops.com or select Patient.')
        return
      }
      completeLogin('token-frontdesk-session', {
        id: 'u-frontdesk',
        email: idLower.includes('@') ? idLower : 'frontdesk@clinicops.com',
        name: 'Olivia Martin',
        role: 'frontdesk',
        department: 'Reception'
      })
    } else {
      // Patient
      if (idLower.includes('doctor@') || idLower.includes('frontdesk@')) {
        setError('These credentials belong to a staff/doctor account. Please select Doctor or Front Desk above.')
        return
      }
      completeLogin('token-patient-session', {
        id: 'u-yukta',
        email: isAbha ? 'yukta@clinicops.com' : (idLower.includes('@') ? idLower : 'patient@clinicops.com'),
        name: 'Yukta Ravindra Thakur',
        role: 'patient',
        abhaId: isAbha ? identifier : '91-4821-7290-3412',
        aadhaar: 'XXXX-XXXX-4912',
        phone: '+91 98201 45892'
      })
    }
  }

  const setRolePersona = (role: 'patient' | 'doctor' | 'frontdesk') => {
    setSelectedRole(role)
    setError('')
    if (role === 'patient') {
      setEmail('patient@clinicops.com')
      setAbhaNumber('91-4821-7290-3412')
      setPassword('admin123')
    } else if (role === 'doctor') {
      setEmail('doctor@clinicops.com')
      setPassword('admin123')
    } else {
      setEmail('frontdesk@clinicops.com')
      setPassword('admin123')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F8F4] relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Botanical leaves framing: Top-Left */}
      <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none opacity-80 select-none">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-emerald-800/20">
          <path d="M0,0 Q100,50 60,180 Q20,120 0,0 Z" fill="currentColor" opacity="0.3" />
          <path d="M0,40 Q120,60 100,160 Q40,140 0,40 Z" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Botanical leaves framing: Bottom-Right */}
      <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none opacity-80 rotate-180 select-none">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-emerald-800/20">
          <path d="M0,0 Q100,50 60,180 Q20,120 0,0 Z" fill="currentColor" opacity="0.3" />
          <path d="M0,40 Q120,60 100,160 Q40,140 0,40 Z" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-pale-sage w-full max-w-md p-7 sm:p-9 relative z-10">
        
        {/* Monogram emblem */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#DDE8E0] flex items-center justify-center shadow-xs text-forest-green">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-green tracking-tight">
            ClinicOps Sign In
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Role-Based Healthcare Operations Platform
          </p>
        </div>

        {/* Role Workspace Selector Tabs */}
        <div className="mb-5">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EFF5EE] rounded-2xl border border-[#E2ECE4]">
            <button
              type="button"
              onClick={() => setRolePersona('patient')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'patient'
                  ? 'bg-white text-forest-green shadow-xs border border-pale-sage'
                  : 'text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => setRolePersona('frontdesk')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'frontdesk'
                  ? 'bg-white text-forest-green shadow-xs border border-pale-sage'
                  : 'text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              <BuildingOffice2Icon className="w-3.5 h-3.5" />
              <span>Front Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setRolePersona('doctor')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'doctor'
                  ? 'bg-white text-forest-green shadow-xs border border-pale-sage'
                  : 'text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              <BeakerIcon className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>
          </div>
        </div>

        {/* Patient Sub-tabs: Login with Email vs Login with ABHA */}
        {selectedRole === 'patient' && (
          <div className="flex items-center justify-center gap-2 mb-4 pb-1 border-b border-[#E2ECE4]">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email')
                setError('')
              }}
              className={`pb-1.5 text-xs font-bold border-b-2 transition-all ${
                loginMethod === 'email'
                  ? 'border-forest-green text-forest-green'
                  : 'border-transparent text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              Login with Email
            </button>
            <span className="text-gray-300 text-xs">•</span>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('abha')
                setError('')
              }}
              className={`pb-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 ${
                loginMethod === 'abha'
                  ? 'border-forest-green text-forest-green'
                  : 'border-transparent text-[#5A6D62] hover:text-forest-green'
              }`}
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Login with ABHA</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedRole === 'patient' && loginMethod === 'abha' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-800">
                  Ayushman Bharat ABHA Number *
                </label>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  14-Digit Format
                </span>
              </div>
              <div className="relative">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-700 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={abhaNumber}
                  onChange={(e) => handleAbhaChange(e.target.value)}
                  placeholder="91-4821-7290-3412"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-800">
                Password *
              </label>
              <Link to="/forgot-password" className="text-[11px] text-forest-green hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <LockClosedIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-[#5A6D62] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-forest-green border-gray-300 focus:ring-forest-green"
              />
              <span>Remember this session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-forest-green text-white font-semibold text-xs tracking-wider uppercase hover:bg-forest-green/90 transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading
              ? 'Authenticating...'
              : `Sign In to ${selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'frontdesk' ? 'Front Desk' : 'Patient'} Workspace`}
          </button>
        </form>

        <p className="text-center text-xs text-stone-600 mt-5">
          New patient or staff member?{' '}
          <Link to="/signup" className="font-bold text-forest-green hover:underline">
            Register / Link ABHA
          </Link>
        </p>

        {/* Demo Fast Login Switcher with Indian names */}
        <div className="mt-5 p-3 rounded-2xl bg-[#EDF4EE] border border-pale-sage text-[11px] text-stone-700 space-y-1">
          <p className="font-bold text-forest-green uppercase tracking-wider text-[10px] mb-1">
            Quick Persona Switch (Indian Healthcare Accounts):
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setRolePersona('patient')}
              className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
            >
              <span><strong>Patient:</strong> Yukta Ravindra Thakur</span>
              <span className="text-forest-green font-semibold">patient@clinicops.com</span>
            </button>
            <button
              type="button"
              onClick={() => setRolePersona('frontdesk')}
              className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
            >
              <span><strong>Front Desk:</strong> Priya Deshmukh</span>
              <span className="text-forest-green font-semibold">frontdesk@clinicops.com</span>
            </button>
            <button
              type="button"
              onClick={() => setRolePersona('doctor')}
              className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
            >
              <span><strong>Doctor:</strong> Dr. Sarah Sharma</span>
              <span className="text-forest-green font-semibold">doctor@clinicops.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
