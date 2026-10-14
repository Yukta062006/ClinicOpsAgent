import React from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarIcon, 
  UserPlusIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const stats = [
    { label: 'Total Patients', value: '1,234', icon: UserPlusIcon },
    { label: 'Appointments Today', value: '45', icon: CalendarIcon },
    { label: 'Active Queue', value: '12', icon: ClockIcon },
    { label: 'Completed Consultations', value: '8', icon: CheckCircleIcon },
  ]

  const recentActivity = [
    { title: 'New Patient Registration', time: '2 hours ago', doctor: 'Dr. Sarah Smith' },
    { title: 'Appointment Scheduled', time: '4 hours ago', doctor: 'Dr. John Doe' },
    { title: 'Lab Results Available', time: '5 hours ago', doctor: 'Dr. Emily Chen' },
    { title: 'Prescription Updated', time: '6 hours ago', doctor: 'Dr. Michael Brown' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-forest-green mb-2">Welcome Back, Dr. John Doe</h1>
        <p className="text-sm text-text-secondary">Here's what's happening in your clinic today</p>
      </div>

      {/* Stats Grid - Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
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
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-light-green/30 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-forest-green rounded-full"></div>
                  <div>
                    <p className="font-medium text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-secondary">{activity.doctor}</p>
                  </div>
                </div>
                <span className="text-xs text-text-secondary">{activity.time}</span>
              </div>
            ))}
          </div>
          <Link 
            to="/doctor-dashboard" 
            className="flex items-center justify-center w-full mt-4 text-forest-green font-medium hover:text-green-600 transition-colors"
          >
            View All Activity <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
