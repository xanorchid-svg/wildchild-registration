import { useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const TEAL = "#6b7a3f";
const TEAL_DARK = "#4d5a2c";
const CREAM = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEXT_DARK = "#1a1a2e";
const TEXT_LIGHT = "#7a7a9a";

const inp = {
  width: "100%", padding: "12px 14px", border: `1px solid ${CREAM_DARK}`,
  borderRadius: "8px", fontSize: "15px", fontFamily: "Georgia,serif",
  background: "#fff", color: TEXT_DARK, outline: "none", boxSizing: "border-box",
  marginBottom: "16px"
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

    // Check they are staff
    const { data: staffRecord } = await supabase
      .from("staff")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!staffRecord) {
      await supabase.auth.signOut();
      setError("You don't have staff access. Please contact your administrator.");
      setLoading(false);
      return;
    }

    // Redirect to admin
    window.location.href = "/admin";
  };

  return (
    <div style={{ fontFamily: "Georgia,serif", background: CREAM, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height: "80px", objectFit: "contain" }} />
          <p style={{ fontSize: "11px", letterSpacing: "2px", color: TEXT_LIGHT, textTransform: "uppercase", marginTop: "10px" }}>Staff Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: "14px", padding: "32px", border: `1px solid ${CREAM_DARK}` }}>
          <h2 style={{ fontSize: "20px", fontWeight: 400, color: TEXT_DARK, marginBottom: "24px", textAlign: "center" }}>Sign in</h2>

          {error && (
            <div style={{ background: "#fdecea", border: "1px solid #f5c6c6", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px", fontSize: "13px", color: "#a32d2d" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: TEXT_LIGHT, marginBottom: "6px" }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />

            <label style={{ display: "block", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: TEXT_LIGHT, marginBottom: "6px" }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: loading ? "#aaa" : TEAL, color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "14px", letterSpacing: "1px", fontFamily: "Georgia,serif", cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", marginTop: "8px", transition: "background .2s" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: TEXT_LIGHT }}>
          <a href="/" style={{ color: TEAL, textDecoration: "none" }}>← Back to registration</a>
        </p>
      </div>
    </div>
  );
}
