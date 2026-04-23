import { useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const OLIVE_DARK  = "#4d5a2c";
const NAVY        = "#0f1f5c";
const ORANGE      = "#c4682a";
const CREAM       = "#f5f0e8";
const CREAM_DARK  = "#e0d8c8";
const TEXT_DARK   = "#1a1a2e";
const TEXT_LIGHT  = "#7a7a9a";

// Shared header — same on all pages
const HEADER = {
  background: OLIVE_DARK,
  height: "90px",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const LOGO = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -40%)", // shift up to crop whitespace
  height: "180px",
  objectFit: "contain",
};

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
  const [mode, setMode]           = useState("login"); // login | signup
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [loading, setLoading]     = useState(false);

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

    // Check if staff
    const { data: staffRecord } = await supabase
      .from("staff")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (staffRecord) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/portal";
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: signupError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signupError) {
      setError(signupError.message);
      return;
    }
    setSuccess("Account created! Check your email to confirm, then sign in.");
    setMode("login");
    setPassword("");
    setConfirm("");
  };

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={HEADER}>
        <img src={logo} alt="Wild Child Nosara" style={LOGO} />
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 20px" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          <div style={{ textAlign:"center", marginBottom:"28px" }}>
            <h1 style={{ fontSize:"22px", fontWeight:400, color:TEXT_DARK, marginBottom:"6px" }}>
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p style={{ fontSize:"13px", color:TEXT_LIGHT, lineHeight:1.6 }}>
              {mode === "login"
                ? "Sign in to access your portal. Staff will be directed to the admin panel."
                : "Create your parent account to track enrollments and payments."}
            </p>
          </div>

          <div style={{ background:"#fff", borderRadius:"14px", padding:"28px", border:`1px solid ${CREAM_DARK}`, boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>

            {error && (
              <div style={{ background:"#fdecea", border:"1px solid #f5c6c6", borderRadius:"8px", padding:"11px 14px", marginBottom:"18px", fontSize:"13px", color:"#a32d2d" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background:"#eef4e8", border:"1px solid #b8d4a0", borderRadius:"8px", padding:"11px 14px", marginBottom:"18px", fontSize:"13px", color:"#3a6020" }}>
                {success}
              </div>
            )}

            <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />

              <label style={lbl}>Password</label>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />

              {mode === "signup" && <>
                <label style={lbl}>Confirm Password</label>
                <input style={inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" required />
              </>}

              <button type="submit" disabled={loading}
                style={{ width:"100%", background:loading?"#aaa":NAVY, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase", marginTop:"4px", transition:"background .2s" }}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div style={{ height:"1px", background:CREAM_DARK, margin:"22px 0" }}/>

            <p style={{ textAlign:"center", fontSize:"13px", color:TEXT_LIGHT }}>
              {mode === "login" ? (
                <>No account yet?{" "}
                  <button onClick={()=>{setMode("signup");setError(null);setSuccess(null);}}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Create one
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={()=>{setMode("login");setError(null);}}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Sign in
                  </button>
                </>
              )}
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
