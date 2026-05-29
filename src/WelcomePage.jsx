import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import logoNew from "./assets/logo_new.png";
import groundsBg from "/grounds.jpg";

const OLIVE_DARK = "#4d5a2c";
const NAVY = "#0f1f5c";
const TEAL = "#427889";
const CREAM = "#f5f0e8";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: staff } = await supabase.from("staff").select("id").eq("id", session.user.id).maybeSingle();
        navigate(staff ? "/admin" : "/portal", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;

  const buttons = [
    { id: "enroll",  label: "ENROLL NOW",      sub: "Weekly programs",        bg: OLIVE_DARK, to: "/register" },
    { id: "harmony", label: "SATURDAY CO-OP",   sub: "Harmony Co-Op sessions", bg: TEAL,       to: "/harmony"  },
    { id: "login",   label: "LOG IN",           sub: "Parent portal",          bg: NAVY,       to: "/login"    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${groundsBg})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(to bottom, rgba(33,74,86,0.65) 0%, rgba(15,40,50,0.88) 100%)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px 0", boxSizing: "border-box" }}>
        <div style={{ width: 180, height: 180, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", marginBottom: 20, flexShrink: 0 }}>
          <img src={logoNew} alt="Wild Child Nosara" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <p style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 16, textAlign: "center", maxWidth: 300, lineHeight: 1.5, margin: "0 0 28px" }}>
          A nature-rooted place for children to grow, play, and belong
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
          {buttons.map((btn) => {
            const isHovered = hovered === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => navigate(btn.to)}
                onMouseEnter={() => setHovered(btn.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isHovered ? CREAM : btn.bg,
                  color: isHovered ? btn.bg : "#fff",
                  border: `2px solid ${btn.bg}`,
                  borderRadius: 8,
                  padding: "14px 20px",
                  cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.12em" }}>{btn.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3, letterSpacing: "0.05em" }}>{btn.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "20px 24px", color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.04em", fontFamily: "'Georgia', serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexShrink: 0 }}>
        <span>Nosara, Costa Rica · Wild Child Nosara</span>
        <a href="https://wildchildnosara.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Our Website ↗</a>
      </div>
    </div>
  );
}
