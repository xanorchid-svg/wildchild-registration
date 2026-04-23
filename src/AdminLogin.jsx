import { useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const OLIVE_DARK  = "#4d5a2c";
const NAVY        = "#0f1f5c";
const ORANGE      = "#c4682a";
const CREAM       = "#f5f0e8";
const CREAM_DARK  = "#e0d8c8";
const TEXT_DARK   = "#1a1a2e";
const TEXT_MID    = "#3d3d5c";
const TEXT_LIGHT  = "#7a7a9a";

const inp = {
  width:"100%", padding:"12px 14px", border:`1px solid ${CREAM_DARK}`,
  borderRadius:"8px", fontSize:"15px", fontFamily:"Georgia,serif",
  background:"#fff", color:TEXT_DARK, outline:"none", boxSizing:"border-box", marginBottom:"16px"
};
const lbl = {
  display:"block", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase",
  color:TEXT_LIGHT, marginBottom:"6px", fontFamily:"Georgia,serif"
};

export default function AdminLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Check if staff first
    const { data: staffRecord } = await supabase
      .from("staff")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (staffRecord) {
      window.location.href = "/admin";
      return;
    }

    // Otherwise send to parent portal
    window.location.href = "/portal";
  };

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, height:"160px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
        <img src={logo} alt="Wild Child Nosara" style={{ height:"260px", objectFit:"contain" }} />
      </div>

      {/* Content */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          <div style={{ textAlign:"center", marginBottom:"32px" }}>
            <h1 style={{ fontSize:"24px", fontWeight:400, color:TEXT_DARK, marginBottom:"8px" }}>Welcome back</h1>
            <p style={{ fontSize:"14px", color:TEXT_LIGHT, lineHeight:1.6 }}>Sign in to access your portal.<br/>Staff will be directed to the admin panel.</p>
          </div>

          <div style={{ background:"#fff", borderRadius:"14px", padding:"32px", border:`1px solid ${CREAM_DARK}`, boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>

            {error && (
              <div style={{ background:"#fdecea", border:"1px solid #f5c6c6", borderRadius:"8px", padding:"12px 14px", marginBottom:"20px", fontSize:"13px", color:"#a32d2d" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />

              <label style={lbl}>Password</label>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />

              <button type="submit" disabled={loading}
                style={{ width:"100%", background:loading?"#aaa":NAVY, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase", marginTop:"8px", transition:"background .2s" }}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div style={{ height:"1px", background:CREAM_DARK, margin:"24px 0" }}/>

            <p style={{ textAlign:"center", fontSize:"13px", color:TEXT_LIGHT, lineHeight:1.6 }}>
              First time here?{" "}
              <a href="/" style={{ color:ORANGE, textDecoration:"none" }}>Enroll your child</a>
              {" "}— you'll be able to create an account after registration.
            </p>
          </div>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:TEXT_LIGHT }}>
            <a href="/" style={{ color:TEXT_LIGHT, textDecoration:"none" }}>← Back to registration</a>
          </p>
        </div>
      </div>
    </div>
  );
}
