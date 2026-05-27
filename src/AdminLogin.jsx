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

function blankChild() { return ""; }

export default function AdminLogin() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  // Signup-only fields
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [phone, setPhone]           = useState("");
  const [childNames, setChildNames] = useState([""]); // array of child name strings

  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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

    // 1. Create auth user
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    const userId = signUpData.user?.id;

    if (userId) {
      // 2. Save parent profile
      await supabase.from("parent_profiles").upsert({
        id: userId,
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 3. Save children (filter out blank entries)
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
    setSuccess("Account created! Check your email to confirm, then sign in.");
    setMode("login");
    setPassword(""); setConfirm("");
    setFirstName(""); setLastName(""); setPhone(""); setChildNames([""]);
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
              {mode === "login" ? "Welcome back" : "Create a parent account"}
            </h1>
            <p style={{ fontSize:"13px", color:TEXT_LIGHT, lineHeight:1.6 }}>
              {mode === "login"
                ? "Sign in to access your portal."
                : "Set up your account to track enrollments and manage your children's schedule."}
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

            {mode === "login" ? (
              <form onSubmit={handleLogin}>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
                <label style={lbl}>Password</label>
                <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#aaa":NAVY, color:"#fff", border:"none", borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:loading?"not-allowed":"pointer", textTransform:"uppercase", marginTop:"4px" }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                {/* Parent name */}
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

                {/* Children */}
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

            <p style={{ textAlign:"center", fontSize:"13px", color:TEXT_LIGHT }}>
              {mode === "login" ? (
                <>No account yet?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Create a parent account
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(null); }}
                    style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif", padding:0 }}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:TEXT_LIGHT }}>
            <a href="/" style={{ color:TEXT_LIGHT, textDecoration:"none" }}>← Back to home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
