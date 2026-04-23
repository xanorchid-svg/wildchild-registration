import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

const OLIVE_DARK  = "#4d5a2c";
const OLIVE       = "#6b7a3f";
const OLIVE_LIGHT = "#eef1e6";
const NAVY        = "#0f1f5c";
const ORANGE      = "#c4682a";
const PINK        = "#d4867a";
const CREAM       = "#f5f0e8";
const CREAM_DARK  = "#e0d8c8";
const TEXT_DARK   = "#1a1a2e";
const TEXT_MID    = "#3d3d5c";
const TEXT_LIGHT  = "#7a7a9a";
const GREEN       = "#5a7a3a";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0,0,0,0);
  return d;
}

function weekLabel(days) {
  if (!days || days.length === 0) return "—";
  const sorted = [...days].sort();
  const first = new Date(sorted[0]);
  const mon = getMonday(first);
  const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
  return `${mon.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${fri.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
}

function StatusBadge({ status }) {
  const isPaid = status === "paid";
  return (
    <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", color:"#fff",
      background: isPaid ? GREEN : ORANGE, fontFamily:"Georgia,serif" }}>
      {isPaid ? "Paid" : "Pending"}
    </span>
  );
}

function EnrollmentCard({ reg, onEnrollMore }) {
  const [expanded, setExpanded] = useState(false);
  const days = reg.selected_days || [];
  const dayNames = days.map(dk =>
    new Date(dk).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})
  ).sort();

  // Group days by week
  const weekGroups = {};
  days.forEach(dk => {
    const mon = getMonday(new Date(dk));
    const wk = mon.toISOString().split("T")[0];
    if (!weekGroups[wk]) weekGroups[wk] = { monday:mon, days:[] };
    weekGroups[wk].days.push(dk);
  });
  const weeks = Object.values(weekGroups).sort((a,b)=>a.monday-b.monday);

  return (
    <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", marginBottom:"16px", overflow:"hidden" }}>
      {/* Card header */}
      <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"4px" }}>{reg.program_name}</p>
          <h3 style={{ fontSize:"18px", fontWeight:400, color:TEXT_DARK, margin:"0 0 4px" }}>
            {reg.child_first_name} {reg.child_last_name}
          </h3>
          <p style={{ fontSize:"13px", color:TEXT_LIGHT, margin:0 }}>
            {weeks.length} week{weeks.length!==1?"s":""} · {days.length} day{days.length!==1?"s":""}
            {reg.lunch ? " · Lunch included" : ""}
          </p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:"18px", color:OLIVE, margin:"0 0 6px" }}>${reg.grand_total ?? "—"}</p>
          <StatusBadge status={reg.payment_status} />
        </div>
      </div>

      {/* Weeks at a glance */}
      <div style={{ padding:"0 20px 14px" }}>
        {weeks.map(wk => (
          <div key={wk.monday.toISOString()} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderTop:`1px solid ${CREAM_DARK}`, color:TEXT_MID }}>
            <span>Week of {wk.monday.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            <span style={{ color:TEXT_LIGHT }}>{wk.days.length} day{wk.days.length!==1?"s":""}</span>
          </div>
        ))}
      </div>

      {/* Expand for details */}
      <div onClick={()=>setExpanded(!expanded)}
        style={{ padding:"12px 20px", borderTop:`1px solid ${CREAM_DARK}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", background:CREAM }}>
        <span style={{ fontSize:"12px", color:TEXT_LIGHT, letterSpacing:"0.5px" }}>
          {expanded ? "Hide details" : "View details"}
        </span>
        <span style={{ color:TEXT_LIGHT, fontSize:"14px" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"16px 20px", borderTop:`1px solid ${CREAM_DARK}` }}>
          <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"10px" }}>All Selected Days</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"14px" }}>
            {dayNames.map(d=>(
              <span key={d} style={{ background:OLIVE_LIGHT, color:OLIVE_DARK, fontSize:"12px", padding:"3px 10px", borderRadius:"20px" }}>{d}</span>
            ))}
          </div>
          <div style={{ fontSize:"13px", color:TEXT_MID }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${CREAM_DARK}` }}>
              <span>Registered</span><span>{formatDate(reg.created_at)}</span>
            </div>
            {reg.lunch && (
              <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${CREAM_DARK}` }}>
                <span>Lunch</span><span style={{ color:OLIVE }}>Organic Snack & Lunch included</span>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
              <span>Payment status</span><StatusBadge status={reg.payment_status} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParentPortal() {
  const [user, setUser]               = useState(null);
  const [registrations, setRegs]      = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeChild, setActiveChild] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      setUser(session.user);

      const { data } = await supabase
        .from("registrations")
        .select("*")
        .eq("parent_email", session.user.email)
        .order("created_at", { ascending:false });

      setRegs(data || []);

      // Set first child as active
      if (data && data.length > 0) {
        const firstChild = `${data[0].child_first_name} ${data[0].child_last_name}`;
        setActiveChild(firstChild);
      }
      setLoading(false);
    }
    load();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Get unique children
  const children = [...new Set(registrations.map(r => `${r.child_first_name} ${r.child_last_name}`))];

  // Filter registrations by active child
  const childRegs = registrations.filter(r =>
    `${r.child_first_name} ${r.child_last_name}` === activeChild
  );

  // Upcoming vs past
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = childRegs.filter(r => {
    const days = r.selected_days || [];
    return days.some(dk => new Date(dk) >= today);
  });
  const past = childRegs.filter(r => {
    const days = r.selected_days || [];
    return days.length > 0 && days.every(dk => new Date(dk) < today);
  });

  if (loading) {
    return (
      <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ color:OLIVE, fontSize:"14px" }}>Loading your portal...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, height:"90px", overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%, -40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }} />
        </div>
        <div style={{ width:"80px" }}/>
        <button onClick={signOut}
          style={{ position:"relative", zIndex:1, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", color:"rgba(255,255,255,0.9)", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", cursor:"pointer", fontFamily:"Georgia,serif" }}>
          Sign Out
        </button>
      </div>

      {/* Welcome bar */}
      <div style={{ background:NAVY, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:"13px", margin:0 }}>
          Welcome back, <strong style={{ color:"#fff" }}>{user?.email}</strong>
        </p>
        <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", whiteSpace:"nowrap" }}>
          + Enroll More Weeks
        </a>
      </div>

      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"28px 16px 80px" }}>

        {registrations.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <p style={{ fontSize:"18px", color:TEXT_MID, marginBottom:"8px" }}>No enrollments yet</p>
            <p style={{ fontSize:"14px", color:TEXT_LIGHT, marginBottom:"24px" }}>Ready to get started?</p>
            <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"12px 28px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif" }}>
              Enroll Now
            </a>
          </div>
        ) : (
          <>
            {/* Child tabs — show if multiple children */}
            {children.length > 1 && (
              <div style={{ display:"flex", gap:"8px", marginBottom:"24px", overflowX:"auto" }}>
                {children.map(name => (
                  <button key={name} onClick={()=>setActiveChild(name)}
                    style={{ background:activeChild===name?OLIVE:"#fff", color:activeChild===name?"#fff":TEXT_MID,
                      border:`1.5px solid ${activeChild===name?OLIVE:CREAM_DARK}`, borderRadius:"20px",
                      padding:"8px 18px", fontSize:"13px", fontFamily:"Georgia,serif", cursor:"pointer", whiteSpace:"nowrap" }}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* Upcoming enrollments */}
            {upcoming.length > 0 && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                  <h2 style={{ fontSize:"16px", fontWeight:400, color:TEXT_DARK, margin:0 }}>Upcoming</h2>
                  <a href="/" style={{ fontSize:"12px", color:ORANGE, textDecoration:"none", letterSpacing:"0.5px" }}>+ Add weeks</a>
                </div>
                {upcoming.map(r => <EnrollmentCard key={r.id} reg={r} />)}
              </>
            )}

            {/* Past enrollments */}
            {past.length > 0 && (
              <>
                <h2 style={{ fontSize:"16px", fontWeight:400, color:TEXT_LIGHT, margin:"28px 0 14px" }}>Past Enrollments</h2>
                {past.map(r => <EnrollmentCard key={r.id} reg={r} />)}
              </>
            )}

            {/* Quick enroll CTA */}
            <div style={{ background:NAVY, borderRadius:"12px", padding:"24px", textAlign:"center", marginTop:"32px" }}>
              <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"13px", marginBottom:"4px" }}>Want to enroll in more weeks?</p>
              <p style={{ color:"#fff", fontSize:"15px", marginBottom:"18px", lineHeight:1.5 }}>Keep the rhythm going — pick your next weeks now.</p>
              <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"12px 28px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif" }}>
                Enroll More Weeks
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
