import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const TEAL = "#3d7d8a";
const TEAL_DARK = "#2c5f6a";
const TEAL_LIGHT = "#e8f4f6";
const CREAM = "#f7f2e8";
const CREAM_DARK = "#e8dfc8";
const TEXT_DARK = "#1a2e32";
const TEXT_MID = "#3d5a5f";
const TEXT_LIGHT = "#6b8c91";
const GREEN = "#5a7a4a";
const SAND = "#c8a96e";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(mondayDate) {
  const mon = new Date(mondayDate);
  const fri = new Date(mondayDate);
  fri.setDate(fri.getDate() + 4);
  return `Week of ${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${fri.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function groupByWeek(registrations) {
  const groups = {};
  registrations.forEach(reg => {
    const days = reg.selected_days || [];
    if (days.length === 0) {
      const key = "unscheduled";
      if (!groups[key]) groups[key] = { label: "Unscheduled", monday: null, registrations: [] };
      groups[key].registrations.push(reg);
      return;
    }
    // Find all unique weeks this registration covers
    const weekKeys = new Set(days.map(dk => {
      const mon = getMonday(new Date(dk));
      return mon.toISOString().split("T")[0];
    }));
    weekKeys.forEach(wk => {
      if (!groups[wk]) groups[wk] = { label: weekLabel(wk), monday: new Date(wk), registrations: [] };
      if (!groups[wk].registrations.find(r => r.id === reg.id)) {
        groups[wk].registrations.push(reg);
      }
    });
  });
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return new Date(a) - new Date(b);
    })
    .map(([key, val]) => ({ key, ...val }));
}

function DetailModal({ reg, onClose }) {
  const days = reg.selected_days || [];
  const dayNames = days.map(dk =>
    new Date(dk).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  ).sort();

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"14px", padding:"28px", maxWidth:"520px", width:"100%", maxHeight:"85vh", overflowY:"auto", fontFamily:"Georgia,serif" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div>
            <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"4px" }}>{reg.program_name}</p>
            <h2 style={{ fontSize:"22px", fontWeight:400, color:TEXT_DARK, margin:0 }}>{reg.child_first_name} {reg.child_last_name}</h2>
            <p style={{ fontSize:"13px", color:TEXT_MID, marginTop:"3px" }}>Parent: {reg.parent_name}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:TEXT_LIGHT, lineHeight:1, padding:"0 0 0 12px" }}>✕</button>
        </div>

        <div style={{ height:"1px", background:CREAM_DARK, marginBottom:"20px" }}/>

        {/* Child info */}
        <Section title="Child">
          <Row label="Full Name" value={`${reg.child_first_name} ${reg.child_last_name}`} />
          <Row label="Date of Birth" value={reg.child_dob || "—"} />
          <Row label="Allergies / Notes" value={reg.child_allergies || "None"} />
        </Section>

        {/* Parent info */}
        <Section title="Parent / Guardian">
          <Row label="Name" value={reg.parent_name || "—"} />
          <Row label="Email" value={reg.parent_email || "—"} />
          <Row label="Phone" value={reg.parent_phone || "—"} />
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Row label="Program" value={reg.program_name || "—"} />
          <Row label="Lunch" value={reg.lunch ? "Yes — Organic Snack & Lunch" : "No"} />
          <div style={{ marginTop:"8px" }}>
            <p style={{ fontSize:"11px", letterSpacing:"0.5px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"6px" }}>Selected Days</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {dayNames.map(d => (
                <span key={d} style={{ background:TEAL_LIGHT, color:TEAL_DARK, fontSize:"12px", padding:"3px 10px", borderRadius:"20px" }}>{d}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <Row label="Tuition" value={`$${reg.subtotal_tuition ?? "—"}`} />
          <Row label="Lunch" value={reg.lunch ? `$${reg.subtotal_lunch ?? 0}` : "—"} />
          <Row label="Total" value={`$${reg.grand_total ?? "—"}`} bold />
          <Row label="Status" value={
            <span style={{ background: reg.payment_status === "paid" ? GREEN : SAND, color:"#fff", fontSize:"11px", padding:"2px 10px", borderRadius:"20px" }}>
              {reg.payment_status || "pending"}
            </span>
          } />
        </Section>

        {/* Waiver */}
        <Section title="Waiver">
          <Row label="Liability" value={reg.waiver_liability ? "✓ Agreed" : "Not signed"} />
          <Row label="Medical" value={reg.waiver_medical ? "✓ Agreed" : "Not signed"} />
          <Row label="Media" value={reg.waiver_media === "yes" ? "✓ Permission granted" : reg.waiver_media === "no" ? "✗ No permission" : "—"} />
          <Row label="Excursions" value={reg.waiver_excursion === "yes" ? "✓ Permission granted" : reg.waiver_excursion === "no" ? "✗ No permission" : "—"} />
          <Row label="Signature" value={reg.waiver_signature || "—"} />
          <Row label="Signed" value={formatDate(reg.waiver_date)} />
        </Section>

        <p style={{ fontSize:"11px", color:TEXT_LIGHT, marginTop:"16px", textAlign:"right" }}>
          Registered {formatDate(reg.created_at)}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:"20px" }}>
      <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"10px" }}>{title}</p>
      <div style={{ background:CREAM, borderRadius:"8px", padding:"12px 14px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}`, fontSize:"13px" }}>
      <span style={{ color:TEXT_LIGHT }}>{label}</span>
      <span style={{ color:TEXT_DARK, fontWeight:bold?500:400, textAlign:"right", maxWidth:"60%" }}>{value}</span>
    </div>
  );
}

export default function Admin() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { setError(error.message); }
      else { setRegistrations(data); }
      setLoading(false);
    }
    load();
  }, []);

  const toggleWeek = (key) => {
    setExpandedWeeks(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const weeks = groupByWeek(registrations);

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>

      {/* Header */}
      <div style={{ background:TEAL, padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"48px", objectFit:"contain" }} />
          <div>
            <p style={{ fontSize:"11px", letterSpacing:"2px", color:"rgba(255,255,255,0.65)", textTransform:"uppercase", margin:"0 0 2px" }}>Admin</p>
            <h1 style={{ fontSize:"20px", fontWeight:400, color:"#fff", margin:0 }}>Registrations</h1>
          </div>
        </div>
        <a href="/" style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", textDecoration:"none", letterSpacing:"0.5px" }}>← Registration Form</a>
      </div>

      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"32px 16px 60px" }}>

        {loading && (
          <div style={{ textAlign:"center", padding:"60px 0", color:TEXT_LIGHT, fontSize:"14px" }}>Loading registrations...</div>
        )}

        {error && (
          <div style={{ background:"#fdecea", border:"1px solid #f5c6c6", borderRadius:"10px", padding:"16px", color:"#a32d2d", fontSize:"14px" }}>
            Error loading registrations: {error}
          </div>
        )}

        {!loading && !error && registrations.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:TEXT_LIGHT }}>
            <p style={{ fontSize:"18px", marginBottom:"8px" }}>🌿</p>
            <p style={{ fontSize:"15px" }}>No registrations yet.</p>
          </div>
        )}

        {!loading && weeks.map(week => (
          <div key={week.key} style={{ marginBottom:"16px" }}>

            {/* Week header */}
            <div onClick={() => toggleWeek(week.key)}
              style={{ background:TEAL, borderRadius: expandedWeeks.has(week.key) ? "10px 10px 0 0" : "10px", padding:"14px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.75)", margin:"0 0 2px" }}>{week.label}</p>
                <p style={{ fontSize:"16px", color:"#fff", margin:0 }}>
                  {week.registrations.length} child{week.registrations.length !== 1 ? "ren" : ""}
                </p>
              </div>
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"18px" }}>
                {expandedWeeks.has(week.key) ? "▲" : "▼"}
              </span>
            </div>

            {/* Registrations for this week */}
            {expandedWeeks.has(week.key) && (
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
                {week.registrations.map((reg, i) => (
                  <div key={reg.id} onClick={() => setSelected(reg)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px",
                      borderBottom: i < week.registrations.length - 1 ? `1px solid ${CREAM_DARK}` : "none",
                      cursor:"pointer", transition:"background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = CREAM}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                      {/* Avatar */}
                      <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:TEAL_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", color:TEAL_DARK, fontWeight:500, flexShrink:0 }}>
                        {(reg.child_first_name?.[0] || "?")}{(reg.child_last_name?.[0] || "")}
                      </div>
                      <div>
                        <p style={{ fontSize:"15px", color:TEXT_DARK, margin:"0 0 2px" }}>
                          {reg.child_first_name || "—"} {reg.child_last_name || ""}
                        </p>
                        <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>
                          {reg.program_name || "—"} · {(reg.selected_days || []).filter(dk => {
                            const mon = getMonday(new Date(dk));
                            return mon.toISOString().split("T")[0] === week.key;
                          }).length} days
                          {reg.lunch ? " · 🥗 Lunch" : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:"14px", color:TEAL, margin:"0 0 2px" }}>${reg.grand_total ?? "—"}</p>
                      <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"20px", color:"#fff",
                        background: reg.payment_status === "paid" ? GREEN : SAND }}>
                        {reg.payment_status || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal reg={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
