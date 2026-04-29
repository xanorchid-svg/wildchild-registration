import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WildChildRegistration from './WildChildRegistration.jsx'
import AdminLogin from './AdminLogin.jsx'
import Admin from './Admin.jsx'
import ParentPortal from './ParentPortal.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import ScheduleView from './ScheduleView.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WildChildRegistration />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/portal" element={<ParentPortal />} />
        <Route path="/schedule" element={<ScheduleView />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
