import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Login from './pages/Login'
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

function App() {
  return (
    <DataProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/front-desk" element={<FrontDesk />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/queue-management" element={<QueueManagement />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/travel-planner" element={<TravelPlanner />} />
          <Route path="/medical-research" element={<MedicalResearch />} />
          <Route path="/research-summary" element={<ResearchSummary />} />
          <Route path="/medical-videos" element={<MedicalVideos />} />
          <Route path="/health-games" element={<HealthGames />} />
          <Route path="/learning-progress" element={<LearningProgress />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Layout>
    </DataProvider>
  )
}

export default App
