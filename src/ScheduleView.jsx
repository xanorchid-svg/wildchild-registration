import { useState, useEffect } from "react";
import logo from "./assets/logo1.svg";
import { supabase } from "./supabase";

export default function ScheduleView() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: staff } = await supabase.from("staff").select("id").eq("id", session.user.id).maybeSingle();
      if (staff) setIsAdmin(true);
    });
  }, []);

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f0e8", minHeight: "100vh" }}>
      <div style={{ background: "#4d5a2c", height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={logo} alt="Wild Child Nosara" style={{ height: 40 }} />
      </div>
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "#4d5a2c", marginBottom: 16 }}>Schedule</h2>
        <p style={{ color: "#666" }}>Schedule page is loading correctly.</p>
        <a href={isAdmin ? "/admin" : "/portal"} style={{ display: "inline-block", marginTop: 24, color: "#4d5a2c" }}>← Back</a>
      </div>
    </div>
  );
}
