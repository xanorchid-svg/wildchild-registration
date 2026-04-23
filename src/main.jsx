import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import WildChildRegistration from './WildChildRegistration'
import Admin from './Admin'
import AdminLogin from './AdminLogin'
import ProtectedRoute from './ProtectedRoute'
import ParentPortal from './ParentPortal'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WildChildRegistration />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/portal" element={<ParentPortal />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
