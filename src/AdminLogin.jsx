import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const OLIVE_DARK  = "#4d5a2c";
const NAVY        = "#0f1f5c";
const ORANGE      = "#c4682a";
const CREAM       = "#f5f0e8";
const CREAM_DARK  = "#e0d8c8";
const TEXT_DARK   = "#1a1a2e";
const TEXT_LIGHT  = "#7a7a9a";
const GREEN       = "#5a7a3a";

const HEADER = {
  background: OLIVE_DARK, height: "90px", overflow: "hidden",
  position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
};
const LOGO = {
  position: "absolute", top: "50%", left: "50%",
  transform: "translate(-50%, -40%)", height: "180px", objectFit: "contain",
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
  // mode: "login" | "signup" | "forgot" | "reset"
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  // Signup-only fields
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [phone, setPhone]           = useState("");
  const [childNames, setChildNames] = useState([""]);

  // Forgot password field
  const [resetEmail, setResetEmail] = useState("");

  // New password fields (recovery mode)
  const [newPassword, setNewPassword]     = useState("");
  const [newConfirm, setNewConfirm]       = useState("");

  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detect Supabase password recovery token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("type=email_change")) {
      // Supabase has already parsed the token into the session automatically
      setMode("reset");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false); return;
    }
    const { data: staffRecord } = await supabase.from("staff").select("role").eq("id", data.user.id).single();
    window.location.href = staffRecord ? "/admin" : "/portal";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("Please enter your full name."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    const userId = signUpData.user?.id;

    if (userId) {
      await supabase.from("parent_profiles").upsert({
        id: userId,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const validChildren = childNames.filter(n => n.trim().length > 0);
      for (const name of validChildren) {
        const parts = name.trim().split(" ");
        const childFirst = parts[0] || name.trim();
        const childLast  = parts.slice(1).join(" ") || "";
        await supabase.from("children").insert({
          parent_id:  userId,
          first_name: childFirst,
          last_name:  childLast,
          total_weeks_enrolled: 0,
        });
      }
    }

    setLoading(false);
    setSuccess("Account created! You can now sign in.");
    setMode("login");
    setPassword(""); setConfirm("");
    setFirstName(""); setLastName(""); setPhone(""); setChildNames([""]);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message || "Something went wrong. Please try again.");
    } else {
      setSuccess("Check your email — we've sent a password reset link. It may take a minute to arrive.");
      setResetEmail("");
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== newConfirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message || "Could not update password. The reset link may have expired — please request a new one.");
    } else {
      setSuccess("Password updated! Signing you in…");
      // Clear the hash from the URL so it doesn't re-trigger recovery mode
      window.history.replaceState(null, "", window.location.pathname);
      setTimeout(() => { window.location.href = "/portal"; }, 1500);
    }
  };

  const addChild = () => {
    if (childNames.length < 5) setChildNames(prev => [...prev, ""]);
  };
  const updateChild = (i, val) => {
    setChildNames(prev => { const n = [...prev]; n[i] = val; return n; });
  };
  const removeChild = (i) => {
    setChildNames(prev => prev.filter((_, idx) => idx !== i));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`* { box-sizing: border-box; } input, button { font-family: Georgia, serif; -webkit-appearance: none; }`}</style>

      <div style={HEADER}>
        <img src={logo} alt="Wild Child Nosara" style={LOGO} />
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 20px" }}>
        <div style={{ width:"100%", maxWidth:"420px" }}>

          <div style={{ textAlign:"center", marginBottom:"28px" }}>
            <h1 style={{ fontSize:"22px", fontWeight:400, color:TEXT_DARK, marginBottom:"6px" }}>
              {mode === "login" ? "Welcome back"
                : mode === "signup" ? "Create a parent account"
                : mode === "forgot" ? "Reset your password"
                : "Choose a new password"}
            </h1>
            <p style={{ fontSize:"13px", color:TEXT_LIGHT, lineHeight:1.6 }}>
              {mode === "login"
                ? "Sign in to access your portal."
                : mode === "signup"
                ? "Set up your account to track enrollments and manage your children's schedule."
                : mode === "forgot"
                ? "Enter your email and we'll send you a reset link."
                : "Enter a new password for your account."}
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

            {/* ── Login ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
                <label style={lbl}>Password</label>
                <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />

                {/* Forgot password link — sits below password field */}
                <div style={{ textAlign:"right", marginTop:"-10px", marginBottom:"18px" }}>
                  <button type="button" onClick={() => { setResetEmail(email); switchMode("forgot"); }}
                    style={{ background:"none", border:"none", color:TEXT_LIGHT, fontSize:"12px", cursor:"pointer", fontFamily:"Georgia,serif", padding:0, textDecoration:"underline" }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#aaa":NAVY, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase" }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {/* ── Forgot Password ── */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword}>
                <label style={lbl}>Email address</label>
                <input style={inp} type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="your@email.com" required />
                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#aaa":OLIVE_DARK, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}

            {/* ── Set New Password (recovery mode) ── */}
            {mode === "reset" && (
              <form onSubmit={handleSetNewPassword}>
                <label style={lbl}>New Password</label>
                <input style={inp} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
                <label style={lbl}>Confirm New Password</label>
                <input style={inp} type="password" value={newConfirm} onChange={e=>setNewConfirm(e.target.value)} placeholder="••••••••" required />
                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#aaa":OLIVE_DARK, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase" }}>
                  {loading ? "Updating..." : "Set New Password"}
                </button>
              </form>
            )}

            {/* ── Signup ── */}
            {mode === "signup" && (
              <form onSubmit={handleSignup}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <label style={lbl}>First Name</label>
                    <input style={inp} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" required />
                  </div>
                  <div>
                    <label style={lbl}>Last Name</label>
                    <input style={inp} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" required />
                  </div>
                </div>

                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />

                <label style={lbl}>Phone / WhatsApp (optional)</label>
                <input style={inp} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+506 …" />

                <label style={lbl}>Password</label>
                <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required />

                <label style={lbl}>Confirm Password</label>
                <input style={inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" required />

                <div style={{ marginBottom:"16px" }}>
                  <label style={lbl}>Children's Names</label>
                  <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:"0 0 10px", lineHeight:1.5 }}>
                    Enter first and last name for each child (e.g. "Luna Smith").
                  </p>
                  {childNames.map((name, i) => (
                    <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
                      <input
                        style={{ ...inp, marginBottom:0, flex:1 }}
                        value={name}
                        onChange={e => updateChild(i, e.target.value)}
                        placeholder={`Child ${i+1} full name`}
                      />
                      {childNames.length > 1 && (
                        <button type="button" onClick={() => removeChild(i)}
                          style={{ background:"none", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"0 12px", color:"#c0392b", cursor:"pointer", fontSize:"16px", flexShrink:0 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {childNames.length < 5 && (
                    <button type="button" onClick={addChild}
                      style={{ background:"none", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"8px 14px", fontSize:"12px", color:TEXT_LIGHT, cursor:"pointer", fontFamily:"Georgia,serif", marginTop:"4px" }}>
                      + Add another child
                    </button>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#aaa":OLIVE_DARK, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase", marginTop:"4px" }}>
                  {loading ? "Creating account..." : "Create Parent Account"}
                </button>
              </form>
            )}

            <div style={{ height:"1px", background:CREAM_DARK, margin:"22px 0" }}/>

            {/* ── Mode switcher links ── */}
            <div style={{ textAlign:"center", fontSize:"13px", color:TEXT_LIGHT }}>
              {mode === "login" && (
                <>No account yet?{" "}
                  <button onClick={() => switchMode("signup")}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Create a parent account
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>Already have an account?{" "}
                  <button onClick={() => switchMode("login")}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Sign in
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <>Remember it?{" "}
                  <button onClick={() => switchMode("login")}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Back to sign in
                  </button>
                </>
              )}
              {mode === "reset" && (
                <span style={{ color:TEXT_LIGHT, fontSize:"12px" }}>
                  Enter your new password above and click Set New Password.
                </span>
              )}
            </div>
          </div>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:TEXT_LIGHT }}>
            <a href="/" style={{ color:TEXT_LIGHT, textDecoration:"none" }}>← Back to home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
