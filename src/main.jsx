import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import WildChildRegistration from "./WildChildRegistration";
import ScheduleView from "./ScheduleView";
import HarmonyCoop from "./HarmonyCoop";
import AdminLogin from "./AdminLogin";
import Admin from "./Admin";
import ParentPortal from "./ParentPortal";
import ProtectedRoute from "./ProtectedRoute";
import PasswordGate from "./PasswordGate";

// ⚠️ STAFF PREVIEW MODE (Nov 2026)
// The public sees only the renovation screen (PasswordGate). Staff who enter the
// password in "Staff access" (password lives in PasswordGate.jsx) see the full site.
// No database is connected right now, so sign-in, admin, portal and saving a
// registration will not work until a new Supabase project is set up.

function PreviewBanner() {
  return (
    <div style={{ position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      background: "#25318D", color: "#fff", font: "600 12px/1.3 system-ui, sans-serif", padding: "8px 14px",
      borderRadius: 999, boxShadow: "0 2px 10px rgba(0,0,0,.25)", pointerEvents: "none", whiteSpace: "nowrap" }}>
      Staff preview · the public sees the renovation page · forms don't save yet
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PasswordGate>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<WildChildRegistration />} />
          <Route path="/harmony" element={<HarmonyCoop />} />
          <Route path="/schedule" element={<ScheduleView />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/portal" element={<ParentPortal />} />
        </Routes>
        <PreviewBanner />
      </PasswordGate>
    </BrowserRouter>
  </StrictMode>
);

// Global reset
const style = document.createElement('style');
style.textContent = '* { margin: 0; padding: 0; box-sizing: border-box; } html, body, #root { margin: 0; padding: 0; }';
document.head.appendChild(style);
