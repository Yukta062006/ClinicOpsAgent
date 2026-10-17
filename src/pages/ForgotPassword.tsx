import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // For now, simulate password reset
    // In production, this would send an email with reset link
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
        <div className="bg-white rounded-xl shadow-card w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-forest-green mb-2">Check Your Email</h2>
          <p className="text-sm text-text-secondary mb-6">
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-md p-8">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-text-secondary hover:text-forest-green mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Login</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pale-sage rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="font-serif font-bold text-forest-green text-3xl">C</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-forest-green mb-2">Forgot Password?</h1>
          <p className="text-sm text-text-secondary">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Enter the email you used to register your account.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
          >
            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}