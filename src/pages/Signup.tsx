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
  ShieldCheckIcon,
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { useData } from '../context/DataContext'
import { apiAbha, AbhaStatus } from '../utils/api'
import { validateAadhaar } from '../utils/verhoeff'

const ABDM_CONSENT_TEXTS: Record<'en' | 'hi' | 'mr' | 'bn', { title: string; text: string }> = {
  en: {
    title: 'Statutory Aadhaar Consent Declaration (ABDM V3 / UIDAI)',
    text: 'I hereby declare that I am voluntarily sharing my Aadhaar number and demographic details with the National Health Authority (ABDM) for the purpose of creation of Ayushman Bharat Health Account (ABHA). I understand that my Aadhaar details will be validated through UIDAI authentication.',
  },
  hi: {
    title: 'सांविधिक आधार सहमति घोषणा (ABDM V3 / UIDAI)',
    text: 'मैं स्वेच्छा से राष्ट्रीय स्वास्थ्य प्राधिकरण (ABDM) के साथ आयुष्मान भारत स्वास्थ्य खाता (ABHA) के निर्माण हेतु अपना आधार नंबर और जनसांख्यिकीय विवरण साझा करने की सहमति देता/देती हूँ। मुझे ज्ञात है कि मेरा आधार UIDAI प्रमाणीकरण के माध्यम से सत्यापित किया जाएगा।',
  },
  mr: {
    title: 'वैधानिक आधार संमती घोषणा (ABDM V3 / UIDAI)',
    text: 'मी याद्वारे स्वेच्छेने राष्ट्रीय आरोग्य प्राधिकरण (ABDM) सोबत आयुष्मान भारत आरोग्य खाते (ABHA) तयार करण्याच्या उद्देशाने माझा आधार क्रमांक आणि माहिती सामायिक करण्यास सहमती देतो/देते. मला समजते की माझा आधार UIDAI प्रमाणीकरणाद्वारे तपासला जाईल.',
  },
  bn: {
    title: 'বিধিবদ্ধ আধার সম্মতি ঘোষণা (ABDM V3 / UIDAI)',
    text: 'আমি স্বেচ্ছায় জাতীয় স্বাস্থ্য কর্তৃপক্ষ (ABDM)-এর সাথে আয়ুষ্মান ভারত স্বাস্থ্য অ্যাকাউন্ট (ABHA) তৈরির উদ্দেশ্যে আমার আধার নম্বর এবং জনসংখ্যার বিবরণ ভাগ করে নেওয়ার সম্মতি জানাচ্ছি। আমি বুঝি যে আমার আধার UIDAI প্রমাণীকরণের মাধ্যমে যাচাই করা হবে।',
  },
}

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
  const [abhaChoice, setAbhaChoice] = useState<'none' | 'existing' | 'create'>('none')
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

  // Multilingual consent (CRT_ABHA_102 & CRT_ABHA_103)
  const [consentLang, setConsentLang] = useState<'en' | 'hi' | 'mr' | 'bn'>('en')

  // Aadhaar validation state (CRT_ABHA_104)
  const [aadhaarError, setAadhaarError] = useState('')

  // OTP resend restrictions (CRT_ABHA_106)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)

  // Mobile verification (CRT_ABHA_108 & CRT_ABHA_109)
  const [sameMobile, setSameMobile] = useState<boolean>(true)
  const [commMobile, setCommMobile] = useState('')
  const [commMobileOtp, setCommMobileOtp] = useState('')
  const [commMobileStep, setCommMobileStep] = useState<'input' | 'otp' | 'verified'>('input')
  const [commMobileBusy, setCommMobileBusy] = useState(false)
  const [commMobileMsg, setCommMobileMsg] = useState('')

  // ABHA Address suggestions & custom handle check (CRT_ABHA_112)
  const [suggestedAddresses, setSuggestedAddresses] = useState<string[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [isCustomAddress, setIsCustomAddress] = useState(false)
  const [addressChecking, setAddressChecking] = useState(false)
  const [addressCheckMsg, setAddressCheckMsg] = useState('')

  // Returning patient identification (CRT_ABHA_116)
  const [returningPatientInfo, setReturningPatientInfo] = useState<{
    name: string;
    maskedEmail?: string;
    maskedPhone?: string;
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useData()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

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

  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 12)
    setAadhaarNumber(raw)
    if (raw.length === 12) {
      const result = validateAadhaar(raw, { allowDeveloperDemo: true })
      if (!result.valid) {
        setAadhaarError(result.error || 'Invalid Aadhaar number (Verhoeff checksum failed).')
      } else {
        setAadhaarError('')
      }
    } else {
      setAadhaarError('')
    }
  }

  useEffect(() => {
    let cancelled = false
    apiAbha.status().then((response) => {
      if (!cancelled && response.success && response.data) setAbhaStatus(response.data)
    })

    const prefill = searchParams.get('abha')?.replace(/[^0-9]/g, '').slice(0, 14) || ''
    if (prefill.length === 14) {
      setAbhaNumber(formatAbha(prefill))
      setAbhaChoice('existing')
      setAbhaAction('existing')
    }

    return () => {
      cancelled = true
    }
    // The verification status and prefill are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetAbhaFlow = () => {
    setAbhaChoice('none')
    setAbhaAction(null)
    setAbhaStep('input')
    setAbhaChallengeId('')
    setAbhaOtp('')
    setMaskedAbha('')
    setAadhaarNumber('')
    setAadhaarError('')
    setAbhaConsent(false)
    setAbhaError('')
    setAbhaInfo('')
    setAbhaNumber('')
    setAbhaVerificationToken('')
    setVerifiedAbhaName('')
    setAbhaAddress('')
    setResendCooldown(0)
    setResendCount(0)
    setSameMobile(true)
    setCommMobile('')
    setCommMobileOtp('')
    setCommMobileStep('input')
    setCommMobileMsg('')
    setSuggestedAddresses([])
    setSelectedAddress('')
    setCustomAddress('')
    setIsCustomAddress(false)
    setAddressCheckMsg('')
    setReturningPatientInfo(null)
  }

  const removeAbhaVerification = () => {
    setAbhaVerificationToken('')
    setVerifiedAbhaName('')
    setAbhaAddress('')
    setAbhaStep('input')
    setAbhaError('')
    setAbhaInfo('')
    setReturningPatientInfo(null)
  }

  const requestAbhaOtp = async () => {
    setAbhaError('')
    setAbhaInfo('')
    setReturningPatientInfo(null)

    if (abhaAction === 'existing' && abhaNumber.replace(/[^0-9]/g, '').length !== 14) {
      setAbhaError('Enter a 14-digit ABHA number before requesting an OTP.')
      return
    }
    if (abhaAction === 'create') {
      const vResult = validateAadhaar(aadhaarNumber, { allowDeveloperDemo: true })
      if (!vResult.valid) {
        setAbhaError(vResult.error || 'Invalid Aadhaar number (Verhoeff checksum failed).')
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
      setResendCooldown(60)
      setResendCount(0)
      setAbhaInfo(response.data.message || 'OTP requested from ABDM.')

      // Load address suggestions if enrolling
      if (abhaAction === 'create') {
        apiAbha.getAbhaAddressSuggestions(response.data.challengeId).then((r) => {
          if (r.success && r.data?.suggestions && r.data.suggestions.length > 0) {
            setSuggestedAddresses(r.data.suggestions)
            setSelectedAddress(r.data.suggestions[0])
          }
        })
      }

      // Aadhaar is only needed to request the OTP and is not kept in the form.
      if (abhaAction === 'create') setAadhaarNumber('')
    } finally {
      setAbhaBusy(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendCount >= 3 || !abhaChallengeId) return
    setAbhaBusy(true)
    try {
      const response = await apiAbha.resendOtp(abhaChallengeId)
      if (response.success && response.data) {
        setResendCooldown(60)
        setResendCount(response.data.resendCount)
        setAbhaInfo(response.data.message || 'A fresh OTP has been dispatched to your mobile.')
        setAbhaError('')
      } else {
        setAbhaError(response.error || 'Failed to resend OTP.')
      }
    } finally {
      setAbhaBusy(false)
    }
  }

  const handleRequestCommMobileOtp = async () => {
    if (commMobile.length !== 10) {
      setAbhaError('Enter a valid 10-digit communication mobile number.')
      return
    }
    setCommMobileBusy(true)
    setAbhaError('')
    try {
      const res = await apiAbha.requestMobileOtp(abhaChallengeId, commMobile)
      if (res.success && res.data) {
        setCommMobileStep('otp')
        setCommMobileMsg(res.data.message || 'OTP sent to communication mobile.')
      } else {
        setAbhaError(res.error || 'Failed to send mobile OTP.')
      }
    } finally {
      setCommMobileBusy(false)
    }
  }

  const handleVerifyCommMobileOtp = async () => {
    if (commMobileOtp.length !== 6) {
      setAbhaError('Enter the 6-digit OTP sent to your communication mobile.')
      return
    }
    setCommMobileBusy(true)
    setAbhaError('')
    try {
      const res = await apiAbha.verifyMobileOtp(abhaChallengeId, commMobileOtp)
      if (res.success) {
        setCommMobileStep('verified')
        setCommMobileMsg('Communication mobile successfully verified with ABDM.')
      } else {
        setAbhaError(res.error || 'Invalid mobile OTP.')
      }
    } finally {
      setCommMobileBusy(false)
    }
  }

  const handleCheckAddressAvailability = async () => {
    if (customAddress.trim().length < 3) {
      setAddressCheckMsg('Address must be at least 3 characters.')
      return
    }
    setAddressChecking(true)
    setAddressCheckMsg('')
    try {
      const handle = customAddress.includes('@') ? customAddress : `${customAddress}@sbx`
      const res = await apiAbha.checkAbhaAddressAvailability(handle)
      if (res.success && res.data) {
        setAddressCheckMsg(res.data.available ? `✓ ${handle} is available!` : `✗ ${handle} is taken. Try another.`)
      }
    } finally {
      setAddressChecking(false)
    }
  }

  const verifyAbhaOtp = async () => {
    setAbhaError('')
    setAbhaInfo('')
    setReturningPatientInfo(null)

    if (!/^\d{6}$/.test(abhaOtp.trim())) {
      setAbhaError('Enter the 6-digit OTP sent by ABDM.')
      return
    }

    if (abhaAction === 'create' && !sameMobile && commMobileStep !== 'verified') {
      setAbhaError('Please verify your communication mobile number before completing ABHA creation.')
      return
    }

    setAbhaBusy(true)
    try {
      const finalAddress = isCustomAddress
        ? (customAddress.trim() ? (customAddress.includes('@') ? customAddress.trim() : `${customAddress.trim()}@sbx`) : undefined)
        : (selectedAddress || undefined)

      const response =
        abhaAction === 'existing'
          ? await apiAbha.verifyExistingAbha(abhaChallengeId, abhaOtp.trim())
          : await apiAbha.verifyEnrollmentOtp(abhaChallengeId, abhaOtp.trim(), finalAddress, '1.4', consentLang)

      if (!response.success || !response.data) {
        if (response.code === 'ABHA_ALREADY_LINKED' || (response as any).returningPatient) {
          setReturningPatientInfo((response as any).returningPatient || { name: 'Existing Patient' })
          setAbhaError(response.error || 'This ABHA number is already linked to a ClinicOps account.')
        } else {
          setAbhaError(response.error || 'ABDM did not confirm this OTP. Please request a new one.')
        }
        return
      }

      setAbhaNumber(response.data.abhaNumber)
      setAbhaVerificationToken(response.data.verificationToken)
      setVerifiedAbhaName(response.data.name || '')
      setAbhaAddress(response.data.abhaAddress || finalAddress || '')
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
    if (abhaChoice === 'existing') {
      if (abhaNumber.trim()) {
        const cleanAbha = abhaNumber.replace(/[^0-9]/g, '')
        if (cleanAbha.length !== 14) {
          setError('An ABHA number must be 14 digits (format: XX-XXXX-XXXX-XXXX). Select "I don\'t have an ABHA number" if you do not have one.')
          return
        }
      } else {
        setError('Please enter your 14-digit ABHA number or select "I don\'t have an ABHA number".')
        return
      }
      if (abhaStep === 'otp') {
        setError('Complete the ABDM OTP verification or cancel before submitting your registration.')
        return
      }
    } else if (abhaChoice === 'create') {
      if (abhaStatus && !abhaStatus.configured) {
        setError('ABHA creation via ABDM is currently unavailable. Please select "I don\'t have an ABHA number" to complete your registration.')
        return
      }
      if (abhaStep !== 'verified') {
        setError('Complete the ABHA creation steps or select "I don\'t have an ABHA number" to register.')
        return
      }
    }

    if (!consent) {
      setError('Please confirm the health data consent declaration before registering.')
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
        phone: (sameMobile ? phone.trim() : (commMobile.trim() || phone.trim())),
        date_of_birth: dob || undefined,
        gender,
        address: address.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        abha_id: abhaChoice === 'none' ? undefined : (abhaNumber.trim() || undefined),
        abha_verification_token: abhaChoice === 'none' ? undefined : (abhaVerificationToken || undefined),
        consent_version: '1.4',
        consent_language: consentLang,
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
                  Ayushman Bharat Health Account (ABHA)
                </span>
              </div>
              {/* Dynamic Status Badge */}
              {abhaChoice === 'none' ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  ⚪ Not linked
                </span>
              ) : abhaStep === 'verified' ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ Verified
                </span>
              ) : abhaStatus && !abhaStatus.configured ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  ℹ Verification unavailable
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ⚠ Not verified
                </span>
              )}
            </div>

            {/* Three Clear Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAbhaChoice('none')
                  resetAbhaFlow()
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  abhaChoice === 'none'
                    ? 'border-forest-green bg-[#F4F8F4] text-forest-green shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">I don't have ABHA</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                    Optional
                  </span>
                </div>
                <p className="text-[10px] text-[#5A6D62] leading-tight">
                  Register with email & password. Link later anytime.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAbhaChoice('existing')
                  setAbhaAction('existing')
                  setAbhaStep('input')
                  setAbhaError('')
                  setAbhaInfo('')
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  abhaChoice === 'existing'
                    ? 'border-forest-green bg-[#F4F8F4] text-forest-green shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">I have an ABHA</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800">
                    14 digits
                  </span>
                </div>
                <p className="text-[10px] text-[#5A6D62] leading-tight">
                  Enter your number and verify via ABDM OTP.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAbhaChoice('create')
                  setAbhaAction('create')
                  setAbhaNumber('')
                  setAbhaStep('input')
                  setAbhaError('')
                  setAbhaInfo('')
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  abhaChoice === 'create'
                    ? 'border-forest-green bg-[#F4F8F4] text-forest-green shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">Create new ABHA</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800">
                    Aadhaar
                  </span>
                </div>
                <p className="text-[10px] text-[#5A6D62] leading-tight">
                  Enrol online with ABDM via Aadhaar OTP.
                </p>
              </button>
            </div>

            {/* Option 1 Content: I don't have an ABHA number */}
            {abhaChoice === 'none' && (
              <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#E2ECE4] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1B3E2F]">Standard Registration</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                    ⚪ Not linked
                  </span>
                </div>
                <p className="text-[11px] text-[#5A6D62] leading-relaxed">
                  You can complete registration without an ABHA number. You will receive a standard ClinicOps patient account with full access to appointments, doctor consultations, and medical records. You can link an ABHA account later at any time from your Patient Dashboard.
                </p>
              </div>
            )}

            {/* Option 2 Content: I already have an ABHA number */}
            {abhaChoice === 'existing' && (
              <div className="space-y-3">
                {abhaStep === 'verified' ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-950 text-sm tracking-wide">{abhaNumber}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                        ✓ Verified
                      </span>
                    </div>
                    {verifiedAbhaName && <p className="text-emerald-850 font-medium">Name: {verifiedAbhaName}</p>}
                    {abhaAddress && <p className="font-mono text-[11px] text-emerald-700">ABHA Address: {abhaAddress}</p>}
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Identity ownership verified via ABDM OTP. This will be linked to your ClinicOps record upon registration.
                    </p>
                    <button
                      type="button"
                      onClick={removeAbhaVerification}
                      className="text-[11px] font-semibold text-emerald-900 underline hover:text-emerald-700 pt-1"
                    >
                      Change / remove verification
                    </button>
                  </div>
                ) : abhaStep === 'otp' ? (
                  <div className="space-y-2 p-3 rounded-xl bg-[#F7FAF7] border border-[#E2ECE4]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-forest-green">Enter ABDM OTP</p>
                      <span className="text-[10px] text-[#5A6D62]">6 digits</span>
                    </div>
                    <p className="text-[11px] text-stone-700">
                      Enter the 6-digit OTP sent by ABDM to <strong>{maskedAbha}</strong>.
                    </p>
                    {abhaStatus?.environment === 'sandbox' && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-[11px] leading-relaxed space-y-1">
                        <p className="font-bold text-emerald-900">📱 Sandbox Mode Active</p>
                        <p>
                          No physical SMS is sent in sandbox mode. Use test verification code:
                        </p>
                        <div>
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
                    )}
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white font-mono tracking-[0.4em] text-sm text-stone-800 focus:outline-hidden focus:border-forest-green"
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
                        onClick={handleResendOtp}
                        disabled={abhaBusy || resendCooldown > 0 || resendCount >= 3}
                        className="font-semibold text-forest-green hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${abhaBusy ? 'animate-spin' : ''}`} />
                        Resend ABDM OTP
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={verifyAbhaOtp}
                        disabled={abhaBusy || abhaOtp.length !== 6}
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
                        className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-stone-800">
                          14-Digit ABHA Number
                        </label>
                        {abhaStatus && !abhaStatus.configured ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Verification unavailable
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#5A6D62]">
                            Format: XX-XXXX-XXXX-XXXX
                          </span>
                        )}
                      </div>
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

                    {abhaStatus && !abhaStatus.configured && abhaStatus.environment === 'production' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                        <p className="font-bold mb-0.5">Production ABDM verification is unconfigured</p>
                        <p>
                          This server is missing <span className="font-mono">{abhaStatus.missing.join(', ')}</span>.
                        </p>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={requestAbhaOtp}
                        disabled={abhaBusy || abhaNumber.replace(/[^0-9]/g, '').length !== 14}
                        className="w-full py-2.5 rounded-xl bg-forest-green text-white text-[11px] font-bold hover:bg-forest-green/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        {abhaBusy ? 'Requesting ABDM OTP…' : 'Send ABDM OTP to Verify'}
                      </button>
                      <p className="text-[10px] text-[#5A6D62] mt-1 text-center">
                        ABDM sends a 6-digit OTP to the mobile number registered against this ABHA's Aadhaar.
                        {abhaStatus?.environment === 'sandbox' && (
                          <span className="block mt-0.5 text-emerald-800 font-semibold">
                            💡 Sandbox active: use OTP <span className="font-mono font-bold">123456</span> to verify.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option 3 Content: I want to create an ABHA number */}
            {abhaChoice === 'create' && (
              <div className="space-y-3">
                {abhaStatus && !abhaStatus.configured ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">ABHA Creation Unavailable</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                        Credentials missing
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Direct ABHA creation via ABDM requires active <span className="font-mono">ABDM_CLIENT_ID</span> and <span className="font-mono">ABDM_CLIENT_SECRET</span> on the server.
                    </p>
                    <p className="text-[11px] text-stone-700 leading-relaxed">
                      You can complete your ClinicOps registration right now without an ABHA, or create an ABHA on the official government portal (<a href="https://abha.abdm.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold text-forest-green">abha.abdm.gov.in</a>) and link it later from your dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAbhaChoice('none')
                        resetAbhaFlow()
                      }}
                      className="w-full py-2 rounded-xl bg-forest-green text-white text-[11px] font-bold hover:bg-forest-green/90"
                    >
                      Continue without ABHA (Register with Email)
                    </button>
                  </div>
                ) : abhaStep === 'verified' ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-950 text-sm tracking-wide">{abhaNumber}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                        ✓ Created & Verified
                      </span>
                    </div>
                    {verifiedAbhaName && <p className="text-emerald-850 font-medium">Name: {verifiedAbhaName}</p>}
                    {abhaAddress && <p className="font-mono text-[11px] text-emerald-700">ABHA Address: {abhaAddress}</p>}
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Your new ABHA has been registered with ABDM and will be linked to your ClinicOps patient profile.
                    </p>
                    <button
                      type="button"
                      onClick={removeAbhaVerification}
                      className="text-[11px] font-semibold text-emerald-900 underline hover:text-emerald-700 pt-1"
                    >
                      Start over
                    </button>
                  </div>
                ) : abhaStep === 'otp' ? (
                  <div className="space-y-2.5 p-3 rounded-xl bg-[#F7FAF7] border border-[#E2ECE4]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-forest-green">Enter Aadhaar OTP</p>
                      <span className="text-[10px] text-[#5A6D62]">6 digits</span>
                    </div>
                    <p className="text-[11px] text-stone-700">
                      Enter the 6-digit Aadhaar OTP sent by ABDM to <strong>{maskedAbha}</strong>.
                    </p>

                    {abhaStatus?.environment === 'sandbox' && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-[11px] leading-relaxed space-y-1">
                        <p className="font-bold text-emerald-900">📱 Sandbox Mode Active</p>
                        <p>No physical SMS is sent in sandbox mode. Use test verification code:</p>
                        <div>
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
                    )}

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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white font-mono tracking-[0.4em] text-sm text-stone-800 focus:outline-hidden focus:border-forest-green"
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
                        onClick={handleResendOtp}
                        disabled={abhaBusy || resendCooldown > 0 || resendCount >= 3}
                        className="font-semibold text-forest-green hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${abhaBusy ? 'animate-spin' : ''}`} />
                        Resend ABDM OTP
                      </button>
                    </div>

                    {/* Preferred ABHA Address Selection (CRT_ABHA_112) */}
                    <div className="space-y-1.5 pt-2 border-t border-[#E2ECE4]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-800">
                          Preferred ABHA Address (@abdm)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomAddress(!isCustomAddress)}
                          className="text-[10px] text-forest-green font-semibold hover:underline cursor-pointer"
                        >
                          {isCustomAddress ? 'Use suggested handles' : 'Custom handle'}
                        </button>
                      </div>

                      {!isCustomAddress ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#5A6D62]">Select a recommended ABHA handle:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(suggestedAddresses.length > 0 ? suggestedAddresses : ['patient.health@sbx', 'patient.care@sbx']).slice(0, 4).map((addr) => (
                              <button
                                key={addr}
                                type="button"
                                onClick={() => setSelectedAddress(addr)}
                                className={`py-1.5 px-2 text-[11px] font-mono rounded-lg border text-left truncate cursor-pointer transition-all ${
                                  selectedAddress === addr
                                    ? 'bg-emerald-50 border-forest-green text-forest-green font-bold ring-1 ring-forest-green/20'
                                    : 'bg-white border-stone-200 text-stone-700 hover:border-forest-green'
                                }`}
                              >
                                {selectedAddress === addr ? '✓ ' : ''}{addr}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customAddress}
                              onChange={(e) => {
                                setCustomAddress(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
                                setAddressCheckMsg('')
                              }}
                              placeholder="e.g. yukta.health"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 font-mono text-xs text-stone-800 bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleCheckAddressAvailability}
                              disabled={addressChecking || customAddress.trim().length < 3}
                              className="px-3 py-1.5 border border-forest-green text-forest-green rounded-lg text-xs font-bold hover:bg-forest-green hover:text-white disabled:opacity-50 cursor-pointer"
                            >
                              {addressChecking ? 'Checking…' : 'Check'}
                            </button>
                          </div>
                          {addressCheckMsg && (
                            <p className="text-[10px] text-emerald-800 font-semibold">{addressCheckMsg}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={verifyAbhaOtp}
                        disabled={abhaBusy || abhaOtp.length !== 6}
                        className="flex-1 py-2 rounded-xl bg-forest-green text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {abhaBusy ? 'Confirming Enrolment…' : 'Confirm & Create ABHA'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAbhaStep('input')
                          setAbhaOtp('')
                          setAbhaError('')
                          setAbhaInfo('')
                        }}
                        className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        12-Digit Aadhaar Number
                      </label>
                      <div className="relative">
                        <IdentificationIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={12}
                          value={aadhaarNumber}
                          onChange={(e) => handleAadhaarChange(e.target.value)}
                          placeholder="12-digit Aadhaar number"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] font-mono text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:bg-white ${
                            aadhaarError ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 focus:border-forest-green'
                          }`}
                        />
                      </div>
                      {aadhaarError ? (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          ⚠ {aadhaarError}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#5A6D62] mt-1">
                          Encrypted and forwarded directly to ABDM to request OTP. Never stored on ClinicOps servers.
                        </p>
                      )}
                    </div>

                    {/* Multilingual Consent Selector (CRT_ABHA_102 & CRT_ABHA_103) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                          <GlobeAltIcon className="w-3.5 h-3.5 text-forest-green" />
                          <span>Statutory Consent Language</span>
                        </label>
                        <span className="text-[10px] text-[#5A6D62] font-mono">v1.4 (Statutory)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'en', label: 'English' },
                          { id: 'hi', label: 'हिन्दी' },
                          { id: 'mr', label: 'मराठी' },
                          { id: 'bn', label: 'বাংলা' },
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setConsentLang(lang.id as any)}
                            className={`py-1 text-[11px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                              consentLang === lang.id
                                ? 'bg-forest-green text-white border-forest-green shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-forest-green'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#F7FAF7] border border-[#E2ECE4] text-[11px] text-stone-700 leading-relaxed space-y-1.5">
                        <p className="font-bold text-forest-green text-[10px] uppercase tracking-wider">
                          {ABDM_CONSENT_TEXTS[consentLang].title}
                        </p>
                        <p className="text-stone-800 text-[11px] italic">
                          &ldquo;{ABDM_CONSENT_TEXTS[consentLang].text}&rdquo;
                        </p>
                        <label className="flex items-start gap-2 pt-1.5 border-t border-[#E2ECE4] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={abhaConsent}
                            onChange={(e) => setAbhaConsent(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 rounded text-forest-green border-gray-300"
                          />
                          <span className="text-[11px] font-semibold text-stone-900 leading-normal">
                            I voluntary provide my Aadhaar consent in {consentLang === 'en' ? 'English' : consentLang === 'hi' ? 'Hindi' : consentLang === 'mr' ? 'Marathi' : 'Bengali'} under ABDM v1.4.
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Communication Mobile Verification (CRT_ABHA_108 & CRT_ABHA_109) */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-stone-800">
                        Communication Mobile Number
                      </label>
                      <div className="space-y-1 text-xs text-stone-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="commMobileRadio"
                            checked={sameMobile}
                            onChange={() => {
                              setSameMobile(true)
                              setCommMobileStep('input')
                            }}
                            className="text-forest-green"
                          />
                          <span>Use my Aadhaar-linked mobile number</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="commMobileRadio"
                            checked={!sameMobile}
                            onChange={() => setSameMobile(false)}
                            className="text-forest-green"
                          />
                          <span>Use a different communication mobile</span>
                        </label>
                      </div>

                      {!sameMobile && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 mt-1">
                          <p className="text-[10px] text-amber-900">
                            Per ABDM CRT_ABHA_108/109, an alternate communication mobile requires mobile OTP verification.
                          </p>
                          {commMobileStep === 'verified' ? (
                            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold bg-white p-2 rounded-lg border border-emerald-300">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                              <span>Alternate Mobile ({commMobile}) Verified with ABDM</span>
                            </div>
                          ) : commMobileStep === 'otp' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-stone-700">6-digit Mobile OTP:</span>
                                <button
                                  type="button"
                                  onClick={() => setCommMobileOtp('123456')}
                                  className="text-[10px] text-forest-green font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                                >
                                  Autofill test OTP (123456)
                                </button>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={6}
                                  value={commMobileOtp}
                                  onChange={(e) => setCommMobileOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                  placeholder="Enter 123456"
                                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono text-xs tracking-wider"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleVerifyCommMobileOtp}
                                  disabled={commMobileBusy || commMobileOtp.length !== 6}
                                  className="px-3 py-1.5 bg-forest-green text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                  {commMobileBusy ? 'Verifying…' : 'Verify Mobile OTP'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCommMobileStep('input')}
                                  className="px-2 py-1.5 border border-stone-300 text-xs rounded-lg cursor-pointer"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="tel"
                                maxLength={10}
                                value={commMobile}
                                onChange={(e) => setCommMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                placeholder="10-digit mobile number"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={handleRequestCommMobileOtp}
                                disabled={commMobileBusy || commMobile.length !== 10}
                                className="px-3 py-1.5 bg-forest-green text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                              >
                                {commMobileBusy ? 'Sending…' : 'Send Mobile OTP'}
                              </button>
                            </div>
                          )}
                          {commMobileMsg && (
                            <p className="text-[10px] text-emerald-800 font-semibold">{commMobileMsg}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={requestAbhaOtp}
                      disabled={abhaBusy || aadhaarNumber.length !== 12 || !!aadhaarError || !abhaConsent || (!sameMobile && commMobileStep !== 'verified')}
                      className="w-full py-2.5 rounded-xl bg-forest-green text-white text-[11px] font-bold hover:bg-forest-green/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldCheckIcon className="w-3.5 h-3.5" />
                      {abhaBusy ? 'Requesting Aadhaar OTP…' : 'Send ABDM Aadhaar OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Returning Patient Banner (CRT_ABHA_116) */}
            {returningPatientInfo && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Existing Patient Account Found</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This ABHA identity is already associated with <strong>{returningPatientInfo.name}</strong>.
                      To protect medical history and prevent duplicate patient records, sign in to your existing account.
                    </p>
                  </div>
                </div>
                <div className="pt-1 flex gap-2">
                  <Link
                    to={`/login?abha=${abhaNumber.replace(/[^0-9]/g, '')}`}
                    className="px-3 py-1.5 bg-forest-green text-white text-[11px] font-bold rounded-lg hover:bg-forest-green/90 inline-flex items-center gap-1"
                  >
                    Sign In with ABHA
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReturningPatientInfo(null)}
                    className="px-3 py-1.5 border border-amber-300 text-[11px] font-semibold rounded-lg hover:bg-amber-100/60 cursor-pointer"
                  >
                    Dismiss
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
