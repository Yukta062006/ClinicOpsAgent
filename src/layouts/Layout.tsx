import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
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

interface MenuItem {
  name: string
  path: string
  icon: any
  roles?: string[]
}

const menuItems: MenuItem[] = [
  { name: 'Front Desk', path: '/front-desk', icon: UserIcon, roles: ['frontdesk'] },
  { name: 'Patient Dashboard', path: '/patient-dashboard', icon: UserIcon, roles: ['patient'] },
  { name: 'Doctor Dashboard', path: '/doctor-dashboard', icon: BeakerIcon, roles: ['doctor'] },
  { name: 'Queue Management', path: '/queue-management', icon: ClockIcon, roles: ['doctor', 'frontdesk'] },
  { name: 'Waiting Room', path: '/waiting-room', icon: QueueListIcon, roles: ['doctor', 'frontdesk'] },
  { name: 'Travel Planner', path: '/travel-planner', icon: MapIcon, roles: ['patient'] },
  { name: 'Medical Research', path: '/medical-research', icon: MagnifyingGlassIcon, roles: ['patient'] },
  { name: 'Research Summary', path: '/research-summary', icon: BookOpenIcon, roles: ['patient'] },
  { name: 'Medical Videos', path: '/medical-videos', icon: VideoCameraIcon, roles: ['patient'] },
  { name: 'Health Games', path: '/health-games', icon: PuzzlePieceIcon, roles: ['patient'] },
  { name: 'Learning Progress', path: '/learning-progress', icon: ChartBarIcon, roles: ['patient'] },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('clinicops_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('clinicops_token')
    localStorage.removeItem('clinicops_user')
    navigate('/login')
  }

  const getVisibleMenuItems = () => {
    if (!user) return menuItems.filter(item => item.roles?.includes('patient') || item.path === '/login')
    return menuItems.filter(item => !item.roles || item.roles.includes(user.role))
  }

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
            {getVisibleMenuItems().map((item) => {
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
            {user && (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pale-sage flex items-center justify-center text-forest-green font-semibold border border-pale-sage">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-forest-green">{user.name}</p>
                    <p className="text-xs text-text-secondary capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-text-secondary hover:text-forest-green transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
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
