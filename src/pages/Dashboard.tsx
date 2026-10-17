import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarIcon, 
  UserPlusIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { apiDashboard, apiQueue } from '../utils/api'

interface StatsData {
  total_patients?: number
  appointments_today?: number
  active_queue?: number
  completed_consultations?: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData>({})
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [queueItems, setQueueItems] = useState<any[]>([])

  useEffect(() => {
    const savedUser = localStorage.getItem('clinicops_user')
    if (savedUser) setUser(JSON.parse(savedUser))
    
    const token = localStorage.getItem('clinicops_token')
    if (token) {
      loadStats(token)
      loadQueue(token)
    }
    setIsLoading(false)
  }, [])

  const loadStats = async (token: string) => {
    const response = await apiDashboard.getStats(token)
    if (response.success && response.data) {
      setStats(response.data.stats)
    }
  }

  const loadQueue = async (token: string) => {
    const response = await apiQueue.getAll(token, { status: 'waiting' })
    if (response.success && response.data) {
      setQueueItems(response.data.queue || [])
    }
  }

  const formatValue = (value: number | undefined) => value?.toLocaleString() || '0'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-forest-green font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-forest-green mb-2">
          Welcome Back, {user?.name || 'Healthcare Professional'}
        </h1>
        <p className="text-sm text-text-secondary">Here's what's happening in your clinic today</p>
      </div>

      {/* Stats Grid - Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Patients', value: formatValue(stats.total_patients), icon: UserPlusIcon },
          { label: 'Appointments Today', value: formatValue(stats.appointments_today), icon: CalendarIcon },
          { label: 'Active Queue', value: formatValue(stats.active_queue), icon: ClockIcon },
          { label: 'Completed Consultations', value: formatValue(stats.completed_consultations), icon: CheckCircleIcon },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-light-green text-forest-green">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-forest-green">+12%</span>
            </div>
            <h3 className="text-3xl font-serif font-bold text-forest-green mb-1">{stat.value}</h3>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-xl font-serif font-bold text-forest-green mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/front-desk" 
              className="bg-forest-green text-white p-4 rounded-xl hover:bg-green-600 transition-all duration-200 shadow-card"
            >
              <UserPlusIcon className="w-8 h-8 mb-2" />
              <span className="font-medium">New Patient</span>
            </Link>
            <Link 
              to="/front-desk" 
              className="bg-white border border-pale-sage text-forest-green p-4 rounded-xl hover:bg-pale-sage/30 transition-all duration-200"
            >
              <CalendarIcon className="w-8 h-8 mb-2" />
              <span className="font-medium">Schedule</span>
            </Link>
            <Link 
              to="/queue-management" 
              className="bg-white border border-pale-sage text-forest-green p-4 rounded-xl hover:bg-pale-sage/30 transition-all duration-200"
            >
              <ClockIcon className="w-8 h-8 mb-2" />
              <span className="font-medium">Queue</span>
            </Link>
            <Link 
              to="/waiting-room" 
              className="bg-white border border-pale-sage text-forest-green p-4 rounded-xl hover:bg-pale-sage/30 transition-all duration-200"
            >
              <CheckCircleIcon className="w-8 h-8 mb-2" />
              <span className="font-medium">Waiting</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <h2 className="text-xl font-serif font-bold text-forest-green mb-5">Recent Activity</h2>
          <div className="space-y-3">
            {queueItems.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-light-green/30 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full"></div>
                  <div>
                    <p className="font-medium text-text-primary">{item.patient_name} - {item.department}</p>
                    <p className="text-xs text-text-secondary">Token: {item.token}</p>
                  </div>
                </div>
                <span className="text-xs text-text-secondary">Waiting</span>
              </div>
            ))}
            {queueItems.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">No patients currently in queue</p>
            )}
          </div>
          <Link 
            to="/queue-management" 
            className="flex items-center justify-center w-full mt-4 text-forest-green font-medium hover:text-green-600 transition-colors"
          >
            View All Activity <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
