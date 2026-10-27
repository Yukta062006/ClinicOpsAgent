import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { 
  BuildingOffice2Icon,
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
  QueueListIcon,
  BellIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserPlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  PrinterIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import ErrorBoundary from '../components/ErrorBoundary'
import { useData } from '../context/DataContext'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: any
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const navigate = useNavigate()

  const { 
    user, 
    setUser, 
    soundEnabled, 
    toggleSound, 
    activeClinic, 
    setActiveClinic,
    patients,
    appointments,
    queue,
    currentPatient
  } = useData()

  // Normalize role
  const rawRole = (user?.role || 'patient').toLowerCase().replace('_', '')
  const currentRole: 'patient' | 'doctor' | 'frontdesk' = 
    rawRole.includes('doc') ? 'doctor' : 
    rawRole.includes('front') || rawRole.includes('recept') ? 'frontdesk' : 'patient'

  // Handle keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsProfileMenuOpen(false)
        setIsProfileModalOpen(false)
        setIsNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('clinicops_token')
    localStorage.removeItem('clinicops_user')
    setUser(null)
    setIsProfileMenuOpen(false)
    setIsSidebarOpen(false)
    window.location.href = '/login'
  }

  // Define role-specific navigation groups matching strict architectural separation
  const patientNavGroups: NavGroup[] = [
    {
      title: 'PATIENT WORKSPACE',
      items: [
        { name: 'Patient Dashboard', path: '/patient/dashboard', icon: UserIcon },
        { name: 'Appointments', path: '/patient/dashboard?tab=appointments', icon: CalendarIcon },
        { name: 'Queue / Waiting Status', path: '/waiting-room', icon: QueueListIcon },
        { name: 'Medical Records', path: '/patient/dashboard?action=records', icon: DocumentTextIcon },
        { name: 'Travel Planner', path: '/patient/travel-planner', icon: MapIcon },
      ]
    },
    {
      title: 'PATIENT ENGAGEMENT',
      items: [
        { name: 'Medical Research', path: '/patient/medical-research', icon: MagnifyingGlassIcon },
        { name: 'Research Summary', path: '/patient/research-summary', icon: BookOpenIcon },
        { name: 'Medical Videos', path: '/patient/medical-videos', icon: VideoCameraIcon },
        { name: 'Health Games', path: '/patient/health-games', icon: PuzzlePieceIcon },
        { name: 'Learning Progress', path: '/patient/learning-progress', icon: ChartBarIcon },
      ]
    }
  ]

  const frontDeskNavGroups: NavGroup[] = [
    {
      title: 'FRONT DESK OPERATIONS',
      items: [
        { name: 'Front Desk Dashboard', path: '/frontdesk/dashboard', icon: BuildingOffice2Icon },
        { name: 'Patient Registration', path: '/frontdesk/dashboard?action=register', icon: UserPlusIcon },
        { name: 'Patient Search', path: '/frontdesk/dashboard?action=search', icon: MagnifyingGlassIcon },
        { name: 'Appointments', path: '/frontdesk/dashboard?tab=upcoming', icon: CalendarIcon },
        { name: 'Check-In', path: '/frontdesk/dashboard?action=checkin', icon: ClipboardDocumentCheckIcon },
        { name: 'Token / Queue Management', path: '/queue-management', icon: ClockIcon },
        { name: 'Waiting Room', path: '/waiting-room', icon: QueueListIcon },
        { name: 'Reports / Printing', path: '/frontdesk/dashboard?action=reports', icon: PrinterIcon },
      ]
    }
  ]

  const doctorNavGroups: NavGroup[] = [
    {
      title: 'DOCTOR CLINICAL WORKSPACE',
      items: [
        { name: 'Doctor Dashboard', path: '/doctor/dashboard', icon: BeakerIcon },
        { name: 'Today\'s Schedule', path: '/doctor/dashboard?tab=morning', icon: CalendarIcon },
        { name: 'My Patients', path: '/doctor/dashboard?tab=patients', icon: UserGroupIcon },
        { name: 'Queue', path: '/queue-management', icon: ClockIcon },
        { name: 'Active Consultation', path: '/doctor/dashboard?action=consult', icon: ClipboardDocumentCheckIcon },
        { name: 'Medical History', path: '/doctor/dashboard?action=history', icon: FolderIcon },
        { name: 'Consultation Notes', path: '/doctor/dashboard?action=notes', icon: DocumentTextIcon },
        { name: 'Completed Consultations', path: '/doctor/dashboard?tab=completed', icon: CheckCircleIcon },
      ]
    }
  ]

  const activeNavGroups = 
    currentRole === 'doctor' ? doctorNavGroups :
    currentRole === 'frontdesk' ? frontDeskNavGroups : patientNavGroups

  const roleTitleDisplay = 
    currentRole === 'doctor' ? 'Doctor Clinical Workspace' :
    currentRole === 'frontdesk' ? 'Front Desk Workspace' : 'Patient Workspace'

  const userRoleBadge = 
    currentRole === 'doctor' ? 'Doctor' :
    currentRole === 'frontdesk' ? 'Front Desk' : 'Patient'

  // Filter items based on active search
  const filteredSearchItems = [
    ...patients.map(p => ({
      title: p.name,
      subtitle: `Patient • ABHA: ${p.abhaId || 'Verified'} • Phone: ${p.phone}`,
      path: currentRole === 'patient' ? '/patient/dashboard' : (currentRole === 'doctor' ? '/doctor/dashboard' : '/frontdesk/dashboard'),
      category: 'Patients'
    })),
    ...appointments.map(a => ({
      title: `${a.type} with ${a.doctorName}`,
      subtitle: `${a.patientName} • ${a.time} • Status: ${a.status}`,
      path: currentRole === 'doctor' ? '/doctor/dashboard' : (currentRole === 'frontdesk' ? '/frontdesk/dashboard' : '/patient/dashboard'),
      category: 'Appointments'
    })),
    ...(currentRole === 'patient' ? [
      { title: 'Balanced Eating Challenge', subtitle: 'Interactive Health Quiz • 5 questions', path: '/patient/health-games', category: 'Engagement' },
      { title: 'Travel Planner - City General Hospital', subtitle: 'Directions, parking, routes & transit', path: '/patient/travel-planner', category: 'Engagement' },
      { title: 'Diabetes Education Hub', subtitle: 'Medical research & verified video guides', path: '/patient/medical-videos', category: 'Engagement' }
    ] : [])
  ].filter(item => 
    !searchQuery.trim() || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isItemActive = (targetPath: string) => {
    const currentFull = location.pathname + location.search
    if (targetPath.includes('?')) {
      return currentFull === targetPath
    }
    // Handle aliases
    if (targetPath === '/patient/dashboard' && (location.pathname === '/patient/dashboard' || location.pathname === '/patient-dashboard')) return true
    if (targetPath === '/frontdesk/dashboard' && (location.pathname === '/frontdesk/dashboard' || location.pathname === '/front-desk' || location.pathname === '/front-desk/dashboard')) return true
    if (targetPath === '/doctor/dashboard' && (location.pathname === '/doctor/dashboard' || location.pathname === '/doctor-dashboard')) return true
    if (targetPath === '/patient/travel-planner' && (location.pathname === '/travel-planner' || location.pathname === '/patient/travel-planner')) return true
    if (targetPath === '/patient/medical-research' && (location.pathname === '/medical-research' || location.pathname === '/patient/medical-research')) return true
    if (targetPath === '/patient/research-summary' && (location.pathname === '/research-summary' || location.pathname === '/patient/research-summary')) return true
    if (targetPath === '/patient/medical-videos' && (location.pathname === '/medical-videos' || location.pathname === '/patient/medical-videos')) return true
    if (targetPath === '/patient/health-games' && (location.pathname === '/health-games' || location.pathname === '/patient/health-games')) return true
    if (targetPath === '/patient/learning-progress' && (location.pathname === '/learning-progress' || location.pathname === '/patient/learning-progress')) return true
    return location.pathname === targetPath
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E2D25] flex flex-col font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-[#E2ECE4] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B3E2F] flex items-center justify-center text-white">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif font-bold text-[#1B3E2F] text-lg leading-tight">ClinicOpsAgent</h1>
            <p className="text-[9px] text-[#5A6D62] font-semibold tracking-wider uppercase">{userRoleBadge} Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg bg-[#EFF5EE] text-[#1B3E2F]"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-[#EFF5EE] text-[#1B3E2F]"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Specific Desktop Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-[#FAF9F5] border-r border-[#E2ECE4] flex flex-col justify-between
            transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-5 flex-1">
            {/* Brand Header */}
            <div className="flex items-center space-x-3 mb-6 px-1">
              <div className="w-9 h-9 rounded-xl bg-[#1B3E2F] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              </div>
              <div>
                <h1 className="font-serif font-bold text-[#1B3E2F] text-xl tracking-tight leading-none">ClinicOpsAgent</h1>
                <p className="text-[9px] text-[#5A6D62] font-semibold tracking-wider uppercase mt-1">Care Today, Healthier Tomorrow</p>
              </div>
            </div>

            {/* Clinic Location Chip */}
            <div className="mb-6">
              <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#1B3E2F] shadow-2xs">
                    <BuildingOffice2Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E2D25] leading-tight">{activeClinic}</p>
                    <p className="text-[10px] text-[#5A6D62]">Riverside • Outpatient OPD</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveClinic(activeClinic === 'Willow Family Clinic' ? 'City General Hospital' : 'Willow Family Clinic')}
                  className="p-1 hover:bg-white rounded-md transition-colors text-[#5A6D62]"
                  title="Switch Clinic Location"
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Role-Specific Navigation Groups */}
            <div className="space-y-6">
              {activeNavGroups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider px-3 mb-2">
                    {group.title}
                  </p>
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const active = isItemActive(item.path)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                            ${active 
                              ? 'bg-[#1B3E2F] text-white shadow-xs font-semibold' 
                              : 'text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F]'
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#5A6D62]'}`} />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}

              {/* Account Section in Sidebar */}
              <div>
                <p className="text-[10px] font-bold text-[#829489] uppercase tracking-wider px-3 mb-2">
                  ACCOUNT
                </p>
                <nav className="space-y-1">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false)
                      setIsProfileModalOpen(true)
                    }}
                    className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F] transition-colors text-left"
                  >
                    <IdentificationIcon className="w-4 h-4 text-[#5A6D62]" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Cards */}
          <div className="p-5 pt-0 space-y-3">
            {/* Help Card */}
            <div className="bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl p-4">
              <h4 className="font-serif font-bold text-sm text-[#1B3E2F] leading-tight">Clinic Care Support</h4>
              <p className="text-xs text-[#5A6D62] mt-1 leading-relaxed">Dedicated clinical operations and patient assistance.</p>
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="mt-3 flex items-center space-x-1.5 text-xs font-semibold text-[#1B3E2F] hover:underline"
              >
                <span>Help & support</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white border border-[#E2ECE4] rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-[#1E2D25]">System Status</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Live</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Desktop Navigation Header */}
          <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#E2ECE4] sticky top-0 z-30 shadow-2xs">
            {/* Search Input Bar */}
            <div className="relative w-96">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2 bg-[#F8FAF7] border border-[#E2ECE4] rounded-xl text-left text-sm text-[#5A6D62] hover:border-[#1B3E2F]/40 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#829489]" />
                  <span>Search {currentRole === 'patient' ? 'records, appointments, topics...' : 'patients, queue, schedule...'}</span>
                </div>
                <kbd className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-[#E2ECE4] rounded-md text-[#829489] shadow-2xs">⌘ K</kbd>
              </button>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-5">
              {/* Date & Authenticated Role Workspace Pill */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-medium text-[#5A6D62]">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-[11px] font-semibold text-[#1B3E2F] bg-[#EFF5EE] border border-[#E2ECE4] px-3 py-1 rounded-full uppercase tracking-wider">
                  {roleTitleDisplay}
                </span>
              </div>

              {/* Sound Announcement Toggle */}
              <button
                onClick={toggleSound}
                className="p-2 rounded-xl text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F] transition-colors relative"
                title={soundEnabled ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
              >
                {soundEnabled ? (
                  <SpeakerWaveIcon className="w-5 h-5 text-[#1B3E2F]" />
                ) : (
                  <SpeakerXMarkIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-xl text-[#5A6D62] hover:bg-[#EFF5EE] hover:text-[#1B3E2F] transition-colors relative"
                >
                  <BellIcon className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full"></span>
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2ECE4] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE4] mb-3">
                      <span className="text-xs font-bold text-[#1B3E2F] uppercase tracking-wider">Clinical Notifications</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">2 New</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-2 rounded-xl hover:bg-[#EFF5EE] transition-colors">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-xs font-bold text-[#1E2D25]">Queue Synchronization Active</p>
                          <p className="text-[11px] text-[#5A6D62] mt-0.5">Real-time room routing and sequential tokens operational.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-xl hover:bg-[#EFF5EE] transition-colors">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-xs font-bold text-[#1E2D25]">Ayushman Bharat Digital Health</p>
                          <p className="text-[11px] text-[#5A6D62] mt-0.5">ABHA ID linking verified with National Health Authority.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Authenticated User Chip */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-full hover:bg-[#EFF5EE] transition-all border border-transparent hover:border-[#E2ECE4]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1B3E2F] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                    {(user?.name || 'U').charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#1E2D25] leading-tight">{user?.name || 'Authorized User'}</p>
                    <p className="text-[10px] text-[#5A6D62] font-semibold">{userRoleBadge}</p>
                  </div>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-[#829489]" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2ECE4] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-[#E2ECE4] mb-2">
                      <p className="text-[10px] text-[#829489] uppercase tracking-wider font-semibold">Logged-in Account</p>
                      <p className="text-sm font-bold text-[#1B3E2F] mt-1">{user?.name}</p>
                      <p className="text-xs text-[#5A6D62]">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF5EE] text-[#1B3E2F] text-[11px] font-bold">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{userRoleBadge} Role</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          setIsProfileModalOpen(true)
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-semibold text-[#1E2D25] hover:bg-[#EFF5EE] rounded-lg transition-colors text-left"
                      >
                        <IdentificationIcon className="w-4 h-4 text-[#5A6D62]" />
                        <span>View My Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Dynamic Page Scrollable Body */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 bg-[#FAF9F5]">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary fallbackTitle="Module Temporarily Unavailable">
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Global Command / Search Palette Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2ECE4] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center px-4 py-3.5 border-b border-[#E2ECE4]">
              <MagnifyingGlassIcon className="w-5 h-5 text-[#829489] mr-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, doctors, ABHA ID, appointments, articles..."
                className="w-full text-sm outline-none text-[#1E2D25] placeholder-[#829489]"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-[#829489] hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto divide-y divide-[#E2ECE4]">
              {filteredSearchItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#829489]">
                  No matching patients, appointments, or articles found.
                </div>
              ) : (
                filteredSearchItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false)
                      navigate(item.path)
                    }}
                    className="p-3 hover:bg-[#EFF5EE] rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1B3E2F]">{item.title}</p>
                      <p className="text-xs text-[#5A6D62] mt-0.5">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#1B3E2F] bg-white border border-[#E2ECE4] px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="bg-[#FAF9F5] px-4 py-2 border-t border-[#E2ECE4] text-[11px] text-[#829489] flex justify-between">
              <span>Quick navigation</span>
              <span>Press ESC to exit</span>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-lg p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2ECE4] mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1B3E2F] text-white flex items-center justify-center font-serif font-bold text-lg">
                  {(user?.name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1B3E2F] leading-tight">{user?.name}</h3>
                  <p className="text-xs text-[#5A6D62]">{userRoleBadge} • {activeClinic}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF9F5] border border-[#E2ECE4] rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5A6D62]">Registered Email:</span>
                  <span className="font-bold text-[#1E2D25]">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6D62]">Contact Number:</span>
                  <span className="font-bold text-[#1E2D25]">{user?.phone || '+91 98201 45892'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6D62]">Account Role:</span>
                  <span className="font-bold text-[#1B3E2F] capitalize">{userRoleBadge}</span>
                </div>
              </div>

              {currentRole === 'patient' && (
                <div className="p-3 bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Ayushman Bharat ABHA ID:</span>
                    <span className="font-bold text-emerald-800">{user?.abhaId || currentPatient.abhaId || '91-4523-8890-1234'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Aadhaar (Masked):</span>
                    <span className="font-bold text-[#1E2D25]">XXXX-XXXX-4912</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Primary Physician:</span>
                    <span className="font-bold text-[#1E2D25]">Dr. Elena Cooper (Family Medicine)</span>
                  </div>
                </div>
              )}

              {currentRole === 'doctor' && (
                <div className="p-3 bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Specialization:</span>
                    <span className="font-bold text-[#1E2D25]">Family & General Medicine</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Assigned Consultation Room:</span>
                    <span className="font-bold text-emerald-800">Room 02 (Ground Floor)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Medical Council Reg:</span>
                    <span className="font-bold text-[#1E2D25]">MCI-MH-48201</span>
                  </div>
                </div>
              )}

              {currentRole === 'frontdesk' && (
                <div className="p-3 bg-[#EFF5EE] border border-[#E2ECE4] rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Desk Terminal:</span>
                    <span className="font-bold text-emerald-800">Terminal 01 • Main Reception</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6D62]">Staff Operator ID:</span>
                    <span className="font-bold text-[#1E2D25]">STF-MUM-104</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 bg-[#1B3E2F] text-white py-2.5 rounded-xl font-medium text-xs hover:bg-[#143024] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-medium text-xs transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2ECE4] w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-[#1B3E2F]" />
                <h3 className="font-serif font-bold text-lg text-[#1B3E2F]">ClinicOps Care Support</h3>
              </div>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#5A6D62] leading-relaxed mb-4">
              Need assistance navigating your healthcare workflows, token queue, or research summaries? Our reception desk and technical team are available 24/7.
            </p>
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-[#EFF5EE] rounded-xl text-xs">
                <p className="font-bold text-[#1B3E2F]">OPD Reception Helpline</p>
                <p className="text-[#5A6D62] mt-0.5">+91 (022) 2200-4567 • Ext 104 (Reception Desk)</p>
              </div>
              <div className="p-3 bg-[#EFF5EE] rounded-xl text-xs">
                <p className="font-bold text-[#1B3E2F]">ABHA & Government Healthcare Portal</p>
                <p className="text-[#5A6D62] mt-0.5">National Health Authority support: 1800-11-4477</p>
              </div>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full bg-[#1B3E2F] text-white py-2.5 rounded-xl font-medium hover:bg-[#143024] transition-colors"
            >
              Close & Return
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
