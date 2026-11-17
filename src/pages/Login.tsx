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
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useData } from '../context/DataContext'
import { apiAbha, AbhaStatus } from '../utils/api'

type WorkspaceRole = 'patient' | 'doctor' | 'frontdesk'

function workspaceFor(role: string): { path: string; label: string } {
  const normalized = (role || 'patient').toLowerCase().replace(/[_\s-]/g, '')
  if (normalized.includes('doc')) return { path: '/doctor/dashboard', label: 'Doctor' }
  if (normalized.includes('front') || normalized.includes('recept')) return { path: '/frontdesk/dashboard', label: 'Front Desk' }
  return { path: '/patient/dashboard', label: 'Patient' }
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('patient')
  const [loginMethod, setLoginMethod] = useState<'email' | 'abha'>('email')
  
  const [email, setEmail] = useState('')
  const [abhaNumber, setAbhaNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ABHA sign-in is a two-step ABDM flow: request an Aadhaar OTP, then verify
  // it. No ClinicOps password is involved and no session is created until
  // ABDM confirms the OTP.
  const [abhaStep, setAbhaStep] = useState<'identify' | 'verify'>('identify')
  const [abhaChallengeId, setAbhaChallengeId] = useState('')
  const [abhaOtp, setAbhaOtp] = useState('')
  const [maskedAbha, setMaskedAbha] = useState('')
  const [abhaStatus, setAbhaStatus] = useState<AbhaStatus | null>(null)
  const [notLinkedAbha, setNotLinkedAbha] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const navigate = useNavigate()
  const { signIn, requestAbhaLoginOtp, signInWithAbha, authStatus, user } = useData()

  // Redirect an already-authenticated visitor to the workspace that the
  // backend says they own. The role always comes from the server response.
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return
    navigate(workspaceFor(user.role).path, { replace: true })
  }, [authStatus, user, navigate])

  const handleAbhaChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 14)
    let formatted = ''
    if (raw.length > 0) formatted += raw.slice(0, 2)
    if (raw.length > 2) formatted += '-' + raw.slice(2, 6)
    if (raw.length > 6) formatted += '-' + raw.slice(6, 10)
    if (raw.length > 10) formatted += '-' + raw.slice(10, 14)
    setAbhaNumber(formatted || raw)
  }

  useEffect(() => {
    let cancelled = false
    apiAbha.status().then((response) => {
      if (!cancelled && response.success && response.data) setAbhaStatus(response.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const resetAbhaFlow = () => {
    setAbhaStep('identify')
    setAbhaChallengeId('')
    setAbhaOtp('')
    setMaskedAbha('')
    setNotLinkedAbha('')
    setResendCooldown(0)
    setResendCount(0)
    setError('')
    setSuccessMsg('')
  }

  const handleRequestAbhaOtp = async () => {
    setError('')
    setSuccessMsg('')
    setNotLinkedAbha('')

    if (abhaNumber.replace(/[^0-9]/g, '').length !== 14) {
      setError('Please enter a valid 14-digit ABHA number (format: XX-XXXX-XXXX-XXXX).')
      return
    }

    setIsLoading(true)
    try {
      const response = await requestAbhaLoginOtp(abhaNumber.trim())
      if (!response.success || !response.data) {
        setError(response.error || 'ABDM could not send an OTP for this ABHA number.')
        return
      }
      setAbhaChallengeId(response.data.challengeId)
      setMaskedAbha(response.data.maskedAbha || abhaNumber.trim())
      setAbhaStep('verify')
      setAbhaOtp('')
      setResendCooldown(60)
      setResendCount(0)
      setSuccessMsg(response.data.message || 'An ABDM OTP was requested. Enter the 6-digit code to continue.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendAbhaOtp = async () => {
    if (resendCooldown > 0 || resendCount >= 3 || !abhaChallengeId) return
    setIsLoading(true)
    setError('')
    try {
      const response = await apiAbha.resendOtp(abhaChallengeId)
      if (response.success && response.data) {
        setResendCooldown(60)
        setResendCount(response.data.resendCount)
        setSuccessMsg(response.data.message || 'A fresh OTP has been sent to your registered mobile.')
      } else {
        setError(response.error || 'Failed to resend OTP.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAbhaOtp = async () => {
    setError('')
    setSuccessMsg('')
    setNotLinkedAbha('')

    if (!/^\d{6}$/.test(abhaOtp.trim())) {
      setError('Enter the 6-digit OTP sent by ABDM.')
      return
    }

    setIsLoading(true)
    try {
      const result = await signInWithAbha(abhaChallengeId, abhaOtp.trim())
      if (!result.success || !result.user) {
        if (result.code === 'ABHA_NOT_LINKED') {
          setNotLinkedAbha(abhaNumber.replace(/[^0-9]/g, ''))
        }
        setError(result.error || 'ABDM did not confirm this OTP. Please request a new code.')
        return
      }

      const workspace = workspaceFor(result.user.role)
      setSuccessMsg(`ABDM verified ${maskedAbha}. Opening your ${workspace.label} workspace…`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const isAbha = selectedRole === 'patient' && loginMethod === 'abha'
    if (isAbha) {
      if (abhaStep === 'identify') await handleRequestAbhaOtp()
      else await handleVerifyAbhaOtp()
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your account password.')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn(email.trim().toLowerCase(), password)

      if (!result.success || !result.user) {
        setError(result.error || 'Unable to sign in. Please try again.')
        return
      }

      const workspace = workspaceFor(result.user.role)
      const requestedWorkspace = selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'frontdesk' ? 'Front Desk' : 'Patient'

      setSuccessMsg(
        workspace.label === requestedWorkspace
          ? `Welcome, ${result.user.name}! Opening your ${workspace.label} workspace…`
          : `This account belongs to the ${workspace.label} workspace. Opening it now…`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoAccount = (role: WorkspaceRole) => {
    setSelectedRole(role)
    setLoginMethod('email')
    setError('')
    resetAbhaFlow()
    if (role === 'patient') {
      setEmail('patient@clinicops.com')
      setAbhaNumber('')
    } else if (role === 'doctor') {
      setEmail('doctor@clinicops.com')
      setAbhaNumber('')
    } else {
      setEmail('frontdesk@clinicops.com')
      setAbhaNumber('')
    }
    // Passwords are never pre-filled or stored in the frontend bundle.
    setPassword('')
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
              onClick={() => {
                setSelectedRole('patient')
                setError('')
              }}
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
              onClick={() => {
                setSelectedRole('frontdesk')
                setLoginMethod('email')
                setError('')
              }}
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
              onClick={() => {
                setSelectedRole('doctor')
                setLoginMethod('email')
                setError('')
              }}
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
                resetAbhaFlow()
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
                resetAbhaFlow()
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

        {notLinkedAbha && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
            <p className="font-semibold">ABDM verified this ABHA, but it is not linked to a ClinicOps patient account yet.</p>
            <Link
              to={`/signup?abha=${notLinkedAbha}`}
              className="inline-block px-3 py-1.5 rounded-lg bg-forest-green text-white text-[11px] font-bold"
            >
              Create a patient account and link it
            </Link>
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
            <>
              {abhaStatus && !abhaStatus.configured && abhaStatus.environment === 'production' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1">Production ABDM verification is not configured</p>
                  <p className="mb-1">
                    This server is missing <span className="font-mono">{abhaStatus.missing.join(', ')}</span>.
                  </p>
                </div>
              )}

              {abhaStatus?.configured && (
                <div className="flex items-center justify-between text-[10px] text-stone-500">
                  <span>Identity provider: ABDM (ABHA)</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      abhaStatus.environment === 'production'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {abhaStatus.environment === 'production' ? 'Production' : 'Sandbox'}
                  </span>
                </div>
              )}

              {abhaStep === 'identify' ? (
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
                      inputMode="numeric"
                      autoComplete="off"
                      value={abhaNumber}
                      onChange={(e) => handleAbhaChange(e.target.value)}
                      placeholder="XX-XXXX-XXXX-XXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-[#5A6D62] mt-1.5 leading-relaxed">
                    ABDM sends an Aadhaar OTP to the mobile number linked with this ABHA. A ClinicOps
                    password is not used for ABHA sign-in.
                    {abhaStatus?.environment === 'sandbox' && (
                      <span className="block mt-1 text-emerald-800 font-semibold">
                        💡 Sandbox active: use OTP <span className="font-mono font-bold">123456</span> to verify.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#EFF5EE] border border-[#E2ECE4] text-xs">
                    <p className="font-bold text-[#1B3E2F]">Verify the OTP sent by ABDM</p>
                    <p className="text-[11px] text-[#5A6D62] mt-0.5 leading-relaxed">
                      Requested for <span className="font-mono font-bold">{maskedAbha}</span>.
                    </p>
                    {abhaStatus?.environment === 'sandbox' ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-[11px] leading-relaxed space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                          <span>📱 Sandbox Mode Active</span>
                        </p>
                        <p>
                          No physical SMS is sent to your phone in sandbox testing. Please enter test OTP:
                        </p>
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setAbhaOtp('123456')}
                            className="font-mono font-bold text-xs bg-white px-2 py-1 rounded-md border border-emerald-400 text-emerald-800 hover:bg-emerald-50 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>123456</span>
                            <span className="text-[10px] font-sans text-emerald-600 font-normal">(click to autofill)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#5A6D62] mt-0.5 leading-relaxed">
                        The code is sent to the mobile number registered against this ABHA&apos;s Aadhaar.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                      6-digit ABDM OTP *
                    </label>
                    <div className="relative">
                      <ShieldCheckIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={abhaOtp}
                        onChange={(e) => setAbhaOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono tracking-[0.4em] text-sm text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#5A6D62]">
                        {resendCooldown > 0 ? (
                          `Resend OTP in ${resendCooldown}s`
                        ) : resendCount >= 3 ? (
                          <span className="text-amber-800 font-semibold">Resend limit reached (3/3)</span>
                        ) : (
                          `Resends left: ${3 - resendCount}`
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendAbhaOtp}
                        disabled={isLoading || resendCooldown > 0 || resendCount >= 3}
                        className="font-semibold text-forest-green hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Resend ABDM OTP
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetAbhaFlow}
                    className="text-[11px] text-forest-green font-semibold hover:underline"
                  >
                    Use a different ABHA number
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
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
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-forest-green text-white font-semibold text-xs tracking-wider uppercase hover:bg-forest-green/90 transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading
              ? loginMethod === 'abha'
                ? abhaStep === 'identify'
                  ? 'Requesting ABDM OTP…'
                  : 'Verifying with ABDM…'
                : 'Authenticating...'
              : loginMethod === 'abha'
                ? abhaStep === 'identify'
                  ? 'Send ABDM OTP'
                  : 'Verify OTP & Sign In'
                : 'Sign In'}
          </button>
          {selectedRole === 'patient' && loginMethod === 'abha' ? (
            <p className="text-center text-[10px] text-stone-500 leading-relaxed">
              ClinicOps does not store your Aadhaar number or ABDM OTP. They are used only to
              complete this verification with ABDM.
            </p>
          ) : (
            <p className="text-center text-[10px] text-stone-500">
              Your workspace is chosen by the role stored on your account.
            </p>
          )}
        </form>

        <p className="text-center text-xs text-stone-600 mt-5">
          New patient?{' '}
          <Link to="/signup" className="font-bold text-forest-green hover:underline">
            Create a patient account
          </Link>
        </p>

        {/* Local development accounts — never shown in a production build */}
        {import.meta.env.DEV && (
          <div className="mt-5 p-3 rounded-2xl bg-[#EDF4EE] border border-pale-sage text-[11px] text-stone-700 space-y-1">
            <p className="font-bold text-forest-green uppercase tracking-wider text-[10px] mb-1">
              Local demo accounts (development only)
            </p>
            <p className="text-[10px] text-stone-500 mb-1.5">
              Fills the sign-in form email for an account that exists in the local
              database. Enter your development account password to log in.
            </p>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fillDemoAccount('patient')}
                className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
              >
                <span><strong>Patient:</strong> Yukta Ravindra Thakur</span>
                <span className="text-forest-green font-semibold">patient@clinicops.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('frontdesk')}
                className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
              >
                <span><strong>Front Desk:</strong> Olivia Martin</span>
                <span className="text-forest-green font-semibold">frontdesk@clinicops.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('doctor')}
                className="text-left py-1 px-2 rounded-lg hover:bg-white transition-colors flex justify-between"
              >
                <span><strong>Doctor:</strong> Dr. Elena Cooper</span>
                <span className="text-forest-green font-semibold">doctor@clinicops.com</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
