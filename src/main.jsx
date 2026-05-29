import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import WildChildRegistration from "./WildChildRegistration";
import AdminLogin from "./AdminLogin";
import Admin from "./Admin";
import ParentPortal from "./ParentPortal";
import ScheduleView from "./ScheduleView";
import HarmonyCoop from "./HarmonyCoop";
import ProtectedRoute from "./ProtectedRoute";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/register" element={<WildChildRegistration />} />
        <Route path="/harmony" element={<HarmonyCoop />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/schedule" element={<ScheduleView />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/portal" element={<ParentPortal />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
