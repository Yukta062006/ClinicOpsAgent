import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'
import { apiAuth } from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await apiAuth.login(email, password)
      
      if (response.success && response.data) {
        const { token, user } = response.data
        localStorage.setItem('clinicops_token', token)
        localStorage.setItem('clinicops_user', JSON.stringify(user))
        navigate('/dashboard')
      } else {
        setError(response.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pale-sage rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="font-serif font-bold text-forest-green text-3xl">C</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-forest-green mb-2">Welcome Back</h1>
          <p className="text-sm text-text-secondary">Sign in to your ClinicOps account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4 text-forest-green rounded border-pale-sage" />
              <span className="text-sm text-text-secondary">Remember me</span>
            </label>
            <a href="#" className="text-sm text-forest-green hover:text-green-600 transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-green text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <a href="#" className="text-forest-green font-medium hover:text-green-600 transition-colors">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
