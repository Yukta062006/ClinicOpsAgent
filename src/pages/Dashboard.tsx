import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('clinicops_user')
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser)
        const role = (u.role || 'patient').toLowerCase().replace('_', '')
        if (role.includes('doc')) {
          navigate('/doctor-dashboard', { replace: true })
          return
        }
        if (role.includes('front')) {
          navigate('/front-desk', { replace: true })
          return
        }
        navigate('/patient-dashboard', { replace: true })
        return
      } catch (e) {}
    }
    navigate('/patient-dashboard', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-sm font-semibold text-[#1B3E2F] flex items-center space-x-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1B3E2F] animate-ping"></div>
        <span>Loading your dedicated role workspace...</span>
      </div>
    </div>
  )
}
