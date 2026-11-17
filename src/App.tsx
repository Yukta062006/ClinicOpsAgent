import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import FrontDesk from './pages/FrontDesk'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import QueueManagement from './pages/QueueManagement'
import WaitingRoom from './pages/WaitingRoom'
import TravelPlanner from './pages/TravelPlanner'
import MedicalResearch from './pages/MedicalResearch'
import ResearchSummary from './pages/ResearchSummary'
import MedicalVideos from './pages/MedicalVideos'
import HealthGames from './pages/HealthGames'
import LearningProgress from './pages/LearningProgress'
import DailyZipChallenge from './pages/DailyZipChallenge'
import { DataProvider, useData } from './context/DataContext'

type WorkspaceRole = 'patient' | 'doctor' | 'frontdesk'

/**
 * Normalizes the server-issued role string to the workspace key.
 */
function getWorkspaceRole(user: any): WorkspaceRole {
  const raw = String(user?.role || 'patient').toLowerCase().replace(/[_\s-]/g, '')
  if (raw.includes('doc')) return 'doctor'
  if (raw.includes('front') || raw.includes('recept')) return 'frontdesk'
  return 'patient'
}

function workspacePath(role: WorkspaceRole): string {
  if (role === 'doctor') return '/doctor/dashboard'
  if (role === 'frontdesk') return '/frontdesk/dashboard'
  return '/patient/dashboard'
}

function StartupScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8F4] p-6">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-[#1B3E2F] border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-[#1B3E2F]">{message}</p>
      </div>
    </div>
  )
}

function ServerUnavailable({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8F4] p-6">
      <div className="w-full max-w-md rounded-3xl border border-[#D5E4D8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBE9E7] text-[#B3261E]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V8h2v5z" />
          </svg>
        </div>
        <h1 className="font-serif text-xl font-bold text-[#1B3E2F]">ClinicOps server unavailable</h1>
        <p className="mt-2 text-xs leading-relaxed text-[#5A6D62]">
          {message || 'The ClinicOps API could not be reached, so your session cannot be verified.'}
        </p>
        <p className="mt-3 rounded-xl bg-[#EFF5EE] p-3 font-mono text-[11px] text-[#3B5347]">
          Start the backend with: npm run dev
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 w-full rounded-xl bg-[#1B3E2F] py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#143024]"
        >
          Retry connection
        </button>
      </div>
    </div>
  )
}

/**
 * Session + role gate for every workspace route. The session is validated
 * against the backend before any workspace is rendered.
 */
function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: WorkspaceRole[]
}) {
  const { user, authStatus, authError, retrySessionCheck } = useData()

  if (authStatus === 'loading') return <StartupScreen message="Verifying your session…" />
  if (authStatus === 'anonymous') return <Navigate to="/login" replace />
  if (authStatus === 'unreachable') return <ServerUnavailable message={authError} onRetry={retrySessionCheck} />

  const role = getWorkspaceRole(user)

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={workspacePath(role)} replace />
  }

  return <>{children}</>
}

/**
 * Universal root and dashboard redirector.
 * Directs authenticated users to their specific workspace.
 */
function WorkspaceRedirect() {
  const { authStatus, authError, user, retrySessionCheck } = useData()

  if (authStatus === 'loading') return <StartupScreen message="Opening your workspace…" />
  if (authStatus === 'anonymous') return <Navigate to="/login" replace />
  if (authStatus === 'unreachable') return <ServerUnavailable message={authError} onRetry={retrySessionCheck} />

  return <Navigate to={workspacePath(getWorkspaceRole(user))} replace />
}

function App() {
  return (
    <DataProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Root and /dashboard dynamic redirect */}
        <Route path="/" element={<WorkspaceRedirect />} />
        <Route path="/dashboard" element={<WorkspaceRedirect />} />

        {/* ========================================================= */}
        {/* 1. FRONT DESK WORKSPACE (frontdesk only)                 */}
        {/* ========================================================= */}
        <Route
          path="/frontdesk"
          element={
            <RoleProtectedRoute allowedRoles={['frontdesk']}>
              <Navigate to="/frontdesk/dashboard" replace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/frontdesk/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['frontdesk']}>
              <Layout>
                <FrontDesk />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/front-desk"
          element={
            <RoleProtectedRoute allowedRoles={['frontdesk']}>
              <Layout>
                <FrontDesk />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/front-desk/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['frontdesk']}>
              <Layout>
                <FrontDesk />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* ========================================================= */}
        {/* 2. DOCTOR WORKSPACE (doctor only)                        */}
        {/* ========================================================= */}
        <Route
          path="/doctor"
          element={
            <RoleProtectedRoute allowedRoles={['doctor']}>
              <Navigate to="/doctor/dashboard" replace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['doctor']}>
              <Layout>
                <DoctorDashboard />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/doctor-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['doctor']}>
              <Layout>
                <DoctorDashboard />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* ========================================================= */}
        {/* 3. PATIENT WORKSPACE (patient only)                      */}
        {/* ========================================================= */}
        <Route
          path="/patient"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Navigate to="/patient/dashboard" replace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <PatientDashboard />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <PatientDashboard />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/travel-planner"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <TravelPlanner />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/travel-planner"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <TravelPlanner />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/medical-research"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <MedicalResearch />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/medical-research"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <MedicalResearch />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/research-summary"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <ResearchSummary />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/research-summary"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <ResearchSummary />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/medical-videos"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <MedicalVideos />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/medical-videos"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <MedicalVideos />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/health-games"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <HealthGames />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/health-games"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <HealthGames />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/learning-progress"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <LearningProgress />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/learning-progress"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <LearningProgress />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/daily-zip-challenge"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <DailyZipChallenge />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/patient/daily-zip-challenge"
          element={
            <RoleProtectedRoute allowedRoles={['patient']}>
              <Layout>
                <DailyZipChallenge />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* ========================================================= */}
        {/* 4. SHARED OPERATIONAL & DISPLAY WORKSPACES                */}
        {/* ========================================================= */}
        {/* Queue Management: Front Desk and Doctor */}
        <Route
          path="/queue-management"
          element={
            <RoleProtectedRoute allowedRoles={['frontdesk', 'doctor']}>
              <Layout>
                <QueueManagement />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* Waiting Room Display: All authenticated roles */}
        <Route
          path="/waiting-room"
          element={
            <RoleProtectedRoute allowedRoles={['patient', 'frontdesk', 'doctor']}>
              <Layout>
                <WaitingRoom />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* Catch-all route -> auto-redirect */}
        <Route path="*" element={<WorkspaceRedirect />} />
      </Routes>
    </DataProvider>
  )
}

export default App
