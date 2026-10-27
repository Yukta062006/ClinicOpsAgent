import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  EnvelopeIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  IdentificationIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { apiAuth } from '../utils/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [resetMethod, setResetMethod] = useState<'email' | 'abha'>('email')
  
  // Form State
  const [email, setEmail] = useState('')
  const [abhaId, setAbhaId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  // ABHA flow step: 1 = Enter ABHA, 2 = Verify OTP & Set New Password
  const [abhaStep, setAbhaStep] = useState<1 | 2>(1)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Format 14-digit ABHA number
  const formatAbha = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 14)
    const parts = []
    if (digits.length > 0) parts.push(digits.slice(0, 2))
    if (digits.length > 2) parts.push(digits.slice(2, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 10))
    if (digits.length > 10) parts.push(digits.slice(10, 14))
    return parts.join('-')
  }

  const handleAbhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAbhaId(formatAbha(e.target.value))
  }

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = abhaId.replace(/[^0-9]/g, '')
    if (digits.length !== 14) {
      setError('Please provide a complete 14-digit ABHA Number (XX-XXXX-XXXX-XXXX).')
      return
    }
    setError('')
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setAbhaStep(2)
      setOtp('123456') // Pre-fill test OTP for demo convenience
    }, 600)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (resetMethod === 'email') {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid registered email address.')
        return
      }
    } else {
      const digits = abhaId.replace(/[^0-9]/g, '')
      if (digits.length !== 14) {
        setError('Please enter a valid 14-digit ABHA ID.')
        return
      }
      if (!otp.trim()) {
        setError('Please enter the 6-digit OTP sent to your Aadhaar-linked mobile.')
        return
      }
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    setIsLoading(true)

    try {
      const identifier = resetMethod === 'email' ? email.trim() : abhaId.trim()
      const isAbha = resetMethod === 'abha'
      
      const res = await apiAuth.resetPassword(identifier, newPassword, isAbha)
      
      if (res.success && res.data) {
        setSuccessMsg(res.data.message || 'Your password has been successfully reset.')
        setIsSuccess(true)
      } else {
        setError(res.error || 'Failed to reset password. Please check your details and try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border border-[#E2ECE4] w-full max-w-md p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-[#EFF5EE] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#1B3E2F]">
            <CheckCircleIcon className="w-8 h-8 text-[#2D5A43]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1B3E2F] mb-2">Password Reset Complete</h2>
          <p className="text-xs text-[#5A6D62] mb-6 leading-relaxed">
            {successMsg}
          </p>
          <div className="p-3.5 bg-[#EFF5EE] border border-[#D5E4D8] rounded-2xl text-xs text-[#1B3E2F] mb-6 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-[#2D5A43]" />
              Account Security Updated
            </p>
            <p className="text-[11px] text-[#5A6D62]">
              You can now log in using your updated password from any role workspace.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-xs hover:bg-[#143024] transition-all cursor-pointer shadow-sm"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E2ECE4] w-full max-w-md p-8 sm:p-10">
        <Link
          to="/login"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#5A6D62] hover:text-[#1B3E2F] mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#1B3E2F] rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-sm">
            <KeyIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1B3E2F]">Account Recovery</h1>
          <p className="text-xs text-[#5A6D62] mt-1.5 leading-relaxed">
            Reset credentials for your ClinicOps or Ayushman Bharat health account.
          </p>
        </div>

        {/* Method Switch: Email vs ABHA */}
        <div className="flex bg-[#EFF5EE] p-1 rounded-2xl mb-6 border border-[#E2ECE4]">
          <button
            type="button"
            onClick={() => {
              setResetMethod('email')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              resetMethod === 'email'
                ? 'bg-white text-[#1B3E2F] shadow-2xs'
                : 'text-[#5A6D62] hover:text-[#1B3E2F]'
            }`}
          >
            Reset via Email
          </button>
          <button
            type="button"
            onClick={() => {
              setResetMethod('abha')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              resetMethod === 'abha'
                ? 'bg-white text-[#1B3E2F] shadow-2xs'
                : 'text-[#5A6D62] hover:text-[#1B3E2F]'
            }`}
          >
            <span>ABHA (ABDM)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-mono">14D</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Email Recovery Flow */}
        {resetMethod === 'email' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829489]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                  placeholder="e.g. patient@clinicops.com"
                  required
                />
              </div>
              <p className="text-[10px] text-[#829489] mt-1">
                Works for Patient, Front Desk, or Doctor accounts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                placeholder="Re-type new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-xs hover:bg-[#143024] transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Reset Account Password</span>
              )}
            </button>
          </form>
        )}

        {/* ABHA 14-Digit Recovery Flow */}
        {resetMethod === 'abha' && (
          <div>
            {abhaStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider">
                      14-Digit ABHA Number
                    </label>
                    <button
                      type="button"
                      onClick={() => setAbhaId('91-4821-7290-3412')}
                      className="text-[10px] font-bold text-[#2D5A43] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <SparklesIcon className="w-3 h-3" />
                      Fill Test ABHA
                    </button>
                  </div>
                  <div className="relative">
                    <IdentificationIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829489]" />
                    <input
                      type="text"
                      value={abhaId}
                      onChange={handleAbhaChange}
                      placeholder="91-4821-7290-3412"
                      maxLength={17}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#829489] mt-1 leading-relaxed">
                    We will send an OTP simulation to your ABDM Aadhaar-registered mobile (+91 98*** **887).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-xs hover:bg-[#143024] transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Send Verification OTP</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3 bg-[#EFF5EE] border border-[#D5E4D8] rounded-xl text-xs text-[#1B3E2F] flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-[#5A6D62] block">ABHA Number:</span>
                    <span className="font-mono font-bold">{abhaId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAbhaStep(1)}
                    className="text-[10px] font-bold text-[#2D5A43] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                    required
                  />
                  <p className="text-[10px] text-emerald-700 mt-1 text-center font-medium">
                    (Sandbox test OTP: 123456)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                    placeholder="Re-type new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-xs hover:bg-[#143024] transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Set New Password & Recover</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}