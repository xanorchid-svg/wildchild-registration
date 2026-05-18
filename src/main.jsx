import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import WelcomePage              from './WelcomePage.jsx';
import WildChildRegistration    from './WildChildRegistration.jsx';
import AdminLogin               from './AdminLogin.jsx';
import Admin                    from './Admin.jsx';
import ParentPortal             from './ParentPortal.jsx';
import ScheduleView             from './ScheduleView.jsx';
import ProtectedRoute           from './ProtectedRoute.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Welcome / landing page */}
        <Route path="/"          element={<WelcomePage />} />

        {/* Registration form (was /) */}
        <Route path="/register"  element={<WildChildRegistration />} />

        {/* Auth */}
        <Route path="/login"     element={<AdminLogin />} />

        {/* Protected admin */}
        <Route path="/admin"     element={<ProtectedRoute><Admin /></ProtectedRoute>} />

        {/* Parent portal */}
        <Route path="/portal"    element={<ParentPortal />} />

        {/* Schedule */}
        <Route path="/schedule"  element={<ScheduleView />} />

        {/* Catch-all → welcome */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
