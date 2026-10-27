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
import { DataProvider } from './context/DataContext'

/**
 * Normalizes user role string to 'patient' | 'doctor' | 'frontdesk'
 */
function getNormalizedRole(): 'patient' | 'doctor' | 'frontdesk' {
  const savedUser = localStorage.getItem('clinicops_user')
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser)
      const r = (parsed.role || 'patient').toLowerCase().replace('_', '')
      if (r.includes('doc')) return 'doctor'
      if (r.includes('front') || r.includes('recept')) return 'frontdesk'
      return 'patient'
    } catch (e) {
      return 'patient'
    }
  }
  return 'patient'
}

/**
 * Role-aware protection component.
 * Blocks unauthorized access across roles and redirects to user's assigned workspace.
 */
function RoleProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles?: Array<'patient' | 'doctor' | 'frontdesk'>
}) {
  const token = localStorage.getItem('clinicops_token')
  const savedUser = localStorage.getItem('clinicops_user')
  
  if (!token || !savedUser) {
    return <Navigate to="/login" replace />
  }

  const role = getNormalizedRole()

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the correct role dashboard
    if (role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />
    }
    if (role === 'frontdesk') {
      return <Navigate to="/frontdesk/dashboard" replace />
    }
    return <Navigate to="/patient/dashboard" replace />
  }
  
  return <>{children}</>
}

/**
 * Universal root and dashboard redirector.
 * Directs authenticated users to their specific workspace.
 */
function WorkspaceRedirect() {
  const token = localStorage.getItem('clinicops_token')
  const savedUser = localStorage.getItem('clinicops_user')
  if (!token || !savedUser) {
    return <Navigate to="/login" replace />
  }

  const role = getNormalizedRole()
  if (role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />
  }
  if (role === 'frontdesk') {
    return <Navigate to="/frontdesk/dashboard" replace />
  }
  return <Navigate to="/patient/dashboard" replace />
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
