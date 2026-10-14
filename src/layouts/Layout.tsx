import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { 
  HomeIcon, 
  UserIcon, 
  BeakerIcon, 
  ClockIcon, 
  ArrowRightOnRectangleIcon,
  MapIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  VideoCameraIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  QueueListIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { name: 'Front Desk', path: '/front-desk', icon: UserIcon },
  { name: 'Patient Dashboard', path: '/patient-dashboard', icon: UserIcon },
  { name: 'Doctor Dashboard', path: '/doctor-dashboard', icon: BeakerIcon },
  { name: 'Queue Management', path: '/queue-management', icon: ClockIcon },
  { name: 'Waiting Room', path: '/waiting-room', icon: QueueListIcon },
  { name: 'Travel Planner', path: '/travel-planner', icon: MapIcon },
  { name: 'Medical Research', path: '/medical-research', icon: MagnifyingGlassIcon },
  { name: 'Research Summary', path: '/research-summary', icon: BookOpenIcon },
  { name: 'Medical Videos', path: '/medical-videos', icon: VideoCameraIcon },
  { name: 'Health Games', path: '/health-games', icon: PuzzlePieceIcon },
  { name: 'Learning Progress', path: '/learning-progress', icon: ChartBarIcon },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-warm-cream">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-pale-sage text-text-primary p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="font-serif font-bold text-forest-green text-lg">C</span>
          </div>
          <h1 className="font-serif font-bold text-text-primary text-lg">ClinicOps</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md hover:bg-white/50 transition-colors text-text-secondary"
        >
          {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-pale-sage transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center space-x-3 p-6 lg:hidden">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="font-serif font-bold text-forest-green text-2xl">C</span>
            </div>
            <h1 className="font-serif font-bold text-text-primary text-xl">ClinicOps</h1>
          </div>

          <nav className="mt-6 px-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-forest-green shadow-sm font-semibold' 
                      : 'text-text-secondary hover:bg-white/50 hover:text-forest-green'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="bg-white/60 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-text-secondary mb-2">System Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                <p className="text-xs font-medium text-text-primary">Online</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-warm-cream">
          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
            <div>
              <h1 className="text-2xl font-serif font-bold text-forest-green">
                {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pale-sage flex items-center justify-center text-forest-green font-semibold border border-pale-sage">
                  JD
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-forest-green">Dr. John Doe</p>
                  <p className="text-xs text-text-secondary">Administrator</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
