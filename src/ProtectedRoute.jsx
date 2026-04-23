import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const TEAL = "#3d7d8a";
const CREAM = "#f7f2e8";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authorized | unauthorized

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("unauthorized");
        return;
      }

      // Verify they are staff
      const { data: staffRecord } = await supabase
        .from("staff")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (staffRecord) {
        setStatus("authorized");
      } else {
        await supabase.auth.signOut();
        setStatus("unauthorized");
      }
    }
    check();
  }, []);

  if (status === "loading") {
    return (
      <div style={{ fontFamily: "Georgia,serif", background: CREAM, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: TEAL, fontSize: "14px", letterSpacing: "1px" }}>Loading...</p>
      </div>
    );
  }

  if (status === "unauthorized") {
    window.location.href = "/login";
    return null;
  }

  return children;
}
