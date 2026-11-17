import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid registered email address.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border border-[#E2ECE4] w-full max-w-md p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-[#EFF5EE] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#1B3E2F]">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1B3E2F] mb-2">Check Your Email</h2>
          <p className="text-sm text-[#5A6D62] mb-6 leading-relaxed">
            We've sent clinical recovery instructions to <strong className="text-[#1E2D25]">{email}</strong>. Please check your inbox to reset your password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#143024] transition-all"
          >
            Back to Login
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
            <EnvelopeIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1B3E2F]">Reset Password</h1>
          <p className="text-xs text-[#5A6D62] mt-1.5 leading-relaxed">
            Enter your email address and we'll send you instructions to reset your account credentials.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E2D25] uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829489]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3E2F] text-[#1E2D25]"
                placeholder="e.g. yukta@clinicops.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1B3E2F] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#143024] transition-all transform active:scale-98 shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Send Reset Instructions</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}