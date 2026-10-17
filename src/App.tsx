import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
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
import { DataProvider } from './context/DataContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('clinicops_token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/front-desk"
          element={
            <ProtectedRoute>
              <Layout>
                <FrontDesk />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DoctorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue-management"
          element={
            <ProtectedRoute>
              <Layout>
                <QueueManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting-room"
          element={
            <ProtectedRoute>
              <Layout>
                <WaitingRoom />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/travel-planner"
          element={
            <ProtectedRoute>
              <Layout>
                <TravelPlanner />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-research"
          element={
            <ProtectedRoute>
              <Layout>
                <MedicalResearch />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/research-summary"
          element={
            <ProtectedRoute>
              <Layout>
                <ResearchSummary />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-videos"
          element={
            <ProtectedRoute>
              <Layout>
                <MedicalVideos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-games"
          element={
            <ProtectedRoute>
              <Layout>
                <HealthGames />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning-progress"
          element={
            <ProtectedRoute>
              <Layout>
                <LearningProgress />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </DataProvider>
  )
}

export default App
