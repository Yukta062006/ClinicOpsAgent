import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { apiAuth } from '../utils/api'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('patient')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [department, setDepartment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      console.log('Registering user:', { email, name, role })
      const response = await apiAuth.register({
        email,
        password,
        name,
        role,
        phone: phone || undefined,
        specialty: specialty || undefined,
        department: department || undefined,
      })
      
      console.log('Register response:', response)
      
      if (response.success && response.data) {
        const { token, user } = response.data
        localStorage.setItem('clinicops_token', token)
        localStorage.setItem('clinicops_user', JSON.stringify(user))
        
        // Redirect based on role
        switch (user.role) {
          case 'doctor':
            navigate('/doctor-dashboard')
            break
          case 'frontdesk':
            navigate('/front-desk')
            break
          case 'patient':
            navigate('/patient-dashboard')
            break
          default:
            navigate('/dashboard')
        }
      } else {
        setError(response.error || 'Registration failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
      <div className="bg-white rounded-xl shadow-card w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pale-sage rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="font-serif font-bold text-forest-green text-3xl">C</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-forest-green mb-2">Create Account</h1>
          <p className="text-sm text-text-secondary">Join ClinicOps today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Email *</label>
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
              <label className="block text-sm font-medium text-text-primary mb-2">Password *</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password *</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
              >
                <option value="patient">Patient</option>
                <option value="frontdesk">Front Desk</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {role === 'doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                    placeholder="e.g., Cardiology, General Practice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-warm-cream/50 border border-pale-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-transparent transition-all"
                    placeholder="e.g., Cardiology Department"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-forest-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <a href="/login" className="text-forest-green font-medium hover:text-green-600 transition-colors">
              Sign in
            </a>
          </p>
        </div>

        {/* Admin Info */}
        <div className="mt-6 p-4 bg-light-green rounded-lg">
          <p className="text-xs text-text-secondary mb-2">Default Admin Account:</p>
          <p className="text-sm text-text-primary font-mono">Email: admin@clinicops.com</p>
          <p className="text-sm text-text-primary font-mono">Password: admin123</p>
        </div>
      </div>
    </div>
  )
}