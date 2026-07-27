import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SitePaused from "./SitePaused";
import AdminLogin from "./AdminLogin";
import Admin from "./Admin";
import ParentPortal from "./ParentPortal";
import ProtectedRoute from "./ProtectedRoute";
import PasswordGate from "./PasswordGate";

// ⚠️ SITE PAUSED — public pages (/, /register, /harmony, /schedule) show the
// renovation notice instead of the normal flow. Existing families/staff can
// still reach /login, /portal, and /admin directly.
// To restore the live site: swap these four routes back to WelcomePage,
// WildChildRegistration, HarmonyCoop, and ScheduleView (see git history for
// the previous version of this file).
//
// ⚠️ WHOLE SITE PASSWORD-GATED — PasswordGate wraps everything below,
// including /login, /portal, and /admin. Password lives in PasswordGate.jsx.
// This is a simple client-side gate (a deterrent, not real security — the
// password is visible in the browser's JS bundle to anyone who looks). To
// remove it later, delete the <PasswordGate> wrapper (keep the </PasswordGate>
// removed too) around <Routes>.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PasswordGate>
        <Routes>
          <Route path="/" element={<SitePaused />} />
          <Route path="/register" element={<SitePaused />} />
          <Route path="/harmony" element={<SitePaused />} />
          <Route path="/schedule" element={<SitePaused />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/portal" element={<ParentPortal />} />
        </Routes>
      </PasswordGate>
    </BrowserRouter>
  </StrictMode>
);

// Global reset
const style = document.createElement('style');
style.textContent = '* { margin: 0; padding: 0; box-sizing: border-box; } html, body, #root { margin: 0; padding: 0; }';
document.head.appendChild(style);
