import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import logoNew from "./assets/logo_new.png";
import groundsBg from "/grounds.jpg";

const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
const TEAL       = "#427889";
const CREAM      = "#f5f0e8";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: staff } = await supabase
          .from("staff").select("id").eq("id", session.user.id).maybeSingle();
        navigate(staff ? "/admin" : "/portal", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;

  const buttons = [
    { id: "enroll",  label: "Enroll Now",      sub: "Weekly programs",        bg: OLIVE_DARK, to: "/register" },
    { id: "harmony", label: "Saturday Co-Op",   sub: "Harmony Co-Op sessions", bg: TEAL,       to: "/harmony"  },
    { id: "login",   label: "Log In",           sub: "Parent portal",          bg: NAVY,       to: "/login"    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${groundsBg})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(to bottom, rgba(33,74,86,0.65) 0%, rgba(15,40,50,0.88) 100%)", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 24px", minHeight: "100vh", boxSizing: "border-box" }}>
        <div styl
