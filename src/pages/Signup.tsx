import React, { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  MapPinIcon,
  CalendarIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useData } from '../context/DataContext'
import { apiAbha, AbhaStatus } from '../utils/api'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Patient profile fields
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('Female')
  const [address, setAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')

  // ABHA is optional. It is only marked verified after ABDM confirms an OTP
  // and the server issues a short-lived verification proof.
  const [abhaNumber, setAbhaNumber] = useState('')
  const [abhaStatus, setAbhaStatus] = useState<AbhaStatus | null>(null)
  const [abhaAction, setAbhaAction] = useState<'existing' | 'create' | null>(null)
  const [abhaStep, setAbhaStep] = useState<'input' | 'otp' | 'verified'>('input')
  const [abhaChallengeId, setAbhaChallengeId] = useState('')
  const [abhaOtp, setAbhaOtp] = useState('')
  const [maskedAbha, setMaskedAbha] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [abhaConsent, setAbhaConsent] = useState(false)
  const [abhaVerificationToken, setAbhaVerificationToken] = useState('')
  const [verifiedAbhaName, setVerifiedAbhaName] = useState('')
  const [abhaAddress, setAbhaAddress] = useState('')
  const [abhaBusy, setAbhaBusy] = useState(false)
  const [abhaError, setAbhaError] = useState('')
  const [abhaInfo, setAbhaInfo] = useState('')
  const [consent, setConsent] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useData()

  const formatAbha = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 14)
    let formatted = ''
    if (raw.length > 0) formatted += raw.slice(0, 2)
    if (raw.length > 2) formatted += '-' + raw.slice(2, 6)
    if (raw.length > 6) formatted += '-' + raw.slice(6, 10)
    if (raw.length > 10) formatted += '-' + raw.slice(10, 14)
    return formatted || raw
  }

  // Format ABHA as XX-XXXX-XXXX-XXXX
  const handleAbhaChange = (val: string) => {
    setAbhaNumber(formatAbha(val))
  }

  useEffect(() => {
    let cancelled = false
    apiAbha.status().then((response) => {
      if (!cancelled && response.success && response.data) setAbhaStatus(response.data)
    })

    const prefill = searchParams.get('abha')?.replace(/[^0-9]/g, '').slice(0, 14) || ''
    if (prefill.length === 14) {
      setAbhaNumber(formatAbha(prefill))
      setAbhaAction('existing')
    }

    return () => {
      cancelled = true
    }
    // The verification status and prefill are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetAbhaFlow = () => {
    setAbhaAction(null)
    setAbhaStep('input')
    setAbhaChallengeId('')
    setAbhaOtp('')
    setMaskedAbha('')
    setAadhaarNumber('')
    setAbhaConsent(false)
    setAbhaError('')
    setAbhaInfo('')
  }

  const removeAbhaVerification = () => {
    setAbhaVerificationToken('')
    setVerifiedAbhaName('')
    setAbhaAddress('')
    setAbhaStep('input')
    setAbhaAction(null)
    setAbhaError('')
    setAbhaInfo('')
  }

  const requestAbhaOtp = async () => {
    setAbhaError('')
    setAbhaInfo('')

    if (abhaStatus && !abhaStatus.configured) {
      setAbhaError(
        `ABHA verification is not configured on this server. Missing: ${abhaStatus.missing.join(', ')}.`
      )
      return
    }

    if (abhaAction === 'existing' && abhaNumber.replace(/[^0-9]/g, '').length !== 14) {
      setAbhaError('Enter a 14-digit ABHA number before requesting an OTP.')
      return
    }
    if (abhaAction === 'create') {
      if (aadhaarNumber.replace(/[^0-9]/g, '').length !== 12) {
        setAbhaError('Enter your 12-digit Aadhaar number to create an ABHA.')
        return
      }
      if (!abhaConsent) {
        setAbhaError('Confirm that you consent to sharing your Aadhaar details with ABDM.')
        return
      }
    }

    setAbhaBusy(true)
    try {
      const response =
        abhaAction === 'existing'
          ? await apiAbha.requestVerifyOtp(abhaNumber.trim())
          : await apiAbha.requestEnrollmentOtp(aadhaarNumber)

      if (!response.success || !response.data) {
        setAbhaError(response.error || 'ABDM could not send an OTP. Please try again.')
        return
      }

      setAbhaChallengeId(response.data.challengeId)
      setMaskedAbha(
        abhaAction === 'existing'
          ? response.data.maskedAbha || abhaNumber.trim()
          : 'the mobile number linked with your Aadhaar'
      )
      setAbhaOtp('')
      setAbhaStep('otp')
      setAbhaInfo(response.data.message || 'OTP requested from ABDM.')
      // Aadhaar is only needed to request the OTP and is not kept in the form.
      if (abhaAction === 'create') setAadhaarNumber('')
    } finally {
      setAbhaBusy(false)
    }
  }

  const verifyAbhaOtp = async () => {
    setAbhaError('')
    setAbhaInfo('')

    if (!/^\d{6}$/.test(abhaOtp.trim())) {
      setAbhaError('Enter the 6-digit OTP sent by ABDM.')
      return
    }

    setAbhaBusy(true)
    try {
      const response =
        abhaAction === 'existing'
          ? await apiAbha.verifyExistingAbha(abhaChallengeId, abhaOtp.trim())
          : await apiAbha.verifyEnrollmentOtp(abhaChallengeId, abhaOtp.trim())

      if (!response.success || !response.data) {
        setAbhaError(response.error || 'ABDM did not confirm this OTP. Please request a new one.')
        return
      }

      setAbhaNumber(response.data.abhaNumber)
      setAbhaVerificationToken(response.data.verificationToken)
      setVerifiedAbhaName(response.data.name || '')
      setAbhaAddress(response.data.abhaAddress || '')
      setAbhaOtp('')
      setAbhaStep('verified')
      setAbhaInfo(
        response.data.isNew === true
          ? 'ABHA created and verified with ABDM.'
          : 'ABHA verified with ABDM.'
      )
    } finally {
      setAbhaBusy(false)
    }
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
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include a letter and a number.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!phone.trim()) {
      setError('Please provide a mobile number so the clinic can reach you.')
      return
    }
    if (abhaNumber.trim()) {
      const cleanAbha = abhaNumber.replace(/[^0-9]/g, '')
      if (cleanAbha.length !== 14) {
        setError('An ABHA number must be 14 digits (format: XX-XXXX-XXXX-XXXX). Leave the field empty if you do not have one.')
        return
      }
    }
    if (!consent) {
      setError('Please confirm the health data consent declaration before registering.')
      return
    }
    if (abhaAction !== null && abhaStep !== 'verified') {
      setError('Finish or cancel the ABHA verification before creating your account.')
      return
    }

    setIsLoading(true)
    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'patient',
        consent: true,
        phone: phone.trim(),
        date_of_birth: dob || undefined,
        gender,
        address: address.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        abha_id: abhaNumber.trim() || undefined,
        abha_verification_token: abhaVerificationToken || undefined
      })

      if (!result.success || !result.user) {
        setError(result.error || 'Registration failed. Please check your details and try again.')
        return
      }

      setSuccess('Account created. Opening your patient workspace…')
      navigate('/patient/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Could not reach the ClinicOps server. Please try again.')
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
            Create a Patient Account
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Self-registration is for patients. Clinic staff accounts are issued by an administrator.
          </p>
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
                  placeholder="e.g. Yukta Ravindra Thakur"
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row: Phone & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Mobile Number *
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

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Gender, Address & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

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
                  placeholder="City, State"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
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
                placeholder="Name / phone"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
              />
            </div>
          </div>

          {/* Optional ABHA */}
          <div className="pt-2 border-t border-[#E2ECE4] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <IdentificationIcon className="w-4 h-4 text-forest-green" />
                <span className="text-xs font-bold text-forest-green uppercase tracking-wider">
                  Ayushman Bharat Health Account (optional)
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  abhaStep === 'verified'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {abhaStep === 'verified' ? 'Verified with ABDM' : 'Not verified'}
              </span>
            </div>

            {abhaStatus && !abhaStatus.configured && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <p className="font-bold mb-0.5">ABHA verification is currently unavailable</p>
                <p>
                  This server is missing <span className="font-mono">{abhaStatus.missing.join(', ')}</span>.
                  You can still register and enter your ABHA manually; it will be stored as unverified.
                  Email and password registration continues to work normally.
                </p>
              </div>
            )}

            {abhaStep === 'verified' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1">
                <p className="font-mono font-bold text-emerald-900">{abhaNumber}</p>
                {verifiedAbhaName && <p className="text-emerald-800">{verifiedAbhaName}</p>}
                {abhaAddress && <p className="font-mono text-[11px] text-emerald-700">{abhaAddress}</p>}
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Ownership confirmed by ABDM. The clinic will store this number as verified.
                </p>
                <button
                  type="button"
                  onClick={removeAbhaVerification}
                  className="text-[11px] font-semibold text-emerald-900 underline"
                >
                  Remove verification
                </button>
              </div>
            ) : abhaAction === null ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    ABHA Number
                  </label>
                  <div className="relative">
                    <IdentificationIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={abhaNumber}
                      onChange={(e) => handleAbhaChange(e.target.value)}
                      placeholder="XX-XXXX-XXXX-XXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                    />
                  </div>
                </div>

                {abhaStatus?.configured && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAbhaAction('existing')
                        setAbhaError('')
                        setAbhaInfo('')
                      }}
                      className="px-3 py-2 rounded-xl border border-forest-green/30 bg-[#F4F8F4] text-[11px] font-bold text-forest-green hover:bg-[#EFF5EE] flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheckIcon className="w-3.5 h-3.5" />
                      Verify an existing ABHA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAbhaNumber('')
                        setAbhaAction('create')
                        setAbhaError('')
                        setAbhaInfo('')
                      }}
                      className="px-3 py-2 rounded-xl border border-forest-green/30 bg-[#F4F8F4] text-[11px] font-bold text-forest-green hover:bg-[#EFF5EE] flex items-center justify-center gap-1.5"
                    >
                      <IdentificationIcon className="w-3.5 h-3.5" />
                      Create a new ABHA
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-[#5A6D62] flex items-start gap-1">
                  <InformationCircleIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Without ABDM verification the number is stored as unverified. Leave it blank if you
                    do not have an ABHA number.
                  </span>
                </p>
              </div>
            ) : abhaStep === 'input' ? (
              <div className="space-y-2">
                {abhaAction === 'existing' ? (
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      ABHA Number to verify
                    </label>
                    <div className="relative">
                      <IdentificationIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={abhaNumber}
                        onChange={(e) => handleAbhaChange(e.target.value)}
                        placeholder="XX-XXXX-XXXX-XXXX"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-[#5A6D62] mt-1">
                      ABDM sends an OTP to the mobile number linked with this ABHA&apos;s Aadhaar.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Aadhaar Number
                      </label>
                      <div className="relative">
                        <IdentificationIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={12}
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                          placeholder="12-digit Aadhaar number"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-[#5A6D62] mt-1">
                        Used only to request the Aadhaar OTP from ABDM. It is not stored by ClinicOps.
                      </p>
                    </div>
                    <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F7FAF7] border border-[#E2ECE4] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={abhaConsent}
                        onChange={(e) => setAbhaConsent(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-forest-green border-gray-300"
                      />
                      <span className="text-[10px] text-stone-700 leading-relaxed">
                        I consent to my Aadhaar details being shared with ABDM to create an ABHA number.
                      </span>
                    </label>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={requestAbhaOtp}
                    disabled={abhaBusy}
                    className="flex-1 py-2 rounded-xl bg-forest-green text-white text-[11px] font-bold disabled:opacity-50"
                  >
                    {abhaBusy ? 'Requesting OTP…' : 'Send ABDM OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAbhaFlow}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-stone-700">
                  Enter the 6-digit OTP sent by ABDM to <strong>{maskedAbha}</strong>.
                </p>
                <div className="relative">
                  <ShieldCheckIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={abhaOtp}
                    onChange={(e) => setAbhaOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] font-mono tracking-[0.4em] text-sm text-stone-800 focus:outline-hidden focus:border-forest-green focus:bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={verifyAbhaOtp}
                    disabled={abhaBusy}
                    className="flex-1 py-2 rounded-xl bg-forest-green text-white text-[11px] font-bold disabled:opacity-50"
                  >
                    {abhaBusy ? 'Verifying with ABDM…' : 'Verify with ABDM'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbhaStep('input')
                      setAbhaOtp('')
                      setAbhaError('')
                      setAbhaInfo('')
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-600"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {abhaError && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {abhaError}
              </p>
            )}
            {abhaInfo && !abhaError && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                {abhaInfo}
              </p>
            )}
          </div>

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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, letter + number"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
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
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAFAFA] text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-forest-green focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-2 p-3 rounded-xl bg-[#F7FAF7] border border-[#E2ECE4] cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded text-forest-green border-gray-300 focus:ring-forest-green"
            />
            <span className="text-[11px] text-stone-700 leading-relaxed">
              I consent to ClinicOps storing the health and contact details I provide in order to
              manage my appointments and clinical records. I understand these details are visible
              to the clinic's authorised staff, are stored encrypted, and that I can ask the clinic
              to correct or delete them. *
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || abhaBusy}
            className="w-full mt-2 py-3 rounded-xl bg-forest-green text-white font-semibold text-xs tracking-wide uppercase hover:bg-forest-green/90 transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? 'Creating your account…' : 'Create Patient Account'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-600 mt-4">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-forest-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
